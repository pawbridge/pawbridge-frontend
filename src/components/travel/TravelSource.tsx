import { travelFetchTime } from '../../lib/travel';

export default function TravelSource({ fetchedAt, petFetchedAt, source = 'KOREA_TOURISM_ORGANIZATION' }: {
  fetchedAt: string | null; petFetchedAt?: string | null; source?: string;
}) {
  const collected = travelFetchTime(fetchedAt);
  const petCollected = travelFetchTime(petFetchedAt ?? null);
  return (
    <div className="space-y-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
      {source === 'KOREA_TOURISM_ORGANIZATION' ? (
        <p>관광정보·사진 제공: <a href="https://api.visitkorea.or.kr/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">ⓒ한국관광공사</a>
          {' · '}<a href="https://api.visitkorea.or.kr/#/useServiceGuide/2" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">저작권 정책</a>
        </p>
      ) : <p>정보 제공 기관 확인 필요</p>}
      {collected && <p>장소 정보 수집 시각: {collected} (한국 시간)</p>}
      {petCollected && <p>동반 안내 수집 시각: {petCollected} (한국 시간)</p>}
      <p>수집 시각은 실제 운영 정책을 확인한 시각이 아닙니다.</p>
    </div>
  );
}
