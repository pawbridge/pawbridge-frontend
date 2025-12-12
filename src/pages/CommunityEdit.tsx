import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { mockPosts } from './CommunityList';

// boardType별 초기 데이터
const initialDataByType: Record<string, any> = {
  MISSING: {
    title: '저희 강아지를 찾습니다 (서울숲 근처)',
    content: `어제 저녁 8시경 서울숲 근처에서 산책하다가 놓쳤습니다. 이름은 '해피'이고, 5살 된 말티즈입니다. 흰색 털에 파란색 목줄을 하고 있었습니다. 사람을 잘 따르는 편입니다. 보신 분은 꼭 연락 부탁드립니다.`,
    boardType: 'MISSING',
    boardLabel: '실종 신고',
    existingFiles: ['강아지_사진1.jpg', '강아지_사진2.png'],
  },
  PROTECTION: {
    title: '보호 중인 고양이 주인 찾습니다',
    content: `OO동에서 발견한 고양이를 임시 보호하고 있습니다. 건강 상태는 양호하며, 사람을 잘 따릅니다. 주인을 찾고 있습니다.`,
    boardType: 'PROTECTION',
    boardLabel: '보호',
    existingFiles: ['고양이_사진1.jpg'],
  },
  REPORT: {
    title: '유기견으로 보이는 강아지 발견',
    content: `OO공원 근처에서 유기견으로 보이는 강아지를 발견했습니다. 도움을 주실 수 있는 분 연락 부탁드립니다.`,
    boardType: 'REPORT',
    boardLabel: '제보',
    existingFiles: ['제보_사진1.jpg'],
  },
  FREE: {
    title: '저희 집 귀염둥이 강아지를 소개합니다!',
    content: `안녕하세요! Paw Bridge 커뮤니티에 처음으로 글을 남깁니다. 저희 집 사랑스러운 강아지 '코코'를 소개하고 싶어서요. 코코는 2살 된 믹스견인데, 에너지가 넘치고 사람을 정말 좋아해요. 최근에 공원에서 다른 강아지 친구들과 신나게 뛰어노는 사진 몇 장 올려봅니다. 다들 즐거운 하루 보내세요!`,
    boardType: 'FREE',
    boardLabel: '소통 게시판',
    existingFiles: ['coco_park_photo_01.jpg', 'coco_park_photo_02.jpg'],
  },
};

