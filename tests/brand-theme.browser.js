// Vite on 127.0.0.1:5195. Public API contracts are mocked; no live writes.
// Checks rendered brand text contrast and overflow in 9 routes, 2 sizes, 2 themes.
async page => {
 await page.unroute('**/api/**');
 const errors=[]; const onError=e=>errors.push(e.message); page.on('pageerror',onError);
 const seen=[];
 await page.route('**/api/**',async route=>{
  const req=route.request(); const relative=req.url().replace(/^https?:\/\/[^/]+/, '');const u={pathname:relative.split('?')[0],search:relative.includes('?')?'?'+relative.split('?').slice(1).join('?'):''};
  if(!u.pathname.startsWith('/api/'))return route.continue();
  if(req.method()!=='GET'){await route.abort();return;}
  const paged=content=>({content,number:0,size:20,totalElements:120,totalPages:6,first:true,last:false});
  const animal={id:1,breed:'믹스견',species:'DOG',gender:'MALE',age:2,weight:4,status:'PROTECT',shelterId:1,shelterName:'검증 보호소',neuterStatus:'UNKNOWN',apmsNoticeNo:'서울-강남-2026-00001',images:[],favoriteCount:0,color:'흰색',specialMark:'코 주변 흰 무늬, 빨간 목줄',foundPlace:'서울 강남구',foundDate:'2026-09-22',createdAt:'2026-09-22T10:00:00',noticeEndDate:'2026-09-30'};
  let data=[];
  if(u.pathname==='/api/animals')data=paged(Array.from({length:4},(_,i)=>({...animal,id:i+1})));
  else if(u.pathname==='/api/shelters')data=paged([{id:1,careRegNo:'123',name:'검증 보호소',address:'서울특별시 예시구 보호로 12',organizationName:'서울특별시 예시구'}]);
  else if(u.pathname.endsWith('/stats/today'))data={date:'2026-09-22',rescuedToday:169,adoptedToday:5};
  else if(u.pathname.endsWith('/stats/status'))data=[{status:'PROTECT',label:'보호중',count:166},{status:'RETURN',label:'종료(반환)',count:2},{status:'NATURAL_DEATH',label:'종료(자연사)',count:1}];
  else if(u.pathname.endsWith('/stats/regional'))data=['서울특별시','경기도','대전광역시','세종특별자치시','부산광역시','경상남도'].map((region,i)=>({region,count:[100,3000,33,5,500,1000][i]}));
  seen.push([u.pathname,'fixture']);await route.fulfill({status:200,json:data});
 });
 await page.goto('http://127.0.0.1:5195/login');
 await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});
 const reports=[];
 try {
 for(const path of ['/','/animals','/animals/stats','/shelters','/login','/signup','/reset-password','/privacy','/animals/lost']){
  await page.goto('http://127.0.0.1:5195'+path);
  await page.locator('h1,h2').first().waitFor();
  await page.waitForTimeout(1800);
  for(const width of [1920,390])for(const dark of [false,true]){
   await page.setViewportSize({width,height:width===1920?1080:844});
   await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
   await page.waitForTimeout(350);
   const result=await page.evaluate(()=>{
    function lum(a){return a.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
    function bg(el){let color=[255,255,255]; const stack=[];for(let e=el;e;e=e.parentElement)stack.unshift(e);for(const e of stack){const c=rgb(getComputedStyle(e).backgroundColor);const alpha=c[3]??1;if(c.length>=3)color=c.slice(0,3).map((v,i)=>v*alpha+color[i]*(1-alpha));}return color;}
    const failures=[];let checked=0;
    for(const el of document.querySelectorAll('body *')){
     if(!el.getClientRects().length||el.closest('[disabled]')||el.matches('.material-symbols-outlined,script,style,svg *'))continue;
     const c=getComputedStyle(el);if(c.visibility==='hidden')continue;
     const text=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
     if(!text||!el.className?.toString().includes('brand'))continue;
     const fg=rgb(c.color),back=bg(el);const ratio=(Math.max(lum(fg),lum(back))+.05)/(Math.min(lum(fg),lum(back))+.05);
     const min=parseFloat(c.fontSize)>=24||(parseFloat(c.fontSize)>=18.66&&parseInt(c.fontWeight)>=700)?3:4.5;
     checked++;if(ratio<min)failures.push({text:text.slice(0,65),class:el.className,fg:c.color,bg:back,ratio:ratio.toFixed(2)});
    }
    return {overflow:document.documentElement.scrollWidth>innerWidth,checked,failures};
   });
   reports.push({path,width,dark,...result});
   if(!dark&&(width===1920||['/animals','/animals/stats','/login','/shelters'].includes(path)))await page.screenshot({path:'/tmp/brand-'+(path.replaceAll('/','-')||'home')+'-'+width+'.png',fullPage:true});
  }
 }
 const failures=reports.filter(r=>r.overflow||r.checked===0||r.failures.length);
 if(errors.length||failures.length)throw Error(JSON.stringify({errors,failures}));
 return {reports,seen,errors};
 } finally {
  page.off('pageerror',onError);
  await page.unroute('**/api/**');
  await page.evaluate(()=>document.documentElement.classList.remove('dark'));
 }
}
