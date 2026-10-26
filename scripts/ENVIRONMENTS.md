# 환경별 빌드와 배포

기존 build 및 기본 Wrangler target은 운영 호환을 위해 보존했다. 새 명령은 확인된 환경 입력이 없으면 빌드를 중단한다.

```sh
VITE_API_BASE_URL=http://localhost:28080 npm run build:dev
VITE_API_BASE_URL=https://api.pawbridge.kr npm run build:prod
```

- dev 산출물은 `dist/dev`, prod는 `dist/prod`다. Vite 환경변수는 빌드 시 포함되므로 동일 바이너리라고 주장하지 않는다.
- `.env.dev(.local)` / `.env.prod(.local)` 또는 process env를 사용한다. dev에는 `test_` 결제 키만 허용하고, 값이 없으면 결제 기능을 실제 테스트했다고 기록하지 않는다. 키를 커밋하지 않는다.
- dev는 로컬 Compose Gateway `http://localhost:28080`을 사용한다. `npm run dev:local`로 localhost:5184에 개발 화면을 띄운다. VM port-forward나 dev 공개 도메인이 필요 없다.
- Cloudflare의 기존 Git 빌드 설정은 이 PR이 바꾸지 않는다. 현재 dev는 로컬 실행이며 Cloudflare dev 배포는 하지 않는다. 운영 main의 `build:prod`/`wrangler deploy --env prod` 연결만 **검증·승인 후** 전환한다. 로컬 dev는 Vite, 운영 prod만 기존 Worker 이름과 dist/prod를 사용한다.
- 운영/개발 코드와 빌드 출처를 확인한 뒤 배포한다. API 주소가 다른 기존 dist를 재사용하지 않는다. 각 산출물의 environment.json으로 확인한다.
- dev의 robots와 응답에는 noindex를 적용한다. 이는 인증이 아니므로 외부 공개 전 Cloudflare Access 등 접근 제한을 별도로 준비한다.
- 공식 설정 근거: https://developers.cloudflare.com/workers/wrangler/configuration/#environments

## 보안 응답 헤더

- `public/_headers`가 빌드 시 `dist/<환경>/_headers`로 복사되어 Workers 정적 자산 응답과, `ASSETS.fetch`를 거치는 Worker의 SPA 셸 응답에 모두 적용된다. Worker 코드는 이를 따로 설정하지 않는다.
- CSP는 `Content-Security-Policy-Report-Only`다. 위반은 차단되지 않고 브라우저 콘솔에만 기록된다. 새 외부 호스트(이미지, 스크립트, API 등)를 추가하면 이 파일의 정책도 함께 갱신한다.
- dev 빌드는 `_headers` 뒤에 `X-Robots-Tag` 규칙을 덧붙인다. dev 정책의 `connect-src`에는 로컬 Gateway가 없으므로, 로컬 dev를 Workers로 서비스할 때는 위반 로그가 보일 수 있다.
- HSTS는 도메인 전체에 영향을 주므로 여기에 넣지 않았다.
