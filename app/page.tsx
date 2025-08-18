// app/page.tsx
type News = {
  source?: string | null;
  title?: string | null;
  link: string;
  published?: string | null;
  summary?: string | null;
  authors?: string[] | null;
  tags?: string[] | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getNews(): Promise<News[]> {
  const res = await fetch(`${API_BASE}/news?limit=24`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch /news");
  return res.json();
}

export default async function Page() {
  const news = await getNews();

  return (
    <main className="mx-auto max-w-7xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI News</h1>
        <a
          href={`${API_BASE}/health`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-gray-500 hover:underline"
        >
          API Health
        </a>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((n) => (
          <a
            key={n.link}
            href={n.link}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border p-4 hover:shadow-md transition"
          >
            <div className="text-xs text-gray-500 flex flex-wrap gap-2">
              <span>{n.source ?? "Unknown"}</span>
              {n.published && (
                <span>· {new Date(n.published).toLocaleString()}</span>
              )}
            </div>
            <h2 className="mt-1 font-medium">{n.title ?? "(제목 없음)"}</h2>
            <p className="mt-2 text-sm max-h-24 overflow-hidden">
              {n.summary}
            </p>
            {n.tags && n.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {n.tags.slice(0, 5).map((t, i) => (
                  <span
                    key={`${n.link}-tag-${i}`}
                    className="text-[10px] px-2 py-0.5 rounded bg-gray-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </a>
        ))}
      </section>
    </main>
  );
}
