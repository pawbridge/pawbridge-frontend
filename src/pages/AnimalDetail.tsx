import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAnimalById, checkFavorite, addFavorite, removeFavorite, getSimilarAnimals } from '../api/animals.api';
import { publicShelterById } from '../api/publicShelters.api';
import { shelterTelephone } from '../lib/shelters';
import { animalAgeLabel, animalGenderLabel, animalSpeciesLabel, animalStatusLabel } from '../lib/animalDisplay';
import { readLostSearchSession } from '../utils/lostSearchSession';
import { animalSearchReturnTo } from '../utils/animalSearch';
import { useAuthStore } from '../store/authStore';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnimalCardSimple from '../components/common/AnimalCardSimple';
import AnimalChatbot from '../components/common/AnimalChatbot';

const dateLabel = (date?: string) => date ? date.slice(0, 10).replace(/-/g, '.') : null;
const errorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || fallback : fallback;

export default function AnimalDetail() {
  const { id } = useParams<{ id: string }>();
  const animalId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const fromMyPage = location.state?.from === 'mypage';
  const fromFavorites = location.state?.from === 'favorites';
  const previousTab = location.state?.tab || sessionStorage.getItem('mypageActiveTab') || 'registeredAnimals';
  const fromLostSearch = location.state?.from === 'lost-search';
  const searchReturnTo = animalSearchReturnTo(location.state?.searchReturnTo);
  const returnToSearch = () => {
    if (fromMyPage) navigate('/mypage', { state: { tab: previousTab } });
    else if (fromFavorites) navigate('/favorite-animals');
    else if (fromLostSearch && readLostSearchSession(location.state?.lostSearchEntryKey)) navigate(-1);
    else navigate(fromLostSearch ? '/animals/lost' : searchReturnTo);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImage('');
    setImageFailed(false);
    if (fromMyPage) sessionStorage.setItem('mypageActiveTab', previousTab);
  }, [id, fromMyPage, previousTab]);

  const { data: animal, isLoading, isError, refetch } = useQuery({
    queryKey: ['animal', id], queryFn: () => getAnimalById(animalId), enabled: Number.isInteger(animalId) && animalId > 0,
  });
  const { data: shelter } = useQuery({
    queryKey: ['publicShelter', animal?.shelterId],
    queryFn: ({ signal }) => publicShelterById(animal!.shelterId, signal),
    enabled: !!animal?.shelterId,
    retry: 1,
  });
  const similarQuery = useQuery({
    queryKey: ['similarAnimals', id], queryFn: () => getSimilarAnimals(animalId),
    enabled: !!animal, retry: 1,
  });
  const favoriteQuery = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: ({ signal }) => checkFavorite(animalId, signal),
    enabled: !!animal && !!user,
  });
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (favoriteQuery.data) await removeFavorite(animalId);
      else await addFavorite(animalId);
    },
    onSuccess: () => {
      setActionMessage('');
      void queryClient.invalidateQueries({ queryKey: ['favorite', id, user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['favoriteAnimals', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['animal', id] });
    },
    onError: error => setActionMessage(errorMessage(error, '관심 동물 변경에 실패했습니다. 다시 시도해 주세요.')),
  });
  const handleFavorite = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (favoriteQuery.isError) {
      void favoriteQuery.refetch();
      return;
    }
    if (!favoriteQuery.isLoading) favoriteMutation.mutate();
  };
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: animal?.breed || '동물 정보', url });
      else {
        await navigator.clipboard.writeText(url);
        setActionMessage('링크를 복사했습니다.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setActionMessage('링크를 복사하지 못했습니다.');
    }
  };

  if (isLoading) return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-background-dark"><Header />
      <main role="status" className="mx-auto w-full max-w-[1520px] flex-1 px-4 py-20 text-center text-brand-ink dark:text-text-dark">동물 정보를 불러오는 중입니다…</main><Footer />
    </div>
  );
  if (isError || !animal) return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-background-dark"><Header />
      <main className="mx-auto w-full max-w-[1520px] flex-1 px-4 py-20 text-center text-brand-ink dark:text-text-dark">
        <h1 className="text-2xl font-bold">동물 정보를 볼 수 없습니다</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">잠시 후 다시 시도하거나 목록으로 돌아가 주세요.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => void refetch()} className="min-h-11 rounded-lg bg-brand px-5 font-semibold text-brand-ink">다시 시도</button>
          <button onClick={returnToSearch} className="min-h-11 rounded-lg border border-border-light px-5">목록으로</button>
        </div>
      </main><Footer />
    </div>
  );

  const images = [animal.imageUrl, animal.imageUrl2].filter((image): image is string => !!image);
  const photo = selectedImage || images[0];
  const noticeNo = animal.apmsNoticeNo || animal.noticeNo;
  const phone = shelter?.phone || shelter?.publicInformation?.phone || animal.shelter?.phone;
  const telephone = shelterTelephone(phone);
  const shelterName = shelter?.name || animal.shelterName || animal.shelter?.name;
  const isManualAnimal = animal.apiSource === 'MANUAL' || noticeNo?.startsWith('MAN-');
  const isMyShelter = user?.role === 'ROLE_SHELTER' && !!user.careRegNo &&
    user.careRegNo === (animal.careRegNo || shelter?.careRegNo);
  const isMyAnimal = isManualAnimal && isMyShelter;
  const daysLeft = animal.noticeEndDate
    ? Math.ceil((new Date(animal.noticeEndDate.slice(0, 10) + 'T23:59:59').getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-white text-brand-ink dark:bg-background-dark dark:text-text-dark">
      <Header />
      <main className="mx-auto w-full max-w-[1368px] flex-1 px-4 pb-16 pt-7 sm:px-6">
        <nav aria-label="현재 위치" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:underline">홈</Link><span aria-hidden="true">/</span>
          <button type="button" onClick={returnToSearch} className="hover:underline">
            {fromMyPage || fromFavorites ? '관심 동물' : fromLostSearch ? '실종 검색 결과' : '동물 검색'}
          </button>
          <span aria-hidden="true">/</span><span className="font-medium text-brand-ink dark:text-white">{animal.breed || '동물 상세'}</span>
        </nav>
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,680fr)_minmax(0,608fr)]">
          <div className="min-w-0">
            <div className="flex h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-border-light bg-gray-50 sm:h-[500px] xl:h-[620px] dark:border-border-dark dark:bg-gray-800">
              {photo && !imageFailed ? (
                <img key={photo} src={photo} alt={`${animal.breed || '동물'} 사진`} className="h-full w-full object-contain" onError={() => setImageFailed(true)} />
              ) : <span className="text-sm text-gray-500">사진이 없습니다</span>}
            </div>
            {images.length > 1 && <div className="mt-3 flex gap-3">
              {images.map((image, index) => <button type="button" key={image} onClick={() => { setSelectedImage(image); setImageFailed(false); }} aria-label={`${index + 1}번째 사진 보기`} aria-pressed={photo === image} className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${photo === image ? 'border-brand-ink' : 'border-border-light'}`}>
                <img src={image} alt="" className="h-full w-full object-cover" />
              </button>)}
            </div>}
          </div>
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-ink">{animalStatusLabel(animal.status)}</span>
              {daysLeft !== null && daysLeft >= 0 && <span className="rounded-full border border-border-light px-3 py-2 text-sm font-medium">공고 D-{daysLeft}</span>}
            </div>
            <h1 className="break-words text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{animal.breed || '품종 정보 없음'}</h1>
            {noticeNo && <p className="mt-3 break-all text-sm text-gray-600 dark:text-gray-300">공고번호 {noticeNo}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={handleFavorite} disabled={favoriteMutation.isPending || (!!user && favoriteQuery.isLoading)} aria-pressed={!!favoriteQuery.data} className="min-h-12 flex-1 rounded-lg border border-border-light px-5 text-sm font-semibold sm:flex-none hover:bg-gray-50 disabled:opacity-50 dark:border-border-dark dark:hover:bg-gray-800">
                {favoriteMutation.isPending ? '변경 중…' : favoriteQuery.isError ? '관심 상태 다시 확인' : favoriteQuery.data ? '관심 동물에서 삭제' : '관심 동물에 추가'}
              </button>
              <button type="button" onClick={() => void handleShare()} className="min-h-12 flex-1 rounded-lg border border-border-light px-5 text-sm font-semibold sm:flex-none hover:bg-gray-50 dark:border-border-dark dark:hover:bg-gray-800">공유하기</button>
            </div>
            {actionMessage && <p role="status" className="mt-3 text-sm">{actionMessage}</p>}
            {isMyAnimal && <Link to={`/animals/${id}/edit`} state={{ from: fromMyPage ? 'mypage' : undefined, tab: previousTab }} className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-border-light px-4 text-sm font-semibold">등록 정보 수정</Link>}
            <section className="mt-8 rounded-2xl border border-border-light p-5 sm:p-6 dark:border-border-dark">
              <h2 className="text-lg font-bold">기본 정보</h2>
              <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Info label="종" value={animalSpeciesLabel(animal.species)} />
                <Info label="성별" value={animalGenderLabel(animal.gender)} />
                <Info label="나이" value={animalAgeLabel(animal.age)} />
                {animal.weight != null && <Info label="체중" value={/(?:kg|㎏)/i.test(String(animal.weight)) ? String(animal.weight) : `${animal.weight}kg`} />}
                {animal.color && <Info label="색상" value={animal.color} />}
                {animal.neuterStatus && <Info label="중성화" value={animal.neuterStatus === 'YES' ? '완료' : animal.neuterStatus === 'NO' ? '미완료' : '미상'} />}
              </dl>
            </section>
            {(animal.specialMark || animal.description) && <section className="mt-4 rounded-2xl border border-border-light p-5 sm:p-6 dark:border-border-dark">
              <h2 className="text-lg font-bold">특징</h2>
              {animal.specialMark && <p className="mt-4 break-words text-sm leading-7">{animal.specialMark}</p>}
              {animal.description && <p className="mt-3 break-words text-sm leading-7 text-gray-700 dark:text-gray-200">{animal.description}</p>}
            </section>}
            <section className="mt-4 rounded-2xl border border-border-light p-5 sm:p-6 dark:border-border-dark">
              <h2 className="text-lg font-bold">보호소 연락처</h2>
              <p className="mt-4 break-words text-sm">{shelterName || '보호소 정보 없음'}</p>
              {phone && <p className="mt-2 text-sm">전화 {telephone ? <a href={telephone} className="underline underline-offset-4">{phone}</a> : phone}</p>}
              {shelter?.careRegNo && <Link to={`/shelters/${shelter.careRegNo}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">보호소 상세 보기</Link>}
              {!phone && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">등록된 연락처가 없습니다.</p>}
            </section>
          </div>
        </div>
        <div className="mt-8 grid items-stretch gap-8 xl:grid-cols-[minmax(0,680fr)_minmax(0,608fr)]">
          <section className="rounded-2xl border border-border-light p-5 sm:p-6 dark:border-border-dark">
            <h2 className="text-lg font-bold">발견 정보</h2>
            <dl className="mt-5 space-y-4">
              {animal.happenDate && <Info label="발견일" value={dateLabel(animal.happenDate) || ''} />}
              {animal.happenPlace && <Info label="발견 장소" value={animal.happenPlace} />}
              {!animal.happenDate && !animal.happenPlace && <p className="text-sm text-gray-600">등록된 정보가 없습니다.</p>}
            </dl>
          </section>
          <section className="rounded-2xl border border-border-light p-5 sm:p-6 dark:border-border-dark">
            <h2 className="text-lg font-bold">공고 정보</h2>
            <dl className="mt-5 space-y-4">
              {animal.noticeStartDate && animal.noticeEndDate ? (
                <Info label="공고 기간" value={`${dateLabel(animal.noticeStartDate)} ~ ${dateLabel(animal.noticeEndDate)}`} />
              ) : (
                <>
                  {animal.noticeStartDate && <Info label="시작일" value={dateLabel(animal.noticeStartDate) || ''} />}
                  {animal.noticeEndDate && <Info label="종료일" value={dateLabel(animal.noticeEndDate) || ''} />}
                </>
              )}
              {noticeNo && <Info label="공고번호" value={noticeNo} />}
              {animal.createdAt && <Info label="등록일" value={dateLabel(animal.createdAt) || ''} />}
            </dl>
          </section>
        </div>
        <button type="button" onClick={returnToSearch} className="mt-8 min-h-12 w-full rounded-lg bg-brand px-6 font-semibold text-brand-ink sm:w-auto">동물 목록으로</button>
        <section aria-labelledby="similar-animals-title" className="mt-14 border-t border-border-light pt-10 dark:border-border-dark">
          <h2 id="similar-animals-title" className="mb-6 text-xl font-bold">비슷한 동물</h2>
          {similarQuery.isPending && <p role="status" className="rounded-2xl border border-border-light p-6 text-sm text-brand-muted dark:border-border-dark dark:text-gray-300">비슷한 동물을 불러오는 중입니다…</p>}
          {similarQuery.isError && <div className="mb-4 rounded-2xl border border-border-light p-6 dark:border-border-dark">
            <p role="alert" className="text-sm">비슷한 동물을 불러오지 못했습니다.</p>
            <button type="button" onClick={() => void similarQuery.refetch()} disabled={similarQuery.isFetching} className="mt-4 min-h-11 rounded-lg border border-border-light px-5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-border-dark dark:hover:bg-gray-800">
              {similarQuery.isFetching ? '다시 불러오는 중…' : '다시 시도'}
            </button>
          </div>}
          {!similarQuery.isPending && !similarQuery.isError && !similarQuery.data?.length && <div className="rounded-2xl border border-border-light p-6 dark:border-border-dark">
            <p className="text-sm text-brand-muted dark:text-gray-300">비슷한 동물이 없습니다.</p>
            <Link to={searchReturnTo} className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border-light px-5 text-sm font-semibold hover:bg-gray-50 dark:border-border-dark dark:hover:bg-gray-800">동물 검색</Link>
          </div>}
          {!!similarQuery.data?.length && <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {similarQuery.data.slice(0, 6).map(item => <AnimalCardSimple key={item.id} animal={item} searchReturnTo={searchReturnTo} />)}
          </div>}
        </section>
      </main>
      <AnimalChatbot animalId={animal.id} animalName={animal.name || animal.breed || '보호 동물'} />
      <Footer />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] gap-3 text-sm"><dt className="text-gray-600 dark:text-gray-300">{label}</dt><dd className="break-words font-medium">{value}</dd></div>;
}
