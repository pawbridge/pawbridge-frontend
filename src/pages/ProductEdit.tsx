import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getProductById, updateProduct, deleteProduct, getCategories, uploadImage } from '../api/products.api';
import type { Product, UpdateProductRequest, UpdateSku, CategoryResponse } from '../types/api.types';
import CustomSelect from '../components/common/CustomSelect';

export default function ProductEdit() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 상품 정보 조회
  const { data: product, isLoading: isLoadingProduct, error: productError } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => getProductById(Number(productId)),
    enabled: !!productId,
  });

  // 카테고리 목록 조회
  const { data: categories = [] } = useQuery<CategoryResponse[]>({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  // 폼 상태
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SOLD_OUT'>('ACTIVE');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [skus, setSkus] = useState<Array<UpdateSku & { skuId: number; skuCode: string; options: Record<string, string> }>>([]);

  // 상품 정보 로드 시 폼 초기화
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setStatus(product.status as 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT');
      setCategoryId(product.categoryId || '');
      setImagePreview(product.imageUrl);
      
      // SKU 정보 설정
      if (product.skus) {
        setSkus(product.skus.map(sku => ({
          id: sku.skuId,
          skuId: sku.skuId,
          skuCode: sku.skuCode,
          price: sku.price,
          stockQuantity: sku.stockQuantity,
          options: sku.options,
        })));
      }
    }
  }, [product]);

  // 이미지 파일 선택
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 파일 크기는 5MB 이하여야 합니다.');
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

  // 이미지 제거
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(product?.imageUrl || '');
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

  // 이미지 업로드 mutation
  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
  });

  // 상품 수정 mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: UpdateProductRequest) => {
      return updateProduct(Number(productId), data);
    },
    onSuccess: () => {
      alert('상품이 성공적으로 수정되었습니다.');
      navigate('/admin/products');
    },
    onError: (error: any) => {
      alert(`상품 수정 실패: ${error.response?.data?.message || error.message}`);
    },
  });

  // 상품 삭제 mutation
  const deleteProductMutation = useMutation({
    mutationFn: () => deleteProduct(Number(productId)),
    onSuccess: () => {
      alert('상품이 삭제되었습니다.');
      navigate('/admin/products');
    },
    onError: (error: any) => {
      alert(`상품 삭제 실패: ${error.response?.data?.message || error.message}`);
      setShowDeleteModal(false);
    },
  });

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }

    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    try {
      let imageUrl = product?.imageUrl || '';

      // 새 이미지가 있으면 업로드
      if (imageFile) {
        const uploadResult = await uploadImageMutation.mutateAsync(imageFile);
        imageUrl = uploadResult.imageUrl;
      }

      // SKU 데이터 준비 (id 필수)
      const skuData: UpdateSku[] = skus.map(sku => ({
        id: sku.id,
        price: sku.price,
        stockQuantity: sku.stockQuantity,
      }));

      const updateData: UpdateProductRequest = {
        name,
        description,
        status,
        categoryId: Number(categoryId),
        imageUrl,
        skus: skuData,
      };

      await updateProductMutation.mutateAsync(updateData);
    } catch (error) {
      console.error('상품 수정 실패:', error);
    }
  };

  // 삭제 확인
  const handleDelete = () => {
    deleteProductMutation.mutate();
  };

  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">로딩 중...</div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">상품을 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main font-sans min-h-screen flex overflow-hidden">
      {/* 사이드바 */}
      <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-[#e0e8e5] dark:border-[#1f3530] flex flex-col flex-shrink-0 z-50">
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
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 scrollbar-hide">
          <Link to="/admin/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-text-secondary hover:bg-background-light hover:text-text-main transition-colors group">
            <span className="material-symbols-outlined text-[24px]">dashboard</span>
            <span className="text-sm font-medium">대시보드</span>
          </Link>
          <div className="py-2">
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 text-text-main transition-colors">
              <span className="material-symbols-outlined text-[24px] text-primary-dark">inventory_2</span>
              <span className="text-sm font-bold">상품 관리</span>
            </div>
            <div className="mt-1 flex flex-col space-y-1 pl-12 pr-2">
              <Link to="/admin/products" className="rounded-md px-2 py-1.5 text-sm font-medium text-primary-dark bg-white/50 dark:bg-black/20">
                상품 목록
              </Link>
              <Link to="/products/new" className="rounded-md px-2 py-1.5 text-sm font-medium text-text-secondary hover:text-text-main transition-colors">
                상품 등록
              </Link>
            </div>
          </div>
          <Link to="/admin/categories" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-text-secondary hover:bg-background-light hover:text-text-main transition-colors group">
            <span className="material-symbols-outlined text-[24px]">category</span>
            <span className="text-sm font-medium">카테고리 관리</span>
          </Link>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#e0e8e5] dark:border-[#1f3530] bg-surface-light/80 dark:bg-surface-dark/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-text-secondary hover:text-primary transition-colors">홈</Link>
            <span className="text-text-secondary">/</span>
            <Link to="/admin/products" className="text-text-secondary hover:text-primary transition-colors">상품 관리</Link>
            <span className="text-text-secondary">/</span>
            <Link to="/admin/products" className="text-text-secondary hover:text-primary transition-colors">상품 목록</Link>
            <span className="text-text-secondary">/</span>
            <span className="font-medium text-text-main dark:text-white">상품 수정</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              삭제
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 lg:px-12 lg:py-8 max-w-[1200px] mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-text-main dark:text-white">상품 수정</h1>
            <p className="mt-1 text-sm text-text-secondary">상품의 상세 정보와 옵션별 재고 상태를 수정합니다.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* 왼쪽: 기본 정보 및 SKU */}
              <div className="flex flex-col gap-6 lg:col-span-2">
                {/* 기본 정보 */}
                <div className="rounded-2xl border border-[#e0e8e5] dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm">
                  <h3 className="mb-5 text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                    기본 정보
                  </h3>
                  
                  {/* 상품 ID 및 생성일 */}
                  <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 rounded-xl bg-background-light dark:bg-gray-800/50 p-4 border border-[#e0e8e5] dark:border-gray-600">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase">상품 ID</label>
                      <p className="mt-1 font-mono text-sm font-medium text-text-main dark:text-gray-300">#{product.productId}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase">생성일</label>
                      <p className="mt-1 font-mono text-sm font-medium text-text-main dark:text-gray-300">{formatDate(product.createdAt)}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* 상품명 */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-main dark:text-gray-200">상품명</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-[#e0e8e5] dark:border-gray-600 bg-background-light dark:bg-gray-800 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:text-white"
                        required
                      />
                    </div>

                    {/* 상품 상태 */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-main dark:text-gray-200">상품 상태</label>
                      <div className="flex flex-wrap gap-3">
                        <label className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                          status === 'ACTIVE' 
                            ? 'border-primary bg-primary/5 text-primary-dark' 
                            : 'border-[#e0e8e5] dark:border-gray-600 hover:bg-background-light dark:hover:bg-gray-800'
                        }`}>
                          <input
                            type="radio"
                            name="product_status"
                            value="ACTIVE"
                            checked={status === 'ACTIVE'}
                            onChange={() => setStatus('ACTIVE')}
                            className="form-radio text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium">활성</span>
                        </label>
                        <label className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                          status === 'INACTIVE' 
                            ? 'border-primary bg-primary/5 text-primary-dark' 
                            : 'border-[#e0e8e5] dark:border-gray-600 hover:bg-background-light dark:hover:bg-gray-800'
                        }`}>
                          <input
                            type="radio"
                            name="product_status"
                            value="INACTIVE"
                            checked={status === 'INACTIVE'}
                            onChange={() => setStatus('INACTIVE')}
                            className="form-radio text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium">비활성</span>
                        </label>
                        <label className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                          status === 'SOLD_OUT' 
                            ? 'border-primary bg-primary/5 text-primary-dark' 
                            : 'border-[#e0e8e5] dark:border-gray-600 hover:bg-background-light dark:hover:bg-gray-800'
                        }`}>
                          <input
                            type="radio"
                            name="product_status"
                            value="SOLD_OUT"
                            checked={status === 'SOLD_OUT'}
                            onChange={() => setStatus('SOLD_OUT')}
                            className="form-radio text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium">품절</span>
                        </label>
                      </div>
                    </div>

                    {/* 카테고리 */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-main dark:text-gray-200">카테고리</label>
                      <CustomSelect
                        value={categoryId}
                        onChange={(value) => setCategoryId(typeof value === 'number' ? value : '')}
                        options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                        placeholder="카테고리 선택"
                      />
                    </div>

                    {/* 상세 설명 */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-main dark:text-gray-200">상세 설명</label>
                      <div className="relative rounded-lg border border-[#e0e8e5] dark:border-gray-600 bg-background-light dark:bg-gray-800">
                        <div className="flex items-center gap-1 border-b border-[#e0e8e5] dark:border-gray-600 px-2 py-2">
                          <button type="button" className="rounded p-1 text-text-secondary hover:bg-gray-200 hover:text-text-main dark:hover:bg-gray-700">
                            <span className="material-symbols-outlined text-[20px]">format_bold</span>
                          </button>
                          <button type="button" className="rounded p-1 text-text-secondary hover:bg-gray-200 hover:text-text-main dark:hover:bg-gray-700">
                            <span className="material-symbols-outlined text-[20px]">format_italic</span>
                          </button>
                          <button type="button" className="rounded p-1 text-text-secondary hover:bg-gray-200 hover:text-text-main dark:hover:bg-gray-700">
                            <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                          </button>
                          <button type="button" className="rounded p-1 text-text-secondary hover:bg-gray-200 hover:text-text-main dark:hover:bg-gray-700">
                            <span className="material-symbols-outlined text-[20px]">link</span>
                          </button>
                        </div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full resize-y rounded-b-lg border-none bg-transparent px-4 py-3 text-sm text-text-main focus:ring-0 dark:text-white min-h-[160px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 옵션 및 재고 관리 (SKU) */}
                <div className="rounded-2xl border border-[#e0e8e5] dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">inventory</span>
                      옵션 및 재고 관리 (SKU)
                    </h3>
                    <div className="flex items-center gap-2 rounded-full bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 text-xs text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      SKU ID, SKU 코드, 옵션 조합은 수정 불가
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#e0e8e5] dark:border-gray-600">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-background-light dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 font-medium text-text-secondary dark:text-gray-400 w-24">SKU ID</th>
                          <th className="px-4 py-3 font-medium text-text-secondary dark:text-gray-400">SKU 코드</th>
                          <th className="px-4 py-3 font-medium text-text-secondary dark:text-gray-400">옵션 조합</th>
                          <th className="px-4 py-3 font-medium text-text-secondary dark:text-gray-400 w-32">가격 (원)</th>
                          <th className="px-4 py-3 font-medium text-text-secondary dark:text-gray-400 w-24">재고</th>
                          <th className="px-4 py-3 font-medium text-text-secondary dark:text-gray-400 w-20 text-center">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e0e8e5] dark:divide-gray-600 bg-white dark:bg-surface-dark">
                        {skus.map((sku, index) => (
                          <tr key={sku.skuId} className="group hover:bg-background-light dark:hover:bg-gray-800 transition-colors">
                            <td className="px-4 py-3 text-text-secondary font-mono text-xs bg-gray-50 dark:bg-gray-800/50">
                              #{sku.skuId}
                            </td>
                            <td className="px-4 py-3 text-text-secondary font-mono text-xs bg-gray-50 dark:bg-gray-800/50">
                              {sku.skuCode}
                            </td>
                            <td className="px-4 py-3 font-medium text-text-main dark:text-white bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex flex-col gap-1">
                                {Object.entries(sku.options || {}).map(([key, value]) => (
                                  <span key={key} className="text-xs text-text-secondary">
                                    {key}: <span className="text-text-main dark:text-gray-200">{value}</span>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={sku.price || 0}
                                onChange={(e) => handleSkuPriceChange(index, Number(e.target.value))}
                                className="w-full rounded border border-[#e0e8e5] dark:border-gray-600 px-2 py-1.5 text-right text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                min="0"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={sku.stockQuantity || 0}
                                onChange={(e) => handleSkuStockChange(index, Number(e.target.value))}
                                className={`w-full rounded border px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-1 ${
                                  (sku.stockQuantity || 0) === 0
                                    ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-500 focus:ring-red-500 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                                    : 'border-[#e0e8e5] dark:border-gray-600 text-text-main focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white'
                                }`}
                                min="0"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center">
                                <label className="relative inline-flex cursor-pointer items-center">
                                  <input
                                    type="checkbox"
                                    checked={(sku.stockQuantity || 0) > 0}
                                    readOnly
                                    className="peer sr-only"
                                  />
                                  <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-gray-600"></div>
                                </label>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 이미지 업로드 */}
              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border border-[#e0e8e5] dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm">
                  <h3 className="mb-5 text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">image</span>
                    상품 이미지
                  </h3>
                  
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden group border border-[#e0e8e5] dark:border-gray-600">
                        <img
                          src={imagePreview}
                          alt="상품 이미지"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-3 text-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-primary">cloud_upload</span>
                        <span className="text-sm font-medium text-text-main dark:text-white">이미지 변경</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-8 text-center transition-colors hover:border-primary hover:bg-primary/10 cursor-pointer">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary-dark group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">cloud_upload</span>
                      </div>
                      <p className="text-sm font-medium text-text-main dark:text-white">클릭하여 이미지 업로드</p>
                      <p className="mt-1 text-xs text-text-secondary">또는 이미지를 여기로 드래그하세요</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="sticky bottom-6 z-20 mt-8 rounded-2xl border border-[#e0e8e5] dark:border-gray-700 bg-surface-light dark:bg-surface-dark p-4 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={updateProductMutation.isPending || uploadImageMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-text-main shadow-sm shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  수정 완료
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e0e8e5] dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3.5 text-sm font-bold text-text-secondary transition-colors hover:bg-gray-50 hover:text-text-main dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  취소
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative z-10 mx-4 max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-700 p-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-text-main dark:text-white">상품 삭제 확인</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              정말로 이 상품을 삭제하시겠습니까?<br />
              삭제된 상품은 검색/목록에서 제외되며, 장바구니에 담긴 상품은 삭제할 수 없습니다.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteProductMutation.isPending}
                className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {deleteProductMutation.isPending ? '삭제 중...' : '삭제'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-gray-100 dark:bg-gray-800 text-text-main dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

