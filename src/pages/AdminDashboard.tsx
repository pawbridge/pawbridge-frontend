import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: {
    value: string;
    label: string;
    isPositive?: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

function StatCard({ title, value, icon, trend, iconBgColor = 'bg-primary/20', iconColor = 'text-text-main' }: StatCardProps) {
  return (
    <div className="flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-[#e5e7eb] dark:border-gray-700 relative overflow-hidden group">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-text-main dark:text-white">{value}</h3>
        </div>
        <div className={`size-10 rounded-lg ${iconBgColor} flex items-center justify-center ${iconColor}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-4 z-10">
          <span className={`material-symbols-outlined text-[18px] ${trend.isPositive !== false ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive !== false ? 'trending_up' : 'trending_down'}
          </span>
          <span className={`text-sm font-semibold ${trend.isPositive !== false ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-xs text-text-secondary ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

interface RecentActivity {
  id: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  userInitial?: string;
  activity: string;
  activityDetail: string;
  date: string;
  status: {
    label: string;
    color: string;
    bgColor: string;
    darkBgColor: string;
    darkColor: string;
  };
}

const mockActivities: RecentActivity[] = [
  {
    id: 1,
    userName: '김지영',
    userEmail: 'sarah.j@email.com',
    userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-P5u9GhkcgsdHGPbYhiQ3l8gVOWdFI_r0VjVb4gmDOhHCBpN1tqKJ0t-wC9lu3DpqhCPU6j43_bx065BMv0kiGqA3rXrik61GykalZ4apJVX7Ti1bHzFhD66nhalNRkBuSFSZvJeAquZPZ-AWjaD2BTcaZ-gd2pAfGm2pXxhMjKGXzKuaCXhrl6UeZhhvbcUtkr7uCW0zaIVYIjWq4e3Tm3TKnr5xQYbNn8KH9iW5GTbyRMIG_BI2KMwZ9aotsqhNJgV0gEqrh3c',
    activity: '입양 신청',
    activityDetail: '참조: 골든 리트리버 "맥스"',
    date: '2023. 10. 27',
    status: {
      label: '검토 대기',
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-100',
      darkBgColor: 'dark:bg-yellow-900/30',
      darkColor: 'dark:text-yellow-500',
    },
  },
  {
    id: 2,
    userName: '김민수',
    userEmail: 'mike.kim@email.com',
    userInitial: '김',
    activity: '신규 회원 가입',
    activityDetail: '이메일 인증 완료',
    date: '2023. 10. 27',
    status: {
      label: '활동 중',
      color: 'text-green-800',
      bgColor: 'bg-green-100',
      darkBgColor: 'dark:bg-green-900/30',
      darkColor: 'dark:text-green-500',
    },
  },
  {
    id: 3,
    userName: '박준형',
    userEmail: 'd.chen@email.com',
    userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9CR4le0gxawg9mL30o5KZ6H-JCfURs7go9bY4rrkreTvcXImWhuDqTOVLRPuJV-X401ks-0q1dJcRczhJOYE6BkAvCSP2U4DwGGnNJOGg_TP463cXV9tN2-iORXtjSVYNiJ66dOeSnrx1VcdotThXD-NC-42E_YS8t5a-FDIiL_l9k1-z5JFF8SvGzVqhWwnGX9A0FRVjVi3e2Yz1t4Tch_9EuBytOLeWOSXu1TkO3j_B4wxa6dXZQYNkrfjuAGKd9rOl_TuYY3Y',
    activity: '새 구조 동물 등록',
    activityDetail: '고양이 "루나" - 긴급 보호',
    date: '2023. 10. 26',
    status: {
      label: '승인됨',
      color: 'text-blue-800',
      bgColor: 'bg-blue-100',
      darkBgColor: 'dark:bg-blue-900/30',
      darkColor: 'dark:text-blue-500',
    },
  },
  {
    id: 4,
    userName: '이수진',
    userEmail: 'emily.r@email.com',
    userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC7vZovU_hlyhsTHCkA4yJCFv7ED9f3djpwzJJDkY4LmgF-DVPjqzzZSpxTVKCklwBEhJ_eIh2gfp0__4QUXOar7YbowO9Nku8NM51jlpOIP8jSWejU8QYSlM23RctYJ0KS1rP-043NRkTkhFhJz7lteDeTAdEHlkHxtwTsjSqs9gKL2y_fbshPCt_SjsV4yMYN__5ttS4N8CEMuhZufzsdbAjNQzBC_HO7DIT-XwDYBsIvyP2UW7SmioW_qPUhUjYKph-OTMri0Q',
    activity: '프로필 정보 수정',
    activityDetail: '주소 정보 변경',
    date: '2023. 10. 26',
    status: {
      label: '완료됨',
      color: 'text-gray-800',
      bgColor: 'bg-gray-100',
      darkBgColor: 'dark:bg-gray-700',
      darkColor: 'dark:text-gray-300',
    },
  },
  {
    id: 5,
    userName: '정우성',
    userEmail: 'alex.j@email.com',
    userInitial: '정',
    activity: '입양 신청',
    activityDetail: '참조: 비글 "로키"',
    date: '2023. 10. 25',
    status: {
      label: '거절됨',
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      darkBgColor: 'dark:bg-red-900/30',
      darkColor: 'dark:text-red-500',
    },
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isOptionMenuOpen, setIsOptionMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
      {/* 사이드바 */}
      <aside className="w-64 h-full flex flex-col bg-surface-light dark:bg-surface-dark border-r border-[#e5e7eb] dark:border-gray-700 flex-shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-text-main">
            <span className="material-symbols-outlined text-[24px]">pets</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-main dark:text-white text-lg font-bold leading-tight">PawBridge</h1>
            <p className="text-text-secondary text-xs font-medium">관리자 콘솔</p>
          </div>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/20 text-text-main dark:text-white group transition-colors"
          >
            <span className="material-symbols-outlined text-text-main dark:text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              dashboard
            </span>
            <span className="text-sm font-semibold">대시보드</span>
          </Link>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors group">
            <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
              bar_chart
            </span>
            <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">통계</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors group">
            <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
              group
            </span>
            <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">회원 관리</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors group">
            <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
              description
            </span>
            <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">게시글 관리</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors group">
            <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
              category
            </span>
            <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">카테고리 관리</span>
          </button>
          <div className="mt-2">
            <button
              onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
                  inventory_2
                </span>
                <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">상품 관리</span>
              </div>
              <span className={`material-symbols-outlined text-sm transition-transform ${isProductMenuOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {isProductMenuOpen && (
              <div className="flex flex-col mt-1 gap-1">
                <button className="pl-11 flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors text-sm">
                  상품 목록
                </button>
                <Link
                  to="/products/new"
                  className="pl-11 flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors text-sm"
                  onClick={() => setIsProductMenuOpen(false)}
                >
                  상품 등록
                </Link>
              </div>
            )}
          </div>
          <div className="mt-2 mb-4">
            <button
              onClick={() => setIsOptionMenuOpen(!isOptionMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
                  tune
                </span>
                <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">옵션 관리</span>
              </div>
              <span className={`material-symbols-outlined text-sm transition-transform ${isOptionMenuOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {isOptionMenuOpen && (
              <div className="flex flex-col mt-1 gap-1">
                <button className="pl-11 flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors text-sm">
                  옵션 그룹 관리
                </button>
                <button className="pl-11 flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors text-sm">
                  옵션 값 관리
                </button>
              </div>
            )}
          </div>
        </nav>
        <div className="p-4 border-t border-[#e5e7eb] dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary-dark transition-colors text-text-main font-bold text-sm tracking-wide shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* 헤더 */}
        <header className="flex-none h-16 bg-surface-light dark:bg-surface-dark border-b border-[#e5e7eb] dark:border-gray-700 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-main dark:text-white">대시보드</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center w-64 h-10 rounded-lg bg-background-light dark:bg-gray-800 px-3 border border-transparent focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-text-secondary">search</span>
              <input
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-text-main dark:text-white placeholder:text-text-secondary focus:ring-0"
                placeholder="검색..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-text-main dark:text-white transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
              </button>
              <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div
                  className="size-8 rounded-full bg-cover bg-center border border-gray-200 bg-primary/20 flex items-center justify-center"
                >
                  <div className="w-full h-full flex items-center justify-center text-text-main font-bold text-xs">
                    {user?.name?.charAt(0) || '관'}
                  </div>
                </div>
                <span className="text-sm font-semibold text-text-main dark:text-white hidden lg:block">
                  {user?.name || '관리자'}님
                </span>
                <span className="material-symbols-outlined text-text-secondary text-[18px] hidden lg:block">expand_more</span>
              </button>
            </div>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard
                title="전체 회원 수"
                value="1,234명"
                icon="group"
                trend={{ value: '+5%', label: '지난달 대비' }}
              />
              <StatCard
                title="오늘 가입자 수"
                value="25명"
                icon="person_add"
                iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
                trend={{ value: '+12%', label: '어제 대비' }}
              />
              <StatCard
                title="오늘 등록된 동물 수"
                value="10마리"
                icon="pets"
                iconBgColor="bg-orange-100 dark:bg-orange-900/30"
                iconColor="text-orange-600 dark:text-orange-400"
              />
              <StatCard
                title="오늘 작성된 게시글 수"
                value="50개"
                icon="post_add"
                iconBgColor="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600 dark:text-purple-400"
                trend={{ value: '+8%', label: '참여도 상승' }}
              />
            </div>

            {/* 최근 활동 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main dark:text-white">최근 활동</h3>
                <button className="text-sm font-semibold text-primary-dark hover:text-primary transition-colors flex items-center gap-1">
                  전체 보기
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
              <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#e5e7eb] dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background-light dark:bg-gray-800/50 border-b border-[#e5e7eb] dark:border-gray-700">
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary w-1/4">
                          사용자
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary w-1/3">
                          활동 내용
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">날짜</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary text-right">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb] dark:divide-gray-700">
                      {mockActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {activity.userAvatar ? (
                                <div
                                  className="size-9 rounded-full bg-cover bg-center bg-gray-200"
                                  style={{ backgroundImage: `url(${activity.userAvatar})` }}
                                />
                              ) : (
                                <div
                                  className={`size-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                    activity.userInitial === '김'
                                      ? 'bg-primary/20 text-text-main'
                                      : activity.userInitial === '정'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-primary/20 text-text-main'
                                  }`}
                                >
                                  {activity.userInitial || activity.userName.charAt(0)}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-text-main dark:text-white">
                                  {activity.userName}
                                </span>
                                <span className="text-xs text-text-secondary">{activity.userEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-text-main dark:text-white">{activity.activity}</span>
                              <span className="text-xs text-text-secondary">{activity.activityDetail}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-text-secondary">{activity.date}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.status.bgColor} ${activity.status.color} ${activity.status.darkBgColor} ${activity.status.darkColor}`}
                            >
                              {activity.status.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

