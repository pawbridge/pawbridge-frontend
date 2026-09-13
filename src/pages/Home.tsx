import heroHappyB from '../assets/home/hero-happy-b.webp?inline';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAnimals } from '../api/animals.api';
import { getTodayAnimalStats, getAnimalStatusStats } from '../api/animalStats.api';
import { getAllPosts } from '../api/community.api';
import { kstToday, periodStart, provinces } from '../components/statistics/regionalStats';
import { outcomeRates } from '../utils/animalStatistics';
import { defaultAnimalSearch, writeAnimalSearch } from '../utils/animalSearch';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HomeAnimalCard from '../components/home/HomeAnimalCard';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 dark:focus-visible:outline-primary';
const textLink = `inline-flex min-h-11 items-center text-sm font-bold text-emerald-700 hover:underline dark:text-primary ${focus}`;
const selectStyle = 'h-11 w-full min-w-0 rounded-lg border-border-light bg-white text-base text-text-light focus:border-emerald-700 focus:ring-emerald-700 dark:border-border-dark dark:bg-card-dark dark:text-text-dark';

export default function Home() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('');
  const [species, setSpecies] = useState('');
  const today = kstToday();
  const start = periodStart(today, 30);
  const animals = useQuery({
    queryKey: ['featured-animals'],
    queryFn: () => getAnimals({ page: 0, size: 20, sort: 'createdAt,desc', status: 'PROTECT' }),
  });
  const posts = useQuery({ queryKey: ['posts'], queryFn: getAllPosts });
  const todayStats = useQuery({ queryKey: ['today-animal-stats', today], queryFn: getTodayAnimalStats });
  const statusStats = useQuery({
    queryKey: ['animal-status-stats', start, today],
    queryFn: () => getAnimalStatusStats(start, today),
  });
  const rates = outcomeRates(statusStats.data);
  const featuredAnimals = animals.data?.content.slice(0, 3) ?? [];
  const stories = posts.data?.filter(post => post.boardType === 'ADOPTION').slice(0, 2) ?? [];

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = writeAnimalSearch({ ...defaultAnimalSearch, region, species });
    navigate(`/animals${params.size ? `?${params}` : ''}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display text-text-light dark:bg-background-dark dark:text-text-dark">
      <Header />
      <main className="container mx-auto w-full flex-1 px-4 pb-12 pt-7 md:pb-16 lg:pt-14">
        <section aria-labelledby="home-heading" className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          <div className="min-w-0">
            <h1 id="home-heading" className="text-[1.75rem] font-semibold leading-[1.5] tracking-[-0.02em] sm:text-[2rem] lg:text-[2.5rem]">
              한 번의 만남이,<br />서로의 세상을 바꿉니다.
            </h1>
            <p className="mt-5 hidden text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:block">
              새로운 가족을 기다리는 동물들.<br />지역과 동물 종류로 나에게 맞는 만남을 찾아보세요.
            </p>
            <form aria-label="보호 동물 빠른 검색" onSubmit={search} className="mt-5 rounded-xl border border-border-light p-4 dark:border-border-dark lg:mt-6">
              <div className="grid grid-cols-2 gap-3">
                <label className="min-w-0 text-sm font-medium">지역
                  <select aria-label="지역" name="region" value={region} onChange={event => setRegion(event.target.value)} className={`mt-2 ${selectStyle}`}>
                    <option value="">전국</option>
                    {provinces.map(province => <option key={province.short} value={province.short}>{province.name}</option>)}
                  </select>
                </label>
                <label className="min-w-0 text-sm font-medium">동물 종류
                  <select aria-label="동물 종류" name="species" value={species} onChange={event => setSpecies(event.target.value)} className={`mt-2 ${selectStyle}`}>
                    <option value="">전체</option><option value="DOG">개</option><option value="CAT">고양이</option><option value="ETC">기타</option>
                  </select>
                </label>
              </div>
              <button type="submit" className={`mt-4 min-h-12 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-content transition-colors hover:bg-emerald-300 ${focus}`}>동물 찾아보기</button>
            </form>
          </div>
          <figure className="relative min-w-0">
            <img src={heroHappyB} alt="고개를 갸웃한 복슬복슬한 강아지 대표 이미지" width="1200" height="800" fetchPriority="high" className="aspect-[1.5] w-full rounded-2xl bg-white object-contain lg:absolute lg:inset-0 lg:h-full lg:aspect-auto lg:rounded-2xl" />

          </figure>
        </section>

        <section aria-labelledby="animals-heading" className="mt-12 lg:mt-14">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="animals-heading" className="text-xl font-bold sm:text-2xl">새로운 가족을 기다려요</h2>
            <Link to="/animals" className={`shrink-0 ${textLink}`}>전체보기</Link>
          </div>
          {animals.isPending ? <p role="status" className="py-12 text-gray-600 dark:text-gray-300">보호 동물을 불러오고 있어요.</p>
            : animals.isError && !animals.data ? <div role="alert" className="rounded-xl border border-border-light p-6 dark:border-border-dark"><p>보호 동물을 불러오지 못했어요.</p><button onClick={() => void animals.refetch()} className={textLink}>다시 불러오기</button></div>
              : featuredAnimals.length === 0 ? <p className="py-12 text-gray-600 dark:text-gray-300">현재 표시할 보호 동물이 없습니다.</p>
                : <div className="grid gap-4 md:grid-cols-3 lg:gap-6">{featuredAnimals.map(animal => <HomeAnimalCard key={animal.id} animal={animal} />)}</div>}
          <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">최근 등록된 보호 동물입니다. 현재 보호 상태와 입양 상담은 상세에서 확인해 주세요.</p>
        </section>

        <section aria-labelledby="stories-heading" className="mt-12">
          <h2 id="stories-heading" className="mb-5 text-xl font-bold sm:text-2xl">가족이 된 이후의 이야기</h2>
          {posts.isPending ? <p role="status" className="py-6 text-gray-600 dark:text-gray-300">입양 이야기를 불러오고 있어요.</p>
            : posts.isError && !posts.data ? <div role="alert"><p>입양 이야기를 불러오지 못했어요.</p><button onClick={() => void posts.refetch()} className={textLink}>후기 다시 불러오기</button></div>
              : stories.length === 0 ? <p className="py-6 text-gray-600 dark:text-gray-300">아직 입양 후기가 없습니다. <Link to="/adoption" className={textLink}>입양 후기 보기</Link></p>
                : <div className="grid gap-4 md:grid-cols-2">{stories.map(post => (
                  <Link key={post.postId ?? post.id} to={`/adoption/${post.postId ?? post.id}`} className={`group rounded-2xl border border-border-light p-6 transition-colors hover:border-emerald-600 dark:border-border-dark ${focus}`}>
                    <p className="text-xs text-gray-600 dark:text-gray-400">입양 후기 · {new Date(post.createdAt).toLocaleDateString('ko-KR')}</p>
                    <h3 className="mt-3 break-words text-lg font-bold group-hover:underline">{post.title}</h3>
                    <p className="mt-3 line-clamp-2 break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">{post.content.replace(/\s+/g, ' ').trim()}</p>
                    <span className="mt-4 inline-block text-sm font-bold text-emerald-700 dark:text-primary">이야기 읽기 →</span>
                  </Link>
                ))}</div>}
        </section>

        <section aria-labelledby="stats-heading" className="mt-12 rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/40 sm:p-6">
          <h2 id="stats-heading" className="text-lg font-bold">전국 보호 현황</h2>
          <dl className="mt-5 grid grid-cols-3 gap-3 sm:gap-6">
            {[
              ['오늘 구조', todayStats.data?.rescuedToday?.toLocaleString('ko-KR') ?? '—', '마리'],
              ['입양률 (최근 30일)', rates?.adoptionRate ?? '—', '%'],
              ['안락사율 (최근 30일)', rates?.euthanasiaRate ?? '—', '%'],
            ].map(([label, value, unit]) => <div key={label}><dt className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 sm:text-sm">{label}</dt><dd className="mt-2 text-xl font-bold sm:text-3xl">{value}<span className="ml-1 text-sm font-medium">{unit}</span></dd></div>)}
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{today} 기준 · 비율은 최근 30일 구조 동물 전체의 현재 상태 기준입니다.</p>
          {(todayStats.isError || statusStats.isError) && <p role="status" className="mt-2 text-sm">일부 현황을 불러오지 못했어요. 자세한 현황에서 다시 확인해 주세요.</p>}
          <Link to="/animals/stats" className={`mt-1 ${textLink}`}>유기동물 현황 보기 →</Link>
        </section>

        <nav aria-label="더 둘러보기" className="mt-12 grid divide-y divide-border-light rounded-xl border border-border-light dark:divide-border-dark dark:border-border-dark sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[['/adoption', '입양 후기', '가족이 된 이후의 이야기'], ['/community', '커뮤니티', '궁금한 점을 함께 나눠요'], ['/products', '펫마켓', '반려생활에 필요한 것들']].map(([to, title, description]) => (
            <Link key={to} to={to} className={`flex min-h-16 flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 sm:block ${focus}`}><span className="text-sm font-bold">{title}</span><span className="text-xs text-gray-600 dark:text-gray-400 sm:mt-2 sm:block">{description}</span></Link>
          ))}
        </nav>
      </main>
      <Footer />
    </div>
  );
}
