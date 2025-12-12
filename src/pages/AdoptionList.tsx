import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { getAllPosts } from '../api/community.api';
import { useAuthStore } from '../store/authStore';

export default function AdoptionList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // 입양후기 게시글 조회 (ADOPTION 타입만)
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: getAllPosts,
  });

  // ADOPTION 타입만 필터링
  const adoptionPosts = posts.filter((p) => p.boardType === 'ADOPTION');

  const resolveImage = (urls?: string[]) => {
    if (!urls || urls.length === 0) return null;
    const first = urls[0];
    if (!first) return null;
    return first;
  };

  // 작성하기 버튼 클릭 핸들러
  const handleWriteClick = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    navigate('/adoption/new');
  };

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">게시글을 불러오는 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-lg text-red-600 dark:text-red-400">게시글을 불러오는데 실패했습니다.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-[#111816] dark:text-gray-200">
      <Header />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* PageHeading */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8 sm:mb-12">
          <div className="flex min-w-72 flex-col gap-2">
            <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#111816] dark:text-white">입양후기</p>
            <p className="text-base font-normal leading-normal text-[#5f8c80] dark:text-gray-400">커뮤니티의 따뜻한 이야기들을 만나보세요.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#5f8c80] dark:text-gray-400">
              <span className="material-symbols-outlined text-lg">lock</span>
              <span>로그인이 필요한 서비스입니다.</span>
            </div>
            <button
              onClick={handleWriteClick}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#111816] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
            >
              <span className="truncate">작성하기</span>
            </button>
          </div>
        </div>

        {/* ImageGrid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adoptionPosts.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">입양 후기가 없습니다.</p>
            </div>
          ) :
            adoptionPosts.map((post) => {
              const imageUrl = resolveImage(post.imageUrls);
              return (
                <Link
                  key={post.postId}
                  to={`/adoption/${post.postId}`}
                  className="group flex flex-col gap-3 pb-3 cursor-pointer"
                >
                  {imageUrl ? (
                    <div className="overflow-hidden rounded-lg">
                      <div
                        className="w-full bg-center bg-no-repeat aspect-video bg-cover transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${imageUrl})`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700 aspect-video flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">image</span>
                    </div>
                  )}
                  <div>
                    <p className="text-base font-medium leading-normal text-[#111816] dark:text-white">{post.title}</p>
                    <p className="text-sm font-normal leading-normal text-[#5f8c80] dark:text-gray-400">
                      {post.authorNickname || `작성자 ${post.authorId}`} • {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </Link>
              );
            })
          }
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center p-4 mt-8 sm:mt-12">
          <button className="flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white">
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>
          <button className="text-sm font-bold leading-normal tracking-[0.015em] flex size-10 items-center justify-center text-[#111816] dark:text-white rounded-full bg-primary/30">
            1
          </button>
          <button className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white rounded-full">
            2
          </button>
          <button className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white rounded-full">
            3
          </button>
          <button className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white rounded-full">
            4
          </button>
          <button className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white rounded-full">
            5
          </button>
          <button className="flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white">
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
