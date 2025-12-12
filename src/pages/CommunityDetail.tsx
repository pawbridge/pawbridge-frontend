import { Link, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import placeholderImg from '../assets/image-placeholder.svg';
import { mockPosts } from './CommunityList';

// 상세 페이지용 확장된 데이터 (이미지, 댓글 포함)
const mockPostDetails: Record<number, any> = {
  1: {
    postId: 1,
    title: 'OO동에서 실종된 강아지를 찾습니다.',
    content: `2023년 10월 26일 저녁 8시경 OO동 OO공원 근처에서 저희 집 강아지 '몽이'를 잃어버렸습니다.

특징은 다음과 같습니다:
- 품종: 믹스견 (진돗개 + 리트리버 믹스)
- 나이: 3살
- 성별: 수컷 (중성화 완료)
- 특징: 등쪽에 하얀색 하트 모양의 무늬가 있습니다. 겁이 많아서 사람이 다가가면 도망갈 수 있습니다. 파란색 목줄을 하고 있었습니다.

혹시 몽이를 보셨거나 보호하고 계신 분은 꼭 연락 부탁드립니다. 사례는 꼭 하겠습니다.`,
    boardType: 'MISSING',
    authorId: 101,
    createdAt: '2023.10.27',
    imageUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCa4HLESnS_vedM0-64iW8jrj6J870TK2Ls3VoUJQgEhL40TsCHF7-c78VrKiG_k_IHz_koRLrkkoPMur-56nEO1JVmq39Nl5QjtugrTHkVrCo-umVIvdvB4lBOlsvQT4PS2dQmPJYxcnvEi9Tq8fkMa-v8Y_u1IU-wznE57Ko9Z_AnPaytJDYKG4ll6ttOKPT_R14QqORxfYWjpP76zZNddeAfTMd6DJj01MTTQDNN2Bm5RCLS9f0Tax45isucgq64mQS4X4jZJzA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA5P0al2KQj7GF-rAGH2UsRztw8I99thG9VebEPn1zJZE80KITDRLsLQE-JviBSDxGipe6B7n4f6uSlAn1HYXSKIWW2FVNIco2kL8q7GJWU_1hnvqadRU8LIZ3VK3evYzD0Pt0fZqMbZEFBTDeqrGdivvcsUTUZgUjcNZ5LJwBhXrIElzRFzjL8EjP0N4vaXkroxAZSOLgchIXHDy0FKG-uMTWwTUxSLP0vvv5QIu7CCCT_s_5nFTjkYLRXIzZIH_IPJr14qZDETrU',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAdZ3_HwivJhjGIRn9NfJ8rCG0xS_SAot84FiIgsCDqw3aZ0QZpkUqJCkdt6Ht9GawSzmJLGkgy3Bf3AlhEWAr4H_PFU2M0t8MVYjFfRiot3dEq83mK3RUeloANvYCJlQ02h5cjLb6adwj9eRnNRhMuESYF282doOQqoqc-6G19FkcUDK0AIiBmH08VfcFiE_QQuDBwGtV5vUWlC60aUNz2EZJMdoDFOTAjl9HXU1CcAG7RF0TI6U39Y9znkj4MGcHSI0CG4SRTMdM',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA03za-Lxw_vohlM7hUi8vOrGMEqa_akQcF55_qUfPwHXe0a-5brJ7U7qOlTnF8Hh1AlHUDqXYGowIxyQZ1vpvYXD7PHQHEAh-WCKessdMveRJHJsgB1OHyN6aUX9qssjn-ntADp_RQNGdsFTWQz3vJOOo4lvTItKycsFQmOEVpVAo17RH_hFlV5ALo_qad8yyqT8c-KFHjoGgLQRc1kqR252eQ9A4Ze101mPaH9ETtChKoW0bI7Grm4DR_qS5eYshpICw0fz6GaEw',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgKp6QPkENECBqF7ydpLt27hJPAy9E1ZzBprBmIqx0NspZd3CE-h4GjKNLNcWtvf5TpzWQIWeT28COjoRNzRce9awbYgJ7UTKirICGX7DkueE4N1ayJUTf5kbeNQ9mGTq5_K7dIGmEW2zJ8O21j5gzjDcysX9fn1PRE3iziBeH9RxbLK1ffJ9hdtuaWdem5x5dApiOVuj_KPE8MDC7cEcHpcxOag-zAOKWCGf5cZYHi8-3YyATfWwZViwXqeKoKPYQlFsn03Jec4A',
    ],
  },
  // 소통 게시판 글 예시
  9: {
    postId: 9,
    title: '새로운 가족이 된 우리 냥이를 소개합니다!',
    content: `안녕하세요! 얼마 전 포우 브릿지를 통해 입양한 고양이 '루나'를 소개합니다. 처음 집에 왔을 때는 조금 낯설어했지만, 이제는 완전한 애교쟁이가 되었어요. 매일 아침마다 제 얼굴 옆에서 골골송을 불러주며 깨워준답니다. 

입양을 고민하시는 분들이 계시다면 주저하지 마세요. 아이들에게 따뜻한 가족이 되어주는 것은 정말 행복한 경험입니다. 다른 집사님들과도 많이 소통하고 싶어요!`,
    boardType: 'FREE',
    authorId: 201,
    authorName: '냥냥펀치마스터',
    createdAt: '2024.08.15',
    views: 123,
    imageUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBsdn11oEk0aVreF2_EuJXcgGRQiCc4TQuUZwneR_U7I_3hDBqQKr0zH8f3L_b22ywAxH_Axxwfayd4c-hxgFofvfwfoQXoJXRhEt3KpnlRibgwCoz-rwagaQQlzN4zNHMFKM-6FjBs9zpbg5eernAdzvfnC4joIUhRN3pWYaxzbZUgzoNOk7565gprl0UmeCJ6Q_v9TYVJNU9jOLgXTzdwtEfBGDb6kSxhPFcYXoYUuQUC1ZLdLfgFbCMr3-8Qsh75dJWaudgCCkU',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDytvU9xaYy9h76Kg0Av24W8kYb5R8Z3tDJ3vRsw0PyDnLzGAZ7CWwgNlvXmU0gXL7WkmILP-u5yq_6av_iJMICCyqVQ8xIVc80ofN4TqPw78MfYq0ZPHNBXjw2BGU2pa1tVj9EeHZYztNUaQlWBWYNI5lOE7F35bMPnWFuf3mjhCPj2vcNdVnT6lXi8r6T4nykd6QprUtWA7Ri9L4NHpoSbWFtV5wKrPbPRriEiY6erho33coEBl-7g_HFvu9qyy2qmqv1o4uhWco',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBLJhwTooQPFoH6qaeH1SzP-zWesJ7ypoGIFWTmKcUk6LBHn7y8rEv3ztNnYJy0KoqN-Bn1izRItLk9BG9L7nFAUzS7MwKlnAafoWEcP5eInyX69-TdtU-Lgrnm_waLbmJ1WfV_C865rAhcK4d3IaTL5bTc9DfxrEu3ZbAfWualehRZzUtrvkDnHwpdsGhoj0TkWFdLxztYDEhdWz3SaKhWUiMjgWSMq8G5dRFRQSS5gwu7PHk43PaNNU0I_lRWzYkyWhno_8AJufQ',
    ],
  },
  10: {
    postId: 10,
    title: '고양이랑 친해지는 법 공유해요',
    content: `길고양이와 친해지고 싶은데 쉽지 않네요. 조금씩 다가가고 있긴 한데, 더 빨리 친해지는 방법이 있을까요?

지금은 매일 같은 시간에 간식을 주고 있는데, 이게 맞는 방법인지 궁금합니다.`,
    boardType: 'FREE',
    authorId: 202,
    createdAt: '2024.10.25',
    imageUrls: [],
  },
};

