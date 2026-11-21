import test from 'node:test';
import assert from 'node:assert/strict';
import { buttonClass } from '../src/lib/button.ts';

const classes = (value: string) => value.split(' ');

test('기본은 Primary Small이고 높이 44px, 모서리 12px이다', () => {
  const value = classes(buttonClass());
  for (const name of ['bg-brand', 'text-brand-contrast', 'min-h-11', 'rounded-lg', 'text-sm', 'font-medium']) assert.ok(value.includes(name), name);
});

test('Medium은 높이 48px이다', () => {
  const value = classes(buttonClass({ size: 'medium' }));
  assert.ok(value.includes('min-h-12'));
  assert.ok(!value.includes('min-h-11'));
});

test('Danger는 연한 빨강 바탕에 빨강 글자를 쓰고 파랑을 쓰지 않는다', () => {
  const value = classes(buttonClass({ variant: 'danger' }));
  for (const name of ['bg-red-50', 'text-red-700', 'dark:bg-red-950', 'dark:text-red-300']) assert.ok(value.includes(name), name);
  assert.ok(!value.some(name => name.includes('brand') && !name.includes('disabled')));
});

test('비활성은 모양과 관계없이 같은 회색이고 다크에서도 덮이지 않는다', () => {
  for (const variant of ['primary', 'secondary', 'danger'] as const) {
    const value = classes(buttonClass({ variant }));
    for (const name of ['disabled:bg-brand-disabled', 'dark:disabled:bg-brand-disabled', 'dark:disabled:text-brand-disabled-ink']) assert.ok(value.includes(name), `${variant} ${name}`);
  }
});

test('덧붙인 class는 뒤에 붙는다', () => {
  assert.ok(buttonClass({ className: 'w-full' }).endsWith(' w-full'));
});
