# 동반여행 DB 기반 로컬 검증

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

사진 표시만 회귀 검사할 때는 별도 세션에서 `tests/travel-images.browser.js`를 실행한다. 이 검사의 API·이미지 응답은 모의 데이터이며 12개 검사로 출처·원본 비율·실패 대체 표시를 확인한다.

조건 상태만 회귀 검사할 때는 `tests/travel-list-first.browser.js`를 실행한다. 모의 API 응답을 사용하는 26개 검사이며 위 DB 연결 검사와 구분한다.

## 종료

이번 검증에서 만든 브라우저 세션·Java 프로세스·미리보기·릴레이만 종료한다. 일회용 MySQL 컨테이너를 종료해 테스트 데이터를 제거한다. 운영 리소스와 다른 작업의 컨테이너·볼륨은 정리 대상이 아니다.

이전 Redis 캐시 직결과 20초 대기 검사는 DB 전용 조회 계약으로 대체했다. 실제 관광공사 수집량·응답 품질과 DB 저장 이용 조건 확인은 운영 활성화 전 별도로 진행한다.
