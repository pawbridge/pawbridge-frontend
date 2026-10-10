import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { findPublicShelter } from '../api/publicShelters.api';
import ShelterLayout from '../components/shelters/ShelterLayout';
import { shelterMapUrl, shelterTelephone } from '../lib/shelters';
import ShelterAnimals, { ShelterAnimalSummary } from '../components/shelters/ShelterAnimals';
import ShelterHistory from '../components/shelters/ShelterHistory';
import { shelterDetailReturnTo } from '../utils/shelterDetail';

function AddressActions({ name, address }: { name: string; address?: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopyState('copied');
    } catch { setCopyState('failed'); }
  };
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <a href={shelterMapUrl(name, address)} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-light px-4 text-sm font-semibold hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-focus dark:border-border-dark dark:hover:bg-gray-800">
        네이버 지도에서 보기 ↗<span className="sr-only"> (새 창)</span>
      </a>
      {address && <button type="button" onClick={() => void copyAddress()}
        className="min-h-11 rounded-lg border border-border-light px-4 text-sm font-semibold hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-focus dark:border-border-dark dark:hover:bg-gray-800">주소 복사</button>}
    </div>
    <p role="status" className="text-sm leading-6 text-gray-600 dark:text-gray-400">
      {copyState === 'copied' ? '주소를 복사했어요.' : copyState === 'failed' ? '자동으로 복사하지 못했어요. 위 주소를 선택해 복사해 주세요.' : null}
    </p>
  </div>;
}

