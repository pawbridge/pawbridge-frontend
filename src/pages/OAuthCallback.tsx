import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Base64 디코딩 시 UTF-8 문자 제대로 처리하는 함수
function decodeBase64Unicode(str: string): string {
  // Base64 디코딩 후 UTF-8 문자를 제대로 처리
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 이미 처리했으면 중복 실행 방지
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    // 에러가 있는 경우
    if (error) {
      alert(decodeURIComponent(error));
      navigate('/login', { replace: true });
      return;
    }

    // 토큰이 있는 경우
    if (accessToken && refreshToken) {
      try {
        // JWT 토큰에서 사용자 정보 추출 (payload 디코딩)
        const payloadBase64 = accessToken.split('.')[1];
        const decodedPayload = JSON.parse(decodeBase64Unicode(payloadBase64));

        // 사용자 정보 구성
        const user = {
          id: decodedPayload.userId,
          email: decodedPayload.sub, // JWT subject는 일반적으로 이메일
          name: decodedPayload.name || '',
          role: decodedPayload.role || 'ROLE_USER',
          careRegNo: decodedPayload.careRegNo,
          createdAt: new Date().toISOString(),
        };

        // Zustand store에 인증 정보 저장
        setAuth(user, accessToken, refreshToken);

        alert('구글 로그인 성공!');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('토큰 처리 실패:', error);
        alert('로그인 처리 중 오류가 발생했습니다');
        navigate('/login', { replace: true });
      }
    } else {
      // 토큰이 없는 경우
      alert('로그인 정보를 받지 못했습니다');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-gray-700 dark:text-gray-300">로그인 처리 중...</p>
      </div>
    </div>
  );
}
