import { useState } from 'react';
import { travelImageUrl } from '../../lib/travel';

export default function TravelImage({ url, title, eager = false }: {
  url: string | null; title: string; eager?: boolean;
}) {
  const source = travelImageUrl(url);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const visible = source && source !== failedSource;

  return (
    <figure className="w-full">
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {visible ? (
          <img src={source} alt={`${title} 장소 사진`} width={800} height={600}
            loading={eager ? 'eager' : 'lazy'} decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain" onError={() => setFailedSource(source)} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            사진 준비 중
          </div>
        )}
      </div>
    </figure>
  );
}