export default function ShelterDetail() {
  const { registration = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const returnTo = shelterDetailReturnTo(params.get('returnTo') || (params.has('keyword') || params.has('address') ? `/shelters?${params}` : undefined));
  const result = useQuery({ queryKey: ['public-shelter', registration], queryFn: ({ signal }) => findPublicShelter(registration, signal), enabled: /^\d{15}$/.test(registration), retry: false });
  const shelter = result.data;
  const info = shelter?.publicInformation;
  const phone = shelter?.phone || info?.phone;
  const telephone = shelterTelephone(phone);
  const hours = (start?: string, end?: string) => start && end ? `${start} – ${end}` : '등록된 정보가 없어요';
  return <ShelterLayout><div className="mx-auto max-w-[1320px]">
    <Link to={returnTo} state={{ ...location.state?.shelterReturnState, shelterRestoreKey: location.state?.shelterReturnKey }} className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold text-brand-accent">← {/^\/animals\/\d+/.test(returnTo) ? '동물 상세로 돌아가기' : returnTo.startsWith('/animals') ? '동물 검색으로 돌아가기' : '보호소 목록으로 돌아가기'}</Link>
    {!/^\d{15}$/.test(registration) ? <h1 className="text-2xl font-bold">보호소 주소를 확인해 주세요</h1>
      : result.isPending ? <p role="status" className="py-16 text-center">보호소 정보를 불러오고 있어요.</p>
      : result.isError || !shelter ? <div role="alert"><h1 className="text-2xl font-bold">보호소 정보를 불러오지 못했어요</h1><button onClick={() => void result.refetch()} className="mt-5 min-h-12 rounded-lg bg-brand px-6 font-bold text-brand-ink">다시 시도</button></div>
      : <>
        <p className="text-sm text-gray-600 dark:text-gray-400">{shelter.organizationName}</p>
        <h1 className="mt-2 break-words text-[28px] font-bold leading-[42px] tracking-tight [overflow-wrap:anywhere] sm:text-[34px]">{shelter.name}</h1>
        <p className="mt-2 text-base leading-7 text-brand-muted dark:text-gray-300">위치와 운영시간을 확인하고, 보호 중인 동물들을 만나보세요.</p>
        <section id="shelter-information" aria-labelledby="shelter-information-heading" className="mt-6 scroll-mt-24">
          <h2 id="shelter-information-heading" className="text-xl font-bold">보호소 정보</h2>
          <div className="my-6 grid items-stretch gap-6 lg:grid-cols-2" data-testid="shelter-information">
            <section aria-labelledby="shelter-contact" className="min-w-0 rounded-xl border border-border-light p-5 dark:border-border-dark sm:p-6">
              <h3 id="shelter-contact" className="mb-6 text-xl font-bold leading-7">위치·연락처</h3>
              <dl className="space-y-5 text-sm leading-6">
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
                  <dt className="text-gray-600 dark:text-gray-400">주소</dt>
                  <dd className="break-words [overflow-wrap:anywhere]">{shelter.address || '등록된 정보가 없어요'}</dd>
                </div>
              </dl>
              <div className="mt-3 mb-5 sm:ml-[5.25rem]"><AddressActions key={shelter.address} name={shelter.name} address={shelter.address} /></div>
              <dl className="space-y-5 text-sm leading-6">
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3"><dt className="text-gray-600 dark:text-gray-400">전화</dt><dd className="break-words">{telephone ? <a href={telephone} className="underline underline-offset-4">{phone}</a> : phone || '등록된 정보가 없어요'}</dd></div>
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3"><dt className="text-gray-600 dark:text-gray-400">관할기관</dt><dd className="break-words">{shelter.organizationName || '등록된 정보가 없어요'}</dd></div>
              </dl>
              {telephone && <a href={telephone} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border-light px-5 text-sm font-semibold hover:bg-gray-50 dark:border-border-dark dark:hover:bg-gray-800 sm:w-auto">전화로 문의하기</a>}
            </section>
            <section aria-labelledby="shelter-hours" className="min-w-0 rounded-xl border border-border-light p-5 dark:border-border-dark sm:p-6">
              <h3 id="shelter-hours" className="mb-6 text-xl font-bold leading-7">운영시간</h3>
              {shelter.operatingHours ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{shelter.operatingHours}</p> : <dl className="space-y-5 text-sm leading-6">
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3"><dt className="text-gray-600 dark:text-gray-400">평일</dt><dd>{hours(info?.weekdayOpen, info?.weekdayClose)}</dd></div>
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3"><dt className="text-gray-600 dark:text-gray-400">주말</dt><dd>{hours(info?.weekendOpen, info?.weekendClose)}</dd></div>
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3"><dt className="text-gray-600 dark:text-gray-400">휴무일</dt><dd className="whitespace-pre-wrap break-words">{info?.closedDays || '등록된 정보가 없어요'}</dd></div>
              </dl>}
              <p className="mt-6 border-t border-border-light pt-5 text-sm leading-6 text-gray-600 dark:border-border-dark dark:text-gray-400">방문·입양 상담 시간은 전화로 먼저 확인해 주세요.</p>
            </section>
          </div>
          {shelter.introduction && <section className="mb-8"><h3 className="text-xl font-bold">보호소 소개</h3><p className="mt-3 whitespace-pre-wrap break-words leading-7">{shelter.introduction}</p></section>}
          {shelter.adoptionProcedure && <section className="mb-8"><h3 className="text-xl font-bold">입양 절차</h3><p className="mt-3 whitespace-pre-wrap break-words leading-7">{shelter.adoptionProcedure}</p></section>}
        </section>
        <div className="mt-8"><ShelterAnimalSummary shelterId={shelter.id} /></div>
        <nav aria-label="보호소 상세 바로가기" className="my-6 grid grid-cols-3 gap-2 sm:flex">
          {[['shelter-information', '보호소 정보'], ['shelter-animals', '보호 동물'], ['shelter-history', '보호 현황']].map(([id, label], index) => <a key={id} href={`#${id}`} className={`flex min-h-11 items-center justify-center rounded-2xl border border-brand-border px-2 text-sm font-medium sm:min-w-[150px] sm:px-5 ${index === 0 ? 'bg-brand text-brand-ink' : ''}`}>{label}</a>)}
        </nav>
        <ShelterAnimals key={shelter.id} shelterId={shelter.id} shelterName={shelter.name} />
        <section id="shelter-history" aria-labelledby="shelter-history-heading" className="mt-12 scroll-mt-24">
          <h2 id="shelter-history-heading" className="text-xl font-bold">보호 현황</h2>
          <ShelterHistory shelterId={shelter.id} />
        </section>
      </>}
  </div></ShelterLayout>;
}
