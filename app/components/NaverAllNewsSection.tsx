import dynamic from 'next/dynamic';
import { Skeleton } from "./ui/skeleton";

interface NaverAllNewsProps {
  onNewsClick?: (url: string) => void;
}

// 클라이언트 컴포넌트를 dynamic import로 불러오기 (SSR 비활성화)
const NaverAllNewsSectionClient = dynamic(
  () => import('./NaverAllNewsSectionClient'),
  {
    ssr: false,
    loading: () => (
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
);

export function NaverAllNewsSection({ onNewsClick }: NaverAllNewsProps) {
  return <NaverAllNewsSectionClient onNewsClick={onNewsClick} />;
}
