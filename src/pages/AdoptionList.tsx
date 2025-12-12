import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import placeholderImg from '../assets/image-placeholder.svg';

interface AdoptionPostSummary {
  postId: number;
  title: string;
  authorId: number;
  createdAt: string;
  imageUrls?: string[];
}

const mockAdoptionPosts: AdoptionPostSummary[] = [
  {
    postId: 1,
    title: '새로운 가족, 사랑이를 소개합니다!',
    authorId: 123,
    createdAt: '2023.10.27',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuClMIlAT1x8W4EOAA4suLM9yM-HzNK1p85c0Som6FLlRVjpwV8bt8CrzeXL9LGfFB8br2gGMG2Psfed1bFbuG08vuC9t0Mv-e5Aprceo5W8bPAu20uuvOMto3RtxM6N46auQIHOKX10StVJwO9stsP4h2DpmBhU-zJj1B6gSq_555LXoGJQgL5Hc4S7u2v9A3ZjqKDzRqhTD3szNjyQjC_Rqn4-rNSvkOHDE0Q804tNHWpdPIYEhdVBZIiJPoW0E41TlA2GZYYMj-s'],
  },
  {
    postId: 2,
    title: '보호소에서 우리 집 소파까지',
    authorId: 456,
    createdAt: '2023.10.26',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBqgfwUpdwJ0DtOmKSITcjLvJW_aPqZfCJWogDY2K5JYBSydEdVCYd5sTAVLboLfJfeB94tGOTgpALCw4SP3qqkAxRC6bf1LbYVe2yLwA772NXQgRwTCGJW9P4QCTM2l4eFB6ydQ5-jDh5trhFH8PtsRs_xOwsq2lLJIpNohk4u16JAPT_nM7teceVrypnVQwpWijUFeooy44zluMuMQWPfsBmUsd3GTgzt4NH1ZUcDTUDIWANqIQ-qTS5EaY2WnumenEkPWkAZvVs'],
  },
  {
    postId: 3,
    title: '새로운 고양이와의 멋진 여정',
    authorId: 789,
    createdAt: '2023.10.25',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAwsKhJozk8xrxkBYpqkAWqUHc_enm8J86MTBu4IBZE-y2vDTKdLU2kWLtucy4MDvmfauVNZc41svItMYQG7VdSD-LS2ot3pftTaB_INvj49z2HJcY1viBS9kk4hxKiC9ETSuIHa39ZPFdBnowMiH0qrw9YT9CLjtJnpYvgp8Yd5PghPiRLhJFWuP4DWP1Tjo35hHjyhIiu_NF2rNwzoRThXlua046GmSPzPXackSYn9UKMxCSNS8tR2zUR9PMlTJxCtZfHS-VnHys'],
  },
  {
    postId: 4,
    title: '오래오래 행복하게',
    authorId: 321,
    createdAt: '2023.10.24',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuD24ZLwSg0Ew3-Tzexlx_4U-sazTZC9Uudq7WbHGoqZylZylDz714ppeDw0N78V9XTHbm2yXOyh4dbBu3sXjPyrWBDpqOhBQOAaInYGbDU2b7BNZWqeccKIwcUZbq43mqsQwMAhorTWmU54LTqWriTY7hc0IijVCJdx2rXEosk8nkffJu3hjWOJC6_U1MgTY_oYfvOcTyAWVsby7NUvTnoRkc9kwpea4RdGtH1BwJw3X-0wCdPOEDTnA6z5VZ61uOEZ1kwscJhiv38'],
  },
  {
    postId: 5,
    title: '우리가 내린 최고의 결정',
    authorId: 654,
    createdAt: '2023.10.23',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuC7OUF12Z5VstlrygCN5ug54q4q8BHYiNlJcQiMOBQ10IJ5Anc1vcJDrJgOjyhJGVotloU0Fm03f5TkqFIjjx6KO81LcUnRXNn6DYFQtIfpwTu2FusOQ3-w5_l4GST-2BzRqGJFuE2DeOheDAS-m3cAQXopto3mWSEWAw0ST6BTxMYpJCPZjTqz-ml6JiQyIYTyrHhau5BEaaTltVZfV79MSA_qZ1-DmgXGvbQVrmlm1TiJRWGKuF8xEgEk9GvzTldISUVg0liUcvQ'],
  },
  {
    postId: 6,
    title: '그는 평생 가족을 찾았어요',
    authorId: 987,
    createdAt: '2023.10.22',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCbiPIF6YgQX54gENnqg-0Od-0whkPIBwnnGA7hfpj5fTWDjoiH6cpyR6YZ8hQkUNdQokimMZ23JIKN3sZXmnRHi_QUP8jeNDnZj9RIJrVRssyeqJCEMXrqJalKdU_RLnwNSz8vArrtxzBJjoEgcIXosT4QcdyaR6osH4e-GuGFRklVo9Dq63rj-7E9Jq3jjAj0ZyJ_aBNo8s-1YKJhsdXTkXNoYTkqOwRHWK8qGlAxAUeE5SMvl7hH8_WmIlNr9dnR2dKE1g4T6yY'],
  },
  {
    postId: 7,
    title: '세상에서 가장 사랑스러운 강아지',
    authorId: 147,
    createdAt: '2023.10.21',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuD7ZybVfcfEj2lt3foxz4GZd_Nm8EE6mBCRHAcSziu-QTrnXZf3WIX66jtpkGkoiG0bih-6duC_uo8jlVaqCUfHHfAIlxXxxT8JwYmqAxBEoiQ8cdO-6j6ILbe6c6gUYqvpiUxFX4hovjV2xxdLIXnhxAkDwhdEu4a8zaRGybx5X78IqrrChSP8PfRpHNWgiY3P6BB6WZxITPoX7-urpySYEGSSFJxpdeD0IdsFvTR0dcBiV4E_ipRUvObTjODKWCsizv3fLxUIqRU'],
  },
  {
    postId: 8,
    title: '입양 후 두 달',
    authorId: 258,
    createdAt: '2023.10.20',
    imageUrls: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBlvwEqEx987bIBZy4SO1iI-1TxvAiYJG1CenPa_mnccipsuYcdsWCQiKHpNaMgoJ33b1yqNIijju7L81A1pxw5VeHo8aXrfJt8JsShYslEScZrELbxHjntg14DQ2L-MAdY9Px7VSXOEqrmttaXyZgVpvd3xK-WV-CUL6TABB77gab4QH_pyWBhJO1NIrpmrrF0rtxfRdjch0BQqd-uEURdCJcd3QnzbjRMwu-7yuKtn6nUe9Uk1JV_KwgkNd3HJieUDygrGo4KHU4'],
  },
];

