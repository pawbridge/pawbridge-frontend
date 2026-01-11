import { Link } from 'react-router-dom';

interface QuickNavCardProps {
  title: string;
  description: string;
  imageUrl: string;
  linkTo: string;
}

export default function QuickNavCard({ title, description, imageUrl, linkTo }: QuickNavCardProps) {
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


