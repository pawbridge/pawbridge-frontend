import test from 'node:test';
import assert from 'node:assert/strict';
import {
  favoriteAnimalName,
  favoriteNotificationPhrase,
  latestFavoriteChange,
  unseenFavoriteCount,
} from '../src/lib/favoriteNotifications.ts';

test('안락사·자연사는 사유 없이 보호 종료로만 알린다', () => {
  assert.equal(favoriteNotificationPhrase('EUTHANIZED'), '보호가 종료되었어요');
  assert.equal(favoriteNotificationPhrase('NATURAL_DEATH'), '보호가 종료되었어요');
  assert.equal(favoriteNotificationPhrase('ADOPTED'), '입양됐어요');
  assert.equal(favoriteNotificationPhrase('SOMETHING_NEW'), '상태가 바뀌었어요');
});

test('품종이 없으면 종으로 이름을 대신한다', () => {
  assert.equal(favoriteAnimalName({ breed: ' 믹스견 ', species: 'DOG' }), '믹스견');
  assert.equal(favoriteAnimalName({ breed: '', species: 'CAT' }), '고양이');
});

test('마지막으로 본 시각보다 늦게 바뀐 것만 새 소식으로 센다', () => {
  const items = [{ changedAt: '2026-11-03T01:00:00Z' }, { changedAt: '2026-11-02T01:00:00Z' }];
  assert.equal(unseenFavoriteCount(items, null), 2);
  assert.equal(unseenFavoriteCount(items, 'not-a-date'), 2);
  assert.equal(unseenFavoriteCount(items, '2026-11-02T01:00:00Z'), 1);
  assert.equal(unseenFavoriteCount(items, '2026-11-03T01:00:00Z'), 0);
  assert.equal(latestFavoriteChange(items), '2026-11-03T01:00:00Z');
  assert.equal(latestFavoriteChange([]), null);
});
