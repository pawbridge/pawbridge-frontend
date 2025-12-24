import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createProduct, getOptionGroups, getCategories, uploadImage } from '../api/products.api';
import type { OptionGroupResponse, CreateSku, CategoryResponse } from '../types/api.types';
import { useAuthStore } from '../store/authStore';
import CustomSelect from '../components/common/CustomSelect';

// 선택된 옵션 값으로부터 SKU 조합 생성
function generateSkuCombinations(selectedOptionGroups: Map<number, number[]>): Array<number[]> {
  const groupIds = Array.from(selectedOptionGroups.keys());
  if (groupIds.length === 0) {
    return [[]]; // 옵션이 없으면 빈 배열 하나 반환
  }

  const combinations: Array<number[]> = [];
  
  function generate(index: number, current: number[]) {
    if (index === groupIds.length) {
      combinations.push([...current]);
      return;
    }

    const groupId = groupIds[index];
    const valueIds = selectedOptionGroups.get(groupId) || [];
    
    if (valueIds.length === 0) {
      // 옵션 그룹이 선택되지 않았으면 다음으로
      generate(index + 1, current);
      return;
    }

    for (const valueId of valueIds) {
      current.push(valueId);
      generate(index + 1, current);
      current.pop();
    }
  }

  generate(0, []);
  return combinations;
}

// SKU 코드 자동 생성
function generateSkuCode(productName: string, optionValueIds: number[], optionGroups: OptionGroupResponse[]): string {
  const namePrefix = productName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 6) || 'PROD';
  
  if (optionValueIds.length === 0) {
    return `${namePrefix}-001`;
  }

  // 옵션 값 ID로부터 이름 가져오기
  const optionNames: string[] = [];
  for (const group of optionGroups) {
    for (const value of group.values) {
      if (optionValueIds.includes(value.id)) {
        optionNames.push(`${group.name.substring(0, 2).toUpperCase()}-${value.name.substring(0, 3).toUpperCase()}`);
      }
    }
  }

  return optionNames.length > 0 
    ? `${namePrefix}-${optionNames.join('-')}` 
    : `${namePrefix}-001`;
}

