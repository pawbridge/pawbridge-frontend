async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const expected = ['/animals', '/animals/lost', '/shelters', '/animals/stats', '/travel', '/adoption', '/community'];
  const animals = [77, 78].map(id => ({ id, species: 'DOG', breed: `후보 ${id}`, gender: 'MALE', status: 'PROTECT', happenDate: '2026-09-10', happenPlace: '상주시', shelterName: '테스트 보호소', imageUrl: '/src/assets/image-placeholder.svg', age: '2026', weight: '2', images: [] }));
  let searches = 0;
  await page.route('**/api/animals/*/similar', route => route.fulfill({ json: [] }));
  await page.route(/\/api\/animals\/(77|78)$/, route => route.fulfill({ json: animals.find(x => route.request().url().endsWith('/' + x.id)) }));
  await page.route('**/api/v1/animals/lost-candidates', route => {
    searches++;
    return route.fulfill({ json: { candidates: animals.map(animal => ({ animal, matchedEvidence: [] })) } });
  });
  await page.goto('http://127.0.0.1:5187/animals/lost');
  await page.setViewportSize({ width: 1920, height: 1080 });
  check(JSON.stringify(await page.locator('header nav').first().locator('a').evaluateAll(xs => xs.map(x => x.getAttribute('href')))) === JSON.stringify(expected), 'desktop menu order');
  await page.getByLabel('실종동물 사진', { exact: true }).setInputFiles('tests/fixtures/lost-search.png');
  await page.getByAltText('선택한 실종동물 사진').waitFor();
  await page.getByLabel('실종 날짜', { exact: true }).fill('2026-09-08');
  await page.getByLabel('실종 지역', { exact: true }).fill('상주시');
  await page.getByLabel('털색·무늬·특징', { exact: true }).fill('갈색 귀');
  await page.getByLabel('입양·반환된 동물도 포함', { exact: true }).check();
  await page.getByRole('button', { name: '사진으로 후보 찾기', exact: true }).click();
  await page.getByRole('heading', { name: '확인할 후보 2마리' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  const firstDetail = page.getByRole('link', { name: '공고 상세 보기', exact: true }).first();
  await firstDetail.scrollIntoViewIfNeeded();
  const beforeY = await page.evaluate(() => scrollY);
  await firstDetail.click();
  await page.waitForURL('**/animals/77');
  await page.getByRole('button', { name: '실종 검색 결과', exact: true }).waitFor();
  await page.goBack();
  await page.waitForURL('**/animals/lost');
  await page.getByRole('heading', { name: '확인할 후보 2마리' }).waitFor();
  try { await page.waitForFunction(y => Math.abs(scrollY - y) < 4, beforeY, {timeout: 5000}); }
  catch { throw new Error('Scroll restoration: expected ' + beforeY + ', actual ' + await page.evaluate(() => scrollY)); }
  check(await page.getByLabel('실종 날짜', { exact: true }).inputValue() === '2026-09-08', 'date not restored');
  check(await page.getByLabel('실종 지역', { exact: true }).inputValue() === '상주시', 'region not restored');
  check(await page.getByLabel('털색·무늬·특징', { exact: true }).inputValue() === '갈색 귀', 'description not restored');
  check(await page.getByLabel('입양·반환된 동물도 포함', { exact: true }).isChecked(), 'status option not restored');
  check(await page.getByAltText('선택한 실종동물 사진').count() === 1, 'photo not restored');
  check(searches === 1, 'back reran GPU search');
  await page.getByRole('link', { name: '공고 상세 보기', exact: true }).nth(1).click();
  await page.waitForURL('**/animals/78');
  await page.getByRole('button', { name: '실종 검색 결과', exact: true }).click();
  await page.waitForURL('**/animals/lost');
  await page.getByRole('heading', { name: '확인할 후보 2마리' }).waitFor();
  check(searches === 1, 'detail return reran GPU search');
  await page.getByRole('button', { name: '메뉴 열기', exact: true }).click();
  check(JSON.stringify(await page.locator('#mobile-navigation a').evaluateAll(xs => xs.map(x => x.getAttribute('href')).filter(x => x !== '/login'))) === JSON.stringify(expected), 'mobile menu order');
  await page.getByRole('button', { name: '메뉴 닫기', exact: true }).click();
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile overflow');
  await page.locator('header').getByRole('link', { name: /PawBridge/ }).click();
  await page.getByRole('button', { name: '메뉴 열기', exact: true }).click();
  await page.locator('#mobile-navigation').getByRole('link', { name: '실종동물 찾기', exact: true }).click();
  check(await page.getByRole('button', { name: '사진으로 후보 찾기', exact: true }).isDisabled(), 'new entry reused previous photo');
  check(await page.getByRole('heading', { name: '확인할 후보 2마리' }).count() === 0, 'new entry reused previous results');
  return { result: 'PASS', searches, restoredScrollY: beforeY, checked: ['desktop/mobile menu order', 'browser-back photo conditions status option results scroll without search', 'second candidate and detail return', 'new entry isolation'] };
}
