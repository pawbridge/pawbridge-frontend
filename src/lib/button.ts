// SHYU Button(Figma 11 Button)을 코드로 옮긴 모양. PawBridge는 모서리만 12px(radius/12)로 바꿔 쓴다.
// 높이는 Small 44px, Medium 48px 두 가지다. 글자가 길어 줄이 바뀌면 높이가 늘어나도록 min-h를 쓴다.
export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'small' | 'medium';

// 테두리는 모든 모양에 1px로 두어 마우스를 올려 선 색만 바뀌어도 크기가 그대로다.
// 다크 바탕색 클래스가 disabled보다 뒤에 생성되므로 dark:disabled도 같이 적는다.
const base = 'inline-flex items-center justify-center gap-2 rounded-lg border text-center text-sm font-medium transition-colors'
  + ' disabled:cursor-not-allowed disabled:border-transparent disabled:bg-brand-disabled disabled:text-brand-disabled-ink'
  + ' dark:disabled:border-transparent dark:disabled:bg-brand-disabled dark:disabled:text-brand-disabled-ink';

const sizes: Record<ButtonSize, string> = {
  small: 'min-h-11 px-5 py-2.5',
  medium: 'min-h-12 px-6 py-3',
};

const variants: Record<ButtonVariant, string> = {
  // 화면의 대표 행동 하나에만 쓴다.
  primary: 'border-transparent bg-brand text-brand-contrast hover:bg-brand-hover',
  secondary: 'border-brand-border bg-white text-brand-ink hover:border-brand-accent hover:bg-brand-soft dark:bg-card-dark dark:text-gray-200 dark:hover:bg-stone-800',
  // 삭제처럼 되돌리기 어려운 행동에만 쓴다. 바탕은 연하게, 글자로 위험을 알린다.
  danger: 'border-transparent bg-red-50 text-red-700 hover:border-red-600 dark:bg-red-950 dark:text-red-300',
};

export function buttonClass({ variant = 'primary', size = 'small', className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return [base, sizes[size], variants[variant], className].filter(Boolean).join(' ');
}
