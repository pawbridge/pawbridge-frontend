import { Link } from 'react-router-dom';

interface AdoptionStoryProps {
  postId: number;
  tag: string;
  title: string;
  excerpt: string;
  imageUrl?: string | null;
}

export default function AdoptionStory({ postId, tag, title, excerpt, imageUrl }: AdoptionStoryProps) {
  return (
    <Link
      to={`/adoption/${postId}`}
      className="flex flex-col sm:flex-row items-center gap-6 group cursor-pointer"
    >
      <div className="w-full sm:w-1/3 flex-shrink-0">
        {imageUrl ? (
          <div
            className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
            style={{ backgroundImage: `url("${imageUrl}")` }}
          />
        ) : (
          <div className="w-full aspect-square rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">image</span>
          </div>
        )}
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
    </Link>
  );
}
