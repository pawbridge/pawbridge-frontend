import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getProductById, getProducts, updateProduct, deleteProduct, getCategories, uploadImage } from '../api/products.api';
import type { Product, UpdateProductRequest, UpdateSku, CategoryResponse, ProductStatus } from '../types/api.types';
import AdminLayout from '../components/layout/AdminLayout';
import AdminProductImage from '../components/admin/AdminProductImage';
import AdminDeleteDialog from '../components/admin/AdminDeleteDialog';
import { AdminError, AdminLoading, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import { adminProductLabels } from '../lib/adminMarket';

export default function ProductEdit() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notice, setNotice] = useState('');
  const valid = Number.isSafeInteger(Number(productId)) && Number(productId) > 0;

  // 상품 정보 조회
  const { data: product, isLoading: isLoadingProduct, error: productError, refetch } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => getProductById(Number(productId)),
    enabled: valid,
  });

  // 카테고리 목록 조회
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<CategoryResponse[]>({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  // 폼 상태
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('ACTIVE');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [skus, setSkus] = useState<Array<UpdateSku & { skuId: number; skuCode: string; options: Record<string, string> }>>([]);

  // 상품 정보 로드 시 폼 초기화
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setStatus(product.status);
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
          options: sku.options || {},
        })));
      }
    }
  }, [product]);

  // 이미지 파일 선택
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setNotice('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setNotice('지원하는 이미지 형식은 JPEG, PNG, GIF, WEBP입니다.');
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
      setNotice('상품이 성공적으로 수정되었습니다.');
      navigate('/admin/products');
    },
    onError: () => {
      setNotice('상품 수정에 실패했습니다. 입력 내용을 확인해 주세요.');
    },
  });

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadImageMutation.isPending || updateProductMutation.isPending) return;
    setNotice('');

    if (!name.trim()) {
      setNotice('상품명을 입력해주세요.');
      return;
    }

    if (!categoryId) {
      setNotice('카테고리를 선택해주세요.');
      return;
    }

    if (skus.some(sku => !Number.isFinite(sku.price) || (sku.price ?? 0) <= 0 || !Number.isInteger(sku.stockQuantity) || (sku.stockQuantity ?? -1) < 0)) { setNotice('가격은 양수, 재고는 0 이상의 정수로 입력해 주세요.'); return; }
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
    } catch {
      setNotice('상품 수정 또는 이미지 업로드에 실패했습니다. 입력 내용은 유지됩니다.');
    }
  };


  const busy = uploadImageMutation.isPending || updateProductMutation.isPending;
  return <AdminLayout title="상품 수정" description="현재 상품의 기본 정보와 SKU별 가격·재고를 수정합니다.">
    {!valid ? <AdminError title="올바르지 않은 상품 번호입니다." /> : isLoadingProduct ? <AdminLoading /> : productError || !product ? <AdminError title="상품 조회 실패" retry={() => void refetch()} /> : categoriesError ? <AdminError title="카테고리 조회 실패" /> : categoriesLoading ? <AdminLoading /> : <form onSubmit={handleSubmit}>
      <fieldset disabled={busy || showDeleteModal} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">상품 기본 정보</h2>
            <label className="block text-sm font-medium">상품명 (필수)<input className={adminInput} value={name} onChange={e => setName(e.target.value)} /></label>
            <label className="block text-sm font-medium">판매 상태<select className={adminInput} value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>{Object.entries(adminProductLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-sm font-medium">카테고리 (필수)<select className={adminInput} value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}><option value="">카테고리 선택</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="block text-sm font-medium">상품 설명<textarea className={`${adminInput} min-h-40 resize-y`} value={description} onChange={e => setDescription(e.target.value)} /></label>
          </section>
          <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">SKU 가격과 재고</h2>
            {skus.map((sku, index) => <section className="min-w-0 space-y-3 rounded-xl bg-stone-50 p-4 dark:bg-stone-800" key={sku.skuId}>
              <h3 className="break-words text-sm font-bold">{sku.skuCode}</h3><p className="break-words text-xs text-brand-muted">{Object.entries(sku.options).map(([key, value]) => key + ': ' + value).join(' · ') || '옵션 없음'}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">가격 {index + 1} (원)<input type="number" min="1" className={adminInput} value={sku.price ?? 0} onChange={e => handleSkuPriceChange(index, Number(e.target.value))} /></label>
                <label className="block text-sm font-medium">재고 {index + 1} (개)<input type="number" min="0" className={adminInput} value={sku.stockQuantity ?? 0} onChange={e => handleSkuStockChange(index, Number(e.target.value))} /></label>
              </div>
            </section>)}
          </section>
        </div>
        <section className={`${adminPanel} space-y-4 xl:sticky xl:top-6`}><h2 className="text-xl font-bold">대표 이미지</h2>
          <AdminProductImage preview={imagePreview} onChange={handleImageChange} onRemove={handleRemoveImage} />
          {notice && <p role="alert" className="text-sm text-red-700">{notice}</p>}
          <div className="flex flex-wrap gap-2"><button type="submit" className={adminPrimary}>{busy ? '저장 중…' : '변경 저장'}</button><button type="button" className={adminControl} onClick={() => navigate('/admin/products')}>취소</button><button type="button" className={`${adminControl} text-red-700`} onClick={() => setShowDeleteModal(true)}>상품 삭제</button></div>
        </section>
      </fieldset>
    </form>}
    {showDeleteModal && product && <AdminDeleteDialog name={product.name} run={() => deleteProduct(Number(productId))} refresh={async () => { await getProducts({ page: 0, size: 20 }); navigate('/admin/products'); }} onClose={() => setShowDeleteModal(false)} />}
  </AdminLayout>;
}

