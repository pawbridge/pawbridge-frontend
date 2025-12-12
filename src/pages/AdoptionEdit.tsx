import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';

const initial = {
  title: '우리집 복덩이, 사랑스러운 뭉치를 소개해요!',
  content: `뭉치가 우리 가족이 된 지 벌써 1년이 지났네요. 처음에는 낯을 많이 가리고 구석에만 숨어있어서 마음이 아팠는데, 이제는 제 무릎에서 잠드는 게 일상이 되었어요. 뭉치가 온 후로 집안에 웃음꽃이 끊이질 않아요. 사지 말고 입양하세요!`,
  existingImages: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD4ehhEonDO7C8Z1pPPQjxv8xiKRaMHimyLPgxQCRDchvr5uNK21Nl4WrUTIyEESrcXBTosD8sZGHCxRaLPo0FIQ-CTHCtHmMcC2tegYdIzKwRvbxVOpRYg4c2RfNVhD1aTlMpin3VUFWaYk46DJVV9qq6G0jyouPpVcyS7hPDH0SLzZHSlnwsb82HhiefodEcJY5xenQdc28FcY8ggRP2WkwAw35sb3uEFkcMBGzuvfUzfZAPTI-vbK6dudPz2DOxnPV2bVyFDNV0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD2KBVjyXDAZzfA9hkApdTVP-TlUaGCH-IsqlRviMRDBwZ2IWLgnVkTf5YBoT2w9cDhI1RYzAC7aAEirvwOCX0l4YLoIsHmF1MXj8Tj_A3KKISf9VaqrYOmKHQOBgma_pD4LumbTFdm7Ep4doL3P5vXl6n4WWWmcjN5IEFQDZzSRgJvYC8RRuy1BGS0utA_GBDEyNrpOqJcBNIiWMnlF8_poS13Pl0-W-Vo-fnqcYcvwtmMSwaKj_eA5BlqPZUqJsnFSXl7al2CsDQ',
  ],
};

export default function AdoptionEdit() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({
    title: initial.title,
    content: initial.content,
    files: [] as File[],
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <div className="layout-container flex h-full grow flex-col">
        <Header />
        <div className="flex flex-1 justify-center py-10 sm:py-16 px-4">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4 pb-8">
              <h1 className="text-[#111816] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                입양후기 수정
              </h1>
            </div>

            <div className="space-y-8 p-4">
              <label className="flex flex-col w-full">
                <p className="text-[#111816] dark:text-gray-300 text-base font-bold leading-normal pb-2">제목</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111816] dark:text-white dark:bg-background-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6e3] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label className="flex flex-col w-full">
                <p className="text-[#111816] dark:text-gray-300 text-base font-bold leading-normal pb-2">내용</p>
                <textarea
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111816] dark:text-white dark:bg-background-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6e3] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary min-h-60 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </label>

              <div className="flex flex-col w-full space-y-2">
                <h2 className="text-[#111816] dark:text-gray-300 text-lg font-bold leading-tight tracking-[-0.015em] text-left">
                  사진 등록
                </h2>
                <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-[#dbe6e3] dark:border-gray-700 px-6 py-14">
                  <div className="flex max-w-[480px] flex-col items-center gap-2">
                    <p className="text-[#111816] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">
                      파일을 드래그 앤 드롭하거나 클릭하여 업로드하세요
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal max-w-[480px] text-center">
                      💡 새로운 사진을 등록하면 기존 사진은 모두 삭제됩니다.
                    </p>
                  </div>
                  <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#f0f5f3] dark:bg-gray-700 text-[#111816] dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <span className="truncate">파일 선택</span>
                  </button>
                </div>
              </div>

              {/* Existing Images Section */}
              <div className="w-full">
                <h3 className="text-base font-bold text-[#111816] dark:text-gray-300 mb-3">현재 등록된 사진</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {initial.existingImages.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img
                        className="w-full h-full object-cover rounded-lg"
                        src={url}
                        alt={`Existing image ${idx + 1}`}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <button className="text-white">
                          <span className="material-symbols-outlined text-4xl">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 pt-8">
              <Link
                to={`/adoption/${id}`}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="truncate">취소</span>
              </Link>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] hover:brightness-90 transition-all">
                <span className="truncate">수정</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
