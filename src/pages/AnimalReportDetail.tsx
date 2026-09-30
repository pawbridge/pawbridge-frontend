import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { reportListPath } from '../lib/reportNavigation';
import placeholderImg from '../assets/image-placeholder.svg';
import { deleteAnimalReport, getAnimalReport } from '../api/animalReports.api';
import { useAuthStore } from '../store/authStore';

export default function AnimalReportDetail() {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['animal-report', reportId],
    queryFn: () => getAnimalReport(reportId),
    enabled: Number.isSafeInteger(reportId) && reportId > 0,
    retry: false,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteAnimalReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['animal-report', reportId] });
      navigate(reportListPath(report?.kind));
    },
  });

  const shell = (content: React.ReactNode) => (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light font-display text-brand-ink dark:bg-background-dark dark:text-white">
      <Header />
      <main className="flex-grow">{content}</main>
      <Footer />
    </div>
  );

  if (isLoading) return shell(<div className="mx-auto max-w-4xl px-4 py-16" role="status">제보를 불러오는 중...</div>);
  if (error || !report) {
    const missing = !Number.isSafeInteger(reportId) || reportId <= 0 || (isAxiosError(error) && error.response?.status === 404);
    return shell(<div className="mx-auto max-w-4xl px-4 py-16" role="alert">
      <h1 className="text-2xl font-bold">{missing ? '제보를 찾을 수 없습니다' : '제보를 불러오지 못했습니다'}</h1>
      <Link to={reportListPath(report?.kind)} className="mt-4 inline-block text-brand-accent underline">목록으로 돌아가기</Link>
    </div>);
  }

  const fields = [
    ['날짜', [report.occurredOn, report.approximateTime].filter(Boolean).join(' · ')],
    ['지역', [report.region, report.landmark].filter(Boolean).join(' · ')],
    ['동물', [report.species, report.animalName].filter(Boolean).join(' · ')],
    ['털색·크기', [report.coatColor, report.animalSize].filter(Boolean).join(' · ')],
    ['구별되는 특징', report.distinguishingFeatures],
    ['이동 방향', report.direction],
  ].filter(([, value]) => value);

  function handleDelete() {
    if (window.confirm('이 제보를 삭제하시겠습니까? 삭제 후에는 목록에 표시되지 않습니다.')) {
      deleteMutation.mutate();
    }
  }

  return shell(<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
    <Link to={reportListPath(report?.kind)} className="mb-6 inline-flex items-center gap-1 text-gray-600 hover:text-brand-accent dark:text-gray-300">
      <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span> 목록으로
    </Link>
    <article className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="mb-3 inline-block rounded-full bg-brand/20 px-3 py-1 text-sm font-semibold text-brand-accent">
            {report.kind === 'MISSING' ? '실종 알림' : '목격 제보'}
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">{report.title}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {report.authorNickname || `작성자 ${report.authorId}`} · {new Date(report.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
        {user?.id === report.authorId && <div className="flex gap-2">
          <Link to={`/reports/${reportId}/edit`} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold dark:bg-gray-700">수정</Link>
          <button type="button" onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300">삭제</button>
        </div>}
      </div>
      {deleteMutation.isError && <p role="alert" className="mt-4 text-sm text-red-600">삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
      {report.imageUrls.length > 0 && <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {report.imageUrls.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`${report.kind === 'MISSING' ? '실종 동물' : '목격 동물'} 사진 ${index + 1}`} className="max-h-96 w-full rounded-lg bg-gray-100 object-contain" onError={(event) => { event.currentTarget.src = placeholderImg; }} />)}
      </div>}
      <section className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900" aria-label="제보 정보">
        <h2 className="text-lg font-bold">{report.kind === 'MISSING' ? '실종 정보' : '목격 정보'}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {fields.map(([label, value]) => <div key={label}><dt className="font-semibold text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value}</dd></div>)}
        </dl>
      </section>
      <p className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">{report.description}</p>
    </article>
  </div>);
}
