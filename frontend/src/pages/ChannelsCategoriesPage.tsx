import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EChart } from '../components/EChart';
import { Filter } from 'lucide-react';
import { useCategories, useChannelAvgViews, useTopChannels } from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { formatCompactNumber } from '../lib/formatters';

export const ChannelsCategoriesPage: React.FC = () => {
  const { data: topChannels, isLoading: channelsLoading } = useTopChannels(10);
  const { data: avgViews, isLoading: avgLoading } = useChannelAvgViews(10);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Top Channels Horizontal Bar Option
  const topChannelsOption = topChannels
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            const p = params[0];
            return `<strong>${p.name}</strong><br/><span style="color:#ff0055; font-weight:bold;">${p.value.toLocaleString()} trending videos</span>`;
          },
        },
        grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
        },
        yAxis: {
          type: 'category',
          data: [...topChannels].reverse().map((c) => c.channel),
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
          axisLabel: { color: '#f8fafc', fontSize: 11, width: 140, overflow: 'truncate' },
        },
        series: [
          {
            name: 'Appearances',
            type: 'bar',
            data: [...topChannels].reverse().map((c) => c.trending_appearances),
            animationDuration: 1000,
            animationEasing: 'cubicOut',
            itemStyle: {
              borderRadius: [0, 8, 8, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#ff0033' },
                  { offset: 1, color: '#ff416c' },
                ],
              },
            },
            label: {
              show: true,
              position: 'right',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: 11,
              formatter: '{c}',
            },
          },
        ],
      }
    : {};

  // Average Views by Channel Option with clearly visible value labels
  const avgViewsOption = avgViews
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            const p = params[0];
            return `<strong>${p.name}</strong><br/><span style="color:#00f2fe; font-weight:bold;">Avg: ${formatCompactNumber(p.value)} views</span>`;
          },
        },
        grid: { left: '3%', right: '5%', bottom: '18%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: avgViews.map((c) => c.channel),
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
          axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 35, width: 90, overflow: 'truncate' },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
        },
        series: [
          {
            name: 'Average Views',
            type: 'bar',
            data: avgViews.map((c) => c.avg_views),
            animationDuration: 1000,
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
                  { offset: 0, color: '#00f2fe' },
                  { offset: 1, color: '#4facfe' },
                ],
              },
            },
            label: {
              show: true,
              position: 'top',
              color: '#00f2fe',
              fontSize: 10,
              fontWeight: 'bold',
              formatter: (params: any) => formatCompactNumber(params.value),
            },
          },
        ],
      }
    : {};

  // Donut Chart for Categories Option
  const categoryDonutOption = categories
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: '{b}: <strong style="color:#00f2fe">{c} videos ({d}%)</strong>',
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: { color: '#94a3b8', fontSize: 11 },
          formatter: (name: string) => {
            const item = categories.find((c) => c.name === name);
            return `${name.slice(0, 15)} (${item?.percentage}%)`;
          },
        },
        series: [
          {
            name: 'Video Categories',
            type: 'pie',
            radius: ['45%', '72%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#0a0b10',
              borderWidth: 2,
            },
            label: { show: false },
            emphasis: {
              label: {
                show: true,
                fontSize: 13,
                fontWeight: 'bold',
                color: '#ffffff',
                formatter: '{b}\n{d}%',
              },
              scaleSize: 10,
            },
            data: categories.map((c) => ({
              value: c.count,
              name: c.name,
            })),
          },
        ],
      }
    : {};

  const onChartClick = (params: any) => {
    if (params.name) {
      setSelectedCategory(selectedCategory === params.name ? null : params.name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Category Domination Donut + Cross-Filter Header */}
      <ChartCard
        title="Content Category Market Share"
        subtitle="Distribution of 251,277 videos across YouTube categories (Click a slice to cross-filter)"
        badge="Category 24 Entertainment = 39.1%"
        tooltipText="Entertainment (Category 24) is the massive anchor of Indian YouTube, followed by People & Blogs (22) and Music (10)."
        actions={
          selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl bg-primary/20 text-red-300 border border-primary/30 hover:bg-primary/30 transition-all cursor-pointer"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Reset filter: {selectedCategory}</span>
            </button>
          )
        }
      >
        {categoriesLoading ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <EChart
                option={categoryDonutOption}
                onEvents={{ click: onChartClick }}
                style={{ height: '350px', width: '100%' }}
              />
            </div>

            {/* Category Highlights */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-600/15 to-rose-600/5 border border-red-500/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                  #1 Dominant Category
                </span>
                <h4 className="text-lg font-display font-extrabold text-white mt-0.5">
                  Entertainment (Cat 24)
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  <strong className="text-white">98,264 videos (39.1%)</strong> — Almost 4 in 10 trending items are television drama serials, comedy sketches, and OTT clips.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  #2 & #3 Pillars
                </span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  <strong className="text-white">People & Blogs (22)</strong> accounts for 16.3% (41,079 videos) and <strong className="text-white">Music (10)</strong> for 13.0% (32,609 videos). Together, top 3 categories constitute ~68.4% of all trending content!
                </p>
              </div>
            </div>
          </div>
        )}
      </ChartCard>

      {/* Channel Frequency vs Average Views Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Channels by Trending Appearances */}
        <ChartCard
          title="Top 10 Channels by Appearances"
          subtitle="Most recurring creators and regional television networks"
          badge="Vijay TV, Sourav Joshi, Sony SAB"
        >
          {channelsLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <EChart option={topChannelsOption} style={{ height: '390px', width: '100%' }} />
          )}
        </ChartCard>

        {/* Average Views of Top Channels */}
        <ChartCard
          title="Average Views per Appearance"
          subtitle="True reach: How many views each top channel averages (Notebook Cell 17)"
          badge="Efficiency Metric"
        >
          {avgLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <EChart option={avgViewsOption} style={{ height: '390px', width: '100%' }} />
          )}
        </ChartCard>
      </div>
    </motion.div>
  );
};
