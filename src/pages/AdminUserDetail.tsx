import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getAdminUserById, updateUser } from '../api/user.api';
import { useAuthStore } from '../store/authStore';
import AdminSidebar from '../components/layout/AdminSidebar';
import type { UpdateUserRequest } from '../types/api.types';

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserRequest>({
    nickname: '',
    role: 'ROLE_USER',
    careRegNo: '',
  });

  // 회원 상세 정보 조회
  const { data: userDetail, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => getAdminUserById(Number(userId)),
    enabled: !!userId,
  });

  // 회원 정보 수정 mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => updateUser(Number(userId), data),
    onSuccess: async () => {
      // 즉시 데이터 다시 조회
      await refetch();
      // 회원 목록 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsEditModalOpen(false);
      alert('회원 정보가 수정되었습니다.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '회원 정보 수정에 실패했습니다.');
    },
  });

  // 수정 모달 열기
  const handleEditClick = () => {
    if (userDetail) {
      setEditFormData({
        nickname: userDetail.nickname || '',
        role: userDetail.role,
        careRegNo: userDetail.careRegNo || '',
      });
      setIsEditModalOpen(true);
    }
  };

  // 수정 폼 제출
  const handleEditSubmit = () => {
    // 닉네임 유효성 검사
    if (editFormData.nickname && !/^[a-zA-Z0-9가-힣]{2,10}$/.test(editFormData.nickname)) {
      alert('닉네임은 2~10자의 한글, 영문, 숫자만 사용 가능합니다.');
      return;
    }

    // 보호소 회원인 경우 등록번호 필수
    if (editFormData.role === 'ROLE_SHELTER' && !editFormData.careRegNo) {
      alert('보호소 회원은 보호소 등록번호가 필수입니다.');
      return;
    }

    updateMutation.mutate(editFormData);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 역할 배지
  const getRoleBadge = (role: 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SHELTER') => {
    const roleMap = {
      ROLE_ADMIN: { label: '관리자', color: 'bg-purple-50 text-purple-700 border-purple-100' },
      ROLE_USER: { label: '일반회원', color: 'bg-gray-50 text-gray-700 border-gray-100' },
      ROLE_SHELTER: { label: '보호소회원', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    };
    return roleMap[role] || roleMap.ROLE_USER;
  };

  if (isLoading) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-sub dark:text-gray-400">회원 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">회원 정보를 불러오는 중 오류가 발생했습니다.</p>
            <button
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 bg-primary text-text-main rounded-lg hover:bg-primary-hover transition-colors"
            >
              회원 목록으로 돌아가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  const roleBadge = getRoleBadge(userDetail.role);

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
      <AdminSidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* 헤더 */}
        <header className="h-16 flex items-center justify-between px-8 bg-surface-light dark:bg-surface-dark border-b border-[#e5e7eb] dark:border-gray-700 shrink-0 z-10">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-text-sub dark:text-gray-400 hover:text-text-main hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
            </button>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text-main dark:text-white">{user?.name || '관리자'}</p>
                <p className="text-xs text-text-sub dark:text-gray-400">Super Admin</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {/* 페이지 헤더 */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="hover:bg-gray-200 dark:hover:bg-gray-700 p-2 -ml-2 rounded-full transition-colors group"
                  >
                    <span className="material-symbols-outlined text-text-main dark:text-white group-hover:text-primary transition-colors">arrow_back</span>
                  </button>
                  <h1 className="text-text-main dark:text-white text-3xl font-black leading-tight">회원 상세 정보</h1>
                </div>
                <p className="text-text-sub dark:text-gray-400 text-base font-normal pl-10">사용자의 상세 정보를 확인하고 관리합니다.</p>
              </div>
            </div>

            {/* 회원 정보 카드 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* 프로필 헤더 */}
              <div className="p-8 flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-gray-100 dark:border-gray-800">
                <div className="relative group">
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-primary/20 to-blue-100 dark:from-primary/10 dark:to-blue-900/30 rounded-full ring-4 ring-background-light dark:ring-gray-800 shadow-md flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">{userDetail.email.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-grow">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-text-main dark:text-white text-2xl font-bold">{userDetail.name}</h2>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${roleBadge.color}`}>
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      {roleBadge.label}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-text-sub dark:text-gray-400 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      <span>{userDetail.email}</span>
                    </div>
                    <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      <span>가입일: {formatDate(userDetail.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {/* <div className="mt-4 md:mt-0 self-start md:self-center">
                  <span className="inline-flex items-center rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                    활동 중
                  </span>
                </div> */}
              </div>

              {/* 기본 정보 */}
              <div className="p-8 bg-white dark:bg-gray-900">
                <h3 className="text-text-main dark:text-white text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span>
                  기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                    <p className="text-text-sub dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">이메일</p>
                    <div className="flex justify-between items-center">
                      <p className="text-text-main dark:text-white text-base font-medium">{userDetail.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                    <p className="text-text-sub dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">이름</p>
                    <p className="text-text-main dark:text-white text-base font-medium">{userDetail.name}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                    <p className="text-text-sub dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">닉네임</p>
                    <p className="text-text-main dark:text-white text-base font-medium">{userDetail.nickname || '-'}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                    <p className="text-text-sub dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">가입 방법</p>
                    <p className="text-text-main dark:text-white text-base font-medium">{userDetail.provider || 'LOCAL'}</p>
                  </div>
                  {userDetail.careRegNo && (
                    <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-50 bg-blue-50/30 dark:bg-blue-900/20 rounded-lg p-2 transition-colors md:col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-[18px]">verified_user</span>
                        <p className="text-blue-800 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">보호소 등록번호</p>
                      </div>
                      <p className="text-text-main dark:text-white text-base font-bold font-mono tracking-wide mt-1">{userDetail.careRegNo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end items-center gap-3">
                <button
                  onClick={() => navigate('/admin/users')}
                  className="w-full sm:w-auto flex items-center justify-center rounded-lg h-11 px-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-text-main dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                >
                  <span>목록으로</span>
                </button>
                <button
                  onClick={handleEditClick}
                  className="w-full sm:w-auto flex items-center justify-center rounded-lg h-11 px-8 bg-primary text-[#111816] text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined mr-2 text-[20px]">edit</span>
                  <span>정보 수정</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 회원 정보 수정 모달 */}
        {isEditModalOpen && userDetail && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">회원 정보 수정</h2>

              {/* 이메일 (수정 불가) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-sub dark:text-gray-400 mb-2">이메일</label>
                <input
                  type="text"
                  value={userDetail.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              {/* 이름 (수정 불가) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-sub dark:text-gray-400 mb-2">이름</label>
                <input
                  type="text"
                  value={userDetail.name}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              {/* 닉네임 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-main dark:text-white mb-2">닉네임</label>
                <input
                  type="text"
                  value={editFormData.nickname || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                  placeholder="2~10자의 영문, 숫자, 한글"
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-text-sub dark:text-gray-500 mt-1">2~10자의 영문, 숫자, 한글만 가능합니다.</p>
              </div>

              {/* 역할 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-main dark:text-white mb-2">역할</label>
                <select
                  value={editFormData.role || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SHELTER' })}
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="ROLE_USER">일반회원</option>
                  <option value="ROLE_ADMIN">관리자</option>
                  <option value="ROLE_SHELTER">보호소회원</option>
                </select>
              </div>

              {/* 보호소 등록번호 (ROLE_SHELTER인 경우만) */}
              {editFormData.role === 'ROLE_SHELTER' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
                    보호소 등록번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.careRegNo || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, careRegNo: e.target.value })}
                    placeholder="보호소 등록번호 입력"
                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditFormData({
                      nickname: '',
                      role: 'ROLE_USER',
                      careRegNo: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-text-main dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-text-main rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
