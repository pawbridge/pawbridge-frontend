// 실종동물 검색의 대기·0건 화면과 공고 상세의 비슷한 동물 오류 화면에
// "막 등록된 공고는 반영까지 시간이 걸릴 수 있다"는 안내가 보이는지 확인하고
// PR 캡처용으로 1920·390px 화면을 /tmp/lost-search-notice-*.png 에 남긴다. 모의 응답만 쓴다.
async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const animal = { id: 77, species: 'DOG', breed: '믹스견', gender: 'MALE', status: 'PROTECT', happenDate: '2026-11-03', happenPlace: '상주시 동문동', shelterName: '테스트 동물보호센터', imageUrl: '', age: '2025', weight: '4', images: [] };
  const pending = '반영되기까지 시간이 걸릴 수 있어요';
  let similarCalls = 0;
  // Playwright는 나중에 등록한 경로를 먼저 맞춰 보므로, 그 밖의 API를 막는 경로를 먼저 등록한다.
  await page.route('**/api/v1/**', route => route.fulfill({ status: 404, json: {} }));
  await page.route('**/api/v1/animals/*/similar', route => { similarCalls++; return route.fulfill({ status: 503, json: { message: '추천을 준비하지 못했어요.' } }); });
  await page.route(/\/api\/v1\/animals\/77$/, route => route.fulfill({ json: animal }));
  await page.route('**/api/v1/animals/lost-candidates', route => route.fulfill({ json: { candidates: [] } }));
  const widths = [1920, 390];
  const shot = async (label, width) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label} overflow at ${width}`);
    // 결과 제목으로 스크롤된 상태에서 전체 캡처를 하면 고정 헤더가 반복되므로 맨 위로 올린 뒤 찍는다.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `/tmp/lost-search-notice-${label}-${width}.png`, fullPage: true });
  };

  await page.goto('http://127.0.0.1:5187/animals/lost');
  await page.getByRole('heading', { level: 1 }).waitFor();
  const idle = page.getByText('사진을 선택하고 후보를 찾아보세요').locator('..');
  for (const width of widths) await shot('idle', width);
  const idleText = await idle.textContent();

  await page.getByLabel('실종동물 사진', { exact: true }).setInputFiles('tests/fixtures/lost-search.png');
  await page.getByAltText('선택한 실종동물 사진').waitFor();
  await page.getByRole('button', { name: '사진으로 후보 찾기' }).click();
  const empty = page.getByText('이번 검색에서는 후보를 찾지 못했어요').locator('..');
  await empty.waitFor();
  for (const width of widths) await shot('empty', width);
  const emptyText = await empty.textContent();

  // 상세 화면은 폭을 바꾼 뒤 다시 열어야 고정 헤더가 전체 캡처에 반복되지 않는다.
  const alert = page.locator('section[aria-labelledby="similar-animals-title"] [role="alert"]');
  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    await page.goto('http://127.0.0.1:5187/animals/77');
    await alert.waitFor({ timeout: 10_000 });
    await page.getByRole('button', { name: '다시 시도' }).waitFor();
    await shot('similar', width);
  }
  // 문구 확인은 캡처를 모두 남긴 뒤에 한다. 변경 전 소스로 돌려도 비교용 캡처는 그대로 나온다.
  const alertText = await alert.textContent();
  check(idleText.includes(pending), 'idle notice missing');
  check(emptyText.includes(pending), 'empty-result notice missing');
  check(alertText.includes('반영까지 시간이 걸릴 수 있어요'), 'similar-animals notice missing');
  check(similarCalls >= 1, 'similar animals endpoint was not called');
  return { similarCalls, screenshots: 6 };
}
