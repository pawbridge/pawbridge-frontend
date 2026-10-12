import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

test('지도 의존성의 모든 d3-color 경로가 보안 수정 버전을 사용한다', () => {
  const colors = Object.entries(lock.packages).filter(([path]) => /(?:^|\/)node_modules\/d3-color$/.test(path));
  assert.ok(colors.length > 0, '지도 색상 의존성을 실제로 검사해야 한다');
  for (const [path, { version }] of colors) {
    const [major, minor] = version.split('.').map(Number);
    assert.ok(major > 3 || (major === 3 && minor >= 1), `${path}: 취약한 버전 ${version}`);
  }
});

test('지도 라이브러리 자체 타입과 React 19 지원 계약을 사용한다', () => {
  const root = lock.packages[''];
  assert.equal(root.dependencies['react-simple-maps'], '5.0.5');
  assert.equal(root.devDependencies['@types/react-simple-maps'], undefined);
  assert.equal(lock.packages['node_modules/react-simple-maps'].version, '5.0.5');
});
