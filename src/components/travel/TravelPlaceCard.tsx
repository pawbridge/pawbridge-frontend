import { Link } from 'react-router-dom';
import type { TravelPlace, TravelRegion } from '../../types/travel.types';
import TravelImage from './TravelImage';

export default function TravelPlaceCard({ place, region, page = 0 }: { place: TravelPlace; region: TravelRegion; page?: number }) {
  return (
    <li className="min-w-0">
      <Link to={`/travel/${place.contentId}?areaCode=${region.code}${page > 0 ? `&page=${page + 1}` : ''}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-light bg-card-light shadow-sm transition-colors hover:border-brand-focus focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-focus dark:border-border-dark dark:bg-card-dark">
        <TravelImage url={place.imageUrl} title={place.title} />
        <div className="flex flex-1 flex-col items-start gap-2 p-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{region.name}</span>
          <h3 className="break-words text-lg font-bold leading-7">{place.title}</h3>
          <p className="mb-3 break-words text-sm leading-6 text-gray-600 dark:text-gray-400">{place.address || '주소 정보 확인 필요'}</p>
          <span className="mt-auto text-sm font-bold text-brand-accent dark:text-brand-accent">동반 조건 확인 <span aria-hidden="true">→</span></span>
        </div>
      </Link>
    </li>
  );
}
