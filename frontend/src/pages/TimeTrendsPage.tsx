import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EChart } from '../components/EChart';
import { useTimeSeries } from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { formatCompactNumber } from '../lib/formatters';

export const TimeTrendsPage: React.FC = () => {
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const { data: ts, isLoading } = useTimeSeries(granularity);

  const timeSeriesOption = ts
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            const date = params[0].name;
            const count = params.find((p: any) => p.seriesName === 'Trending Videos')?.value;
            const avg = params.find((p: any) => p.seriesName === 'Average Views')?.value;
            return `
              <div style="font-weight:bold; margin-bottom: 4px; color:#ffffff;">Date: ${date}</div>
              <div style="color: #ff0055">Trending Videos: <strong>${count?.toLocaleString()}</strong></div>
              <div style="color: #00f2fe">Avg View Count: <strong>${formatCompactNumber(avg)}</strong></div>
            `;
          },
        },
        legend: {
          data: ['Trending Videos', 'Average Views'],
          textStyle: { color: '#94a3b8', fontSize: 12 },
          top: 0,
        },
        grid: { left: '3%', right: '5%', bottom: '16%', top: '12%', containLabel: true },
        dataZoom: [
          { type: 'inside', start: 0, end: 100 },
          {
            type: 'slider',
            bottom: 6,
            height: 18,
            borderColor: 'rgba(148, 163, 184, 0.2)',
            textStyle: { color: '#94a3b8', fontSize: 10 },
          },
        ],
        xAxis: {
          type: 'category',
          data: ts.series.map((s) => s.date),
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
          axisLabel: { color: '#94a3b8', fontSize: 11 },
        },
        yAxis: [
          {
            type: 'value',
            name: 'Video Count',
            nameTextStyle: { color: '#ff0055', fontWeight: 'bold' },
            splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
            axisLabel: { color: '#94a3b8' },
          },
          {
            type: 'value',
            name: 'Average Views',
            nameTextStyle: { color: '#00f2fe', fontWeight: 'bold' },
            splitLine: { show: false },
            axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
          },
        ],
        series: [
          {
            name: 'Trending Videos',
            type: 'line',
            yAxisIndex: 0,
            data: ts.series.map((s) => s.video_count),
            smooth: true,
            showSymbol: false,
            animationDuration: 1200,
            animationEasing: 'cubicOut',
            itemStyle: { color: '#ff0055' },
            lineStyle: { width: 3 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(255, 0, 85, 0.4)' },
                  { offset: 1, color: 'rgba(255, 0, 85, 0.0)' },
                ],
              },
            },
            markPoint: {
              data: [
                { type: 'max', name: 'Peak Trending Volume' },
              ],
              itemStyle: { color: '#ff0055' },
            },
          },
          {
            name: 'Average Views',
            type: 'line',
            yAxisIndex: 1,
            data: ts.series.map((s) => s.avg_view_count),
            smooth: true,
            showSymbol: false,
            animationDuration: 1200,
            animationEasing: 'cubicOut',
            itemStyle: { color: '#00f2fe' },
            lineStyle: { width: 2.5, type: 'dashed' },
            markPoint: {
              data: [
                { type: 'max', name: 'Max Reach Spike' },
              ],
              itemStyle: { color: '#00f2fe' },
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
      {/* Time Trends Main Chart */}
      <ChartCard
        title="Temporal Progression & Volume Evolution"
        subtitle="Tracking daily trending batch sizes and average view velocity across 2020–2024 (Cell 27-28)"
        badge="Dual Y-Axis Trendline"
        tooltipText="Daily trending lists in India fluctuate with major holidays, festival seasons, and cricket tournaments (IPL/World Cup)."
        actions={
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            {(['day', 'week', 'month'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 text-xs rounded-lg font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  granularity === g
                    ? 'bg-primary text-white shadow-glow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <EChart option={timeSeriesOption} style={{ height: '420px', width: '100%' }} />
        )}
      </ChartCard>
    </motion.div>
  );
};
