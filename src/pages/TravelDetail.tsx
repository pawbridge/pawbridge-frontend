import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getTravelDetail, getTravelRegions } from '../api/travel.api';
import TravelLayout from '../components/travel/TravelLayout';
import TravelFeedback from '../components/travel/TravelFeedback';
import TravelImage from '../components/travel/TravelImage';
import { isTravelContentId, travelListPath, travelText, travelConditionsNotice, travelPage } from '../lib/travel';
import type { TravelConditions } from '../types/travel.types';

const coreFields = [
  ['areas', '동반 가능 구역'], ['allowedAnimals', '동반 가능한 동물'], ['requirements', '필수 준비물·이용 조건'],
] as const satisfies ReadonlyArray<readonly [keyof TravelConditions, string]>;
const extraFields = [
  ['otherInformation', '추가 동반 안내'], ['risks', '주의 사항'], ['facilities', '동반 시설'], ['providedItems', '제공 물품'],
] as const satisfies ReadonlyArray<readonly [keyof TravelConditions, string]>;

export default function TravelDetail() {
  const { contentId = '' } = useParams();
  const [params] = useSearchParams();
  const areaCodes = params.getAll('areaCode');
  const areaCode = areaCodes.length === 1 ? areaCodes[0] : '';
  const validId = isTravelContentId(contentId);
  const detail = useQuery({
    queryKey: ['travel', 'detail', contentId],
    queryFn: ({ signal }) => getTravelDetail(contentId, signal), enabled: validId, retry: false,
  });
  const regions = useQuery({
    queryKey: ['travel', 'regions'], queryFn: ({ signal }) => getTravelRegions(signal),
    enabled: validId && !!areaCode, retry: false,
  });
  const region = regions.data?.items.find((item) => item.code === areaCode);
  const data = detail.data;
  const conditionsNotice = data ? travelConditionsNotice(data.petInformationStatus, data.petInformationAvailable) : null;
  const status = isAxiosError(detail.error) ? detail.error.response?.status : undefined;
  const missing = status === 404 || status === 400;

  useEffect(() => { window.scrollTo(0, 0); }, [contentId]);

  return (
    <TravelLayout>
      <Link to={travelListPath(areaCode, travelPage(params.getAll('page')) ?? 0)} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded text-sm font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-focus">
        <span aria-hidden="true">←</span> {region ? `${region.name} 목록으로` : '장소 목록으로'}
      </Link>
      {!validId ? (
        <TravelFeedback error title="장소 주소를 확인해 주세요" description="올바르지 않은 장소 주소입니다. 목록에서 장소를 다시 선택해 주세요." />
      ) : detail.isPending ? (
        <TravelFeedback title="장소 정보를 불러오고 있어요" description="동반 조건을 함께 확인하고 있습니다." />
      ) : detail.isError ? (
        <TravelFeedback error title={missing ? '장소를 찾을 수 없어요' : '장소 정보를 불러오지 못했어요'}
          description={missing ? '정보가 변경되었거나 제공이 중단되었을 수 있습니다. 목록에서 다른 장소를 살펴보세요.' : '잠시 후 다시 시도해 주세요. 동반 가능 여부는 아직 확인되지 않았습니다.'}
          onRetry={missing ? undefined : () => void detail.refetch()} />
      ) : data && (
        <article className="space-y-8">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.328125fr)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-xl"><TravelImage url={data.place.imageUrl} title={data.place.title} eager /></div>
            <div className="min-w-0">
              {region && <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{region.name}</p>}
              <h1 className="break-words text-3xl font-black leading-tight tracking-[-0.033em] sm:text-4xl sm:leading-tight">{data.place.title}</h1>
              <p className="mt-3 break-words text-base leading-7 text-gray-600 dark:text-gray-400">{data.place.address || '주소 정보 확인 필요'}</p>
              <h2 className="mb-2 mt-6 text-xl font-bold leading-tight tracking-[-0.015em] sm:text-2xl sm:leading-tight">반려동물 동반 안내</h2>
              {conditionsNotice && <p className="mb-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{conditionsNotice}</p>}
              <dl className="divide-y divide-border-light border-y border-border-light dark:divide-border-dark dark:border-border-dark">
                {coreFields.map(([key, label]) => (
                  <div key={key} className="py-4">
                    <dt className="text-sm font-bold">{label}</dt>
                    <dd className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-gray-600 dark:text-gray-400">{travelText(data.conditions[key]) || '방문 전 확인 필요'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {travelText(data.overview) && (
            <section aria-labelledby="travel-overview"><h2 id="travel-overview" className="mb-3 text-xl font-bold">장소 소개</h2>
              <p className="whitespace-pre-line break-words text-sm leading-7 text-gray-600 dark:text-gray-400">{travelText(data.overview)}</p>
            </section>
          )}
          {extraFields.some(([key]) => travelText(data.conditions[key])) && (
            <section aria-labelledby="travel-extra"><h2 id="travel-extra" className="mb-3 text-xl font-bold">추가 이용 안내</h2>
              <dl className="grid gap-6 sm:grid-cols-2">{extraFields.filter(([key]) => travelText(data.conditions[key])).map(([key, label]) => (
                <div key={key}><dt className="text-sm font-bold">{label}</dt><dd className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-gray-600 dark:text-gray-400">{travelText(data.conditions[key])}</dd></div>
              ))}</dl>
            </section>
          )}
          <aside className="rounded-lg bg-gray-50 p-5 dark:bg-card-dark">
            <h2 className="text-sm font-bold">방문 전 확인해 주세요</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">장소가 목록에 있거나 안내가 비어 있어도 모든 반려동물이 입장할 수 있다는 뜻은 아닙니다. 동물의 종류·크기, 출입 구역과 준비물을 운영처에 확인해 주세요. 안내견 허용은 일반 반려동물 허용과 다를 수 있습니다.</p>
          </aside>
        </article>
      )}
    </TravelLayout>
  );
}
