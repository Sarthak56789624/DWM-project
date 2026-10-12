import React from 'react';
import { motion } from 'framer-motion';
import { EChart } from '../components/EChart';
import { Award, Eye, ThumbsUp, MessageSquareOff, StarOff, Play } from 'lucide-react';
import { useEngagement, useTopVideos } from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { formatCompactNumber } from '../lib/formatters';
import { CountUpNumber } from '../components/CountUpNumber';

export const TopVideosPage: React.FC = () => {
  const { data: topVideos, isLoading: videosLoading } = useTopVideos(10);
  const { data: engagement, isLoading: engLoading } = useEngagement();

  const medals = ['🥇', '🥈', '🥉'];

  // Engagement Histogram Option with high-contrast styling
  const engagementOption = engagement
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
            const lower = engagement.histogram.bin_edges[p.dataIndex];
            const upper = engagement.histogram.bin_edges[p.dataIndex + 1] ?? lower;
            return `
              <div>Rate Range: <strong style="color:#00f2fe">${(lower * 100).toFixed(1)}% - ${(upper * 100).toFixed(1)}%</strong></div>
              <div style="color:#ffffff; margin-top:2px;">Video Volume: <strong style="color:#ff0055">${p.value.toLocaleString()} videos</strong></div>
            `;
          },
        },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: engagement.histogram.bin_edges.slice(0, -1).map((e) => `${(e * 100).toFixed(1)}%`),
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
          axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
        },
        series: [
          {
            name: 'Engagement Distribution',
            type: 'bar',
            data: engagement.histogram.counts,
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#00f2fe' },
                  { offset: 1, color: '#0284c7' },
                ],
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
      {/* Top 10 Hall of Fame Leaderboard */}
      <ChartCard
        title="India Trending Hall of Fame – Top 10 All-Time Videos"
        subtitle="Ranked strictly by highest view count with video_id deduplication (Cell 30)"
        badge="Deduplicated Leaderboard"
      >
        {videosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topVideos?.map((video, idx) => (
              <motion.div
                key={video.video_id}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-red-500/50 p-3.5 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 mb-3 border border-white/10 shadow-inner">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`;
                      }}
                    />
                    {/* Rank Badge */}
                    <div className="absolute top-2 left-2 flex items-center justify-center h-7 w-7 rounded-lg bg-black/85 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-lg">
                      {idx < 3 ? medals[idx] : `#${idx + 1}`}
                    </div>
                  </div>

                  {/* Title & Channel */}
                  <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 truncate font-medium">
                    {video.channel}
                  </p>
                </div>

                {/* Metrics Footer */}
                <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-100 font-mono font-bold">
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    <span>
                      <CountUpNumber end={video.view_count} duration={1.5} formattingFn={(val: number) => formatCompactNumber(val)} />
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                    <ThumbsUp className="h-3 w-3 text-red-400" />
                    <span>{formatCompactNumber(video.likes)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ChartCard>

      {/* Engagement Rate Analysis & Disabled Feature Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Rate Histogram */}
        <ChartCard
          title="Engagement Rate Distribution"
          subtitle="(Likes + Comments) / View Count (Cell 31-32)"
          badge="Mean: 6.0%"
          className="lg:col-span-2"
        >
          {engLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <EChart option={engagementOption} style={{ height: '300px', width: '100%' }} />
          )}
        </ChartCard>

        {/* Disabled Comments & Ratings Cards */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">Comments Disabled</span>
              <h3 className="text-2xl font-display font-extrabold text-white">
                {engagement?.comments_status.disabled.toLocaleString()}
                <span className="text-xs font-normal text-slate-400 ml-1.5">(0.68%)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                1,697 videos disabled audience comments
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
              <MessageSquareOff className="h-6 w-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">Ratings Disabled</span>
              <h3 className="text-2xl font-display font-extrabold text-white">
                {engagement?.ratings_status.disabled.toLocaleString()}
                <span className="text-xs font-normal text-slate-400 ml-1.5">(0.91%)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                2,290 videos hid like/dislike counts
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <StarOff className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
