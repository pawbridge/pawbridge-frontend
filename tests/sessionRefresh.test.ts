import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionRefresher, type RefreshLockManager } from '../src/api/sessionRefresh.ts';
import {
  isAccessTokenExpiringWithin,
  readAccessTokenExpiresAt,
  readUserFromAccessToken,
} from '../src/lib/accessToken.ts';

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

// 서명은 검사하지 않으므로 형식만 맞춘 합성 토큰을 만든다.
function syntheticToken(payload: Record<string, unknown>): string {
  return `${encodeBase64Url('{"alg":"none"}')}.${encodeBase64Url(JSON.stringify(payload))}.synthetic`;
}

function tokenExpiringIn(seconds: number, label: string): string {
  return syntheticToken({ userId: 7, role: 'ROLE_USER', label, exp: Math.floor(Date.now() / 1000) + seconds });
}

// 탭 사이에서 공유되는 Web Lock을 흉내 낸다. 먼저 요청한 쪽이 끝나야 다음 쪽이 실행된다.
function createSharedLock(): RefreshLockManager & { requestedNames: string[] } {
  let tail: Promise<unknown> = Promise.resolve();
  const requestedNames: string[] = [];
  return {
    requestedNames,
    request<T>(name: string, callback: () => Promise<T>): Promise<T> {
      requestedNames.push(name);
      const result = tail.then(callback);
      tail = result.catch(() => undefined);
      return result;
    },
  };
}

test('같은 탭의 동시 재발급은 서버 요청 하나를 공유하고 끝나면 다시 요청할 수 있다', async () => {
  let serverCalls = 0;
  let finishServerCall!: (token: string) => void;
  const refresh = createSessionRefresher({
    requestAccessToken: () => {
      serverCalls += 1;
      return new Promise<string>((resolve) => {
        finishServerCall = resolve;
      });
    },
    readStoredAccessToken: () => null,
    saveAccessToken: () => undefined,
    getLockManager: () => undefined,
  });

  const first = refresh('expired-token');
  const second = refresh('expired-token');
  assert.equal(first, second);
  await Promise.resolve();
  finishServerCall('fresh-token');
  assert.deepEqual(await Promise.all([first, second]), ['fresh-token', 'fresh-token']);
  assert.equal(serverCalls, 1);

  const third = refresh('expired-token');
  await Promise.resolve();
  finishServerCall('another-fresh-token');
  assert.equal(await third, 'another-fresh-token');
  assert.equal(serverCalls, 2);
});

test('실패한 재발급은 공유 요청을 비워 다음 시도에서 다시 서버에 요청한다', async () => {
  let serverCalls = 0;
  const refresh = createSessionRefresher({
    requestAccessToken: async () => {
      serverCalls += 1;
      if (serverCalls === 1) {
        throw new Error('401');
      }
      return 'fresh-token';
    },
    readStoredAccessToken: () => null,
    saveAccessToken: () => undefined,
    getLockManager: () => undefined,
  });

  await assert.rejects(refresh('expired-token'));
  assert.equal(await refresh('expired-token'), 'fresh-token');
  assert.equal(serverCalls, 2);
});

test('잠금을 얻은 뒤 다른 탭이 저장한 유효한 토큰이 있으면 서버에 요청하지 않는다', async () => {
  const lock = createSharedLock();
  const refreshedElsewhere = tokenExpiringIn(600, 'other-tab');
  let serverCalls = 0;
  const refresh = createSessionRefresher({
    requestAccessToken: async () => {
      serverCalls += 1;
      return 'server-token';
    },
    readStoredAccessToken: () => refreshedElsewhere,
    saveAccessToken: () => undefined,
    getLockManager: () => lock,
  });

  assert.equal(await refresh(tokenExpiringIn(-10, 'failed')), refreshedElsewhere);
  assert.equal(serverCalls, 0);
  assert.deepEqual(lock.requestedNames, ['pawbridge-auth-refresh']);
});

test('저장된 토큰이 실패한 토큰과 같거나 곧 만료되면 서버에 요청한다', async () => {
  const failedToken = tokenExpiringIn(600, 'failed');
  const almostExpiredToken = tokenExpiringIn(5, 'almost-expired');
  let storedToken = failedToken;
  let serverCalls = 0;
  const refresh = createSessionRefresher({
    requestAccessToken: async () => {
      serverCalls += 1;
      return `server-token-${serverCalls}`;
    },
    readStoredAccessToken: () => storedToken,
    saveAccessToken: () => undefined,
    getLockManager: () => createSharedLock(),
  });

  assert.equal(await refresh(failedToken), 'server-token-1');
  storedToken = almostExpiredToken;
  assert.equal(await refresh(failedToken), 'server-token-2');
  storedToken = 'not-a-jwt';
  assert.equal(await refresh(failedToken), 'server-token-3');
});

test('두 탭이 동시에 재발급하면 잠금 뒤의 탭은 먼저 받은 토큰을 다시 읽고 서버에 요청하지 않는다', async () => {
  const lock = createSharedLock();
  const expiredToken = tokenExpiringIn(-10, 'expired');
  const rotatedToken = tokenExpiringIn(600, 'rotated');
  let sharedStorageToken: string | null = expiredToken;
  let serverCalls = 0;
  const createTab = () => createSessionRefresher({
    requestAccessToken: async () => {
      serverCalls += 1;
      return rotatedToken;
    },
    readStoredAccessToken: () => sharedStorageToken,
    // 잠금 안에서 저장해야 다음 탭이 새 토큰을 읽는다.
    saveAccessToken: (accessToken: string) => {
      sharedStorageToken = accessToken;
    },
    getLockManager: () => lock,
  });
  const firstTab = createTab();
  const secondTab = createTab();

  const results = await Promise.all([firstTab(expiredToken), secondTab(expiredToken)]);
  assert.deepEqual(results, [rotatedToken, rotatedToken]);
  assert.equal(serverCalls, 1);
});

test('Access Token에서 base64url로 인코딩된 한글 이름과 만료 시각을 읽는다', () => {
  // '+'나 '/'가 base64url에서 '-'·'_'로 바뀌는 문자열도 해석해야 한다.
  const name = '보호소 담당자 ?>?>';
  const token = syntheticToken({ userId: 15, sub: 'member@example.invalid', name, role: 'ROLE_SHELTER', careRegNo: 'C-1', exp: 2_000_000_000 });
  assert.match(token.split('.')[1], /[-_]/);
  const user = readUserFromAccessToken(token);
  assert.equal(user?.id, 15);
  assert.equal(user?.name, name);
  assert.equal(user?.email, 'member@example.invalid');
  assert.equal(user?.role, 'ROLE_SHELTER');
  assert.equal(user?.careRegNo, 'C-1');
  assert.equal(readAccessTokenExpiresAt(token), 2_000_000_000_000);
});

test('형식이 맞지 않거나 만료 시각이 없는 토큰은 만료로 단정하지 않는다', () => {
  assert.equal(readUserFromAccessToken('not-a-jwt'), null);
  assert.equal(readUserFromAccessToken(syntheticToken({ sub: 'missing-user-id' })), null);
  assert.equal(isAccessTokenExpiringWithin('test-only-token', 60_000), false);
  assert.equal(isAccessTokenExpiringWithin(syntheticToken({ userId: 1 }), 60_000), false);
  assert.equal(isAccessTokenExpiringWithin(tokenExpiringIn(30, 'soon'), 60_000), true);
  assert.equal(isAccessTokenExpiringWithin(tokenExpiringIn(600, 'later'), 60_000), false);
});
