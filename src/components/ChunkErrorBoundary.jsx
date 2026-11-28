import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Error boundary specialized for Route/Section React.lazy ChunkLoadError.
 * Automatically reloads once when a fresh deployment invalidates an old chunk hash,
 * then falls back to an Arabic retry card.
 */
export class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    const msg = String(error?.message || error || '');
    const isChunkErr =
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg);
    if (isChunkErr && typeof window !== 'undefined') {
      try {
        const key = 'elz_chunk_reloaded_once';
        if (!window.sessionStorage.getItem(key)) {
          window.sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
        }
      } catch {}
    }
  }

  handleRetry = () => {
    try {
      window.sessionStorage.removeItem('elz_chunk_reloaded_once');
    } catch {}
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="max-w-lg mx-auto my-16 px-6 py-10 rounded-[22px] bg-surface border border-line text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-fg">تعذّر تحميل هذا القسم</h2>
        <p className="text-sm text-muted leading-relaxed">
          قد يكون هناك تحديث جديد للموقع أو انقطاع مؤقت في الاتصال. اضغط لإعادة التحميل بأحدث نسخة.
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-full bg-accent text-accent-ink text-sm font-semibold hover:opacity-90 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }
}

export function PageSkeleton({ label = 'جاري التحميل...' }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 space-y-6 w-full" aria-busy="true" aria-label={label}>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-52 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-[20px] bg-surface border border-line p-4 space-y-3">
            <Skeleton className="h-44 w-full rounded-[14px]" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-bg text-fg flex flex-col lg:flex-row" aria-busy="true" aria-label="جاري تحميل لوحة التحكم">
      <aside className="hidden lg:flex w-64 shrink-0 border-e border-line bg-surface/80 p-5 flex-col gap-3">
        <Skeleton className="h-10 w-40 rounded-xl mb-3" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-9 w-full rounded-xl" />
        ))}
      </aside>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[18px]" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-[20px]" />
      </div>
    </div>
  );
}
