import { useState } from 'react';
import type { Animal } from '../../types/api.types';

interface AnimalCardProps {
  animal: Animal;
  onFavorite?: (id: number) => void;
}

export default function AnimalCard({ animal, onFavorite }: AnimalCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorited(!isFavorited);
    if (onFavorite) {
      onFavorite(animal.id);
    }
  };

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden">
      {/* 이미지 영역 */}
      <div className="relative w-full h-56 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
        {!imageError && animal.imageUrl ? (
          <img
            src={animal.imageUrl}
            alt={animal.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl">
              {animal.species === '강아지' ? '🐕' : '🐈'}
            </span>
          </div>
        )}

        {/* 찜하기 버튼 */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <svg
            className={`w-6 h-6 ${isFavorited ? 'fill-red-500' : 'fill-gray-300'}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        {/* 입양 상태 배지 */}
        <div className="absolute bottom-3 left-3">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-bold shadow-md ${
              animal.status === 'AVAILABLE'
                ? 'bg-green-500 text-white'
                : 'bg-gray-400 text-white'
            }`}
          >
            {animal.status === 'AVAILABLE' ? '입양 가능' : '입양 완료'}
          </span>
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-3">{animal.name}</h3>

        <div className="space-y-2">
          <InfoRow icon="🐾" label="품종" value={animal.breed} />
          <InfoRow icon="🎂" label="나이" value={`${animal.age}살`} />
          <InfoRow
            icon="⚧"
            label="성별"
            value={animal.gender === 'MALE' ? '수컷' : '암컷'}
          />
        </div>

        {/* 상세보기 버튼 */}
        <button className="mt-4 w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors">
          상세보기
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
    <div className="flex items-center text-gray-600">
      <span className="mr-2">{icon}</span>
      <span className="text-sm">
        <span className="font-semibold">{label}:</span> {value}
      </span>
    </div>
  );
}

