# 동반여행 DB 기반 로컬 검증

## 쪽지의 실제 개발 환경 검증

`private-notes.browser.js`는 실제 로컬 로그인·Gateway·Community·PostgreSQL·SSE를 연결한다. 모의 응답으로 쪽지 원문이나 인증 결과를 만들지 않는다. 저장 후 응답만 일부러 끊어 같은 멱등키 재시도를 검증한다. 운영 계정·운영 DB를 사용하지 않는다.

1. 기존 Infra 로컬 Compose의 DB 표식이 `dev`인지 확인한다. 다른 환경이면 진행하지 않는다. User/Community 마이그레이션을 별도 도구로 적용하고 앱 권한·기존 행 수 보존을 확인한다. DB를 초기화하거나 기존 마이그레이션의 체크섬을 바꾸지 않는다.
2. PostgreSQL·Redis·개발 SMTP·local-access·User·Community·Gateway와 기존 User listener가 요구하는 개발 Kafka만 기동한다. 쪽지 자체는 Kafka나 Redis Pub/Sub를 사용하지 않는다. 모든 앱은 이 작업 브랜치의 빌드여야 한다.
3. 개발 SMTP 인증과 실제 가입/로그인 API로 이 시험 전용 회원 3명을 준비한다. 이메일은 `note-`로 시작하고 `@example.invalid`로 끝내며 비밀번호는 각각 생성한다. 회원 ID·이메일·비밀번호·테스트 토큰을 `userId/email/password/token` 키의 배열로 저장한 비공개 파일을 준비한다. 파일과 값은 Git·대화·로그에 올리지 않는다. 동일 초 로그인에서 기존 Refresh Token 충돌이 발견돼 시험 로그인 시각을 구분한다. 이 우회는 인증 결함의 해결이 아니다.
4. 기존 개발 DB에는 합성 커뮤니티 글이 있어야 작성자 진입점 검사를 할 수 있다. 시험은 제공한 회원들의 쪽지함과 서로 간 차단만 정리한다. 다른 회원·게시글·제보를 삭제하지 않는다. 이 시험 계정을 다른 목적으로 재사용하지 않는다.
5. Java 17 서비스 빌드 후 아래 프론트 검사와 개발 서버를 실행한다. WSL에서 Windows 폴더를 사용하면 변경 감시 polling을 켠다.

```sh
npm run build
node --experimental-strip-types --test-isolation=none --test tests/noteNotificationWindow.test.ts tests/privateNoteStream.test.ts tests/reportNavigation.test.ts tests/seo.test.ts tests/authSession.test.ts
VITE_API_BASE_URL=http://localhost:28080 CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=1000 npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
```

다른 터미널에서 이미 설치된 Playwright 모듈과 비공개 합성 계정 파일의 절대 경로를 지정한다. 새 도구 설치는 하지 않는다.

```sh
PAWBRIDGE_PLAYWRIGHT_MODULE=/absolute/path/to/installed/playwright \
PAWBRIDGE_NOTES_FIXTURE_FILE=/private/path/to/synthetic-accounts.json \
node tests/run-private-notes.browser.cjs
```

검사 주소는 프론트 `127.0.0.1:5184`, API `localhost:28080`으로 고정한다. 결과는 작성자 진입점·중복 클릭·응답 유실 재전송·직접 SSE·알림 메뉴 미읽음과 본문 비노출·안전한 텍스트/읽음·답장·개인 즐겨찾기/삭제·제3자 거부·차단/해제·오프라인 수신 복원·1440/375px 화면·계정 전환 후 개인 상태 제거의 15개 검사다. 스크린샷은 `/tmp/pawbridge-private-notes-*.png`에 저장한다. 실패 이미지는 합성 본문만 포함하지만 외부 게시 전에 확인한다.

