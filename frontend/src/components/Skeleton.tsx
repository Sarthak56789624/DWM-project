import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-48' }) => {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/[0.04] border border-white/[0.06] ${className}`}
    >
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  );
};

export const KpiSkeleton: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-2xl animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-white/10 rounded" />
        <div className="h-8 w-8 bg-white/10 rounded-xl" />
      </div>
      <div className="h-8 w-36 bg-white/10 rounded" />
      <div className="h-3 w-28 bg-white/5 rounded" />
    </div>
  );
};
