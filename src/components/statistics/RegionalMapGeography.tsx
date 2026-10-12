import { useState, type ComponentProps } from 'react';
import { Geography } from 'react-simple-maps';

type Props = Omit<ComponentProps<typeof Geography>,
  'style' | 'onMouseEnter' | 'onMouseLeave' | 'onMouseDown' | 'onMouseUp' | 'onFocus' | 'onBlur'>;

// react-simple-maps 5 forwards SVG styles; keep our existing hover/press/focus states.
export default function RegionalMapGeography(props: Props) {
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const clearInteraction = () => { setFocused(false); setPressed(false); };

  return <Geography {...props}
    style={{ outline: 'none', ...(focused && !pressed ? { stroke: 'var(--chart-outline)', strokeWidth: 2 } : {}) }}
    onMouseEnter={() => setFocused(true)} onMouseLeave={clearInteraction}
    onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
    onFocus={() => setFocused(true)} onBlur={clearInteraction}
  />;
}
