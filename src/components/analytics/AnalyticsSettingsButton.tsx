import { OPEN_ANALYTICS_CONSENT_EVENT } from '../../lib/analyticsConsent';

interface AnalyticsSettingsButtonProps {
  className?: string;
  colorScheme?: 'default' | 'warm';
}

export default function AnalyticsSettingsButton({ className = '', colorScheme = 'default' }: AnalyticsSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_ANALYTICS_CONSENT_EVENT))}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold ${colorScheme === 'warm' ? 'text-brand-muted' : 'text-[#052e16]'} hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${colorScheme === 'warm' ? 'focus-visible:outline-brand-ink dark:focus-visible:outline-brand' : 'focus-visible:outline-emerald-700'} dark:border-gray-600 dark:text-white dark:hover:bg-gray-800 ${className}`}
    >
      이용 분석 설정 변경
    </button>
  );
}
