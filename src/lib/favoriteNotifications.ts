import { animalSpeciesLabel } from './animalDisplay.ts';

interface NamedAnimal {
  breed: string | null;
  species: string | null;
}

interface ChangedItem {
  changedAt: string;
}

// 안락사·자연사는 사유를 보이지 않고 보호 종료로만 알린다.
const phrases: Record<string, string> = {
  NOTICE: '공고 중으로 바뀌었어요',
  PROTECT: '보호 중으로 바뀌었어요',
  ADOPTION_PENDING: '입양 대기 중이에요',
  ADOPTED: '입양됐어요',
  RETURNED: '보호자에게 돌아갔어요',
  DONATED: '기증됐어요',
  RELEASED: '방사됐어요',
  ESCAPED: '탈출 상태로 바뀌었어요',
  EUTHANIZED: '보호가 종료되었어요',
  NATURAL_DEATH: '보호가 종료되었어요',
};

export function favoriteNotificationPhrase(status: string) {
  return phrases[status] ?? '상태가 바뀌었어요';
}

export function favoriteAnimalName(animal: NamedAnimal) {
  return animal.breed?.trim() || animalSpeciesLabel(animal.species);
}

// 마지막으로 패널을 연 뒤에 바뀐 것만 새 소식으로 센다. 기록이 없으면 모두 새 소식이다.
export function unseenFavoriteCount(items: ChangedItem[], seenAt: string | null) {
  const seen = seenAt ? Date.parse(seenAt) : Number.NaN;
  if (Number.isNaN(seen)) return items.length;
  return items.filter((item) => Date.parse(item.changedAt) > seen).length;
}

export function latestFavoriteChange(items: ChangedItem[]) {
  return items.reduce<string | null>(
    (latest, item) => (!latest || Date.parse(item.changedAt) > Date.parse(latest) ? item.changedAt : latest),
    null,
  );
}

// 읽음 시각은 기기마다 브라우저에만 둔다. 저장소를 막은 브라우저에서는 매번 새 소식으로 보인다.
const seenKey = (userId: number) => `pawbridge:favorite-notifications-seen:${userId}`;

export function readFavoriteSeenAt(userId: number) {
  try {
    return window.localStorage.getItem(seenKey(userId));
  } catch {
    return null;
  }
}

export function writeFavoriteSeenAt(userId: number, seenAt: string) {
  try {
    window.localStorage.setItem(seenKey(userId), seenAt);
  } catch {
    // 저장하지 못해도 이번 화면에서는 읽음으로 보인다.
  }
}
