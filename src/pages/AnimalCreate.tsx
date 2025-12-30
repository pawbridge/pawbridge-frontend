import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAnimal, uploadAnimalImage } from '../api/animals.api';
import { getMyInfo } from '../api/user.api';
import type { CreateAnimalRequest } from '../api/animals.api';
import { useAuthStore } from '../store/authStore';
import CustomSelect from '../components/common/CustomSelect';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function AnimalCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 사용자 정보 조회 (보호소 등록번호 확인용)
  const { data: userInfo } = useQuery({
    queryKey: ['myInfo'],
    queryFn: getMyInfo,
  });

  // authStore에서도 user 정보 가져오기 (로그인 시 저장된 careRegNo 사용)
  const authUser = useAuthStore((state) => state.user);

  // 기본 정보
  const [species, setSpecies] = useState<'DOG' | 'CAT' | 'ETC'>('DOG');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'UNKNOWN' | ''>('');
  const [neuterStatus, setNeuterStatus] = useState<'YES' | 'NO' | 'UNKNOWN' | ''>('');
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [specialMark, setSpecialMark] = useState('');

  // 발견 정보
  const [happenDate, setHappenDate] = useState('');
  const [happenPlace, setHappenPlace] = useState('');

  // 공고 정보
  const [noticeStartDate, setNoticeStartDate] = useState('');
  const [noticeEndDate, setNoticeEndDate] = useState('');

  // 설명
  const [description, setDescription] = useState('');

  // 이미지
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // 이미지 파일 선택 (대표 이미지)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      // 파일 타입 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert('지원하는 이미지 형식은 JPEG, PNG, GIF, WEBP입니다.');
        return;
      }
      setImageFile(file);
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거 (대표 이미지)
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  // 이미지 업로드 mutation (단일)
  const uploadImageMutation = useMutation({
    mutationFn: uploadAnimalImage,
  });


  // 동물 등록 mutation
  const createAnimalMutation = useMutation({
    mutationFn: createAnimal,
    onSuccess: (data) => {
      // "내 보호소가 등록한 동물" 목록 캐시 무효화 (목록에도 반영되도록)
      queryClient.invalidateQueries({ queryKey: ['registeredAnimals'] });
      alert('동물이 등록되었습니다.');
      // 등록한 동물의 상세 페이지로 이동 (등록 내용 확인)
      navigate(`/animals/${data.id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '동물 등록에 실패했습니다.';
      alert(message);
    },
  });

  // 폼 제출
  const handleSubmit = async () => {
    // 유효성 검증 (명세서 기준 필수 필드)
    if (!species) {
      alert('종을 선택해주세요.');
      return;
    }
    if (!gender) {
      alert('성별을 선택해주세요.');
      return;
    }
    if (!neuterStatus) {
      alert('중성화 여부를 선택해주세요.');
      return;
    }
    if (!noticeStartDate) {
      alert('공고 시작일을 입력해주세요.');
      return;
    }
    if (!noticeEndDate) {
      alert('공고 종료일을 입력해주세요.');
      return;
    }
    // authStore의 user 또는 userInfo에서 careRegNo 가져오기
    const careRegNo = authUser?.careRegNo || userInfo?.careRegNo;
    
    if (!userInfo && !authUser) {
      alert('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
      return;
    }
    const userRole = authUser?.role || userInfo?.role;
    if (userRole !== 'ROLE_SHELTER') {
      alert('보호소 회원만 동물을 등록할 수 있습니다.');
      return;
    }
    if (!careRegNo) {
      alert('보호소 등록번호가 없습니다. 관리자에게 문의해주세요.');
      return;
    }

    try {
      let imageUrl = '';

      // 대표 이미지 업로드
      if (imageFile) {
        const imageResponse = await uploadImageMutation.mutateAsync(imageFile);
        imageUrl = imageResponse.imageUrl;
        console.log('이미지 업로드 응답:', imageResponse);
        console.log('추출된 imageUrl:', imageUrl);
        
        if (!imageUrl) {
          alert('이미지 URL을 받아오지 못했습니다. 다시 시도해주세요.');
          return;
        }
      }

      // 동물 등록 (명세서 기준: careRegNo 사용, 필수 필드 포함, 선택 필드는 조건부 포함)
      // 로그인 시 저장된 careRegNo 사용
      const animalData: CreateAnimalRequest = {
        careRegNo: careRegNo, // 로그인 시 저장된 careRegNo 사용
        species,
        status: 'PROTECT', // 보호소에서 등록하는 동물은 기본적으로 '보호중' 상태
        noticeStartDate, // 필수
        noticeEndDate, // 필수
        gender: gender as 'MALE' | 'FEMALE' | 'UNKNOWN', // 필수 (UNKNOWN 포함)
        neuterStatus: neuterStatus as 'YES' | 'NO' | 'UNKNOWN', // 필수 (UNKNOWN 포함)
        apiSource: 'MANUAL', // 보호소가 직접 등록하는 동물은 MANUAL로 명시
        // apmsNoticeNo는 선택 필드이므로 보내지 않으면 서버에서 자동 생성
        ...(breed && { breed }),
        ...(birthYear && { birthYear: Number(birthYear) }),
        ...(weight && { weight }),
        ...(color && { color }),
        ...(specialMark && { specialMark }),
        ...(happenDate && { happenDate }),
        ...(happenPlace && { happenPlace }),
        ...(imageUrl && { imageUrl }), // imageUrl이 있으면 포함
        ...(description && { description }),
      };

      console.log('동물 등록 요청 데이터:', animalData);
      console.log('imageUrl 포함 여부:', !!animalData.imageUrl);

      await createAnimalMutation.mutateAsync(animalData);
    } catch (error: any) {
      const message = error.response?.data?.message || '이미지 업로드에 실패했습니다.';
      alert(message);
    }
  };

  // 보호소 권한 체크
  if (userInfo && userInfo.role !== 'ROLE_SHELTER') {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
            <p className="text-gray-500 mb-4">보호소 회원만 동물을 등록할 수 있습니다.</p>
            <Link
              to="/mypage"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              마이페이지로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111816] dark:text-gray-100 font-body h-screen flex overflow-hidden">
      {/* 사이드바 */}
      <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-[#e0e8e5] dark:border-[#1f3530] flex flex-col flex-shrink-0 z-50">
        {/* 로고 */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#e0e8e5] dark:border-[#1f3530]">
          <div className="size-8 text-primary">
            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_6_330)">
                <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd"></path>
              </g>
              <defs>
                <clipPath id="clip0_6_330"><rect fill="white" height="48" width="48"></rect></clipPath>
              </defs>
            </svg>
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight text-[#111816] dark:text-white">PawBridge</h1>
        </div>
        
        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 scrollbar-hide">
          <Link to="/mypage" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">person</span>
            <span className="text-sm font-medium">마이페이지</span>
          </Link>
          <div className="my-2 h-px bg-[#e0e8e5] dark:bg-[#1f3530] mx-3"></div>
          <Link to="/animals" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">pets</span>
            <span className="text-sm font-medium">동물 목록</span>
          </Link>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#111816] dark:text-white bg-[#f0f5f3] dark:bg-[#1f3530] font-bold">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-primary">pets</span>
                <span className="text-sm">동물 관리</span>
              </div>
              <span className="material-symbols-outlined text-[18px]">expand_less</span>
            </div>
            <div className="flex flex-col pl-11 gap-1">
              <Link to="/mypage" className="block px-3 py-2 rounded-lg text-sm text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:text-white dark:hover:bg-[#1f3530] transition-colors">
                내 보호소가 등록한 동물
              </Link>
              <Link to="/animals/new" className="block px-3 py-2 rounded-lg text-sm font-bold text-primary bg-primary/10 transition-colors">
                동물 등록
              </Link>
            </div>
          </div>
        </nav>
        
        {/* 하단 고객지원 */}
        <div className="p-4 border-t border-[#e0e8e5] dark:border-[#1f3530]">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-[#5f8c80] hover:text-[#111816] dark:hover:text-white bg-transparent hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">help</span>
            고객지원
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-end h-16 px-8 border-b border-[#e0e8e5] dark:border-[#1f3530] bg-surface-light dark:bg-surface-dark flex-shrink-0">
          <div className="flex items-center gap-6">
            <button className="relative flex items-center gap-2 text-[#5f8c80] hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-surface-light dark:border-surface-dark"></span>
            </button>
            <div className="h-6 w-px bg-[#e0e8e5] dark:border-[#1f3530]"></div>
            <div className="flex items-center gap-3">
              <div className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-primary/20 bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-bold leading-none text-[#111816] dark:text-white">{user?.name || '사용자'}</span>
                <span className="text-xs text-[#5f8c80]">{user?.role === 'ROLE_SHELTER' ? '보호소' : user?.role === 'ROLE_ADMIN' ? '관리자' : '회원'}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center size-9 rounded-lg hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] text-[#5f8c80] hover:text-red-500 transition-colors ml-2"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10 pb-24">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {/* 브레드크럼 */}
          <nav className="flex flex-wrap gap-2 text-sm font-medium">
            <Link to="/" className="text-[#5f8c80] hover:text-primary transition-colors">
              홈
            </Link>
            <span className="text-[#5f8c80] material-symbols-outlined text-[16px] pt-0.5">chevron_right</span>
            <Link to="/mypage" className="text-[#5f8c80] hover:text-primary transition-colors">
              마이페이지
            </Link>
            <span className="text-[#5f8c80] material-symbols-outlined text-[16px] pt-0.5">chevron_right</span>
            <span className="text-[#111816] dark:text-white font-bold">동물 등록</span>
          </nav>

          {/* 페이지 제목 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
            <div className="flex flex-col gap-2">
              <h1 className="text-[#111816] dark:text-white text-3xl font-display font-black leading-tight tracking-tight">
                동물 등록
              </h1>
              <p className="text-[#5f8c80] text-base font-normal">
                보호소에서 보호 중인 동물을 등록하세요.
              </p>
            </div>
          </div>

          {/* 기본 정보 섹션 */}
          <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e0e8e5] dark:border-[#1f3530] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f0f5f3] dark:border-[#1f3530] flex items-center gap-3 bg-[#fbfdfc] dark:bg-[#1a2e29]">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <h2 className="text-[#111816] dark:text-white text-lg font-bold">기본 정보</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 flex flex-col gap-5">
                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">
                    종 <span className="text-red-500">*</span>
                  </span>
                <CustomSelect
                  value={species}
                  onChange={(value) => setSpecies(value as 'DOG' | 'CAT' | 'ETC')}
                  options={[
                    { value: 'DOG', label: '강아지' },
                    { value: 'CAT', label: '고양이' },
                    { value: 'ETC', label: '기타' },
                  ]}
                  placeholder="종을 선택하세요"
                />
              </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">품종</span>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="예: 믹스견, 라브라도 리트리버"
                    className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">
                      성별 <span className="text-red-500">*</span>
                    </span>
                    <CustomSelect
                      value={gender}
                      onChange={(value) => setGender(value as 'MALE' | 'FEMALE' | 'UNKNOWN' | '')}
                      options={[
                        { value: 'MALE', label: '수컷' },
                        { value: 'FEMALE', label: '암컷' },
                        { value: 'UNKNOWN', label: '미상' },
                      ]}
                      placeholder="성별을 선택하세요"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">
                      중성화 여부 <span className="text-red-500">*</span>
                    </span>
                    <CustomSelect
                      value={neuterStatus}
                      onChange={(value) => setNeuterStatus(value as 'YES' | 'NO' | 'UNKNOWN' | '')}
                      options={[
                        { value: 'YES', label: '중성화 완료' },
                        { value: 'NO', label: '중성화 안 함' },
                        { value: 'UNKNOWN', label: '미상' },
                      ]}
                      placeholder="중성화 여부를 선택하세요"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">출생년도</span>
                    <input
                      type="number"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : '')}
                      placeholder="예: 2023"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">체중</span>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="예: 5.5kg"
                      className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">색상</span>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="예: 갈색, 흰색"
                    className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">특이사항</span>
                  <textarea
                    value={specialMark}
                    onChange={(e) => setSpecialMark(e.target.value)}
                    placeholder="동물의 특징이나 특이사항을 입력해주세요."
                    rows={3}
                    className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y"
                  />
                </label>
              </div>

              {/* 이미지 업로드 영역 */}
              <div className="md:col-span-4 flex flex-col gap-2">
                <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">
                  대표 이미지 <span className="text-red-500">*</span>
                </span>
                {imagePreview ? (
                  <div className="relative flex-1 min-h-[240px]">
                    <img
                      src={imagePreview}
                      alt="대표 이미지 미리보기"
                      className="w-full h-full object-cover rounded-xl border border-[#e0e8e5] dark:border-[#2a453d]"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 rounded-full bg-red-500 text-white p-2 hover:bg-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex-1 min-h-[240px] border-2 border-dashed border-[#dbe6e3] dark:border-[#2a453d] rounded-xl bg-[#f8fbfb] dark:bg-[#122822] flex flex-col items-center justify-center gap-3 p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group/upload">
                    <div className="size-14 rounded-full bg-white dark:bg-[#1a2e29] shadow-sm flex items-center justify-center text-[#5f8c80] group-hover/upload:text-primary transition-colors border border-[#e0e8e5] dark:border-[#2a453d]">
                      <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-[#111816] dark:text-white group-hover/upload:text-primary transition-colors">
                        클릭하여 이미지 업로드
                      </p>
                      <p className="text-xs text-[#5f8c80]">SVG, PNG, JPG (최대 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
          </div>
        </section>

        {/* 발견 정보 섹션 */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e0e8e5] dark:border-[#1f3530] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f5f3] dark:border-[#1f3530] flex items-center gap-3 bg-[#fbfdfc] dark:bg-[#1a2e29]">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display">2</div>
            <h2 className="text-[#111816] dark:text-white text-lg font-bold">발견 정보</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">발견 일자</span>
                  <input
                    type="date"
                    value={happenDate}
                    onChange={(e) => setHappenDate(e.target.value)}
                    className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">발견 장소</span>
                  <input
                    type="text"
                    value={happenPlace}
                    onChange={(e) => setHappenPlace(e.target.value)}
                    placeholder="예: 서울시 강남구 역삼동"
                    className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 공고 정보 섹션 */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e0e8e5] dark:border-[#1f3530] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f5f3] dark:border-[#1f3530] flex items-center gap-3 bg-[#fbfdfc] dark:bg-[#1a2e29]">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display">3</div>
            <h2 className="text-[#111816] dark:text-white text-lg font-bold">공고 정보</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">공고 시작일</span>
                  <input
                    type="date"
                    value={noticeStartDate}
                    onChange={(e) => setNoticeStartDate(e.target.value)}
                    className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">공고 종료일</span>
                  <input
                    type="date"
                    value={noticeEndDate}
                    onChange={(e) => setNoticeEndDate(e.target.value)}
                    className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 설명 섹션 */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e0e8e5] dark:border-[#1f3530] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f5f3] dark:border-[#1f3530] flex items-center gap-3 bg-[#fbfdfc] dark:bg-[#1a2e29]">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display">4</div>
            <h2 className="text-[#111816] dark:text-white text-lg font-bold">보호소 설명</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">상세 설명</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="동물에 대한 상세한 설명을 입력해주세요."
                  rows={6}
                  className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y"
                />
              </label>
            </div>
          </div>
        </section>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-4 pt-6 border-t border-[#e0e8e5] dark:border-[#1f3530]">
            <Link
              to="/mypage"
              className="px-4 py-2 text-sm font-bold text-[#5f8c80] bg-transparent border border-[#dbe6e3] rounded-lg hover:bg-white hover:text-primary dark:border-[#1f3530] dark:hover:bg-[#1f3530] transition-colors"
            >
              취소
            </Link>
            <button
              onClick={handleSubmit}
              disabled={createAnimalMutation.isPending || uploadImageMutation.isPending}
              className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createAnimalMutation.isPending || uploadImageMutation.isPending
                ? '등록 중...'
                : '등록하기'}
            </button>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}

