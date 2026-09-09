import { useState } from 'react';
import type { Animal } from '../../types/api.types';
import { calculateDday } from '../../api/animals.api.mock';

interface AnimalCardProps {
  animal: Animal;
  onFavorite?: (id: number) => void;
}

export default function AnimalCard({ animal, onFavorite }: AnimalCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    if (onFavorite) {
      onFavorite(animal.id);
    }
  };

  // D-day 계산
  const dday = animal.noticeEndDate ? calculateDday(animal.noticeEndDate) : null;
  const isDdayUrgent = dday !== null && dday <= 3 && dday >= 0;
  const isDdayExpired = dday !== null && dday < 0;

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1">
      {/* 이미지 영역 */}
      <div className="relative w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
        {!imageError && animal.imageUrl ? (
          <img
            src={animal.imageUrl}
            alt={animal.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl animate-bounce">
              {animal.species === '강아지' ? '🐕' : '🐈'}
            </span>
          </div>
        )}

        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* 찜하기 버튼 */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-10"
        >
          <svg
            className={`w-6 h-6 transition-all duration-300 ${
              isFavorited ? 'fill-red-500 scale-110' : 'fill-gray-300'
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        {/* D-day 배지 */}
        {dday !== null && !isDdayExpired && (
          <div className="absolute top-3 left-3">
            <div
              className={`px-3 py-1.5 rounded-full font-bold text-sm shadow-lg backdrop-blur-sm ${
                isDdayUrgent
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/90 text-gray-800'
              }`}
            >
              {dday === 0 ? '⏰ D-DAY' : `⏰ D-${dday}`}
            </div>
          </div>
        )}

        {/* 입양 상태 배지 */}
        <div className="absolute bottom-3 left-3">
          <span
            className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold shadow-md backdrop-blur-sm ${
              animal.status === 'PROTECT'
                ? 'bg-green-500/90 text-white'
                : 'bg-gray-600/90 text-white'
            }`}
          >
            {animal.status === 'PROTECT' ? '입양 가능' : '입양 완료'}
          </span>
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="p-5">
        {/* 이름과 공고번호 */}
        <div className="mb-3">
          <h3 className="text-2xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
            {animal.name}
          </h3>
          {animal.noticeNo && (
            <p className="text-xs text-gray-500 font-mono">{animal.noticeNo}</p>
          )}
        </div>

        {/* 주요 정보 */}
        <div className="space-y-2 mb-4">
          <InfoRow icon="🐾" label="품종" value={animal.breed || '미상'} />
          <InfoRow icon="🎂" label="나이" value={`${animal.age || 0}살`} />
          <InfoRow
            icon="⚧"
            label="성별"
            value={animal.gender === 'MALE' ? '수컷' : '암컷'}
          />
          {animal.weight && <InfoRow icon="⚖️" label="체중" value={`${animal.weight}kg`} />}
        </div>

        {/* 위치 정보 */}
        {(animal.region || animal.city || animal.foundPlace) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {animal.region && animal.city
                    ? `${animal.region} ${animal.city}`
                    : animal.region || animal.city || '위치 정보 없음'}
                </p>
                {animal.foundPlace && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    발견: {animal.foundPlace}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 설명 */}
        {animal.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {animal.description}
          </p>
        )}

        {/* 보호소 정보 */}
        {animal.shelterName && (
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="truncate">{animal.shelterName}</span>
          </div>
        )}

        {/* 특징 태그 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {animal.color && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
              {animal.color}
            </span>
          )}
          {animal.neutered !== undefined && (
            <span
              className={`px-2 py-1 text-xs rounded-md ${
                animal.neutered
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {animal.neutered ? '중성화 ✓' : '중성화 X'}
            </span>
          )}
        </div>

        {/* 상세보기 버튼 */}
        <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform group-hover:scale-105">
          <span className="flex items-center justify-center gap-2">
            상세보기
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}

// 정보 행 컴포넌트
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center text-gray-700">
      <span className="mr-2 text-lg">{icon}</span>
      <span className="text-sm">
        <span className="font-semibold text-gray-800">{label}:</span> {value}
      </span>
    </div>
  );
}
