import test from 'node:test';
import assert from 'node:assert/strict';
import { parseThemePreference, resolveDark } from '../src/lib/theme.ts';

test('저장값이 없거나 알 수 없으면 기기 설정을 따른다', () => {
  assert.equal(parseThemePreference(null), 'system');
  assert.equal(parseThemePreference('blue'), 'system');
  assert.equal(resolveDark('system', true), true);
  assert.equal(resolveDark('system', false), false);
});

test('사용자가 고른 모드는 기기 설정보다 우선한다', () => {
  assert.equal(resolveDark(parseThemePreference('light'), true), false);
  assert.equal(resolveDark(parseThemePreference('dark'), false), true);
});
