// Real password login through the isolated dev Gateway. No Google or production requests.
async (page, accounts, origin = 'http://127.0.0.1:5184') => {
  const api = 'http://localhost:28080';
  const response = await page.request.post(`${api}/api/v1/posts`, {
    headers: { Authorization: `Bearer ${accounts[1].token}` },
    multipart: { title: '합성 로그인 복귀 검증', content: '로컬 검증 글', boardType: 'COMMUNICATION' },
  });
  if (!response.ok()) throw new Error(`Local post creation failed: ${response.status()}`);
  const post = (await response.json()).data;
  const id = post.postId || post.id;
  await page.goto(`${origin}/community/${id}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /에게 연락하기$/ }).first().click();
  await page.getByRole('link', { name: '1:1 대화', exact: true }).click();
  await page.waitForURL(`${origin}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('이메일 주소를 입력하세요').fill(accounts[0].email);
  await page.getByPlaceholder('비밀번호를 입력하세요', { exact: true }).fill(accounts[0].password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.waitForURL(`${origin}/chats/new?to=${accounts[1].userId}&context=POST&contextId=${id}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('메시지', { exact: true }).waitFor();
  const rooms = await page.request.get(`${api}/api/v1/chats`, { headers: { Authorization: `Bearer ${accounts[0].token}` } });
  if (!rooms.ok() || (await rooms.json()).data.content.length !== 0) throw new Error('Login return created a chat');
  return { environment: 'isolated-local-dev', checks: ['anonymous-author-contact', 'real-login-return-and-context', 'no-room-before-send'], productionVerified: false };
}