Community/User의 새 DB 테스트는 명시한 `PRIVATE_NOTES_PG_TEST_PORT`와 `migration_test_guard.guard = services-pg-disposable` 표식이 있는 일회용 PostgreSQL만 사용한다. 운영·일반 개발 DB에 이 표식을 만들지 않는다. 환경변수가 없으면 시험을 건너뛰므로 테스트 XML의 `tests/skipped/failures`를 확인한다. `BUILD SUCCESSFUL`만으로 DB 시험이 실행됐다고 판단하지 않는다.

시험 후 이번에 기동한 개발 컨테이너·Vite·브라우저를 중지하고 비공개 합성 인증 파일을 제거한다. 기존 개발 데이터 볼륨은 보존한다. 운영 Community replica/롤링 배포·Cloudflare 스트리밍·운영 쓰기 검증을 대신하는 시험이 아니다.

### 펼친 알림 목록의 UI 회귀

`private-note-notifications.browser.js`는 합성 로그인 상태와 모의 API만 사용한다. 실제 User·Community·DB·인증·SSE 연동을 검증하지 않는다. 위 단위 검사 24건과 별개로 초기 20개→더 보기 40개, 늦은 갱신 응답의 덮어쓰기 방지, 화면 복귀 갱신, 이전 페이지 삭제·읽음 반영, 부분 실패 후 기존 목록 보존·재시도, 1440/375px 화면·Escape·가로 넘침, 페이지 오류 없음의 7개 검사 묶음을 실행한다.

프론트만 `127.0.0.1:5184`에 기동하고 설치된 Chromium을 전용 Playwright 세션으로 사용한다. Windows 폴더에서 작업하면 위의 polling 설정을 유지한다. 이 실행기의 파일은 함수 표현식이므로 마지막에 세미콜론을 추가하지 않는다.

```sh
PLAYWRIGHT_MCP_EXECUTABLE_PATH=/absolute/path/to/chromium playwright-cli -s=notes-fix-review open about:blank
playwright-cli -s=notes-fix-review run-code --filename=tests/private-note-notifications.browser.js --raw
playwright-cli -s=notes-fix-review close
```

스크린샷은 `/tmp/private-note-notifications-{desktop,mobile}.png`와 `/tmp/private-notes-readable-{desktop,mobile}.png`에 남는다. 합성 데이터만 사용하며 시험 후 이 세션과 시험용 Vite를 종료한다. 이 Node 단위 검사와 모의 브라우저 검사는 로컬 실행 근거로 보고한다. main의 빌드·Worker 설정은 이 승격에서 변경하지 않는다.

## 공개 문의 링크 검증

`footer-contact.browser.js`는 로컬 후보의 개인정보 안내 화면에서 공개 문의 주소와 `mailto:` 링크, 1440·375·320px 잘림·가로 넘침·키보드 포커스를 확인한다. 로그인하거나 메일을 보내지 않는다. 실제 이메일 수신·도메인 주소로 회신하는 기능의 검증은 별개다.

## 관리자 리뉴얼 UI 검증

관리자 화면 17개와 기존 API 변경 계약을 로컬 모의 응답으로 검증한다. 운영 인증정보·DB·실제 결제는 사용하지 않는다. `admin-renewal.browser.js`는 회원·보호소·통계 8개, `admin-market.browser.js`는 게시글·상품·주문·분류 9개 화면을 담당한다. 각 스크립트는 1440·390·320px에서 화면을 렌더링한다.

```sh
node --experimental-strip-types --test-isolation=none --test tests/adminStatistics.test.ts tests/shelters.test.ts tests/animalStatistics.test.ts tests/authSession.test.ts tests/seo.test.ts
VITE_API_BASE_URL=https://api.pawbridge.kr npm run build
VITE_API_BASE_URL=http://127.0.0.1:5199 CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=1000 npm run dev -- --host 127.0.0.1 --port 5199 --strictPort
```

이미 설치된 Chromium 경로를 지정해 전용 Playwright 세션을 열고 두 스크립트를 순서대로 실행한다. WSL의 Windows 작업 폴더에서 파일 감시가 누락되면 polling 설정을 사용하거나 이 작업의 개발 서버만 다시 실행한다. 다른 서버·VM을 중지하지 않는다.