export default function CommunityEdit() {
  const { id } = useParams<{ id: string }>();
  const postId = id ? parseInt(id, 10) : 1;

  // mockPosts에서 해당 글 찾기
  const listPost = mockPosts.find((p) => p.postId === postId);
  const boardType = listPost?.boardType || 'MISSING';
  const initialData = initialDataByType[boardType] || initialDataByType.MISSING;
  const isFreeBoard = boardType === 'FREE';

  const [form, setForm] = useState({
    title: initialData.title,
    content: initialData.content,
    boardType: initialData.boardType,
    files: [] as File[],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setForm({ ...form, files: [...form.files, ...newFiles] });
    }
  };

  const removeExistingFile = (index: number) => {
    // 기존 파일 삭제 로직 (실제로는 API 호출 필요)
    console.log('Remove existing file:', index);
  };

  const removeNewFile = (index: number) => {
    setForm({ ...form, files: form.files.filter((_, i) => i !== index) });
  };

  // 소통게시판 전용 레이아웃
  if (isFreeBoard) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
        <Header />
        <main className="flex flex-1 w-full items-center justify-center p-4 py-10 sm:p-8 md:p-10">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-10 rounded-xl shadow-lg">
            <div className="flex flex-col">
              {/* Breadcrumb */}
              <div className="flex flex-wrap gap-2 items-center text-sm mb-6">
                <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                  홈
                </Link>
                <span className="text-gray-400 dark:text-gray-500">/</span>
                <Link
                  to="/community"
                  className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  소통 게시판
                </Link>
                <span className="text-gray-400 dark:text-gray-500">/</span>
                <span className="text-[#111816] dark:text-white font-medium">글 수정</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-[#111816] dark:text-white tracking-[-0.033em] mb-8">
                게시글 수정
              </h1>

              <form className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Board Type - Disabled */}
                  <div>
                    <label
                      className="text-[#111816] dark:text-white text-base font-medium leading-normal pb-2 block"
                      htmlFor="boardType"
                    >
                      게시판
                    </label>
                    <div className="relative flex w-full items-stretch">
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 focus:outline-0 focus:ring-2 focus:ring-primary border-transparent h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal disabled:cursor-not-allowed"
                        disabled
                        id="boardType"
                        value={initialData.boardLabel}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500">
                        <span className="material-symbols-outlined">lock</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label
                      className="text-[#111816] dark:text-white text-base font-medium leading-normal pb-2 block"
                      htmlFor="postTitle"
                    >
                      제목<span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111816] dark:text-white bg-white dark:bg-gray-900 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal"
                      id="postTitle"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label
                    className="text-[#111816] dark:text-white text-base font-medium leading-normal pb-2 block"
                    htmlFor="postContent"
                  >
                    내용<span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    className="form-textarea flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#111816] dark:text-white bg-white dark:bg-gray-900 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary h-60 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal"
                    id="postContent"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>

                {/* File Attachments */}
                <div>
                  <p className="text-[#111816] dark:text-white text-base font-medium leading-normal pb-2 block">
                    첨부 파일
                  </p>
                  <div className="flex flex-col gap-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
                    {/* Existing Files */}
                    {initialData.existingFiles && initialData.existingFiles.length > 0 && (
                      <>
                        {initialData.existingFiles.map((filename: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary">description</span>
                              <span className="text-[#111816] dark:text-white text-sm">{filename}</span>
                            </div>
                            <button
                              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                              onClick={() => removeExistingFile(idx)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                          </div>
                        ))}
                      </>
                    )}

                    {/* New Files Upload */}
                    <div className="relative mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-800">
                      <span className="material-symbols-outlined text-4xl text-primary mb-2">upload_file</span>
                      <p className="text-gray-600 dark:text-gray-400">파일을 드래그 앤 드롭하거나 클릭하여 업로드하세요</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">PNG, JPG, GIF (최대 10MB)</p>
                      <input
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        multiple
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>

                    {/* Info Message */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                      <span className="material-symbols-outlined text-base align-middle mr-1">info</span>
                      새로운 파일을 업로드하면 기존 파일은 모두 삭제되고 새로 첨부됩니다.
                    </p>

                    {/* New Files Preview */}
                    {form.files.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {form.files.map((file, index) => (
                          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
                            <img
                              alt={`New file ${index + 1}`}
                              className="w-full h-full object-cover"
                              src={URL.createObjectURL(file)}
                            />
                            <button
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeNewFile(index)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-6">
                  <Link
                    to={`/community/${id}`}
                    className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-gray-200 dark:bg-gray-700 text-[#111816] dark:text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <span className="truncate">취소</span>
                  </Link>
                  <button
                    className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-[#111816] text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90"
                    type="submit"
                  >
                    <span className="truncate">수정</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 기존 커뮤니티 레이아웃 (실종/보호/제보)
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                커뮤니티 글 수정
              </h1>
            </div>

            <div className="bg-white dark:bg-background-dark/80 rounded-xl shadow-sm p-6 md:p-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="flex flex-col">
                      <p className="text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">게시판</p>
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-500 dark:text-gray-400 focus:outline-0 focus:ring-0 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 h-14 p-[15px] text-base font-normal leading-normal cursor-not-allowed"
                        disabled
                        readOnly
                        value={initialData.boardLabel}
                      />
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex flex-col">
                      <p className="text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                        제목 *
                      </p>
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex flex-col">
                    <p className="text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">내용 *</p>
                    <textarea
                      className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 min-h-60 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                    />
                  </label>
                </div>

                <div>
                  <p className="text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">첨부 파일</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-primary/20 text-gray-800 dark:text-gray-200 rounded-lg px-4 py-3 text-sm">
                      <span className="material-symbols-outlined text-primary">lightbulb</span>
                      <p>새로운 파일을 업로드하면 기존 첨부 파일은 모두 삭제됩니다.</p>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">
                          upload_file
                        </span>
                        <p className="text-gray-600 dark:text-gray-400">파일을 드래그 앤 드롭하거나 클릭하여 업로드하세요</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF (최대 5MB)</p>
                      </div>
                      <input className="sr-only" multiple type="file" />
                    </div>
                    {initialData.existingFiles && initialData.existingFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">현재 첨부된 파일:</p>
                        {initialData.existingFiles.map((filename: string, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-gray-500">description</span>
                              <span className="text-sm text-gray-800 dark:text-gray-200">{filename}</span>
                            </div>
                            <button className="text-gray-500 hover:text-red-500" type="button">
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to={`/community/${id}`}
                    className="flex w-full sm:w-auto items-center justify-center rounded-lg h-12 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span className="truncate">취소</span>
                  </Link>
                  <button
                    className="flex w-full sm:w-auto items-center justify-center rounded-lg h-12 px-6 bg-primary text-gray-900 text-base font-bold leading-normal tracking-[0.015em] hover:brightness-90 transition-all"
                    type="submit"
                  >
                    <span className="truncate">수정</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
