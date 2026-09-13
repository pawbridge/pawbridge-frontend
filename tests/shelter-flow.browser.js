// Playwright CLI run-code file. Uses isolated mock API responses; never sends live mutations.
async page => {
 await page.unroute('**/api/**');
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 const user={id:10,userId:10,createdAt:'2026-09-01T10:00:00',nickname:'담당자',provider:'LOCAL',email:'member@example.invalid',name:'예시 담당자',role:'ROLE_USER'};
 let status='PENDING'; let created=false; let decisionCount=0;
 const application=()=>({id:5,userId:10,shelterName:'포우 동물보호센터',status,requestedAt:'2026-09-13T10:00:00',reviewedAt:status==='PENDING'?null:'2026-09-13T11:00:00',reason:status==='REJECTED'?'소속을 확인해 주세요.':null,careRegNo:status==='APPROVED'?'123':null});
 const admin=()=>({application:application(),applicantName:user.name,applicantEmail:user.email,reviewNote:'공식 연락처로 확인'});
 const paged=content=>({content,totalElements:content.length,totalPages:1,number:0,size:20,first:true,last:true,empty:content.length===0});
 const shelter={id:2,careRegNo:'123',name:'포우 동물보호센터',address:'서울특별시 예시구 보호로 12',organizationName:'서울특별시 예시구'};
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=req.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];if(!path.startsWith('/api/')) return route.continue(); let data={};let enveloped=true;
  if(path==='/api/users/me')data=user;
  else if(path==='/api/users/me/shelter-applications'){if(req.method()==='POST'){const body=req.postDataJSON();if(body.shelterName!=='포우 동물보호센터')throw Error('Unexpected shelter input');created=true;status='PENDING';data=application();}else data=paged(created?[application()]:[]);}
  else if(path.endsWith('/approve')){decisionCount++;const body=req.postDataJSON();if(body.careRegNo!=='123'||body.note!=='공식 연락처로 확인')throw Error('Wrong approve payload');status='APPROVED';data=admin();}
  else if(path.endsWith('/reject')){decisionCount++;status='REJECTED';data=admin();}
  else if(path==='/api/admin/users/shelter-applications/5')data=admin();
  else if(path==='/api/admin/users/shelter-applications')data=paged([admin()]);
  else if(path==='/api/shelters'){data=paged([shelter]);enveloped=false;}
  else if(path==='/api/shelters/by-care-reg-no/123'){data=shelter;enveloped=false;}
  else if(path==='/api/admin/users/shelters/123/members')data=paged([{userId:10,name:user.name,email:user.email,approvalApplicationId:5}]);
  else data=[];
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(enveloped?{code:200,data}:data)});
 });
 await page.goto('http://127.0.0.1:5194/login');
 await page.evaluate(user=>{localStorage.setItem('auth-storage',JSON.stringify({state:{user,accessToken:'test-only-token',refreshToken:'test-only-refresh'},version:0}));sessionStorage.setItem('mypageActiveTab','shelter');},user);
 await page.goto('http://127.0.0.1:5194/mypage');
 await page.getByLabel('소속 보호소 이름').fill('포우 동물보호센터');
 await page.getByRole('button',{name:'담당자 신청하기',exact:true}).click();
 await page.getByText('신청을 검토하고 있습니다.',{exact:false}).waitFor();
 if(await page.getByRole('button',{name:'담당자 신청하기',exact:true}).count())throw Error('Pending application form still visible');
 await page.evaluate(()=>{const auth=JSON.parse(localStorage.getItem('auth-storage'));auth.state.user.role='ROLE_ADMIN';localStorage.setItem('auth-storage',JSON.stringify(auth));});
 await page.goto('http://127.0.0.1:5194/admin/shelter-applications');
 await page.getByRole('link',{name:'신청 상세 보기'}).click();
 await page.getByLabel('연결할 보호소 등록번호').fill('123');await page.getByLabel('확인 메모',{exact:true}).fill('공식 연락처로 확인');
 await page.getByRole('button',{name:'확인 후 승인하기'}).click();
 if(decisionCount!==0)throw Error('Approval submitted before confirmation');
 await page.getByRole('button',{name:'확인하고 승인',exact:true}).click();
 await page.getByRole('heading',{name:'처리 결과'}).waitFor();if(decisionCount!==1)throw Error('Unexpected approval count');
 await page.getByRole('link',{name:'연결된 보호소 상세 보기'}).click();
 await page.getByRole('heading',{name:'연결된 담당자',exact:true}).waitFor();await page.getByRole('link',{name:'승인 내역 보기'}).waitFor();
 await page.setViewportSize({width:1920,height:1080});await page.screenshot({path:'/tmp/shelter-detail-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/shelter-detail-mobile.png',fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile horizontal overflow');
 await page.getByRole('link',{name:'← 보호소 목록으로'}).click();await page.getByLabel('보호소 검색').fill('포우');await page.getByRole('button',{name:'검색',exact:true}).click();await page.getByRole('link',{name:'상세 보기',exact:true}).click();await page.getByRole('link',{name:'← 보호소 목록으로'}).click();if(!page.url().includes('keyword='))throw Error('Search state lost');
 status='PENDING';await page.goto('http://127.0.0.1:5194/admin/shelter-applications/5');await page.getByRole('button',{name:'반려 사유 작성하기'}).click();await page.getByLabel('반려 사유',{exact:true}).fill('소속을 확인해 주세요.');await page.getByRole('button',{name:'사유 전달하고 반려'}).click();await page.getByRole('heading',{name:'처리 결과'}).waitFor();
 await page.evaluate(user=>localStorage.setItem('auth-storage',JSON.stringify({state:{user,accessToken:'test-only-token'},version:0})),user);
 await page.goto('http://127.0.0.1:5194/mypage');await page.getByRole('button',{name:'내용 보완하고 다시 신청'}).click();if(await page.getByLabel('소속 보호소 이름').inputValue()!=='포우 동물보호센터')throw Error('Resubmit name not preserved');
 await page.getByRole('button',{name:'담당자 신청하기',exact:true}).click();await page.getByText('신청을 검토하고 있습니다.',{exact:false}).waitFor();
 if(errors.length)throw Error(errors.join('\n'));
 return {passed:['신청 및 중복 폼 차단','승인 확인 후 단일 요청','보호소 상세와 연결 담당자','390px 가로 넘침 없음','검색 상태 복귀','반려 후 이름 유지 재신청'],decisionCount,pageErrors:errors};
}
