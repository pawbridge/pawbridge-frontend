// playwright-cli run-code --filename=tests/api-response-boundary.browser.js
// 실행 중인 로컬 Vite 페이지를 사용한다. 기본 주소는 127.0.0.1:5211이다.
// 실제 API 클라이언트·QueryClient를 사용하고 요청별 adapter만 모의한다.
async page => {
  const current = new URL(page.url());
  const origin = ['127.0.0.1', 'localhost'].includes(current.hostname)
    ? current.origin : 'http://127.0.0.1:5211';
  await page.goto(`${origin}/login`);
  const result = await page.evaluate(async () => {
    const { default: client } = await import('/src/api/client.ts');
    const { queryClient } = await import('/src/lib/queryClient.ts');
    const request = (status, data) => client.get('/api/v1/response-boundary-test', {
      adapter: async config => ({ data, status, statusText: '', headers: {}, config, request: {} }),
    });
    const failedKey = ['response-boundary-test', 'interrupted'];
    let failureCode;
    try {
      await queryClient.fetchQuery({
        queryKey: failedKey, retry: false,
        queryFn: async () => (await request(0, '')).data,
      });
    } catch (error) { failureCode = error.code; }
    const interrupted = {
      failureCode,
      status: queryClient.getQueryState(failedKey)?.status,
      cachedData: queryClient.getQueryData(failedKey),
    };
    const responses = [];
    for (const [status, data] of [[200, { content: [], totalElements: 0 }], [200, []], [204, '']]) {
      const value = await request(status, data);
      responses.push({ status: value.status, data: value.data });
    }
    queryClient.removeQueries({ queryKey: ['response-boundary-test'] });
    return { interrupted, responses };
  });
  if (result.interrupted.failureCode !== 'ERR_NETWORK'
    || result.interrupted.status !== 'error'
    || result.interrupted.cachedData !== undefined) {
    throw new Error(`Interrupted HTTP request was cached as successful data: ${JSON.stringify(result.interrupted)}`);
  }
  const expected = [
    { status: 200, data: { content: [], totalElements: 0 } },
    { status: 200, data: [] }, { status: 204, data: '' },
  ];
  if (JSON.stringify(result.responses) !== JSON.stringify(expected)) {
    throw new Error('Successful HTTP object, array or no-content responses changed');
  }
  return { passed: true, interruptedRequestRejected: true, noSuccessfulCacheEntry: true, successfulResponseContracts: 3 };
};
