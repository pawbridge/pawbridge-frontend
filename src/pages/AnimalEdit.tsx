import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAnimalById, updateAnimal, uploadAnimalImage } from '../api/animals.api';
import type { UpdateAnimalRequest } from '../api/animals.api';
import { useAuthStore } from '../store/authStore';
import CustomSelect from '../components/common/CustomSelect';
import AdminSidebar from '../components/layout/AdminSidebar';

export default function AnimalEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 이전 페이지 정보 확인
  const fromMyPage = location.state?.from === 'mypage';
  const previousTab = location.state?.tab;

  // 동물 정보 조회
  const { data: animal, isLoading: isLoadingAnimal, error: animalError } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => getAnimalById(Number(id)),
    enabled: !!id,
  });

  const authUser = useAuthStore((state) => state.user);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // 폼 상태
  const [species, setSpecies] = useState<'DOG' | 'CAT' | 'ETC'>('DOG');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'UNKNOWN' | ''>('');
  const [neuterStatus, setNeuterStatus] = useState<'YES' | 'NO' | 'UNKNOWN' | ''>('');
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [specialMark, setSpecialMark] = useState('');

  const [happenDate, setHappenDate] = useState('');
  const [happenPlace, setHappenPlace] = useState('');

  const [noticeStartDate, setNoticeStartDate] = useState('');
  const [noticeEndDate, setNoticeEndDate] = useState('');

  const [description, setDescription] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // 동물 정보 로드 시 폼 초기화
  useEffect(() => {
    if (animal) {
      setSpecies((animal.species as 'DOG' | 'CAT' | 'ETC') || 'DOG');
      setBreed(animal.breed || '');
      setGender((animal.gender as 'MALE' | 'FEMALE' | 'UNKNOWN') || '');
      setNeuterStatus((animal.neuterStatus as 'YES' | 'NO' | 'UNKNOWN') || '');
      setBirthYear(animal.birthYear || '');
      setWeight(animal.weight?.toString() || '');
      setColor(animal.color || '');
      setSpecialMark(animal.specialMark || '');
      setHappenDate(animal.happenDate?.split('T')[0] || '');
      setHappenPlace(animal.happenPlace || '');
      setNoticeStartDate(animal.noticeStartDate?.split('T')[0] || '');
      setNoticeEndDate(animal.noticeEndDate?.split('T')[0] || '');
      setDescription(animal.description || '');
      setImagePreview(animal.imageUrl || '');
    }
  }, [animal]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert('지원하는 이미지 형식은 JPEG, PNG, GIF, WEBP입니다.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(animal?.imageUrl || '');
  };

  const uploadImageMutation = useMutation({
    mutationFn: uploadAnimalImage,
  });

  const updateAnimalMutation = useMutation({
    mutationFn: (animalData: UpdateAnimalRequest) => updateAnimal(Number(id!), animalData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      queryClient.invalidateQueries({ queryKey: ['registeredAnimals'] });
      alert('동물 정보가 수정되었습니다.');
      navigate(`/animals/${data.id}`, { state: { from: fromMyPage ? 'mypage' : undefined, tab: previousTab } });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '동물 정보 수정에 실패했습니다.';
      alert(message);
    },
  });

  const handleSubmit = async () => {
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

    try {
      let imageUrl = '';

      if (imageFile) {
        const imageResponse = await uploadImageMutation.mutateAsync(imageFile);
        imageUrl = imageResponse.imageUrl;
        if (!imageUrl) {
          alert('이미지 URL을 받아오지 못했습니다. 다시 시도해주세요.');
          return;
        }
      } else if (animal?.imageUrl) {
        // 새 이미지를 업로드하지 않았으면 기존 이미지 URL 사용
        imageUrl = animal.imageUrl;
      }

      // status 타입 변환 (Animal의 status를 UpdateAnimalRequest의 status로 변환)
      let status: 'PROTECT' | 'ADOPTION_PENDING' | 'ADOPTED' | 'EUTHANIZED' | 'NATURAL_DEATH' | 'RETURNED' | 'DONATED' | 'RELEASED' | 'ESCAPED' | 'UNKNOWN' = 'PROTECT';
      if (animal?.status) {
        if (['PROTECT', 'ADOPTION_PENDING', 'ADOPTED', 'EUTHANIZED', 'NATURAL_DEATH', 'RETURNED', 'DONATED', 'RELEASED', 'ESCAPED', 'UNKNOWN'].includes(animal.status)) {
          status = animal.status as typeof status;
        }
      }

      const animalData: UpdateAnimalRequest = {
        species,
        status,
        noticeStartDate,
        noticeEndDate,
        gender: gender as 'MALE' | 'FEMALE' | 'UNKNOWN',
        neuterStatus: neuterStatus as 'YES' | 'NO' | 'UNKNOWN',
        ...(breed && { breed }),
        ...(birthYear && { birthYear: Number(birthYear) }),
        ...(weight && { weight }),
        ...(color && { color }),
        ...(specialMark && { specialMark }),
        ...(happenDate && { happenDate }),
        ...(happenPlace && { happenPlace }),
        ...(imageUrl && { imageUrl }),
        ...(description && { description }),
      };

      await updateAnimalMutation.mutateAsync(animalData);
    } catch (error: any) {
      const message = error.response?.data?.message || '이미지 업로드 또는 동물 정보 수정에 실패했습니다.';
      alert(message);
    }
  };

  if (isLoadingAnimal) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-[#111816] dark:text-gray-100 font-body h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">동물 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (animalError || !animal) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-[#111816] dark:text-gray-100 font-body h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
          <p className="text-gray-500 mb-4">동물 정보를 불러올 수 없습니다.</p>
          <Link
            to={fromMyPage ? '/mypage' : '/animals'}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 권한 체크 (보호소가 직접 등록한 동물만 수정 가능)
  const isMyAnimal = animal && 
    authUser?.role === 'ROLE_SHELTER' &&
    animal.apiSource === 'MANUAL' &&
    authUser?.careRegNo &&
    animal.careRegNo &&
    authUser.careRegNo === animal.careRegNo;

  if (!isMyAnimal) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-[#111816] dark:text-gray-100 font-body h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
          <p className="text-gray-500 mb-4">보호소가 직접 등록한 동물만 수정할 수 있습니다.</p>
          <Link
            to={`/animals/${id}`}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111816] dark:text-gray-100 font-body h-screen flex overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
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

        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10 pb-24">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <nav className="flex flex-wrap gap-2 text-sm font-medium">
              <Link to="/" className="text-[#5f8c80] hover:text-primary transition-colors">
                홈
              </Link>
              <span className="text-[#5f8c80] material-symbols-outlined text-[16px] pt-0.5">chevron_right</span>
              <Link to="/mypage" className="text-[#5f8c80] hover:text-primary transition-colors">
                마이페이지
              </Link>
              <span className="text-[#5f8c80] material-symbols-outlined text-[16px] pt-0.5">chevron_right</span>
              <span className="text-[#111816] dark:text-white font-bold">동물 수정</span>
            </nav>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
              <div className="flex flex-col gap-2">
                <h1 className="text-[#111816] dark:text-white text-3xl font-display font-black leading-tight tracking-tight">
                  동물 수정
                </h1>
                <p className="text-[#5f8c80] text-base font-normal">
                  등록한 동물의 정보를 수정하세요.
                </p>
              </div>
            </div>

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

            <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e0e8e5] dark:border-[#1f3530] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f0f5f3] dark:border-[#1f3530] flex items-center gap-3 bg-[#fbfdfc] dark:bg-[#1a2e29]">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display">3</div>
                <h2 className="text-[#111816] dark:text-white text-lg font-bold">공고 정보</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">
                        공고 시작일 <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="date"
                        value={noticeStartDate}
                        onChange={(e) => setNoticeStartDate(e.target.value)}
                        className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">
                        공고 종료일 <span className="text-red-500">*</span>
                      </span>
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

            <div className="flex justify-end gap-4 pt-6 border-t border-[#e0e8e5] dark:border-[#1f3530]">
              <Link
                to={`/animals/${id}`}
                state={{ from: fromMyPage ? 'mypage' : undefined, tab: previousTab }}
                className="px-4 py-2 text-sm font-bold text-[#5f8c80] bg-transparent border border-[#dbe6e3] rounded-lg hover:bg-white hover:text-primary dark:border-[#1f3530] dark:hover:bg-[#1f3530] transition-colors"
              >
                취소
              </Link>
              <button
                onClick={handleSubmit}
                disabled={updateAnimalMutation.isPending || uploadImageMutation.isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateAnimalMutation.isPending || uploadImageMutation.isPending
                  ? '수정 중...'
                  : '수정하기'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

