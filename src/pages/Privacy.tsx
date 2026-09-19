import AnalyticsSettingsButton from '../components/analytics/AnalyticsSettingsButton';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';

const sectionClass = 'border-t border-gray-200 pt-7 dark:border-gray-700';

export default function Privacy() {
  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display text-text-light dark:bg-background-dark dark:text-text-dark">
      <Header />
      <main className="container mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
        <header>
          <p className="text-sm font-bold text-emerald-700 dark:text-primary">개인정보 안내</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">개인정보처리방침</h1>
          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">시행일: 2026년 9월 19일</p>
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
            <h2 className="text-xl font-bold text-text-light dark:text-white">Microsoft Clarity 이용 분석</h2>
            <p className="mt-4">
              포우브릿지는 이용자가 선택적으로 동의한 경우에만 Microsoft Clarity를 사용해 공개 화면의 클릭,
              스크롤, 화면 이동과 기기·브라우저 정보를 분석합니다. 이 정보는 화면 사용성을 개선하고 오류가
              발생하는 지점을 찾는 데 사용합니다.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>로그인, 회원가입, 비밀번호 재설정, 마이페이지, 주문, 관리자 및 작성·수정 화면은 수집 대상에서 제외합니다.</li>
              <li>사용자의 이메일이나 회원 식별자를 Clarity에 전달하지 않습니다.</li>
              <li>검색어, 품종, 공고번호 또는 상세 지역이 URL에 포함된 화면은 수집하지 않습니다.</li>
              <li>Clarity의 입력란과 선택 목록 내용은 모든 마스킹 모드에서 가려집니다.</li>
              <li>광고 목적 저장은 허용하지 않고 이용 분석 저장에만 동의를 전달합니다.</li>
            </ul>
            <p className="mt-4">
              자세한 처리 방식은{' '}
              <a className="font-semibold text-emerald-700 underline underline-offset-4 dark:text-primary" href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noreferrer">
                Microsoft 개인정보처리방침
              </a>
              에서 확인할 수 있습니다.
            </p>
            <AnalyticsSettingsButton className="mt-5" />
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">보관과 이용자 권리</h2>
            <p className="mt-4">
              정보는 서비스 제공 목적을 달성할 때까지 보관하며, 관계 법령에 별도 보관 의무가 있는 경우 해당
              기간 동안 보관할 수 있습니다. 이용자는 계정 정보 확인·수정과 분석 동의 변경을 요청하거나 직접
              수행할 수 있습니다. 분석을 허용하지 않아도 포우브릿지의 기본 기능을 이용할 수 있습니다.
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
