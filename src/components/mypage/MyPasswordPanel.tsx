import type { FormEventHandler } from 'react';
import type { PasswordUpdateRequest } from '../../types/user.types';

interface MyPasswordPanelProps {
  provider: string | null;
  providerLabel: string;
  value: PasswordUpdateRequest;
  onChange: (value: PasswordUpdateRequest) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isPending: boolean;
}

export default function MyPasswordPanel({
  provider,
  providerLabel,
  value,
  onChange,
  onSubmit,
  isPending,
}: MyPasswordPanelProps) {
  return (
    <>
      <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
        비밀번호 변경
      </h2>

      {provider !== 'LOCAL' && provider !== null ? (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {providerLabel} 계정은 비밀번호를 변경할 수 없습니다.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={value.currentPassword}
              onChange={(e) => onChange({ ...value, currentPassword: e.target.value })}
              className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-focus focus:ring-brand-focus"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              value={value.newPassword}
              onChange={(e) => onChange({ ...value, newPassword: e.target.value })}
              className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-focus focus:ring-brand-focus"
            />
            <p className="text-xs text-gray-500 mt-1">
              8~20자의 영문, 숫자, 특수문자를 포함해야 합니다.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => onChange({ currentPassword: '', newPassword: '' })}
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
      )}
    </>
  );
}
