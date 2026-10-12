import { visitCountingEnabled } from './visitBootstrap';

export const visitsEnabled = visitCountingEnabled(import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT,
  import.meta.env.VITE_DAILY_VISITORS_ENABLED, import.meta.env.VITE_VISITOR_TEST_MODE, window.location.hostname);
export const todayVisitKey = ['public-today-visits'] as const;
