import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';

export default function AdoptionCreate() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    files: [] as File[],
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8">
          <div className="p-4">
            <p className="text-[#111816] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              입양후기 작성
            </p>
          </div>

          <div className="space-y-8 p-4 bg-white dark:bg-[#1A2C28] rounded-xl shadow-sm">
            <div className="flex flex-col">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-[#111816] dark:text-gray-200 text-base font-medium leading-normal pb-2">제목 *</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111816] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary focus:ring-opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                  placeholder="소중한 가족이 된 아이의 이야기를 들려주세요."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
            </div>

            <div className="flex flex-col">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-[#111816] dark:text-gray-200 text-base font-medium leading-normal pb-2">내용 *</p>
                <textarea
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111816] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary focus:ring-opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary min-h-60 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                  placeholder="입양한 아이의 이름, 나이, 성격, 함께 지내며 있었던 행복한 순간들을 자유롭게 작성해주세요."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </label>
            </div>

            <div className="flex flex-col p-4 bg-background-light dark:bg-background-dark rounded-lg">
              <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-14">
                <div className="flex max-w-[480px] flex-col items-center gap-2">
                  <p className="text-[#111816] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">
                    사진 첨부 (선택)
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal max-w-[480px] text-center">
                    최대 10장까지 업로드할 수 있습니다.
                  </p>
                </div>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700 text-[#111816] dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600">
                  <span className="truncate">파일 선택</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 p-4">
              <Link
                to="/adoption"
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-gray-200 dark:bg-gray-700 text-[#111816] dark:text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                <span className="truncate">취소</span>
              </Link>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-[#111816] text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-80">
                <span className="truncate">등록</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
