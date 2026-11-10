import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { PageText } from '../../lib/seoDetail';

const descriptionSelectors = [
  'meta[name="description"]',
  'meta[property="og:description"]',
  'meta[name="twitter:description"]',
];
const titleSelectors = ['meta[property="og:title"]', 'meta[name="twitter:title"]'];

// 상세 화면이 데이터를 받은 뒤 제목과 설명을 그 데이터로 바꾼다.
// 구글은 렌더링한 뒤의 제목과 설명을 읽는다. 공유 미리보기처럼 JS를 실행하지 않는 곳은 Worker의 공통 문구를 그대로 본다.
export function usePageText(text: PageText | null) {
  const { pathname, search } = useLocation();
  const title = text?.title;
  const description = text?.description;

  useEffect(() => {
    if (!title || !description) return;
    const titleMetas = titleSelectors.map(selector => document.head.querySelector<HTMLMetaElement>(selector));
    const descriptionMetas = descriptionSelectors.map(selector => document.head.querySelector<HTMLMetaElement>(selector));
    const previousTitle = document.title;
    const previousTitles = titleMetas.map(meta => meta?.content);
    const previousDescriptions = descriptionMetas.map(meta => meta?.content);

    document.title = title;
    titleMetas.forEach(meta => { if (meta) meta.content = title; });
    descriptionMetas.forEach(meta => { if (meta) meta.content = description; });

    return () => {
      document.title = previousTitle;
      titleMetas.forEach((meta, index) => { if (meta && previousTitles[index] !== undefined) meta.content = previousTitles[index]; });
      descriptionMetas.forEach((meta, index) => { if (meta && previousDescriptions[index] !== undefined) meta.content = previousDescriptions[index]; });
    };
    // RouteSeo가 주소가 바뀔 때마다 공통 문구로 다시 쓰므로 같은 조건으로 다시 덮는다.
  }, [title, description, pathname, search]);
}
