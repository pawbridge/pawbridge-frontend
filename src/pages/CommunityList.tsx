import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import AuthorContact from '../components/contact/AuthorContact';
import { getAllPosts, searchPosts } from '../api/community.api';
import type { BoardType, PostResponse } from '../types/api.types';
import { useAuthStore } from '../store/authStore';
import Pagination from '../components/common/Pagination';

const boardTabs: { key: BoardType; label: string }[] = [
  { key: 'PROTECTION', label: '보호 동물' },
  { key: 'COMMUNICATION', label: '소통 게시판' },
];

type ListPost = {
  id: number;
  boardType: BoardType;
  title: string;
  authorId: number;
  authorName: string;
  imageUrls: string[];
  createdAt: string;
};
const EMPTY_POSTS: ListPost[] = [];
const mapPost = (post: PostResponse): ListPost => ({
  id: post.postId || post.id,
  boardType: post.boardType,
  title: post.title,
  authorId: post.authorId,
  authorName: post.authorName || `작성자 ${post.authorId}`,
  imageUrls: post.imageUrls || [],
  createdAt: post.createdAt,
});

export default function CommunityList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<BoardType>('COMMUNICATION');
  const [inputValue, setInputValue] = useState(''); // 입력 필드 값
  const [searchKeyword, setSearchKeyword] = useState(''); // 실제 검색 키워드
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12; // 페이지당 게시글 수

  // 게시글 목록 조회 (검색어가 있으면 검색, 없으면 전체 조회)
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', activeTab, searchKeyword, 'all'],
    queryFn: async (): Promise<{ items: ListPost[]; totalPages: number }> => {
      const posts = searchKeyword.trim() ? await searchPosts(searchKeyword.trim()) : await getAllPosts();
      return { items: posts.map(mapPost), totalPages: 0 };
    },
  });
  const posts = data?.items ?? EMPTY_POSTS;

  // 탭에 따라 필터링된 게시글 (전체)
  const allFiltered = useMemo(
    () => posts.filter((p) => p.boardType === activeTab),
    [posts, activeTab],
  );

  // 페이지네이션 계산
  const totalPages = Math.ceil(allFiltered.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const filtered = allFiltered.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 탭 변경 시 첫 페이지로 이동
  const handleTabChange = (tab: BoardType) => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  // 검색 실행
  const handleSearchSubmit = () => {
    setSearchKeyword(inputValue);
    setCurrentPage(0);
  };

  // 엔터 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // 글쓰기 버튼 클릭 핸들러
  const handleWriteClick = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    navigate(`/community/new?boardType=${activeTab}`);
  };

  const resolveImage = (urls?: string[]) => {
    if (!urls || urls.length === 0) return null;
    const first = urls[0];
    if (!first) return null;
    return first;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400">게시글을 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p role="alert" className="text-lg text-red-600 dark:text-red-400">목록을 불러오지 못했습니다.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{(error as Error).message}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* PageHeading */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-brand-ink dark:text-white">
              커뮤니티
            </h1>
          </div>

          {/* Tabs */}
          <p className="mb-6 rounded-xl bg-brand-soft p-4 text-sm text-brand-ink dark:bg-gray-800 dark:text-white">
            실종 알림과 목격 제보는 <Link to="/reports/missing" className="font-bold underline underline-offset-4">실종동물 찾기</Link>에서 확인하고 등록해 주세요.
          </p>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px gap-8">
              {boardTabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
                      active
                        ? 'border-brand-focus text-brand-ink dark:text-white'
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
                  className="form-input w-full pl-10 pr-4 py-2.5 rounded-lg border-none bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-brand-focus"
                  placeholder="제목, 내용으로 검색 (Enter)"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </label>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-brand-muted dark:text-gray-400">
                <span className="material-symbols-outlined text-lg">lock</span>
                <span>열람은 누구나 · 작성은 로그인 후</span>
              </div>
              <button
                onClick={handleWriteClick}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-gray-900 text-sm font-bold rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                <span>글쓰기</span>
              </button>
            </div>
          </div>

          {/* Content: Table for COMMUNICATION, Grid for others */}
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500 dark:text-gray-400">게시글이 없습니다.</p>
            </div>
          ) : activeTab === 'COMMUNICATION' ? (
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((post, idx) => (
                    <tr
                      key={post.id}
                      onClick={() => navigate(`/community/${post.id}`)}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{filtered.length - idx}</td>
                      <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white" scope="row">
                        {post.title}
                      </th>
                      <td className="px-6 py-4 text-center" onClick={event => event.stopPropagation()}><AuthorContact memberId={post.authorId} nickname={post.authorName || `작성자 ${post.authorId}`} contextType="POST" contextId={post.id} /></td>
                      <td className="px-6 py-4 text-center">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((post) => {
                const imageUrl = resolveImage(post.imageUrls);
                return (
                  <div key={post.id} className="flex flex-col gap-3 group"><Link to={`/community/${post.id}`}>
                    {imageUrl ? (
                      <div
                        className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">image</span>
                      </div>
                    )}
                    <div>
                      <p className="text-base font-medium leading-normal text-brand-ink dark:text-white truncate">
                        {post.title}
                      </p>
                    </div>
                  </Link>
                  <div className="text-sm text-gray-500 dark:text-gray-400"><AuthorContact memberId={post.authorId} nickname={post.authorName || `작성자 ${post.authorId}`} contextType="POST" contextId={post.id} /> <time>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</time></div></div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showPagination={filtered.length > 0}
          />
        </div>
      </main>
    </div>
  );
}
