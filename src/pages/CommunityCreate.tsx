import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { createPost } from '../api/community.api';
import type { BoardType } from '../types/api.types';

export default function CommunityCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialBoardType = (searchParams.get('boardType') as BoardType) || 'MISSING';
  const isCommunicationBoard = initialBoardType === 'COMMUNICATION';

  const [form, setForm] = useState({
    boardType: initialBoardType,
    title: '',
    content: '',
    files: [] as File[],
  });

  // 게시글 생성 mutation
  const createPostMutation = useMutation({
    mutationFn: (data: { title: string; content: string; boardType: BoardType; files?: File[] }) =>
      createPost(
        { title: data.title, content: data.content, boardType: data.boardType },
        data.files
      ),
    onSuccess: (data) => {
      // 게시글 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      alert('게시글이 작성되었습니다.');
      navigate(`/community/${data.postId}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '게시글 작성에 실패했습니다.';
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

    createPostMutation.mutate({
      title: form.title,
      content: form.content,
      boardType: form.boardType,
      files: form.files.length > 0 ? form.files : undefined,
    });
  };

  // 소통게시판 전용 레이아웃
  if (isCommunicationBoard) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
        <Header />
        <main className="flex flex-1 items-center justify-center py-10 px-4 sm:px-6 md:px-8">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-8 p-6 sm:p-10">
              <div>
                <h1 className="text-[#111816] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                  소통 게시판 글 작성
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
                    placeholder="자유롭게 이야기를 공유해주세요. (예: 입양 후기, 반려동물 자랑 등)"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </label>

                {/* Photo Upload Grid */}
                <div className="flex flex-col gap-4">
                  <p className="text-[#111816] dark:text-white text-base font-medium leading-normal">
                    사진 첨부 (선택)
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
                    {form.files.length < 10 && (
                      <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer aspect-square p-4">
                        <span className="material-symbols-outlined text-primary text-3xl">add_photo_alternate</span>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal text-center">
                          사진 추가
                        </p>
                        <input
                          className="sr-only"
                          multiple
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to="/community"
                    className="w-full sm:w-auto flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-gray-100 dark:bg-gray-700 text-[#111816] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-base font-bold leading-normal"
                  >
                    <span className="truncate">취소</span>
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={createPostMutation.isPending}
                    className="w-full sm:w-auto flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white hover:bg-primary/80 transition-colors text-base font-bold leading-normal disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">{createPostMutation.isPending ? '등록 중...' : '등록'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 기존 커뮤니티 레이아웃 (실종/보호/제보)
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Page Heading */}
            <div className="mb-10">
              <p className="text-gray-800 dark:text-white text-4xl font-black tracking-tight">커뮤니티 글 작성</p>
            </div>

            {/* Form */}
            <div className="space-y-8">
              {/* Board Type Selector */}
              <div>
                <label className="block text-base font-medium text-gray-800 dark:text-gray-200 pb-2" htmlFor="boardType">
                  게시판 선택<span className="text-primary ml-1">*</span>
                </label>
                <select
                  className="form-select w-full rounded-lg text-gray-800 dark:text-gray-200 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary h-14 p-[15px] text-base font-normal"
                  id="boardType"
                  value={form.boardType}
                  onChange={(e) => setForm({ ...form, boardType: e.target.value as BoardType })}
                >
                  <option disabled value="">
                    게시판을 선택해주세요
                  </option>
                  <option value="MISSING">실종</option>
                  <option value="PROTECTION">보호</option>
                  <option value="REPORT">제보</option>
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-base font-medium text-gray-800 dark:text-gray-200 pb-2" htmlFor="title">
                  제목<span className="text-primary ml-1">*</span>
                </label>
                <input
                  className="form-input w-full rounded-lg text-gray-800 dark:text-gray-200 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal"
                  id="title"
                  placeholder="제목을 입력하세요"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-base font-medium text-gray-800 dark:text-gray-200 pb-2" htmlFor="content">
                  내용<span className="text-primary ml-1">*</span>
                </label>
                <textarea
                  className="form-textarea w-full rounded-lg text-gray-800 dark:text-gray-200 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary min-h-48 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal"
                  id="content"
                  placeholder="내용을 입력하세요"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>

              {/* Multi-Image Uploader */}
              <div>
                <label className="block text-base font-medium text-gray-800 dark:text-gray-200 pb-2">
                  사진 첨부 <span className="text-gray-500 dark:text-gray-400 font-normal">(선택)</span>
                </label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-400 dark:border-gray-600 px-6 py-10 bg-white/50 dark:bg-gray-800/50">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-500">image</span>
                    <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
                      <label
                        className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:ring-offset-background-dark hover:text-primary/80"
                        htmlFor="file-upload"
                      >
                        <span>이미지 첨부</span>
                        <input
                          className="sr-only"
                          id="file-upload"
                          multiple
                          name="file-upload"
                          type="file"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">또는 드래그 앤 드롭</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
                {form.files.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {form.files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div
                          className="aspect-square w-full rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${URL.createObjectURL(file)})` }}
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
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <button
                  onClick={handleSubmit}
                  disabled={createPostMutation.isPending}
                  className="flex min-w-[120px] items-center justify-center rounded-lg h-12 px-6 bg-primary text-gray-900 text-base font-bold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{createPostMutation.isPending ? '등록 중...' : '등록하기'}</span>
                </button>
                <Link
                  to="/community"
                  className="flex min-w-[120px] items-center justify-center rounded-lg h-12 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-base font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <span>취소</span>
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
