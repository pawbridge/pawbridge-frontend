import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';

const sectionClass = 'border-t border-gray-200 pt-7 dark:border-gray-700';

export default function Terms() {
  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display text-text-light dark:bg-background-dark dark:text-text-dark">
      <Header />
      <main className="container mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
        <header>
          <p className="text-sm font-bold text-brand-accent dark:text-brand-accent">서비스 안내</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">이용약관</h1>
          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">시행일: 2026년 10월 24일</p>
        </header>

        <div className="mt-10 space-y-8 text-sm leading-7 text-gray-700 dark:text-gray-200">
          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">서비스</h2>
            <p className="mt-4">포우 브릿지는 유기동물 입양 정보, 실종·목격 제보, 커뮤니티, 회원 간 쪽지·채팅을 무료로 제공합니다.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">회원 가입과 계정</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>네이버 또는 구글 계정으로 처음 로그인하면 이 약관에 동의하고 회원으로 가입한 것으로 봅니다. 별도 비밀번호는 받지 않습니다.</li>
              <li>만 14세 미만은 가입할 수 없습니다.</li>
              <li>가입 시 제공받는 정보(이용자 식별자, 이름, 이메일)는 <Link to="/privacy" className="underline underline-offset-4">개인정보처리방침</Link>에 따라 처리합니다.</li>
              <li>계정은 본인만 사용할 수 있습니다. 탈퇴는 아래 문의 메일로 요청해 주세요.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">이용자가 지켜야 할 사항</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>다른 사람의 정보를 도용하거나 허위 동물 정보·제보를 올리지 않습니다.</li>
              <li>불법, 혐오, 광고·홍보 목적의 게시물이나 쪽지를 올리지 않습니다.</li>
              <li>서비스 운영을 방해하지 않습니다.</li>
            </ul>
            <p className="mt-4">위반한 게시물은 숨기거나 삭제할 수 있고, 반복되면 이용을 제한할 수 있습니다.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">게시물</h2>
            <p className="mt-4">게시물의 권리는 작성자에게 있습니다. 포우 브릿지는 서비스 화면에 게시물을 노출하는 데 필요한 범위에서만 사용합니다.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">정보의 정확성과 책임</h2>
            <p className="mt-4">보호 동물 정보는 공공 동물보호관리시스템(APMS) 수집 정보와 이용자 제보를 바탕으로 하며 실제와 다를 수 있습니다. 방문·입양 전에는 보호소에 직접 확인해 주세요.</p>
            <p className="mt-4">서비스는 사전 안내 후 변경하거나 중단할 수 있습니다. 포우 브릿지는 고의 또는 과실 없이 발생한 손해에 대해서는 책임지지 않습니다.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">문의와 약관 변경</h2>
            <p className="mt-4">문의: <a href="mailto:shyu6370@pawbridge.kr" className="underline underline-offset-4">shyu6370@pawbridge.kr</a></p>
            <p className="mt-4">약관을 바꾸면 시행 전에 이 페이지에 내용과 시행일을 공지합니다.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
