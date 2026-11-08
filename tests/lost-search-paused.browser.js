// 실종 검색 서비스를 내려 둔 동안(VITE_LOST_SEARCH_PAUSED=true 프로필) 사진 검색과 비슷한 동물 영역에
// 일시 중지 안내가 보이고, 검색 버튼이 꺼지며, 검색과 추천 API를 부르지 않는지 확인한다.
// PR 캡처용으로 1920·390px 라이트, 다크 화면을 /tmp/lost-search-paused-*.png 에 남긴다. 모의 응답만 쓴다.
async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const animal = { id: 77, species: 'DOG', breed: '믹스견', gender: 'MALE', status: 'PROTECT', happenDate: '2026-11-03', happenPlace: '상주시 동문동', shelterName: '테스트 동물보호센터', imageUrl: '', age: '2025', weight: '4', images: [] };
  let searchCalls = 0;
  let similarCalls = 0;
  // Playwright는 나중에 등록한 경로를 먼저 맞춰 보므로, 그 밖의 API를 막는 경로를 먼저 등록한다.
  await page.route('**/api/v1/**', route => route.fulfill({ status: 404, json: {} }));
  await page.route('**/api/v1/animals/*/similar', route => { similarCalls++; return route.fulfill({ json: [] }); });
  await page.route(/\/api\/v1\/animals\/77$/, route => route.fulfill({ json: animal }));
  await page.route('**/api/v1/animals/lost-candidates', route => { searchCalls++; return route.fulfill({ json: { candidates: [] } }); });
  const shot = async (label, width, theme) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label} overflow at ${width} ${theme}`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `/tmp/lost-search-paused-${label}-${width}-${theme}.png`, fullPage: true });
  };
  const notes = [];
  for (const theme of ['light', 'dark']) {
    await page.goto('http://127.0.0.1:5189/');
    await page.evaluate(value => localStorage.setItem('pawbridge-theme', value), theme);
    for (const width of [1920, 390]) {
      // 폭을 바꾼 뒤 다시 열어야 고정 헤더가 전체 캡처에 반복되지 않는다.
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
      await page.goto('http://127.0.0.1:5189/animals/lost');
      const notice = page.getByRole('note').filter({ hasText: '사진 검색을 잠시 쉬고 있어요' });
      await notice.waitFor();
      notes.push(await notice.textContent());
      await page.getByLabel('실종동물 사진', { exact: true }).setInputFiles('tests/fixtures/lost-search.png');
      await page.getByAltText('선택한 실종동물 사진').waitFor();
      const button = page.getByRole('button', { name: '사진 검색 일시 중지 중' });
      check(await button.isDisabled(), 'search button must be disabled while paused');
      // 버튼이 꺼져 있어도 입력 칸에서 Enter로 폼이 제출되지 않아야 한다.
      await page.getByLabel('실종 지역').fill('상주시');
      await page.getByLabel('실종 지역').press('Enter');
      await page.getByText('사진 검색을 다시 열면 이곳에서 후보를 찾을 수 있어요').waitFor();
      await shot('search', width, theme);

      await page.goto('http://127.0.0.1:5189/animals/77');
      const similar = page.locator('section[aria-labelledby="similar-animals-title"] [role="note"]');
      await similar.waitFor({ timeout: 10_000 });
      notes.push(await similar.textContent());
      await shot('similar', width, theme);
    }
  }
  check(notes.every(text => text.includes('잠시 쉬고 있어요')), 'pause notice text missing');
  check(searchCalls === 0, `search API called ${searchCalls} times while paused`);
  check(similarCalls === 0, `similar API called ${similarCalls} times while paused`);
  return { screenshots: 8, searchCalls, similarCalls };
}
