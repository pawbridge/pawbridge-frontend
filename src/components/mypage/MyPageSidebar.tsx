import type { UserInfoResponse } from '../../types/api.types';

export type MyPageTab = 'shelter' | 'profile' | 'password' | 'favoriteAnimals' | 'registeredAnimals' | 'wishlist' | 'cart' | 'orders';

interface MyPageSidebarProps {
  userInfo: Pick<UserInfoResponse, 'name' | 'email' | 'role'>;
  activeTab: MyPageTab;
  showPetMarket: boolean;
  onTabChange: (tab: MyPageTab) => void;
  onLogout: () => void;
}

export default function MyPageSidebar({
  userInfo,
  activeTab,
  showPetMarket,
  onTabChange,
  onLogout,
}: MyPageSidebarProps) {
  return (
    <aside className="md:w-1/4 lg:w-1/5">
      <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-800/20 rounded-xl shadow-sm sticky top-24">
        {/* 프로필 정보 */}
        <div className="flex gap-4 items-center pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
            {userInfo.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-main dark:text-gray-100 text-base font-bold leading-normal">
              {userInfo.name}
            </h1>
            <p className="text-primary dark:text-green-300 text-sm font-normal leading-normal">
              {userInfo.email}
            </p>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="flex flex-col gap-1">
          <button onClick={() => onTabChange('shelter')} className={`min-h-11 rounded-lg px-3 py-3 text-left text-sm ${activeTab === 'shelter' ? 'bg-gray-100 font-semibold dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>보호소 담당자 신청</button>
          <button
            onClick={() => onTabChange('profile')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary/20 dark:bg-primary/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'profile' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
              style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
            >
              person
            </span>
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
                ? 'bg-primary/20 dark:bg-primary/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'favoriteAnimals' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
              style={{ fontVariationSettings: activeTab === 'favoriteAnimals' ? "'FILL' 1" : "'FILL' 0" }}
            >
              pets
            </span>
            <p
              className={`text-sm ${
                activeTab === 'favoriteAnimals'
                  ? 'text-text-main dark:text-gray-100 font-bold'
                  : 'text-gray-500 dark:text-gray-400 font-medium'
              }`}
            >
              내가 찜한 동물
            </p>
          </button>

          {userInfo.role === 'ROLE_SHELTER' && (
            <button
              onClick={() => onTabChange('registeredAnimals')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeTab === 'registeredAnimals'
                  ? 'bg-primary/20 dark:bg-primary/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              <span
                className={`material-symbols-outlined ${
                  activeTab === 'registeredAnimals' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                }`}
                style={{ fontVariationSettings: activeTab === 'registeredAnimals' ? "'FILL' 1" : "'FILL' 0" }}
              >
                home
              </span>
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
                ? 'bg-primary/20 dark:bg-primary/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'wishlist' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
              style={{ fontVariationSettings: activeTab === 'wishlist' ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
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
                ? 'bg-primary/20 dark:bg-primary/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'cart' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
              style={{ fontVariationSettings: activeTab === 'cart' ? "'FILL' 1" : "'FILL' 0" }}
            >
              shopping_cart
            </span>
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
                ? 'bg-primary/20 dark:bg-primary/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'orders' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
              style={{ fontVariationSettings: activeTab === 'orders' ? "'FILL' 1" : "'FILL' 0" }}
            >
              receipt_long
            </span>
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

          <button
            onClick={() => onTabChange('password')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'password'
                ? 'bg-primary/20 dark:bg-primary/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'password' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              lock_reset
            </span>
            <p
              className={`text-sm ${
                activeTab === 'password'
                  ? 'text-text-main dark:text-gray-100 font-bold'
                  : 'text-gray-500 dark:text-gray-400 font-medium'
              }`}
            >
              비밀번호 변경
            </p>
          </button>
        </nav>

        {/* 로그아웃 */}
        <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
          >
            <span className="material-symbols-outlined text-red-500">logout</span>
            <p className="text-red-500 text-sm font-medium leading-normal">로그아웃</p>
          </button>
        </div>
      </div>
    </aside>
  );
}
