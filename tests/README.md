# 프론트엔드 시험

## 프런트 Lint 정책과 브라우저 회귀

기존 ESLint 규칙은 TypeScript·TSX에 적용된다. `npm run lint`는 오류뿐 아니라 경고도 실패로 처리한다. JavaScript·MJS·CJS의 별도 Lint 규칙 도입이나 백엔드 검사는 이번 범위가 아니다.

`npm run test:lint-policy`는 파일을 만들지 않고 CLI의 stdin으로 정상 코드, `any` 오류, Hook 의존성 경고를 전달한다. 정상 코드는 exit0, 나머지는 exit1이어야 한다. GitHub Actions는 dev/main 대상 PR에서 전체 Lint와 이 정책 검사를 환경 검사·빌드보다 먼저 실행한다. 브랜치 보호의 필수 검사 설정은 이 workflow 변경과 별개다.

```sh
npm run lint
npm run test:lint-policy
npm run test:unit        # 화면 로직 단위 시험(adminStatistics·animalSearch·shelters 등 18개 파일)
npm run test:environment
VITE_API_BASE_URL=http://localhost:28080 npm run build:dev
VITE_API_BASE_URL=https://api.pawbridge.kr npm run build:prod
```

`lint-regression.browser.js`는 커뮤니티·입양후기 작성/수정 실패 안내와 입력 유지, multipart 계약, 상품 기본 SKU·옵션 변경·재조회, 바로 구매 요청, 결제 SDK의 취소·null·문자열 오류를 실제 브라우저로 조작한다. 1440·390px을 사용한다. API·주소 검색·결제 SDK는 전부 합성이며 외부 요청을 차단한다. 실제 로그인·DB·결제·운영 검증은 아니다.

공용 브라우저 실행기로 실행한다. 실행기가 `dev-lint` 프로필(합성 `test_` 결제 키)로 5202 개발 서버를 띄우고 종료 시 중지한다.

```sh
npm run test:browser -- lint-regression
```

스크린샷은 `/tmp/pawbridge-lint-{product,checkout}-{1440,390}.png`에 남는다. 브라우저 회귀는 로컬 별도 검증이며 이번 GitHub Actions에는 추가하지 않았다.

## 공용 브라우저 실행기

