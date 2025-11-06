import { useQuery } from '@tanstack/react-query';
import { getAnimals } from '../api/animals.api.ts';

export default function Animals() {
  // useQuery로 데이터 가져오기
  const { data: animals, isLoading, error } = useQuery({
    queryKey: ['animals'],  // 캐시 키 (고유 식별자)
    queryFn: getAnimals,    // 실제 API 호출 함수
  });

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">동물 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            에러가 발생했습니다
          </h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : '알 수 없는 에러'}
          </p>
          <p className="text-sm text-gray-600 mt-4">
            💡 백엔드 서버가 실행 중인지 확인하세요
          </p>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!animals || animals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            동물 목록
          </h1>
          <p className="text-gray-600">
            현재 등록된 동물이 없습니다
          </p>
        </div>
      </div>
    );
  }

  // 데이터 표시
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          동물 목록
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {animals.map((animal) => (
            <div 
              key={animal.id} 
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-4xl">{animal.species === '강아지' ? '🐕' : '🐈'}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{animal.name}</h3>
              <p className="text-gray-600 text-sm mb-1">품종: {animal.breed}</p>
              <p className="text-gray-600 text-sm mb-1">나이: {animal.age}살</p>
              <p className="text-gray-600 text-sm mb-3">성별: {animal.gender === 'MALE' ? '수컷' : '암컷'}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                animal.status === 'AVAILABLE' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {animal.status === 'AVAILABLE' ? '입양 가능' : '입양 완료'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}