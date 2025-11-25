import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMockAnimals } from '../api/animals.api.mock';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function Home() {
  // 동물 데이터 가져오기
  const { data } = useQuery({
    queryKey: ['animals'],
    queryFn: getMockAnimals,
  });

  // 최근 등록 동물 (4마리만)
  const featuredAnimals = data?.content?.slice(0, 4) || [];

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
                linkTo="/reviews"
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
                linkTo="/shop"
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
            <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="flex items-stretch p-4 sm:p-6 lg:p-8 gap-6">
                {featuredAnimals.length > 0 ? (
                  featuredAnimals.map((animal) => (
                    <AnimalCardSimple
                      key={animal.id}
                      name={animal.name}
                      breed={animal.breed}
                      imageUrl={animal.imageUrl}
                      id={animal.id}
                    />
                  ))
                ) : (
                  <>
                    <AnimalCardSimple
                      name="바둑이"
                      breed="골든 리트리버"
                      imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDMgcBlbR5P0T3UC_6l3JrHd9DE9I2zz87Uag3cRuF5czZ7nEQmabQcYrFI2DPanljMdEaKqA_0gyrENYMQJfvGWo1DGVwwSZK7o91ryg8akNxCiiN7wY0UTBe4V6QM3cjy8KObdTJzDs9agtDpj0LJlyD0Xe02CGu5-WhyWuKZNEn78nadkEbAjuaFjt4BKRvaFZ2H_XAX3XqkeTkuS1Y2eqQ4LKCWvnSl4-XlraCG2Y3UnNpr6Oga1Xtldz_uMQIH7vgQ0Mx9DHA"
                    />
                    <AnimalCardSimple
                      name="나비"
                      breed="코리안 숏헤어"
                      imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCyrmkyDD6KenRKrm2H7JstrlMRPv4zAm-kCPDsiNdkwyyveBSw2PeiscrB2s_wUQMsZYlhMoSbMsJpQ50f5cEtIfxJmbTlPoqnppFEFYmK3Gn0e43ICQRskLAn74rujZliYFA1NouLUCRUNM-sIBuklj0dW05wRYhUPMXcZRH8o6qIYq2I_grKbjyU7qzLnQ3J7uT30bkNCSivG8Wlw2ypGSMUyeZgenXsVyQjfzo-C_46AHdsywFrRPIaX8XPvU4TPmxi5BgZ1B4"
                    />
                    <AnimalCardSimple
                      name="뭉치"
                      breed="말티즈"
                      imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuB2u3wtkaHV9mXKaJ9n1pNyo69MetKl86Tf3wdSMJ5LEcJ3FhMbx3ECb0Ovfc-kN7Af_ypKVJHfyoKGzyIp38PPREXJjp_GnzDs_UTiajKaq6ppm8C48YryVw38b2dXRUkbbtUTxOPpW_wkwf2SDftYg8ChEATuyxND4zsFEGAL7ApGgTiy1yOS595-jirdiryHNRNcfEHAgep_IZTrsOAYkXlzBBWUCCoqGQD9olWQqUkOdDO0SlueiAsQiTQ1hWqH3yrnoMJgo6A"
                    />
                    <AnimalCardSimple
                      name="까미"
                      breed="믹스"
                      imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCbMqOyqi1z3PEo4w20mta8PS1bghve1x-UiD33zdPCWICNqhB0Y2dQqTBWI4RZ47B7geMYBYrUhXcleL_T4ykC0b-DFCT-itLN5WozZrdx0_U61V_lGnuoBMkaCKjSmTXulOY7xevIK-tP3zwbvlCAv7fNB4K8QUxQA3HbhxDs7g6jRkCGvqcIQWnRQvYTEzixmQd70QeWneYzNs2LqydMqG0-CjJ1amtQD4saGw2t3Bz4gN0vHVBdC1WZOdWsWzjjoW5NbUCAFoo"
                    />
                  </>
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
              <Link to="/reviews" className="text-primary text-sm font-bold hover:underline">
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

// Quick Navigation Card 컴포넌트
interface QuickNavCardProps {
  title: string;
  description: string;
  imageUrl: string;
  linkTo: string;
}

function QuickNavCard({ title, description, imageUrl, linkTo }: QuickNavCardProps) {
  return (
    <Link
      to={linkTo}
      className="flex flex-col gap-4 p-6 rounded-xl bg-white dark:bg-background-dark dark:border dark:border-primary/20 shadow-sm hover:shadow-lg transition-shadow"
    >
      <div
        className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
        style={{ backgroundImage: `url("${imageUrl}")` }}
      />
      <div>
        <p className="text-primary-content dark:text-white text-lg font-bold leading-normal">
          {title}
        </p>
        <p className="text-secondary-content dark:text-gray-400 text-sm font-normal leading-normal">
          {description}
        </p>
      </div>
    </Link>
  );
}

// Simple Animal Card 컴포넌트
interface AnimalCardSimpleProps {
  name: string;
  breed: string;
  imageUrl: string;
  id?: number;
}

function AnimalCardSimple({ name, breed, imageUrl, id }: AnimalCardSimpleProps) {
  const linkTo = id ? `/animals/${id}` : '/animals';
  
  return (
    <Link
      to={linkTo}
      className="flex flex-col gap-4 rounded-xl bg-white dark:bg-background-dark dark:border dark:border-primary/20 shadow-sm min-w-64 sm:min-w-72 hover:shadow-lg transition-shadow"
    >
      <div
        className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-t-xl"
        style={{ backgroundImage: `url("${imageUrl}")` }}
      />
      <div className="flex flex-col flex-1 justify-between p-4 pt-0 gap-4">
        <div>
          <p className="text-primary-content dark:text-white text-base font-bold leading-normal">
            {name}
          </p>
          <p className="text-secondary-content dark:text-gray-400 text-sm font-normal leading-normal">
            {breed}
          </p>
        </div>
        <button className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary/20 text-primary-content dark:bg-primary/30 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors">
          <span className="truncate">더보기</span>
        </button>
      </div>
    </Link>
  );
}

// Adoption Story 컴포넌트
interface AdoptionStoryProps {
  tag: string;
  title: string;
  excerpt: string;
  imageUrl: string;
}

function AdoptionStory({ tag, title, excerpt, imageUrl }: AdoptionStoryProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 group cursor-pointer">
      <div className="w-full sm:w-1/3 flex-shrink-0">
        <div
          className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
      </div>
      <div className="text-center sm:text-left">
        <p className="text-secondary-content dark:text-gray-400 text-sm">{tag}</p>
        <h4 className="text-primary-content dark:text-white text-lg font-bold mt-1 group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-secondary-content dark:text-gray-400 text-sm mt-2 line-clamp-2">
          {excerpt}
        </p>
      </div>
    </div>
  );
}
