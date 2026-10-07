import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const { scripts } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const lintArgs = scripts.lint.split(' ');
assert.equal(lintArgs.shift(), 'eslint');
assert.equal(lintArgs.shift(), '.');
const lint = source => {
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('node_modules/eslint/bin/eslint.js', root)),
    ...lintArgs, '--stdin', '--stdin-filename', 'src/lint-policy-fixture.tsx', '--format', 'json',
  ], { cwd: root, input: source, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.notEqual(result.status, null, 'ESLint must finish normally');
  const [report] = JSON.parse(result.stdout);
  return { status: result.status, report };
};

test('기존 TypeScript 규칙을 따르는 코드는 통과한다', () => {
  const result = lint('export type Valid = { id: number };');
  assert.equal(result.status, 0);
  assert.equal(result.report.errorCount, 0);
  assert.equal(result.report.warningCount, 0);
});

test('any 위반은 0이 아닌 종료 코드로 CI를 실패시킨다', () => {
  const result = lint('export type Invalid = { id: any };');
  assert.equal(result.status, 1);
  assert.ok(result.report.messages.some(message => message.ruleId === '@typescript-eslint/no-explicit-any'));
});

test('오류 없이 Hook 의존성 경고만 있어도 실패한다', () => {
  const result = lint("import { useEffect } from 'react'; export default function Probe({ value }: { value: string }) { useEffect(() => { console.log(value); }, []); return null; }");
  assert.equal(result.report.errorCount, 0);
  assert.equal(result.report.warningCount, 1);
  assert.equal(result.report.messages[0].ruleId, 'react-hooks/exhaustive-deps');
  assert.equal(result.status, 1);
});
