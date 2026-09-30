import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { reportListPath } from '../lib/reportNavigation';
import { createAnimalReport, getAnimalReport, updateAnimalReport } from '../api/animalReports.api';
import { useAuthStore } from '../store/authStore';
import type { AnimalReportInput, AnimalReportKind } from '../types/api.types';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const fieldClass = 'mt-2 h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base text-brand-ink focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-focus dark:border-gray-600 dark:bg-gray-800 dark:text-white';
const areaClass = 'mt-2 min-h-28 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-brand-ink focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-focus dark:border-gray-600 dark:bg-gray-800 dark:text-white';

function initialForm(kind: AnimalReportKind): AnimalReportInput {
  return {
    kind, occurredOn: '', approximateTime: null, region: '', landmark: null,
    species: '', animalName: null, coatColor: null, animalSize: null,
    distinguishingFeatures: null, direction: null, description: '',
  };
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function AnimalReportForm() {
  const { id } = useParams<{ id: string }>();
  const reportId = id ? Number(id) : null;
  const [params] = useSearchParams();
  const initialKind: AnimalReportKind = params.get('kind') === 'SIGHTING' ? 'SIGHTING' : 'MISSING';
  const [form, setForm] = useState<AnimalReportInput>(() => initialForm(initialKind));
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: existing, isLoading, isError } = useQuery({
    queryKey: ['animal-report', reportId],
    queryFn: () => getAnimalReport(reportId!),
    enabled: reportId !== null,
  });

  useEffect(() => {
    if (!existing || reportId === null || loadedId === reportId) return;
    if (existing.authorId !== user?.id) {
      navigate(`/reports/${reportId}`, { replace: true });
      return;
    }
    setForm({
      kind: existing.kind, occurredOn: existing.occurredOn,
      approximateTime: existing.approximateTime, region: existing.region,
      landmark: existing.landmark, species: existing.species,
      animalName: existing.animalName, coatColor: existing.coatColor,
      animalSize: existing.animalSize, distinguishingFeatures: existing.distinguishingFeatures,
      direction: existing.direction, description: existing.description,
    });
    setLoadedId(reportId);
  }, [existing, loadedId, navigate, reportId, user?.id]);

  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  const mutation = useMutation({
    mutationFn: () => reportId === null
      ? createAnimalReport(form, photos)
      : updateAnimalReport(reportId, form, []),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['animal-report', result.reportId] });
      navigate(`/reports/${result.reportId}`);
    },
    onError: (cause: unknown) => {
      const message = isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message : null;
      setError(message || '등록하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  function update<K extends keyof AnimalReportInput>(key: K, value: AnimalReportInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  }

  function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (photos.length + selected.length > MAX_PHOTOS) {
      setError('사진은 최대 5장까지 첨부할 수 있습니다.');
      return;
    }
    if (selected.some((photo) => !allowedTypes.has(photo.type))) {
      setError('JPG, PNG, WebP 사진만 첨부할 수 있습니다.');
      return;
    }
    if (selected.some((photo) => photo.size > MAX_PHOTO_BYTES || photo.size === 0)) {
      setError('사진은 각 10MB 이하로 첨부해 주세요. 원본이 더 크다면 기기에서 크기를 줄인 뒤 선택해 주세요.');
      return;
    }
    setPhotos((current) => [...current, ...selected]);
    setError('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.occurredOn || form.occurredOn > localToday()
      || !form.region.trim() || !form.species.trim() || !form.description.trim()) {
      setError('날짜, 지역, 동물 종류, 상황 설명을 확인해 주세요.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!confirmed) {
      setError('공개 내용을 확인해 주세요.');
      return;
    }
    mutation.mutate();
  }

  if (reportId !== null && (isLoading || (existing && loadedId !== reportId))) {
    return <div className="min-h-screen bg-background-light dark:bg-background-dark"><Header /><main className="mx-auto max-w-3xl px-4 py-16" role="status">제보를 불러오는 중입니다.</main><Footer /></div>;
  }
  if (reportId !== null && isError) {
    return <div className="min-h-screen bg-background-light dark:bg-background-dark"><Header /><main className="mx-auto max-w-3xl px-4 py-16">제보를 불러오지 못했습니다. <Link className="underline" to={reportListPath(form.kind)}>목록으로</Link></main><Footer /></div>;
  }

  const missing = form.kind === 'MISSING';
  return (
    <div className="flex min-h-screen flex-col bg-background-light text-brand-ink dark:bg-background-dark dark:text-white">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Link to={reportListPath(form.kind)} className="text-sm font-semibold underline underline-offset-4">제보 목록으로</Link>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-9">
          <p className="text-sm font-bold text-brand-accent">동물을 다시 만날 수 있도록</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{reportId === null ? (missing ? '실종 동물 알리기' : '목격 제보하기') : '제보 수정'}</h1>
          <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">정확히 아는 정보만 적어 주세요. 위치와 특징은 공개되지만 개인 연락처는 적지 않는 편이 안전합니다.</p>
          {error && <div role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
          <form onSubmit={submit} className="mt-8 space-y-9">
            <section aria-labelledby="kind-heading">
              <h2 id="kind-heading" className="text-xl font-bold">어떤 상황인가요?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {([{ kind: 'MISSING', label: '동물을 잃어버렸어요', hint: '보호자가 실종 사실을 알립니다.' }, { kind: 'SIGHTING', label: '동물을 목격했어요', hint: '지나가다 본 동물의 위치를 공유합니다.' }] as const).map((option) => (
                  <button key={option.kind} type="button" disabled={reportId !== null}
                    aria-pressed={form.kind === option.kind}
                    onClick={() => update('kind', option.kind)}
                    className={`min-h-24 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${form.kind === option.kind ? 'border-brand-ink bg-brand/20 dark:border-brand' : 'border-gray-300 hover:border-brand-ink dark:border-gray-600'}`}>
                    <span className="block font-bold">{option.label}</span>
                    <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">{option.hint}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5" aria-labelledby="when-where-heading">
              <h2 id="when-where-heading" className="text-xl font-bold">언제, 어디에서 {missing ? '잃어버렸나요' : '보셨나요'}?</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block font-semibold">날짜 <span aria-hidden="true">*</span>
                  <input className={fieldClass} type="date" max={localToday()} required value={form.occurredOn} onChange={(e) => update('occurredOn', e.target.value)} />
                </label>
                <label className="block font-semibold">대략적인 시간 <span className="text-sm font-normal text-gray-500">(선택)</span>
                  <input className={fieldClass} maxLength={40} placeholder="예: 오후 3시 무렵 / 모름" value={form.approximateTime || ''} onChange={(e) => update('approximateTime', e.target.value || null)} />
                </label>
              </div>
              <label className="block font-semibold">지역 <span aria-hidden="true">*</span>
                <input className={fieldClass} maxLength={120} required placeholder="예: 서울 마포구 상암동" value={form.region} onChange={(e) => update('region', e.target.value)} />
              </label>
              <label className="block font-semibold">가까운 장소 <span className="text-sm font-normal text-gray-500">(선택)</span>
                <input className={fieldClass} maxLength={200} placeholder="예: 월드컵공원 남문 근처" value={form.landmark || ''} onChange={(e) => update('landmark', e.target.value || null)} />
              </label>
            </section>

            <section className="space-y-5" aria-labelledby="animal-heading">
              <h2 id="animal-heading" className="text-xl font-bold">동물의 특징을 알려주세요</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block font-semibold">동물 종류 <span aria-hidden="true">*</span>
                  <input className={fieldClass} maxLength={40} required placeholder="예: 개, 고양이" value={form.species} onChange={(e) => update('species', e.target.value)} />
                </label>
                {missing && <label className="block font-semibold">이름 <span className="text-sm font-normal text-gray-500">(선택)</span>
                  <input className={fieldClass} maxLength={80} value={form.animalName || ''} onChange={(e) => update('animalName', e.target.value || null)} />
                </label>}
                <label className="block font-semibold">털색 <span className="text-sm font-normal text-gray-500">(선택)</span>
                  <input className={fieldClass} maxLength={100} placeholder="예: 갈색과 흰색" value={form.coatColor || ''} onChange={(e) => update('coatColor', e.target.value || null)} />
                </label>
                <label className="block font-semibold">크기 <span className="text-sm font-normal text-gray-500">(선택)</span>
                  <input className={fieldClass} maxLength={40} placeholder="예: 소형 / 약 5kg" value={form.animalSize || ''} onChange={(e) => update('animalSize', e.target.value || null)} />
                </label>
              </div>
              <label className="block font-semibold">구별되는 특징 <span className="text-sm font-normal text-gray-500">(선택)</span>
                <textarea className={areaClass} maxLength={500} placeholder="목줄, 무늬, 상처 등" value={form.distinguishingFeatures || ''} onChange={(e) => update('distinguishingFeatures', e.target.value || null)} />
              </label>
              {!missing && <label className="block font-semibold">이동 방향 <span className="text-sm font-normal text-gray-500">(선택)</span>
                <input className={fieldClass} maxLength={200} value={form.direction || ''} onChange={(e) => update('direction', e.target.value || null)} />
              </label>}
              <label className="block font-semibold">상황 설명 <span aria-hidden="true">*</span>
                <textarea className={`${areaClass} min-h-40`} maxLength={10000} required placeholder="상황과 동물의 행동을 알려주세요. 개인 연락처는 적지 마세요." value={form.description} onChange={(e) => update('description', e.target.value)} />
              </label>
            </section>

            <section aria-labelledby="photo-heading">
              <h2 id="photo-heading" className="text-xl font-bold">사진 첨부 <span className="text-base font-normal text-gray-500">(선택)</span></h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">JPG·PNG·WebP, 최대 5장, 한 장당 10MB. 위치 정보가 담긴 사진은 공개 전 확인해 주세요.</p>
              {reportId !== null ? <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">등록 후 사진 교체는 아직 지원하지 않습니다. 기존 사진은 유지됩니다.</p> :
                <input className="mt-4 block w-full rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-600" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={choosePhotos} aria-label="제보 사진 선택" />}
              {reportId === null && previewUrls.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {previewUrls.map((url, index) => <div key={url} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <img src={url} alt={`첨부할 사진 ${index + 1}`} className="aspect-square w-full object-cover" />
                  <button type="button" onClick={() => setPhotos((current) => current.filter((_, at) => at !== index))}
                    className="min-h-11 w-full bg-gray-100 text-sm font-bold hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" aria-label={`${index + 1}번째 사진 제거`}>제거</button>
                </div>)}
              </div>}
            </section>

            <section className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
              <h2 className="font-bold">공개 전 확인</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">작성한 내용과 사진은 누구나 볼 수 있습니다. 전화번호, 집 주소, 얼굴 등 공개하고 싶지 않은 정보는 제외해 주세요.</p>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-semibold">
                <input className="mt-1 h-5 w-5 accent-brand-ink" type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                공개되는 내용을 확인했습니다.
              </label>
            </section>
            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 dark:border-gray-700 sm:flex-row sm:justify-end">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gray-100 px-6 font-bold hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600" to={reportListPath(form.kind)}>취소</Link>
              <button className="min-h-12 rounded-lg bg-brand px-8 font-bold text-brand-ink hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? '저장 중...' : reportId === null ? '제보 등록' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
