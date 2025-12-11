import { Link } from 'react-router-dom';
import type { ProductListItem } from '../../types/api.types';

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
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && onAddToCart) {
      onAddToCart(product.skuId);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm hover:shadow-lg transition-shadow duration-300"
    >
      {/* 이미지 */}
      <div className="relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-56 w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="h-56 w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-gray-400">image</span>
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
          {product.name}
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
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`ml-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary/20 text-primary hover:bg-primary hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
          </button>
        </div>
      </div>
    </Link>
  );
}


