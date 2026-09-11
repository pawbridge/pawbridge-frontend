import { useEffect, useId, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import type { RegionalAnimalStats as RegionalStats } from '../../types/api.types';
import { terrainBand, terrainColor, terrainBreaks, buildRegionRows, normalizeRegion, provinces } from './regionalStats';
import StatsDialog from './StatsDialog';

const mapCenter: [number, number] = [127.7, 35.95];
const buttonClass = 'text-text-light dark:text-text-dark min-h-11 rounded-lg border border-border-light px-4 text-sm font-semibold transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 dark:border-border-dark';

export default function RegionalAnimalStats({ data }: { data: RegionalStats[] }) {
  const rows = useMemo(() => buildRegionRows(data), [data]);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const maximum = Math.max(0, ...rows.map(row => row.count));
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ coordinates: mapCenter, zoom: 1 });
  const [hovered, setHovered] = useState<{ name: string; count: number; x: number; y: number; zoomed: boolean } | null>(null);
  const tooltipVisible = hovered !== null;
  useEffect(() => {
    if (!tooltipVisible) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setHovered(null);
      }
    };
    const clear = () => setHovered(null);
    window.addEventListener('keydown', dismiss, true);
    window.addEventListener('scroll', clear, true);
    return () => {
      window.removeEventListener('keydown', dismiss, true);
      window.removeEventListener('scroll', clear, true);
    };
  }, [tooltipVisible]);
  const selectedRow = rows.find(row => row.name === selected);
  const breaks = useMemo(() => terrainBreaks(rows.filter(row => provinces.some(p => p.name === row.name)).map(row => row.count)), [rows]);
  const filterId = useId().replace(/:/g, '');
  const ranges = [{ upper: 0, label: '0건' }, ...breaks.map((upper, index) => {
    const lower = index === 0 ? 1 : breaks[index - 1] + 1;
    return { upper, label: lower === upper ? `${upper.toLocaleString()}건` : `${lower.toLocaleString()}–${upper.toLocaleString()}` };
  })];

  const details = (
    <div aria-live="polite" aria-atomic="true" className="rounded-xl border border-primary/40 bg-primary/10 p-4 sm:p-5">
      {selectedRow ? <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-bold">{selectedRow.name}</h3>
          <p className="mt-1"><strong className="text-2xl">{selectedRow.count.toLocaleString()}건</strong><span className="ml-3 text-sm">전국 공고의 {total ? (selectedRow.count / total * 100).toFixed(1) : '0'}%</span></p>
          {selectedRow.count === 0 && <p className="mt-1 text-sm">선택 기간에 등록된 공고가 없습니다.</p>}
        </div>
        <button type="button" onClick={() => setSelected(null)} className={buttonClass}>선택 해제</button>
      </div> : <><h3 className="font-bold">관심 지역을 선택해 주세요</h3><p className="mt-1 text-sm">지도 또는 지역별 비교 목록에서 지역별 공고 수를 확인할 수 있어요.</p></>}
    </div>
  );

  const drawMap = (zoomed: boolean) => {
    const layers = <>
      <Geographies geography="/korea-provinces-topo.json">
        {({ geographies }) => geographies.map(geo => {
          const name = normalizeRegion(geo.properties.name as string);
          const count = rows.find(row => row.name === name)?.count ?? 0;
          const active = selected === name;
          return <Geography key={geo.rsmKey} geography={geo} tabIndex={-1}
            aria-label={`${name} · ${count.toLocaleString()}건`} data-region={name} data-selected={active} data-band={terrainBand(count, breaks)}
            onClick={() => setSelected(name)} fill={terrainColor(count, breaks)}
            stroke={active ? '#052e16' : '#ffffff'} strokeWidth={active ? 2 : 1}
            style={{ default: { outline: 'none' }, hover: { outline: 'none', stroke: '#052e16', strokeWidth: 2 }, pressed: { outline: 'none' } }}
            className="cursor-pointer" filter={`url(#${filterId}-${zoomed ? 'expanded' : 'main'})`}>
          </Geography>;
        })}
      </Geographies>
      {provinces.filter(p => ['경기', '강원', '충남', '충북', '전북', '전남', '경북', '경남', '제주'].includes(p.short)).map(p => {
        const count = rows.find(row => row.name === p.name)?.count ?? 0;
        const label = `${p.short} ${count.toLocaleString()}`;
        const width = Math.max(60, label.length * 8 + 12);
        return <Marker key={p.short} coordinates={[...p.coordinates]} className="pointer-events-none">
          <rect x={-width / 2} y={-14} width={width} height={28} rx={5} fill={selected === p.name ? '#052e16' : '#ffffff'} fillOpacity={0.94} />
          <text textAnchor="middle" y={5} fontSize={14} fontWeight={500} fill={selected === p.name ? '#ffffff' : '#052e16'}>{label}</text>
        </Marker>;
      })}
    </>;
    return <div className="relative" data-map-surface={zoomed ? 'expanded' : 'main'}
      onPointerDown={() => setHovered(null)} onPointerLeave={() => setHovered(null)}
      onPointerMove={event => {
        if (event.pointerType !== 'mouse' || event.buttons !== 0) { setHovered(null); return; }
        const target = event.target as Element;
        if (target.closest('[role="tooltip"]')) return;
        const name = target.closest('[data-region]')?.getAttribute('data-region');
        if (!name) { setHovered(null); return; }
        const rect = event.currentTarget.getBoundingClientRect();
        setHovered({ name, count: rows.find(row => row.name === name)?.count ?? 0, zoomed,
          x: Math.max(8, Math.min(event.clientX - rect.left + 12, rect.width - 208)),
          y: Math.max(8, Math.min(event.clientY - rect.top + 16, rect.height - 52)) });
      }}>
      <ComposableMap projection="geoMercator" projectionConfig={{ center: mapCenter, scale: 4800 }} width={500} height={620}
      role="img" aria-label="17개 시·도 입체 지형 지도. 색이 진할수록 공고가 많습니다. 정확한 값과 지역 선택은 비교 목록에서도 제공합니다."
      className={`mx-auto h-auto w-full ${zoomed ? 'max-w-[580px] touch-none' : 'max-w-[520px]'}`}>
      <defs><filter id={`${filterId}-${zoomed ? 'expanded' : 'main'}`} x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="3" stdDeviation="1.2" floodColor="#164e3e" floodOpacity="0.22" />
      </filter></defs>
      {zoomed ? <ZoomableGroup center={position.coordinates} zoom={position.zoom} minZoom={1} maxZoom={3}
        onMoveEnd={p => setPosition({ coordinates: p.coordinates, zoom: p.zoom })}>{layers}</ZoomableGroup> : layers}
      </ComposableMap>
      {hovered?.zoomed === zoomed && <div role="tooltip"
        className="absolute z-10 w-[200px] max-w-[calc(100%-16px)] rounded-lg border border-emerald-900/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-lg dark:border-emerald-200/20 dark:bg-gray-900 dark:text-emerald-50"
        style={{ left: hovered.x, top: hovered.y }}>
        <span className="font-semibold">{hovered.name}</span><span className="ml-2 tabular-nums">{hovered.count.toLocaleString()}건</span>
      </div>}
    </div>;
  };

  return <div className="space-y-5 text-text-light dark:text-text-dark">
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,560fr)_minmax(0,536fr)]">
    <div className="min-w-0 space-y-5" data-map-column>
      <div className="rounded-3xl bg-emerald-50 p-4 sm:p-5 dark:bg-emerald-950/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="text-xl font-bold">지역을 더 가까이</h3>
            <p className="mt-2 text-sm">전국 공고 분포{selected ? ` · ${selected} 선택` : ''}</p></div>
          <button type="button" onClick={() => { setPosition({ coordinates: mapCenter, zoom: 1 }); setExpanded(true); }} className={`${buttonClass} bg-white/80 dark:bg-card-dark`}>지도 크게 보기</button>
        </div>
        {drawMap(false)}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${ranges.length}, minmax(0, 1fr))` }} aria-label="공고 건수 색상 범례">
          {ranges.map(({ label, upper }) => <div key={upper} className="min-w-0">
            <div className="mb-2 h-2 rounded-full" style={{ backgroundColor: terrainColor(upper, breaks) }} />
            <span className="block break-words text-xs tabular-nums">{label}</span>
          </div>)}
        </div>
        <p className="mt-5 text-sm">선택 기간의 지역별 분포에 따라 색상 구간이 달라집니다. 진할수록 공고가 많으며, 입체 효과는 건수를 뜻하지 않습니다.</p>
      </div>
      {details}
    </div>
    <div data-comparison-column className="min-w-0 rounded-3xl border border-border-light bg-card-light p-4 sm:p-5 dark:border-border-dark dark:bg-card-dark">
      <div className="mb-4 flex items-baseline justify-between gap-3"><h3 className="text-lg font-bold">지역별 비교</h3><span className="text-sm text-gray-600 dark:text-gray-300">많은 순 · {rows.length}개 지역</span></div>
      <ul className="space-y-2">
        {rows.map(row => <li key={row.name}>
          <button type="button" aria-pressed={selected === row.name} onClick={() => setSelected(row.name)}
            className={`text-text-light dark:text-text-dark min-h-12 w-full rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected === row.name ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-primary/10'}`}>
            <span className="mb-2 flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{row.name}</span><strong className="shrink-0 tabular-nums">{row.count.toLocaleString()}건</strong></span>
            <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><span className="block h-full rounded-full bg-primary" style={{ width: `${maximum ? row.count / maximum * 100 : 0}%` }} /></span>
          </button>
        </li>)}
      </ul>
    </div>
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
