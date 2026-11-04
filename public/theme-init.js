// 첫 화면을 그리기 전에 다크 모드 여부를 정해, 다크 모드 사용자에게 밝은 화면이 잠깐 보이는 것을 막는다.
// CSP(script-src 'self')가 HTML 안에 직접 쓴 스크립트를 막으므로 별도 파일로 둔다.
// 규칙과 저장 키는 src/lib/theme.ts와 같다: 저장값이 dark/light면 그대로, 없으면 기기 설정을 따른다.
(function () {
  try {
    var saved = localStorage.getItem('pawbridge-theme');
    var dark = saved === 'dark' || (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (error) {
    // 저장소나 matchMedia를 쓸 수 없으면 밝은 화면으로 둔다.
  }
})();
