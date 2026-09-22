import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number | '';
  onChange: (value: string | number | '') => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  disabled = false,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // 다음 이벤트 루프에서 등록하여 현재 클릭 이벤트가 먼저 처리되도록
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full appearance-none rounded-lg border border-brand-border dark:border-stone-700
          bg-white dark:bg-card-dark px-4 py-3 pr-10 text-left relative
          text-brand-ink dark:text-white
          focus:border-brand-focus focus:ring-1 focus:ring-brand-focus
          outline-none transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-brand-focus ring-1 ring-brand-focus' : ''}
        `}
        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
      >
        <span className={selectedOption ? '' : 'text-brand-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-gray-400 pointer-events-none transition-transform z-10">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white dark:bg-card-dark border border-brand-border dark:border-stone-700 rounded-lg shadow-xl overflow-hidden" style={{ position: 'absolute', zIndex: 9999 }}>
          <div className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-brand-muted text-center">
                옵션이 없습니다
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!option.disabled) {
                      handleSelect(option.value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  disabled={option.disabled}
                  className={`
                    w-full px-4 py-3 text-left text-sm
                    transition-colors
                    ${
                      value === option.value
                        ? 'bg-brand/10 text-brand-accent font-medium'
                        : 'text-brand-ink dark:text-white hover:bg-brand-soft dark:hover:bg-stone-800'
                    }
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {value === option.value && (
                      <span className="material-symbols-outlined text-[18px] text-brand-accent">
                        check
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