```sh
PLAYWRIGHT_MCP_EXECUTABLE_PATH=/absolute/path/to/chromium playwright-cli -s=admin-renewal open http://127.0.0.1:5199
playwright-cli -s=admin-renewal run-code --filename=tests/admin-renewal.browser.js --raw
playwright-cli -s=admin-renewal run-code --filename=tests/admin-market.browser.js --raw
playwright-cli -s=admin-renewal close
```

API 가로채기는 fetch/XHR에만 적용한다. Vite의 `/src/api/` 모듈을 가로채면 정상 소스까지 모의 501 응답으로 바뀌어 화면이 비게 된다. 결과의 개별 테스트 이름과 실제 실행 개수를 확인한다. 파일 하나의 성공 표시를 파일 안의 모든 테스트 실행으로 해석하지 않는다. 스크린샷은 `/tmp/admin-renewal-*.png`, `/tmp/admin-market-*.png`에 남긴다.

위 단위 테스트 명령은 Node.js 24의 `--test-isolation=none`을 사용한다. 이 실행 환경에서 기본 격리 방식이 개별 테스트 대신 파일 성공만 보고한 사례가 있어, 개별 테스트 이름과 통과 수를 확인한다. 관리자 전용 main 승격에서는 dev에만 있는 환경 정책 테스트 4개를 제외한 26개를 실행한다. dev의 기존 30개 검사 결과와 구분하며 빌드·Worker 설정은 이번 승격에 포함하지 않는다.

검증에는 검색·페이지·0건·오류·재시도, 모바일 메뉴 포커스·Escape, 승인·반려 확인, SKU 조합·이미지 업로드·가격/재고, 게시글 multipart 수정, 카테고리·옵션 값 변경, 주문 상태 부분 실패 후 최신 상태 복구가 포함된다. 운영 CRUD와 신규 통계 집계 API 검증을 대신하지 않는다.

공용 브레드크럼의 공개 화면 축약·Escape, 기본 통계 모달의 크기·스크롤 잠금·포커스 복귀, 비회원·일반 회원의 관리자 대표 경로 차단도 확인한다. 카테고리·옵션 그룹은 편집 시작 클릭이 저장 요청을 보내지 않아야 하며 실제 값을 바꾼 저장에서만 기존 PUT을 전송한다.

이 절차는 합성 관광공사 응답을 실제 수집기로 MySQL에 저장한 뒤, 실제 Gateway·Controller·Service와 프런트 화면을 연결한다. API 응답 JSON을 브라우저에서 만들지 않는다.

관광공사 실 API, 전체 animal-service 인프라, 운영 도메인·TLS·CORS는 검증 범위가 아니다. 실제 API 키와 운영 DB를 사용하지 않는다.

## 준비와 Java 검증

Java 17, 기존 Gradle 캐시, 로컬 MySQL 8.4, 기존 Playwright Chromium이 필요하다. 새 도구를 자동 설치하지 않는다.

1. 다른 데이터 볼륨을 연결하지 않은 일회용 MySQL을 localhost 전용 포트에 실행한다. 테스트 DB는 `pawbridge_animal`, 테스트 비밀번호는 `local_flyway_test_only`다.
2. 이 컨테이너에만 `flyway_test_guard.guard(marker)` 테이블과 `animal-flyway-disposable` 값을 만든다. 운영 DB에는 이 표식을 만들지 않는다.
3. Backend의 동반여행 워크트리 `animal-service`에서 `ANIMAL_MIGRATION_TEST_PORT`를 해당 포트로 지정한다.
4. 아래 검증을 실행한다. 테스트는 표식 확인 후 고정된 테스트 테이블을 초기화한다.

```sh
./gradlew migrationMysqlTest migrationTest migrationRehearsal test --tests '*travel.*' bootJar testClasses --offline --no-daemon
```

`migrationRehearsal` 완료 직후에는 장소 카탈로그가 비어 있다. 브라우저 fixture는 비어 있지 않은 카탈로그를 거부하며, 임의로 지우지 않는다.

