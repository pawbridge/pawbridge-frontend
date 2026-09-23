import type { FormEventHandler } from 'react';
import type { UserInfoResponse } from '../../types/user.types';

interface MyProfilePanelProps {
  userInfo: Pick<UserInfoResponse, 'email' | 'name' | 'nickname'>;
  providerLabel: string;
  roleLabel: string;
  joinedAtLabel: string;
  nickname: string;
  onNicknameChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isPending: boolean;
}

export default function MyProfilePanel({
  userInfo,
  providerLabel,
  roleLabel,
  joinedAtLabel,
  nickname,
  onNicknameChange,
  onSubmit,
  isPending,
}: MyProfilePanelProps) {
  return (
    <>
      <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
        프로필 정보
      </h2>

      <div className="mt-8 space-y-6">
        {/* 기본 정보 (읽기 전용) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              value={userInfo.email}
              readOnly
              className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
            <input
              type="text"
              value={userInfo.name}
              readOnly
              className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              닉네임
            </label>
            <input
              type="text"
              value={userInfo.nickname || '미설정'}
              readOnly
              className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              가입 경로
            </label>
            <input
              type="text"
              value={providerLabel}
              readOnly
              className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">권한</label>
            <input
              type="text"
              value={roleLabel}
              readOnly
              className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              가입일시
            </label>
            <input
              type="text"
              value={joinedAtLabel}
              readOnly
              className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
            />
          </div>
        </div>

        {/* 닉네임 변경 폼 */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">닉네임 변경</h3>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                새 닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                placeholder="2~30자의 한글, 영문, 숫자"
                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-focus focus:ring-brand-focus"
              />
              <p className="text-xs text-gray-500 mt-1">
                한글, 영문, 숫자를 사용할 수 있으며 띄어쓰기가 불가능합니다.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onNicknameChange('')}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-text-main dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2 bg-brand text-text-main rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
              >
                {isPending ? '변경 중...' : '변경하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
