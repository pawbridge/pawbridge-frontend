import Clarity from '@microsoft/clarity';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  OPEN_ANALYTICS_CONSENT_EVENT,
  clarityPageType,
  isClarityTrackableLocation,
  readAnalyticsConsent,
  saveAnalyticsConsent,
  type AnalyticsConsent as AnalyticsConsentValue,
} from '../../lib/analyticsConsent';

const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim() || 'ykji9uah6o';

declare global {
  interface Window {
    clarity?: (method: string, ...args: unknown[]) => void;
  }
}

function command(method: string, ...args: unknown[]) {
  window.clarity?.(method, ...args);
}

export default function AnalyticsConsent() {
  const location = useLocation();
  const initialized = useRef(false);
  const [consent, setConsent] = useState<AnalyticsConsentValue | null>(() => {
    try {
      return readAnalyticsConsent();
    } catch {
      return null;
    }
  });
  const [isOpen, setIsOpen] = useState(consent === null);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(OPEN_ANALYTICS_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_ANALYTICS_CONSENT_EVENT, open);
  }, []);

  useEffect(() => {
    const trackable = isClarityTrackableLocation(location.pathname, location.search);

    if (consent !== 'granted' || !trackable || !clarityProjectId) {
      if (initialized.current) {
        if (consent === 'denied') {
          Clarity.consentV2({ ad_Storage: 'denied', analytics_Storage: 'denied' });
          Clarity.consent(false);
        }
        command('stop');
      }
      return;
    }

    if (!initialized.current) {
      Clarity.init(clarityProjectId);
      initialized.current = true;
      Clarity.consentV2({ ad_Storage: 'denied', analytics_Storage: 'granted' });
    } else {
      Clarity.consentV2({ ad_Storage: 'denied', analytics_Storage: 'granted' });
      command('start');
    }

    Clarity.setTag('page_type', clarityPageType(location.pathname));
  }, [consent, location.pathname, location.search]);

  function choose(value: AnalyticsConsentValue) {
    try {
      saveAnalyticsConsent(value);
    } catch {
      // Storage can be unavailable in hardened browser modes. The in-memory choice still applies.
    }
    setConsent(value);
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <section
      role="dialog"
      aria-labelledby="analytics-consent-title"
      aria-describedby="analytics-consent-description"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <h2 id="analytics-consent-title" className="text-base font-bold text-[#052e16] dark:text-white sm:text-lg">
        서비스 개선을 위한 이용 분석
      </h2>
      <p id="analytics-consent-description" className="mt-2 text-sm leading-6 text-[#4b575c] dark:text-gray-300">
        동의하면 Microsoft Clarity로 공개 화면의 클릭과 스크롤, 기기·브라우저 정보를 분석합니다. 로그인,
        회원정보, 주문, 관리자 및 작성 화면은 수집하지 않으며 입력 내용은 기록하지 않습니다.
      </p>
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/privacy"
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:text-primary"
        >
          개인정보 및 분석 도구 안내
        </Link>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-[#052e16] hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
          >
            허용하지 않음
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-[#052e16] hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            분석 허용
          </button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {consent ? `현재 분석 설정: ${consent === 'granted' ? '허용' : '허용하지 않음'}` : ''}
      </span>
    </section>
  );
}
