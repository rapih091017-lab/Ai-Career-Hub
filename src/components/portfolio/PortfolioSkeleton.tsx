type Props = { message?: string };

export default function PortfolioSkeleton({ message }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin" aria-hidden>
          progress_activity
        </span>
        <span className="text-sm">{message ?? "Memuat"}</span>
      </div>
    </div>
  );
}
