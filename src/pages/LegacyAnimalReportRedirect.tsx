import { Navigate, useLocation } from 'react-router-dom';
import { legacyReportPath } from '../lib/reportNavigation';

export default function LegacyAnimalReportRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate replace to={legacyReportPath(pathname, search, hash)} />;
}
