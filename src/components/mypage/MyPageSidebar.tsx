import type { UserInfoResponse } from '../../types/user.types';
import LogoutIcon from '../../assets/icons/material-symbols/logout.svg?react';
import FavoriteIcon from '../../assets/icons/material-symbols/favorite.svg?react';
import FavoriteFillIcon from '../../assets/icons/material-symbols/favorite-fill.svg?react';
import HomeIcon from '../../assets/icons/material-symbols/home.svg?react';
import HomeFillIcon from '../../assets/icons/material-symbols/home-fill.svg?react';
import PersonIcon from '../../assets/icons/material-symbols/person.svg?react';
import PersonFillIcon from '../../assets/icons/material-symbols/person-fill.svg?react';
import PetsIcon from '../../assets/icons/material-symbols/pets.svg?react';
import PetsFillIcon from '../../assets/icons/material-symbols/pets-fill.svg?react';
import ReceiptLongIcon from '../../assets/icons/material-symbols/receipt_long.svg?react';
import ReceiptLongFillIcon from '../../assets/icons/material-symbols/receipt_long-fill.svg?react';
import ShoppingCartIcon from '../../assets/icons/material-symbols/shopping_cart.svg?react';
import ShoppingCartFillIcon from '../../assets/icons/material-symbols/shopping_cart-fill.svg?react';

export type MyPageTab = 'shelter' | 'profile' | 'favoriteAnimals' | 'registeredAnimals' | 'wishlist' | 'cart' | 'orders';

interface MyPageSidebarProps {
  userInfo: Pick<UserInfoResponse, 'name' | 'email' | 'role' | 'provider'>;
  activeTab: MyPageTab;
  showPetMarket: boolean;
  showShelterApplication: boolean;
  onTabChange: (tab: MyPageTab) => void;
  onLogout: () => void;
}

export default function MyPageSidebar({
  userInfo,
  activeTab,
  showPetMarket,
  showShelterApplication,
  onTabChange,
  onLogout,
}: MyPageSidebarProps) {
  return (
    <aside className="md:w-1/4 lg:w-1/5">
      <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-800/20 rounded-xl shadow-sm sticky top-24">
        {/* 프로필 정보 */}
        <div className="flex gap-4 items-center pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="size-12 rounded-full bg-brand/20 flex items-center justify-center text-brand-accent font-bold text-xl">
            {userInfo.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <p className="text-text-main dark:text-gray-100 text-base font-bold leading-normal">
              {userInfo.name}
            </p>
            <p className="text-brand-accent dark:text-brand text-sm font-normal leading-normal">
              {userInfo.email}
            </p>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="flex flex-col gap-1">
          {showShelterApplication && (
            <button
              onClick={() => onTabChange('shelter')}
              className={`min-h-11 rounded-lg px-3 py-3 text-left text-sm ${
                activeTab === 'shelter'
                  ? 'bg-gray-100 font-semibold dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              보호소 담당자 신청
            </button>
          )}
          <button
            onClick={() => onTabChange('profile')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-brand/20 dark:bg-brand/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            {activeTab === 'profile' ? (
              <PersonFillIcon aria-hidden="true" className="icon text-text-main dark:text-gray-100" />
            ) : (
              <PersonIcon aria-hidden="true" className="icon text-gray-500 dark:text-gray-400" />
            )}
            <p
              className={`text-sm ${
                activeTab === 'profile'
                  ? 'text-text-main dark:text-gray-100 font-bold'
                  : 'text-gray-500 dark:text-gray-400 font-medium'
              }`}
            >
              프로필 정보
            </p>
          </button>

          <button
            onClick={() => onTabChange('favoriteAnimals')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'favoriteAnimals'
                ? 'bg-brand/20 dark:bg-brand/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            {activeTab === 'favoriteAnimals' ? (
              <PetsFillIcon aria-hidden="true" className="icon text-text-main dark:text-gray-100" />
            ) : (
              <PetsIcon aria-hidden="true" className="icon text-gray-500 dark:text-gray-400" />
            )}
            <p
              className={`text-sm ${
                activeTab === 'favoriteAnimals'
                  ? 'text-text-main dark:text-gray-100 font-bold'
                  : 'text-gray-500 dark:text-gray-400 font-medium'
              }`}
            >
              관심 동물
            </p>
          </button>

          {userInfo.role === 'ROLE_SHELTER' && (
            <button
              onClick={() => onTabChange('registeredAnimals')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeTab === 'registeredAnimals'
                  ? 'bg-brand/20 dark:bg-brand/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              {activeTab === 'registeredAnimals' ? (
                <HomeFillIcon aria-hidden="true" className="icon text-text-main dark:text-gray-100" />
              ) : (
                <HomeIcon aria-hidden="true" className="icon text-gray-500 dark:text-gray-400" />
              )}
              <p
                className={`text-sm ${
                  activeTab === 'registeredAnimals'
                    ? 'text-text-main dark:text-gray-100 font-bold'
                    : 'text-gray-500 dark:text-gray-400 font-medium'
                }`}
              >
                내 보호소가 등록한 동물
              </p>
            </button>
          )}

          {showPetMarket && <>
          <button
            onClick={() => onTabChange('wishlist')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'wishlist'
                ? 'bg-brand/20 dark:bg-brand/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            {activeTab === 'wishlist' ? (
              <FavoriteFillIcon aria-hidden="true" className="icon text-text-main dark:text-gray-100" />
            ) : (
              <FavoriteIcon aria-hidden="true" className="icon text-gray-500 dark:text-gray-400" />
            )}
            <p
              className={`text-sm ${
                activeTab === 'wishlist'
                  ? 'text-text-main dark:text-gray-100 font-bold'
                  : 'text-gray-500 dark:text-gray-400 font-medium'
              }`}
            >
              나의 위시리스트
            </p>
          </button>

          <button
            onClick={() => onTabChange('cart')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'cart'
                ? 'bg-brand/20 dark:bg-brand/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            {activeTab === 'cart' ? (
              <ShoppingCartFillIcon aria-hidden="true" className="icon text-text-main dark:text-gray-100" />
            ) : (
              <ShoppingCartIcon aria-hidden="true" className="icon text-gray-500 dark:text-gray-400" />
            )}
            <p
              className={`text-sm ${
                activeTab === 'cart'
                  ? 'text-text-main dark:text-gray-100 font-bold'
                  : 'text-gray-500 dark:text-gray-400 font-medium'
              }`}
            >
              나의 장바구니
            </p>
          </button>

          <button
            onClick={() => onTabChange('orders')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'orders'
                ? 'bg-brand/20 dark:bg-brand/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            {activeTab === 'orders' ? (
              <ReceiptLongFillIcon aria-hidden="true" className="icon text-text-main dark:text-gray-100" />
            ) : (
              <ReceiptLongIcon aria-hidden="true" className="icon text-gray-500 dark:text-gray-400" />
            )}
            <p
              className={`text-sm ${
                activeTab === 'orders'
                  ? 'text-text-main dark:text-gray-100 font-bold'
                  : 'text-gray-500 dark:text-gray-400 font-medium'
              }`}
            >
              나의 주문 목록
            </p>
          </button>
          </>}

        </nav>

        {/* 로그아웃 */}
        <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
          >
            <LogoutIcon aria-hidden="true" className="icon text-red-500" />
            <p className="text-red-500 text-sm font-medium leading-normal">로그아웃</p>
          </button>
        </div>
      </div>
    </aside>
  );
}
