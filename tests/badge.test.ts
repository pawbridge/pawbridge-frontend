import test from 'node:test';
import assert from 'node:assert/strict';
import { badgeClass } from '../src/lib/badge.ts';

const classes = (value: string) => value.split(' ');

test('기본은 Neutral Small이고 높이 34px(12px 글자, 위아래 8px)이다', () => {
  const value = classes(badgeClass());
  for (const name of ['bg-neutral-100', 'text-brand-ink', 'dark:bg-stone-800', 'dark:text-gray-200', 'px-3', 'py-2', 'text-xs', 'leading-[18px]', 'font-medium', 'rounded-full']) assert.ok(value.includes(name), name);
});

test('Medium은 높이 40px(14px 글자, 위아래 10px)이다', () => {
  const value = classes(badgeClass({ size: 'medium' }));
  for (const name of ['px-4', 'py-2.5', 'text-sm', 'leading-5']) assert.ok(value.includes(name), name);
  assert.ok(!value.includes('text-xs'));
});

test('Warning은 라이트와 다크 모두 노랑 계열이고 무채색을 섞지 않는다', () => {
  const value = classes(badgeClass({ tone: 'warning' }));
  for (const name of ['bg-yellow-100', 'text-yellow-800', 'dark:bg-amber-950', 'dark:text-amber-50']) assert.ok(value.includes(name), name);
  assert.ok(!value.includes('bg-neutral-100'));
});

test('Danger는 빨강 계열이고 파랑을 쓰지 않는다', () => {
  const value = classes(badgeClass({ tone: 'danger' }));
  for (const name of ['bg-red-100', 'text-red-800', 'dark:bg-red-950', 'dark:text-red-300']) assert.ok(value.includes(name), name);
  assert.ok(!value.some(name => name.includes('brand')));
});

test('덧붙인 class는 뒤에 붙는다', () => {
  assert.ok(badgeClass({ className: 'w-fit' }).endsWith(' w-fit'));
});
