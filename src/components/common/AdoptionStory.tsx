interface AdoptionStoryProps {
  tag: string;
  title: string;
  excerpt: string;
  imageUrl: string;
}

export default function AdoptionStory({ tag, title, excerpt, imageUrl }: AdoptionStoryProps) {
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

