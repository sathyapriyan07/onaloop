import { ExternalLink } from "lucide-react";
import type { WikiData } from "../../lib/wikipedia";

interface WikipediaInsightsProps {
  data: WikiData | null;
  loading?: boolean;
}

export default function WikipediaInsights({ data, loading }: WikipediaInsightsProps) {
  if (loading) {
    return (
      <div className="mt-12 space-y-3">
        <div className="h-6 w-32 skeleton rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-11/12 skeleton rounded" />
          <div className="h-4 w-4/5 skeleton rounded" />
        </div>
        <div className="h-4 w-24 skeleton rounded" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">From Wikipedia</h2>
        {data.description && (
          <span className="text-xs text-white/30">{data.description}</span>
        )}
      </div>

      <p className="text-neutral-300 leading-relaxed">
        {data.extract}
      </p>

      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        Read full article
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
