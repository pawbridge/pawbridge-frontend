// Frontend-only contract: synthetic API responses, no credentials or provider calls.
async page => {
  const checks=[];
  const check=(ok,label)=>{if(!ok)throw new Error(label);checks.push(label);};
  const place={contentId:'123',title:'기본 정보만 있는 공원',address:'서울 테스트 주소',imageUrl:null};
  const time='2026-09-12T00:00:00Z';
  let status='PREPARING';
  await page.route('**/api/**',route=>{
    const path='/api/'+route.request().url().split('/api/')[1].split('?')[0];
    if(path==='/api/places/regions')return route.fulfill({json:{items:[{code:'11',name:'서울'}],fetchedAt:time,availability:'READY'}});
    if(path==='/api/places')return route.fulfill({json:{areaCode:'11',items:[place],previewOnly:true,fetchedAt:null,availability:'PARTIAL'}});
    if(path==='/api/places/123')return route.fulfill({json:{place,overview:null,
      conditions:{areas:null,allowedAnimals:null,requirements:null,otherInformation:null,risks:null,facilities:null,providedItems:null},
      petInformationAvailable:false,petInformationStatus:status,source:'KOREA_TOURISM_ORGANIZATION',fetchedAt:time,
      petInformationFetchedAt:status==='READY'||status==='STALE'?time:null}});
    return route.abort();
  });
  for(const width of [1440,375]){
    await page.setViewportSize({width,height:900});
    await page.goto('http://127.0.0.1:5197/travel?areaCode=11');
    await page.getByRole('heading',{name:place.title,exact:true}).waitFor();
    check(await page.getByText('현재 수집된 장소부터 보여드리고 있어요.',{exact:false}).isVisible(),'partial list notice '+width);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'list width '+width);
    for(const [state,text] of [['PREPARING','동반 조건 확인 중입니다.'],['FAILED','동반 조건을 아직 확보하지 못했습니다.'],
      ['READY','제공된 동반 조건 정보가 없습니다.'],['STALE','동반 조건을 다시 확인 중입니다.']]){
      status=state;
      await page.goto('http://127.0.0.1:5197/travel/123?areaCode=11');
      await page.getByText(text,{exact:false}).waitFor();
      check(await page.getByRole('heading',{name:place.title,exact:true}).isVisible(),'basic detail '+state+' '+width);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'detail width '+state+' '+width);
      if(state!=='PREPARING')check(await page.getByText('동반 조건 확인 중입니다.',{exact:false}).count()===0,'no pending notice '+state+' '+width);
    }
  }
  return {passed:checks.length,checks};
}
