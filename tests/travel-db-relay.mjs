// WSL-only local test transport to Windows loopback Java processes. No API payload mocking.
import http from 'node:http';
import { execFile } from 'node:child_process';
if (process.env.PAWBRIDGE_TRAVEL_CONTRACT_TEST !== 'true') throw new Error('Explicit local test opt-in required');
const curl='/mnt/c/Windows/System32/curl.exe';
for (const port of [18081,18180]) {
  http.createServer((request,response)=>{
    const url=new URL(request.url,'http://localhost');
    const fixture=port===18081 && ((request.method==='GET' && url.pathname==='/__fixture/requests')
      || (request.method==='POST' && /^\/__fixture\/(failure|enrich|hide)$/.test(url.pathname)));
    const places=port===18180 && /^(GET|POST)$/.test(request.method)
      && /^\/api\/places(?:\/regions|\/[0-9]{1,20})?$/.test(url.pathname)
      && (!url.search || /^\?areaCode=[0-9]{2,5}$/.test(url.search));
    if(!fixture && !places){response.writeHead(404);return response.end();}
    execFile(curl,['--silent','--show-error','--max-time','8','--request',request.method,
      '--write-out','\n%{http_code}','http://127.0.0.1:'+port+url.pathname+url.search],
      {timeout:10000,maxBuffer:1024*1024},(error,stdout)=>{
        if(error){response.writeHead(502);return response.end();}
        const cut=stdout.lastIndexOf('\n');
        response.writeHead(Number(stdout.slice(cut+1)),{'Content-Type':'application/json','Cache-Control':'no-store'});
        response.end(stdout.slice(0,cut));
      });
  }).listen(port,'127.0.0.1',()=>console.log('LOCAL_TEST_RELAY '+port));
}
