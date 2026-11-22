import type { HTMLAttributes } from 'react';
import { badgeClass, type BadgeSize, type BadgeTone } from '../../lib/badge';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; size?: BadgeSize };

// 누르지 않는 짧은 표시용 배지. 누르는 선택 칩(Filter Chip)은 따로 만든다.
export default function Badge({ tone, size, className, ...props }: BadgeProps) {
  return <span className={badgeClass({ tone, size, className })} {...props} />;
}
