// Frontend-only image rendering contract. API and image responses are synthetic.
// No TourAPI key, real API, Java server or remote photo download is used.
async page => {
  const checks = [];
  const check = (value, name) => { if (!value) throw new Error(name); checks.push(name); };
  const imageUrl = 'https://tong.visitkorea.or.kr/cms/resource/1/fixture.jpg';
  const place = {contentId:'123',title:'이미지 검증용 가상 장소',address:'테스트 지역',imageUrl};
  const fetchedAt = '2026-09-11T00:00:00Z';
  let failImage = false;
  await page.route('**/cms/resource/**', route => failImage
    ? route.fulfill({status:404,body:''})
    : route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#9ac5ae"/></svg>'}));
  await page.route('**/api/**', route => {
    const path = '/api/' + route.request().url().split('/api/')[1].split('?')[0];
    if (path === '/api/places/regions') return route.fulfill({json:{items:[{code:'11',name:'서울'}],fetchedAt}});
    if (path === '/api/places') return route.fulfill({json:{areaCode:'11',items:[place,{...place,contentId:'124',title:'사진 없는 장소',imageUrl:null}],previewOnly:true,fetchedAt}});
    if (path === '/api/places/123') return route.fulfill({json:{place,overview:null,conditions:{areas:null,allowedAnimals:null,requirements:null,otherInformation:null,risks:null,facilities:null,providedItems:null},petInformationAvailable:false,source:'KOREA_TOURISM_ORGANIZATION',fetchedAt,petInformationFetchedAt:fetchedAt}});
    return route.abort();
  });
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:5197/travel?areaCode=11');
  const photo = page.getByAltText('이미지 검증용 가상 장소 장소 사진');
  await photo.waitFor();
  await photo.evaluate(img => img.decode());
  check(await page.locator('figcaption').count() === 0
    && await page.getByText('관광정보·사진 제공:',{exact:false}).count() === 1, 'list has one shared credit instead of repeated photo captions');
  check(await page.getByText('사진 준비 중',{exact:true}).count() === 1, 'missing photo keeps fallback');
  check(await photo.getAttribute('loading') === 'lazy', 'list photo is lazy');
  check(await photo.getAttribute('referrerpolicy') === 'no-referrer', 'photo omits page referrer');
  check(await photo.evaluate(img => getComputedStyle(img).objectFit) === 'contain', 'whole photo and watermark remain visible');
  const box = await photo.boundingBox();
  check(Math.abs(box.width / box.height - 4/3) < .02, 'photo frame remains four by three');
  check(await page.getByRole('link',{name:'저작권 정책',exact:true}).getAttribute('href') === 'https://api.visitkorea.or.kr/#/useServiceGuide/2', 'official policy link present');
  check(await page.locator('a a').count() === 0, 'card does not nest credit links');
  await page.getByRole('heading',{name:place.title,exact:true}).click();
  await page.waitForURL('**/travel/123?areaCode=11');
  await page.locator('article img').waitFor();
  check(await photo.getAttribute('loading') === 'eager', 'detail photo is eager');
  await page.setViewportSize({width:375,height:812});
  check(await page.evaluate(() => document.documentElement.scrollWidth <= 375), 'mobile image and credit do not overflow');
  failImage = true;
  await page.reload();
  await page.getByText('사진 준비 중',{exact:true}).waitFor();
  check(await page.locator('figcaption').count() === 0
    && await page.getByText('관광정보·사진 제공:',{exact:false}).count() === 1, 'detail keeps one shared source even when photo fails');
  check(await page.getByRole('heading',{name:place.title,exact:true}).count() === 1, 'image failure keeps place detail');
  return {count:checks.length,checks,apiMock:true,imageMock:true,productionDeployment:false};
}
