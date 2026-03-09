import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';
import { getAnimals } from '../api/animals.api';
import { getTodayAnimalStats, getAnimalStatusStats } from '../api/animalStats.api';
import type { Animal } from '../types/api.types';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnimalCardSimple from '../components/common/AnimalCardSimple';
import QuickNavCard from '../components/common/QuickNavCard';
import AdoptionStory from '../components/common/AdoptionStory';

export default function Home() {
  const { data: todayStats } = useQuery({
    queryKey: ['today-animal-stats'],
    queryFn: getTodayAnimalStats,
  });

  const { data: statusStats } = useQuery({
    queryKey: ['animal-status-stats'],
    queryFn: () => getAnimalStatusStats(),
  });

  const statsRates = (() => {
    if (!statusStats?.length) return null;
    const total = statusStats.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return null;
    const adopted = statusStats.find((s) => s.status === 'ADOPTED')?.count ?? 0;
    const euthanized = statusStats.find((s) => s.status === 'EUTHANIZED')?.count ?? 0;
    return {
      adoptionRate: ((adopted / total) * 100).toFixed(1),
      euthanasiaRate: ((euthanized / total) * 100).toFixed(1),
    };
  })();

  // 동물 데이터 가져오기 (실제 백엔드 API)
  const { data } = useQuery({
    queryKey: ['featured-animals'],
    queryFn: () => getAnimals({ page: 0, size: 20, sort: 'createdAt,desc', status: 'PROTECT' }),
  });

  // 최근 등록 동물 (20마리)
  const featuredAnimals = data?.content?.slice(0, 20) || [];

  // 마우스 드래그 스크롤을 위한 ref와 state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [_justDragged, setJustDragged] = useState(false); // 드래그 후 클릭 방지용 (리렌더링 필요, 현재 미사용)
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0); // 드래그 시작 시점의 스크롤 위치
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const dragDistanceRef = useRef(0); // 드래그 거리 추적 (클릭 vs 드래그 구분용)
  const finalDragDistanceRef = useRef(0); // 최종 드래그 거리 저장 (클릭 이벤트에서 사용)
  const prevXRef = useRef(0); // 이전 마우스 위치 (속도 계산용)
  const prevTimeRef = useRef(0); // 이전 시간 (속도 계산용)
  const timeoutRef = useRef<{ justDragged?: number; reset?: number }>({}); // setTimeout ID 저장

  // 관성 스크롤 애니메이션
  const animateInertialScroll = (velocity: number) => {
    if (!scrollContainerRef.current) return;
    
    let currentVelocity = velocity;
    const friction = 0.97; // 감속 계수 (더 천천히 감속하여 오래 지속)
    const minVelocity = 0.05; // 최소 속도 (더 오래 지속되도록 낮춤)
    
    const animate = () => {
      if (!scrollContainerRef.current) return;
      
      const container = scrollContainerRef.current;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const currentScrollLeft = container.scrollLeft;
      
      // 속도가 충분히 느려지거나 스크롤 범위를 벗어나면 멈춤
      if (Math.abs(currentVelocity) < minVelocity) {
        return;
      }
      
      // 스크롤 범위 체크
      const newScrollLeft = currentScrollLeft + currentVelocity;
      if (newScrollLeft <= 0) {
        container.scrollLeft = 0;
        return;
      }
      if (newScrollLeft >= maxScrollLeft) {
        container.scrollLeft = maxScrollLeft;
        return;
      }
      
      // 스크롤 업데이트
      container.scrollLeft = newScrollLeft;
      currentVelocity *= friction; // 점진적 감속
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  };

  // 마우스 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    e.preventDefault();
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    // clientX를 사용하여 정확한 마우스 위치 계산
    const x = e.clientX - rect.left;
    
    // 현재 스크롤 위치를 정확히 저장 (관성 스크롤 중일 수 있으므로)
    const currentScrollLeft = container.scrollLeft;
    
    setIsDragging(true);
    startXRef.current = x;
    lastXRef.current = x;
    prevXRef.current = x;
    startScrollLeftRef.current = currentScrollLeft; // 정확한 현재 위치 저장
    lastTimeRef.current = Date.now();
    prevTimeRef.current = Date.now();
    dragDistanceRef.current = 0;
    
    // 드래그 중 스냅 비활성화 및 스크롤 동작 변경
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
    container.style.scrollSnapType = 'none';
    container.style.scrollBehavior = 'auto';
  };

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;
      
      e.preventDefault();
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      // clientX를 사용하여 정확한 마우스 위치 계산 (컨테이너 영역을 벗어나도 정확함)
      const x = e.clientX - rect.left;
      const currentTime = Date.now();
      
      // 드래그 거리 계산
      const distance = Math.abs(x - startXRef.current);
      dragDistanceRef.current = distance;
      
      // 실시간 스크롤 (드래그 시작 시점의 scrollLeft 기준으로 상대적 이동)
      // 마우스 이동 거리만큼 직접 스크롤 (1:1 비율로 부드럽게)
      const walk = x - startXRef.current;
      let newScrollLeft = startScrollLeftRef.current - walk;
      
      // 스크롤 범위 제한 (무한 루프 방지)
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      // 범위를 벗어나도 드래그는 계속 반영되도록 하되, 최종 위치만 제한
      newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));
      
      // 즉시 스크롤 업데이트 (requestAnimationFrame 없이 직접)
      container.scrollLeft = newScrollLeft;
      
      // 이전 위치와 시간 업데이트 (속도 계산용)
      prevXRef.current = lastXRef.current;
      prevTimeRef.current = lastTimeRef.current;
      // 마지막 위치와 시간 업데이트 (속도 계산용)
      lastXRef.current = x;
      lastTimeRef.current = currentTime;
    };

    const handleMouseUp = (e?: MouseEvent) => {
      if (!scrollContainerRef.current) return;
      
      const finalDragDistance = dragDistanceRef.current;
      // 최종 드래그 거리를 저장 (클릭 이벤트에서 사용)
      finalDragDistanceRef.current = finalDragDistance;
      
      // 스냅 및 스크롤 동작 복원
      scrollContainerRef.current.style.scrollSnapType = '';
      scrollContainerRef.current.style.scrollBehavior = '';
      
      // 드래그 거리가 10px 이상이면 드래그로 판단 (클릭과 드래그 구분 개선)
      if (finalDragDistance >= 10) {
        // 드래그가 발생했으면 클릭 이벤트 차단
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        // 드래그가 발생했음을 표시 (클릭 방지용)
        setJustDragged(true);
        
        // 관성 스크롤 계산
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTimeRef.current;
        
        if (scrollContainerRef.current) {
          // 최근 이동 속도 계산 (더 정확한 관성 스크롤을 위해)
          // 마지막 두 프레임의 평균 속도 사용
          const recentMoveDistance = lastXRef.current - prevXRef.current;
          const recentTimeDiff = lastTimeRef.current - prevTimeRef.current;
          
          let velocity = 0;
          
          // 최근 이동 속도가 있으면 우선 사용
          if (recentTimeDiff > 0 && Math.abs(recentMoveDistance) > 0.1) {
            // 최근 이동 속도 (픽셀/밀리초)
            // 마우스를 왼쪽으로 드래그하면 (x 감소) → 스크롤은 오른쪽으로 (양수)
            // 마우스를 오른쪽으로 드래그하면 (x 증가) → 스크롤은 왼쪽으로 (음수)
            // 따라서 마우스 이동 방향과 반대로 스크롤해야 하므로 음수 부호 적용
            const recentVelocity = -recentMoveDistance / recentTimeDiff;
            // 픽셀/프레임 단위로 변환 (60fps 기준) 및 관성 조정
            velocity = recentVelocity * 16 * 0.4; // 0.4배로 더 줄여서 초기 속도 감소
          } 
          // 전체 드래그 속도 사용 (fallback)
          else if (timeDiff > 0) {
            const totalMoveDistance = lastXRef.current - startXRef.current;
            // 마우스 이동 방향과 반대로 스크롤해야 하므로 음수 부호 적용
            velocity = (-totalMoveDistance / timeDiff) * 16 * 0.4;
          }
          // 드래그 시간이 너무 짧으면 최소 속도 보장
          else if (timeDiff === 0 && finalDragDistance > 0) {
            const totalMoveDistance = lastXRef.current - startXRef.current;
            // 최소 속도 보장 (드래그 방향에 따라)
            velocity = totalMoveDistance > 0 ? -10 : 10; // 기본 관성 속도 더 감소
          }
          
          // 속도가 충분히 크면 관성 스크롤 실행
          if (Math.abs(velocity) > 0.1) {
            animateInertialScroll(velocity);
          }
        }
        
        // 일정 시간 후 클릭 허용 (150ms로 단축)
        // 이전 timeout이 있으면 정리
        if (timeoutRef.current.justDragged) {
          clearTimeout(timeoutRef.current.justDragged);
        }
        timeoutRef.current.justDragged = setTimeout(() => {
          setJustDragged(false);
          timeoutRef.current.justDragged = undefined;
        }, 150);
      } else {
        // 드래그가 아니면 즉시 클릭 허용
        setJustDragged(false);
        
        // 작은 이동(5px 미만)이었고 Link를 클릭한 경우를 대비하여
        // finalDragDistanceRef를 0으로 설정하여 클릭이 정상 작동하도록 보장
        // (handleMouseDown에서 이미 0으로 설정되었을 수 있지만, 안전을 위해 다시 설정)
        finalDragDistanceRef.current = 0;
      }
      
      setIsDragging(false);
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = 'auto';
      
      // 다음 클릭을 위해 일정 시간 후 드래그 거리 리셋
      // 이전 timeout이 있으면 정리
      if (timeoutRef.current.reset) {
        clearTimeout(timeoutRef.current.reset);
      }
      timeoutRef.current.reset = setTimeout(() => {
        dragDistanceRef.current = 0;
        finalDragDistanceRef.current = 0;
        timeoutRef.current.reset = undefined;
      }, 100);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // timeout 정리
        if (timeoutRef.current.justDragged) {
          clearTimeout(timeoutRef.current.justDragged);
          timeoutRef.current.justDragged = undefined;
        }
        if (timeoutRef.current.reset) {
          clearTimeout(timeoutRef.current.reset);
          timeoutRef.current.reset = undefined;
        }
      };
    }
  }, [isDragging]);

  // 마우스가 영역을 벗어났을 때
  const handleMouseLeave = () => {
    // 드래그 중이면 계속 유지 (전역 이벤트로 처리)
    if (!isDragging && scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = 'auto';
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex flex-col items-center w-full">
        <div className="flex flex-col max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          
          {/* Hero Section */}
          <section className="w-full">
            <div className="@container">
              <div className="flex flex-col gap-8 lg:flex-row items-center">
                <div className="flex flex-col gap-6 text-center lg:text-left lg:w-1/2">
                  <div className="flex flex-col gap-4">
                    <h1 className="text-primary-content dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl">
                      당신의 새로운 가족을 만나보세요
                    </h1>
                    <h2 className="text-secondary-content dark:text-gray-300 text-base font-normal leading-normal md:text-lg">
                      따뜻한 마음으로 새로운 가족을 기다리는 아이들에게 행복을 선물해주세요.
                    </h2>
                  </div>
                  <div className="flex justify-center lg:justify-start">
                    <Link
                      to="/animals"
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-primary-content text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
                    >
                      <span className="truncate">입양하러 가기</span>
                    </Link>
                  </div>
                </div>
                <div className="w-full lg:w-1/2">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                    style={{
                      backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDenZECn1u7387t3WiJDV7URspM4l1o5O0J6VorreK3Vm-wxP3pcWfBataN0cy95HL1WXGXtzn-tn2a01i8Xgs7mkwBjC7tm7q4GydZaix89ayiizK5D7kGPqqvG6g9iwa6IGt5wAGcJjknI5AMOc1IIwMDfUXUG-IjTr_aqTFWaCkIq8lnD5GBYtvJTpevARJpd4y918ZTNvL8S__4e4zW4G95qn4tU-4vAhz6R9Io6aZ5l7dcJZ22CLPcaCw-l3cZ8wJkXhXmzuY")`
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Quick Navigation Cards */}
          <section className="w-full mt-16 md:mt-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <QuickNavCard
                title="유기동물 검색"
                description="새로운 가족을 찾아주세요"
                imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCrD6_LqZjRX03evcBxtweTHIW85KXM6jdRogb7hwXOE9JNGd1gtGm1wdRleIzBxM1DvnGgSEZvBKPZsbV6UQEK_Yk6uHTTDZtJjrvqiSndDtcduQMtEYOX4hL0KGmAjoXJzuSpUwcznRJk7OBd41E6IOj4wCrN0c3mLR9EJcWxaUkkztIsH4A1p-_enHWTVVaJ-LoODJMsUeHUB7uDvc_W_BrF2MpoIaDTlfc29fWiMQe9fIPn3Syu1b2plTb8qM1yX32GU-A0TqI"
                linkTo="/animals"
              />
              <QuickNavCard
                title="입양 후기"
                description="행복한 가족들의 이야기"
                imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCZnmMwj1sQujLNMU2G9XTgHtwKL24XL0yOL1elKhCSDohRG5Aeey-Sthw9ItD9V6ShHn57PJkOLNM0w6ka2ctc9DtNvBVi5z_NMejd2zxTXQ_P4mpzljjD_2_y0nMBQkR95DaK8yGcdW99YdZip_xgecv6zzfodFtHTQGqBwQSneO32hCic39HHnbQEeu7Jn7V0q5pSQihfPzI7jAGmiuJ1eSh7NdVG8raGk38b6ZVxPHjXAe_JH_Uk2rTBmAWwejIgzq8t2KjYPk"
                linkTo="/adoption"
              />
              <QuickNavCard
                title="커뮤니티"
                description="정보를 나누고 소통해요"
                imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBhiWx6nmStjS8IStfqhZzQy6YLDj2CMVYR7TJQeHh9-87fOkK5MSM3as6HIxe4OUwl4m2GPidWZSpV9V-ja56ZOgrJAVswLZKU3xLZiilJ9xfUgb5Gc9c_hE3nMpTi0E45kOhErcUjdii3FPjEAss9qoMnnBlj2tg_lLGRxpyqaZ_Bp17maZlL726ob4nX3z-K-2CDzAfA3z8CxtYntm97OLlzRRh8mmlsgZ6rO6tm1Qs7ZkreUiptN0rAjPnBlRQ_z_Oqt-49Noo"
                linkTo="/community"
              />
              <QuickNavCard
                title="상점"
                description="반려동물을 위한 상품"
                imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBdBJ6x-ervqeL_a8y7L6tn1vBA4JV7fJsMi6eCQrQ-iA3rlKTiDf9AGlKdxSSWuq9-a2nsr2sB7UKiPnPpyj--ShW2aJ7x7ocg4gXNKxXLsnqdVhUNNHQvP6YAreAp8d-VwagvNVDZZDyBxLd1lGsWE8Dhk7CPkke0PZ2A_ZOWmbKhwhqj1WdtatVBJy9HLVot03wDa3Oq_cwtEXOpISRog4YjV6jnhTWiFLfSr9fRTGfZ4wUJH3mfWQ7i21QN-U7i6jxB_6FhSY8"
                linkTo="/products"
              />
            </div>
          </section>

          {/* Today's Animal Stats */}
          <section className="w-full mt-16 md:mt-24">
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">bar_chart</span>
                  <span className="text-sm font-bold text-text-light dark:text-text-dark">
                    {todayStats?.date
                      ? `${todayStats.date.replace(/-/g, '.')} 유기동물 통계`
                      : '유기동물 통계'}
                  </span>
                </div>
                <Link to="/animals/stats" className="text-primary text-xs font-bold hover:underline flex items-center gap-0.5">
                  자세히 보기
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-light dark:divide-border-dark">
                <div className="flex items-center gap-4 px-5 py-5">
                  <div className="size-11 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-xl text-blue-500 dark:text-blue-400">pets</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">구조</p>
                    <p className="text-2xl font-black text-text-light dark:text-text-dark tracking-tight">
                      {todayStats?.rescuedToday ?? '—'}
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 ml-1">마리</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-5 py-5">
                  <div className="size-11 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-xl text-green-500 dark:text-green-400">favorite</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">입양률</p>
                    <p className="text-2xl font-black text-green-600 dark:text-green-400 tracking-tight">
                      {statsRates?.adoptionRate ?? '—'}
                      <span className="text-sm font-semibold ml-0.5">%</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-5 py-5">
                  <div className="size-11 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-xl text-red-500 dark:text-red-400">warning</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">안락사율</p>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
                      {statsRates?.euthanasiaRate ?? '—'}
                      <span className="text-sm font-semibold ml-0.5">%</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Animals Section */}
          <section className="w-full mt-16 md:mt-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-primary-content dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em]">
                새로운 가족을 기다려요
              </h2>
              <Link to="/animals" className="text-primary text-sm font-bold hover:underline">
                전체보기
              </Link>
            </div>
            <div
              ref={scrollContainerRef}
              className="flex flex-row overflow-x-hidden -mx-4 sm:-mx-6 lg:-mx-8 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onWheel={(e) => e.preventDefault()} // 마우스 휠 스크롤 방지
            >
              <div className="flex flex-row items-stretch p-4 sm:p-6 lg:p-8 gap-6">
                {featuredAnimals.length > 0 ? (
                  featuredAnimals.map((animal: Animal) => (
                    <div 
                      key={animal.id} 
                      className="min-w-[320px] max-w-[320px] flex-shrink-0"
                    >
                      <AnimalCardSimple 
                        animal={animal} 
                        onCardClick={(e) => {
                          // 최종 드래그 거리가 10px 이상이면 클릭 방지 (드래그로 판단)
                          // finalDragDistanceRef는 handleMouseUp에서 설정되므로 정확한 값 보장
                          // 단, handleMouseDown에서 Link 클릭 시 0으로 리셋되므로 안전
                          const dragDistance = finalDragDistanceRef.current;
                          
                          // 드래그 거리가 10px 이상이면 드래그로 판단하여 클릭 차단
                          if (dragDistance >= 10) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                          }
                          
                          // 클릭 허용 (dragDistance < 10 또는 0)
                          // finalDragDistanceRef는 다음 클릭을 위해 100ms 후 리셋됨
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    동물 정보를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Campaign Banner */}
          <section className="w-full mt-16 md:mt-24">
            <div className="w-full bg-primary/20 dark:bg-primary/30 rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-primary-content dark:text-white text-2xl font-bold">
                  겨울맞이 후원 캠페인
                </h3>
                <p className="text-secondary-content dark:text-gray-300 mt-2">
                  추운 겨울, 아이들이 따뜻하게 지낼 수 있도록 마음을 모아주세요.
                </p>
              </div>
              <Link
                to="/donate"
                className="flex-shrink-0 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-primary-content text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
              >
                <span className="truncate">자세히 보기</span>
              </Link>
            </div>
          </section>

          {/* Adoption Stories */}
          <section className="w-full mt-16 md:mt-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-primary-content dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em]">
                행복한 입양 후기
              </h2>
              <Link to="/adoption" className="text-primary text-sm font-bold hover:underline">
                더보기
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AdoptionStory
                tag="입양 1주년"
                title="우리 집에 온 작은 천사, 뽀삐"
                excerpt="뽀삐가 가족이 된 후로 저희 집에는 웃음꽃이 떠나질 않아요. 처음에는 낯을 많이 가렸지만..."
                imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCfhMqa7lyzEriR5tR0Dne9U5bpdmulNK7_eSGZ2MLZBCvl4bjhTENwUToOfPUe2YUeY5AVAmSnLzNb_Gv4hgjMgiitAa8sh_c_0oPaTAyFWrSLX5gdHfU-Ag-RMlYO4F9bVqQ8xcHk5tZIVu95ADLci19G_ryX3DrZLkK7Eb2wdu1rUFSsD6uZnXdRZqBtWC9lGN9aMxy0fmU2ALXuZnLeIAvpTZR680HHG0k1kI9LixavviwlaJZnBriwdchHshkib_LPZNE-j3U"
              />
              <AdoptionStory
                tag="최신 후기"
                title="소심했던 고양이, 이제는 애교쟁이!"
                excerpt="보호소에서 유독 조용했던 나비. 집에 온 첫날에는 숨기만 했는데, 이제는 제 무릎에서..."
                imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuC3MSPHepbUpXu_0jONMbZPFUuHuDz6-knINiiO51kU93h2vn-_GAPeoT1X7WKh9b7lyGOfn_Y8fFy5dBqxREj3VLLk1k65XFpIh28MhK0yqJMPA_p_HB7DPibTlPDG8Aouw0utlzghlCP_x6Iq8FNFBVF0BSj1b50YisKQ3KKzNpnocPr92kQjlSA8ItV5DTJfjABPGaRq_qpvmV52EJ2S6ntmIbc24T1mmA6F_IF6kYVkHvyvMHjeyP2sIV26bj8rzgE4OLzLznw"
              />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