export default function AdoptionList() {
  const resolveImage = (urls?: string[]) => {
    const first = urls?.[0];
    if (!first) return placeholderImg;
    try {
      const host = new URL(first).hostname;
      if (host.includes('placeholder.com')) return placeholderImg;
      return first;
    } catch {
      return placeholderImg;
    }
  };

  const formatAuthor = (authorId: number) => {
    return `user_${authorId}`;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-[#111816] dark:text-gray-200">
      <Header />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* PageHeading */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8 sm:mb-12">
          <div className="flex min-w-72 flex-col gap-2">
            <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#111816] dark:text-white">입양후기</p>
            <p className="text-base font-normal leading-normal text-[#5f8c80] dark:text-gray-400">커뮤니티의 따뜻한 이야기들을 만나보세요.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#5f8c80] dark:text-gray-400">
              <span className="material-symbols-outlined text-lg">lock</span>
              <span>로그인이 필요한 서비스입니다.</span>
            </div>
            <Link
              to="/adoption/new"
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#111816] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
            >
              <span className="truncate">작성하기</span>
            </Link>
          </div>
        </div>

        {/* ImageGrid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockAdoptionPosts.map((post) => (
            <Link
              key={post.postId}
              to={`/adoption/${post.postId}`}
              className="group flex flex-col gap-3 pb-3 cursor-pointer"
            >
              <div className="overflow-hidden rounded-lg">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${resolveImage(post.imageUrls)})`,
                  }}
                />
              </div>
              <div>
                <p className="text-base font-medium leading-normal text-[#111816] dark:text-white">{post.title}</p>
                <p className="text-sm font-normal leading-normal text-[#5f8c80] dark:text-gray-400">
                  by {formatAuthor(post.authorId)} • {post.createdAt}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center p-4 mt-8 sm:mt-12">
          <button className="flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white">
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>
          <button className="text-sm font-bold leading-normal tracking-[0.015em] flex size-10 items-center justify-center text-[#111816] dark:text-white rounded-full bg-primary/30">
            1
          </button>
          <button className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white rounded-full">
            2
          </button>
          <button className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white rounded-full">
            3
          </button>
          <button className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white rounded-full">
            4
          </button>
          <button className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white rounded-full">
            5
          </button>
          <button className="flex size-10 items-center justify-center text-[#5f8c80] dark:text-gray-400 hover:text-[#111816] dark:hover:text-white">
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
