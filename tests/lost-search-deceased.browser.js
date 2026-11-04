// 사진으로 찾기 v1.1(Figma 페이지 86): 검색 범위 체크박스 2개와 "보호 중 사망한 기록" 구역.
// 상태 B(사망 꺼짐, 끝 안내), C(사망 켬, 결과), D(살아 있는 후보 0건), E(사망 기록 0건)를 확인하고
// PR 캡처용으로 1920, 390px 화면을 /tmp/lost-search-deceased-*.png 에 남긴다. C는 다크 모드도 남긴다. 모의 응답만 쓴다.
async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const card = (id, status, breed, gender, happenDate, happenPlace, shelterName) => ({
    animal: { id, species: 'DOG', breed, gender, status, happenDate, happenPlace, shelterName, imageUrl: '' },
    shelterPhone: '000-0000-0000', matchedEvidence: ['FOUND_ON_OR_AFTER_LOST_DATE'],
  });
  const living = [
    card(1, 'PROTECT', '믹스견', 'MALE', '2026-10-29', '상주시 동문동 인근', '상주시 동물보호센터'),
    card(2, 'PROTECT', '진돗개', 'FEMALE', '2026-10-30', '상주시 남성동', '상주시 동물보호센터'),
    card(3, 'NOTICE', '믹스견', 'FEMALE', '2026-11-01', '문경시 점촌동', '문경시 유기동물보호소'),
    card(4, 'ADOPTED', '믹스견', 'MALE', '2026-10-12', '상주시 화서면', '상주시 동물보호센터'),
    card(5, 'DONATED', '풍산개', 'MALE', '2026-10-08', '의성군 의성읍', '의성군 동물보호센터'),
    card(6, 'RETURNED', '믹스견', 'FEMALE', '2026-10-20', '상주시 함창읍', '상주시 동물보호센터'),
  ];
  const deceased = [
    card(11, 'NATURAL_DEATH', '믹스견', 'MALE', '2026-10-02', '상주시 공성면', '상주시 동물보호센터'),
    card(12, 'EUTHANIZED', '믹스견', 'FEMALE', '2026-09-18', '김천시 아포읍', '김천시 동물보호센터'),
    card(13, 'NATURAL_DEATH', '진돗개', 'MALE', '2026-09-27', '상주시 외서면', '상주시 동물보호센터'),
  ];
  let payload = {}, requests = [];
  await page.route('**/api/v1/animals/lost-candidates', route => {
    requests.push(route.request().postData());
    return route.fulfill({ json: payload });
  });
  const shot = async (label, widths = [1920, 390]) => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label} overflow at ${width}`);
      // 결과 제목으로 스크롤된 상태에서 전체 캡처를 하면 고정 헤더가 반복되므로 맨 위로 올린 뒤 찍는다.
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(200);
      await page.screenshot({ path: `/tmp/lost-search-deceased-${label}-${width}.png`, fullPage: true });
    }
  };
  const search = async (heading) => {
    await page.getByRole('button', { name: '사진으로 후보 찾기' }).click();
    await page.getByRole('heading', { name: heading }).waitFor();
  };
  const deceasedOption = page.getByLabel('보호 중 사망한 기록도 확인', { exact: true });
  const section = page.locator('section[aria-labelledby="deceased-heading"]');
  const hint = page.getByText('찾는 동물이 없나요?', { exact: true });

  await page.goto('http://127.0.0.1:5187/animals/lost');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.getByLabel('실종동물 사진', { exact: true }).setInputFiles('tests/fixtures/lost-search.png');
  await page.getByAltText('선택한 실종동물 사진').waitFor();
  await page.getByLabel('실종 날짜', { exact: true }).fill('2026-11-01');
  await page.getByLabel('실종 지역', { exact: true }).fill('상주시 동문동');
  await page.getByLabel('보호소를 떠난 동물도 포함', { exact: true }).check();
  check(!await deceasedOption.isChecked(), 'deceased option should default to false');

  // B: 사망 꺼짐. 서버가 사망 기록을 보내도 쓰지 않고, 끝에 두 번째 체크박스 안내가 나온다.
  payload = { candidates: living, deceasedCandidates: deceased };
  await search('확인할 후보 6마리');
  check(await hint.isVisible() && await section.count() === 0, 'B: end hint missing or deceased section shown');
  check(await page.getByText('종료(기증)', { exact: true }).isVisible(), 'B: donated label missing');
  await shot('b');

  // C: 사망 켬. 체크박스를 바꾸면 이전 결과를 지우고, 다시 찾으면 후보 아래에 사망 기록 구역이 따로 나온다.
  await deceasedOption.check();
  check(await page.getByRole('heading', { name: '확인할 후보 6마리' }).count() === 0, 'C: option did not invalidate old results');
  await search('보호 중 사망한 기록 3건');
  check(/name="includeDeceased"\r\n\r\ntrue/.test(requests.at(-1)), 'C: deceased option was not transmitted');
  check(await section.locator('article').count() === 3 && await page.locator('article').count() === 9, 'C: cards were mixed or missing');
  check(await section.getByText('종료(안락사)', { exact: true }).isVisible(), 'C: euthanized label missing');
  check(await hint.count() === 0, 'C: end hint should be hidden');
  await shot('c');
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await shot('c-dark');
  await page.evaluate(() => document.documentElement.classList.remove('dark'));

  // D: 살아 있는 후보 0건이어도 사망 기록 구역은 나온다.
  payload = { candidates: [], deceasedCandidates: deceased.slice(0, 2) };
  await deceasedOption.uncheck(); await deceasedOption.check();
  await search('보호 중 사망한 기록 2건');
  check(await page.getByText('이번 검색에서는 후보를 찾지 못했어요').isVisible(), 'D: empty living result missing');
  await shot('d');

  // E: 사망 기록 0건. 이전 서버처럼 필드가 없는 응답도 0건으로 본다.
  payload = { candidates: living };
  await deceasedOption.uncheck(); await deceasedOption.check();
  await search('보호 중 사망한 기록 0건');
  check(await section.getByText('닮은 동물을 찾지 못했어요', { exact: false }).isVisible(), 'E: empty deceased message missing');
  await shot('e');

  // 사망 기록이 10건을 넘으면 계약 위반으로 보고 결과를 그리지 않는다.
  payload = { candidates: living, deceasedCandidates: Array.from({ length: 11 }, (_, i) => card(100 + i, 'EUTHANIZED', '믹스견', 'MALE', '', '', '')) };
  await deceasedOption.uncheck(); await deceasedOption.check();
  await page.getByRole('button', { name: '사진으로 후보 찾기' }).click();
  await page.getByRole('alert').waitFor();
  check(await section.count() === 0, 'oversized deceased list was rendered');
  return { requests: requests.length, screenshots: 10 };
}
