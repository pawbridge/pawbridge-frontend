import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { isCancelledError } from '@tanstack/react-query';
import type { User } from '../src/types/user.types.ts';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
}, configurable: true });
const { useAuthStore, getAuthSessionVersion } = await import('../src/store/authStore.ts');
const { queryClient } = await import('../src/lib/queryClient.ts');
// 캐시 수명 타이머는 검사 대상이 아니므로 Node 프로세스를 붙잡지 않게 한다.
queryClient.setDefaultOptions({ ...queryClient.getDefaultOptions(), queries: { ...queryClient.getDefaultOptions().queries, gcTime: Infinity } });
const user = (id: number): User => ({ id, name: `회원${id}`, email: `member${id}@example.invalid`, role: 'ROLE_USER', createdAt: '2026-09-21' });
const login = (id: number) => useAuthStore.getState().setAuth(user(id), `mock-${id}`, 'mock-refresh');

afterEach(() => { useAuthStore.getState().clearAuth(); values.clear(); });

for (const action of ['logout', 'clearAuth'] as const) {
  test(`${action}: 인증과 이전 개인 캐시를 함께 제거한다`, () => {
    login(101);
    queryClient.setQueryData(['favoriteAnimals', 101], ['A의 동물']);
    queryClient.setQueryData(['cart'], ['이전 형식의 개인 캐시']);
    useAuthStore.getState()[action]();
    assert.equal(useAuthStore.getState().user, null);
    assert.equal(useAuthStore.getState().accessToken, null);
    assert.equal(queryClient.getQueryCache().getAll().length, 0);
    assert.equal(JSON.parse(values.get('auth-storage')!).state.user, null);
  });
}

test('직접 계정 변경 시 기존 캐시를 제거하고 새 계정으로 저장한다', () => {
  login(101);
  queryClient.setQueryData(['cart', 101], ['A의 상품']);
  queryClient.setQueryData(['animals'], ['공개 목록']);
  const version = getAuthSessionVersion();
  login(202);
  assert.equal(useAuthStore.getState().user?.id, 202);
  assert.equal(queryClient.getQueryCache().getAll().length, 0);
  assert.ok(getAuthSessionVersion() > version);
});

test('같은 세션의 프로필 변경과 인증 재설정은 정상 캐시를 유지한다', () => {
  login(101);
  queryClient.setQueryData(['cart', 101], ['A의 상품']);
  const version = getAuthSessionVersion();
  useAuthStore.getState().updateUser({ name: '변경 이름' });
  useAuthStore.getState().setAuth({ ...user(101), name: '변경 이름' }, 'mock-101', 'mock-refresh');
  assert.deepEqual(queryClient.getQueryData(['cart', 101]), ['A의 상품']);
  assert.equal(getAuthSessionVersion(), version);
});

test('같은 계정이라도 토큰 또는 역할이 바뀌면 기존 세션 캐시를 제거한다', () => {
  login(101);
  queryClient.setQueryData(['cart', 101], ['A의 상품']);
  useAuthStore.getState().setAuth(user(101), 'mock-new-token', 'mock-refresh');
  assert.equal(queryClient.getQueryData(['cart', 101]), undefined);
  queryClient.setQueryData(['myInfo', 101], user(101));
  useAuthStore.getState().setAuth({ ...user(101), role: 'ROLE_ADMIN' }, 'mock-new-token', 'mock-refresh');
  assert.equal(queryClient.getQueryData(['myInfo', 101]), undefined);
});

test('이전 계정의 진행 중 조회를 취소하고 늦은 결과가 캐시를 다시 채우지 못하게 한다', async () => {
  login(101);
  let finish!: (value: string[]) => void;
  let signal!: AbortSignal;
  const pending = queryClient.fetchQuery({ queryKey: ['favoriteAnimals', 101], queryFn: context => {
    signal = context.signal;
    return new Promise<string[]>(resolve => { finish = resolve; });
  } });
  const rejected = assert.rejects(pending, isCancelledError);
  useAuthStore.getState().logout();
  login(202);
  queryClient.setQueryData(['favoriteAnimals', 202], ['B의 동물']);
  assert.equal(signal.aborted, true);
  finish(['A의 늦은 동물']);
  await rejected;
  assert.equal(queryClient.getQueryData(['favoriteAnimals', 101]), undefined);
  assert.deepEqual(queryClient.getQueryData(['favoriteAnimals', 202]), ['B의 동물']);
});
