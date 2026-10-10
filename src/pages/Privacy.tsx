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
          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">시행일: 2026년 10월 7일</p>
        </header>

        <div className="mt-10 space-y-8 text-sm leading-7 text-gray-700 dark:text-gray-200">
          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">처리하는 정보와 목적</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>회원 기능: 이메일, 이름, 인증 결과를 가입, 로그인, 계정 관리에 사용합니다.</li>
              <li>보호소 담당자 신청: 신청한 보호소와 승인 상태를 담당자 권한 확인에 사용합니다.</li>
              <li>게시글 및 등록 동물: 이용자가 작성한 내용과 이미지를 해당 기능 제공에 사용합니다.</li>
              <li>비공개 쪽지: 발신·수신 회원, 본문, 발송·읽음 시각과 개인 즐겨찾기·차단 상태를 회원 간 연락과 쪽지함 제공에 사용합니다. 알림에는 본문을 표시하지 않습니다.</li>
              <li>회원 간 1:1 채팅: 참여 회원, 메시지, 관련 글 참조, 전송·읽음 시각과 개인 숨김 상태를 대화 제공에 사용합니다. 알림에는 본문을 표시하지 않습니다.</li>
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
            <h2 className="text-xl font-bold text-text-light dark:text-white">YouTube 영상</h2>
            <p className="mt-4">홈 영상의 제목·채널·썸네일 등은 YouTube Data API Services를 통해 확인합니다. 영상 원본은 YouTube가 제공합니다. 재생 버튼을 누르면 YouTube의 공식 플레이어를 불러오며, 자동 재생하지 않습니다. 썸네일 조회와 플레이어 이용 시 IP 주소 등 접속 정보가 Google에 전달될 수 있고, 플레이어에서 광고나 쿠키 등 YouTube의 기능이 제공될 수 있습니다.</p>
            <p className="mt-4">영상 이용에는 <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="underline underline-offset-4">YouTube 서비스 약관</a>과 <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-4">Google 개인정보처리방침</a>이 적용됩니다.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-text-light dark:text-white">보관과 이용자 권리</h2>
            <p className="mt-4">채팅 메시지는 발송일부터 최대 1년간 보관하며 기간이 지난 원문은 주기적으로 삭제합니다. 내 목록에서 숨기기는 상대방 기록이나 원문을 삭제하지 않습니다. 탈퇴 시 해당 회원의 접근과 회원 연결 정보를 제거하고, 남은 상대의 기록은 보관 기간 안에서 유지할 수 있습니다. 본문에 직접 작성한 개인정보는 자동으로 익명화되지 않으므로 처리 요청으로 문의해 주세요. 남은 참여자가 없으면 원문을 정리합니다.</p>
            <p className="mt-4">쪽지는 발송일부터 1년이 지나면 조회할 수 없으며 원문을 주기적으로 정리합니다. 양쪽 쪽지함에서 모두 제거되면 그 전에 삭제합니다. 회원 삭제 시 해당 회원의 쪽지함과 연결 정보를 제거하지만 상대방 쪽지함의 본문은 남을 수 있습니다. 본문에 직접 작성한 개인정보는 자동으로 지워지지 않으므로 개인정보 처리 요청으로 문의해 주세요. 임시 전송 기록은 발송일부터 48시간이 지났고 원문이 삭제된 경우 주기적으로 정리합니다. 이 기록은 재전송 중복과 발송 제한 우회를 막기 위한 것이며 쪽지 본문을 보관하지 않습니다.</p>
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
