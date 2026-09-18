import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

const linkClass = 'inline-flex min-h-8 items-center text-sm text-[#4b575c] transition-colors hover:text-[#036b3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export default function Footer() {
  return (
    <footer className="mt-16 w-full border-t-4 border-primary bg-white dark:bg-background-dark md:mt-24">
      <div className="mx-auto w-full max-w-[1504px] px-4 py-8 md:px-6 md:py-9">
        <div className="grid gap-8 md:grid-cols-[minmax(260px,2fr)_repeat(3,minmax(120px,1fr))]">
          <div>
            <h2 className="text-xl font-bold text-[#052e16] dark:text-white">포우 브릿지</h2>
            <p className="mt-2 text-sm text-[#4b575c] dark:text-gray-400">모든 동물이 새로운 가족을 만날 때까지.</p>
          </div>

          <FooterColumn title="입양">
            <Link to="/animals" className={linkClass}>동물 검색</Link>
            <Link to="/adoption" className={linkClass}>입양 후기</Link>
          </FooterColumn>
          <FooterColumn title="둘러보기">
            <Link to="/animals/stats" className={linkClass}>유기동물 현황</Link>
            <Link to="/shelters" className={linkClass}>보호소 찾기</Link>
          </FooterColumn>
          <FooterColumn title="참여">
            <Link to="/community" className={linkClass}>커뮤니티</Link>
            <Link to="/travel" className={linkClass}>반려동물 동반여행</Link>
          </FooterColumn>
        </div>

        <div className="mt-8 border-t border-[#c7ced1] pt-5 text-xs leading-5 text-[#6e7a75] dark:border-gray-700 dark:text-gray-400">
          <p>반려동물 동반여행 정보는 <a href="https://api.visitkorea.or.kr/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#036b3c]">한국관광공사 TourAPI</a>를 활용합니다.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 포우 브릿지</p>
            <div className="flex gap-5">
              <Link to="/terms" className="hover:text-[#036b3c]">이용약관</Link>
              <Link to="/privacy" className="hover:text-[#036b3c]">개인정보처리방침</Link>
              <a href="https://api.visitkorea.or.kr/#/useServiceGuide/2" target="_blank" rel="noopener noreferrer" className="hover:text-[#036b3c]">여행정보 저작권 정책</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return <div><h3 className="text-sm font-bold text-[#052e16] dark:text-white">{title}</h3><div className="mt-2 flex flex-col">{children}</div></div>;
}
