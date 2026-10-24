import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, readPersistedAccessToken } from '../store/authStore';
import { refreshAccessToken } from '../api/authSession';
import { readUserFromAccessToken } from '../lib/accessToken';
import { consumeReportLoginReturn } from '../lib/reportNavigation';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 이미 처리했으면 중복 실행 방지
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    // 기존 백엔드는 토큰을 주소로 전달한다. 주소창·방문 기록에 남지 않도록 가장 먼저 지운다.
    const legacyAccessToken = searchParams.get('accessToken');
    if (legacyAccessToken || searchParams.has('refreshToken')) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
    const error = searchParams.get('error');

    // Failures are shown inside the login card instead of a blocking alert.
    const backToLogin = (message: string) => {
      navigate(`/login?error=${encodeURIComponent(message)}`, { replace: true });
    };

    const completeLogin = (accessToken: string): boolean => {
      // JWT 토큰에서 사용자 정보 추출 (payload 디코딩)
      const user = readUserFromAccessToken(accessToken);
      if (!user) {
        return false;
      }
      setAuth(user, accessToken);
      // Success needs no message: the header switches to the member menu on the page they return to.
      navigate(consumeReportLoginReturn(), { replace: true });
      return true;
    };

    if (error) {
      backToLogin(error);
      return;
    }

    // 기존 백엔드: 주소의 Access Token을 사용하고 Refresh Token은 저장하지 않는다.
    if (legacyAccessToken) {
      if (!completeLogin(legacyAccessToken)) {
        backToLogin('로그인 처리 중 오류가 발생했습니다');
      }
      return;
    }

    // 새 백엔드: 로그인 유지 쿠키가 이미 저장되어 있으므로 Access Token을 재발급받는다.
    // 저장된 이전 토큰을 실패한 토큰으로 넘겨, 이전 세션의 토큰을 재사용하지 않고 서버에 요청하게 한다.
    refreshAccessToken(readPersistedAccessToken())
      .then((accessToken) => {
        if (!completeLogin(accessToken)) {
          backToLogin('로그인 정보를 받지 못했습니다');
        }
      })
      .catch(() => {
        backToLogin('로그인 정보를 받지 못했습니다');
      });
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-focus border-r-transparent"></div>
        <p className="mt-4 text-gray-700 dark:text-gray-300">로그인 처리 중...</p>
      </div>
    </div>
  );
}
