import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { WikiData } from "../../lib/wikipedia";

interface WikipediaAboutSectionProps {
  data: WikiData | null;
  loading?: boolean;
}

export default function WikipediaAboutSection({ data, loading }: WikipediaAboutSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="mt-10 space-y-3">
        <div className="h-6 w-20 skeleton rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-11/12 skeleton rounded" />
          <div className="h-4 w-4/5 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const shouldTruncate = data.extract.length > 300;
  const displayText = shouldTruncate && !expanded
    ? data.extract.slice(0, 300) + "..."
    : data.extract;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-semibold">About</h2>
        {data.description && (
          <span className="text-xs text-white/30">{data.description}</span>
        )}
      </div>

      <p className="text-neutral-300 leading-relaxed">
        {displayText}
      </p>

      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {data.image && !expanded && (
        <div className="mt-4">
          <img
            src={data.image}
            alt={data.title}
            className="rounded-xl max-h-48 object-cover opacity-80"
          />
        </div>
      )}

      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
      >
        Source: Wikipedia
      </a>
    </div>
  );
}
