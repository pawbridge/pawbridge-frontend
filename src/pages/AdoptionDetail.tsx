import { Link, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import placeholderImg from '../assets/image-placeholder.svg';

const mockAdoptionPost = {
  postId: 1,
  title: '우리집 복덩이, 사랑스러운 뭉치를 소개해요!',
  content: `뭉치를 처음 만난 건 비가 오던 날이었어요. 작은 상자 안에서 떨고 있는 아이를 보고 그냥 지나칠 수가 없었죠. 처음에는 경계심이 많아 다가오지도 않던 아이가 이제는 제 껌딱지가 되었답니다.

매일 아침 저를 깨워주고, 산책할 때 신나게 뛰어다니는 모습을 보면 저도 모르게 웃음이 나요. 뭉치 덕분에 저희 집에는 웃음꽃이 활짝 피었습니다. 사지 않고 입양하길 정말 잘했다는 생각이 듭니다. 유기동물 입양을 고민하시는 분들이 있다면, 망설이지 마세요. 아이들에게 따뜻한 가족이 되어주세요!`,
  boardType: 'ADOPTION',
  authorId: 123,
  createdAt: '2024.07.15',
  imageUrls: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCsRc9l2O17ADBABzPyWJoaaSwCJ4GB0cpKnZxJJJ60JVsZ3KAyzvzk4h4z9EmLuWbJlGk8ZiLay2ifp3ouA2Y3piy8oW-eCF6u6Su2KEwSzZvrZGr1Kq2LwkmSf9nxfW-hfgkeQy7NsAYqX5ewuueFqGdq3rfXGEu8MMCZttlLy_7DfEtNRFyPgZ9N6qy2mQPLZZ-wi8fZoelzTaH-1eCQd36qyGmHXxdzVbCeS-P0nHdYEyVrSxjRh_sqQkFW4PtxjcrLw6pVuBU',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA1c62BLXJpx2qN_bOrDwzkyd5EzIFte-npX68Flx-_VjTsAZ2e2WzchvmtfISMoTlT8eKawVafhkD3E6MEmFrHMac7xD3XAERcVmMX5LAfgnWwXlQWeVPkgGUC98-UVeV2P7WhgY3-XzTn9-fXvJ9KpUreq-RuEyLlsBpPwNwcJfmsecTudekzIg8YZYgYo5SGrJ2evEzCk4LPFQctUhfUl9_ltyqD1JkPWselk4uPixmfws9glS09Ra53GAR5EVxgFAWZdxw1qwg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDUZBJ3AA1MT8_7kK1H6a44vgEm4XZp7jDBTAJVexzgL2YZdu1or1Iy1Sx7h6Atcm5vXGLaOcyvpzifLVsG4HQF5COXKjX1ZPh4uWuT7dtY9M-H2uITMAIA8HxNRy3VcqQiX2X6iiG_6ndjV_-ZGW7hmBZSPuzSnA9f92NYTfjhpAU0lwzPIJQ8Y3aovELFPqO3CjDUoXgkn3OM-NSUOSJ8B3MCfl0N47GlKU7Ke_FfzseeA_d62z5q88r7YfB6hR31zHH1Gm53Wfk',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuATVxU_x905oaEWE22ZPMQCFp5RmQZo6H-Y1m_T22GbiLD1eqMjUpyv_iVailxq9HNxJlctcFdrUH2XkCrunwYRTTqAp9QIbyPChUCih9PDb_V45gWNZgZl50vFt-ujhsxExql5n8UZ0NzhAWHG9D3TKV_w4iU0Qx3JpN-IGhaDo4RANl1F3hnSyiaYNtlpY4k9ckNlwtcGPe_o6XBBzb-GdfoaM6vxxFduSomhCMv1ScoenoK_stHELTVm1wmR7OPBeyltH6_aVJ8',
  ],
};

