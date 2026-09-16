import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { readLostSearchSession, saveLostSearchSession, clearLostSearchSession } from '../utils/lostSearchSession';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { findLostCandidates } from '../api/lostSearch.api';
import type { LostCandidate } from '../api/lostSearch.api';
import placeholder from '../assets/image-placeholder.svg';
import uploadIcon from '../assets/lost-search-upload.svg';

const statusLabels: Record<string, string> = {
  NOTICE: '공고 중', PROTECT: '보호 중', ADOPTION_PENDING: '입양 대기', ADOPTED: '종료 · 입양',
  RETURNED: '종료 · 반환', EUTHANIZED: '종료 · 안락사', NATURAL_DEATH: '종료 · 자연사',
  DONATED: '종료 · 기증', RELEASED: '종료 · 방사', ESCAPED: '종료 · 탈출', UNKNOWN: '상태 미상',
};
const evidenceLabels: Record<string, string> = {
  FOUND_ON_OR_AFTER_LOST_DATE: '실종일 이후 발견', DISCOVERY_PLACE_TEXT_MATCH: '발견 장소에 지역명 포함',
  REGISTERED_DESCRIPTION_TEXT_MATCH: '등록된 특징에 일치하는 표현',
};
const fieldClass = 'w-full rounded-xl border border-border-light bg-white p-3 text-sm text-text-light focus:outline-none focus:ring-2 focus:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark';
const secondary = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-border-light px-4 py-2 text-sm font-bold hover:bg-primary/10 focus-visible:outline-primary dark:border-border-dark';