## DB API와 Gateway 실행

Backend 서비스 폴더에서 다음 환경변수를 설정한다.

- `PAWBRIDGE_TRAVEL_CONTRACT_TEST=true`
- `ANIMAL_MIGRATION_TEST_PORT`: 앞의 일회용 MySQL 포트

```sh
java -Xmx256m -Dloader.path=build/classes/java/test \
  -Dloader.main=com.pawbridge.animalservice.travel.PetTravelContractServer \
  -cp build/libs/animal-service-0.0.1-SNAPSHOT.jar \
  org.springframework.boot.loader.launch.PropertiesLauncher
```

`TRAVEL_DB_CONTRACT_READY requests=5`가 출력되면 합성 공급자 5회 호출로 기본 장소 세 곳과 상세 한 곳을 저장한 상태다. 두 곳은 상세 대기 중이다. 서버는 localhost:18081에만 바인딩한다. 테스트 전용 상태 경로는 bootJar에 포함되지 않는다.

WSL에서 Windows `java.exe`를 실행할 때는 위 두 환경변수를 `WSLENV`에도 추가한다. 기존 `WSLENV` 항목은 보존한다. Windows Java의 `loader.path`와 JAR 인자는 Windows 절대 경로를 사용한다.

Gateway 동반여행 워크트리에서 기존 빌드를 실행한다. `ANIMAL_SERVICE_URL=http://127.0.0.1:18081`과 테스트 전용 `JWT_SECRET`을 지정한다. JWT 값은 운영 값을 재사용하지 않는다.

```sh
java -Xmx256m -jar build/libs/api-gateway-0.0.1-SNAPSHOT.jar \
  --server.port=18180 --server.address=127.0.0.1 \
  --spring.profiles.active=test --management.tracing.enabled=false
```

WSL 브라우저와 Windows Java를 함께 쓰는 경우에만, 두 Windows Java 서버가 포트에 바인딩된 것을 확인한 뒤 WSL의 프런트 폴더에서 아래 릴레이를 실행한다. 릴레이를 먼저 켜면 WSL localhost 전달 기능이 Windows 테스트 포트를 예약할 수 있다. 같은 OS에서 모두 실행하면 릴레이를 사용하지 않는다.

```sh
PAWBRIDGE_TRAVEL_CONTRACT_TEST=true node tests/travel-db-relay.mjs
```

릴레이는 고정된 Windows localhost 포트와 장소·fixture 경로만 허용한다. 응답 본문·상태 코드는 그대로 전달하지만 CORS 등 운영 헤더 검증을 대체하지 않는다.

## 화면 검증

```sh
node --test tests/travel.test.ts
npm run build
npm run preview -- --host 127.0.0.1 --port 5197 --strictPort
```

설치된 Chromium 경로를 지정한 Playwright 설정을 사용한다. 전용 세션에서 실행한다.

```sh
playwright-cli -s=pawbridge-db-e2e open about:blank --config=/absolute/path/to/browser-config.json
playwright-cli -s=pawbridge-db-e2e run-code --filename=tests/travel-db.browser.js --raw
```

결과는 22개 검사다. 세종 법정동 코드 36110을 사용해 실제 DB 목록·상세, 400·404, 공개 쓰기 차단, 5자리 지역 복귀, 수집 준비와 빈 목록 구분, 실패 중 기존 데이터 표시, 375px 가로 넘침을 확인한다.

목록 우선 공개 검사는 다음 순서로 실행한다.

1. 상세 대기 중인 장소 124의 기본 정보를 조회하고 조건 확인 시각이 없는지 확인한다. 조회 전후 공급자 호출 수는 5회로 같다.
2. 테스트 전용 `/__fixture/enrich`로 실제 수집기를 실행한다. 장소 124는 상세 성공·빈 조건으로 바뀌고 125는 계속 대기한다. 공급자 호출 수는 10회다.
3. 테스트 전용 `/__fixture/hide`로 125를 비표출하는 목록 응답을 적용한다. 상세를 호출하지 않고 목록과 직접 상세에서 제외되는지 확인한다. 공급자 호출 수는 13회다.
4. 그 뒤 목록·상세·지역 변경을 수행해도 공급자 호출 수가 13회로 유지되는지 확인한다.

