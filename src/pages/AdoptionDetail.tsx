import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import placeholderImg from '../assets/image-placeholder.svg';
import {
  getPost,
  getCommentsByPostId,
  createComment,
  deleteComment,
  deletePost
} from '../api/community.api';
import { useAuthStore } from '../store/authStore';

export default function AdoptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const postId = id ? parseInt(id, 10) : 0;
  const user = useAuthStore((state) => state.user);

  const [newComment, setNewComment] = useState('');

  // 게시글 조회
  const { data: post, isLoading: postLoading, error: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId),
    enabled: !!postId,
  });

  // 댓글 목록 조회
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getCommentsByPostId(postId),
    enabled: !!postId,
  });

  // 댓글 작성 mutation
  const createCommentMutation = useMutation({
    mutationFn: (content: string) => createComment(postId, { content }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      alert('댓글이 작성되었습니다.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '댓글 작성에 실패했습니다.';
      alert(message);
    },
  });

  // 댓글 삭제 mutation
  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      alert('댓글이 삭제되었습니다.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '댓글 삭제에 실패했습니다.';
      alert(message);
    },
  });

  // 게시글 삭제 mutation
  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      // 게시글 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      alert('입양후기가 삭제되었습니다.');
      navigate('/adoption');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '입양후기 삭제에 실패했습니다.';
      alert(message);
    },
  });

  const handleCommentSubmit = () => {
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    createCommentMutation.mutate(newComment);
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleDeletePost = () => {
    if (confirm('입양후기를 삭제하시겠습니까?')) {
      deletePostMutation.mutate(postId);
    }
  };

  if (postLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">게시글을 불러오는 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-600 dark:text-red-400">입양후기를 찾을 수 없습니다.</p>
            <Link to="/adoption" className="mt-4 inline-block text-primary underline">
              목록으로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isAuthor = user?.id === post.authorId;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
      <Header />
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* 뒤로 가기 */}
          <div className="mb-6">
            <Link
              to="/adoption"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
            >
              <span className="material-symbols-outlined mr-1">arrow_back</span>
              목록으로
            </Link>
          </div>

          {/* 게시글 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8 mb-6">
            {/* 헤더 */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-primary/20 dark:bg-primary/30 text-primary text-sm font-semibold rounded-full mb-3">
                  입양후기
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {post.authorName} · {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {isAuthor && (
                <div className="flex gap-2">
                  <Link
                    to={`/adoption/${postId}/edit`}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    수정
                  </Link>
                  <button
                    onClick={handleDeletePost}
                    disabled={deletePostMutation.isPending}
                    className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 이미지 */}
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="mb-6">
                <img
                  src={post.imageUrls[0] || placeholderImg}
                  alt={post.title}
                  className="w-full max-h-96 object-contain rounded-lg mb-3"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderImg;
                  }}
                />
                {post.imageUrls.length > 1 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {post.imageUrls.slice(1).map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url || placeholderImg}
                        alt={`이미지 ${idx + 2}`}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = placeholderImg;
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 본문 */}
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {post.content}
              </p>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              댓글 {comments.length}
            </h2>

            {/* 댓글 작성 */}
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "따뜻한 댓글을 남겨주세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                disabled={!user || createCommentMutation.isPending}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleCommentSubmit}
                  disabled={!user || createCommentMutation.isPending}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCommentMutation.isPending ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  첫 댓글을 작성해보세요!
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.commentId || comment.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {comment.authorName || `작성자 ${comment.authorId}`}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {user?.id === comment.authorId && (
                        <button
                          onClick={() => handleDeleteComment(comment.commentId || comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
