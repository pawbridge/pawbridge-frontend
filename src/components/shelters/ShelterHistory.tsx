import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { shelterObservations } from '../../api/publicShelters.api';
import { koreaToday, observationDays, protectedCountRange, shiftDate } from '../../lib/shelterDiscovery';

export default function ShelterHistory({ shelterId }: { shelterId: number }) {
  const to = koreaToday();
  const from = shiftDate(to, -29);
  const result = useQuery({ queryKey: ['shelter-observations', shelterId, from, to],
    queryFn: ({ signal }) => shelterObservations(shelterId, from, to, signal), retry: false });
  const days = observationDays(from, to, result.data || []);
  const { low, high } = protectedCountRange(days.flatMap(day => day.point ? [day.point.protectedCount] : []));
  const y = (value: number) => 165 - (value - low) / (high - low) * 140;
  // 기록 없는 날에서 선을 끊는다. 이어진 기록일끼리 한 줄이 된다.
  const segments = days.reduce<{ index: number; value: number }[][]>((lines, { point }, index) => {
    if (!point) return lines.at(-1)?.length ? [...lines, []] : lines;
    const last = lines.at(-1) ?? [];
    return [...lines.slice(0, -1), [...last, { index, value: point.protectedCount }]];
  }, [[]]).filter(line => line.length);
  // 점이나 칸에 마우스를 올리거나 누른 날의 수치를 그래프 위에 보여 준다. 처음에는 마지막 기록일을 보여 준다.
  const [selected, setSelected] = useState<string | null>(null);
  const activeDate = selected ?? [...days].reverse().find(day => day.point)?.date;
  const active = days.find(day => day.date === activeDate);
  return <section aria-label="날짜별 보호중 기록" className="mt-4 rounded-xl border border-brand-border bg-white p-4 dark:bg-card-dark md:p-6">
    <h3 className="text-lg font-bold">날짜별 보호중 기록</h3>
    <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-gray-300">날짜별 전체 보호중 수(접수일 제한 없음)</p>
    <p className="text-xs leading-5 text-brand-muted dark:text-gray-300">최근 30일, {from} – {to}</p>
    {result.isPending ? <p role="status" className="py-10">기록을 불러오고 있어요.</p>
      : result.isError ? <div role="alert" className="py-6"><p>기록을 불러오지 못했어요.</p><button type="button" onClick={() => void result.refetch()} className="mt-2 min-h-11 underline-offset-4 hover:underline">기록 다시 불러오기</button></div>
      : !result.data.length ? <p className="py-10 text-sm">아직 쌓인 기록이 없어요. 기록이 시작된 날부터 보여드려요.</p>
      : <>
        <p className="mt-4 min-h-6 text-sm font-medium" aria-live="polite">{active ? `${active.date.slice(5).replace('-', '.')} 보호중 ${active.point ? `${active.point.protectedCount.toLocaleString()}마리` : '기록 없음'}` : ''}</p>
        <p className="text-xs leading-5 text-brand-muted dark:text-gray-300">그래프에 마우스를 올리거나 누르면 그날의 수치를 보여드려요.</p>
        {[320, 1200].map(width => <svg key={width} role="img" aria-label="최근 30일 일별 보호중 동물 수. 상세 수치는 아래 표에서 확인할 수 있습니다." viewBox={`0 0 ${width} 200`} className={`mt-3 w-full ${width === 320 ? 'md:hidden' : 'hidden md:block'}`}>
          {[low, (low + high) / 2, high].map(value => <g key={value}><line x1="36" y1={y(value)} x2={width - 12} y2={y(value)} className="stroke-brand-border" /><text x="28" y={y(value) + 4} textAnchor="end" fontSize="12" fill="currentColor">{value}</text></g>)}
          {segments.map(line => <polyline key={line[0].index} points={line.map(({ index, value }) => `${40 + index * (width - 50) / 30},${y(value)}`).join(' ')} fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-brand-accent" />)}
          {days.map(({ date, point }, index) => <g key={date}>
            {point
              ? <circle cx={40 + index * (width - 50) / 30} cy={y(point.protectedCount)} r={date === activeDate ? 5 : 3} strokeWidth="2" className={date === activeDate ? 'fill-brand-accent stroke-brand-accent' : 'fill-white stroke-brand-accent dark:fill-card-dark'} />
              : <text x={40 + index * (width - 50) / 30} y="182" textAnchor="middle" fontSize="10">–</text>}
            {/* 점이 작아서 그날 칸 전체를 마우스와 터치 영역으로 둔다. 키보드 사용자는 아래 표로 같은 수치를 본다. */}
            <rect x={40 + (index - 0.5) * (width - 50) / 30} y="20" width={(width - 50) / 30} height="170" fill="transparent" onPointerEnter={() => setSelected(date)} onClick={() => setSelected(date)} />
          </g>)}
          {[0, 14, 29].map(index => <text key={index} x={40 + index * (width - 50) / 30} y="198" textAnchor="middle" fontSize="12">{days[index]?.date.slice(5).replace('-', '.')}</text>)}
        </svg>)}
        <p className="mt-3 text-xs leading-5">선은 기록한 마릿수이고, 대시(–)는 기록이 없는 날이라 선을 끊었어요. 흐름이 보이도록 세로축은 0이 아닌 값에서 시작할 수 있어요. 진한 점이 위에 수치를 보여 주는 날이에요.</p>
        <details className="mt-2 text-sm"><summary className="min-h-11 cursor-pointer py-3 underline-offset-4 hover:underline">날짜별 마릿수 보기</summary>
          <div className="max-h-64 overflow-auto"><table className="w-full text-left text-xs"><caption className="sr-only">날짜별 보호중 기록</caption><thead><tr><th scope="col" className="py-2">날짜</th><th scope="col">마릿수</th></tr></thead><tbody>
            {days.map(({ date, point }) => <tr key={date} className="border-t border-brand-border"><th scope="row" className="py-2 font-normal">{date}</th><td>{point ? `${point.protectedCount}마리` : '기록 없음'}</td></tr>)}
          </tbody></table></div>
        </details>
      </>}
    <p className="mt-3 text-xs leading-5 text-brand-muted dark:text-gray-300">수집된 보호중 정보의 일별 기록입니다. 수치 감소가 입양을 뜻하지는 않으며, 기록 없는 날은 0으로 계산하지 않습니다.</p>
  </section>;
}
