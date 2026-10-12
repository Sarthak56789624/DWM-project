import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EChart } from '../components/EChart';
import { Eye, ThumbsUp, MessageSquare, Zap } from 'lucide-react';
import { useDistribution } from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { formatCompactNumber } from '../lib/formatters';

export const DistributionsPage: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'view_count' | 'likes' | 'comment_count'>('view_count');
  const [isLog, setIsLog] = useState<boolean>(true);
  const [bins, setBins] = useState<number>(30);

  const { data: dist, isLoading } = useDistribution(selectedMetric, bins, isLog);

  const metricTabs = [
    { id: 'view_count', label: 'View Count', icon: Eye },
    { id: 'likes', label: 'Likes', icon: ThumbsUp },
    { id: 'comment_count', label: 'Comment Count', icon: MessageSquare },
  ];

  // ECharts Histogram Options with crystal-clear human-readable bin labels
  const histogramOption = dist
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            const p = params[0];
            const lower = dist.bin_edges[p.dataIndex];
            const upper = dist.bin_edges[p.dataIndex + 1] ?? lower;
            const lowerActual = isLog ? Math.expm1(lower) : lower;
            const upperActual = isLog ? Math.expm1(upper) : upper;
            return `
              <div style="font-weight: bold; margin-bottom: 4px; color:#ffffff;">Bin #${p.dataIndex + 1}</div>
              <div style="color: #94a3b8; font-size: 12px;">Range: <strong style="color:#00f2fe">${formatCompactNumber(lowerActual)}</strong> to <strong style="color:#00f2fe">${formatCompactNumber(upperActual)}</strong></div>
              ${isLog ? `<div style="color: #64748b; font-size: 11px;">ln(1+x): ${lower.toFixed(2)} - ${upper.toFixed(2)}</div>` : ''}
              <div style="color: #ff0055; font-weight: bold; font-size: 14px; margin-top: 4px;">Frequency: ${p.value.toLocaleString()} videos</div>
            `;
          },
        },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: dist.bin_edges.slice(0, -1).map((e) => {
            const actualVal = isLog ? Math.expm1(e) : e;
            return formatCompactNumber(actualVal);
          }),
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
          axisLabel: { color: '#94a3b8', fontSize: 11, rotate: 30 },
        },
        yAxis: {
          type: 'value',
          name: 'Video Count',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
          axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
        },
        series: [
          {
            name: 'Video Frequency',
            type: 'bar',
            data: dist.counts,
            animationDuration: 900,
            animationEasing: 'cubicOut',
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#ff0055' },
                  { offset: 1, color: '#ff416c' },
                ],
              },
            },
            emphasis: {
              itemStyle: {
                color: '#00f2fe',
                shadowBlur: 10,
                shadowColor: 'rgba(0, 242, 254, 0.5)',
              },
            },
          },
        ],
      }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Metric Selector Tabs & Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-2xl glass-panel">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {metricTabs.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedMetric === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedMetric(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Log / Linear Switch and Bins */}
        <div className="flex items-center gap-3 px-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">Scale:</span>
            <div className="flex rounded-xl bg-white/[0.05] p-1 border border-white/[0.08]">
              <button
                onClick={() => setIsLog(false)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  !isLog ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Linear
              </button>
              <button
                onClick={() => setIsLog(true)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  isLog ? 'bg-primary text-white font-bold shadow-glow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Log1p (Recommended)
              </button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">Bins:</span>
            <select
              value={bins}
              onChange={(e) => setBins(Number(e.target.value))}
              className="bg-slate-900 border border-white/15 rounded-lg text-xs text-white px-2.5 py-1 outline-none"
            >
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Skew Insight Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 via-slate-900/60 to-red-950/20 border border-purple-500/20 flex items-start gap-3">
        <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Extreme Right Skewness Pattern</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            In India's YouTube landscape, median views sit at{' '}
            <strong className="text-red-400 font-semibold">947,434</strong>, while viral blockbusters reach up to{' '}
            <strong className="text-amber-400 font-semibold">264,407,389</strong> views (a 280x gap!). Linear scale histograms squeeze 99% of data into the first bar; the log1p transform reveals the true underlying log-normal distribution.
          </p>
        </div>
      </div>

      {/* Main Histogram Chart */}
      <ChartCard
        title={`Distribution of ${selectedMetric.replace('_', ' ').toUpperCase()}`}
        subtitle={isLog ? 'Smooth Log1p-scaled histogram bins with readable values' : 'Raw frequency bins (Linear scale)'}
        badge={isLog ? 'Log1p Scaled' : 'Linear Scale'}
        tooltipText="Log1p transform computes ln(1 + x), neutralizing multi-order outliers and exposing the bell-like density."
      >
        {isLoading ? (
          <Skeleton className="h-80" />
        ) : (
          <EChart option={histogramOption} style={{ height: '380px', width: '100%' }} />
        )}
      </ChartCard>

      {/* Box Plot & Five-Number Summary Card */}
      {dist && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Box-Plot Whiskers & Outliers"
            subtitle="Interquartile Range (IQR) breakdown"
            badge={`${dist.boxplot.outlier_count.toLocaleString()} Outliers`}
            className="lg:col-span-2"
          >
            <div className="space-y-6 pt-2">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300">Min: <strong className="text-white">{isLog ? formatCompactNumber(Math.expm1(dist.boxplot.min)) : formatCompactNumber(dist.boxplot.min)}</strong></span>
                  <span className="text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20">
                    Median (Q2): {isLog ? formatCompactNumber(Math.expm1(dist.boxplot.median)) : formatCompactNumber(dist.boxplot.median)}
                  </span>
                  <span className="text-slate-300">Max: <strong className="text-white">{isLog ? formatCompactNumber(Math.expm1(dist.boxplot.max)) : formatCompactNumber(dist.boxplot.max)}</strong></span>
                </div>

                {/* Box Plot Visualizer */}
                <div className="relative h-10 bg-slate-900 rounded-xl flex items-center px-4 border border-white/10 overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-red-600/40 via-rose-500/50 to-red-600/40 border-x-2 border-red-400"
                    style={{ left: '20%', right: '25%' }}
                  />
                  <div className="absolute left-[45%] top-0 bottom-0 w-1 bg-white shadow-glow" />
                </div>

                <div className="grid grid-cols-3 text-center text-xs text-slate-300 font-mono">
                  <div className="p-2 rounded bg-white/[0.02]">Q1 (25%): <strong className="text-white">{isLog ? formatCompactNumber(Math.expm1(dist.boxplot.q1)) : formatCompactNumber(dist.boxplot.q1)}</strong></div>
                  <div className="p-2 rounded bg-white/[0.02]">IQR Span: <strong className="text-cyan-400">{isLog ? (dist.boxplot.q3 - dist.boxplot.q1).toFixed(2) + ' ln' : formatCompactNumber(dist.boxplot.q3 - dist.boxplot.q1)}</strong></div>
                  <div className="p-2 rounded bg-white/[0.02]">Q3 (75%): <strong className="text-white">{isLog ? formatCompactNumber(Math.expm1(dist.boxplot.q3)) : formatCompactNumber(dist.boxplot.q3)}</strong></div>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard
            title="Distribution Metrics"
            subtitle="Central tendency & spread"
          >
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                <span className="text-slate-400">Sample Count:</span>
                <span className="text-white font-mono font-bold">251,277</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                <span className="text-slate-400">Arithmetic Mean:</span>
                <span className="text-white font-mono font-bold">{Math.round(dist.summary.mean).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                <span className="text-slate-400">Median (50th):</span>
                <span className="text-red-400 font-mono font-bold">{Math.round(dist.summary.median).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                <span className="text-slate-400">Max Extremum:</span>
                <span className="text-amber-400 font-mono font-bold">{Math.round(dist.summary.max).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                <span className="text-red-300 font-semibold">Upper Outliers (&gt; Q3+1.5*IQR):</span>
                <span className="text-red-300 font-mono font-bold">{dist.boxplot.outlier_count.toLocaleString()}</span>
              </div>
            </div>
          </ChartCard>
        </div>
      )}
    </motion.div>
  );
};
