import { useLocation } from 'react-router-dom';
import { isClarityTrackableLocation } from '../../lib/analyticsConsent';

interface AnalyticsRouteBoundaryProps {
  children: React.ReactNode;
}

export default function AnalyticsRouteBoundary({ children }: AnalyticsRouteBoundaryProps) {
  const location = useLocation();
  const shouldMask = !isClarityTrackableLocation(location.pathname, location.search);

  return <div data-clarity-mask={shouldMask ? 'true' : undefined}>{children}</div>;
}
