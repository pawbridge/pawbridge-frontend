import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { QueryClient } from '@tanstack/react-query';
import ts from 'typescript';

// Execute the real API module. Only HTTP and the auth-session boundary are synthetic.
const compiled = ts.transpileModule(readFileSync(new URL('../src/api/privateNotes.api.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture(http = { put: async () => {}, delete: async () => {} }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const auth = { session: 7 };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(path) {
      if (path === './client') return { default: http };
      if (path === '../lib/queryClient') return { queryClient };
      if (path === '../store/authStore') return { getAuthSessionVersion: () => auth.session };
      throw new Error(`Unexpected dependency: ${path}`);
    },
  });
  return { api: exports, queryClient, auth };
}

const key = (ids, session = 7) => ['blocked-authors', 1, session, ids];
const cached = (client, queryKey) => Array.from(client.getQueryData(queryKey));

test('successful block updates every matching inactive batch, but not unrelated/session caches', async () => {
  const { api, queryClient } = fixture();
  queryClient.setQueryData(key([2, 3]), [3]);
  queryClient.setQueryData(key([2]), []);
  queryClient.setQueryData(key([4]), []);
  queryClient.setQueryData(key([2], 6), []);
  await api.blockNoteMember(2);
  assert.deepEqual(cached(queryClient, key([2, 3])), [2, 3]);
  assert.deepEqual(cached(queryClient, key([2])), [2]);
  assert.deepEqual(cached(queryClient, key([4])), []);
  assert.deepEqual(cached(queryClient, key([2], 6)), []);
  assert.equal(queryClient.getQueryState(key([2])).isInvalidated, true);
  await api.blockNoteMember(2);
  assert.deepEqual(cached(queryClient, key([2])), [2]);
});

test('successful unblock removes only that member and does not create an empty cache', async () => {
  const { api, queryClient } = fixture();
  queryClient.setQueryData(key([2, 3]), [2, 3]);
  await api.unblockNoteMember(2);
  assert.deepEqual(cached(queryClient, key([2, 3])), [3]);
  assert.equal(queryClient.getQueryData(key([2])), undefined);
});

test('a late pre-block read is cancelled and cannot overwrite the successful block', async () => {
  const { api, queryClient } = fixture();
  queryClient.setQueryData(key([2]), []);
  let finish;
  let signal;
  const pending = queryClient.fetchQuery({ queryKey: key([2]), staleTime: 0, queryFn(context) {
    signal = context.signal;
    return new Promise(resolve => { finish = resolve; });
  } });
  await api.blockNoteMember(2);
  assert.equal(signal.aborted, true);
  finish([]);
  await pending;
  assert.deepEqual(cached(queryClient, key([2])), [2]);
});

test('failed block request leaves the cached decision unchanged', async () => {
  const { api, queryClient } = fixture({ put: async () => { throw new Error('synthetic failure'); } });
  queryClient.setQueryData(key([2]), []);
  await assert.rejects(api.blockNoteMember(2), /synthetic failure/);
  assert.deepEqual(cached(queryClient, key([2])), []);
  assert.equal(queryClient.getQueryState(key([2])).isInvalidated, false);
});

test('account change before HTTP completion prevents an old mutation from updating new-session caches', async () => {
  let finish;
  const { api, queryClient, auth } = fixture({ put: () => new Promise(resolve => { finish = resolve; }) });
  queryClient.setQueryData(key([2], 8), []);
  const pending = api.blockNoteMember(2);
  auth.session = 8;
  finish();
  await pending;
  assert.deepEqual(cached(queryClient, key([2], 8)), []);
  assert.equal(queryClient.getQueryState(key([2], 8)).isInvalidated, false);
});

test('account change while cancelling reads also prevents a stale cache update', async () => {
  const { api, queryClient, auth } = fixture();
  queryClient.setQueryData(key([2]), []);
  const cancel = queryClient.cancelQueries.bind(queryClient);
  queryClient.cancelQueries = async filters => { await cancel(filters); auth.session = 8; };
  await api.blockNoteMember(2);
  assert.deepEqual(cached(queryClient, key([2])), []);
  assert.equal(queryClient.getQueryState(key([2])).isInvalidated, false);
});
