import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AnalyticsSettingsButton from '../analytics/AnalyticsSettingsButton';

interface FooterProps {
  colorScheme?: 'default' | 'warm';
}

export default function Footer({ colorScheme = 'default' }: FooterProps) {
  const warm = colorScheme === 'warm';
  const titleColor = warm ? 'text-brand-ink' : 'text-[#052e16]';
  const mutedColor = warm ? 'text-brand-muted dark:text-gray-300' : 'text-[#4b575c]';
  const hoverColor = warm ? 'hover:text-brand-ink dark:hover:text-white' : 'hover:text-[#036b3c]';
  const focusColor = warm ? 'focus-visible:outline-brand-ink dark:focus-visible:outline-brand' : 'focus-visible:outline-primary';
  const linkClass = `inline-flex min-h-8 items-center text-sm ${mutedColor} transition-colors ${hoverColor} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusColor}`;
  return (
    <footer className={`mt-16 w-full border-t-4 ${warm ? 'border-brand' : 'border-primary'} bg-white dark:bg-background-dark md:mt-24`}>
      <div className="mx-auto w-full max-w-[1504px] px-4 py-8 md:px-6 md:py-9">
        <div className="grid gap-8 md:grid-cols-[minmax(260px,2fr)_repeat(3,minmax(120px,1fr))]">
          <div>
            <h2 className={`text-xl font-bold ${titleColor} dark:text-white`}>포우 브릿지</h2>
            <p className={`mt-2 text-sm ${mutedColor} dark:text-gray-400`}>모든 동물이 새로운 가족을 만날 때까지.</p>
          </div>

          <FooterColumn titleClassName={titleColor} title="입양">
            <Link to="/animals" className={linkClass}>동물 검색</Link>
            <Link to="/adoption" className={linkClass}>입양 후기</Link>
          </FooterColumn>
          <FooterColumn titleClassName={titleColor} title="둘러보기">
            <Link to="/animals/stats" className={linkClass}>유기동물 현황</Link>
            <Link to="/shelters" className={linkClass}>보호소 찾기</Link>
          </FooterColumn>
          <FooterColumn titleClassName={titleColor} title="참여">
            <Link to="/community" className={linkClass}>커뮤니티</Link>
            <Link to="/travel" className={linkClass}>반려동물 동반여행</Link>
          </FooterColumn>
        </div>

        <div className={`mt-8 border-t ${warm ? 'border-brand-border text-brand-muted' : 'border-[#c7ced1] text-[#6e7a75]'} pt-5 text-xs leading-5 dark:border-gray-700 dark:text-gray-400`}>
          <p>반려동물 동반여행 정보는 <a href="https://api.visitkorea.or.kr/" target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${hoverColor}`}>한국관광공사 TourAPI</a>를 활용합니다.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 포우 브릿지</p>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              <Link to="/terms" className={hoverColor}>이용약관</Link>
              <Link to="/privacy" className={hoverColor}>개인정보처리방침</Link>
              <AnalyticsSettingsButton colorScheme={colorScheme} className="min-h-0 border-0 p-0 text-xs font-normal hover:bg-transparent" />
              <a href="https://api.visitkorea.or.kr/#/useServiceGuide/2" target="_blank" rel="noopener noreferrer" className={hoverColor}>여행정보 저작권 정책</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children, titleClassName }: { title: string; children: ReactNode; titleClassName: string }) {
  return <div><h3 className={`text-sm font-bold ${titleClassName} dark:text-white`}>{title}</h3><div className="mt-2 flex flex-col">{children}</div></div>;
}
