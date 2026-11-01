import { Link } from 'react-router-dom';
import type { ProductListItem } from '../../types/api.types';
import placeholderImg from '../../assets/image-placeholder.svg';

interface ProductCardProps {
  product: ProductListItem;
  onAddToCart?: (skuId: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 재고 상태
  const isOutOfStock = product.totalStock <= 0;

  // 장바구니 추가 핸들러
  const handleAddToCart = () => {
    if (!isOutOfStock && onAddToCart) {
      onAddToCart(product.skuId);
    }
  };

  const isBlockedPlaceholder = (url?: string) => {
    if (!url) return true;
    try {
      const hostname = new URL(url).hostname;
      return hostname.includes('placeholder.com');
    } catch {
      return true;
    }
  };

  const resolvedImage = !isBlockedPlaceholder(product.imageUrl)
    ? product.imageUrl
    : placeholderImg;

  // 카드 어디를 눌러도 상세로 가지만, 실제 링크는 상품 이름 하나다(링크의 after가 카드 전체를 덮는다).
  // 링크 안에 버튼을 넣으면 화면 읽기 프로그램이 둘을 구분하지 못하므로, 장바구니 버튼은 링크 밖에 두고 덮개 위로 올린다.
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm hover:shadow-lg transition-shadow duration-300 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand-focus">
      {/* 이미지 */}
      <div className="relative">
        {resolvedImage ? (
          <img
            src={resolvedImage}
            alt=""
            className="h-56 w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = placeholderImg;
            }}
          />
        ) : (
          <div className="h-56 w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <span aria-hidden="true" className="material-symbols-outlined text-4xl text-gray-400">image</span>
          </div>
        )}
        
        {/* 품절 표시 */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">품절</span>
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="flex flex-col p-4 flex-grow">
        <h4 className="text-base font-bold text-text-accent-light dark:text-text-accent-dark mb-1 line-clamp-1">
          <Link to={`/products/${product.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h4>
        {product.optionName && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
            {product.optionName}
          </p>
        )}
        
        <div className="flex items-center mt-auto">
          <p className="text-lg font-bold text-text-light dark:text-text-dark">
            ₩{formatPrice(product.price)}
          </p>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={`${product.name} 장바구니에 담기`}
            className={`relative z-10 ml-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-brand/20 text-brand-accent hover:bg-brand hover:text-brand-ink'
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">add_shopping_cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}


