// Playwright CLI run-code file. Uses isolated mock API responses; never sends live mutations.
async page => {
 await page.unroute('**/api/**');
 const user={id:1,email:'admin@example.invalid',name:'관리자',role:'ROLE_ADMIN'};
 let failMembers=true,conflict=false,approved=false;
 const a=()=>({id:5,userId:10,shelterName:'포우',status:approved?'APPROVED':'PENDING',requestedAt:'2026-09-13T10:00:00',reviewedAt:null,reason:null,careRegNo:approved?'123':null});
 const admin=()=>({application:a(),applicantName:'담당자',applicantEmail:'member@example.invalid',reviewNote:'확인'});
 const paged=content=>({content,totalElements:content.length,totalPages:1,number:0,size:20});
 await page.route('**/api/**',async r=>{
  const path=r.request().url().replace(/^https?:\/\/[^/]+/,'').split('?')[0];if(!path.startsWith('/api/'))return r.continue();
  if(path.endsWith('/members'))return r.fulfill({status:failMembers?500:200,contentType:'application/json',body:JSON.stringify(failMembers?{}:{data:paged([{userId:10,name:'이전 담당자',email:'legacy@example.invalid',approvalApplicationId:null}])})});
  if(path.endsWith('/approve')){conflict=true;approved=true;return r.fulfill({status:409,contentType:'application/json',body:'{}'});}
  const data=path==='/api/shelters/by-care-reg-no/123'?{id:2,careRegNo:'123',name:'포우'}:path.endsWith('/5')?{data:admin()}:{data:paged([])};
  await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5194/login');await page.evaluate(user=>localStorage.setItem('auth-storage',JSON.stringify({state:{user,accessToken:'test-only-token'},version:0})),user);
 await page.goto('http://127.0.0.1:5194/admin/shelters/123');await page.getByRole('alert').waitFor({timeout:20000});if(await page.getByText('연결된 담당자가 없습니다.',{exact:false}).count())throw Error('Failure rendered as empty data');
 failMembers=false;await page.getByRole('button',{name:'다시 불러오기'}).click();await page.getByText('legacy@example.invalid').waitFor();if(await page.getByRole('link',{name:'승인 내역 보기'}).count())throw Error('Invented legacy approval');
 await page.goto('http://127.0.0.1:5194/admin/shelter-applications/5');await page.getByLabel('연결할 보호소 등록번호').fill('123');await page.getByLabel('확인 메모',{exact:true}).fill('확인');await page.getByRole('button',{name:'확인 후 승인하기'}).click();await page.getByRole('button',{name:'확인하고 승인',exact:true}).click();await page.getByRole('alert').waitFor();await page.getByRole('heading',{name:'처리 결과'}).waitFor();if(!conflict||await page.getByRole('button',{name:'확인하고 승인',exact:true}).count())throw Error('Conflict did not reload result');
 await page.evaluate(()=>{const auth=JSON.parse(localStorage.getItem('auth-storage'));auth.state.user.role='ROLE_USER';localStorage.setItem('auth-storage',JSON.stringify(auth));});await page.goto('http://127.0.0.1:5194/admin/shelters');await page.getByText('접근 권한이 없습니다',{exact:true}).waitFor();
 return {passed:['담당자 조회 오류와 빈 상태 구분','조회 재시도 성공','기존 계정의 승인 이력 없음','409 충돌 후 최신 상태 재조회','일반 회원 관리자 진입 차단']};
}
