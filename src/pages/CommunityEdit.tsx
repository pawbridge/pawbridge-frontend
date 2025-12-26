import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { getPost, updatePost } from '../api/community.api';
import { useAuthStore } from '../store/authStore';

export default function CommunityEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const postId = id ? parseInt(id, 10) : 0;
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState({
    title: '',
    content: '',
    files: [] as File[],
  });

  // 기존 게시글 조회
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId),
    enabled: !!postId,
  });

  // 게시글 데이터로 폼 초기화
  useEffect(() => {
    if (post) {
      // 작성자 확인
      if (user?.id !== post.authorId) {
        alert('수정 권한이 없습니다.');
        navigate(`/community/${postId}`);
        return;
      }

      setForm({
        title: post.title,
        content: post.content,
        files: [],
      });
    }
  }, [post, user, postId, navigate]);

  // 게시글 수정 mutation
  const updatePostMutation = useMutation({
    mutationFn: (data: { title: string; content: string; files?: File[] }) =>
      updatePost(postId, { title: data.title, content: data.content }, data.files),
    onSuccess: (data) => {
      // 게시글 목록과 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      alert('게시글이 수정되었습니다.');
      navigate(`/community/${data.postId}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '게시글 수정에 실패했습니다.';
      alert(message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setForm({ ...form, files: [...form.files, ...newFiles] });
    }
  };

  const removeFile = (index: number) => {
    setForm({ ...form, files: form.files.filter((_, i) => i !== index) });
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    updatePostMutation.mutate({
      title: form.title,
      content: form.content,
      files: form.files.length > 0 ? form.files : undefined,
    });
  };

  if (isLoading) {
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

  if (error || !post) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-600 dark:text-red-400">게시글을 찾을 수 없습니다.</p>
            <Link to="/community" className="mt-4 inline-block text-primary underline">
              목록으로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
      <Header />
      <main className="flex flex-1 items-center justify-center py-10 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-8 p-6 sm:p-10">
            <div>
              <h1 className="text-[#111816] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                게시글 수정
              </h1>
            </div>

            <div className="flex flex-col gap-6">
              {/* Title Input */}
              <label className="flex flex-col w-full">
                <p className="text-[#111816] dark:text-white text-base font-medium leading-normal pb-2">
                  제목 *
                </p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111816] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-4 text-base font-normal leading-normal"
                  placeholder="제목을 입력하세요"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              {/* Content Textarea */}
              <label className="flex flex-col w-full">
                <p className="text-[#111816] dark:text-white text-base font-medium leading-normal pb-2">
                  내용 *
                </p>
                <textarea
                  className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#111816] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-h-60 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-4 text-base font-normal leading-normal"
                  placeholder="내용을 입력하세요"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </label>

              {/* 기존 이미지 표시 */}
              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-[#111816] dark:text-white text-base font-medium leading-normal">
                    기존 이미지 (수정 시 새 파일을 업로드하면 기존 파일은 삭제됩니다)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {post.imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          alt={`기존 이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                          src={url}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Upload Grid */}
              {form.files.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-[#111816] dark:text-white text-base font-medium leading-normal">
                    새 이미지 ({form.files.length}개)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {form.files.map((file, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
                        <img
                          alt={`Uploaded image ${index + 1}`}
                          className="w-full h-full object-cover"
                          src={URL.createObjectURL(file)}
                        />
                        <button
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(index)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload Button */}
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer p-4">
                  <span className="material-symbols-outlined text-primary text-2xl">add_photo_alternate</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    이미지 추가
                  </span>
                  <input
                    className="sr-only"
                    multiple
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSubmit}
                  disabled={updatePostMutation.isPending}
                  className="w-full sm:w-auto flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white hover:bg-primary/80 transition-colors text-base font-bold leading-normal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">{updatePostMutation.isPending ? '수정 중...' : '수정완료'}</span>
                </button>
                <Link
                  to={`/community/${postId}`}
                  className="w-full sm:w-auto flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-gray-100 dark:bg-gray-700 text-[#111816] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-base font-bold leading-normal"
                >
                  <span className="truncate">취소</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
