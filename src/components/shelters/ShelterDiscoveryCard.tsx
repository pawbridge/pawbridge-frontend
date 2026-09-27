import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ShelterAnimalPreview, ShelterDiscovery } from '../../api/publicShelters.api';
import { shelterAnimalUrl, writeShelterDiscovery, type ShelterDiscoveryFilters } from '../../utils/shelterDiscovery';
import ShelterHistory from './ShelterHistory';

function Preview({ animal, returnTo }: { animal: ShelterAnimalPreview; returnTo: string }) {
  const [failed, setFailed] = useState(false);
  return <Link to={`/animals/${animal.id}`} state={{ searchReturnTo: returnTo }} className="flex w-40 shrink-0 flex-col overflow-hidden rounded-lg border border-brand-border bg-white text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-focus md:w-auto md:flex-row">
    {animal.imageUrl && !failed ? <img src={animal.imageUrl} onError={() => setFailed(true)} alt={`${animal.breed || '동물'} 보호 사진`} loading="lazy" className="h-36 w-full object-cover md:h-36 md:w-32" />
      : <div className="flex h-36 w-full shrink-0 items-center justify-center bg-stone-100 text-xs text-brand-muted md:w-32">사진 준비 중</div>}
    <div className="min-w-0 space-y-1 p-3"><p className="break-words text-sm font-bold">{animal.breed || ({ DOG: '개', CAT: '고양이', ETC: '기타 동물' }[animal.species] || '동물')}</p>
      <p className="text-xs text-brand-muted">{animal.birthYear ? `${animal.birthYear}년생` : '연령 미상'} · {animal.gender === 'MALE' ? '수컷' : animal.gender === 'FEMALE' ? '암컷' : '성별 미상'}</p>
      <p className="text-xs text-brand-muted">접수 {animal.happenDate}</p><p className="text-xs font-medium">보호중</p>
    </div>
  </Link>;
}

export default function ShelterDiscoveryCard({ shelter, filters }: { shelter: ShelterDiscovery; filters: ShelterDiscoveryFilters }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const animalUrl = shelterAnimalUrl(shelter.id, filters);
  return <article className="rounded-xl border border-brand-border bg-white p-4 dark:bg-card-dark md:p-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div className="min-w-0">
      <p className="text-xs text-brand-muted dark:text-gray-300">{shelter.address || '주소 미등록'}</p>
      <h2 className="mt-2 break-words text-xl font-bold">{shelter.name}</h2>
      <p className="mt-3 inline-block rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-ink">조건에 맞는 보호중 <strong>{shelter.protectedCount.toLocaleString()}마리</strong></p>
    </div><Link to={`/shelters/${encodeURIComponent(shelter.careRegNo)}?${writeShelterDiscovery(filters)}`} className="min-h-11 shrink-0 self-start py-3 text-sm underline underline-offset-4">보호소 정보 →</Link></div>
    <p className="mt-4 text-xs leading-5 text-brand-muted dark:text-gray-300">사진으로 만나보고, 보호소에 방문 전 문의해 주세요.</p>
    <div aria-label={`${shelter.name} 보호중 동물 미리보기`} className="mt-3 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3">{shelter.animals.map(animal => <Preview key={animal.id} animal={animal} returnTo={animalUrl} />)}</div>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row"><Link to={animalUrl} className="flex min-h-11 items-center justify-center rounded-lg bg-brand px-6 text-sm font-bold text-brand-ink hover:bg-brand-hover">이 보호소 동물 보기 →</Link>
      <button type="button" aria-expanded={historyOpen} aria-controls={`shelter-history-${shelter.id}`} onClick={() => setHistoryOpen(!historyOpen)} className="min-h-11 rounded-lg border border-brand-border px-6 text-sm font-medium">보호 현황 {historyOpen ? '접기 −' : '펼치기 +'}</button></div>
    <div id={`shelter-history-${shelter.id}`}>{historyOpen && <ShelterHistory shelterId={shelter.id} />}</div>
  </article>;
}