const mockComments: Record<number, any[]> = {
  1: [
    {
      commentId: 1,
      authorId: 201,
      authorName: 'angel1004',
      content: '꼭 찾으시길 바랍니다! 제가 사는 동네 근처라 유심히 볼게요.',
      createdAt: '2023.10.27',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOMuGcsiFsvpmZYsHA_ldhey55l1lsF08vmeXuKh3E5sdX-as0_M7UORzqpf3N3tRCZQG3JliVOunz0_v4khq-XUb2RUgE4JRKWdLpfaJrARHOQtMIN1A_a6oPdaei5Fhq13RTWMwbvrLMG60FbPYsCotKbCEdQgpRrxmkbBYKhDOo4OZYJWrrEb9B1h1dU4_0RiHwLibgjO2Yj_XbORBGr0G6J6YxHkk7tqsyf0Gg8Km3vzUEibtx-QWm568XPnTsEykGmT-07gk',
    },
    {
      commentId: 2,
      authorId: 202,
      authorName: 'doglover',
      content: '어제 저녁에 OO마트 앞에서 비슷한 강아지를 본 것 같아요! 확실하지는 않지만 확인해보세요.',
      createdAt: '2023.10.28',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf0pke6FF4eBpcIM0O5JJrPZVc35Ta1l1u5_Mqkgr3_IlIx73yZpqKvIRFI6qVpZZdFNIqOF2qdEzyweNsJZ8TIn4wKribT3zbo-Xn7d6IhL84YSC6WF9x4evGazEgvK-4MkpuoKuwSZgh4_7xbwvz_eQFEkheIWT0wr8f2qPo6YquxTjYyszGPWe0Gkse00hvf8RJCII7rjwDLppvkdORMQif3ft-uGnVFmtJASWS5G4gD-_fsDzLdfnQ5fXggsAhaVX9qkAmPmc',
    },
  ],
  9: [
    {
      commentId: 1,
      authorId: 301,
      authorName: '멍뭉이사랑',
      content: '루나 너무 예쁘네요! 저희 집 댕댕이랑 친구하면 좋겠어요. 항상 행복하세요!',
      createdAt: '2024.08.15 14:30',
      avatar: null,
    },
    {
      commentId: 2,
      authorId: 302,
      authorName: '사지말고입양하세요',
      content: '좋은 가족을 만나서 다행이에요. 글 보고 저도 마음이 따뜻해졌습니다.',
      createdAt: '2024.08.15 18:55',
      avatar: null,
    },
  ],
  10: [],
};

