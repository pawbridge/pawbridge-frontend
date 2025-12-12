import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import placeholderImg from '../assets/image-placeholder.svg';

type BoardType = 'MISSING' | 'PROTECTION' | 'REPORT' | 'FREE';

interface CommunityPostSummary {
  postId: number;
  title: string;
  boardType: BoardType;
  authorId: number;
  createdAt: string;
  imageUrls?: string[];
  views?: number;
}

export const mockPosts: CommunityPostSummary[] = [
  {
    postId: 1,
    title: 'OO동에서 실종된 강아지를 찾습니다.',
    boardType: 'MISSING',
    authorId: 101,
    createdAt: '2024-10-26',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuD7Pg_GffqU4AE_Ze3agQyd1yhST4WQTOOmLTkAnBP1VSdNXgsUF51wEbVRCfu8L-m1L-RRt75NmnXYS3kttvoO14JHiGT4qXPjKEngJ7e8QRwUKh2z0GbhleqheavIkiEVWe8bL1wI97vBEpUK8065rXBIQtDeosjZbYXj8t9QmHAiL0CjbD6OP7dKhqB01Y-XJVHk4oYQ0JDhWeGmwq3ssfTbwHPJzP5l0-aP86LfWL-eL_IvzsF37QS-yAvnRAGM5LjQ_RnJir4'],
  },
  {
    postId: 2,
    title: '보호중인 고양이를 찾습니다.',
    boardType: 'PROTECTION',
    authorId: 102,
    createdAt: '2024-10-26',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDlJt2QC96OImZuGGTI88NtejEZgWWNasB3AHM3PLGpGXPH23FOTSx0tSivUqmZPHChJ3zYLc_B9t2r7ND4wedxJmKGTM_fpjKUqpoXG5ygaT6EE051Xsga9epHJujI9GH7xHuW5-0QUBRBNIlUWnH8fGaSIC09NHmykj1TA2bwT2XFnc43dX38M-FMNHaM7Be0vYTRy31F2jaDc9gfTUzOIEdYxlo5PsYDSkXnHUL3RpdxqG5wLyn1pJtX2899TJXCQBfhhwy88D0'],
  },
  {
    postId: 3,
    title: '강아지를 찾습니다.',
    boardType: 'MISSING',
    authorId: 103,
    createdAt: '2024-10-25',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAl-wzy55nASVdAoFA35PrgwSpNVb_c7CjEkeIMOIqgYvx6nQWEkmvFwjf26WdtS-Klq4xfyGTXu_6xaEsPfbdG3JOyrRaOvxqKWAY9TDTkcJlwhEEOPrRtQXXzu15Z1ItktS6zQSrEY-mkxlOnnmL2wXVUlM4mMsSrhMHQbmQ1hwTyFG9Klo1gm7d4-Wqjpu0xwmFIBkNFqe4aWYSSSLdM7FBvzTPcE1gXdk5G_YHHuJUSFtxn4gOst6pnh3tVmE3r70hOiAR1zNQ'],
  },
  {
    postId: 4,
    title: '고양이를 찾습니다.',
    boardType: 'MISSING',
    authorId: 104,
    createdAt: '2024-10-25',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCtSU28pG6PlzxwTplfEoBpUme_p6FbAln7lo46-pk8DcC-XVPrRSOBSeNYy8IuvdGQJbXhG340CoacxYL34QBOSQoQFamEPdguJHuW7_sdoJU2bTOTw0eA5spwlNeX36tBkKuWauGtmdI1S1F_IGNLCOgzO_0Bm1D9gAwxk0Om87dNXIHecV2PkKipLfUjEgMb5HsmSq8rHLEe_1PM7FweUt_qMEdl06cu9hH1EkQ0T1rxVb_-4rdRfColFn-9cQbllxPJ4HWO7qw'],
  },
  {
    postId: 5,
    title: '보호중인 고양이 주인을 찾습니다.',
    boardType: 'PROTECTION',
    authorId: 105,
    createdAt: '2024-10-24',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuA7I3I3Vth7U5CcYQzJ8n1JD3uJsq1bZ6Kq0190jKizzG6yZdswpf1k0Q-o20R9k07kT1ukkHCOyfXZLP_1iOlCFOhzkpDtE0rd498EiURjDPb8OahlfsEG_DP6hpDk6gBvwT1s3p3GgvJiCo8RnlKsXWWAIPZ2X3wf2YybuVnb_5aH60qINPUrXBzxHHO4SCGJjZ-vLapPl38yN0eeX60u3h9N3DSsd8WT3QIdtDhTM4Ekz46MxG5A4jLTT3tZp_ZYD3xfgRTv75M'],
  },
  {
    postId: 6,
    title: '강아지 주인을 찾습니다.',
    boardType: 'PROTECTION',
    authorId: 106,
    createdAt: '2024-10-24',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBUuA-hOGID5mxh4iYCVyrdAu3f2aoxdFGNspyO-ogSpJBAnmAk-hPu4O-Q9LQeko5fkU_H-Fn7uc_wB9LkCxamg7ofvr9oBi8tctjjLi0O6tSSeywKKNcSTDA1tHXhN3Hpv5VNVxeQ-Q9hMp7YZC7Ysp73pGXEzecb5WclGFMcvQmbQN7tXk9lkUShgUGt205gnXTBYVPwPcdAbRq6faAfQj1NjH1RfOv_7sZDHcrapS-2ls0wR1XzJQsiUQoU1DYdgcqkn9vIx5c'],
  },
  {
    postId: 7,
    title: '주인을 찾습니다.',
    boardType: 'PROTECTION',
    authorId: 107,
    createdAt: '2024-10-23',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCGMjNyZ4-bbegnCcYOh2kMzUcCyLj_A3BBfDY7ioE6PQt7WATsBOfvdlOHDQtF_FkM5AlR-hlZZmN1AXzVfeAOKIeB6PUnQm-PBkXmWxQnKLEj6yjINNslpJ_c_NF5Q5DnekTMXAeZzCMhAYYECWbN4_yF-9_ACkHONg_VRptDuo_YzHE9QZ6W9M3Q3n2Jq_zFRB01lzJ4rbTwOpg9-YSOORVt29V0-z3fIzyE24CZylI9yzOlRqHmsrKcWJ2lDCy6IWa84jaDy1I'],
  },
  {
    postId: 8,
    title: 'OO동에서 실종된 고양이를 찾습니다.',
    boardType: 'MISSING',
    authorId: 108,
    createdAt: '2024-10-23',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuC_71watIg2LiSLHQsm-t5nVdSLtIwMyPf-z5ro_MRYDblJzzgs12pw_4JgH-OHz99KHNGPjDA4iM1kYwkzkl0gdvWOdBUNDgcodEGMs8zatd4YSq3YQZc6Pz2hV7WU8dNFe9nvs_i7CgTO3Et_WbZlOf0jdwfikocEv--7FFdODC19LTM8HTAxC6vsdrm8A9qsK-774JmeeCkdtUMtyXG0zOMeFaXm29sFAByPEn0aeGOr2uAJdPRNtwc09l75T-6bSKYsr24A5IA'],
  },
  // 제보 게시판 목데이터
  {
    postId: 17,
    title: '유기견으로 보이는 강아지 발견',
    boardType: 'REPORT',
    authorId: 301,
    createdAt: '2024-10-26',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuD7Pg_GffqU4AE_Ze3agQyd1yhST4WQTOOmLTkAnBP1VSdNXgsUF51wEbVRCfu8L-m1L-RRt75NmnXYS3kttvoO14JHiGT4qXPjKEngJ7e8QRwUKh2z0GbhleqheavIkiEVWe8bL1wI97vBEpUK8065rXBIQtDeosjZbYXj8t9QmHAiL0CjbD6OP7dKhqB01Y-XJVHk4oYQ0JDhWeGmwq3ssfTbwHPJzP5l0-aP86LfWL-eL_IvzsF37QS-yAvnRAGM5LjQ_RnJir4'],
  },
  {
    postId: 18,
    title: '길에서 떠도는 고양이 제보',
    boardType: 'REPORT',
    authorId: 302,
    createdAt: '2024-10-25',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDlJt2QC96OImZuGGTI88NtejEZgWWNasB3AHM3PLGpGXPH23FOTSx0tSivUqmZPHChJ3zYLc_B9t2r7ND4wedxJmKGTM_fpjKUqpoXG5ygaT6EE051Xsga9epHJujI9GH7xHuW5-0QUBRBNIlUWnH8fGaSIC09NHmykj1TA2bwT2XFnc43dX38M-FMNHaM7Be0vYTRy31F2jaDc9gfTUzOIEdYxlo5PsYDSkXnHUL3RpdxqG5wLyn1pJtX2899TJXCQBfhhwy88D0'],
  },
  {
    postId: 19,
    title: '상처 입은 강아지 발견 제보',
    boardType: 'REPORT',
    authorId: 303,
    createdAt: '2024-10-24',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAl-wzy55nASVdAoFA35PrgwSpNVb_c7CjEkeIMOIqgYvx6nQWEkmvFwjf26WdtS-Klq4xfyGTXu_6xaEsPfbdG3JOyrRaOvxqKWAY9TDTkcJlwhEEOPrRtQXXzu15Z1ItktS6zQSrEY-mkxlOnnmL2wXVUlM4mMsSrhMHQbmQ1hwTyFG9Klo1gm7d4-Wqjpu0xwmFIBkNFqe4aWYSSSLdM7FBvzTPcE1gXdk5G_YHHuJUSFtxn4gOst6pnh3tVmE3r70hOiAR1zNQ'],
  },
  {
    postId: 20,
    title: '공원에서 배회 중인 강아지',
    boardType: 'REPORT',
    authorId: 304,
    createdAt: '2024-10-23',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCtSU28pG6PlzxwTplfEoBpUme_p6FbAln7lo46-pk8DcC-XVPrRSOBSeNYy8IuvdGQJbXhG340CoacxYL34QBOSQoQFamEPdguJHuW7_sdoJU2bTOTw0eA5spwlNeX36tBkKuWauGtmdI1S1F_IGNLCOgzO_0Bm1D9gAwxk0Om87dNXIHecV2PkKipLfUjEgMb5HsmSq8rHLEe_1PM7FweUt_qMEdl06cu9hH1EkQ0T1rxVb_-4rdRfColFn-9cQbllxPJ4HWO7qw'],
  },
  // 자유 게시판 목데이터
  {
    postId: 9,
    title: '강아지 사료 추천해주세요!',
    boardType: 'FREE',
    authorId: 201,
    createdAt: '2024-10-26',
    views: 152,
  },
  {
    postId: 10,
    title: '고양이랑 친해지는 법 공유해요',
    boardType: 'FREE',
    authorId: 202,
    createdAt: '2024-10-25',
    views: 201,
  },
  {
    postId: 11,
    title: '산책하기 좋은 장소 추천!',
    boardType: 'FREE',
    authorId: 203,
    createdAt: '2024-10-25',
    views: 88,
  },
  {
    postId: 12,
    title: '새로운 가족이 생겼어요!',
    boardType: 'FREE',
    authorId: 204,
    createdAt: '2024-10-24',
    views: 312,
  },
  {
    postId: 13,
    title: '유기동물 봉사활동 후기',
    boardType: 'FREE',
    authorId: 205,
    createdAt: '2024-10-23',
    views: 450,
  },
  {
    postId: 14,
    title: '다들 반려동물 이름은 뭔가요?',
    boardType: 'FREE',
    authorId: 206,
    createdAt: '2024-10-22',
    views: 189,
  },
  {
    postId: 15,
    title: '고양이 츄르 뭐 먹이세요?',
    boardType: 'FREE',
    authorId: 207,
    createdAt: '2024-10-22',
    views: 233,
  },
  {
    postId: 16,
    title: '강아지 미용 어디가 잘하나요?',
    boardType: 'FREE',
    authorId: 208,
    createdAt: '2024-10-21',
    views: 110,
  },
];

