import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createProduct, getOptionGroups, getCategories, uploadImage } from '../api/products.api';
import { errorMessage } from '../components/shelter/shelterView';
import type { OptionGroupResponse, CategoryResponse } from '../types/api.types';

// SKU 생성용 타입
interface CreateSku {
  skuCode: string;
  price: number;
  stockQuantity: number;
  optionValueIds: number[];
}
import AdminLayout from '../components/layout/AdminLayout';
import AdminProductImage from '../components/admin/AdminProductImage';
import { AdminError, AdminLoading, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';

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
  const [notice, setNotice] = useState('');

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
          sku.optionValueIds.every((id: number) => optionValueIds.includes(id))
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
        setNotice('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      // 파일 타입 검증 (jpeg, png, gif, webp만 허용)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setNotice('지원하는 이미지 형식은 JPEG, PNG, GIF, WEBP입니다.');
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
      setNotice('상품이 등록되었습니다.');
      navigate('/admin/products');
    },
    onError: (error: unknown) => {
      const message = errorMessage(error);
      setNotice(message);
    },
  });

  // 폼 제출
  const handleSubmit = async () => {
    if (uploadImageMutation.isPending || createProductMutation.isPending) return;
    setNotice('');
    // 유효성 검증
    if (!name.trim()) {
      setNotice('상품명을 입력해주세요.');
      return;
    }
    if (!categoryId) {
      setNotice('카테고리를 선택해주세요.');
      return;
    }
    if (!imageFile) {
      setNotice('상품 이미지를 업로드해주세요.');
      return;
    }
    if (skus.length === 0) {
      setNotice('최소 1개의 SKU가 필요합니다.');
      return;
    }

    // SKU 유효성 검증
    for (const sku of skus) {
      if (!sku.skuCode.trim()) {
        setNotice('모든 SKU 코드를 입력해주세요.');
        return;
      }
      if (sku.price <= 0) {
        setNotice('모든 SKU의 가격을 입력해주세요.');
        return;
      }
      if (sku.stockQuantity < 0) {
        setNotice('재고 수량은 0 이상이어야 합니다.');
        return;
      }
    }

    // SKU 코드 중복 검증
    const skuCodes = skus.map(s => s.skuCode);
    if (new Set(skuCodes).size !== skuCodes.length) {
      setNotice('SKU 코드는 중복될 수 없습니다.');
      return;
    }

    try {
      // 1. 이미지 업로드
      const imageResponse = await uploadImageMutation.mutateAsync(imageFile!);
      
      // 2. 상품 등록
      await createProductMutation.mutateAsync({
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
    } catch (error: unknown) {
      const message = errorMessage(error);
      setNotice(message);
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


  const busy = uploadImageMutation.isPending || createProductMutation.isPending;
  return <AdminLayout title="상품 등록" description="상품 기본 정보, 옵션 조합과 재고를 등록합니다.">
    {isLoadingCategories ? <AdminLoading label="카테고리를 불러오는 중입니다." /> : categoriesError ? <AdminError title="카테고리 조회 실패" /> : <form onSubmit={e => { e.preventDefault(); void handleSubmit(); }}>
      <fieldset disabled={busy} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">상품 기본 정보</h2>
            <label className="block text-sm font-medium">상품명 (필수)<input className={adminInput} value={name} onChange={e => setName(e.target.value)} /></label>
            <label className="block text-sm font-medium">카테고리 (필수)<select className={adminInput} value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}><option value="">카테고리 선택</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="block text-sm font-medium">상품 설명<textarea className={`${adminInput} min-h-40 resize-y`} value={description} onChange={e => setDescription(e.target.value)} /></label>
          </section>
          <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">옵션 조합과 SKU</h2>
            <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={useOptions} onChange={e => setUseOptions(e.target.checked)} />옵션 사용</label>
            {useOptions && <>{isLoadingOptions ? <AdminLoading label="옵션을 불러오는 중입니다." /> : optionGroupsError ? <AdminError title="옵션 조회 실패" /> : <>
              <label className="block text-sm font-medium">옵션 그룹<select className={adminInput} value={selectedOptionGroupId} onChange={e => handleOptionGroupSelect(e.target.value ? Number(e.target.value) : '')}><option value="">옵션 그룹 선택</option>{optionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
              <div className="flex flex-wrap gap-2">{currentOptionValues.map(value => <button type="button" key={value.id} aria-pressed={selectedOptionValues.get(Number(selectedOptionGroupId))?.includes(value.id) ?? false} className={selectedOptionValues.get(Number(selectedOptionGroupId))?.includes(value.id) ? adminPrimary : adminControl} onClick={() => handleOptionValueToggle(Number(selectedOptionGroupId), value.id)}>{value.name}</button>)}</div>
            </>}</>}
            <p className="text-sm text-brand-muted">선택한 값으로 {skus.length}개 SKU 조합을 만듭니다.</p>
            {skus.map((sku, index) => <section className="min-w-0 space-y-3 rounded-xl bg-stone-50 p-4 dark:bg-stone-800" key={index}>
              <h3 className="break-words text-sm font-bold">{getOptionDisplay(sku.optionValueIds)}</h3>
              <label className="block text-sm font-medium">SKU 코드 {index + 1} (필수)<input className={adminInput} value={sku.skuCode} onChange={e => handleSkuCodeChange(index, e.target.value)} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">가격 {index + 1} (원)<input type="number" min="1" className={adminInput} value={sku.price} onChange={e => handleSkuPriceChange(index, Number(e.target.value))} /></label>
                <label className="block text-sm font-medium">재고 {index + 1} (개)<input type="number" min="0" className={adminInput} value={sku.stockQuantity} onChange={e => handleSkuStockChange(index, Number(e.target.value))} /></label>
              </div>
            </section>)}
          </section>
        </div>
        <section className={`${adminPanel} space-y-4 xl:sticky xl:top-6`}>
          <h2 className="text-xl font-bold">대표 이미지</h2><AdminProductImage preview={imagePreview} onChange={handleImageChange} onRemove={handleRemoveImage} />
          {notice && <p role="alert" className="text-sm text-red-700">{notice}</p>}
          <div className="flex flex-wrap gap-2"><button type="submit" className={adminPrimary}>{busy ? '등록 중…' : '상품 등록'}</button><button type="button" className={adminControl} onClick={() => navigate('/admin/products')}>취소</button></div>
        </section>
      </fieldset>
    </form>}
  </AdminLayout>;
}
