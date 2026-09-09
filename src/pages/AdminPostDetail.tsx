import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getAdminPostById, updatePost } from '../api/post.api';
import { useAuthStore } from '../store/authStore';
import AdminSidebar from '../components/layout/AdminSidebar';
import type { UpdatePostRequest, BoardType } from '../types/api.types';

export default function AdminPostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdatePostRequest>({
    title: '',
    content: '',
  });

  // 게시글 상세 정보 조회
  const { data: postDetail, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-post', postId],
    queryFn: () => getAdminPostById(Number(postId)),
    enabled: !!postId,
  });

  // 게시글 정보 수정 mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePostRequest) => {
      console.log('게시글 수정 요청:', { postId, data });
      return updatePost(Number(postId), data);
    },
    onSuccess: async () => {
      console.log('게시글 수정 성공');

      // 모달 먼저 닫기
      setIsEditModalOpen(false);

      // 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-post', postId] });

      // 데이터 다시 조회
      await refetch();

      console.log('데이터 갱신 완료');
      alert('게시글 정보가 수정되었습니다.');
    },
    onError: (error: any) => {
      console.error('게시글 수정 실패:', error);
      alert(error.response?.data?.message || '게시글 정보 수정에 실패했습니다.');
    },
  });

  // 수정 모달 열기
  const handleEditClick = () => {
    if (postDetail) {
      setEditFormData({
        title: postDetail.title,
        content: postDetail.content,
      });
      setIsEditModalOpen(true);
    }
  };

  // 수정 폼 제출
  const handleEditSubmit = () => {
    console.log('수정 폼 제출 - editFormData:', editFormData);
    console.log('원본 데이터:', { title: postDetail?.title, content: postDetail?.content });

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
    if (editFormData.title && editFormData.title !== postDetail?.title) {
      updateData.title = editFormData.title;
    }
    if (editFormData.content && editFormData.content !== postDetail?.content) {
      updateData.content = editFormData.content;
    }

    console.log('전송할 데이터:', updateData);

    if (Object.keys(updateData).length === 0) {
      alert('변경된 내용이 없습니다.');
      return;
    }

    updateMutation.mutate(updateData);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 게시판 타입 배지
  const getBoardTypeBadge = (boardType: BoardType) => {
    const boardTypeMap = {
      MISSING: { label: '실종', color: 'bg-red-50 text-red-700 border-red-100' },
      PROTECTION: { label: '보호', color: 'bg-blue-50 text-blue-700 border-blue-100' },
      REPORT: { label: '제보', color: 'bg-orange-50 text-orange-700 border-orange-100' },
      ADOPTION: { label: '입양후기', color: 'bg-green-50 text-green-700 border-green-100' },
      COMMUNICATION: { label: '소통', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    };
    return boardTypeMap[boardType] || boardTypeMap.COMMUNICATION;
  };

  if (isLoading) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-sub dark:text-gray-400">게시글 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !postDetail) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">게시글 정보를 불러오는 중 오류가 발생했습니다.</p>
            <button
              onClick={() => navigate('/admin/posts')}
              className="px-4 py-2 bg-primary text-text-main rounded-lg hover:bg-primary-hover transition-colors"
            >
              게시글 목록으로 돌아가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  const boardTypeBadge = getBoardTypeBadge(postDetail.boardType);

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
                    onClick={() => navigate('/admin/posts')}
                    className="hover:bg-gray-200 dark:hover:bg-gray-700 p-2 -ml-2 rounded-full transition-colors group"
                  >
                    <span className="material-symbols-outlined text-text-main dark:text-white group-hover:text-primary transition-colors">arrow_back</span>
                  </button>
                  <h1 className="text-text-main dark:text-white text-3xl font-black leading-tight">게시글 상세 정보</h1>
                </div>
                <p className="text-text-sub dark:text-gray-400 text-base font-normal pl-10">게시글의 상세 정보를 확인하고 관리합니다.</p>
              </div>
            </div>

            {/* 게시글 정보 카드 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* 헤더 */}
              <div className="p-8 flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-text-main dark:text-white text-2xl font-bold">{postDetail.title}</h2>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${boardTypeBadge.color}`}>
                    <span className="material-symbols-outlined text-[14px]">label</span>
                    {boardTypeBadge.label}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-text-sub dark:text-gray-400 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    <span>작성자: {postDetail.authorNickname}</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span>작성일: {formatDate(postDetail.createdAt)}</span>
                  </div>
                  {postDetail.updatedAt && postDetail.updatedAt !== postDetail.createdAt && (
                    <>
                      <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        <span>수정일: {formatDate(postDetail.updatedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 내용 */}
              <div className="p-8 bg-white dark:bg-gray-900">
                <h3 className="text-text-main dark:text-white text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  내용
                </h3>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-text-main dark:text-gray-300 whitespace-pre-wrap">{postDetail.content}</p>
                </div>
              </div>

              {/* 이미지 목록 */}
              {postDetail.imageUrls && postDetail.imageUrls.length > 0 && (
                <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-text-main dark:text-white text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">image</span>
                    첨부 이미지 ({postDetail.imageUrls.length}개)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {postDetail.imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={url}
                          alt={`첨부 이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/image-placeholder.svg';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end items-center gap-3">
                <button
                  onClick={() => navigate('/admin/posts')}
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

        {/* 게시글 정보 수정 모달 */}
        {isEditModalOpen && postDetail && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full p-6 relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">게시글 정보 수정</h2>

              {/* 게시판 타입 (수정 불가) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-sub dark:text-gray-400 mb-2">게시판 타입</label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-500 rounded-lg">
                  {boardTypeBadge.label}
                </div>
              </div>

              {/* 작성자 (수정 불가) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-sub dark:text-gray-400 mb-2">작성자</label>
                <input
                  type="text"
                  value={postDetail.authorNickname}
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
