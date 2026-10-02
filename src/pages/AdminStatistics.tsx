import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getDailySignupStats, getDailyAnimalStats, getTotalUserCount, getIntakeTrend,
  getShelterApplicationStats, getPostPeriodStats, getRegisteredShelterCount } from '../api/stats.api';
import type { AdminPeriodTrend, ShelterApplicationStats, PostPeriodStats, PostStatsBoardType } from '../api/stats.api';
import { getAnimalStatusStats } from '../api/animalStats.api';
import AdminLayout from '../components/layout/AdminLayout';
import AdminTrend from '../components/admin/AdminTrend';
import { AdminError, AdminLoading, AdminPagination, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import { adminTrendChanges, fillAdminDays, kstToday, separateAdminPreviousDay, shiftDay, validAdminRange } from '../lib/adminStatistics';

type Area = 'animals' | 'members' | 'shelters' | 'community';
type Trend = AdminPeriodTrend | ShelterApplicationStats | PostPeriodStats;
type Range = { start: string; end: string };
const areas: [Area, string][] = [['animals', '보호동물'], ['members', '회원'], ['shelters', '보호소'], ['community', '커뮤니티']];
const boardLabels: [PostStatsBoardType, string][] = [['ADOPTION', '입양 후기'], ['COMMUNICATION', '자유 이야기'], ['MISSING', '실종 게시글'], ['PROTECTION', '보호 게시글'], ['REPORT', '제보 게시글']];

function Metric({ title, value, caption, query, unit }: { title: string; value: number | undefined; caption: string; query: Pick<UseQueryResult, 'isPending' | 'isError' | 'refetch'>; unit: string }) {
  return <section className={`${adminPanel} space-y-3`} aria-label={title}>
    <h2 className="text-sm text-brand-muted dark:text-stone-300">{title}</h2>
    {query.isPending ? <p role="status" className="text-sm">불러오는 중…</p> : query.isError ? <div role="alert"><p className="text-sm">조회 실패</p><button className={adminControl} onClick={() => void query.refetch()}>다시 불러오기</button></div> : <p className="text-[28px] font-bold">{value?.toLocaleString()}{unit}</p>}
    <p className="text-xs text-brand-muted dark:text-stone-300">{caption}</p>
  </section>;
}

function StatisticsContent({ area, range }: { area: Area; range: Range }) {
  const [collection, setCollection] = useState(false);
  const [page, setPage] = useState(0);
  const mode = area === 'animals' && collection ? 'collection' : area;
  const trend = useQuery<Trend>({
    queryKey: ['admin-statistics', mode, range.start, range.end],
    queryFn: async () => {
      if (mode === 'members' || mode === 'collection') {
        const rows = await (mode === 'members' ? getDailySignupStats : getDailyAnimalStats)(shiftDay(range.start, -1), range.end);
        return separateAdminPreviousDay(rows, range.start, range.end);
      }
      if (mode === 'shelters') return getShelterApplicationStats(range.start, range.end);
      if (mode === 'community') return getPostPeriodStats(range.start, range.end);
      return getIntakeTrend(range.start, range.end);
    },
  });
  const members = useQuery({ queryKey: ['admin-stats', 'total-users'], queryFn: getTotalUserCount, enabled: area === 'members' });
  const shelters = useQuery({ queryKey: ['admin-stats', 'registered-shelters'], queryFn: getRegisteredShelterCount, enabled: area === 'shelters' });
  const status = useQuery({ queryKey: ['admin-stats', 'intake-status', range.start, range.end],
    queryFn: () => getAnimalStatusStats(range.start, range.end), enabled: area === 'animals' && !collection });
  const rows = trend.isSuccess ? fillAdminDays(trend.data.daily, range.start, range.end) : [];
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const unit = mode === 'members' ? '명' : mode === 'animals' ? '마리' : '건';
  const changes = adminTrendChanges(rows, trend.data?.previousDayCount ?? 0, unit);
  const application = trend.data && 'currentPending' in trend.data ? trend.data : undefined;
  const posts = trend.data && 'byBoardType' in trend.data ? trend.data : undefined;
  const adoption = posts?.byBoardType.find(row => row.boardType === 'ADOPTION')?.count ?? 0;
  const stateCount = (state: string) => status.data?.find(row => row.status === state)?.count ?? 0;
  const label = mode === 'members' ? '회원 가입' : mode === 'collection' ? '동물 신규 수집' : mode === 'shelters' ? '담당자 신청 접수' : mode === 'community' ? '게시글 작성' : '구조·접수';

  return <>
    {area === 'animals' && <div role="group" aria-label="동물 통계 기준" className="flex flex-wrap gap-2">
      <button className={!collection ? adminPrimary : adminControl} aria-pressed={!collection} onClick={() => { setCollection(false); setPage(0); }}>접수 현황</button>
      <button className={collection ? adminPrimary : adminControl} aria-pressed={collection} onClick={() => { setCollection(true); setPage(0); }}>신규 수집 · 보조 지표</button>
    </div>}
    <p className="text-xs text-brand-muted dark:text-stone-300">{mode === 'members' ? '가입일 기준 · 현재 남아 있는 회원 기록입니다. 회원 삭제가 과거 집계에 영향을 줄 수 있습니다.' : mode === 'collection' ? '시스템 최초 저장일 기준 · 실제 발견·접수 건수가 아닙니다. 수동 등록과 공공 데이터 수집이 포함될 수 있습니다.' : mode === 'animals' ? '접수일 기준 · PawBridge 보유 동물입니다. 접수일이 없는 동물은 제외합니다.' : mode === 'shelters' ? '신청 접수일 기준 · 현재 대기 수와 심사일 기준 처리 수는 별도 지표입니다.' : '작성일 기준 · 현재 삭제되지 않은 게시글입니다. 실제 입양 건수나 신규 실종·목격 신고 통계가 아닙니다.'}</p>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 [&>section:last-child]:col-span-2 sm:[&>section:last-child]:col-span-1">
      <Metric title={mode === 'shelters' ? '기간 신청' : mode === 'community' ? '기간 게시글' : mode === 'animals' ? '기간 접수' : mode === 'members' ? '기간 가입' : '기간 신규 수집'} value={total} caption="선택 기간 기준" query={trend} unit={unit} />
      {mode === 'members' ? <Metric title="현재 회원" value={members.data} caption="선택 기간과 무관한 현재 규모" query={members} unit="명" />
        : mode === 'animals' ? <Metric title="현재 보호중" value={stateCount('PROTECT')} caption="선택 기간 접수 동물의 현재 상태" query={status} unit="마리" />
        : mode === 'shelters' ? <Metric title="현재 심사 대기" value={application?.currentPending} caption="선택 기간과 무관한 현재 대기량" query={trend} unit="건" />
        : mode === 'community' ? <Metric title="입양 후기" value={adoption} caption="후기 게시글 · 실제 입양 건수 아님" query={trend} unit="건" />
        : <Metric title="하루 최대" value={Math.max(0, ...rows.map(row => row.count))} caption="시스템 최초 저장 기준" query={trend} unit={unit} />}
      {mode === 'animals' ? <Metric title="현재 입양완료" value={stateCount('ADOPTED')} caption="선택 기간 접수 동물의 현재 상태 · 발생 건수 아님" query={status} unit="마리" />
        : mode === 'shelters' ? <Metric title="등록된 보호소" value={shelters.data} caption="PawBridge에 저장된 현재 보호소" query={shelters} unit="곳" />
        : mode === 'community' ? <Metric title="그 외 게시글" value={total - adoption} caption="선택 기간 미삭제 게시글" query={trend} unit="건" />
        : <Metric title={mode === 'collection' ? '일평균 신규 수집' : '일평균 가입'} value={rows.length ? Math.round(total / rows.length * 10) / 10 : 0} caption="선택 기간 달력 일수 기준" query={trend} unit={unit} />}
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {trend.isPending ? <AdminLoading label={`${label} 추이를 불러오는 중입니다.`} /> : trend.isError ? <AdminError title={`${label} 추이 조회 실패`} retry={() => void trend.refetch()} />
        : <AdminTrend key={mode} title={`${label} 추이`} rows={rows} unit={unit} />}
      {mode === 'animals' ? status.isPending ? <AdminLoading label="접수 동물 상태를 불러오는 중입니다." /> : status.isError ? <AdminError title="접수 동물 상태 조회 실패" retry={() => void status.refetch()} /> :
        <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">접수 동물의 현재 상태</h2><p className="text-xs text-brand-muted dark:text-stone-300">선택 기간 접수 동물 기준입니다. 상태가 바뀌면 과거 기간의 분포도 달라집니다. 미분류 상태도 포함합니다.</p>
          <dl className="space-y-3">{status.data?.map(row => <div key={row.status} className="flex justify-between gap-4 text-sm"><dt>{row.label}</dt><dd>{row.count.toLocaleString()}마리</dd></div>)}</dl>
          {status.data?.length === 0 && <p className="text-sm">해당 기간의 접수 동물이 없습니다.</p>}</section>
        : trend.isSuccess && <section className={`${adminPanel} space-y-4`}>
          <h2 className="text-xl font-bold">{mode === 'shelters' ? '기간 내 심사 처리' : mode === 'community' ? '기간 게시글 구성' : '추이 읽기'}</h2>
          {application ? <><p className="text-xs text-brand-muted dark:text-stone-300">심사일 기준입니다. 신청 접수와 같은 모집단이 아니며 처리율로 비교하지 않습니다.</p><dl className="space-y-3">{[['승인', application.approvedCount], ['반려', application.rejectedCount]].map(([name, count]) => <div key={name} className="flex justify-between gap-4 text-sm"><dt>{name}</dt><dd>{Number(count).toLocaleString()}건</dd></div>)}</dl></>
            : posts ? <><p className="text-xs text-brand-muted dark:text-stone-300">미삭제 게시글만 집계합니다. 입양 후기를 실제 입양률로 해석하지 않습니다.</p><dl className="space-y-3">{boardLabels.map(([type, name]) => <div key={type} className="flex justify-between gap-4 text-sm"><dt>{name}</dt><dd>{(posts.byBoardType.find(row => row.boardType === type)?.count ?? 0).toLocaleString()}건</dd></div>)}</dl></>
            : <p className="text-sm text-brand-muted dark:text-stone-300">{mode === 'members' ? '회원 삭제가 과거 집계에 영향을 줄 수 있습니다. 누적 가입 사건이나 활동 사용자 통계가 아닙니다.' : '과거 동물을 오늘 처음 저장하면 오늘의 신규 수집으로 집계됩니다. 접수 건수와 구분해 읽어 주세요.'}</p>}
        </section>}
    </div>
    {trend.isSuccess && <section className={`${adminPanel} space-y-5`}>
      <h2 className="text-xl font-bold">날짜별 상세</h2><p className="text-xs text-brand-muted dark:text-stone-300">달력상의 전일과 비교합니다. 전일 0건에서 증가하면 증감 건수를 표시합니다.</p>
      <div className="space-y-3">{[...rows].reverse().slice(page * 7, (page + 1) * 7).map(row => <div key={row.date} className={`grid gap-3 rounded-lg border border-brand-border p-4 sm:grid-cols-3 dark:border-stone-700 ${row.date === kstToday() ? 'bg-brand-soft dark:bg-stone-800' : ''}`}><span className="text-sm font-medium">{row.date}{row.date === kstToday() ? ' · 오늘' : ''}</span><span className="text-sm">{row.count.toLocaleString()}{unit}</span><span className="text-xs text-brand-muted dark:text-stone-300">전일 대비 {changes.get(row.date)}</span></div>)}</div>
      <AdminPagination page={page} total={Math.ceil(rows.length / 7)} onChange={setPage} />
    </section>}
  </>;
}

export default function AdminStatistics() {
  const today = kstToday();
  const [area, setArea] = useState<Area>('animals');
  const [range, setRange] = useState<Range>({ start: shiftDay(today, -6), end: today });
  const [draft, setDraft] = useState(range);
  const [rangeError, setRangeError] = useState('');
  const apply = (next: Range) => {
    if (!validAdminRange(next.start, next.end) || next.end > today) { setRangeError('시작일과 종료일을 확인해 주세요. 오늘까지 최대 366일을 조회할 수 있습니다.'); return; }
    setRange(next); setDraft(next); setRangeError('');
  };
  return <AdminLayout title="통계" description="보호동물·회원·보호소·커뮤니티의 집계 기준을 구분하여 확인하세요.">
    <section className={`${adminPanel} space-y-5`}>
      <div role="group" aria-label="통계 유형" className="grid grid-cols-2 gap-2 sm:grid-cols-4">{areas.map(([value, label]) => <button key={value} className={area === value ? adminPrimary : adminControl} aria-pressed={area === value} onClick={() => setArea(value)}>{label}</button>)}</div>
      <form className="flex flex-col items-end gap-4 sm:flex-row" onSubmit={event => { event.preventDefault(); apply(draft); }}>
        <label htmlFor="stats-start" className="w-full text-sm font-medium">시작일<input id="stats-start" type="date" max={today} className={adminInput} value={draft.start} onChange={event => setDraft({ ...draft, start: event.target.value })} /></label>
        <label htmlFor="stats-end" className="w-full text-sm font-medium">종료일<input id="stats-end" type="date" max={today} className={adminInput} value={draft.end} onChange={event => setDraft({ ...draft, end: event.target.value })} /></label>
        <button className={`${adminPrimary} w-full shrink-0 sm:w-auto`}>조회</button>
      </form>
      {rangeError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{rangeError}</p>}
      <div role="group" aria-label="조회 기간" className="flex flex-wrap gap-2">{[['오늘', today], ['최근 7일', shiftDay(today, -6)], ['최근 30일', shiftDay(today, -29)], ['이번 달', today.slice(0, 8) + '01']].map(([text, start]) => <button key={text} className={range.start === start && range.end === today ? adminPrimary : adminControl} aria-pressed={range.start === start && range.end === today} onClick={() => apply({ start, end: today })}>{text}</button>)}</div>
    </section>
    <StatisticsContent key={`${area}-${range.start}-${range.end}`} area={area} range={range} />
  </AdminLayout>;
}
