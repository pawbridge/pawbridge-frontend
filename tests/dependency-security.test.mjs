import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('Axios는 교체된 요청 설정에 상속된 헤더를 외부 요청으로 보내지 않는다', () => {
  // The synthetic pollution stays in a separate process; other tests are untouched.
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `
    import assert from 'node:assert/strict';
    import http from 'node:http';
    const { default: axios } = await import(process.argv[1]);
    let received;
    const server = http.createServer((request, response) => {
      received = request.headers;
      response.end('ok');
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const client = axios.create();
      client.interceptors.request.use(config => {
        Object.defineProperty(Object.prototype, 'headers', {
          configurable: true, writable: true,
          value: { 'X-Synthetic-Inherited': 'must-not-be-sent' },
        });
        return { url: config.url, method: config.method, proxy: false, timeout: 3000 };
      });
      await client.get('http://127.0.0.1:' + server.address().port);
    } finally {
      Reflect.deleteProperty(Object.prototype, 'headers');
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    assert.equal(received['x-synthetic-inherited'], undefined);
  `, new URL('../node_modules/axios/index.js', import.meta.url).href], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8', timeout: 45000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
