import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-200 mb-4">
          404
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          페이지를 찾을 수 없습니다
        </p>
        <Link 
          to="/" 
          className="px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 inline-block"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}