export default function ProductCreate() {
  const navigate = useNavigate();

  // 기본 정보
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // 옵션 설정
  const [useOptions, setUseOptions] = useState(true);
  const [selectedOptionGroupId, setSelectedOptionGroupId] = useState<number | ''>('');
  const [selectedOptionValues, setSelectedOptionValues] = useState<Map<number, number[]>>(new Map()); // groupId -> valueIds[]

  // SKU 목록
  const [skus, setSkus] = useState<CreateSku[]>([]);

  // 옵션 그룹 목록 조회
  const { data: optionGroups = [], isLoading: isLoadingOptions, error: optionGroupsError } = useQuery<OptionGroupResponse[]>({
    queryKey: ['optionGroups'],
    queryFn: getOptionGroups,
  });

  // 카테고리 목록 조회
  const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery<CategoryResponse[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // 디버깅: 데이터 확인
  useEffect(() => {
    if (optionGroupsError) {
      console.error('옵션 그룹 조회 실패:', optionGroupsError);
    }
    if (categoriesError) {
      console.error('카테고리 조회 실패:', categoriesError);
    }
    console.log('카테고리 데이터:', categories);
    console.log('카테고리 로딩:', isLoadingCategories);
  }, [categories, isLoadingCategories, optionGroupsError, categoriesError]);

  // 선택된 옵션 그룹의 옵션 값들
  const currentOptionGroup = optionGroups.find(g => g.id === Number(selectedOptionGroupId));
  const currentOptionValues = currentOptionGroup?.values || [];

  // 옵션 그룹 선택 시 SKU 자동 생성
  useEffect(() => {
    if (!useOptions || selectedOptionValues.size === 0) {
      // 옵션을 사용하지 않거나 선택된 옵션이 없으면 SKU 1개만
      setSkus(prevSkus => {
        if (prevSkus.length === 0) {
          return [{
            skuCode: generateSkuCode(name || 'PROD', [], optionGroups),
            price: 0,
            stockQuantity: 0,
            optionValueIds: [],
          }];
        } else if (prevSkus.length > 1) {
          // 기존 SKU 중 첫 번째 것만 유지
          return [{
            ...prevSkus[0],
            optionValueIds: [],
          }];
        }
        return prevSkus;
      });
      return;
    }

    // 선택된 옵션 값들로부터 조합 생성
    const combinations = generateSkuCombinations(selectedOptionValues);
    
    setSkus(prevSkus => {
      const newSkus = combinations.map((optionValueIds) => {
        // 기존 SKU가 같은 optionValueIds를 가지고 있으면 유지
        const existing = prevSkus.find(sku => 
          sku.optionValueIds.length === optionValueIds.length &&
          sku.optionValueIds.every(id => optionValueIds.includes(id))
        );
        
        return existing || {
          skuCode: generateSkuCode(name || 'PROD', optionValueIds, optionGroups),
          price: 0,
          stockQuantity: 0,
          optionValueIds,
        };
      });
      return newSkus;
    });
  }, [selectedOptionValues, useOptions, name, optionGroups]);

  // 옵션 그룹 선택 핸들러
  const handleOptionGroupSelect = (groupId: number | '') => {
    setSelectedOptionGroupId(groupId);
  };

  // 옵션 값 토글 핸들러
  const handleOptionValueToggle = (groupId: number, valueId: number) => {
    setSelectedOptionValues(prev => {
      const newMap = new Map(prev);
      const currentValues = newMap.get(groupId) || [];
      
      if (currentValues.includes(valueId)) {
        // 이미 선택되어 있으면 제거
        const filtered = currentValues.filter(id => id !== valueId);
        if (filtered.length === 0) {
          newMap.delete(groupId);
        } else {
          newMap.set(groupId, filtered);
        }
      } else {
        // 선택되지 않았으면 추가
        newMap.set(groupId, [...currentValues, valueId]);
      }
      
      return newMap;
    });
  };

  // SKU 코드 변경
  const handleSkuCodeChange = (index: number, skuCode: string) => {
    const updated = [...skus];
    updated[index].skuCode = skuCode;
    setSkus(updated);
  };

  // SKU 가격 변경
  const handleSkuPriceChange = (index: number, price: number) => {
    const updated = [...skus];
    updated[index].price = price;
    setSkus(updated);
  };

  // SKU 재고 변경
  const handleSkuStockChange = (index: number, stockQuantity: number) => {
    const updated = [...skus];
    updated[index].stockQuantity = stockQuantity;
    setSkus(updated);
  };

  // 이미지 파일 선택
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      // 파일 타입 검증 (jpeg, png, gif, webp만 허용)
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

  // 이미지 제거
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  // 이미지 업로드 mutation
  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
  });

  // 상품 등록 mutation
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      alert('상품이 등록되었습니다.');
      navigate('/products');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '상품 등록에 실패했습니다.';
      alert(message);
    },
  });

  // 폼 제출
  const handleSubmit = async () => {
    // 유효성 검증
    if (!name.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }
    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (!imageFile) {
      alert('상품 이미지를 업로드해주세요.');
      return;
    }
    if (skus.length === 0) {
      alert('최소 1개의 SKU가 필요합니다.');
      return;
    }

    // SKU 유효성 검증
    for (const sku of skus) {
      if (!sku.skuCode.trim()) {
        alert('모든 SKU 코드를 입력해주세요.');
        return;
      }
      if (sku.price <= 0) {
        alert('모든 SKU의 가격을 입력해주세요.');
        return;
      }
      if (sku.stockQuantity < 0) {
        alert('재고 수량은 0 이상이어야 합니다.');
        return;
      }
    }

    // SKU 코드 중복 검증
    const skuCodes = skus.map(s => s.skuCode);
    if (new Set(skuCodes).size !== skuCodes.length) {
      alert('SKU 코드는 중복될 수 없습니다.');
      return;
    }

    try {
      // 1. 이미지 업로드
      const imageResponse = await uploadImageMutation.mutateAsync(imageFile!);
      
      // 2. 상품 등록
      createProductMutation.mutate({
        name: name.trim(),
        description: description.trim() || '',
        imageUrl: imageResponse.imageUrl,
        categoryId: Number(categoryId),
        skus: skus.map(s => ({
          skuCode: s.skuCode.trim(),
          price: s.price,
          stockQuantity: s.stockQuantity,
          optionValueIds: s.optionValueIds,
        })),
      });
    } catch (error: any) {
      const message = error.response?.data?.message || '이미지 업로드에 실패했습니다.';
      alert(message);
    }
  };

  // 옵션 정보 표시용 (SKU 테이블에서 사용)
  const getOptionDisplay = (optionValueIds: number[]): string => {
    if (optionValueIds.length === 0) return '옵션 없음';
    
    const parts: string[] = [];
    for (const group of optionGroups) {
      for (const value of group.values) {
        if (optionValueIds.includes(value.id)) {
          parts.push(`${group.name}: ${value.name}`);
        }
      }
    }
    return parts.join(', ');
  };

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
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="text-sm font-medium">대시보드</span>
          </Link>
          <Link to="/admin/stats" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">bar_chart</span>
            <span className="text-sm font-medium">통계</span>
          </Link>
          <div className="my-2 h-px bg-[#e0e8e5] dark:bg-[#1f3530] mx-3"></div>
          <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">group</span>
            <span className="text-sm font-medium">회원 관리</span>
          </Link>
          <Link to="/admin/posts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">article</span>
            <span className="text-sm font-medium">게시글 관리</span>
          </Link>
          <Link to="/admin/categories" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">category</span>
            <span className="text-sm font-medium">카테고리 관리</span>
          </Link>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#111816] dark:text-white bg-[#f0f5f3] dark:bg-[#1f3530] font-bold">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-primary">inventory_2</span>
                <span className="text-sm">상품 관리</span>
              </div>
              <span className="material-symbols-outlined text-[18px]">expand_less</span>
            </div>
            <div className="flex flex-col pl-11 gap-1">
              <Link to="/products" className="block px-3 py-2 rounded-lg text-sm text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:text-white dark:hover:bg-[#1f3530] transition-colors">
                상품 목록
              </Link>
              <Link to="/products/new" className="block px-3 py-2 rounded-lg text-sm font-bold text-primary bg-primary/10 transition-colors">
                상품 등록
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[#5f8c80] hover:text-[#111816] hover:bg-[#f0f5f3] dark:hover:bg-[#1f3530] dark:hover:text-white transition-colors group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] group-hover:text-primary transition-colors">tune</span>
                <span className="text-sm font-medium">옵션 관리</span>
              </div>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
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
                <span className="text-sm font-bold leading-none text-[#111816] dark:text-white">{user?.name || '관리자'}</span>
                <span className="text-xs text-[#5f8c80]">{user?.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}</span>
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
            <a className="text-[#5f8c80] hover:text-primary transition-colors" href="/">
              홈
            </a>
            <span className="text-[#5f8c80] material-symbols-outlined text-[16px] pt-0.5">chevron_right</span>
            <a className="text-[#5f8c80] hover:text-primary transition-colors" href="/products">
              상품 관리
            </a>
            <span className="text-[#5f8c80] material-symbols-outlined text-[16px] pt-0.5">chevron_right</span>
            <span className="text-[#111816] dark:text-white font-bold">상품 등록</span>
          </nav>

          {/* 페이지 제목 */}
          <div className="flex flex-col gap-2 pb-2">
            <h1 className="text-[#111816] dark:text-white text-3xl font-display font-black leading-tight tracking-tight">
              상품 등록
            </h1>
            <p className="text-[#5f8c80] text-base font-normal">
              새로운 유기동물 후원 굿즈 상품을 등록하고 재고를 관리하세요.
            </p>
          </div>

          {/* 기본 정보 섹션 */}
          <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e0e8e5] dark:border-[#1f3530] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f0f5f3] dark:border-[#1f3530] flex items-center gap-3 bg-[#fbfdfc] dark:bg-[#1a2e29]">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display">1</div>
              <h2 className="text-[#111816] dark:text-white text-lg font-bold">기본 정보</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 flex flex-col gap-5">
                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">
                    상품명 <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="상품 이름을 입력하세요 (예: 유기견 후원 티셔츠)"
                    className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </label>
                <label className="flex flex-col gap-2 relative" style={{ zIndex: 200 }}>
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">
                    카테고리 <span className="text-red-500">*</span>
                  </span>
                  <CustomSelect
                    value={categoryId}
                    onChange={(value) => {
                      setCategoryId(value ? Number(value) : '');
                    }}
                    options={categories.map(category => ({
                      value: category.id,
                      label: category.name,
                    }))}
                    placeholder="카테고리 선택"
                    disabled={isLoadingCategories}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">상품 상세 설명</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="상품에 대한 상세한 설명을 입력해주세요."
                    className="w-full h-32 resize-y rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-4 py-3 text-[#111816] dark:text-white placeholder-[#5f8c80] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                      alt="상품 이미지 미리보기"
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
                      <p className="text-xs text-[#5f8c80]">SVG, PNG, JPG (최대 5MB)</p>
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

          {/* 옵션 설정 섹션 */}
          <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e0e8e5] dark:border-[#1f3530] overflow-visible">
            <div className="px-6 py-4 border-b border-[#f0f5f3] dark:border-[#1f3530] flex items-center justify-between bg-[#fbfdfc] dark:bg-[#1a2e29]">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display">2</div>
                <h2 className="text-[#111816] dark:text-white text-lg font-bold">옵션 설정</h2>
              </div>
              <label className="flex items-center cursor-pointer gap-2 select-none">
                <input
                  type="checkbox"
                  checked={useOptions}
                  onChange={(e) => setUseOptions(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="text-sm font-medium text-[#111816] dark:text-gray-300">옵션 사용</span>
              </label>
            </div>
            {useOptions && (
              <div className="p-6 bg-[#f8fbfb] dark:bg-[#122822] relative z-0 overflow-visible">
                <div className="flex flex-col md:flex-row gap-6 items-start relative">
                  <div className="w-full md:w-1/3 flex flex-col gap-2 relative" style={{ zIndex: 1000 }}>
                    <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">옵션 그룹</span>
                    <CustomSelect
                      value={selectedOptionGroupId}
                      onChange={(value) => handleOptionGroupSelect(value ? Number(value) : '')}
                      options={optionGroups.map(group => ({
                        value: group.id,
                        label: group.name,
                      }))}
                      placeholder="옵션 그룹 선택"
                      disabled={isLoadingOptions}
                    />
                    <p className="text-xs text-[#5f8c80] mt-1 pl-1">
                      옵션 그룹을 선택하면 아래에 선택 가능한 값이 표시됩니다.
                    </p>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col gap-2">
                    <span className="text-[#111816] dark:text-gray-200 text-sm font-bold">옵션 값 선택</span>
                    <div className="flex flex-wrap gap-3 p-5 rounded-xl bg-white dark:bg-[#0f231e] border border-[#dbe6e3] dark:border-[#2a453d] min-h-[100px] content-start">
                      {currentOptionValues.length === 0 ? (
                        <p className="text-sm text-[#5f8c80]">옵션 그룹을 선택해주세요.</p>
                      ) : (
                        currentOptionValues.map((value) => {
                          const groupId = Number(selectedOptionGroupId);
                          const isSelected = groupId ? selectedOptionValues.get(groupId)?.includes(value.id) || false : false;
                          return (
                            <label key={value.id} className="cursor-pointer group select-none">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (groupId) {
                                    handleOptionValueToggle(groupId, value.id);
                                  }
                                }}
                                className="peer sr-only"
                              />
                              <div className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 shadow-sm ${
                                isSelected
                                  ? 'bg-primary text-[#111816] border-primary'
                                  : 'border-[#dbe6e3] dark:border-[#2a453d] text-[#5f8c80] hover:bg-[#f0f5f3] dark:hover:bg-[#1a2e29]'
                              }`}>
                                <span>{value.name}</span>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 재고 및 가격 관리 (SKU) 섹션 */}
          <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e0e8e5] dark:border-[#1f3530] overflow-visible mb-8" style={{ zIndex: 1 }}>
            <div className="px-6 py-4 border-b border-[#f0f5f3] dark:border-[#1f3530] flex items-center gap-3 bg-[#fbfdfc] dark:bg-[#1a2e29]">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display">3</div>
              <h2 className="text-[#111816] dark:text-white text-lg font-bold">재고 및 가격 관리 (SKU)</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f8fbfb] dark:bg-[#122822] text-[#5f8c80] text-sm font-bold border-b border-[#e0e8e5] dark:border-[#1f3530]">
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap w-[25%]">SKU 코드</th>
                    <th className="px-6 py-3 whitespace-nowrap w-[25%]">옵션 정보</th>
                    <th className="px-6 py-3 whitespace-nowrap w-[25%]">판매가 (KRW)</th>
                    <th className="px-6 py-3 whitespace-nowrap w-[25%]">재고 수량</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f5f3] dark:divide-[#1f3530]">
                  {skus.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#5f8c80]">
                        {useOptions ? '옵션을 선택하면 SKU가 자동 생성됩니다.' : 'SKU 정보를 입력해주세요.'}
                      </td>
                    </tr>
                  ) : (
                    skus.map((sku, index) => (
                      <tr key={index} className="hover:bg-[#f8fbfb] dark:hover:bg-[#122822] transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={sku.skuCode}
                            onChange={(e) => handleSkuCodeChange(index, e.target.value)}
                            className="font-mono text-sm text-[#5f8c80] bg-[#f0f5f3] dark:bg-[#1f3530] px-2 py-1 rounded border border-[#e0e8e5] dark:border-[#2a453d] w-full focus:outline-none focus:ring-1 focus:ring-primary dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block size-2.5 rounded-full bg-primary ring-2 ring-primary/30"></span>
                            <span className="text-sm font-medium text-[#111816] dark:text-white">
                              {getOptionDisplay(sku.optionValueIds)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative max-w-[160px]">
                            <input
                              type="number"
                              value={sku.price || ''}
                              onChange={(e) => handleSkuPriceChange(index, Number(e.target.value))}
                              className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] pl-3 pr-8 py-2 text-sm text-right focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5f8c80] font-bold">원</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative max-w-[120px]">
                            <input
                              type="number"
                              value={sku.stockQuantity || ''}
                              onChange={(e) => handleSkuStockChange(index, Number(e.target.value))}
                              className="w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] bg-white dark:bg-[#0f231e] px-3 py-2 text-sm text-right focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5f8c80] pointer-events-none">개</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* 하단 고정 버튼 */}
        <footer className="absolute bottom-0 left-0 w-full bg-white dark:bg-[#0f231e] border-t border-[#e0e8e5] dark:border-[#1f3530] px-6 md:px-10 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <p className="text-sm text-[#5f8c80] hidden md:flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span><span className="font-bold">Tip:</span> 필수 항목(*)을 모두 입력해야 상품 등록이 가능합니다.</span>
            </p>
            <div className="flex gap-4 w-full md:w-auto justify-end">
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-2.5 rounded-lg border border-[#dbe6e3] dark:border-[#2a453d] text-[#111816] dark:text-gray-300 font-bold hover:bg-[#f0f5f3] dark:hover:bg-[#1a2e29] transition-colors w-full md:w-auto"
              >
                취소하기
              </button>
              <button
                onClick={handleSubmit}
                disabled={createProductMutation.isPending || uploadImageMutation.isPending}
                className="px-8 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-[#111816] font-bold shadow-lg shadow-primary/25 transition-colors flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">check</span>
                {createProductMutation.isPending || uploadImageMutation.isPending ? '등록 중...' : '상품 등록하기'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
