import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';

const sectionClass = 'border-t border-gray-200 pt-7 dark:border-gray-700';

export default function Privacy() {
  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display text-text-light dark:bg-background-dark dark:text-text-dark">
      <Header />
      <main className="container mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
        <header>
          <p className="text-sm font-bold text-brand-accent dark:text-brand-accent">개인정보 안내</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">개인정보처리방침</h1>
          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">시행일: 2026년 9월 22일</p>
        </header>

        <div className="mt-10 space-y-8 text-sm leading-7 text-gray-700 dark:text-gray-200">
          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">처리하는 정보와 목적</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>회원 기능: 이메일, 이름, 인증 결과를 가입, 로그인, 계정 관리에 사용합니다.</li>
              <li>보호소 담당자 신청: 신청한 보호소와 승인 상태를 담당자 권한 확인에 사용합니다.</li>
              <li>게시글 및 등록 동물: 이용자가 작성한 내용과 이미지를 해당 기능 제공에 사용합니다.</li>
              <li>주문 기능: 수령인, 연락처, 배송지와 주문·결제 결과를 주문 처리에 사용합니다.</li>
              <li>접속 기록: 서비스 안정성, 오류 대응과 보안 확인을 위해 기술적 기록이 생성될 수 있습니다.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">웹사이트 이용 통계</h2>
            <p className="mt-4">
              포우브릿지는 공개 화면의 페이지 조회와 성능을 집계하기 위해 Cloudflare Web Analytics를 사용합니다.
              이 도구는 쿠키로 이용자를 추적하지 않으며, Cloudflare 설명에 따르면 방문자의 개인정보를 수집하거나
              여러 웹사이트에 걸쳐 개별 이용자를 추적하지 않습니다.
            </p>
            <p className="mt-4">
              자세한 처리 방식은{' '}
              <a className="font-semibold text-brand-accent underline underline-offset-4 dark:text-brand-accent" href="https://developers.cloudflare.com/web-analytics/about/" target="_blank" rel="noreferrer">
                Cloudflare Web Analytics 안내
              </a>
              에서 확인할 수 있습니다.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">보관과 이용자 권리</h2>
            <p className="mt-4">
              정보는 서비스 제공 목적을 달성할 때까지 보관하며, 관계 법령에 별도 보관 의무가 있는 경우 해당
              기간 동안 보관할 수 있습니다. 이용자는 계정 정보를 확인·수정하거나 개인정보 처리에 관한 요청을
              할 수 있습니다.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">방침 변경</h2>
            <p className="mt-4">처리 항목이나 외부 서비스가 바뀌면 이 페이지의 내용과 시행일을 갱신합니다.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
