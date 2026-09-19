import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  clarityPageType,
  isClarityTrackableLocation,
  readAnalyticsConsent,
  saveAnalyticsConsent,
} from '../src/lib/analyticsConsent.ts';

test('공개 화면만 Clarity 분석 대상으로 허용한다', () => {
  for (const pathname of ['/', '/animals', '/animals/123', '/animals/lost', '/animals/stats', '/shelters', '/travel/10', '/community/7', '/adoption', '/privacy']) {
    assert.equal(isClarityTrackableLocation(pathname), true, pathname);
  }

  for (const pathname of ['/login', '/signup', '/reset-password', '/mypage', '/checkout', '/orders/1', '/admin/dashboard', '/animals/new', '/animals/1/edit', '/community/new', '/adoption/1/edit', '/unknown']) {
    assert.equal(isClarityTrackableLocation(pathname), false, pathname);
  }
});

test('검색어나 세부 지역이 URL에 포함된 화면은 분석하지 않는다', () => {
  for (const search of ['?keyword=흰색', '?breed=말티즈', '?noticeNo=경남-사천-2026', '?region=서울&city=강남', '?q=강아지']) {
    assert.equal(isClarityTrackableLocation('/animals', search), false, search);
  }

  assert.equal(isClarityTrackableLocation('/animals', '?page=2&sort=createdAt%2Cdesc&status=PROTECT'), true);
});

test('분석 동의는 허용과 거부 값만 복원한다', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  assert.equal(readAnalyticsConsent(storage), null);
  saveAnalyticsConsent('granted', storage);
  assert.equal(values.get(ANALYTICS_CONSENT_STORAGE_KEY), 'granted');
  assert.equal(readAnalyticsConsent(storage), 'granted');
  values.set(ANALYTICS_CONSENT_STORAGE_KEY, 'unexpected');
  assert.equal(readAnalyticsConsent(storage), null);
});

test('동적 식별자를 제외한 최상위 화면 종류만 태그로 사용한다', () => {
  assert.equal(clarityPageType('/'), 'home');
  assert.equal(clarityPageType('/animals/123'), 'animals');
  assert.equal(clarityPageType('/community/77'), 'community');
});
