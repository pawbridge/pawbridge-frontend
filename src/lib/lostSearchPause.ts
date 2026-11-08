// 실종 사진 검색과 비슷한 동물 추천을 맡는 Mac 네이티브 서비스를 DINOv3 384 전환(갤러리 재계산) 동안 내려 둔다.
// 운영 빌드(--mode prod)에서만 켜지고, 브라우저 시험은 VITE_LOST_SEARCH_PAUSED=true 프로필로 잰다.
// 서비스를 다시 열면 이 파일과 이를 쓰는 안내를 함께 지운다.
export const lostSearchPaused = import.meta.env.MODE === 'prod' || import.meta.env.VITE_LOST_SEARCH_PAUSED === 'true';

export const lostSearchPauseNotice = {
  title: '사진 검색을 잠시 쉬고 있어요',
  description: '실종 동물 사진 검색을 더 정확하게 개선하고 있어요. 작업 기간에는 사진 검색과 비슷한 동물 추천을 잠시 쓸 수 없어요. 그동안은 보호 동물 목록에서 찾아 주세요. 작업이 끝나면 바로 다시 열게요.',
};

export const similarAnimalsPauseNotice = {
  title: '비슷한 동물 추천을 잠시 쉬고 있어요',
  description: '실종 동물 사진 검색을 개선하는 동안에는 비슷한 동물을 보여드릴 수 없어요. 작업이 끝나면 바로 다시 보여드릴게요.',
};