const mockComments = [
  {
    commentId: 1,
    authorId: 456,
    authorName: 'petlover123',
    content: '뭉치 너무 귀여워요! 좋은 가족 만나서 다행이네요. 항상 행복하세요!',
    createdAt: '2024.07.16',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDr09dz-z9gZDnIud3imVS0mOVr2msYY8k5BJCi5BC6vfYCc83UbT-hzM9zqcYMb4sKNAln2-zXpGgX4X8x_dplZP_Ed3z3bBBrHoKgkoXi3F-hriTxVioSOefwSu9SY0T8mtPZUOLfr8QcvppYL7PQXPEGj9YTpS5oUE59FYS8pU18w0scP1ap8ajJutWYfrR82bED0tl-wBJJyxklXG5W7K4c8pSrj6mfMVKOZXZVPx-ZkqqUBaFfp-XVBE_Rj68U4TuAnpQuK_E',
  },
  {
    commentId: 2,
    authorId: 789,
    authorName: 'angel_paws',
    content: '정말 감동적인 이야기네요. 뭉치도, 작성자님도 꽃길만 걸으시길 바랍니다.',
    createdAt: '2024.07.15',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbuFN2N-AFKQV5ujFHl6PhWGc8PfPMmNn73KdemWNG8VOnovjMXbPInRB2BEJ0ZAcF9j-s-isHLTrDpMM9_dzaeM6KwztasBqfYFvQigsvF1wEvjDPjR_6_ONpjR4mN-W7t9s-Vu9lj6CfgJ6AyXrKcnGZ_fadNbphCeAJJdfEgzDR5tiT4162FFV0rXeTLKvrj7VVfx2CGtimELAKc21o9xbUwBjlK7eVcTZw2t_svy5fP50zCTt4ySeGnZ9V4wuzi9AOsPW-2D8',
  },
];

export default function AdoptionDetail() {
  const { id } = useParams<{ id: string }>();
  const mainImage = mockAdoptionPost.imageUrls?.[0] || placeholderImg;
  const thumbnails = mockAdoptionPost.imageUrls?.slice(1) || [];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-[#111816] dark:text-gray-200">
      <Header />
      <main className="flex flex-1 justify-center py-10">
        <div className="layout-content-container flex flex-col max-w-4xl flex-1 px-4">
          {/* PageHeading */}
          <div className="flex flex-col gap-3 p-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="flex flex-col gap-3">
                <span className="inline-block bg-primary/20 text-primary-dark font-bold text-xs px-2 py-1 rounded-full w-fit">
                  입양후기
                </span>
                <h1 className="text-[#111816] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                  {mockAdoptionPost.title}
                </h1>
              </div>
              {/* ButtonGroup */}
              <div className="flex-shrink-0">
                <div className="flex gap-2">
                  <Link
                    to={`/adoption/${id}/edit`}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700 text-[#111816] dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <span className="truncate">수정</span>
                  </Link>
                  <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-gray-600 dark:text-gray-400 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-100 dark:hover:bg-gray-800">
                    <span className="truncate">삭제</span>
                  </button>
                </div>
              </div>
            </div>
            {/* MetaText */}
            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal pt-2">
              작성자ID: user_{mockAdoptionPost.authorId} | 작성일: {mockAdoptionPost.createdAt}
            </p>
          </div>

          {/* Carousel / Post Body */}
          <div className="flex flex-col gap-8 px-4">
            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              <div
                className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl bg-gray-200 dark:bg-gray-800"
                style={{ backgroundImage: `url(${mainImage})` }}
              />
              {thumbnails.length > 0 && (
                <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex items-stretch p-1 gap-3">
                    {thumbnails.map((url, idx) => (
                      <div
                        key={idx}
                        className={`flex h-full flex-1 flex-col rounded-lg min-w-40 cursor-pointer ${
                          idx === 0 ? 'border-2 border-primary' : 'opacity-60 hover:opacity-100 transition-opacity'
                        }`}
                      >
                        <div
                          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-md"
                          style={{ backgroundImage: `url(${url})` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-300 leading-relaxed">
              <p className="whitespace-pre-line">{mockAdoptionPost.content}</p>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200 dark:border-gray-800 my-12" />

          {/* Comment Section */}
          <div className="flex flex-col gap-8 px-4">
            <h3 className="text-xl font-bold text-[#111816] dark:text-white">댓글</h3>

            {/* Comment Form (Logged In) */}
            <div className="flex flex-col gap-3">
              <textarea
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-gray-800 dark:text-gray-200 placeholder-gray-400"
                placeholder="따뜻한 댓글을 남겨주세요..."
                rows={4}
              />
              <button className="self-end flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#111816] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90">
                <span className="truncate">댓글 등록</span>
              </button>
            </div>

            {/* Comment List */}
            <div className="flex flex-col gap-6">
              {mockComments.map((comment) => (
                <div key={comment.commentId} className="flex gap-4">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gray-200"
                    style={{ backgroundImage: `url(${comment.avatar})` }}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111816] dark:text-white">{comment.authorName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{comment.createdAt}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
