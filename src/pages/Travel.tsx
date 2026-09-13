import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getTravelPlaces, getTravelRegions } from '../api/travel.api';
import TravelLayout from '../components/travel/TravelLayout';
import TravelFeedback from '../components/travel/TravelFeedback';
import TravelPlaceCard from '../components/travel/TravelPlaceCard';
import TravelSource from '../components/travel/TravelSource';
import { isTravelRegionCode } from '../lib/travel';

export default function Travel() {
  const [params, setParams] = useSearchParams();
  const areaCodes = params.getAll('areaCode');
  const areaCode = areaCodes.length === 1 ? areaCodes[0] : '';
  const regions = useQuery({
    queryKey: ['travel', 'regions'], queryFn: ({ signal }) => getTravelRegions(signal), retry: false,
  });
  const region = isTravelRegionCode(areaCode)
    ? regions.data?.items.find((item) => item.code === areaCode) : undefined;
  const places = useQuery({
    queryKey: ['travel', 'places', areaCode],
    queryFn: ({ signal }) => getTravelPlaces(areaCode, signal),
    enabled: !!region, retry: false,
  });

  return (
    <TravelLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black leading-tight tracking-[-0.033em] sm:text-4xl sm:leading-tight">동반여행</h1>
          <p className="mt-2 text-base leading-6 text-gray-600 dark:text-gray-400 [word-break:keep-all]">반려동물과 방문할 장소, 동반 조건부터 살펴보세요.</p>
        </div>
        <div className="w-full lg:w-80 lg:shrink-0">
          <label htmlFor="travel-region" className="mb-2 block text-sm font-semibold">지역 (시·도)</label>
          <select id="travel-region" value={region?.code ?? ''}
            disabled={!regions.data?.items.length}
            onChange={(event) => setParams(event.target.value ? { areaCode: event.target.value } : {})}
            className="h-12 w-full rounded-lg border-border-light bg-white text-base leading-6 focus:border-emerald-700 focus:ring-emerald-700 disabled:bg-gray-100 dark:border-border-dark dark:bg-card-dark dark:disabled:bg-gray-800">
            <option value="">지역을 선택해 주세요</option>
            {regions.data?.items.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
      </div>

      {regions.isPending ? (
        <TravelFeedback title="지역 정보를 불러오고 있어요" description="잠시만 기다려 주세요." />
      ) : regions.isError ? (
        <TravelFeedback error title="지역 정보를 불러오지 못했어요" description="잠시 후 다시 시도해 주세요." onRetry={() => void regions.refetch()} />
      ) : !regions.data.items.length ? (
        <TravelFeedback title={regions.data.availability === 'FAILED' ? '지역 정보 수집이 지연되고 있어요' : '지역 정보를 준비 중이에요'}
          description="아직 지역 정보를 수집하지 못했습니다. 잠시 후 다시 확인해 주세요." />
      ) : !region ? (
        <TravelFeedback title={areaCodes.length ? '지역을 다시 선택해 주세요' : '어느 지역을 살펴볼까요?'}
          description={areaCodes.length ? '이 주소의 지역은 조회할 수 없습니다. 위에서 지역을 선택해 주세요.' : '지역을 선택하면 동반여행 장소와 방문 전 확인할 조건을 볼 수 있어요.'} />
      ) : (
        <section aria-labelledby="travel-results-title" className="space-y-6">
          <div>
            <h2 id="travel-results-title" className="text-xl font-bold leading-tight tracking-[-0.015em] sm:text-2xl sm:leading-tight">{region.name}의 동반여행 장소</h2>
            {places.data?.previewOnly && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">지역별 일부 장소를 최대 10곳까지 보여드려요. 전체 목록은 아닙니다.</p>}
          </div>
          {places.data?.availability === 'PREPARING' && (
            <p role="status" className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-600 dark:bg-card-dark dark:text-gray-400">
              이 지역의 장소 정보를 수집 중이에요. 준비가 끝난 장소부터 보여드려요.
            </p>
          )}
          {(places.data?.availability === 'FAILED' || places.data?.availability === 'STALE') && (
            <p role="status" className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-600 dark:bg-card-dark dark:text-gray-400">
              장소 정보 갱신이 지연되고 있어요. 이전에 확인한 정보가 있다면 계속 보여드려요.
            </p>
          )}
          {places.isPending ? (
            <TravelFeedback title="장소를 불러오고 있어요" description="선택한 지역의 장소 정보를 확인하고 있습니다." />
          ) : places.isError ? (
            <TravelFeedback error title="장소를 불러오지 못했어요" description="연결 상태를 확인하거나 잠시 후 다시 시도해 주세요." onRetry={() => void places.refetch()} />
          ) : !places.data.items.length && (places.data.availability === 'PREPARING' || places.data.availability === 'FAILED') ? (
            <TravelFeedback title="장소 정보를 준비 중이에요" description="아직 수집을 마치지 못했습니다. 이 지역에 장소가 없다는 뜻은 아니에요." />
          ) : !places.data.items.length ? (
            <TravelFeedback title="현재 표시할 장소가 없어요" description="이 지역에 동반 가능한 장소가 없다는 뜻은 아닙니다. 다른 지역을 살펴보세요." />
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {places.data.items.map((place) => <TravelPlaceCard key={place.contentId} place={place} region={region} />)}
            </ul>
          )}
          {places.data?.availability === 'PARTIAL' && <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">현재 수집된 장소부터 보여드리고 있어요. 이 지역의 전체 목록은 확인 중입니다.</p>}
          <p className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-600 dark:bg-card-dark dark:text-gray-400">동반 가능 범위와 준비물은 장소마다 다릅니다. 상세 안내를 확인하고, 방문 전 운영처에 최신 조건을 확인해 주세요.</p>
          {places.data && <TravelSource fetchedAt={places.data.fetchedAt} />}
        </section>
      )}
    </TravelLayout>
  );
}
