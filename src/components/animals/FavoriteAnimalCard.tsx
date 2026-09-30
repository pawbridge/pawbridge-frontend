import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeFavorite } from '../../api/animals.api';
import { useAuthStore } from '../../store/authStore';
import { animalAgeLabel, animalGenderLabel, animalSpeciesLabel, animalStatusLabel } from '../../lib/animalDisplay';
import type { FavoriteWithAnimalDto } from '../../types/api.types';

export default function FavoriteAnimalCard({ favorite, fromMyPage = false }: { favorite: FavoriteWithAnimalDto; fromMyPage?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.user?.id);
  const deleted = favorite.status === 'DELETED';
  const remove = useMutation({
    mutationFn: () => removeFavorite(favorite.animalId),
    onSuccess: () => {
      setRemoveError('');
      void queryClient.invalidateQueries({ queryKey: ['favoriteAnimals', userId] });
      void queryClient.invalidateQueries({ queryKey: ['favorite', String(favorite.animalId), userId] });
    },
    onError: () => setRemoveError('관심 동물을 삭제하지 못했습니다. 다시 시도해 주세요.'),
  });

  return (
    <article className="overflow-hidden rounded-2xl border border-border-light bg-white text-brand-ink shadow-sm dark:border-border-dark dark:bg-card-dark dark:text-text-dark">
      <div className="grid sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex h-56 items-center justify-center bg-gray-100 sm:h-full sm:min-h-72 dark:bg-gray-800">
          {favorite.imageUrl && !imageFailed ? (
            <img src={favorite.imageUrl} alt={`${favorite.breed || '동물'} 사진`} className="h-full w-full object-contain" loading="lazy" onError={() => setImageFailed(true)} />
          ) : (
            <span className="text-sm text-gray-500">사진이 없습니다</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col p-5 sm:p-6">
          <span className="mb-3 w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold dark:bg-gray-700">
            {animalStatusLabel(favorite.status)}
          </span>
          <h3 className="break-words text-xl font-bold">{deleted ? '현재 동물 정보를 볼 수 없습니다' : favorite.breed || '품종 정보 없음'}</h3>
          {!deleted && (
            <>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {animalSpeciesLabel(favorite.species)} · {animalGenderLabel(favorite.gender)} · {animalAgeLabel(favorite.age)}
              </p>
              {favorite.apmsNoticeNo && <p className="mt-3 break-all text-sm text-gray-600 dark:text-gray-300">공고번호 {favorite.apmsNoticeNo}</p>}
              {favorite.specialMark && <p className="mt-2 break-words text-sm leading-6 text-gray-700 dark:text-gray-200">특징 {favorite.specialMark}</p>}
              {favorite.shelterName && <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-300">보호소 {favorite.shelterName}</p>}
            </>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            {!deleted && <Link to={`/animals/${favorite.animalId}`} state={{ from: fromMyPage ? 'mypage' : 'favorites', tab: 'favoriteAnimals' }} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-ink hover:bg-brand-hover">상세 보기</Link>}
            <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} className="min-h-11 flex-1 rounded-lg border border-border-light px-4 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-border-dark dark:hover:bg-gray-800">
              {remove.isPending ? '삭제 중…' : '관심 동물에서 삭제'}
            </button>
          </div>
          {removeError && <p role="alert" className="mt-2 text-sm text-red-700">{removeError}</p>}
        </div>
      </div>
    </article>
  );
}
