import test from 'node:test';
import assert from 'node:assert/strict';
import { animalWeightLabel, noticeDday } from '../src/lib/animalDisplay.ts';

test('단위가 포함된 API 체중 원문에는 단위를 중복해서 붙이지 않는다', () => {
  for (const value of ['3(Kg)', '5.5kg', '2㎏', '1.2 kg']) {
    assert.equal(animalWeightLabel(value), value);
  }
});

test('숫자로만 입력된 문자열 체중에는 표시용 kg를 붙인다', () => {
  assert.equal(animalWeightLabel('3'), '3 kg');
  assert.equal(animalWeightLabel('3.5'), '3.5 kg');
  assert.equal(animalWeightLabel('0'), '0 kg');
});

test('체중 설명이나 미상 표기는 숫자로 바꾸거나 단위를 추측하지 않는다', () => {
  for (const value of ['미상', '약 5kg', '2~3']) {
    assert.equal(animalWeightLabel(value), value);
  }
});

test('누락되거나 빈 체중은 표시하지 않고 앞뒤 공백만 제거한다', () => {
  for (const value of [undefined, null, '', '   ']) {
    assert.equal(animalWeightLabel(value), null);
  }
  assert.equal(animalWeightLabel(' 3(Kg) '), '3(Kg)');
});

test('공고 D-day는 지금 시각과 관계없이 날짜만 센다', () => {
  const morning = new Date(2026, 10, 23, 0, 5);
  const evening = new Date(2026, 10, 23, 23, 55);
  for (const now of [morning, evening]) {
    assert.equal(noticeDday('2026-12-03', now), 'D-10');
    assert.equal(noticeDday('2026-12-03T00:00:00', now), 'D-10');
    assert.equal(noticeDday('2026-11-24', now), 'D-1');
    assert.equal(noticeDday('2026-11-23', now), 'D-DAY');
    assert.equal(noticeDday('2026-11-22', now), null);
  }
});

test('공고 D-day는 해와 달이 바뀌어도 하루씩 센다', () => {
  const now = new Date(2026, 11, 31, 15, 0);
  assert.equal(noticeDday('2027-01-01', now), 'D-1');
  assert.equal(noticeDday('2027-03-01', now), 'D-60');
});

test('마감일이 없거나 형식이 다르면 D-day를 보이지 않는다', () => {
  for (const value of [undefined, null, '', '미정', '12/03/2026']) {
    assert.equal(noticeDday(value), null);
  }
});
