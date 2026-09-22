import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvironment } from '../scripts/environment-policy.mjs';

test('dev rejects production API and live payment credentials', () => {
  assert.throws(() => validateEnvironment('dev', { VITE_API_BASE_URL: 'https://api.pawbridge.kr' }));
  assert.throws(() => validateEnvironment('dev', { VITE_API_BASE_URL: 'http://localhost:28080', VITE_TOSS_CLIENT_KEY: 'live_not_a_real_key' }));
});
test('dev accepts only the local Compose API with test payments', () => {
  assert.equal(validateEnvironment('dev', { VITE_API_BASE_URL: 'http://localhost:28080', VITE_TOSS_CLIENT_KEY: 'test_placeholder' }).VITE_DEPLOYMENT_ENVIRONMENT, 'dev');
  assert.throws(() => validateEnvironment('dev', { VITE_API_BASE_URL: 'https://dev-api.pawbridge.kr' }));
  assert.throws(() => validateEnvironment('dev', { VITE_API_BASE_URL: 'http://localhost:8080' }));
});
test('prod requires the exact production origin', () => {
  assert.equal(validateEnvironment('prod', { VITE_API_BASE_URL: 'https://api.pawbridge.kr' }).VITE_DEPLOYMENT_ENVIRONMENT, 'prod');
  for (const origin of ['http://localhost:28080', 'https://dev-api.pawbridge.kr', 'https://api.pawbridge.kr.evil.example', 'https://api.pawbridge.kr/?x=1']) {
    assert.throws(() => validateEnvironment('prod', { VITE_API_BASE_URL: origin }));
  }
});
test('no implicit environment, missing origin or credentials in URL', () => {
  assert.throws(() => validateEnvironment('main', {}));
  assert.throws(() => validateEnvironment('dev', {}));
  assert.throws(() => validateEnvironment('dev', { VITE_API_BASE_URL: 'http://user:password@localhost:28080' }));
});
