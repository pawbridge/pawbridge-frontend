async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const photo = 'tests/fixtures/lost-search.png';
  const endpoint = '**/api/v1/animals/lost-candidates';
  const card = { animal: { id: 77, species: 'DOG', breed: '믹스견', gender: 'MALE', status: 'ADOPTED', happenDate: '2026-09-10', happenPlace: '상주시 동문동', shelterName: '테스트 동물보호센터', imageUrl: '/src/assets/image-placeholder.svg' }, shelterPhone: '02-000-0000', matchedEvidence: ['DISCOVERY_PLACE_TEXT_MATCH'] };
  let status = 200, payload = { candidates: [card] }, delay = false, requests = [];
  await page.route(endpoint, async route => {
    requests.push(route.request().postData());
    if (delay) await page.waitForTimeout(3000);
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) }).catch(() => {});
  });
  await page.goto('http://127.0.0.1:5184/animals/lost');
  await page.getByRole('heading', { level: 1 }).waitFor();
  check(await page.getByRole('button', { name: '사진으로 후보 찾기' }).isDisabled(), 'photo is required');
  const layouts = [];
  for (const width of [390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    const bounds = await page.evaluate(() => ({ viewport: innerWidth, body: document.documentElement.scrollWidth }));
    check(bounds.body <= bounds.viewport, `horizontal overflow at ${width}: ${JSON.stringify(bounds)}`);
    if (width >= 1280) {
      const left = await page.locator('#input-heading').boundingBox();
      const right = await page.locator('#result-heading').boundingBox();
      check(Math.abs(left.y - right.y) < 2, `unaligned headings at ${width}`);
    }
    layouts.push(bounds);
  }
  await page.getByLabel('실종동물 사진', { exact: true }).setInputFiles(photo);
  await page.getByAltText('선택한 실종동물 사진').waitFor();
  await page.getByLabel('실종 날짜', { exact: true }).fill('2026-09-08');
  await page.getByLabel('실종 지역', { exact: true }).fill('상주시');
  await page.getByLabel('털색·무늬·특징', { exact: true }).fill('갈색 귀');
  await page.getByRole('button', { name: '사진으로 후보 찾기' }).click();
  await page.getByRole('heading', { name: '확인할 후보 1마리' }).waitFor();
  check(requests[0].includes('name="region"') && requests[0].includes('상주시') && requests[0].includes('갈색 귀') && requests[0].includes('2026-09-08'), 'conditions were not transmitted');
  check(await page.getByText('종료 · 입양', { exact: true }).isVisible(), 'ended animal removed');
  check((await page.getByRole('link', { name: '보호소 문의', exact: false }).getAttribute('href')) === 'tel:020000000', 'shelter phone action missing');
  const photoBox = await page.getByAltText('선택한 실종동물 사진').locator('..').boundingBox();
  const cardBox = await page.locator('article').first().boundingBox();
  check(Math.abs(photoBox.y - cardBox.y) < 2, 'photo and candidate panels are not aligned');
  await page.screenshot({ path: '/tmp/lost-search-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'result mobile overflow');
  await page.screenshot({ path: '/tmp/lost-search-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  check(await page.getByRole('button', { name: '사진으로 후보 찾기' }).isDisabled(), 'deleted photo still submittable');
  check(await page.getByRole('heading', { name: '확인할 후보 1마리' }).count() === 0, 'old results remain after deleting photo');
  await page.getByLabel('실종동물 사진', { exact: true }).evaluate(input => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }));
    input.files = data.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.getByRole('alert').waitFor();
  check((await page.getByRole('alert').textContent()).includes('5MiB'), 'large file not rejected');
  await page.getByLabel('실종동물 사진', { exact: true }).setInputFiles(photo);
  await page.getByAltText('선택한 실종동물 사진').waitFor();
  status = 503;
  await page.getByRole('button', { name: '사진으로 후보 찾기' }).click();
  await page.getByRole('button', { name: '다시 시도하기' }).waitFor();
  check(await page.getByAltText('선택한 실종동물 사진').isVisible(), 'photo lost after upstream failure');
  check(await page.getByLabel('실종 지역', { exact: true }).inputValue() === '상주시', 'conditions lost after failure');
  status = 401;
  await page.getByRole('button', { name: '다시 시도하기' }).click();
  await page.getByRole('button', { name: '다시 시도하기' }).waitFor();
  check(page.url().endsWith('/animals/lost'), 'public search redirected to login');
  status = 200; payload = { candidates: [] };
  await page.getByRole('button', { name: '다시 시도하기' }).click();
  await page.getByText('이번 검색에서는 후보를 찾지 못했어요').waitFor();
  payload = { candidates: [card] }; delay = true;
  const beforeCancel = requests.length;
  await page.getByRole('button', { name: '사진으로 후보 찾기' }).click();
  await page.getByRole('button', { name: '검색 취소' }).click();
  await page.waitForTimeout(3500);
  check(await page.getByRole('heading', { name: '확인할 후보 1마리' }).count() === 0, 'cancelled request overwrote state');
  check(requests.length === beforeCancel + 1, 'cancel triggered an unintended new request');
  await page.getByRole('button', { name: '사진으로 후보 찾기' }).click();
  await page.getByLabel('실종 지역', { exact: true }).fill('다른 지역');
  await page.waitForTimeout(3500);
  check(await page.getByRole('heading', { name: '확인할 후보 1마리' }).count() === 0, 'old condition response overwrote state');
  return { result: 'PASS', layouts, requests: requests.length, checked: ['required photo', '4 responsive widths', 'column alignment', 'multipart conditions', 'ended candidates', 'phone link', 'delete invalidation', 'oversized file', '503 retry', '401 stays public', 'empty result', 'cancel race', 'condition race'] };
}
