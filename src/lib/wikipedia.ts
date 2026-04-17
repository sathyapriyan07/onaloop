import { useEffect, useState } from "react";

export function getWikipediaTitle(item: {
  name?: string;
  title?: string;
  media_type?: "movie" | "tv" | "person";
}) {
  const base = item.name || item.title || "";

  if (item.media_type === "movie") {
    return `${base} (film)`;
  }

  return base;
}

export interface WikiData {
  title: string;
  description: string;
  extract: string;
  image?: string;
  url: string;
}

export function useWikipedia(title?: string) {
  const [data, setData] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!title) return;

    const cached = localStorage.getItem(`wiki_${title}`);
    if (cached) {
      setData(JSON.parse(cached));
      return;
    }

    setLoading(true);

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
      .then(res => res.json())
      .then(res => {
        if (res.title && res.extract) {
          const formatted: WikiData = {
            title: res.title,
            description: res.description,
            extract: res.extract,
            image: res.thumbnail?.source,
            url: res.content_urls?.desktop?.page,
          };

          localStorage.setItem(`wiki_${title}`, JSON.stringify(formatted));
          setData(formatted);
        }
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [title]);

  return { data, loading };
}
