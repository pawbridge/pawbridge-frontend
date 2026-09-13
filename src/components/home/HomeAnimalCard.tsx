import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Animal } from '../../types/api.types';

export default function HomeAnimalCard({ animal }: { animal: Animal }) {
  const [failedImage, setFailedImage] = useState<string>();
  const title = animal.breed || (animal.species === 'CAT' ? '고양이' : animal.species === 'DOG' ? '강아지' : '보호 동물');
  const gender = animal.gender === 'MALE' ? '수컷' : animal.gender === 'FEMALE' ? '암컷' : '성별 미상';
  const age = animal.birthYear ? `${animal.birthYear}년생` : animal.age != null ? `${animal.age}살` : '연령 미상';
  return (
    <Link to={`/animals/${animal.id}`} className="group flex min-w-0 overflow-hidden rounded-2xl border border-border-light bg-card-light transition-colors hover:border-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 dark:border-border-dark dark:bg-card-dark dark:focus-visible:outline-primary md:flex-col">
      <div className="relative w-28 shrink-0 self-stretch bg-gray-100 dark:bg-gray-800 sm:w-36 md:aspect-[1.9] md:w-full">
        {animal.imageUrl && failedImage !== animal.imageUrl ? <img src={animal.imageUrl} alt={`${title} 공고 사진`} onError={() => setFailedImage(animal.imageUrl)} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          : <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-gray-600 dark:text-gray-300">사진을 준비 중이에요</span>}
      </div>
      <div className="min-w-0 flex-1 p-4">
        <p className="text-xs font-bold text-emerald-700 dark:text-primary">{animal.status === 'PROTECT' ? '보호중' : '보호 상태는 상세에서 확인'}</p>
        <h3 className="mt-2 break-words text-lg font-bold group-hover:underline">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{age} · {gender}</p>
        <p className="mt-1 break-words text-xs leading-relaxed text-gray-600 dark:text-gray-300">{animal.shelter?.name || animal.shelterName || '보호소 정보는 상세에서 확인'}</p>
      </div>
    </Link>
  );
}
