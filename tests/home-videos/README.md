# 홈 영상 브라우저 검증

`home-videos.browser.js`는 실제 Chromium에서 클릭, 입력, 상태 선택, 더블 클릭,
키보드 이동과 화면 크기 변경을 수행한다. 스크린샷만 만드는 테스트가 아니다.

## 실행 전제

- 설치된 Playwright와 Chromium을 재사용한다. 실행기가 설치하지 않는다.
- 실행기의 `executablePath`는 로컬 검증 환경에 맞춰 확인한다.
- Vite는 `127.0.0.1:5198`, API 주소는 `http://127.0.0.1:28089`로 실행한다.
- Windows 마운트 경로에서 변경 이벤트가 누락되면 Vite 실행에
  `CHOKIDAR_USEPOLLING=true`를 지정한다.

```bash
PAWBRIDGE_PLAYWRIGHT_MODULE=/absolute/path/to/installed/playwright \
PAWBRIDGE_VIDEO_TEST_MODE=mock node tests/run-home-videos.browser.cjs
```

`mock`는 영상 API 응답까지 합성한다. `connected`는 실제 JWT Gateway와
Community 영상 Controller·Service·JDBC를 격리 PostgreSQL에 연결한다.
Community의 `videoBrowserServer` 태스크는 DB의 일회성 표식과 빈 영상 목록을
확인한 뒤 실행한다. 실제 운영 DB, 운영 계정, 운영 키를 사용하지 않는다.

두 모드에서 공통으로 외부 YouTube 응답·재생 프레임·썸네일, 관련 없는
보호동물/후기 API와 오류 주입 응답을 합성한다. 브라우저 OPTIONS도 합성하므로
실제 CORS 계약은 Gateway의 별도 HTTP 테스트로 확인한다. `connected` 성공을
실제 YouTube 영상 재생, 로그인 발급 또는 전체 서비스 통합 성공으로 표현하지 않는다.

## 확인 계약

- 등록 전 정보 확인, 중복 클릭 방지, 오류 시 입력 보존, 네 번째 게시 제한
- 편집, 게시·숨김, 검색·필터, 버튼 순서 변경, 새로고침 후 저장 유지
- 명시적 조작 전 iframe 없음, 자동 재생 없음, Escape·포커스 복귀·Tab 순환
- 320·390·768px 가로 넘침, 모바일 한 카드와 수동 이동, 전체 화면 양식
- 로딩·빈 결과·오류 격리, 관리자 목록 오류 및 재시도, 일반회원 접근 차단
- 모의 모드 추가: 재생 불가 영상 재확인, 긴 제목과 썸네일 실패

결과 화면은 `/tmp/pawbridge-video-{mode}-*.png`에 남긴다. 원본 영상이 아닌
기존 프로젝트 이미지로 썸네일을 대체하며, 선정 콘텐츠의 실제 캡처가 아니다.
정책 검증·운영 배포·실제 공급자 연동은 별도 단계다.
