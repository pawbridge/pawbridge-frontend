import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductById, addToCart } from '../api/products.api';
import type { ProductSku } from '../types/api.types';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import placeholderImg from '../assets/image-placeholder.svg';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [mainImage, setMainImage] = useState<string>('');

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(Number(id)),
    enabled: !!id,
  });

  // SKU가 로드되면 첫 번째 SKU 자동 선택
  useEffect(() => {
    if (product?.skus && product.skus.length > 0 && !selectedSku) {
      const firstSku = product.skus[0];
      setSelectedSku(firstSku);
      setSelectedOptions(firstSku.options);
      setMainImage(product.imageUrl);
    }
  }, [product]);

  const addToCartMutation = useMutation({
    mutationFn: () => addToCart({ skuId: selectedSku!.skuId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const goToCart = window.confirm('장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?');
      if (goToCart) {
        navigate('/cart');
      }
    },
    onError: () => {
      alert('장바구니 추가에 실패했습니다. 로그인이 필요합니다.');
    },
  });

  // 옵션 그룹 추출
  const getOptionGroups = () => {
    if (!product?.skus || product.skus.length === 0) return {};
    
    const groups: Record<string, Set<string>> = {};
    product.skus.forEach(sku => {
      Object.entries(sku.options).forEach(([key, value]) => {
        if (!groups[key]) groups[key] = new Set();
        groups[key].add(value);
      });
    });
    
    return Object.fromEntries(
      Object.entries(groups).map(([key, values]) => [key, Array.from(values)])
    );
  };

  // 옵션 선택 핸들러
  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);
    
    // 해당 옵션 조합에 맞는 SKU 찾기
    const matchingSku = product?.skus?.find(sku => 
      Object.entries(newOptions).every(([key, val]) => sku.options[key] === val)
    );
    
    if (matchingSku) {
      setSelectedSku(matchingSku);
    }
  };

  // 수량 변경
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (selectedSku?.stockQuantity || 99)) {
      setQuantity(newQuantity);
    }
  };

  // 장바구니 담기
  const handleAddToCart = () => {
    if (!selectedSku) {
      alert('옵션을 선택해주세요.');
      return;
    }
    if (selectedSku.stockQuantity <= 0) {
      alert('품절된 상품입니다.');
      return;
    }
    addToCartMutation.mutate();
  };

  // 바로 구매 - 장바구니 생략하고 바로 주문서로 이동
  const handleBuyNow = () => {
    if (!selectedSku) {
      alert('옵션을 선택해주세요.');
      return;
    }
    if (selectedSku.stockQuantity <= 0) {
      alert('품절된 상품입니다.');
      return;
    }
    // Checkout 페이지로 직접 이동 (바로 구매 모드)
    navigate('/checkout', {
      state: {
        directOrder: {
          skuId: selectedSku.skuId,
          quantity,
          product: {
            productId: product?.productId,
            name: product?.name,
            imageUrl: product?.imageUrl,
            skuCode: selectedSku.skuCode,
            price: selectedSku.price,
            options: selectedSku.options,
          },
        },
      },
    });
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 선택된 옵션 문자열
  const getSelectedOptionText = () => {
    return Object.entries(selectedOptions).map(([_key, value]) => `${value}`).join(' / ');
  };

  const optionGroups = getOptionGroups();

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">상품 정보를 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
            <p className="text-gray-500 mb-4">상품을 찾을 수 없습니다.</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              상품 목록으로
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isBlockedPlaceholder = (url?: string) => {
    if (!url) return true;
    try {
      const hostname = new URL(url).hostname;
      return hostname.includes('placeholder.com');
    } catch {
      return true;
    }
  };

  const resolvedMainImage = !isBlockedPlaceholder(mainImage || product.imageUrl)
    ? (mainImage || product.imageUrl)
    : placeholderImg;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header />
      
      <main className="flex-1 px-4 sm:px-10 lg:px-20 py-5">
        <div className="max-w-6xl mx-auto">
          {/* 상품 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mt-6">
            {/* 이미지 갤러리 */}
            <div className="flex flex-col gap-4">
              <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                {resolvedMainImage ? (
                  <img
                    src={resolvedMainImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = placeholderImg;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-gray-400">image</span>
                  </div>
                )}
              </div>
            </div>

            {/* 상품 정보 */}
            <div className="flex flex-col">
              <h1 className="text-text-light dark:text-text-dark tracking-tight text-3xl font-bold leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal pt-3">
                {product.description}
              </p>

              {/* 옵션 선택 */}
              <div className="mt-6 space-y-4">
                {Object.entries(optionGroups).map(([optionName, values]) => (
                  <div key={optionName}>
                    <label className="block text-sm font-bold mb-3">{optionName}</label>
                    <div className="flex flex-wrap gap-2">
                      {values.map((value) => {
                        // 해당 옵션의 재고 확인
                        const skuWithOption = product.skus?.find(
                          sku => sku.options[optionName] === value
                        );
                        const isOutOfStock = skuWithOption?.stockQuantity === 0;
                        const isSelected = selectedOptions[optionName] === value;
                        
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => !isOutOfStock && handleOptionChange(optionName, value)}
                            disabled={isOutOfStock}
                            className={`
                              px-4 py-2 rounded-full text-sm font-medium transition-all
                              ${isSelected 
                                ? 'bg-primary text-white ring-2 ring-primary ring-offset-2' 
                                : 'bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                              }
                              ${isOutOfStock 
                                ? 'opacity-40 cursor-not-allowed line-through' 
                                : 'cursor-pointer'
                              }
                            `}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 선택된 옵션 및 수량 */}
              {selectedSku && (
                <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getSelectedOptionText()}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        재고 {selectedSku.stockQuantity}개
                      </p>
                    </div>
                    <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg">
                      <button
                        className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-md"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        className="w-12 text-center border-0 bg-transparent focus:ring-0 p-0"
                        value={quantity}
                        readOnly
                      />
                      <button
                        className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-md"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= selectedSku.stockQuantity}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 dark:border-gray-700 my-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium">총 상품 금액</span>
                    <span className="text-2xl font-bold text-primary">
                      ₩{formatPrice(selectedSku.price * quantity)}
                    </span>
                  </div>
                </div>
              )}

              {/* 버튼 */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark gap-2 text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={!selectedSku || selectedSku.stockQuantity <= 0 || addToCartMutation.isPending}
                >
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                  <span>장바구니 담기</span>
                </button>
                <button
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-primary text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleBuyNow}
                  disabled={!selectedSku || selectedSku.stockQuantity <= 0}
                >
                  바로 구매
                </button>
              </div>
            </div>
          </div>

          {/* 상품 상세 정보 탭 */}
          <div className="w-full mt-16 border-t border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex gap-6">
                <span className="shrink-0 border-b-2 border-primary px-1 py-4 text-sm font-medium text-primary cursor-pointer">
                  상세 정보
                </span>
                <span className="shrink-0 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 cursor-pointer">
                  리뷰
                </span>
                <span className="shrink-0 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 cursor-pointer">
                  배송/교환 정보
                </span>
              </nav>
            </div>
            <div className="py-10">
              <div className="space-y-8">
                <h3 className="text-xl font-bold">상품 상세 정보</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {product.description}
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

