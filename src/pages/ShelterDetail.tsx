import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { findPublicShelter } from '../api/publicShelters.api';
import ShelterLayout from '../components/shelters/ShelterLayout';
import { shelterMapUrl, shelterTelephone } from '../lib/shelters';

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
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-light px-4 text-sm font-semibold hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-border-dark dark:hover:bg-gray-800">
        네이버 지도에서 보기 ↗<span className="sr-only"> (새 창)</span>
      </a>
      {address && <button type="button" onClick={() => void copyAddress()}
        className="min-h-11 rounded-lg border border-border-light px-4 text-sm font-semibold hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-border-dark dark:hover:bg-gray-800">주소 복사</button>}
    </div>
    <p role="status" className="text-sm leading-6 text-gray-600 dark:text-gray-400">
      {copyState === 'copied' ? '주소를 복사했어요.' : copyState === 'failed' ? '자동으로 복사하지 못했어요. 위 주소를 선택해 복사해 주세요.' : null}
    </p>
  </div>;
}

export default function ShelterDetail() {
  const { registration = '' } = useParams();
  const [params] = useSearchParams();
  const result = useQuery({ queryKey: ['public-shelter', registration], queryFn: ({ signal }) => findPublicShelter(registration, signal), enabled: /^\d{15}$/.test(registration), retry: false });
  const shelter = result.data;
  const info = shelter?.publicInformation;
  const phone = shelter?.phone || info?.phone;
  const telephone = shelterTelephone(phone);
  const hours = (start?: string, end?: string) => start && end ? `${start} – ${end}` : '등록된 정보가 없어요';
  return <ShelterLayout>
    <Link to={`/shelters?${params.toString()}`} className="mb-8 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 dark:text-primary">← 검색 결과로 돌아가기</Link>
    {!/^\d{15}$/.test(registration) ? <h1 className="text-2xl font-bold">보호소 주소를 확인해 주세요</h1>
      : result.isPending ? <p role="status" className="py-16 text-center">보호소 정보를 불러오고 있어요.</p>
      : result.isError || !shelter ? <div role="alert"><h1 className="text-2xl font-bold">보호소 정보를 불러오지 못했어요</h1><button onClick={() => void result.refetch()} className="mt-5 min-h-12 rounded-lg bg-primary px-6 font-bold text-primary-content">다시 시도</button></div>
      : <>
        <p className="text-sm text-gray-600 dark:text-gray-400">{shelter.organizationName}</p>
        <h1 className="mt-3 break-words text-3xl font-bold tracking-tight sm:text-4xl">{shelter.name}</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">보호소 정보와 입양 문의 방법을 확인하세요.</p>
        <div className="my-8 grid items-stretch gap-6 lg:grid-cols-2" data-testid="shelter-information">
          <section aria-labelledby="shelter-contact" className="min-w-0 rounded-xl border border-border-light p-5 dark:border-border-dark sm:p-6">
            <h2 id="shelter-contact" className="mb-6 text-xl font-bold leading-7">위치·연락처</h2>
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
            <h2 id="shelter-hours" className="mb-6 text-xl font-bold leading-7">운영시간</h2>
            {shelter.operatingHours ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{shelter.operatingHours}</p> : <dl className="space-y-5 text-sm leading-6">
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3"><dt className="text-gray-600 dark:text-gray-400">평일</dt><dd>{hours(info?.weekdayOpen, info?.weekdayClose)}</dd></div>
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3"><dt className="text-gray-600 dark:text-gray-400">주말</dt><dd>{hours(info?.weekendOpen, info?.weekendClose)}</dd></div>
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3"><dt className="text-gray-600 dark:text-gray-400">휴무일</dt><dd className="whitespace-pre-wrap break-words">{info?.closedDays?.trim() === '0' ? '전화로 확인해 주세요' : info?.closedDays || '등록된 정보가 없어요'}</dd></div>
            </dl>}
            <p className="mt-6 border-t border-border-light pt-5 text-sm leading-6 text-gray-600 dark:border-border-dark dark:text-gray-400">방문·입양 상담 시간은 전화로 먼저 확인해 주세요.</p>
          </section>
        </div>
        {shelter.introduction && <section className="mb-8"><h2 className="text-xl font-bold">보호소 소개</h2><p className="mt-3 whitespace-pre-wrap break-words leading-7">{shelter.introduction}</p></section>}
        {shelter.adoptionProcedure && <section className="mb-8"><h2 className="text-xl font-bold">입양 절차</h2><p className="mt-3 whitespace-pre-wrap break-words leading-7">{shelter.adoptionProcedure}</p></section>}
        <section className="mt-8 border-t border-border-light pt-8 dark:border-border-dark"><h2 className="text-xl font-bold">이 보호소의 동물을 만나보세요</h2><Link to={`/animals?shelterId=${shelter.id}`} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-bold text-primary-content">보호 동물 보기</Link></section>
      </>}
  </ShelterLayout>;
}
