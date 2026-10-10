import { useQuery } from '@tanstack/react-query';
import { shelterObservations } from '../../api/publicShelters.api';
import { koreaToday, observationDays, shiftDate } from '../../utils/shelterDiscovery';

export default function ShelterHistory({ shelterId }: { shelterId: number }) {
  const to = koreaToday();
  const from = shiftDate(to, -29);
  const result = useQuery({ queryKey: ['shelter-observations', shelterId, from, to],
    queryFn: ({ signal }) => shelterObservations(shelterId, from, to, signal), retry: false });
  const days = observationDays(from, to, result.data || []);
  const maximum = Math.max(1, ...days.map(day => day.point?.protectedCount ?? 0));
  const top = maximum <= 5 ? 5 : Math.ceil(maximum / 10) * 10;
  return <section aria-label="날짜별 보호중 기록" className="mt-4 rounded-xl border border-brand-border bg-white p-4 dark:bg-card-dark md:p-6">
    <h3 className="text-lg font-bold">날짜별 보호중 기록</h3>
    <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-gray-300">날짜별 전체 보호중 수 · 접수일 제한 없음</p>
    <p className="text-xs leading-5 text-brand-muted dark:text-gray-300">최근 30일 · {from} – {to}</p>
    {result.isPending ? <p role="status" className="py-10">기록을 불러오고 있어요.</p>
      : result.isError ? <div role="alert" className="py-6"><p>기록을 불러오지 못했어요.</p><button type="button" onClick={() => void result.refetch()} className="mt-2 min-h-11 underline">기록 다시 불러오기</button></div>
      : !result.data.length ? <p className="py-10 text-sm">아직 쌓인 기록이 없어요. 기록이 시작된 날부터 보여드려요.</p>
      : <>
        {[320, 640].map(width => <svg key={width} role="img" aria-label="최근 30일 일별 보호중 동물 수. 상세 수치는 아래 표에서 확인할 수 있습니다." viewBox={`0 0 ${width} 200`} className={`mt-5 w-full ${width === 320 ? 'md:hidden' : 'hidden md:block'}`}>
          {[0, top / 2, top].map(value => <g key={value}><line x1="36" y1={165 - value / top * 140} x2={width - 12} y2={165 - value / top * 140} className="stroke-brand-border" /><text x="28" y={169 - value / top * 140} textAnchor="end" fontSize="12" fill="currentColor">{value}</text></g>)}
          {days.map(({ date, point }, index) => <g key={date}><title>{date}: {point ? `${point.protectedCount}마리` : '기록 없음'}</title>
            {point ? point.protectedCount === 0
              ? <circle cx={40 + index * (width - 50) / 30} cy="165" r="2.5" fill="currentColor" />
              : <rect x={37 + index * (width - 50) / 30} y={165 - point.protectedCount / top * 140} width={width === 320 ? 6 : 14} height={point.protectedCount / top * 140} rx="2" className="fill-brand stroke-brand-border" />
              : <text x={40 + index * (width - 50) / 30} y="182" textAnchor="middle" fontSize="10">–</text>}
          </g>)}
          {[0, 14, 29].map(index => <text key={index} x={40 + index * (width - 50) / 30} y="198" textAnchor="middle" fontSize="12">{days[index]?.date.slice(5).replace('-', '.')}</text>)}
        </svg>)}
        <p className="mt-3 text-xs leading-5">막대: 기록한 마릿수 · 점: 0마리 · 대시(–): 기록 없음</p>
        <details className="mt-2 text-sm"><summary className="min-h-11 cursor-pointer py-3 underline">날짜별 마릿수 보기</summary>
          <div className="max-h-64 overflow-auto"><table className="w-full text-left text-xs"><caption className="sr-only">날짜별 보호중 기록</caption><thead><tr><th scope="col" className="py-2">날짜</th><th scope="col">마릿수</th></tr></thead><tbody>
            {days.map(({ date, point }) => <tr key={date} className="border-t border-brand-border"><th scope="row" className="py-2 font-normal">{date}</th><td>{point ? `${point.protectedCount}마리` : '기록 없음'}</td></tr>)}
          </tbody></table></div>
        </details>
      </>}
    <p className="mt-3 text-xs leading-5 text-brand-muted dark:text-gray-300">수집된 보호중 정보의 일별 기록입니다. 수치 감소가 입양을 뜻하지는 않으며, 기록 없는 날은 0으로 계산하지 않습니다.</p>
  </section>;
}