const boardLabel: Record<string, string> = {
  MISSING: '실종',
  PROTECTION: '보호',
  REPORT: '제보',
  FREE: '소통 게시판',
};

const resolveImage = (url: string) => {
  if (!url) return placeholderImg;
  try {
    const host = new URL(url).hostname;
    if (host.includes('placeholder.com')) return placeholderImg;
    return url;
  } catch {
    return placeholderImg;
  }
};

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = id ? parseInt(id, 10) : 1;

  // mockPostDetails에 있으면 사용, 없으면 mockPosts에서 찾기
  let mockPost = mockPostDetails[postId];
  if (!mockPost) {
    const listPost = mockPosts.find((p) => p.postId === postId);
    if (listPost) {
      mockPost = {
        ...listPost,
        content: `${listPost.title}에 대한 상세 내용입니다.`,
        imageUrls: listPost.imageUrls || [],
      };
    } else {
      // 기본값
      mockPost = mockPostDetails[1];
    }
  }

  const isFreeBoard = mockPost.boardType === 'FREE';
  const mainImage = mockPost.imageUrls?.[0] || placeholderImg;
  const thumbnails = mockPost.imageUrls?.slice(1) || [];
  const comments = mockComments[postId] || [];

  // 소통게시판 전용 레이아웃
  if (isFreeBoard) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
        <Header />
        <main className="flex flex-1 justify-center py-5 sm:py-10 px-4">
          <div className="flex flex-col max-w-4xl flex-1 gap-8">
            <div className="px-4">
              <h1 className="text-[#111816] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                소통 게시판
              </h1>
            </div>

            {/* Post Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-col gap-6 p-6 md:p-8">
                <div className="flex flex-col gap-3 pb-6">
                  <span className="inline-block px-2.5 py-1 bg-primary/20 dark:bg-primary/30 text-primary text-xs font-semibold rounded-full self-start">
                    소통 게시판
                  </span>
                  <h2 className="text-[#111816] dark:text-white tracking-tight text-2xl md:text-3xl font-bold leading-tight">
                    {mockPost.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                    <span className="font-medium text-[#111816] dark:text-white">
                      {mockPost.authorName || `user${mockPost.authorId}`}
                    </span>
                    <span>{mockPost.createdAt}</span>
                    {mockPost.views && <span>조회수 {mockPost.views}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-8 py-2 border-t border-gray-200 dark:border-gray-700 pt-8">
                  <p className="text-[#111816] dark:text-gray-300 leading-relaxed text-base whitespace-pre-line">
                    {mockPost.content}
                  </p>

                  {/* Image Grid - 소통게시판은 그리드 형태 */}
                  {mockPost.imageUrls && mockPost.imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mockPost.imageUrls.map((url: string, idx: number) => (
                        <div key={idx} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          {url ? (
                            <img
                              alt={`Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                              src={resolveImage(url)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = placeholderImg;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-center text-gray-400 dark:text-gray-500">
                              <div>
                                <span className="material-symbols-outlined text-4xl">image_not_supported</span>
                                <p className="text-xs mt-1">이미지 로드 실패</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to={`/community/${postId}/edit`}
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/30 text-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors"
                  >
                    <span className="truncate">수정</span>
                  </Link>
                  <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#111816] dark:hover:text-white transition-colors">
                    <span className="truncate">삭제</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Comments Card - 별도 카드로 분리 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="flex flex-col gap-6 p-6 md:p-8">
                <h3 className="text-[#111816] dark:text-white text-lg font-bold">댓글 {comments.length}개</h3>

                {/* Comment Input Form */}
                <div className="flex flex-col gap-3">
                  <textarea
                    className="w-full bg-gray-50 dark:bg-gray-900 text-[#111816] dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="따뜻한 댓글을 남겨주세요..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <button className="flex min-w-[96px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#111816] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-opacity-80 transition-colors">
                      <span className="truncate">등록</span>
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="flex flex-col gap-6 pt-4">
                  {comments.map((comment) => (
                    <div key={comment.commentId} className="flex gap-4">
                      <div className="flex-shrink-0">
                        {comment.avatar ? (
                          <div
                            className="w-10 h-10 rounded-full bg-center bg-no-repeat bg-cover"
                            style={{ backgroundImage: `url(${comment.avatar})` }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">
                              {comment.commentId % 2 === 0 ? 'pets' : 'person'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-[#111816] dark:text-white text-sm">{comment.authorName}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">{comment.createdAt}</span>
                        </div>
                        <p className="text-[#111816] dark:text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 기존 커뮤니티 레이아웃 (실종/보호/제보)
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-[#111816] dark:text-gray-200">
      <Header />
      <main className="flex w-full flex-1 justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-4xl flex-col gap-8">
          {/* Post Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/30 px-4">
                <p className="text-[#111816] dark:text-gray-800 text-sm font-bold leading-normal">
                  {boardLabel[mockPost.boardType] || '커뮤니티'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[#111816] dark:text-gray-100 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                {mockPost.title}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal mt-3">
                user{mockPost.authorId} · {mockPost.createdAt}
              </p>
            </div>
          </div>

          {/* Image Gallery - 이미지가 있을 때만 표시 */}
          {mockPost.imageUrls && mockPost.imageUrls.length > 0 && (
            <div className="flex flex-col gap-4">
              <div
                className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-xl aspect-video"
                style={{ backgroundImage: `url(${resolveImage(mainImage)})` }}
              />
              {thumbnails.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {thumbnails.map((url, idx) => (
                    <div
                      key={idx}
                      className={`w-full bg-center bg-no-repeat bg-cover aspect-square rounded-lg ${
                        idx === 0 ? 'border-2 border-primary' : 'cursor-pointer opacity-70 hover:opacity-100 transition-opacity'
                      }`}
                      style={{ backgroundImage: `url(${resolveImage(url)})` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Post Body */}
          <div className="flex flex-col gap-4">
            <p className="text-[#111816] dark:text-gray-300 text-base font-normal leading-relaxed whitespace-pre-line">
              {mockPost.content}
            </p>
          </div>

          {/* Action Buttons (for author) */}
          <div className="flex justify-end gap-2">
            <Link
              to={`/community/${postId}/edit`}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/30 text-[#111816] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors"
            >
              <span className="truncate">수정</span>
            </Link>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-500/20 text-red-700 dark:text-red-300 dark:bg-red-500/30 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-red-500/30 dark:hover:bg-red-500/40 transition-colors">
              <span className="truncate">삭제</span>
            </button>
          </div>

          <hr className="border-gray-200 dark:border-gray-700 my-4" />

          {/* Comments Section */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-[#111816] dark:text-gray-100">댓글 {comments.length}개</h3>

            {/* Comment Input Form (Logged In) */}
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 text-[#111816] dark:text-gray-200 focus:border-primary focus:ring-primary focus:ring-opacity-50"
                placeholder="따뜻한 댓글을 남겨주세요."
                rows={3}
              />
              <div className="flex justify-end">
                <button className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#111816] text-sm font-bold leading-normal tracking-[0.015em] hover:brightness-90 transition-all">
                  <span className="truncate">댓글 등록</span>
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex flex-col gap-6">
              {comments.map((comment) => (
                <div key={comment.commentId} className="flex gap-4">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0 bg-gray-200"
                    style={{ backgroundImage: comment.avatar ? `url(${comment.avatar})` : undefined }}
                  />
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111816] dark:text-gray-100">{comment.authorName}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{comment.createdAt}</span>
                    </div>
                    <p className="text-[#111816] dark:text-gray-300 mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
