import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import type { RegionalAnimalStats as RegionalStats } from '../../types/api.types';
import { bubbleRadius, buildRegionRows, normalizeRegion, provinces } from './regionalStats';
import StatsDialog from './StatsDialog';

const mapCenter: [number, number] = [127.7, 35.95];
const buttonClass = 'min-h-11 rounded-lg border border-border-light px-4 text-sm font-semibold transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 dark:border-border-dark';

export default function RegionalAnimalStats({ data }: { data: RegionalStats[] }) {
  const rows = useMemo(() => buildRegionRows(data), [data]);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const maximum = Math.max(0, ...rows.map(row => row.count));
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ coordinates: mapCenter, zoom: 1 });
  const selectedRow = rows.find(row => row.name === selected);
  const mappedRows = rows.map(row => ({ ...row, province: provinces.find(p => p.name === row.name) }));
  const legendValues = maximum > 0 ? [...new Set([Math.max(1, Math.round(maximum / 10)), Math.max(1, Math.round(maximum / 2)), maximum])] : [];

  const details = (
    <div aria-live="polite" aria-atomic="true" className="rounded-xl border border-primary/40 bg-primary/10 p-4 sm:p-5">
      {selectedRow ? <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-bold">{selectedRow.name}</h3>
          <p className="mt-1"><strong className="text-2xl">{selectedRow.count.toLocaleString()}건</strong><span className="ml-3 text-sm">전국 공고의 {total ? (selectedRow.count / total * 100).toFixed(1) : '0'}%</span></p>
          {selectedRow.count === 0 && <p className="mt-1 text-sm">선택 기간에 등록된 공고가 없습니다.</p>}
        </div>
        <button type="button" onClick={() => setSelected(null)} className={buttonClass}>선택 해제</button>
      </div> : <><h3 className="font-bold">관심 지역을 선택해 주세요</h3><p className="mt-1 text-sm">지도 또는 아래 목록에서 지역별 공고 수를 확인할 수 있어요.</p></>}
    </div>
  );

  const drawMap = (zoomed: boolean) => {
    const layers = <>
      <Geographies geography="/korea-provinces-topo.json">
        {({ geographies }) => geographies.map(geo => {
          const name = normalizeRegion(geo.properties.name as string);
          return <Geography key={geo.rsmKey} geography={geo} tabIndex={-1}
            onClick={() => setSelected(name)}
            className={`cursor-pointer stroke-emerald-700/40 transition-colors hover:fill-primary/40 dark:stroke-primary/50 ${selected === name ? 'fill-primary/40' : 'fill-primary/10'}`}
            strokeWidth={selected === name ? 1.8 : 0.6} />;
        })}
      </Geographies>
      {/* Render smaller bubbles last so nearby cities remain selectable. */}
      {mappedRows.filter(row => row.province && row.count > 0).map(row => (
        <Marker key={row.name} coordinates={[...row.province!.coordinates]} onClick={() => setSelected(row.name)}>
          <circle r={bubbleRadius(row.count, maximum)} className="cursor-pointer fill-primary stroke-emerald-800 dark:stroke-emerald-100"
            strokeWidth={selected === row.name ? 2.5 : 1} opacity={selected && selected !== row.name ? 0.4 : 0.9}>
            <title>{row.name} · {row.count.toLocaleString()}건</title>
          </circle>
        </Marker>
      ))}
      {provinces.filter(p => ['강원', '경북', '전남', '제주'].includes(p.short)).map(p => (
        <Marker key={p.short} coordinates={[...p.coordinates]}>
          <text textAnchor="middle" y={p.short === '강원' ? -47 : 48} className="pointer-events-none fill-text-light text-[13px] font-semibold dark:fill-text-dark">{p.short}</text>
        </Marker>
      ))}
    </>;
    return <ComposableMap projection="geoMercator" projectionConfig={{ center: mapCenter, scale: 4800 }} width={500} height={620}
      role="img" aria-label="17개 시·도 공고 분포. 원 면적은 공고 수에 비례하며, 정확한 값은 지역 목록에서 확인할 수 있습니다."
      className={`mx-auto h-auto w-full ${zoomed ? 'max-w-[580px] touch-none' : 'max-w-[680px]'}`}>
      {zoomed ? <ZoomableGroup center={position.coordinates} zoom={position.zoom} minZoom={1} maxZoom={3}
        onMoveEnd={p => setPosition({ coordinates: p.coordinates, zoom: p.zoom })}>{layers}</ZoomableGroup> : layers}
    </ComposableMap>;
  };

  return <div className="space-y-5 text-text-light dark:text-text-dark">
    <button type="button" onClick={() => { setPosition({ coordinates: mapCenter, zoom: 1 }); setExpanded(true); }} className={`${buttonClass} w-full sm:w-auto`}>지도 크게 보기</button>
    <div className="rounded-xl border border-border-light bg-card-light p-4 sm:p-6 dark:border-border-dark dark:bg-card-dark">
      <h3 className="text-xl font-bold">지역별 공고 분포</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">지역을 누르거나 아래 목록에서 선택하세요.</p>
      {drawMap(false)}
      {legendValues.length > 0 && <svg viewBox="0 0 500 115" role="img" aria-label="원 면적 범례" className="mx-auto w-full max-w-[680px]">
        {legendValues.map((value, index) => <g key={value} transform={`translate(${500 / (legendValues.length + 1) * (index + 1)},0)`}>
          <circle cy={80 - bubbleRadius(value, maximum)} r={bubbleRadius(value, maximum)} className="fill-primary stroke-emerald-800 dark:stroke-emerald-100" />
          <text y={105} textAnchor="middle" className="fill-text-light text-[14px] dark:fill-text-dark">{value.toLocaleString()}건</text>
        </g>)}
      </svg>}
      <p className="mt-5 text-sm">원 면적 = 공고 건수 · 0건 지역도 아래 목록에서 선택할 수 있어요.</p>
    </div>
    {details}
    <div className="rounded-xl border border-border-light bg-card-light p-4 sm:p-6 dark:border-border-dark dark:bg-card-dark">
      <div className="mb-4 flex items-baseline justify-between gap-3"><h3 className="text-lg font-bold">지역별 비교</h3><span className="text-sm text-gray-600 dark:text-gray-300">많은 순 · {rows.length}개 지역</span></div>
      <ul className="space-y-2">
        {rows.map(row => <li key={row.name}>
          <button type="button" aria-pressed={selected === row.name} onClick={() => setSelected(row.name)}
            className={`min-h-12 w-full rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected === row.name ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-primary/10'}`}>
            <span className="mb-2 flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{row.name}</span><strong className="shrink-0 tabular-nums">{row.count.toLocaleString()}건</strong></span>
            <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><span className="block h-full rounded-full bg-primary" style={{ width: `${maximum ? row.count / maximum * 100 : 0}%` }} /></span>
          </button>
        </li>)}
      </ul>
    </div>
    {expanded && <StatsDialog title="전국 지도 확대" onClose={() => setExpanded(false)}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="지도 축소" disabled={position.zoom <= 1} onClick={() => setPosition(p => ({ ...p, zoom: Math.max(1, p.zoom - 0.5) }))} className={buttonClass}>−</button>
        <output className="px-2 text-sm">{Math.round(position.zoom * 100)}%</output>
        <button type="button" aria-label="지도 확대" disabled={position.zoom >= 3} onClick={() => setPosition(p => ({ ...p, zoom: Math.min(3, p.zoom + 0.5) }))} className={buttonClass}>+</button>
        <button type="button" onClick={() => setPosition({ coordinates: mapCenter, zoom: 1 })} className={buttonClass}>전체 보기</button>
        <label className="ml-auto flex min-h-11 items-center gap-2 text-sm">지역 선택<select value={selected ?? ''} onChange={e => setSelected(e.target.value || null)} className="min-h-11 max-w-48 rounded-lg border-border-light bg-card-light text-text-light focus:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark"><option value="">전국</option>{rows.map(row => <option key={row.name} value={row.name}>{row.name}</option>)}</select></label>
      </div>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">확대 후 지도를 드래그하거나, 지역 선택 메뉴를 이용하세요.</p>
      <div className="my-3 overflow-hidden rounded-lg bg-primary/5">{drawMap(true)}</div>
      {details}
    </StatsDialog>}
  </div>;
}
