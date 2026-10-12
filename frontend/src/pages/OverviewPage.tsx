import React from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Eye,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useOverview } from '../lib/api';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { KpiSkeleton, Skeleton } from '../components/Skeleton';
import { formatDate } from '../lib/formatters';

interface OverviewPageProps {
  onNavigateTab: (tabId: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab }) => {
  const { data: overview, isLoading, error } = useOverview();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-red-500/20 text-center text-red-400">
        <AlertCircle className="h-10 w-10 mx-auto mb-3" />
        <h3 className="text-lg font-bold">Failed to load overview data</h3>
        <p className="text-sm mt-1 text-slate-400">{(error as Error)?.message || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-8 pb-12"
    >
      {/* Cinematic Hero Section */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-red-950/40 via-[#0e1018]/80 to-purple-950/30 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl"
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-xs font-semibold text-red-400 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Data Warehousing & Mining Project • India Region</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Demystifying What Makes India <span className="gradient-text-red">Trend on YouTube</span>
          </h1>

          <p className="text-base text-slate-300/90 leading-relaxed max-w-2xl">
            A comprehensive data mining and machine learning investigation covering{' '}
            <strong className="text-white font-semibold">251,277 trending records</strong> and{' '}
            <strong className="text-white font-semibold">78,847 unique videos</strong> from August 2020 through April 2024. Explore distributions, channel power laws, regression models, and neural clustering.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('classifier')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:scale-105 active:scale-95 transition-all"
            >
              <span>Popularity Classifier</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onNavigateTab('regression')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] px-5 py-2.5 text-sm font-semibold text-white transition-all"
            >
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span>Regression Lab</span>
            </button>
          </div>
        </div>

        {/* Ambient background particles & red glow ring */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-80 h-80 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      </motion.div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Trending Entries"
          value={overview.total_rows}
          icon={Layers}
          subtitle="Multi-day appearances across 3.7 years"
          trend="251.2K Rows"
          colorScheme="red"
        />

        <KpiCard
          title="Unique Video Catalog"
          value={overview.unique_videos}
          icon={Film}
          subtitle="31.4% deduplicated unique creative assets"
          trend="78.8K Videos"
          colorScheme="cyan"
        />

        <KpiCard
          title="Median View Threshold"
          value={overview.median_views}
          icon={Eye}
          subtitle="Exact split separating 'Popular' videos"
          trend="947.4K Views"
          colorScheme="amber"
        />

        <KpiCard
          title="Unique Creators & Channels"
          value={overview.unique_channels}
          icon={Database}
          subtitle="Dominant regional networks & creators"
          trend="4.8K Channels"
          colorScheme="purple"
        />
      </div>

      {/* Quality Audit & Date Range Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Quality & Missingness */}
        <ChartCard
          title="Dataset Integrity & Completeness"
          subtitle="Exhaustive null check across all 16 raw features"
          badge="100% Core Features Present"
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Video ID & Metrics</h4>
                    <p className="text-xs text-slate-400">Zero missing values in views, likes, comments</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                  0 Nulls
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Description Field</h4>
                    <p className="text-xs text-slate-400">Missing in 19,455 records (7.74%)</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                  19.4K
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Channel Title</h4>
                    <p className="text-xs text-slate-400">Single missing string, resolved to Unknown</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                  1 Null
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Date Parsing</h4>
                    <p className="text-xs text-slate-400">100% parsed to tz-aware UTC timestamps</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                  100%
                </span>
              </div>
            </div>

            {/* Engagement Controls Flag */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800/80 border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-300">Special Engagement Constraints:</span>
                <p className="text-xs text-slate-400">
                  Comments disabled in {overview.comments_disabled.count.toLocaleString()} videos ({overview.comments_disabled.percentage}%) • Ratings disabled in {overview.ratings_disabled.count.toLocaleString()} videos ({overview.ratings_disabled.percentage}%)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  Rare (&lt;1%)
                </span>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Temporal Window Card */}
        <ChartCard
          title="Observation Window"
          subtitle="Chronological span of trending records"
          badge="Aug 2020 – Apr 2024"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Trending Date Span
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-lg font-bold text-white">
                  {formatDate(overview.date_range.min_trending_date)}
                </span>
                <span className="text-xs text-slate-500">to</span>
                <span className="font-display text-lg font-bold text-white">
                  {formatDate(overview.date_range.max_trending_date)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Publishing Date Span
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-lg font-bold text-white">
                  {formatDate(overview.date_range.min_published_date)}
                </span>
                <span className="text-xs text-slate-500">to</span>
                <span className="font-display text-lg font-bold text-white">
                  {formatDate(overview.date_range.max_published_date)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
              💡 Videos trend within an average of 1.2 to 2.8 days following publication, reflecting algorithmic immediacy.
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Summary Statistics Table */}
      <ChartCard
        title="Five-Number Summary & Metric Moments"
        subtitle="Descriptive statistical distribution across primary continuous variables"
        badge="Pandas describe()"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Metric</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Mean</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Std Dev</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Min</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">25% (Q1)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right text-red-400">50% (Median)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">75% (Q3)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {Object.entries(overview.numerical_summary).map(([col, stats]) => (
                <tr key={col} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-medium text-white font-mono">
                    {col}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300 font-mono">
                    {stats.mean.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">
                    {stats.std.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">
                    {stats.min.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300 font-mono">
                    {stats['25%'].toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-red-400 font-bold font-mono bg-red-500/5">
                    {stats['50%'].toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300 font-mono">
                    {stats['75%'].toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-300 font-semibold font-mono">
                    {stats.max.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </motion.div>
  );
};
