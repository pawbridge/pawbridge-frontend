export function validateEnvironment(environment, values) {
  if (!['dev', 'prod'].includes(environment)) throw new Error('Expected dev or prod');
  const raw = values.VITE_API_BASE_URL;
  if (!raw) throw new Error('VITE_API_BASE_URL must be explicit');
  const url = new URL(raw);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('API base must be an origin without credentials, path or query');
  }
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  const prod = url.origin === 'https://api.pawbridge.kr';
  if (environment === 'dev' && !(local && url.protocol === 'http:' && url.port === '28080')) {
    throw new Error('Dev must use the local Compose API on port 28080');
  }
  if (environment === 'prod' && !prod) throw new Error('Prod must use the production API');
  const key = values.VITE_TOSS_CLIENT_KEY || '';
  if (environment === 'dev' && key && !key.startsWith('test_')) {
    throw new Error('Dev payment requires a test client key');
  }
  return { ...values, VITE_API_BASE_URL: url.origin, VITE_TOSS_CLIENT_KEY: key,
    VITE_DEPLOYMENT_ENVIRONMENT: environment };
}
