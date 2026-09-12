import test from 'node:test';
import assert from 'node:assert/strict';
import { outcomeRates } from '../src/utils/animalStatistics.ts';

test('보호 중인 동물까지 분모에 포함하고 소수점 한 자리로 표시한다', () => {
  assert.deepEqual(outcomeRates([
    { status: 'PROTECT', label: '보호 중', count: 7 },
    { status: 'ADOPTED', label: '입양', count: 2 },
    { status: 'EUTHANIZED', label: '안락사', count: 1 },
    { status: 'RETURNED', label: '반환', count: 1 },
  ]), { adoptionRate: '18.2', euthanasiaRate: '9.1' });
});
test('조회 전 또는 분모가 없으면 비율을 산출하지 않는다', () => {
  assert.equal(outcomeRates(), null);
  assert.equal(outcomeRates([]), null);
  assert.equal(outcomeRates([{ status: 'PROTECT', label: '보호 중', count: 0 }]), null);
});
test('구조 동물은 있지만 입양 및 안락사가 없으면 0퍼센트다', () => {
  assert.deepEqual(outcomeRates([{ status: 'PROTECT', label: '보호 중', count: 10 }]),
    { adoptionRate: '0.0', euthanasiaRate: '0.0' });
});
