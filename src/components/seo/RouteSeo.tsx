import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveSeoMetadata, SITE_NAME } from '../../lib/seo';

function upsertMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}

export default function RouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const metadata = resolveSeoMetadata(location.pathname, location.search);

    document.title = metadata.title;
    document.documentElement.lang = 'ko';
    upsertMeta('meta[name="description"]', 'name', 'description', metadata.description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', metadata.robots);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', metadata.canonicalUrl);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', 'ko_KR');
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description);
    upsertCanonical(metadata.canonicalUrl);
  }, [location.pathname, location.search]);

  return null;
}
