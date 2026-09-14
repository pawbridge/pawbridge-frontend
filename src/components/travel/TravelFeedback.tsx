export default function TravelFeedback({ title, description, error = false, onRetry }: {
  title: string; description: string; error?: boolean; onRetry?: () => void;
}) {
  return (
    <section role={error ? 'alert' : 'status'} className="rounded-xl border border-border-light bg-gray-50 px-6 py-16 text-center dark:border-border-dark dark:bg-card-dark">
      <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{description}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-6 h-12 rounded-lg bg-primary px-6 text-sm font-bold text-primary-content hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
          다시 시도
        </button>
      )}
    </section>
  );
}
