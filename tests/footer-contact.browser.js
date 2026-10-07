// No login, email send, mocked API or production writes. Run against the local candidate.
async (page) => {
  const checks = [];
  await page.goto('http://127.0.0.1:5184/privacy');
  const footer = page.locator('footer');
  const link = footer.getByRole('link', { name: 'shyu6370@pawbridge.kr', exact: true });
  await link.waitFor();
  if (await link.getAttribute('href') !== 'mailto:shyu6370@pawbridge.kr') throw Error('Inquiry mail link mismatch');
  if (!(await footer.innerText()).includes('개선 제안·오류 문의')) throw Error('Inquiry purpose missing');
  checks.push('visible-address-and-mailto');
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await link.scrollIntoViewIfNeeded();
    const bounds = await link.boundingBox();
    if (!bounds || bounds.width <= 0 || bounds.x < 0 || bounds.x + bounds.width > width) throw Error('Inquiry link clipped');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Footer horizontal overflow');
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    if (!(await link.evaluate(element => element === document.activeElement))) throw Error('Inquiry keyboard navigation failed');
    const outline = await link.evaluate(element => getComputedStyle(element).outlineStyle);
    if (outline === 'none') throw Error('Inquiry focus outline missing');
    checks.push(`inquiry-layout-and-keyboard-${width}`);
    await footer.screenshot({ path: `/tmp/pawbridge-inquiry-footer-${width}.png` });
  }
  return { environment: 'local-main-candidate', checks, emailSent: false };
}
