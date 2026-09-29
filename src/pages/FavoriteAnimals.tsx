import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFavoriteAnimals } from '../api/user.api';
import { useAuthStore } from '../store/authStore';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FavoriteAnimalCard from '../components/animals/FavoriteAnimalCard';

export default function FavoriteAnimals() {
  const userId = useAuthStore(state => state.user?.id);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['favoriteAnimals', userId],
    queryFn: ({ signal }) => getFavoriteAnimals(signal),
    enabled: !!userId,
  });

  return (
    <div className="flex min-h-screen flex-col bg-white text-brand-ink dark:bg-background-dark dark:text-text-dark">
      <Header />
      <main className="mx-auto w-full max-w-[1568px] flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <nav aria-label="현재 위치" className="mb-8 text-sm text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:underline">홈</Link><span aria-hidden="true" className="mx-2">/</span><span>관심 동물</span>
        </nav>
        <div className="mb-8 border-b border-border-light pb-6 dark:border-border-dark">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">관심 동물</h1>
          {!isLoading && !isError && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">관심 동물 {data?.totalCount ?? 0}마리</p>}
        </div>
        {isLoading ? (
          <div role="status" className="rounded-2xl border border-border-light p-12 text-center dark:border-border-dark">관심 동물을 불러오는 중입니다…</div>
        ) : isError ? (
          <div role="alert" className="rounded-2xl border border-border-light p-12 text-center dark:border-border-dark">
            <p>관심 동물을 불러오지 못했습니다.</p>
            <button type="button" onClick={() => void refetch()} className="mt-5 min-h-11 rounded-lg bg-brand px-6 font-semibold text-brand-ink">다시 시도</button>
          </div>
        ) : data?.favorites.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {data.favorites.map(favorite => <FavoriteAnimalCard key={favorite.favoriteId} favorite={favorite} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-border-light px-5 py-16 text-center dark:border-border-dark">
            <h2 className="text-xl font-bold">아직 관심 동물이 없습니다</h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">동물 목록에서 관심 동물을 추가할 수 있습니다.</p>
            <Link to="/animals" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand px-6 font-semibold text-brand-ink">동물 찾아보기</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
