// playwright-cli run-code --filename=tests/shelter-discovery.browser.js
// Only mock API responses. No real account or application mutations.
async page => {
  await page.unroute('**/api/**');
  const requests = [];
  let mode = 'normal';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const before = new Date(`${today}T00:00:00Z`); before.setUTCDate(before.getUTCDate() - 29);
  const from = before.toISOString().slice(0, 10);
  const sample = { id: 1, careRegNo: '311100000000001', name: '마포 동물보호센터', address: '서울특별시 마포구', phone: '02-1234-5678', protectedCount: 12,
    animals: [1,2,3].map(id => ({ id, breed: id === 2 ? '한국 고양이' : '믹스견', species: 'DOG', gender: 'MALE', birthYear: 2024, imageUrl: null, happenDate: today })) };
  const paged = (content, count = content.length) => ({ content, totalElements: count, totalPages: count > 12 ? 2 : 1, number: 0, size: 12 });
  await page.route('**/api/**', async route => {
    const path = route.request().url().replace(/^https?:\/\/[^/]+/, '');
    const url = { pathname: path.split('?')[0], search: path.includes('?') ? '?' + path.split('?')[1] : '' };
    if (!url.pathname.startsWith('/api/')) return route.continue();
    requests.push(url.pathname + url.search);
    if (route.request().method() !== 'GET') throw Error('Unexpected mutation');
    if (url.pathname === '/api/shelters/discovery') return route.fulfill({ status: mode === 'error' ? 500 : 200, json: mode === 'error' ? {} : paged(mode === 'empty' ? [] : [sample, { ...sample, id: 2, name: '강동 동물보호센터', protectedCount: 8 }], mode === 'empty' ? 0 : 14) });
    if (url.pathname.endsWith('/observations')) return route.fulfill({ json: [{ date: from, observedAt: `${from}T04:00:00+09:00`, protectedCount: 12 }, { date: today, observedAt: `${today}T04:00:00+09:00`, protectedCount: 0 }] });
    if (url.pathname === '/api/shelters/1') return route.fulfill({ json: sample });
    if (url.pathname === '/api/animals') return route.fulfill({ json: paged(sample.animals.map(a => ({ ...a, status: 'PROTECT', shelterId: 1, shelterName: sample.name, apmsNoticeNo: '서울-마포-2026-00001' }))) });
    return route.fulfill({ json: {} });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:5198/shelters');
  await page.getByRole('heading', { name: sample.name, exact: true }).waitFor();
  if (requests.some(url => url.includes('/observations'))) throw Error('History eagerly fetched');
  await page.getByRole('button', { name: '보호 현황 펼치기 +' }).first().click();
  await page.getByRole('img', { name: /최근 30일 일별/ }).waitFor();
  await page.getByText('날짜별 수치와 관측 시각 보기', { exact: true }).click();
  if (!(await page.getByRole('cell', { name: '기록 없음', exact: true }).count())) throw Error('Missing days were fabricated');
  await page.getByRole('cell', { name: '0마리', exact: true }).waitFor();
  await page.screenshot({ path: '/tmp/pawbridge-shelter-desktop.png', fullPage: true });
  await page.getByRole('button', { name: '2페이지', exact: true }).click();
  await page.waitForURL('**page=1**');
  await page.getByRole('link', { name: '이 보호소 동물 보기 →' }).first().click();
  await page.getByRole('heading', { name: '이 보호소의 동물을 만나보세요' }).waitFor();
  await page.getByRole('heading', { name: /검색 결과 3마리/ }).waitFor();
  const animalRequest = [...requests].reverse().find(url => url.startsWith('/api/animals?'));
  const animalParams = Object.fromEntries(animalRequest.split('?')[1].split('&').map(part => part.split('=').map(decodeURIComponent)));
  for (const [key, value] of [['shelterId', '1'], ['intakeFrom', from], ['intakeTo', today], ['status', 'PROTECT']]) if (animalParams[key] !== value) throw Error(`Lost API context: ${key}`);
  await page.screenshot({ path: '/tmp/pawbridge-shelter-search-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Mobile search overflow');
  if (!await page.getByRole('button', { name: '보호중', exact: true }).isDisabled()) throw Error('Protection scope can be changed');
  await page.screenshot({ path: '/tmp/pawbridge-shelter-search-mobile.png', fullPage: true });
  await page.getByRole('link', { name: '← 보호소 목록으로' }).click();
  if (!page.url().includes('page=1')) throw Error('Lost shelter page on return');
  await page.getByRole('heading', { name: sample.name, exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '보호 현황 펼치기 +' }).first().click();
  await page.getByRole('img', { name: /최근 30일 일별/ }).waitFor();
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Mobile overflow');
  await page.screenshot({ path: '/tmp/pawbridge-shelter-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '직접 선택', exact: true }).click();
  await page.getByLabel('접수 시작일', { exact: true }).fill('2026-09-10');
  await page.getByLabel('접수 종료일', { exact: true }).fill('2026-09-01');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await page.getByRole('alert').waitFor();
  mode = 'empty'; await page.reload();
  await page.getByRole('heading', { name: '조건에 맞는 보호소가 없어요' }).waitFor();
  mode = 'error'; await page.reload();
  await page.getByRole('heading', { name: '보호소를 불러오지 못했어요' }).waitFor();
  mode = 'normal'; await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await page.getByRole('heading', { name: sample.name, exact: true }).waitFor();
  return { passed: ['desktop', 'mobile-no-overflow', 'lazy-history', 'missing-vs-zero', 'animal-api-date-contract', 'list-return', 'invalid-range', 'empty', 'error-retry'], requests: requests.length };
}
