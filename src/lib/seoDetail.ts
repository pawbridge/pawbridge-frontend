import type { Animal, PostResponse } from '../types/api.types';
import type { TravelDetail } from '../types/travel.types';
import { animalAgeLabel, animalGenderLabel, animalSpeciesLabel, animalStatusLabel, animalWeightLabel } from './animalDisplay.ts';
import { SITE_NAME } from './seo.ts';

// 상세 화면이 데이터를 받은 뒤 쓰는 제목과 설명.
// 주소만 보는 Worker와 RouteSeo는 같은 종류의 상세에 모두 같은 문구를 주므로,
// 구글이 수천 개의 동물 상세를 중복 페이지로 묶었다(Search Console 11/09).
export interface PageText {
  title: string;
  description: string;
}

interface ShelterText {
  name: string;
  organizationName?: string | null;
  address?: string | null;
  phone?: string | null;
}

// 검색 결과에서 잘리지 않는 길이에 맞춘다.
const descriptionLimit = 150;

function compact(value?: string | null): string {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function clip(value: string): string {
  return value.length > descriptionLimit ? `${value.slice(0, descriptionLimit - 1).trimEnd()}…` : value;
}

function titled(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

function dateLabel(date?: string | null): string {
  return date ? date.slice(0, 10).replace(/-/g, '.') : '';
}

// 공고번호 "인천-서구-2026-00297"의 앞 두 칸이 시도와 시군구다.
export function noticeRegion(noticeNo?: string | null): string {
  const parts = compact(noticeNo).split('-');
  return parts.length >= 4 && parts[0] && parts[1] ? `${parts[0]} ${parts[1]}` : '';
}

export function animalPageText(animal: Animal): PageText {
  const name = compact(animal.breed) || animalSpeciesLabel(animal.species);
  const gender = animalGenderLabel(animal.gender);
  const color = compact(animal.color);
  const status = animalStatusLabel(animal.status);
  const noticeNo = compact(animal.apmsNoticeNo) || compact(animal.noticeNo);
  const region = noticeRegion(noticeNo);
  const headline = [name, gender === '미상' ? '' : gender, color].filter(Boolean).join(' ');

  const traits = [
    gender === '미상' ? '' : gender,
    animal.age == null ? '' : animalAgeLabel(animal.age),
    animalWeightLabel(animal.weight) ?? '',
    color,
  ].filter(Boolean).join(', ');
  const place = compact(animal.happenPlace);
  const rescued = place
    ? `${[dateLabel(animal.happenDate), region, place].filter(Boolean).join(' ')}에서 구조된 ${name}`
    : `${region ? `${region}에서 구조된 ` : ''}${name}`;
  const shelterName = compact(animal.shelterName) || compact(animal.shelter?.name);
  const specialMark = compact(animal.specialMark);
  const description = [
    `${rescued}${traits ? `(${traits})` : ''}입니다.`,
    specialMark ? `특징: ${specialMark}.` : '',
    shelterName ? `${shelterName}, ${status}.` : `${status}.`,
    noticeNo ? `공고번호 ${noticeNo}` : '',
  ].filter(Boolean).join(' ');

  return {
    title: titled(`${headline}, ${region ? `${region} ` : ''}${status}`),
    description: clip(description),
  };
}

export function shelterPageText(shelter: ShelterText): PageText {
  const name = compact(shelter.name);
  const organization = compact(shelter.organizationName);
  const address = compact(shelter.address);
  const phone = compact(shelter.phone);
  const details = [address ? `주소 ${address}` : '', phone ? `연락처 ${phone}` : ''].filter(Boolean).join(', ');
  return {
    title: titled(organization ? `${name}, ${organization} 동물보호소` : `${name} 동물보호소`),
    description: clip(`${organization ? `${organization} ` : ''}동물보호소 ${name}의 운영시간과 보호 중인 동물을 확인하세요.${details ? ` ${details}.` : ''}`),
  };
}

export function travelPageText(detail: TravelDetail): PageText {
  const title = compact(detail.place.title);
  const address = compact(detail.place.address);
  const overview = compact(detail.overview);
  return {
    title: titled(`${title}, 반려동물 동반여행`),
    description: clip([
      address ? `${address}.` : '',
      overview || `${title}의 반려동물 동반 조건과 이용 정보를 확인하세요.`,
    ].filter(Boolean).join(' ')),
  };
}

export function postPageText(post: Pick<PostResponse, 'title' | 'content'>, kind: 'adoption' | 'community'): PageText {
  const title = compact(post.title);
  const content = compact(post.content);
  return {
    title: titled(kind === 'adoption' ? `${title}, 입양 후기` : title),
    description: clip(content || (kind === 'adoption' ? `${title} 입양 이야기를 확인하세요.` : `${title} 글을 확인하세요.`)),
  };
}
