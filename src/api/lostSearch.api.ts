export interface LostAnimal {
  id: number;
  species: string;
  breed?: string;
  gender?: string;
  status: string;
  imageUrl?: string;
  happenDate?: string;
  happenPlace?: string;
  shelterName?: string;
  apmsNoticeNo?: string;
  specialMark?: string;
}

export interface LostCandidate {
  animal: LostAnimal;
  shelterPhone?: string;
  matchedEvidence: string[];
}

export interface LostSearchInput {
  image: File;
  species: 'DOG' | 'CAT';
  lostDate: string;
  region: string;
  description: string;
}

export async function findLostCandidates(input: LostSearchInput, signal: AbortSignal): Promise<LostCandidate[]> {
  const form = new FormData();
  form.append('image', input.image, 'photo');
  form.append('species', input.species);
  if (input.lostDate) form.append('lostDate', input.lostDate);
  if (input.region.trim()) form.append('region', input.region.trim());
  if (input.description.trim()) form.append('description', input.description.trim());
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 60_000);
  try {
    // Public upload: no JSON header, auth interceptor, persisted photo, or automatic retry.
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${base}/api/v1/animals/lost-candidates`, {
      method: 'POST', body: form, signal: controller.signal, credentials: 'omit',
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        400: '사진과 검색 조건을 확인해 주세요. JPG·PNG 정지 사진만 사용할 수 있어요.',
        413: '사진은 5MiB 이하로 선택해 주세요.',
        429: '검색 요청이 많아요. 잠시 기다린 후 다시 시도해 주세요.',
        503: '지금은 검색을 완료할 수 없어요. 잠시 후 다시 시도해 주세요.',
        504: '검색 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.',
      };
      throw new Error(messages[response.status] || '검색을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
    const data = await response.json();
    if (!Array.isArray(data?.candidates) || data.candidates.length > 20 || data.candidates.some((c: LostCandidate) =>
      !c?.animal || !Number.isSafeInteger(c.animal.id) || c.animal.id <= 0 || typeof c.animal.status !== 'string'
      || !Array.isArray(c.matchedEvidence) || c.matchedEvidence.some(e => typeof e !== 'string'))) {
      throw new Error('검색 결과를 확인할 수 없어요. 다시 시도해 주세요.');
    }
    return data.candidates;
  } catch (error) {
    if (timedOut) throw new Error('검색 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.');
    if (error instanceof TypeError) throw new Error('연결을 확인한 뒤 다시 시도해 주세요.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
