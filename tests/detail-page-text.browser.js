// 모의 API로 상세 화면이 데이터를 받은 뒤 제목과 설명을 그 동물, 보호소 문구로 바꾸는지 본다.
// 주소만 보는 공통 문구로는 같은 품종 동물 상세가 구글에서 중복 페이지로 묶였다.
async page => {
  const origin = 'http://127.0.0.1:5276';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  page.on('pageerror', error => pageErrors.push(error.message));
  const animal = {
    id: 35798, species: 'DOG', breed: '믹스견', gender: 'MALE', age: 0, weight: '3.80(Kg)', color: '검정색',
    specialMark: '들개 자견으로 추정', status: 'PROTECT', shelterId: 294, shelterName: '한마음동물병원',
    apmsNoticeNo: '인천-서구-2026-00297', happenPlace: '오류동', happenDate: '2026-06-05',
  };
  const shelter = { id: 286, careRegNo: '327346201900001', name: '펫동물병원', organizationName: '대구광역시 수성구', address: '대구광역시 수성구 달구벌대로 3144', phone: '053-474-9820' };
  await page.route('**/*', async route => {
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(route.request().url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/')) return route.continue();
    if (path === '/api/v1/animals/35798') return route.fulfill({ status: 200, json: animal });
    if (path === '/api/v1/shelters/by-care-reg-no/327346201900001') return route.fulfill({ status: 200, json: shelter });
    if (path === '/api/v1/animals') return route.fulfill({ status: 200, json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });

  const description = () => page.evaluate(() => document.querySelector('meta[name="description"]')?.getAttribute('content'));
  const ogTitle = () => page.evaluate(() => document.querySelector('meta[property="og:title"]')?.getAttribute('content'));
  const waitTitle = (expected, name) => page.waitForFunction(value => document.title === value, expected)
    .then(() => assert(true, name), async () => assert(false, `${name}: ${await page.title()}`));

  await page.goto(origin + '/animals/35798');
  await waitTitle('믹스견 수컷 검정색, 인천 서구 보호 중 - 포우브릿지', 'animal-title');
  assert((await description()).startsWith('2026.06.05 인천 서구 오류동에서 구조된 믹스견'), 'animal-description: ' + await description());
  assert(await ogTitle() === '믹스견 수컷 검정색, 인천 서구 보호 중 - 포우브릿지', 'animal-og-title: ' + await ogTitle());

  await page.goto(origin + '/shelters/327346201900001');
  await waitTitle('펫동물병원, 대구광역시 수성구 동물보호소 - 포우브릿지', 'shelter-title');
  assert((await description()).includes('연락처 053-474-9820'), 'shelter-description: ' + await description());

  // 상세에서 앱 안에서 목록으로 나가면 목록 문구가 돌아와야 한다.
  await page.goto(origin + '/animals/35798');
  await waitTitle('믹스견 수컷 검정색, 인천 서구 보호 중 - 포우브릿지', 'animal-title-again');
  await page.evaluate(() => { window.history.pushState({}, '', '/animals'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await waitTitle('보호 동물 검색 - 포우브릿지', 'list-title-restored');
  assert((await description()).startsWith('지역, 동물 종류, 특징으로'), 'list-description-restored: ' + await description());

  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return { checks };
}