이 두 POST 경로와 실패 표시 경로는 localhost 테스트 서버에만 존재한다. 공개 Gateway로 수집을 실행하지 않는다. 미수집 지역 fixture는 마지막 목록 순회 이후에 추가한다. 테스트가 수집 상태를 변경하므로 재실행 전 서버를 종료하고 전용 fixture DB를 새로 준비한다.

사진과 공통 푸터를 회귀 검사할 때는 별도 세션에서 `tests/travel-images.browser.js`를 실행한다. API·이미지 응답은 모의 데이터다. 24개 검사로 홈·여행 목록·상세의 푸터 전용 API 안내, 수집 시각 미표시, 원본 사진 비율, 이미지 실패 대체 표시와 375px 가로 넘침을 확인한다. 실제 관광공사 API 호출이나 운영 배포를 검증하는 테스트는 아니다.

조건 상태만 회귀 검사할 때는 `tests/travel-list-first.browser.js`를 실행한다. 모의 API 응답을 사용하는 26개 검사이며 위 DB 연결 검사와 구분한다.

## 종료

이번 검증에서 만든 브라우저 세션·Java 프로세스·미리보기·릴레이만 종료한다. 일회용 MySQL 컨테이너를 종료해 테스트 데이터를 제거한다. 운영 리소스와 다른 작업의 컨테이너·볼륨은 정리 대상이 아니다.

이전 Redis 캐시 직결과 20초 대기 검사는 DB 전용 조회 계약으로 대체했다. 실제 관광공사 수집량·응답 품질과 DB 저장 이용 조건 확인은 운영 활성화 전 별도로 진행한다.


## 보호소 신청·관리 UI

개발 서버를 5194 포트로 실행한 뒤 격리된 Playwright CLI 세션에서 실행한다. 기존 설치된 브라우저의 CLI 설정을 사용하며, 테스트는 `/api/` 요청을 모두 가로채므로 운영 데이터에 쓰지 않는다.

```bash
npm run dev -- --port 5194 --strictPort
playwright-cli -s=shelter-ui open --config=/path/to/local-playwright-config.json
playwright-cli -s=shelter-ui run-code --filename=tests/shelter-flow.browser.js
playwright-cli -s=shelter-ui run-code --filename=tests/shelter-errors.browser.js
playwright-cli -s=shelter-ui close
```

첫 스크립트: 신청 후 폼 차단, 승인 최종 확인과 요청 본문, 연결 담당자, 검색 복귀, 반려 후 재신청, 390px 가로 넘침 검사. 두 번째: 조회 오류/재시도, 기존 담당자 이력 없음, 409 충돌 후 재조회, 일반 회원 관리자 화면 차단. 실제 게이트웨이·DB와 연결한 E2E 검증을 대체하지 않는다.


## 공통 브랜드 색상 검증

`tests/brand-theme.browser.js`는 포트 5195의 Vite 화면을 대상으로 공개 API 응답을 격리한다.
메인·검색·통계·보호소·로그인·회원가입·비밀번호 재설정·개인정보·실종동물 검색의
1920px/390px 및 밝은 모드/다크 모드에서 브랜드 클래스가 붙은 텍스트 대비와 가로 넘침을 확인한다.
일반 텍스트 4.5:1, 큰 글자 3:1을 기준으로 하며, 이미지·아이콘·비활성 컨트롤은 이 자동 검사 대상이 아니다.
운영 API 연결 검증이나 모든 접근성 항목의 검증을 대신하지 않는다.

```sh
npm run dev -- --host 127.0.0.1 --port 5195 --strictPort
playwright-cli -s=brand open http://127.0.0.1:5195/login --browser=firefox
playwright-cli -s=brand run-code --filename=tests/brand-theme.browser.js
playwright-cli -s=brand close
```

