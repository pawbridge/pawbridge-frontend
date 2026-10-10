import { useState } from 'react';
import { Link } from 'react-router-dom';
import { animalAgeLabel, animalGenderLabel, animalSpeciesLabel, animalStatusLabel, animalWeightLabel } from '../../lib/animalDisplay';
import type { Animal } from '../../types/api.types';

interface AnimalCardSimpleProps {
  animal: Animal;
  searchReturnTo?: string;
  navigationState?: Record<string, unknown>;
  onCardClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function AnimalCardSimple({ animal, onCardClick, searchReturnTo, navigationState }: AnimalCardSimpleProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const title = animal.breed || animalSpeciesLabel(animal.species);
  const status = animalStatusLabel(animal.status);
  const weight = animalWeightLabel(animal.weight);
  const shelterName = animal.shelter?.name || animal.shelterName || '보호소 정보 없음';
  const noticeNumber = animal.apmsNoticeNo || animal.noticeNo;
  const feature = animal.specialMark || animal.description;
  const date = animal.happenDate || animal.createdAt;
  const statusClassName = 'w-fit rounded-full bg-gray-100 px-3 py-2 text-xs font-medium leading-[18px] text-brand-ink dark:bg-gray-800 dark:text-text-dark';

  return (
    <Link
      to={`/animals/${animal.id}`}
      state={navigationState || (searchReturnTo ? { searchReturnTo } : undefined)}
      onClick={onCardClick}
      className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-3 rounded-2xl border border-border-light bg-card-light p-4 text-brand-ink transition-colors hover:border-brand-ink xl:grid-cols-[12.5rem_minmax(0,1fr)] xl:gap-x-4 xl:gap-y-1 dark:border-border-dark dark:bg-card-dark dark:text-text-dark dark:hover:border-brand"
    >
      <div className="flex min-w-0 flex-col items-center gap-2 xl:row-span-2">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft xl:h-[200px] xl:w-[200px] dark:bg-gray-800">
          {animal.imageUrl && animal.imageUrl !== failedImageUrl ? (
            <img
              src={animal.imageUrl}
              alt={`${title} 사진`}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
              onError={() => setFailedImageUrl(animal.imageUrl)}
            />
          ) : <span className="text-sm text-brand-muted dark:text-gray-300">사진 없음</span>}
        </div>
        <span className={`${statusClassName} xl:hidden`}>{status}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-start gap-3">
          <h3 className="min-w-0 flex-1 break-keep text-xl font-bold leading-7 [overflow-wrap:anywhere] line-clamp-2">{title}</h3>
          <span className={`${statusClassName} hidden shrink-0 xl:block`}>{status}</span>
        </div>
        <p className="flex flex-wrap gap-x-3 text-sm leading-6">
          <span>{animalGenderLabel(animal.gender)}</span>
          <span>{animal.age == null ? '나이 정보 없음' : animalAgeLabel(animal.age)}</span>
          {weight && <span>{weight}</span>}
        </p>
        <p className="break-words text-sm leading-6 text-brand-muted dark:text-gray-300">색상 {animal.color || '정보 없음'}</p>
        <p className="min-h-12 break-words text-sm leading-6 line-clamp-2">{feature || '특징 정보 없음'}</p>
      </div>
      <div className="col-span-2 min-w-0 space-y-1 text-sm leading-6 text-brand-muted xl:col-span-1 xl:col-start-2 dark:text-gray-300">
        <p className="break-words">보호소 {shelterName}</p>
        <p>{date ? `${animal.happenDate ? '발견일' : '등록일'} ${date.slice(0, 10).replace(/-/g, '.')}` : '발견일 정보 없음'}</p>
        <p className="break-words">{noticeNumber || '공고번호 정보 없음'}</p>
      </div>
    </Link>
  );
}
