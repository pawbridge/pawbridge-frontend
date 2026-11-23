// SHYU Badge(Figma 10 Badge)를 코드로 옮긴 모양. PawBridge는 Tone을 세 가지만 쓴다.
// neutral: 상태, 속성, 주문 상태(결제 실패 포함). warning: 공고 마감 D-day만. danger: 오류 알림에만.
// 높이는 Small 34px(12px 글자), Medium 40px(14px 글자)이다.
export type BadgeTone = 'neutral' | 'warning' | 'danger';
export type BadgeSize = 'small' | 'medium';

// 줄이 바뀌면 배지가 깨져 보이므로 한 줄로 둔다.
const base = 'inline-flex items-center whitespace-nowrap rounded-full font-medium';

const sizes: Record<BadgeSize, string> = {
  small: 'px-3 py-2 text-xs leading-[18px]',
  medium: 'px-4 py-2.5 text-sm leading-5',
};

// color/badge 변수 값. 라이트와 다크 모두 글자 대비 4.5:1 이상이다.
const tones: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-100 text-brand-ink dark:bg-stone-800 dark:text-gray-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-amber-950 dark:text-amber-50',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

export function badgeClass({ tone = 'neutral', size = 'small', className }: { tone?: BadgeTone; size?: BadgeSize; className?: string } = {}) {
  return [base, sizes[size], tones[tone], className].filter(Boolean).join(' ');
}