`tests/run-browser.mjs`가 `tests/browser-manifest.json`에 등록된 `*.browser.js`를 실행한다. 모두 모의(mock) 응답만 쓴다. 매니페스트에는 테스트별 주소(scheme://host:port), 서버 종류(dev·preview), 환경 프로필, 호출 형태, 사전 이동 여부, 그룹(`mock`), 허용 외부 호스트, fixture가 있다. 환경 프로필은 매니페스트에 한 번만 정의한다.

```sh
npm run test:browser                                  # 모의 테스트 전체
npm run test:browser -- auth-refresh visits             # 선택 실행
npm run test:browser -- --repeat 3 lost-search        # 반복 실행
```

- Playwright: 저장소에서 `playwright-core`를 찾고, 없으면 `PAWBRIDGE_PLAYWRIGHT_MODULE`(설치된 playwright 또는 playwright-core 폴더)를 쓴다. 둘 다 없으면 설치하지 않고 종료한다. 브라우저는 시스템 Chrome(`channel: 'chrome'`)이며, `PAWBRIDGE_CHROMIUM_PATH`를 지정하면 그 실행 파일을 쓴다.
- 시작 전 검사: 프로필마다 `.env` 파일(`loadEnv('browser-test')`)과 프로필 값을 합친 실제 값을 확인한다. `VITE_API_BASE_URL`은 비어 있거나 `http(s)://localhost|127.0.0.1[:port]`, `VITE_TOSS_CLIENT_KEY`는 없거나 `test_`로 시작해야 하고, 채팅·방문자 기능 플래그는 그 프로필이 켠 경우에만 `true`일 수 있다. 같은 포트를 쓰는 테스트는 서버 종류와 프로필이 같아야 한다. 매니페스트의 모든 포트와 28080·28089에 이미 무언가 열려 있으면(127.0.0.1과 ::1 모두 확인) 빌드·서버 기동 전에 중단한다. 셸에서 내보낸 `VITE_*` 변수는 무시한다.
- 빌드·서버: preview 테스트는 `vite build --mode browser-test --outDir .browser-test-build/<profile>`로 만든 빌드를, dev 테스트는 `vite --mode browser-test` 개발 서버를 쓴다. 둘 다 `scripts/environment-policy.mjs`를 의도적으로 거치지 않으며 `dist`나 운영 빌드를 쓰지 않는다. 개발 서버는 의존성 캐시를 `.browser-test-build/vite-cache`에 따로 두고, 로그인하지 않은 별도 컨텍스트로 `/`를 한 번 열어 예열한다. 예열 뒤 Vite 로그에 `optimized dependencies changed`나 `page reload`가 나오면 실행 전체를 실패로 표시한다.
- 실행: 테스트는 순서대로 하나씩, 테스트마다 새 브라우저 컨텍스트(1440×1000, 기본 제한 15초, 테스트당 최대 5분)에서 실행한다. 표에 PASS/FAIL과 첫 오류 줄을 출력하고, 선택한 테스트가 하나라도 실패하면 exit 1이다. 로그는 `.browser-test-build/logs`, 반환값은 `results`, 실패 화면은 `failures`에 남는다. 실행기가 띄운 서버는 정상 종료·오류·Ctrl+C 모두에서 중지한다.
- `visits`는 같은 출처 API·`VITE_DAILY_VISITORS_ENABLED=true`·`VITE_VISITOR_TEST_MODE=true` 개발 서버(5192)에서 `(browser, { origin, evidence })`로, `home-videos`는 5214 개발 서버와 합성 API 주소 `http://127.0.0.1:28089`에서 모의 모드로 실행한다. 실행기가 합성 HS512 토큰을 만들어 넘긴다. 기존 `connected` 모드(실제 Gateway·Community 연결)는 이 실행기에서 지원하지 않는다.
- `map-security`는 `after` 단계로 새 임시 증거 폴더에서 실행한다. 이전 단계 `before.json`과의 자동 비교는 하지 않으며 비교 성공으로 표시하지 않는다.

### 네트워크 보장 범위

Chromium은 `--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1`(테스트의 허용 호스트는 EXCLUDE 추가)와 `--no-proxy-server`로 실행한다. 따라서 브라우저가 보내는 루프백 밖 요청은 차단된다. 모든 테스트에서 운영 화면이 불러오는 Google 글꼴 호스트(`fonts.googleapis.com`·`fonts.gstatic.com`)는 허용한다. 글꼴이 없으면 Material Symbols 아이콘이 이름(`menu`, `person` 등)으로 보여 캡처가 운영 화면과 달라지기 때문이다. 이 두 호스트는 정적 글꼴 파일만 주므로 API 요청이 나갈 수 없다. 테스트별 허용 호스트가 더 있으면 그 테스트는 별도 브라우저로 실행한다.

앱 자체가 불러오는 외부 자원(다음 우편번호 스크립트, `www.pawbridge.kr` 아이콘, 로그인 버튼 이미지 등) 중 테스트가 직접 처리하지 않은 요청은 실행기가 컨텍스트 단계에서 중단하고 표의 DETAIL에 호스트를 기록한다. 테스트가 외부 요청을 `route.continue()` 등으로 네트워크에 보내 Chromium 네트워크 단계까지 도달하면(호스트 해석 차단 또는 실제 서버 응답) 해당 테스트를 실패로 처리한다.

Node 쪽 요청(`route.fetch`, `page.request` 등 Playwright가 Node에서 보내는 요청)은 이 보장에 포함되지 않는다. 예를 들어 `font-consistency`는 `route.fetch()`로 Google Fonts를 실제로 받는다.

## 쪽지 알림 목록 UI 회귀

`private-note-notifications.browser.js`는 합성 로그인 상태와 모의 API만 사용한다. 실제 User·Community·DB·인증·SSE 연동을 검증하지 않는다. 단위 검사(`noteNotificationWindow`, `privateNoteStream`)와 별개로 초기 20개→더 보기 40개, 늦은 갱신 응답의 덮어쓰기 방지, 화면 복귀 갱신, 이전 페이지 삭제·읽음 반영, 부분 실패 후 기존 목록 보존·재시도, 1440/375px 화면·Escape·가로 넘침, 페이지 오류 없음의 7개 검사 묶음을 실행한다.

공용 실행기가 `127.0.0.1:5184` 개발 서버와 브라우저를 띄운다.

```sh
npm run test:browser -- private-note-notifications
```

스크린샷은 `/tmp/private-note-notifications-{desktop,mobile}.png`와 `/tmp/private-notes-readable-{desktop,mobile}.png`에 남는다. 합성 데이터만 사용하며 시험 후 이 세션과 시험용 Vite를 종료한다. 현재 GitHub Actions는 환경 정책·빌드 검사만 실행하므로 이 Node 단위 검사와 모의 브라우저 검사는 로컬 실행 근거로 보고한다.

## 공개 문의 링크 검증

`footer-contact.browser.js`는 로컬 후보의 개인정보 안내 화면에서 공개 문의 주소와 `mailto:` 링크, 1440·375·320px 잘림·가로 넘침·키보드 포커스를 확인한다. 로그인하거나 메일을 보내지 않는다. 실제 이메일 수신·도메인 주소로 회신하는 기능의 검증은 별개다.

## 관리자 리뉴얼 UI 검증

관리자 화면 17개와 기존 API 변경 계약을 로컬 모의 응답으로 검증한다. 운영 인증정보·DB·실제 결제는 사용하지 않는다. `admin-renewal.browser.js`는 회원·보호소·통계 8개, `admin-market.browser.js`는 게시글·상품·주문·분류 9개 화면을 담당한다. 각 스크립트는 1440·390·320px에서 화면을 렌더링한다.

```sh
node --experimental-strip-types --test-isolation=none --test tests/adminStatistics.test.ts tests/shelters.test.ts tests/animalStatistics.test.ts tests/authSession.test.ts tests/seo.test.ts tests/environment-policy.test.mjs
npm run test:browser -- admin-renewal admin-market
```

공용 실행기가 5199 서버와 브라우저를 띄우고 두 스크립트를 순서대로 실행한다.


API 가로채기는 fetch/XHR에만 적용한다. Vite의 `/src/api/` 모듈을 가로채면 정상 소스까지 모의 501 응답으로 바뀌어 화면이 비게 된다. 결과의 개별 테스트 이름과 실제 실행 개수를 확인한다. 파일 하나의 성공 표시를 파일 안의 모든 테스트 실행으로 해석하지 않는다. 스크린샷은 `/tmp/admin-renewal-*.png`, `/tmp/admin-market-*.png`에 남긴다.

위 단위 테스트 명령은 Node.js 24의 `--test-isolation=none`을 사용한다. 이 실행 환경에서 기본 격리 방식이 개별 테스트 대신 파일 성공만 보고한 사례가 있어, 30개 테스트 이름과 통과 수를 확인한다.

검증에는 검색·페이지·0건·오류·재시도, 모바일 메뉴 포커스·Escape, 승인·반려 확인, SKU 조합·이미지 업로드·가격/재고, 게시글 multipart 수정, 카테고리·옵션 값 변경, 주문 상태 부분 실패 후 최신 상태 복구가 포함된다. 운영 CRUD와 신규 통계 집계 API 검증을 대신하지 않는다.

공용 브레드크럼의 공개 화면 축약·Escape, 기본 통계 모달의 크기·스크롤 잠금·포커스 복귀, 비회원·일반 회원의 관리자 대표 경로 차단도 확인한다. 카테고리·옵션 그룹은 편집 시작 클릭이 저장 요청을 보내지 않아야 하며 실제 값을 바꾼 저장에서만 기존 PUT을 전송한다.

## 동반여행 화면 회귀

사진과 공통 푸터를 회귀 검사할 때는 `npm run test:browser -- travel-images`를 실행한다. API·이미지 응답은 모의 데이터다. 24개 검사로 홈·여행 목록·상세의 푸터 전용 API 안내, 수집 시각 미표시, 원본 사진 비율, 이미지 실패 대체 표시와 375px 가로 넘침을 확인한다. 실제 관광공사 API 호출이나 운영 배포를 검증하는 테스트는 아니다.

조건 상태만 회귀 검사할 때는 `tests/travel-list-first.browser.js`를 실행한다. 모의 API 응답을 사용하는 26개 검사이며

## 보호소 신청·관리 UI

공용 실행기가 5194 서버를 띄운다. 테스트는 `/api/v1/` 요청을 모두 가로채므로 운영 데이터에 쓰지 않는다.

```sh
npm run test:browser -- shelter-flow shelter-errors
```

첫 스크립트: 신청 후 폼 차단, 승인 최종 확인과 요청 본문, 연결 담당자, 검색 복귀, 반려 후 재신청, 390px 가로 넘침 검사. 두 번째: 조회 오류/재시도, 기존 담당자 이력 없음, 409 충돌 후 재조회, 일반 회원 관리자 화면 차단. 실제 게이트웨이·DB와 연결한 E2E 검증을 대체하지 않는다.


## 공통 브랜드 색상 검증

`tests/brand-theme.browser.js`는 포트 5195의 Vite 화면을 대상으로 공개 API 응답을 격리한다.
메인·검색·통계·보호소·로그인·회원가입·비밀번호 재설정·개인정보·실종동물 검색의
1920px/390px 및 밝은 모드/다크 모드에서 브랜드 클래스가 붙은 텍스트 대비와 가로 넘침을 확인한다.
일반 텍스트 4.5:1, 큰 글자 3:1을 기준으로 하며, 이미지·아이콘·비활성 컨트롤은 이 자동 검사 대상이 아니다.
운영 API 연결 검증이나 모든 접근성 항목의 검증을 대신하지 않는다.

```sh
npm run test:browser -- brand-theme
```

스크린샷은 `/tmp/brand-*.png`에 저장한다. 원래 Firefox로 확인하던 시험이며 공용 실행기는 Chrome만 쓴다.

## 마이페이지 목록 조회 상태

`mypage-list-feedback.browser.js`는 찜한 동물·등록 동물·위시리스트·장바구니·주문의
최초 로딩, 조회 실패, 재시도 진행/실패/성공, 정상 빈 결과를 1920px/390px에서 검증한다.
주문 상태와 서버 페이지 보존, 키보드 재시도, 요청 중 중복 클릭 차단,
캐시가 있는 장바구니의 갱신 실패도 포함한다.

```sh
npm run test:browser -- mypage-list-feedback
```

모든 API 요청과 장바구니 비우기는 모의 처리한다. 실제 계정·운영 데이터는 사용하지 않으며,
실제 인증 백엔드와의 통합 검증을 대체하지 않는다. 의도한 500 응답의 콘솔 로그는 발생한다.
스크린샷은 `/tmp/mypage-list-*.png`에 저장한다. 원래 Firefox로 확인하던 시험이며 공용 실행기는 Chrome만 쓴다.
기존 역할 제한·정렬·선택·탭 전환·상세 복귀는 `mypage-animals.browser.js`(5205),
`mypage-market.browser.js`(5207)로 회귀 검증한다.

## 보호동물 내비게이션

`protected-animal-navigation.browser.js`는 모의 API만 사용한다. v3.1의 단일 범주 버튼, 즉시 호버 열림과 300ms 닫힘 여유·재진입 취소·대각선 이동, 클릭으로 연 메뉴 유지, Enter·Space·Tab·Shift+Tab·Escape와 포커스, 바깥 클릭, 경로 이동·현재 위치를 확인한다. 데스크톱 1920/1440/1280px와 모바일 390/320px, 640px 재배치, reduced motion, 44px 터치 영역과 작은 화면의 내부 스크롤도 검사한다. 모바일 그룹은 접지 않고 세 목적지를 바로 표시한다.

```sh
npm run test:browser -- protected-animal-navigation
```

원래 Firefox로 확인하던 시험이며 공용 실행기는 Chrome만 쓴다. 운영 화면이나 실제 API 연결 검증을 대신하지 않는다.

## 공통 글꼴 검증

`font-consistency.browser.js`는 공용 실행기가 5198 포트에 띄운 로컬 빌드를 검사한다. Chromium의
DevTools Protocol로 실제 사용 글꼴을 확인하므로 Chrome/Chromium을 사용한다.
API 요청은 모의 응답으로 처리하며 실제 로그인이나 데이터 변경은 하지 않는다.
Google Fonts 다운로드는 실제 요청이므로 인터넷 연결이 필요하다.

```sh
npm run test:browser -- font-consistency
```

홈·동물검색·실종동물 찾기·보호소 찾기·동반여행·입양후기·커뮤니티·로그인의
1440/390/320px, 밝은 모드·다크 모드에서 글꼴과 가로 넘침을 검사한다.
헤더 로고와 버튼의 SHYU 굵기·행간, 관리자 상품 수정의 기존 `font-sans` 적용,
500ms 지연된 폰트 스타일시트 이후 실제 Noto Sans KR 렌더링,
폰트 다운로드 실패 시 읽을 수 있는 시스템 글꼴 유지까지 81개 단언으로 확인한다.
전체 관리자 화면, 실제 백엔드 연결, 운영 배포나 모든 실기기 조합의 검증을 대신하지 않는다.

## 의존성 보안 갱신 회귀

`dependency-security.test.mjs`는 별도 Node 프로세스와 루프백 HTTP 서버에서
합성 prototype 오염 후 Axios가 상속된 헤더를 보내지 않는지 확인한다.
다른 테스트 프로세스의 prototype이나 실제 API·인증정보는 사용하지 않는다.

```sh
node --test tests/dependency-security.test.mjs
```

브라우저 검사는 공용 브라우저 실행기로 실행한다. 기존 실행기가 묶어 돌리던 네 파일은
각자의 서버·프로필로 따로 실행된다(`dependency-security`: 채팅 플래그 개발 서버 5260,
`chat-existing-room-cache`: 채팅 플래그 preview 5186, `blocked-author-cache`: 개발 서버 5187,
`api-response-boundary`: 개발 서버 5211).

```sh
npm run test:browser -- dependency-security chat-existing-room-cache blocked-author-cache api-response-boundary
```

1440·375px에서 로그인 실패 안내와 작성자 연락 복귀, 실제 XHR의 인증 헤더·JSON·
multipart·HTTP 오류·연결 실패 처리, 지도 선택·확대·Escape·가로 넘침을 검사한다.
기존 대화 캐시·차단 작성자 캐시와 중단된 응답의 성공 캐시 방지 회귀도 재사용한다.
API·인증·폰트·주소검색 SDK·장식 사진은 합성이며 실제 백엔드·결제·R2 연동 또는
운영 검증이 아니다. 실행기는 자신이 띄운 서버만 중지하며 다른 개발 서버·컨테이너·VM을
중지하지 않는다.

## 지도 D3 보안·화면 호환성

`mapDependencySecurity.test.mjs`는 잠금 파일의 실제 `d3-color` 경로를 모두 검사한다.
타입 전용 `@types/d3-color`와 구분하며, 중첩 설치에 취약 버전이 남아도 실패한다.
지도 라이브러리의 자체 타입·React 19 지원 계약도 확인한다.

```sh
node --test-isolation=none --test tests/mapDependencySecurity.test.mjs
```

지도 전용 브라우저 검사는 공용 브라우저 실행기로 preview 5262에서 실행한다.
실행기가 새 임시 증거 폴더를 만들어 `after` 단계로 호출하고, 폴더 경로를 표에 표시한다.

```sh
npm run test:browser -- map-security
```

1440·375px와 밝은·어두운 모드에서 17개 지역, 반응형 SVG, hover·pressed·focus,
지도 클릭·키보드 지역 선택, 확대/축소 한계, 드래그, 전체 보기, 선택 메뉴,
Escape·가로 넘침을 검사한다. 로딩·빈 결과·실패 후 재시도도 확인한다.
라이브러리 변경 전후의 `before.json` 자동 대조는 하지 않는다. 결과는 동작 검사이며
지도 크기·색·지역·마커가 이전과 같다는 비교 성공으로 해석하지 않는다.

통계·폰트·외부 자산은 합성 응답이고 실제 백엔드 연결·운영 검증은 아니다.
캡처는 픽셀 동일성을 자동 보장하지 않으므로 필요하면 이미지를 직접 확인한다.
출력·캡처를 Git에 넣지 않는다. 브라우저와 서버는 실행기가 종료 시 정리한다.
