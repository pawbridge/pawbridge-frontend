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
const { useAuthStore, getAuthSessionVersion, readPersistedAccessToken } = await import('../src/store/authStore.ts');
const { queryClient } = await import('../src/lib/queryClient.ts');
// 캐시 수명 타이머는 검사 대상이 아니므로 Node 프로세스를 붙잡지 않게 한다.
queryClient.setDefaultOptions({ ...queryClient.getDefaultOptions(), queries: { ...queryClient.getDefaultOptions().queries, gcTime: Infinity } });
const user = (id: number): User => ({ id, name: `회원${id}`, email: `member${id}@example.invalid`, role: 'ROLE_USER', createdAt: '2026-09-21' });
const login = (id: number) => useAuthStore.getState().setAuth(user(id), `mock-${id}`);

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
  useAuthStore.getState().setAuth({ ...user(101), name: '변경 이름' }, 'mock-101');
  assert.deepEqual(queryClient.getQueryData(['cart', 101]), ['A의 상품']);
  assert.equal(getAuthSessionVersion(), version);
});

test('같은 계정이라도 토큰 또는 역할이 바뀌면 기존 세션 캐시를 제거한다', () => {
  login(101);
  queryClient.setQueryData(['cart', 101], ['A의 상품']);
  useAuthStore.getState().setAuth(user(101), 'mock-new-token');
  assert.equal(queryClient.getQueryData(['cart', 101]), undefined);
  queryClient.setQueryData(['myInfo', 101], user(101));
  useAuthStore.getState().setAuth({ ...user(101), role: 'ROLE_ADMIN' }, 'mock-new-token');
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

// 서명은 검사하지 않으므로 형식만 맞춘 합성 토큰을 만든다.
const syntheticToken = (userId: number, role: string, label: string) => [
  Buffer.from('{"alg":"none"}').toString('base64url'),
  Buffer.from(JSON.stringify({ userId, role, sub: `member${userId}@example.invalid`, name: label, exp: 2_000_000_000 })).toString('base64url'),
  'synthetic',
].join('.');

test('같은 회원의 토큰 재발급은 세션 버전과 캐시를 유지하고 저장된 토큰만 바꾼다', () => {
  login(101);
  queryClient.setQueryData(['cart', 101], ['A의 상품']);
  const version = getAuthSessionVersion();
  const refreshedToken = syntheticToken(101, 'ROLE_USER', '재발급');
  useAuthStore.getState().setAccessToken(refreshedToken);
  assert.equal(getAuthSessionVersion(), version);
  assert.deepEqual(queryClient.getQueryData(['cart', 101]), ['A의 상품']);
  assert.equal(useAuthStore.getState().accessToken, refreshedToken);
  // 기존 회원 정보(이름 등)는 토큰 값으로 덮어쓰지 않는다.
  assert.equal(useAuthStore.getState().user?.name, '회원101');
  assert.equal(readPersistedAccessToken(), refreshedToken);
});

test('재발급 토큰의 회원이나 역할이 다르면 새 세션으로 바꾸고 이전 캐시를 버린다', () => {
  login(101);
  queryClient.setQueryData(['cart', 101], ['A의 상품']);
  const version = getAuthSessionVersion();
  useAuthStore.getState().setAccessToken(syntheticToken(202, 'ROLE_USER', '다른 회원'));
  assert.ok(getAuthSessionVersion() > version);
  assert.equal(queryClient.getQueryData(['cart', 101]), undefined);
  assert.equal(useAuthStore.getState().user?.id, 202);
  assert.equal(useAuthStore.getState().user?.name, '다른 회원');

  const roleVersion = getAuthSessionVersion();
  useAuthStore.getState().setAccessToken(syntheticToken(202, 'ROLE_SHELTER', '다른 회원'));
  assert.ok(getAuthSessionVersion() > roleVersion);
  assert.equal(useAuthStore.getState().user?.role, 'ROLE_SHELTER');
});

test('브라우저 저장소에 Refresh Token을 저장하지 않고 이전 버전의 값은 읽을 때 지운다', async () => {
  login(101);
  const persisted = JSON.parse(values.get('auth-storage')!);
  assert.equal('refreshToken' in persisted.state, false);

  values.set('auth-storage', JSON.stringify({
    state: { user: user(303), accessToken: 'legacy-access', refreshToken: 'legacy-refresh' },
    version: 0,
  }));
  // 저장소를 처음 읽는 새 탭을 재현하려고 모듈을 따로 불러온다.
  const { useAuthStore: freshTabStore } = await import('../src/store/authStore.ts?legacy-storage');
  assert.equal(freshTabStore.getState().user?.id, 303);
  assert.equal(freshTabStore.getState().accessToken, 'legacy-access');
  assert.equal('refreshToken' in freshTabStore.getState(), false);
  const migrated = JSON.parse(values.get('auth-storage')!);
  assert.equal(migrated.version, 1);
  assert.equal('refreshToken' in migrated.state, false);
});
