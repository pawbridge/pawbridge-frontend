import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminPosts, deletePost, updatePost } from '../api/post.api';
import { useAuthStore } from '../store/authStore';
import AdminSidebar from '../components/layout/AdminSidebar';
import type { BoardType, PostResponse, UpdatePostRequest } from '../types/api.types';

export default function AdminPostManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // 필터 및 페이지네이션 상태
  const [boardTypeFilter, setBoardTypeFilter] = useState<BoardType | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
  const [editFormData, setEditFormData] = useState<UpdatePostRequest>({
    title: '',
    content: '',
  });

  // 게시글 목록 조회 (전체 데이터를 가져와서 프론트엔드에서 필터링)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () =>
      getAdminPosts({
        page: 0,
        size: 1000, // 전체 데이터 가져오기
        sort: 'createdAt,desc',
      }),
  });

  // 프론트엔드에서 필터링 적용
  const allPosts = data?.content || [];
  let filteredPosts = allPosts;

  // 게시판 타입 필터링
  if (boardTypeFilter) {
    filteredPosts = filteredPosts.filter(post => post.boardType === boardTypeFilter);
  }

  // 검색어 필터링
  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    filteredPosts = filteredPosts.filter(post =>
      post.title.toLowerCase().includes(keyword) ||
      post.content.toLowerCase().includes(keyword) ||
      (post.authorNickname && post.authorNickname.toLowerCase().includes(keyword))
    );
  }

  // 프론트엔드 페이지네이션
  const totalElements = filteredPosts.length;
  const totalPages = Math.ceil(totalElements / pageSize);
  const posts = filteredPosts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // 게시글 수정 mutation
  const updateMutation = useMutation({
    mutationFn: (data: { postId: number; updateData: UpdatePostRequest }) =>
      updatePost(data.postId, data.updateData),
    onSuccess: async () => {
      // 모달 먼저 닫기
      setIsEditModalOpen(false);
      setSelectedPost(null);

      // 캐시 무효화 및 데이터 다시 조회
      await queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      await refetch();

      alert('게시글 정보가 수정되었습니다.');
    },
    onError: (error: any) => {
      console.error('게시글 수정 실패:', error);
      alert(error.response?.data?.message || '게시글 정보 수정에 실패했습니다.');
    },
  });

  // 게시글 삭제 mutation
  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: async () => {
      // 즉시 데이터 다시 조회
      await refetch();
      // 현재 페이지에 게시글이 없으면 이전 페이지로
      if (posts.length === 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
      alert('게시글이 삭제되었습니다.');
    },
    onError: (error: any) => {
      alert(`게시글 삭제 실패: ${error.response?.data?.message || error.message}`);
    },
  });

  // 수정 모달 열기
  const handleEditClick = (post: PostResponse) => {
    setSelectedPost(post);
    setEditFormData({
      title: post.title,
      content: post.content,
    });
    setIsEditModalOpen(true);
  };

  // 수정 폼 제출
  const handleEditSubmit = () => {
    if (!selectedPost) return;

    // 제목 유효성 검사
    if (editFormData.title && (editFormData.title.length < 1 || editFormData.title.length > 200)) {
      alert('제목은 1자 이상 200자 이하여야 합니다.');
      return;
    }

    // 내용 유효성 검사
    if (editFormData.content && editFormData.content.length < 1) {
      alert('내용은 1자 이상이어야 합니다.');
      return;
    }

    // 실제 변경된 필드만 전송
    const updateData: UpdatePostRequest = {};
    if (editFormData.title && editFormData.title !== selectedPost?.title) {
      updateData.title = editFormData.title;
    }
    if (editFormData.content && editFormData.content !== selectedPost?.content) {
      updateData.content = editFormData.content;
    }

    if (Object.keys(updateData).length === 0) {
      alert('변경된 내용이 없습니다.');
      return;
    }

    updateMutation.mutate({ postId: selectedPost.postId || selectedPost.id, updateData });
  };

  // 삭제 확인
  const handleDelete = (postId: number, title: string) => {
    if (window.confirm(`정말로 "${title}" 게시글을 삭제하시겠습니까?`)) {
      deletePostMutation.mutate(postId);
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

  // 게시판 타입 배지
  const getBoardTypeBadge = (boardType: BoardType) => {
    const boardTypeMap = {
      MISSING: { label: '실종', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
      PROTECTION: { label: '보호', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
      REPORT: { label: '제보', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
      ADOPTION: { label: '입양후기', className: 'bg-primary/20 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
      COMMUNICATION: { label: '소통', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    };
    return boardTypeMap[boardType] || boardTypeMap.COMMUNICATION;
  };

  // 작성자 아바타 색상
  const getAvatarColor = (nickname: string) => {
    const firstChar = nickname.charAt(0).toUpperCase();
    const colors = [
      { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
      { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
      { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
      { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
      { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
      { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
      { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
    ];
    const index = firstChar.charCodeAt(0) % colors.length;
    return colors[index];
  };


  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
      <AdminSidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* 헤더 */}
        <header className="flex-none h-16 bg-surface-light dark:bg-surface-dark border-b border-[#e5e7eb] dark:border-gray-700 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-main dark:text-white">게시글 관리</h2>
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
                placeholder="검색어를 입력하세요..."
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
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-text-main dark:text-white">게시글 관리</h2>
              <p className="text-text-sub dark:text-gray-400 text-sm mt-1">커뮤니티의 모든 게시글을 조회하고 관리할 수 있습니다.</p>
            </div>
            {/* 공지사항 작성 버튼 (백엔드 API 없으므로 주석 처리) */}
            {/* <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:brightness-105 transition-all">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                <span>공지사항 작성</span>
              </button>
            </div> */}
          </div>

          {/* 게시판 타입 필터 */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold text-text-sub dark:text-gray-500 uppercase mr-1">게시판 타입:</span>
            <button
              onClick={() => {
                setBoardTypeFilter('');
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                boardTypeFilter === ''
                  ? 'bg-primary text-primary-content border-transparent shadow-sm'
                  : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => {
                setBoardTypeFilter('MISSING');
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                boardTypeFilter === 'MISSING'
                  ? 'bg-primary text-primary-content border-transparent shadow-sm'
                  : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
              }`}
            >
              실종
            </button>
            <button
              onClick={() => {
                setBoardTypeFilter('PROTECTION');
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                boardTypeFilter === 'PROTECTION'
                  ? 'bg-primary text-primary-content border-transparent shadow-sm'
                  : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
              }`}
            >
              보호
            </button>
            <button
              onClick={() => {
                setBoardTypeFilter('REPORT');
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                boardTypeFilter === 'REPORT'
                  ? 'bg-primary text-primary-content border-transparent shadow-sm'
                  : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
              }`}
            >
              제보
            </button>
            <button
              onClick={() => {
                setBoardTypeFilter('ADOPTION');
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                boardTypeFilter === 'ADOPTION'
                  ? 'bg-primary text-primary-content border-transparent shadow-sm'
                  : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
              }`}
            >
              입양후기
            </button>
            <button
              onClick={() => {
                setBoardTypeFilter('COMMUNICATION');
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                boardTypeFilter === 'COMMUNICATION'
                  ? 'bg-primary text-primary-content border-transparent shadow-sm'
                  : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-gray-700 hover:border-primary dark:hover:border-primary'
              }`}
            >
              소통
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-[#dbe6e3] dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-text-sub dark:text-gray-400">게시글 목록을 불러오는 중...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <p className="text-red-500 mb-4">게시글 목록을 불러오는 중 오류가 발생했습니다.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              ) : posts.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">article</span>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">게시글이 없습니다</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dbe6e3] dark:border-gray-700 text-xs uppercase tracking-wider text-text-sub dark:text-gray-400 font-semibold">
                      <th className="px-6 py-4 w-20">번호</th>
                      <th className="px-6 py-4 w-[40%]">제목</th>
                      <th className="px-6 py-4">작성자</th>
                      <th className="px-6 py-4">게시판 타입</th>
                      <th className="px-6 py-4">작성일</th>
                      <th className="px-6 py-4 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbe6e3] dark:divide-gray-700 text-sm text-text-main dark:text-gray-200">
                    {posts.map((post, index) => {
                      const boardTypeBadge = getBoardTypeBadge(post.boardType);
                      const nickname = post.authorNickname || post.authorName || '익명';
                      const avatarColor = getAvatarColor(nickname);
                      return (
                        <tr key={post.postId || post.id} className="hover:bg-primary/5 dark:hover:bg-primary/5 transition-colors group">
                          <td className="px-6 py-4 text-text-sub dark:text-gray-400 font-mono">{totalElements - (currentPage * pageSize + index)}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-text-main dark:text-gray-200 group-hover:text-black dark:group-hover:text-white">
                              {post.title}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full ${avatarColor.bg} ${avatarColor.text} flex items-center justify-center text-xs font-bold`}>
                                {nickname.charAt(0).toUpperCase()}
                              </div>
                              <span>{nickname}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${boardTypeBadge.className}`}>
                              {boardTypeBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-text-sub dark:text-gray-400">{formatDate(post.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/posts/${post.postId}`)}
                                className="p-1.5 rounded-lg text-text-sub dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
                                title="상세보기"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                  visibility
                                </span>
                              </button>
                              <button
                                onClick={() => handleEditClick(post)}
                                className="p-1.5 rounded-lg text-text-sub dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/10 transition-colors"
                                title="수정"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                  edit
                                </span>
                              </button>
                              <button
                                onClick={() => handleDelete(post.postId || post.id, post.title)}
                                disabled={deletePostMutation.isPending}
                                className="p-1.5 rounded-lg text-text-sub dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                title="삭제"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                  delete
                                </span>
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
            {!isLoading && posts.length > 0 && (
              <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-[#dbe6e3] dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-text-sub dark:text-gray-400 hidden sm:block">
                  Showing <span className="font-medium text-text-main dark:text-white">{currentPage * pageSize + 1}</span> to{' '}
                  <span className="font-medium text-text-main dark:text-white">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of{' '}
                  <span className="font-medium text-text-main dark:text-white">{totalElements}</span> results
                </p>
                <div className="flex items-center gap-2 mx-auto sm:mx-0">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#dbe6e3] dark:border-gray-700 text-text-sub dark:text-gray-400 hover:bg-background-light dark:hover:bg-gray-800 hover:text-text-main dark:hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      chevron_left
                    </span>
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = currentPage < 3 ? i : currentPage - 2 + i;
                    if (pageNum >= totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-primary text-black font-semibold shadow-sm ring-1 ring-primary'
                            : 'border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-gray-300 hover:bg-background-light dark:hover:bg-gray-800'
                        } transition-colors`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 3 && (
                    <>
                      <span className="text-text-sub dark:text-gray-400 px-1">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages - 1)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-gray-300 hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#dbe6e3] dark:border-gray-700 text-text-sub dark:text-gray-400 hover:bg-background-light dark:hover:bg-gray-800 hover:text-text-main dark:hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 게시글 정보 수정 모달 */}
        {isEditModalOpen && selectedPost && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full p-6 relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">게시글 정보 수정</h2>

              {/* 게시판 타입 (수정 불가) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-sub dark:text-gray-400 mb-2">게시판 타입</label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-500 rounded-lg">
                  {getBoardTypeBadge(selectedPost.boardType).label}
                </div>
              </div>

              {/* 작성자 (수정 불가) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-sub dark:text-gray-400 mb-2">작성자</label>
                <input
                  type="text"
                  value={selectedPost.authorNickname}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              {/* 제목 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-main dark:text-white mb-2">제목</label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="제목을 입력하세요 (1-200자)"
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-text-sub dark:text-gray-500 mt-1">1~200자 이내로 입력해주세요.</p>
              </div>

              {/* 내용 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-main dark:text-white mb-2">내용</label>
                <textarea
                  value={editFormData.content || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  placeholder="내용을 입력하세요"
                  rows={10}
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-[#dbe6e3] dark:border-gray-700 text-text-main dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <p className="text-xs text-text-sub dark:text-gray-500 mt-1">1자 이상 입력해주세요.</p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedPost(null);
                    setEditFormData({
                      title: '',
                      content: '',
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
