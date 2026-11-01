// 이메일 로그인은 로컬 백엔드(개발용 시드 계정)에 붙을 때만 쓴다. 운영 회원은 네이버·구글로만 로그인한다.
// 운영 빌드는 API 주소가 https://api.pawbridge.kr로 고정이라(scripts/environment-policy.mjs) 이 값이 항상 false다.
export const emailLoginEnabled = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(import.meta.env.VITE_API_BASE_URL ?? '');
