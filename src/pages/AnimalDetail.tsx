import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAnimalById, checkFavorite, addFavorite, removeFavorite } from '../api/animals.api';
import { useAuthStore } from '../store/authStore';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useState, useEffect } from 'react';

export default function AnimalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // 이전 페이지 정보 확인 (마이페이지에서 온 경우)
  const fromMyPage = location.state?.from === 'mypage';
  const previousTab = location.state?.tab || sessionStorage.getItem('mypageActiveTab') || 'registeredAnimals';
  
  // 마이페이지에서 온 경우 sessionStorage에 탭 정보 저장
  useEffect(() => {
    if (fromMyPage && previousTab) {
      sessionStorage.setItem('mypageActiveTab', previousTab);
    }
  }, [fromMyPage, previousTab]);

  // 브라우저 뒤로가기 감지 및 처리
  useEffect(() => {
    const handlePopState = () => {
      // 뒤로가기 시 sessionStorage의 탭 정보를 유지
      if (fromMyPage && previousTab) {
        sessionStorage.setItem('mypageActiveTab', previousTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [fromMyPage, previousTab]);

  const { data: animal, isLoading, error } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => getAnimalById(Number(id)),
    enabled: !!id,
  });

  // 본인이 등록한 동물인지 확인 (보호소가 직접 등록한 동물만 수정 가능)
  // apiSource가 MANUAL이거나 apmsNoticeNo가 MAN-으로 시작하고 careRegNo가 일치하는 경우만
  const isManualAnimal = animal && (
    animal.apiSource === 'MANUAL' || 
    (animal.apmsNoticeNo && animal.apmsNoticeNo.startsWith('MAN-'))
  );
  
  // careRegNo는 로그인할 때 주어지므로 무조건 비교해야 함 (등록한 것만 수정 가능)
  // 하지만 API 응답에 careRegNo가 없을 수 있으므로, shelterId로도 비교
  const isMyShelter = user?.role === 'ROLE_SHELTER' && (
    (user?.careRegNo && animal?.careRegNo && user.careRegNo === animal.careRegNo) ||
    (user?.id && animal?.shelterId && Number(user.id) === Number(animal.shelterId))
  );
  
  const isMyAnimal = animal && 
    isMyShelter &&
    isManualAnimal;

  // 디버깅: 수정 버튼 표시 조건 확인
  useEffect(() => {
    if (animal && user) {
      console.log('=== 수정 버튼 표시 조건 확인 ===');
      console.log('전체 animal 객체:', animal);
      console.log('전체 user 객체:', user);
      console.log('user.role:', user.role);
      console.log('animal.apiSource:', animal.apiSource);
      console.log('animal.apmsNoticeNo:', animal.apmsNoticeNo);
      console.log('isManualAnimal:', isManualAnimal);
      console.log('user.careRegNo:', user.careRegNo);
      console.log('animal.careRegNo:', animal.careRegNo);
      console.log('user.id:', user.id);
      console.log('animal.shelterId:', animal.shelterId);
      console.log('careRegNo 비교:', user.careRegNo, '===', animal.careRegNo, '?', user.careRegNo === animal.careRegNo);
      console.log('shelterId 비교:', Number(user.id), '===', Number(animal.shelterId), '?', Number(user.id) === Number(animal.shelterId));
      console.log('isMyShelter:', isMyShelter);
      console.log('isMyAnimal:', isMyAnimal);
      console.log('조건 체크:', {
        hasAnimal: !!animal,
        isShelter: user?.role === 'ROLE_SHELTER',
        isManual: isManualAnimal,
        hasUserCareRegNo: !!user?.careRegNo,
        hasAnimalCareRegNo: !!animal.careRegNo,
        careRegNoMatch: user?.careRegNo === animal.careRegNo,
      });
    }
  }, [animal, user, isManualAnimal, isMyShelter, isMyAnimal]);

  // 찜 여부 확인
  const { data: isFavorited } = useQuery({
    queryKey: ['favorite', id],
    queryFn: () => checkFavorite(Number(id)),
    enabled: !!id && !!user,
  });

  // 찜 추가 mutation
  const addFavoriteMutation = useMutation({
    mutationFn: () => addFavorite(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id] });
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      queryClient.invalidateQueries({ queryKey: ['favoriteAnimals'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '찜 추가에 실패했습니다.');
    },
  });

  // 찜 제거 mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: () => removeFavorite(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id] });
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      queryClient.invalidateQueries({ queryKey: ['favoriteAnimals'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '찜 제거에 실패했습니다.');
    },
  });

  // 찜 토글 핸들러
  const handleFavoriteToggle = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-8 text-xl text-text-light dark:text-text-dark font-semibold animate-pulse">
              정보를 불러오고 있어요...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 에러 상태
  if (error || !animal) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl p-8 max-w-md text-center border border-border-light dark:border-border-dark">
              <div className="text-7xl mb-6">😢</div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-3">
                동물 정보를 찾을 수 없습니다
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                존재하지 않거나 삭제된 동물입니다
              </p>
              <button
                onClick={() => navigate('/animals')}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 종 레이블
  const speciesLabel = animal.species === 'DOG' ? '개' : animal.species === 'CAT' ? '고양이' : '기타';
  
  // 메인 이미지 (선택된 이미지 또는 기본 이미지)
  const mainImage = selectedImage || animal.imageUrl || '';
  
  // 이미지 목록 (메인 + 추가 이미지)
  const images = [animal.imageUrl, animal.imageUrl2].filter(Boolean) as string[];
  
  // 상태 레이블
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PROTECT': return '보호중';
      case 'ADOPTION_PENDING': return '입양대기중';
      case 'ADOPTED': return '종료(입양)';
      case 'EUTHANIZED': return '종료(안락사)';
      case 'NATURAL_DEATH': return '종료(자연사)';
      case 'RETURNED': return '종료(반환)';
      case 'DONATED': return '종료(기증)';
      case 'RELEASED': return '종료(방사)';
      case 'ESCAPED': return '탈출';
      case 'UNKNOWN': return '미상';
      default: return status;
    }
  };

  // D-Day 계산
  const calculateDday = () => {
    if (!animal.noticeEndDate) return null;
    const today = new Date();
    const endDate = new Date(animal.noticeEndDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const dDay = calculateDday();

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0].replace(/-/g, '.');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 text-sm">
            <button onClick={() => navigate('/')} className="text-secondary dark:text-primary hover:underline">
              홈
            </button>
            <span className="text-secondary dark:text-primary">/</span>
            {fromMyPage ? (
              <>
                <button 
                  onClick={() => navigate('/mypage', { state: { tab: previousTab } })}
                  className="text-secondary dark:text-primary hover:underline"
                >
                  마이페이지
                </button>
                <span className="text-secondary dark:text-primary">/</span>
                <button 
                  onClick={() => navigate('/mypage', { state: { tab: previousTab } })}
                  className="text-secondary dark:text-primary hover:underline"
                >
                  내 보호소가 등록한 동물
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/animals')} className="text-secondary dark:text-primary hover:underline">
                동물 검색
              </button>
            )}
            <span className="text-secondary dark:text-primary">/</span>
            <span className="font-medium text-text-light dark:text-text-dark">[{speciesLabel}] {animal.breed}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Image Gallery & Basic Info */}
          <div className="lg:col-span-3">
            {/* Main Image */}
            <div className="w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden rounded-xl min-h-[480px] shadow-lg">
              <img
                src={mainImage}
                alt={`${animal.breed} 메인 사진`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            
            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${animal.breed} 사진 ${index + 1}`}
                    className={`w-full h-24 object-cover rounded-lg cursor-pointer transition-all ${
                      selectedImage === img || (!selectedImage && index === 0)
                        ? 'border-2 border-primary ring-2 ring-primary/50 dark:border-primary dark:ring-primary/50 shadow-md'
                        : 'hover:opacity-80'
                    }`}
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details, Shelter Info, CTA */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Basic Info Card */}
            <div className="bg-white/50 dark:bg-card-dark/50 p-6 rounded-xl shadow-md">
              {/* 이름과 공고번호 영역 */}
              <div className="mb-4">
                <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-text-light dark:text-text-dark">
                  [{speciesLabel}] {animal.breed}
                </p>
                <p className="text-sm text-secondary dark:text-gray-400 mt-1">
                  공고번호: {animal.apmsNoticeNo || animal.noticeNo || 'N/A'}
                </p>
              </div>

              {/* 상태 태그, 찜 버튼, 수정 버튼 영역 */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/20 dark:bg-primary/30 px-4">
                    <p className="text-primary dark:text-primary text-sm font-bold">
                      {getStatusLabel(animal.status)}
                    </p>
                  </div>
                  {dDay !== null && dDay >= 0 && (
                    <div className={`flex h-8 shrink-0 items-center justify-center rounded-full px-3 ${
                      dDay <= 3 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <p className={`text-sm font-bold ${
                        dDay <= 3 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        D-{dDay}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* 찜 버튼 */}
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                      isFavorited
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isFavorited ? '찜 해제' : '찜하기'}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}>
                      favorite
                    </span>
                  </button>
                  {/* 수정 버튼 (본인이 등록한 동물인 경우만) */}
                  {isMyAnimal && (
                    <Link
                      to={`/animals/${id}/edit`}
                      state={{ from: fromMyPage ? 'mypage' : undefined, tab: previousTab }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold text-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      수정하기
                    </Link>
                  )}
                </div>
              </div>

              {/* 신체 정보 */}
              <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary dark:text-gray-400">pets</span>
                  <span className="text-text-light dark:text-text-dark">품종: {animal.breed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary dark:text-gray-400">cake</span>
                  <span className="text-text-light dark:text-text-dark">
                    나이: {animal.age}살 {animal.birthYear && `(${animal.birthYear}년생)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary dark:text-gray-400">
                    {animal.gender === 'MALE' ? 'male' : 'female'}
                  </span>
                  <span className="text-text-light dark:text-text-dark">
                    성별: {animal.gender === 'MALE' ? '수컷' : animal.gender === 'FEMALE' ? '암컷' : '미상'}
                  </span>
                </div>
                {animal.weight && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary dark:text-gray-400">scale</span>
                    <span className="text-text-light dark:text-text-dark">체중: {animal.weight}kg</span>
                  </div>
                )}
                {animal.color && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary dark:text-gray-400">palette</span>
                    <span className="text-text-light dark:text-text-dark">색상: {animal.color}</span>
                  </div>
                )}
                {animal.neuterStatus && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary dark:text-gray-400">cut</span>
                    <span className="text-text-light dark:text-text-dark">
                      중성화: {animal.neuterStatus === 'YES' ? '완료' : animal.neuterStatus === 'NO' ? '미완료' : '미상'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 공고 정보 */}
            {(animal.noticeStartDate || animal.noticeEndDate || animal.createdAt) && (
              <div className="bg-white/50 dark:bg-card-dark/50 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">공고 정보</h3>
                <div className="space-y-3 text-sm text-text-light dark:text-text-dark">
                  {animal.apmsNoticeNo && (
                    <p><strong>공고번호:</strong> {animal.apmsNoticeNo}</p>
                  )}
                  {animal.noticeStartDate && animal.noticeEndDate && (
                    <p>
                      <strong>공고기간:</strong> {formatDate(animal.noticeStartDate)} ~ {formatDate(animal.noticeEndDate)}
                      {dDay !== null && dDay >= 0 && (
                        <span className={`ml-2 font-bold ${dDay <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
                          (D-{dDay})
                        </span>
                      )}
                    </p>
                  )}
                  {animal.createdAt && (
                    <p><strong>등록일:</strong> {formatDate(animal.createdAt)}</p>
                  )}
                </div>
              </div>
            )}

            {/* 발견 정보 */}
            {(animal.happenPlace || animal.happenDate) && (
              <div className="bg-white/50 dark:bg-card-dark/50 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">발견 정보</h3>
                <div className="space-y-3 text-sm text-text-light dark:text-text-dark">
                  {animal.happenPlace && (
                    <p><strong>발견 장소:</strong> {animal.happenPlace}</p>
                  )}
                  {animal.happenDate && (
                    <p><strong>발견 날짜:</strong> {formatDate(animal.happenDate)}</p>
                  )}
                </div>
              </div>
            )}

            {/* 보호소 정보 */}
            <div className="bg-white/50 dark:bg-card-dark/50 p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">보호소 정보</h3>
              <div className="space-y-3 text-sm text-text-light dark:text-text-dark">
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-primary dark:text-primary">home</span>
                  <span><strong>보호소명:</strong> {animal.shelterName || animal.shelter?.name || '정보 없음'}</span>
                </p>
                
                {animal.shelter?.phone && (
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-primary dark:text-primary">call</span>
                    <span>
                      <strong>연락처:</strong>{' '}
                      <button
                        onClick={() => {
                          const phone = animal.shelter?.phone || '';
                          if (phone) {
                            navigator.clipboard.writeText(phone).then(() => {
                              alert(`전화번호가 복사되었습니다!\n${phone}`);
                            });
                          }
                        }}
                        className="text-primary hover:underline font-medium cursor-pointer"
                      >
                        {animal.shelter.phone}
                      </button>
                      <span className="text-xs text-gray-500 ml-1">(클릭하면 복사)</span>
                    </span>
                  </p>
                )}
                
                {animal.shelter?.address && (
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-primary dark:text-primary">location_on</span>
                    <span><strong>주소:</strong> {animal.shelter.address}</span>
                  </p>
                )}
                
                {animal.shelter?.operatingHours && (
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-primary dark:text-primary">schedule</span>
                    <span><strong>운영시간:</strong> {animal.shelter.operatingHours}</span>
                  </p>
                )}
                
                {animal.favoriteCount !== undefined && (
                  <p className="flex items-start gap-2 pt-2 border-t border-border-light dark:border-border-dark">
                    <span className="material-symbols-outlined text-base text-red-500">favorite</span>
                    <span><strong>관심:</strong> {animal.favoriteCount}명이 찜했어요</span>
                  </p>
                )}
              </div>
            </div>

            {/* 특징 및 설명 */}
            {(animal.specialMark || animal.description) && (
              <div className="bg-white/50 dark:bg-card-dark/50 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">성격 및 특징</h3>
                <div className="space-y-3 text-sm text-text-light/80 dark:text-text-dark/80">
                  {animal.specialMark && (
                    <p><strong>특징:</strong> {animal.specialMark}</p>
                  )}
                  {animal.description && (
                    <p><strong>상세 설명:</strong> {animal.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto">
              {/* 메인 버튼: 보호소 연락하기 */}
              {animal.shelter?.phone ? (
                // 전화번호가 있으면 전화/복사 옵션 제공
                <button
                  onClick={() => {
                    const phone = animal.shelter?.phone || '';
                    const message = `입양 문의\n\n보호소: ${animal.shelterName}\n전화: ${phone}\n\n공고번호: ${animal.apmsNoticeNo || 'N/A'}\n\n※ 공고번호를 먼저 말씀해주시면\n   빠른 상담이 가능합니다.`;
                    
                    if (!phone) {
                      alert('보호소 연락처 정보가 없습니다.');
                      return;
                    }
                    
                    // 모바일 환경 체크
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    
                    if (isMobile) {
                      // 모바일: 전화 확인 후 연결
                      if (confirm(`${phone}\n\n보호소로 전화를 거시겠습니까?`)) {
                        window.location.href = `tel:${phone}`;
                      }
                    } else {
                      // PC: 전화번호 복사
                      navigator.clipboard.writeText(phone).then(() => {
                        alert(`${message}\n\n전화번호가 복사되었습니다!`);
                      }).catch(() => {
                        alert(message);
                      });
                    }
                  }}
                  className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-bold tracking-wide hover:bg-primary/90 transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined mr-2">call</span>
                  <span className="truncate">입양 문의하기</span>
                </button>
              ) : (
                // 전화번호가 없으면 안내 메시지
                <button 
                  onClick={() => {
                    alert(`입양 문의는 보호소에 직접 연락해주세요!\n\n보호소: ${animal.shelterName}\n\n※ Tip: 공고번호를 말씀해주시면 빠른 상담이 가능합니다.\n공고번호: ${animal.apmsNoticeNo || 'N/A'}`);
                  }}
                  className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-bold tracking-wide hover:bg-primary/90 transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined mr-2">call</span>
                  <span className="truncate">입양 문의하기</span>
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {/* 찜하기 버튼 */}
                <button 
                  onClick={() => {
                    alert('찜하기 기능은 로그인 후 이용 가능합니다!');
                  }}
                  className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-secondary/80 hover:bg-secondary text-white text-sm font-bold tracking-wide transition-colors"
                >
                  <span className="material-symbols-outlined mr-2 text-base">favorite</span>
                  <span className="truncate">찜하기</span>
                </button>
                
                {/* 공유하기 버튼 */}
                <button 
                  onClick={() => {
                    const url = window.location.href;
                    if (navigator.share) {
                      navigator.share({
                        title: `[${speciesLabel}] ${animal.breed}`,
                        text: `${animal.specialMark || '귀여운 친구를 만나보세요!'}`,
                        url: url,
                      }).catch(() => {
                        // 공유 취소 시 아무것도 안 함
                      });
                    } else {
                      // Web Share API 미지원 시 URL 복사
                      navigator.clipboard.writeText(url).then(() => {
                        alert('링크가 복사되었습니다!');
                      });
                    }
                  }}
                  className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-secondary/80 hover:bg-secondary text-white text-sm font-bold tracking-wide transition-colors"
                >
                  <span className="material-symbols-outlined mr-2 text-base">share</span>
                  <span className="truncate">공유하기</span>
                </button>
              </div>
              
              {/* 안내 메시지 */}
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                  <span>
                    입양은 보호소와의 직접 상담을 통해 진행됩니다. 
                    보호소 연락처는 공고번호와 함께 문의해주세요.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

