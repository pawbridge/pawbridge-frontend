import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { getAnimals } from '../api/animals.api';
import type { Animal } from '../types/api.types';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnimalCardSimple from '../components/common/AnimalCardSimple';
import QuickNavCard from '../components/common/QuickNavCard';
import AdoptionStory from '../components/common/AdoptionStory';

export default function Home() {
  // 동물 데이터 가져오기 (실제 백엔드 API)
  const { data } = useQuery({
    queryKey: ['featured-animals'],
    queryFn: () => getAnimals({ page: 0, size: 10, sort: 'createdAt,desc', status: 'PROTECT' }),
  });

  // 최근 등록 동물 (10마리)
  const featuredAnimals = data?.content?.slice(0, 10) || [];

  // 마우스 드래그 스크롤을 위한 ref와 state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // 마우스 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.userSelect = 'none';
  };

  // 마우스 드래그 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조절
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // 마우스 드래그 종료
  const handleMouseUp = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.userSelect = 'auto';
  };

  // 마우스가 영역을 벗어났을 때
  const handleMouseLeave = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.userSelect = 'auto';
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
              className="flex flex-row overflow-x-hidden -mx-4 sm:-mx-6 lg:-mx-8 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={(e) => e.preventDefault()} // 마우스 휠 스크롤 방지
            >
              <div className="flex flex-row items-stretch p-4 sm:p-6 lg:p-8 gap-6">
                {featuredAnimals.length > 0 ? (
                  featuredAnimals.map((animal: Animal) => (
                    <div key={animal.id} className="min-w-[320px] max-w-[320px] flex-shrink-0 snap-start">
                      <AnimalCardSimple animal={animal} />
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