export default function LostAnimalSearch() {
  const routeLocation = useLocation();
  const [restored] = useState(() => readLostSearchSession(routeLocation.key));
  const [photo, setPhoto] = useState<File | null>(restored?.photo ?? null);
  const [preview, setPreview] = useState('');
  const [species, setSpecies] = useState<'DOG' | 'CAT'>(restored?.species ?? 'DOG');
  const [lostDate, setLostDate] = useState(restored?.lostDate ?? '');
  const [region, setRegion] = useState(restored?.region ?? '');
  const [description, setDescription] = useState(restored?.description ?? '');
  const [includeAdoptedOrReturned, setIncludeAdoptedOrReturned] = useState(restored?.includeAdoptedOrReturned ?? false);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success' | 'error'>(restored?.phase ?? 'idle');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<LostCandidate[]>(restored?.results ?? []);
  const fileInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const photoRevision = useRef(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const scrollRestored = useRef(false);

  useEffect(() => () => {
    request.current?.abort();
    photoRevision.current++;
  }, [routeLocation.key]);
  useEffect(() => {
    if (!restored || scrollRestored.current || (restored.photo && !preview)) return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, restored.scrollY);
      scrollRestored.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [restored, preview]);
  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function rememberSearch() {
    saveLostSearchSession(routeLocation.key, { photo, species, lostDate, region, description, includeAdoptedOrReturned,
      results, phase: 'success', scrollY: window.scrollY });
  }

  function invalidate() {
    scrollRestored.current = true;
    clearLostSearchSession();
    revision.current++;
    request.current?.abort();
    request.current = null;
    setPhase('idle'); setResults([]); setError('');
  }

  async function selectPhoto(file?: File) {
    if (!file) return;
    invalidate();
    const version = ++photoRevision.current;
    setPhoto(null); setValidating(true);
    try {
      if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('사진은 5MiB 이하로 선택해 주세요.');
      if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('JPG 또는 PNG 사진을 선택해 주세요.');
      const image = await createImageBitmap(file);
      const tooLarge = image.width * image.height > 16_000_000;
      image.close();
      if (tooLarge) throw new Error('사진 해상도는 1600만 픽셀 이하로 선택해 주세요.');
      if (version === photoRevision.current) setPhoto(file);
    } catch (cause) {
      if (version === photoRevision.current) setError(cause instanceof Error && cause.name !== 'InvalidStateError'
        ? cause.message : '사진을 읽을 수 없어요. 다른 JPG·PNG 사진을 선택해 주세요.');
    } finally {
      if (version === photoRevision.current) setValidating(false);
    }
  }

  function removePhoto() {
    photoRevision.current++; invalidate(); setPhoto(null); setValidating(false);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!photo || validating || phase === 'loading') return;
    invalidate();
    const version = revision.current;
    const controller = new AbortController(); request.current = controller;
    setPhase('loading');
    try {
      const candidates = await findLostCandidates({ image: photo, species, lostDate, region, description, includeAdoptedOrReturned }, controller.signal);
      if (version !== revision.current || controller.signal.aborted) return;
      setResults(candidates); setPhase('success');
      requestAnimationFrame(() => {
        if (version !== revision.current || controller.signal.aborted) return;
        resultHeading.current?.focus({ preventScroll: true });
        if (window.matchMedia('(max-width: 1023px)').matches) resultHeading.current?.scrollIntoView({ block: 'start' });
      });
    } catch (cause) {
      if (version !== revision.current || controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : '검색을 완료하지 못했어요. 다시 시도해 주세요.');
      setPhase('error');
    } finally {
      if (version === revision.current) request.current = null;
    }
  }

  return <div className="min-h-screen bg-background-light text-text-light dark:bg-background-dark dark:text-text-dark">
    <Header />
    <main className="container mx-auto px-4 pb-16 pt-8 md:pt-12">
      <nav aria-label="현재 위치" className="mb-6 text-xs text-gray-500"><Link to="/" className="hover:underline">홈</Link> / 실종동물 찾기</nav>
      <p className="mb-3 text-xs font-bold text-emerald-700 dark:text-primary">실종동물 찾기</p>
      <h1 className="text-2xl font-bold leading-snug md:text-3xl">다시 만날 단서,<br className="sm:hidden" /> 사진으로 찾아보세요</h1>
      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">올려주신 사진과 닮은 동물을 수집된 구조동물 공고에서 찾아드려요.</p>
      <p className="mb-6 mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">사진이 닮아도 다른 동물일 수 있어요. 발견일·장소와 몸의 무늬를 확인한 뒤 보호소에 문의해 주세요.</p>
            <fieldset className="mb-8 max-w-[400px]"><legend className="mb-3 text-sm font-bold">어떤 동물을 찾고 계세요?</legend>
              <div className="grid grid-cols-2 gap-3">{(['DOG', 'CAT'] as const).map(value => <label key={value} className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold ${species === value ? 'border-primary bg-primary text-text-light' : 'border-border-light dark:border-border-dark'}`}>
                <input type="radio" name="species" value={value} checked={species === value} onChange={() => { invalidate(); setSpecies(value); }} className="accent-emerald-800" />
                {value === 'DOG' ? '강아지' : '고양이'}
              </label>)}</div>
            </fieldset>
      <div className="grid items-start gap-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-10">
        <section aria-labelledby="input-heading" className="min-w-0">
          <h2 id="input-heading" className="mb-5 text-xl font-bold">찾는 동물 정보</h2>
          <form onSubmit={search} className="space-y-5">

            <div className="rounded-2xl border border-border-light bg-emerald-50/40 p-4 dark:border-border-dark dark:bg-card-dark">
              {photo ? <img src={preview || undefined} alt="선택한 실종동물 사진" className="mb-4 h-56 w-full rounded-xl bg-white object-contain dark:bg-black/20" /> : <>
                <img src={uploadIcon} alt="" className="mb-3 h-7 w-7" />
                <p className="font-bold">아이의 사진을 올려주세요</p><p className="mb-4 mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">얼굴과 몸의 무늬가 잘 보이는<br />사진 한 장을 선택해 주세요.</p>
              </>}
              <input ref={fileInput} type="file" accept="image/jpeg,image/png" aria-label="실종동물 사진" className="sr-only" tabIndex={-1} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void selectPhoto(file); }} />
              <div className="flex gap-2"><button type="button" onClick={() => fileInput.current?.click()} className={`${secondary} flex-1 bg-white dark:bg-card-dark`}>{photo ? '사진 변경하기' : '사진 선택하기'}</button>
                {photo && <button type="button" className={secondary} onClick={removePhoto}>삭제</button>}</div>
              <p className="mt-3 text-xs text-gray-500">JPG 또는 PNG · 최대 5MiB · 1600만 픽셀</p>
              {validating && <p role="status" className="mt-2 text-sm">사진을 확인하고 있어요…</p>}
            </div>
            <fieldset className="space-y-4"><legend className="mb-3 text-sm font-bold">기억나는 정보를 더해 주세요 · 선택</legend>
              <label className="block text-sm font-medium">실종 날짜<input type="date" value={lostDate} onChange={e => { invalidate(); setLostDate(e.target.value); }} className={`${fieldClass} mt-2`} /></label>
              <label className="block text-sm font-medium">실종 지역<input value={region} maxLength={100} onChange={e => { invalidate(); setRegion(e.target.value); }} placeholder="예: 상주시 동문동" className={`${fieldClass} mt-2`} /></label>
              <label className="block text-sm font-medium">털색·무늬·특징<textarea aria-label="털색·무늬·특징" value={description} maxLength={500} rows={3} onChange={e => { invalidate(); setDescription(e.target.value); }} placeholder="예: 흰 털, 갈색 귀, 목에 빨간 목줄" className={`${fieldClass} mt-2 resize-y`} /></label>
              <p className="text-xs leading-5 text-gray-500">모르는 항목은 비워 두셔도 돼요. 부가정보는 후보 순서를 보완하며, 조건이 다르다고 제외하지 않아요.</p>
            </fieldset>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-light p-4 dark:border-border-dark">
              <input type="checkbox" aria-label="입양·반환된 동물도 포함" checked={includeAdoptedOrReturned} onChange={e => { invalidate(); setIncludeAdoptedOrReturned(e.target.checked); }} className="mt-0.5 rounded border-gray-300 text-emerald-700 focus:ring-primary" />
              <span><span className="block text-sm font-bold">입양·반환된 동물도 포함</span><span className="mt-1 block text-xs leading-5 text-gray-500">이미 가족을 찾았거나 원래 가족에게 돌아간 동물도 단서로 확인해요. 사망한 동물은 표시하지 않아요.</span></span>
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
            {phase === 'loading' ? <button key="cancel" type="button" onClick={event => { event.preventDefault(); invalidate(); }} className={`${secondary} w-full`}>검색 취소</button> : <button key="submit" type="submit" disabled={!photo || validating} className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-text-light disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 focus-visible:outline-emerald-800">{phase === 'error' ? '다시 시도하기' : '사진으로 후보 찾기'}</button>}
            <p className="text-xs leading-5 text-gray-500">사진은 검색에만 사용하며 저장하지 않아요.</p>
          </form>
        </section>
        <section aria-labelledby="result-heading" aria-busy={phase === 'loading'} className="min-w-0">
          <h2 ref={resultHeading} tabIndex={-1} id="result-heading" className="scroll-mt-24 mb-5 text-xl font-bold focus:outline-none">{phase === 'success' ? `확인할 후보 ${results.length}마리` : '함께 확인할 후보'}</h2>
          <div aria-live="polite">
            {phase === 'loading' && <div className="rounded-2xl border border-border-light p-8 text-center dark:border-border-dark"><span className="mx-auto mb-4 block h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary motion-reduce:animate-none" /><p className="font-bold">닮은 동물을 찾고 있어요</p><p className="mt-2 text-sm text-gray-500">사진과 공고 정보를 확인하고 있어요. 잠시만 기다려 주세요.</p></div>}
            {phase === 'idle' && <div className="rounded-2xl border border-dashed border-primary/40 bg-emerald-50/30 p-8 text-center dark:bg-card-dark"><p className="font-bold">사진을 선택하고 후보를 찾아보세요</p><p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">기본 검색은 현재 공고·보호 중인 동물을 확인해요.<br />사진이 닮아도 다른 동물일 수 있어요.</p></div>}
            {phase === 'error' && <p className="rounded-2xl border border-border-light p-6 text-sm dark:border-border-dark">검색이 완료되지 않았어요. 조건과 사진을 유지했으니 다시 시도해 주세요.</p>}
            {phase === 'success' && results.length === 0 && <div className="rounded-2xl border border-border-light p-8 dark:border-border-dark"><p className="font-bold">이번 검색에서는 후보를 찾지 못했어요</p><p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">수집되지 않았거나 검색 가능한 사진이 없는 공고도 있어요. 다른 사진으로 다시 확인하거나 보호소에 문의해 주세요.</p></div>}
          </div>
          {phase === 'success' && results.length > 0 && <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{results.map(({ animal, shelterPhone, matchedEvidence }) => <article key={animal.id} className="min-w-0 overflow-hidden rounded-2xl border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark">
              <img src={animal.imageUrl || placeholder} onError={e => { if (e.currentTarget.src !== new URL(placeholder, location.href).href) e.currentTarget.src = placeholder; }} alt={`${animal.breed || '동물'} 후보 사진`} className="aspect-[4/3] w-full bg-gray-50 object-contain dark:bg-black/20" loading="lazy" />
              <div className="space-y-3 p-4"><p className="text-xs font-bold text-emerald-700 dark:text-primary">{statusLabels[animal.status] || '상태 확인 필요'}</p>
                <h3 className="break-words text-lg font-bold">{animal.breed || (animal.species === 'CAT' ? '고양이' : '강아지')} · {animal.gender === 'MALE' ? '수컷' : animal.gender === 'FEMALE' ? '암컷' : '성별 미상'}</h3>
                <dl className="space-y-2 break-words text-sm leading-5 text-gray-600 dark:text-gray-300"><div><dt className="inline">발견일 </dt><dd className="inline">{animal.happenDate || '미상'}</dd></div><div><dt>발견 장소</dt><dd>{animal.happenPlace || '미상'}</dd></div><div><dt className="sr-only">보호소</dt><dd>{animal.shelterName || '보호소 정보 확인 필요'}</dd></div></dl>
                {matchedEvidence.filter(e => evidenceLabels[e]).length > 0 && <ul className="flex flex-wrap gap-1.5">{[...new Set(matchedEvidence)].filter(e => evidenceLabels[e]).map(e => <li key={e} className="rounded-lg bg-primary/10 px-2 py-1 text-xs leading-5">{evidenceLabels[e]}</li>)}</ul>}
                <Link to={`/animals/${animal.id}`} onClick={rememberSearch} state={{ from: 'lost-search', lostSearchEntryKey: routeLocation.key }} className={`${secondary} w-full`}>공고 상세 보기</Link>
                {shelterPhone && /^\+?[0-9 ()-]{5,30}$/.test(shelterPhone) && <a href={`tel:${shelterPhone.replace(/[^+0-9]/g, '')}`} className="block py-2 text-center text-sm font-medium text-emerald-700 underline dark:text-primary">보호소 문의 · {shelterPhone}</a>}
              </div>
            </article>)}</div>
          </>}
        </section>
      </div>
    </main>
    <Footer />
  </div>;
}
