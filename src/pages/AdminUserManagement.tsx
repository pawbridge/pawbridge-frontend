import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, deleteUser, updateUser } from '../api/user.api';
import { useAuthStore } from '../store/authStore';
import AdminSidebar from '../components/layout/AdminSidebar';
import type { AdminUserListItem, UpdateUserRequest } from '../types/api.types';

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SHELTER' | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});

  // 회원 목록 조회 (전체 데이터를 가져와서 프론트엔드에서 필터링)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () =>
      getAdminUsers({
        page: 0,
        size: 1000, // 전체 데이터 가져오기
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  // 회원 수정 mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UpdateUserRequest }) =>
      updateUser(userId, data),
    onSuccess: async (_, variables) => {
      // 즉시 데이터 다시 조회
      await refetch();
      // 회원 상세 페이지 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId.toString()] });
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditForm({});
      alert('회원 정보가 수정되었습니다.');
    },
    onError: (error: any) => {
      alert(`회원 정보 수정 실패: ${error.response?.data?.message || error.message}`);
    },
  });

  // 회원 삭제 mutation
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      // 즉시 데이터 다시 조회
      await refetch();
      alert('회원이 삭제되었습니다.');
    },
    onError: (error: any) => {
      alert(`회원 삭제 실패: ${error.response?.data?.message || error.message}`);
    },
  });

  // 수정 모달 열기
  const handleEdit = (userItem: AdminUserListItem) => {
    setEditingUser(userItem);
    setEditForm({
      nickname: userItem.nickname,
      role: userItem.role,
      careRegNo: userItem.careRegNo,
    });
    setIsEditModalOpen(true);
  };

  // 수정 제출
  const handleSubmitEdit = () => {
    if (!editingUser) return;

    // 닉네임 유효성 검사
    if (editForm.nickname && !/^[a-zA-Z0-9가-힣]{2,10}$/.test(editForm.nickname)) {
      alert('닉네임은 2~10자의 영문, 숫자, 한글만 가능합니다.');
      return;
    }

    // ROLE_SHELTER인 경우 보호소 등록번호 필수
    if (editForm.role === 'ROLE_SHELTER' && !editForm.careRegNo) {
      alert('보호소 회원은 보호소 등록번호가 필요합니다.');
      return;
    }

    updateUserMutation.mutate({
      userId: editingUser.userId,
      data: editForm,
    });
  };

  // 삭제 확인
  const handleDelete = (userId: number, userName: string) => {
    if (window.confirm(`정말로 "${userName}" 회원을 삭제하시겠습니까?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 역할 배지 스타일
  const getRoleBadge = (role: 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SHELTER') => {
    const roleMap = {
      ROLE_ADMIN: {
        label: '관리자',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      },
      ROLE_USER: {
        label: '일반회원',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      ROLE_SHELTER: {
        label: '보호소회원',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      },
    };
    return roleMap[role] || roleMap.ROLE_USER;
  };

  // 아바타 색상 생성 (이메일 첫 글자 기반)
  const getAvatarColor = (email: string) => {
    const firstChar = email.charAt(0).toUpperCase();
    const colors = [
      { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
      { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
      { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
      { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
      { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
    ];
    const index = firstChar.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // 프론트엔드에서 필터링 적용
  const allUsers = data?.content || [];
  let filteredUsers = allUsers;

  // 역할 필터링
  if (roleFilter !== 'ALL') {
    filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
  }

  // 검색어 필터링 (이메일 또는 닉네임)
  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    filteredUsers = filteredUsers.filter(user =>
      user.email.toLowerCase().includes(keyword) ||
      user.nickname?.toLowerCase().includes(keyword)
    );
  }

  // 페이지네이션 적용
  const totalElements = filteredUsers.length;
  const totalPages = Math.ceil(totalElements / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const users = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex font-display antialiased">
      {/* 사이드바 */}
      <AdminSidebar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* 헤더 */}
        <header className="flex-none h-16 bg-surface-light dark:bg-surface-dark border-b border-[#e5e7eb] dark:border-gray-700 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-main dark:text-white">회원 관리</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center w-64 h-10 rounded-lg bg-background-light dark:bg-gray-800 px-3 border border-transparent focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-text-secondary">search</span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(0);
                }}
                placeholder="이메일 또는 닉네임으로 검색..."
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-text-main dark:text-white placeholder:text-text-secondary focus:ring-0"
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
              </button>
            </div>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
            {/* 페이지 헤더 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-text-main dark:text-white text-2xl font-black leading-tight tracking-tight">회원 관리</h1>
                <p className="text-text-sub dark:text-gray-400 text-sm font-normal">플랫폼에 가입된 모든 회원을 관리합니다.</p>
              </div>
              {/* 회원 추가 API가 없어서 주석처리 */}
              {/* <button className="flex items-center justify-center gap-2 h-10 px-5 bg-primary hover:bg-primary-dark transition-all duration-200 rounded-lg shadow-sm group">
                <span className="material-symbols-outlined text-[#111816]" style={{ fontSize: '20px' }}>
                  add
                </span>
                <span className="text-[#111816] text-sm font-bold">회원 추가</span>
              </button> */}
            </div>

            {/* 역할 필터 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-sub dark:text-gray-500 uppercase mr-1">역할 필터:</span>
              <button
                onClick={() => {
                  setRoleFilter('ALL');
                  setCurrentPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  roleFilter === 'ALL'
                    ? 'bg-primary text-primary-content border-transparent shadow-sm'
                    : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  setRoleFilter('ROLE_ADMIN');
                  setCurrentPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  roleFilter === 'ROLE_ADMIN'
                    ? 'bg-primary text-primary-content border-transparent shadow-sm'
                    : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
                }`}
              >
                관리자
              </button>
              <button
                onClick={() => {
                  setRoleFilter('ROLE_USER');
                  setCurrentPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  roleFilter === 'ROLE_USER'
                    ? 'bg-primary text-primary-content border-transparent shadow-sm'
                    : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
                }`}
              >
                일반회원
              </button>
              <button
                onClick={() => {
                  setRoleFilter('ROLE_SHELTER');
                  setCurrentPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  roleFilter === 'ROLE_SHELTER'
                    ? 'bg-primary text-primary-content border-transparent shadow-sm'
                    : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
                }`}
              >
                보호소회원
              </button>
            </div>

            {/* 회원 목록 테이블 */}
            <div className="bg-white dark:bg-gray-900 border border-[#dbe6e3] dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-sub dark:text-gray-400">회원 목록을 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="p-12 text-center">
                    <p className="text-red-500 mb-4">회원 목록을 불러오는 중 오류가 발생했습니다.</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">group</span>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">회원이 없습니다</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dbe6e3] dark:border-gray-700 text-xs uppercase tracking-wider text-text-sub dark:text-gray-400 font-semibold">
                        <th className="px-6 py-4 w-20">번호</th>
                        <th className="px-6 py-4">이메일</th>
                        <th className="px-6 py-4">이름</th>
                        <th className="px-6 py-4">닉네임</th>
                        <th className="px-6 py-4">역할</th>
                        <th className="px-6 py-4">가입일</th>
                        <th className="px-6 py-4 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe6e3] dark:divide-gray-700 text-sm text-text-main dark:text-gray-200">
                      {users.map((userItem, index) => {
                        const roleBadge = getRoleBadge(userItem.role);
                        const avatarColor = getAvatarColor(userItem.email);
                        return (
                          <tr key={userItem.userId} className="hover:bg-primary/5 dark:hover:bg-primary/5 transition-colors group">
                            <td className="px-6 py-4 text-sm text-text-sub dark:text-gray-400">
                              {currentPage * pageSize + index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full ${avatarColor.bg} flex items-center justify-center ${avatarColor.text} text-xs font-bold`}>
                                  {userItem.email.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-text-main dark:text-gray-200">{userItem.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-sub dark:text-gray-400">{userItem.name}</td>
                            <td className="px-6 py-4 text-sm text-text-main dark:text-gray-300 font-medium">
                              {userItem.nickname || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge.className}`}>
                                {roleBadge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-sub dark:text-gray-400">{formatDate(userItem.createdAt)}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => navigate(`/admin/users/${userItem.userId}`)}
                                  className="text-text-sub hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-background-light dark:hover:bg-gray-800"
                                  title="상세보기"
                                >
                                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </button>
                                <button
                                  onClick={() => handleEdit(userItem)}
                                  className="text-text-sub hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-colors p-1 rounded-md hover:bg-background-light dark:hover:bg-gray-800"
                                  title="수정"
                                >
                                  <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(userItem.userId, userItem.name)}
                                  disabled={deleteUserMutation.isPending}
                                  className="text-text-sub hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-background-light dark:hover:bg-gray-800 disabled:opacity-50"
                                  title="삭제"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-[#dbe6e3] dark:border-gray-700 flex items-center justify-between">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-text-sub dark:text-gray-400">
                        Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to{' '}
                        <span className="font-medium">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of{' '}
                        <span className="font-medium">{totalElements}</span> results
                      </p>
                    </div>
                    <div>
                      <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                          disabled={currentPage === 0}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#dbe6e3] dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-text-sub hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            chevron_left
                          </span>
                        </button>
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 10) {
                            pageNum = i;
                          } else if (currentPage < 5) {
                            pageNum = i;
                          } else if (currentPage > totalPages - 6) {
                            pageNum = totalPages - 10 + i;
                          } else {
                            pageNum = currentPage - 4 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'z-10 bg-primary border-primary text-[#111816]'
                                  : 'bg-white dark:bg-gray-900 border-[#dbe6e3] dark:border-gray-700 text-text-sub dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        })}
                        {totalPages > 10 && currentPage < totalPages - 6 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-[#dbe6e3] dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-text-sub">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                          disabled={currentPage >= totalPages - 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#dbe6e3] dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-text-sub hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            chevron_right
                          </span>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 회원 수정 모달 */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">회원 정보 수정</h2>

            {/* 이메일 (수정 불가) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-sub dark:text-gray-400 mb-2">이메일</label>
              <input
                type="text"
                value={editingUser.email}
                disabled
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-500 rounded-lg cursor-not-allowed"
              />
            </div>

            {/* 이름 (수정 불가) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-sub dark:text-gray-400 mb-2">이름</label>
              <input
                type="text"
                value={editingUser.name}
                disabled
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-500 rounded-lg cursor-not-allowed"
              />
            </div>

            {/* 닉네임 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-main dark:text-white mb-2">닉네임</label>
              <input
                type="text"
                value={editForm.nickname || ''}
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                placeholder="2~10자의 영문, 숫자, 한글"
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-text-sub dark:text-gray-500 mt-1">2~10자의 영문, 숫자, 한글만 가능합니다.</p>
            </div>

            {/* 역할 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-main dark:text-white mb-2">역할</label>
              <select
                value={editForm.role || ''}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SHELTER' })}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ROLE_USER">일반회원</option>
                <option value="ROLE_ADMIN">관리자</option>
                <option value="ROLE_SHELTER">보호소회원</option>
              </select>
            </div>

            {/* 보호소 등록번호 (ROLE_SHELTER인 경우만) */}
            {editForm.role === 'ROLE_SHELTER' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
                  보호소 등록번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.careRegNo || ''}
                  onChange={(e) => setEditForm({ ...editForm, careRegNo: e.target.value })}
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
                  setEditingUser(null);
                  setEditForm({});
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-text-main dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={updateUserMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary text-text-main rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateUserMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

