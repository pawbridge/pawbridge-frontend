import { useEffect } from 'react';
import { isAxiosError } from 'axios';
import { useLocation } from 'react-router-dom';
import { SITE_NAME } from '../../lib/seo';

// 주소 자체가 없는 자원을 가리킨다고 API가 확정한 응답만 본다.
// 5xx, 네트워크 오류는 일시적일 수 있어 넣지 않는다. 살아 있는 페이지가 색인에서 빠질 수 있다.
export function isMissingResponse(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 400;
}

// Worker와 RouteSeo는 주소만 보고 상세 화면에 index,follow를 준다.
// 데이터가 없다는 것은 화면이 API를 불러 본 뒤에야 알 수 있어, 그때 robots와 제목을 바꾼다.
// 구글은 렌더링한 뒤의 robots도 읽고, 응답 헤더와 다르면 더 엄격한 쪽을 따른다.
export function useNotFoundNoindex(missing: boolean) {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!missing) return;
    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robots?.content;
    const previousTitle = document.title;

    if (robots) robots.content = 'noindex,nofollow';
    document.title = `페이지를 찾을 수 없습니다 | ${SITE_NAME}`;

    return () => {
      if (robots && previousRobots !== undefined) robots.content = previousRobots;
      document.title = previousTitle;
    };
    // RouteSeo가 주소가 바뀔 때마다 robots를 다시 쓰므로 같은 조건으로 다시 덮는다.
  }, [missing, pathname, search]);
}
