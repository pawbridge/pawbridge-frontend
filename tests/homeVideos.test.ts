import { test } from 'node:test';
import assert from 'node:assert/strict';
import { videoDuration, videoThumbnail, videoPlayerUrl } from '../src/lib/homeVideos.ts';
test('duration formats minutes and hours and handles absent metadata', () => {
  assert.equal(videoDuration(204), '3:24'); assert.equal(videoDuration(3661), '1:01:01');
  assert.equal(videoDuration(null), '—'); assert.equal(videoDuration(-1), '—');
});
test('thumbnails reject non-provider hosts and embedded credentials', () => {
  assert.equal(videoThumbnail('https://i.ytimg.com/vi/AbCdEfGhI_1/hqdefault.jpg'), 'https://i.ytimg.com/vi/AbCdEfGhI_1/hqdefault.jpg');
  for (const url of [null, 'javascript:alert(1)', 'https://i.ytimg.com.evil.invalid/a.jpg', 'https://user:pass@i.ytimg.com/a.jpg']) assert.equal(videoThumbnail(url), '');
});
test('player uses validated ID, privacy enhanced host and no autoplay', () => {
  assert.equal(videoPlayerUrl('AbCdEfGhI_1'), 'https://www.youtube-nocookie.com/embed/AbCdEfGhI_1?autoplay=0&playsinline=1');
  assert.equal(videoPlayerUrl('../script'), undefined);
});