스크린샷은 `/tmp/brand-*.png`에 저장한다. 기존에 설치된 Playwright 브라우저를 사용한다.

## 마이페이지 목록 조회 상태

`mypage-list-feedback.browser.js`는 찜한 동물·등록 동물·위시리스트·장바구니·주문의
최초 로딩, 조회 실패, 재시도 진행/실패/성공, 정상 빈 결과를 1920px/390px에서 검증한다.
주문 상태와 서버 페이지 보존, 키보드 재시도, 요청 중 중복 클릭 차단,
캐시가 있는 장바구니의 갱신 실패도 포함한다.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5210 --strictPort
playwright-cli -s=mypage-list-feedback open about:blank --browser=firefox
playwright-cli -s=mypage-list-feedback run-code --filename=tests/mypage-list-feedback.browser.js
playwright-cli -s=mypage-list-feedback close
```

모든 API 요청과 장바구니 비우기는 모의 처리한다. 실제 계정·운영 데이터는 사용하지 않으며,
실제 인증 백엔드와의 통합 검증을 대체하지 않는다. 의도한 500 응답의 콘솔 로그는 발생한다.
스크린샷은 `/tmp/mypage-list-*.png`에 저장한다. 기존 설치된 브라우저를 사용한다.
기존 역할 제한·정렬·선택·탭 전환·상세 복귀는 `mypage-animals.browser.js`(5205),
`mypage-market.browser.js`(5207)로 회귀 검증한다.

## 보호동물 내비게이션

`protected-animal-navigation.browser.js`는 모의 API만 사용한다. v3.1의 단일 범주 버튼, 즉시 호버 열림과 300ms 닫힘 여유·재진입 취소·대각선 이동, 클릭으로 연 메뉴 유지, Enter·Space·Tab·Shift+Tab·Escape와 포커스, 바깥 클릭, 경로 이동·현재 위치를 확인한다. 데스크톱 1920/1440/1280px와 모바일 390/320px, 640px 재배치, reduced motion, 44px 터치 영역과 작은 화면의 내부 스크롤도 검사한다. 모바일 그룹은 접지 않고 세 목적지를 바로 표시한다.

```sh
VITE_API_BASE_URL=http://localhost:28080 npm run dev -- --host 127.0.0.1 --port 5198 --strictPort
playwright-cli -s=protected-nav open http://127.0.0.1:5198 --browser=firefox
playwright-cli -s=protected-nav run-code --filename=tests/protected-animal-navigation.browser.js
playwright-cli -s=protected-nav close
```

운영 화면이나 실제 API 연결 검증을 대신하지 않는다.

## 공통 글꼴 검증

`font-consistency.browser.js`는 같은 5198 포트의 로컬 빌드를 검사한다. Chromium의
DevTools Protocol로 실제 사용 글꼴을 확인하므로 Chrome/Chromium을 사용한다.
API 요청은 모의 응답으로 처리하며 실제 로그인이나 데이터 변경은 하지 않는다.
Google Fonts 다운로드는 실제 요청이므로 인터넷 연결이 필요하다.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5198 --strictPort
playwright-cli -s=font-consistency open about:blank --browser=chrome
playwright-cli -s=font-consistency run-code --filename=tests/font-consistency.browser.js
playwright-cli -s=font-consistency close
```

홈·동물검색·실종동물 찾기·보호소 찾기·동반여행·입양후기·커뮤니티·로그인의
1440/390/320px, 밝은 모드·다크 모드에서 글꼴과 가로 넘침을 검사한다.
헤더 로고와 버튼의 SHYU 굵기·행간, 관리자 상품 수정의 기존 `font-sans` 적용,
500ms 지연된 폰트 스타일시트 이후 실제 Noto Sans KR 렌더링,
폰트 다운로드 실패 시 읽을 수 있는 시스템 글꼴 유지까지 81개 단언으로 확인한다.
전체 관리자 화면, 실제 백엔드 연결, 운영 배포나 모든 실기기 조합의 검증을 대신하지 않는다.
