import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EChart } from '../components/EChart';
import { Zap, SlidersHorizontal } from 'lucide-react';
import { useCorrelation, useScatter } from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { formatCompactNumber } from '../lib/formatters';

export const RelationshipsPage: React.FC = () => {
  const { data: corr, isLoading: corrLoading } = useCorrelation();

  const [xMetric, setXMetric] = useState<string>('view_count');
  const [yMetric, setYMetric] = useState<string>('likes');
  const [sampleSize, setSampleSize] = useState<number>(2500);
  const [useLogScale, setUseLogScale] = useState<boolean>(true);

  const { data: scatter, isLoading: scatterLoading } = useScatter(xMetric, yMetric, sampleSize);

  const metricOptions = [
    { value: 'view_count', label: 'View Count' },
    { value: 'likes', label: 'Likes' },
    { value: 'comment_count', label: 'Comment Count' },
    { value: 'dislikes', label: 'Dislikes' },
  ];

  // Correlation Heatmap ECharts Option
  const heatmapOption = corr
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          position: 'top',
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            const row = corr.columns[params.value[1]];
            const col = corr.columns[params.value[0]];
            return `<strong>${row.replace('_', ' ')}</strong> vs <strong>${col.replace('_', ' ')}</strong><br/>Pearson r: <span style="color:#ff0055; font-weight:bold; font-size:14px;">${params.value[2].toFixed(3)}</span>`;
          },
        },
        grid: { height: '65%', top: '10%', left: '16%', right: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: corr.columns.map((c) => c.replace('_', ' ')),
          splitArea: { show: true },
          axisLabel: { color: '#94a3b8', rotate: 25, fontSize: 11 },
        },
        yAxis: {
          type: 'category',
          data: corr.columns.map((c) => c.replace('_', ' ')),
          splitArea: { show: true },
          axisLabel: { color: '#94a3b8', fontSize: 11 },
        },
        visualMap: {
          min: -0.15,
          max: 1.0,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '2%',
          textStyle: { color: '#94a3b8', fontSize: 11 },
          inRange: {
            color: ['#1e1b4b', '#3b82f6', '#ec4899', '#ff0033'],
          },
        },
        series: [
          {
            name: 'Correlation',
            type: 'heatmap',
            data: corr.columns.flatMap((r, rIdx) =>
              corr.columns.map((c, cIdx) => [cIdx, rIdx, corr.matrix[rIdx][cIdx]])
            ),
            label: {
              show: true,
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 'bold',
              formatter: (params: any) => params.value[2].toFixed(2),
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(255, 0, 85, 0.5)',
              },
            },
          },
        ],
      }
    : {};

  // Scatter Plot with log-transform support to prevent clustered points at origin
  const scatterPoints = scatter?.points || [];
  const processedData = scatterPoints.map((p) => {
    const rawX = p.x;
    const rawY = p.y;
    if (useLogScale) {
      return {
        coord: [Math.log1p(Math.max(0, rawX)), Math.log1p(Math.max(0, rawY))],
        rawX,
        rawY,
      };
    }
    return {
      coord: [rawX, rawY],
      rawX,
      rawY,
    };
  });

  const scatterOption = scatter
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            const raw = processedData[params.dataIndex];
            if (!raw) return '';
            return `
              <div style="font-weight:bold; margin-bottom:4px; color:#ffffff;">Observation Point</div>
              <div style="color:#94a3b8">${xMetric.replace('_', ' ')}: <strong style="color:#ffffff">${formatCompactNumber(raw.rawX)}</strong></div>
              <div style="color:#ff0055">${yMetric.replace('_', ' ')}: <strong style="color:#ff0055">${formatCompactNumber(raw.rawY)}</strong></div>
            `;
          },
        },
        dataZoom: [
          { type: 'inside', xAxisIndex: 0 },
          { type: 'inside', yAxisIndex: 0 },
          {
            type: 'slider',
            xAxisIndex: 0,
            bottom: 4,
            height: 16,
            borderColor: 'rgba(148,163,184,0.2)',
            textStyle: { color: '#94a3b8', fontSize: 10 },
          },
        ],
        grid: { left: '4%', right: '5%', bottom: '16%', top: '10%', containLabel: true },
        xAxis: {
          name: useLogScale ? `ln(1 + ${xMetric.replace('_', ' ')})` : xMetric.replace('_', ' ').toUpperCase(),
          type: 'value',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: {
            color: '#94a3b8',
            formatter: (val: number) => (useLogScale ? `${val.toFixed(1)}` : formatCompactNumber(val)),
          },
        },
        yAxis: {
          name: useLogScale ? `ln(1 + ${yMetric.replace('_', ' ')})` : yMetric.replace('_', ' ').toUpperCase(),
          type: 'value',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: {
            color: '#94a3b8',
            formatter: (val: number) => (useLogScale ? `${val.toFixed(1)}` : formatCompactNumber(val)),
          },
        },
        series: [
          {
            name: `${xMetric} vs ${yMetric}`,
            type: 'scatter',
            symbolSize: 6,
            data: processedData.map((d) => d.coord),
            itemStyle: {
              color: 'rgba(0, 242, 254, 0.75)',
              borderColor: '#00f2fe',
              borderWidth: 0.5,
            },
            emphasis: {
              symbolSize: 10,
              itemStyle: { color: '#ff0055' },
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
      {/* Key Finding Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900/80 border border-red-500/20 flex items-start gap-3">
        <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Dominant Engagement Signal</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            The correlation between <strong className="text-red-400">Likes</strong> and <strong className="text-red-400">View Count</strong> reaches <strong className="text-white font-mono font-bold">~0.80</strong>, by far the strongest collinear pair in the entire feature space. Notice in log scale how points cleanly align linearly, whereas raw scale condenses points at zero.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pearson Correlation Heatmap */}
        <ChartCard
          title="Pearson Correlation Heatmap"
          subtitle="Pairwise linear correlation across numerical attributes (Cell 24)"
          badge="Likes vs Views = 0.80"
          tooltipText="Values close to +1.0 indicate strong positive co-movement. Notice categoryId has near zero correlation with view counts."
        >
          {corrLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <EChart option={heatmapOption} style={{ height: '390px', width: '100%' }} />
          )}
        </ChartCard>

        {/* Scatter Plotter with Scale Switch */}
        <ChartCard
          title="Bivariate Scatter Plotter"
          subtitle={`Interactive correlation between ${xMetric.replace('_', ' ')} and ${yMetric.replace('_', ' ')}`}
          badge={useLogScale ? 'Log1p Spread' : 'Linear Raw'}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseLogScale(!useLogScale)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  useLogScale ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan font-bold' : 'bg-white/10 text-slate-300'
                }`}
                title="Toggle Log Scale to spread out clustered points"
              >
                {useLogScale ? 'Scale: Log1p' : 'Scale: Linear'}
              </button>
            </div>
          }
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">X-Axis:</span>
              <select
                value={xMetric}
                onChange={(e) => setXMetric(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-lg text-xs text-white px-2 py-1 outline-none"
              >
                {metricOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Y-Axis:</span>
              <select
                value={yMetric}
                onChange={(e) => setYMetric(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-lg text-xs text-white px-2 py-1 outline-none"
              >
                {metricOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {scatterLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <EChart option={scatterOption} style={{ height: '350px', width: '100%' }} />
          )}
        </ChartCard>
      </div>
    </motion.div>
  );
};
