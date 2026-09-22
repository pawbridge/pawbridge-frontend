# 환경별 빌드와 배포

기존 build 및 기본 Wrangler target은 운영 호환을 위해 보존했다. 새 명령은 확인된 환경 입력이 없으면 빌드를 중단한다.

```sh
VITE_API_BASE_URL=http://localhost:18080 npm run build:dev
VITE_API_BASE_URL=https://api.pawbridge.kr npm run build:prod
```

- dev 산출물은 `dist/dev`, prod는 `dist/prod`다. Vite 환경변수는 빌드 시 포함되므로 동일 바이너리라고 주장하지 않는다.
- `.env.dev(.local)` / `.env.prod(.local)` 또는 process env를 사용한다. dev에는 `test_` 결제 키만 허용하고, 값이 없으면 결제 기능을 실제 테스트했다고 기록하지 않는다. 키를 커밋하지 않는다.
- dev URL `dev-api.pawbridge.kr`는 예정된 설정 계약이며 DNS/터널 생성 완료를 뜻하지 않는다. 최초 로컬 점검은 별도 dev 게이트웨이의 port-forward를 사용한다.
- Cloudflare의 기존 Git 빌드 설정은 이 PR이 바꾸지 않는다. 실제 연결은 dev→`build:dev`/`wrangler deploy --env dev`, main→`build:prod`/`wrangler deploy --env prod`로 **검증·승인 후** 전환한다. 두 env의 Worker 이름과 assets 디렉터리가 다르다.
- 운영/개발 코드와 빌드 출처를 확인한 뒤 배포한다. API 주소가 다른 기존 dist를 재사용하지 않는다. 각 산출물의 environment.json으로 확인한다.
- dev의 robots와 응답에는 noindex를 적용한다. 이는 인증이 아니므로 외부 공개 전 Cloudflare Access 등 접근 제한을 별도로 준비한다.
- 공식 설정 근거: https://developers.cloudflare.com/workers/wrangler/configuration/#environments