const boardTabs: { key: BoardType; label: string }[] = [
  { key: 'MISSING', label: '실종 동물' },
  { key: 'PROTECTION', label: '보호 동물' },
  { key: 'REPORT', label: '제보' },
  { key: 'FREE', label: '소통 게시판' },
];

export default function CommunityList() {
  const [activeTab, setActiveTab] = useState<BoardType>('MISSING');
  const filtered = useMemo(
    () => mockPosts.filter((p) => p.boardType === activeTab),
    [activeTab],
  );

  const resolveImage = (urls?: string[]) => {
    const first = urls?.[0];
    if (!first) return placeholderImg;
    try {
      const host = new URL(first).hostname;
      if (host.includes('placeholder.com')) return placeholderImg;
      return first;
    } catch {
      return placeholderImg;
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* PageHeading */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#111816] dark:text-white">
              커뮤니티
            </h1>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px gap-8">
              {boardTabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
                      active
                        ? 'border-primary text-[#111816] dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">{tab.label}</p>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search and Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-6">
            <div className="w-full md:max-w-xs">
              <label className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-gray-400 dark:text-gray-500">search</span>
                <input
                  className="form-input w-full pl-10 pr-4 py-2.5 rounded-lg border-none bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-primary/50"
                  placeholder="제목, 내용으로 검색"
                  type="text"
                />
              </label>
            </div>
                  <div className="relative group w-full md:w-auto">
                    <Link
                      to={activeTab === 'FREE' ? '/community/new?boardType=FREE' : '/community/new'}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-gray-900 text-sm font-bold rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      <span>글쓰기</span>
                    </Link>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max hidden group-hover:block bg-gray-800 text-white text-xs rounded-md py-1.5 px-3 whitespace-nowrap">
                      글을 작성하려면 로그인이 필요해요.
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                    </div>
                  </div>
          </div>

          {/* Content: Table for FREE, Grid for others */}
          {activeTab === 'FREE' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 w-20 text-center" scope="col">
                      번호
                    </th>
                    <th className="px-6 py-3" scope="col">
                      제목
                    </th>
                    <th className="px-6 py-3 w-32 text-center" scope="col">
                      작성자
                    </th>
                    <th className="px-6 py-3 w-32 text-center" scope="col">
                      작성일
                    </th>
                    <th className="px-6 py-3 w-24 text-center" scope="col">
                      조회수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((post, idx) => (
                    <tr
                      key={post.postId}
                      onClick={() => (window.location.href = `/community/${post.postId}`)}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{filtered.length - idx}</td>
                      <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white" scope="row">
                        {post.title}
                      </th>
                      <td className="px-6 py-4 text-center">작성자ID</td>
                      <td className="px-6 py-4 text-center">{post.createdAt}</td>
                      <td className="px-6 py-4 text-center">{post.views || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((post) => (
                <Link key={post.postId} to={`/community/${post.postId}`} className="flex flex-col gap-3 group">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${resolveImage(post.imageUrls)})` }}
                  />
                  <div>
                    <p className="text-base font-medium leading-normal text-[#111816] dark:text-white truncate">
                      {post.title}
                    </p>
                    <p className="text-sm font-normal leading-normal text-gray-500 dark:text-gray-400">
                      작성자 ID · {post.createdAt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center mt-12">
            <nav className="flex items-center gap-2">
              <button className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <button className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-gray-900 text-sm font-bold">
                1
              </button>
              <button className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-600 dark:text-gray-300">
                2
              </button>
              <button className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-600 dark:text-gray-300">
                3
              </button>
              <button className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
}
