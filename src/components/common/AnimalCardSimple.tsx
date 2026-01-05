import { Link } from 'react-router-dom';
import type { Animal } from '../../types/api.types';

interface AnimalCardSimpleProps {
  animal: Animal;
}

export default function AnimalCardSimple({ animal }: AnimalCardSimpleProps) {
  const getStatusLabel = () => {
    switch (animal.status) {
      case 'PROTECT':
        return { text: '보호중', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'ADOPTION_PENDING':
        return { text: '입양대기중', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'ADOPTED':
        return { text: '종료(입양)', className: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
      case 'EUTHANIZED':
        return { text: '종료(안락사)', className: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
      case 'NATURAL_DEATH':
        return { text: '종료(자연사)', className: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
      case 'RETURNED':
        return { text: '종료(반환)', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
      case 'DONATED':
        return { text: '종료(기증)', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
      case 'RELEASED':
        return { text: '종료(방사)', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' };
      case 'ESCAPED':
        return { text: '탈출', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
      case 'UNKNOWN':
        return { text: '미상', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
      default:
        return { text: animal.status || '알 수 없음', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    }
  };

  const getGenderLabel = () => {
    if (animal.gender === 'MALE') {
      return { text: '수컷', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
    } else if (animal.gender === 'FEMALE') {
      return { text: '암컷', className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' };
    } else if (!animal.gender || (animal.gender as string) === 'UNKNOWN') {
      return { text: '미상', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    }
    return null;
  };

  const getNeuterLabel = () => {
    // neuterStatus 우선 확인
    if (animal.neuterStatus === 'YES') {
      return { text: '중성화 완료', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
    } else if (animal.neuterStatus === 'NO') {
      return { text: '중성화 미완료', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    } else if (animal.neuterStatus === 'UNKNOWN') {
      return { text: '중성화 미상', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    }
    
    // neuterStatus가 없으면 neutered (boolean) 필드 확인
    if (animal.neutered === true) {
      return { text: '중성화 완료', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
    } else if (animal.neutered === false) {
      return { text: '중성화 미완료', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    }
    
    // 둘 다 없으면 null 반환 (배지 표시 안 함)
    return null;
  };

  const status = getStatusLabel();
  const gender = getGenderLabel();
  const neuter = getNeuterLabel();

  // 종 + 품종 표시
  const speciesLabel = animal.species === 'DOG' ? '개' : animal.species === 'CAT' ? '고양이' : '기타';
  const title = `[${speciesLabel}] ${animal.breed}`;

  // 나이 표시
  const ageText = animal.age ? `${animal.age}살` : '연령 미상';

  // 보호소 이름
  const shelterName = animal.shelter?.name || animal.shelterName || '보호소 정보 없음';

  // 공고번호 (백엔드 필드명 apmsNoticeNo 우선)
  const noticeNumber = animal.apmsNoticeNo || animal.noticeNo;

  // 이미지 URL
  const imageUrl = animal.imageUrl;

  return (
    <Link
      to={`/animals/${animal.id}`}
      className="flex flex-col bg-card-light dark:bg-card-dark rounded-xl overflow-hidden shadow-sm border border-border-light dark:border-border-dark transition-transform hover:-translate-y-1"
    >
      {/* 이미지 */}
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={animal.name}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
            <span className="text-gray-500 dark:text-gray-400 text-sm">이미지 없음</span>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-4 flex flex-col flex-grow">
        {/* 상태 + 성별 + 중성화 배지 */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* 상태 배지 */}
          <span className={`text-xs font-bold rounded-full px-3 py-1 ${status.className}`}>
            {status.text}
          </span>
          
          {/* 성별 배지 */}
          {gender && (
            <span className={`text-xs font-bold rounded-full px-3 py-1 ${gender.className}`}>
              {gender.text}
            </span>
          )}
          
          {/* 중성화 배지 */}
          {neuter && (
            <span className={`text-xs font-bold rounded-full px-3 py-1 ${neuter.className}`}>
              {neuter.text}
            </span>
          )}
        </div>

        {/* 제목 */}
        <h4 className="font-bold text-lg mb-1 text-text-light dark:text-text-dark">{title}</h4>

        {/* 나이 */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ageText}</p>

        {/* 추가 정보 (색상, 체중) */}
        <div className="flex flex-wrap gap-2 mb-3">
          {animal.color && (
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
              색상: {animal.color}
            </span>
          )}
          {animal.weight && (
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
              체중: {animal.weight}
            </span>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-auto pt-2 border-t border-border-light dark:border-border-dark space-y-1.5">
          {/* 보호소 또는 구조장소 */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="truncate">
              {animal.foundPlace || shelterName}
            </span>
          </div>
          
          {/* 등록날짜 */}
          {(animal.createdAt || animal.noticeStartDate) && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span>
                {new Date(animal.createdAt || animal.noticeStartDate || '').toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }).replace(/\. /g, '.').replace(/\.$/, '')}
              </span>
            </div>
          )}
          
          {/* 공고번호 */}
          {noticeNumber && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <span className="material-symbols-outlined text-sm">description</span>
              <span className="font-mono truncate">{noticeNumber}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}


