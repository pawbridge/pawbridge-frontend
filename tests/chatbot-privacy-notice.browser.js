// 모의 API로 AI 입양 준비 도우미 패널을 열고 대화 저장·외부 AI 전달 안내가 질문 전후로 계속 보이는지,
// 안내의 링크가 개인정보처리방침의 도우미 항목으로 이어지는지 데스크톱과 모바일 너비에서 본다.
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
  const answer = {
    sessionId: 'c0ffee00-0000-4000-8000-000000000001',
    answer: '보호소에 방문 전 전화로 입양 상담 가능 시간을 먼저 확인해 주세요.',
    safetyNotice: '이 답변은 일반적인 참고 정보입니다.',
    provider: 'anthropic',
    sources: [],
    healthCards: [],
  };
  let chatRequests = 0;
  await page.route('**/*', async route => {
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(route.request().url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/')) return route.continue();
    if (path === '/api/v1/animals/35798') return route.fulfill({ status: 200, json: animal });
    if (path === '/api/v1/animals/35798/chat/messages' && route.request().method() === 'POST') {
      chatRequests += 1;
      return route.fulfill({ status: 200, json: answer });
    }
    if (path === '/api/v1/animals') return route.fulfill({ status: 200, json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });

  const notice = '대화는 저장되고, 답변을 만들기 위해 외부 AI 서비스로 전달됩니다.';
  const panel = page.locator('section').filter({ hasText: 'AI 입양 준비 도우미' }).last();

  for (const viewport of [{ name: 'desktop', width: 1920, height: 1080 }, { name: 'mobile', width: 390, height: 844 }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(origin + '/animals/35798');
    await page.getByRole('button', { name: 'AI 입양 준비 도우미 열기' }).click();
    await panel.getByText(notice).waitFor();
    assert(await panel.getByText(notice).isVisible(), `${viewport.name}-notice-before-question`);

    // 안내가 입력창 아래 글자 수와 겹치지 않고 패널 안에 들어가는지 본다.
    const noticeBox = await panel.getByText(notice).boundingBox();
    const panelBox = await panel.boundingBox();
    const counterBox = await panel.getByText('0/500').boundingBox();
    assert(noticeBox.x >= panelBox.x && noticeBox.x + noticeBox.width <= panelBox.x + panelBox.width, `${viewport.name}-notice-inside-panel`);
    assert(noticeBox.x + noticeBox.width <= counterBox.x, `${viewport.name}-notice-left-of-counter`);
    await page.screenshot({ path: `/tmp/pawbridge-chatbot-notice-${viewport.name}-empty.png` });

    await panel.getByLabel('질문', { exact: true }).fill('입양 전에 무엇을 확인하면 좋을까요?');
    await panel.getByRole('button', { name: '질문 보내기' }).click();
    await panel.getByText(answer.answer).waitFor();
    assert(await panel.getByText(notice).isVisible(), `${viewport.name}-notice-after-answer`);
    await page.screenshot({ path: `/tmp/pawbridge-chatbot-notice-${viewport.name}-answered.png` });

    await panel.getByRole('link', { name: '자세히' }).click();
    await page.waitForURL(origin + '/privacy');
    await page.getByRole('heading', { name: 'AI 입양 준비 도우미' }).waitFor();
    assert(await page.getByText('Anthropic, PBC(미국)').isVisible(), `${viewport.name}-privacy-recipient`);
    assert(await page.getByText('AI 입양 준비 도우미 기록은 질문일부터 1년간 보관하며', { exact: false }).isVisible(), `${viewport.name}-privacy-retention`);
    await page.screenshot({ path: `/tmp/pawbridge-chatbot-notice-${viewport.name}-privacy.png`, fullPage: true });
  }

  assert(chatRequests === 2, 'one-question-per-viewport: ' + chatRequests);
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return { checks };
}
