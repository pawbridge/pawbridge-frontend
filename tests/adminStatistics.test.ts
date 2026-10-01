import test from 'node:test';
import assert from 'node:assert/strict';
import { adminDailyChange, fillAdminDays, groupAdminDays, kstToday, shiftDay, validAdminRange } from '../src/lib/adminStatistics.ts';
import { currentAdminPath, adminNavigation, adminSection } from '../src/lib/adminNavigation.ts';
import { validateAdminUser } from '../src/lib/adminUsers.ts';

test('한국 날짜는 UTC와 브라우저 시간대에 관계없이 자정 경계를 따른다', () => {
  assert.equal(kstToday(new Date('2026-09-30T14:59:59Z')), '2026-09-30');
  assert.equal(kstToday(new Date('2026-09-30T15:00:00Z')), '2026-10-01');
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
});
test('일별 성공 응답에 중간 0건 날짜를 채우고 날짜순을 유지한다', () => {
  assert.deepEqual(fillAdminDays([{ date: '2026-10-03', count: 20 }, { date: '2026-10-01', count: 10 }], '2026-10-01', '2026-10-03'), [
    { date: '2026-10-01', count: 10 }, { date: '2026-10-02', count: 0 }, { date: '2026-10-03', count: 20 },
  ]);
});
test('0건 전일의 증가를 100퍼센트로 꾸미지 않는다', () => {
  assert.equal(adminDailyChange(20, 0), '+20건 · 비율 비교 불가');
  assert.equal(adminDailyChange(0, 0), '변동 없음');
  assert.equal(adminDailyChange(5, 10), '-5건 (-50.0%)');
});
test('잘못된 날짜와 역전된 기간을 거부하고 최대 366일만 허용한다', () => {
  assert.equal(validAdminRange('2026-02-30', '2026-03-01'), false);
  assert.equal(validAdminRange('', '2026-03-01'), false);
  assert.equal(validAdminRange('2026-10-02', '2026-10-01'), false);
  assert.equal(validAdminRange('2024-01-01', '2024-12-31'), true);
  assert.equal(validAdminRange('2024-01-01', '2025-01-01'), false);
});
test('긴 기간 그래프의 묶음 합계가 일별 합계와 같다', () => {
  const rows = fillAdminDays([{ date: '2026-09-01', count: 3 }, { date: '2026-09-30', count: 2 }], '2026-09-01', '2026-09-30');
  const groups = groupAdminDays(rows);
  assert.equal(groups.length, 5);
  assert.equal(groups.reduce((sum, group) => sum + group.count, 0), 5);
  assert.equal(groups[4].end, '2026-09-30');
});
test('모든 관리자 경로와 상세 경로가 하나의 메뉴로만 연결된다', () => {
  for (const item of adminNavigation.flatMap(group => group.items)) {
    assert.equal(currentAdminPath(item.path), item.path);
    assert.equal(currentAdminPath(item.path + '/42'), item.path);
  }
  assert.equal(currentAdminPath('/admin/shelter-applications/42'), '/admin/shelter-applications');
  assert.equal(adminSection('/admin/shelters/42'), '보호소 관리');
  assert.equal(currentAdminPath('/admin/users-other'), undefined);
});
test('회원 수정의 기존 닉네임 및 보호소 등록번호 규칙을 유지한다', () => {
  assert.deepEqual(validateAdminUser({ nickname: '', role: 'ROLE_USER' }), {});
  assert.deepEqual(validateAdminUser({ nickname: '포우123', role: 'ROLE_SHELTER', careRegNo: '411000' }), {});
  assert.ok(validateAdminUser({ nickname: 'a' }).nickname);
  assert.ok(validateAdminUser({ nickname: '닉 네임' }).nickname);
  assert.ok(validateAdminUser({ role: 'ROLE_SHELTER', careRegNo: '   ' }).careRegNo);
});
