import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EChart } from '../components/EChart';
import { AlertTriangle, Compass, Sparkles } from 'lucide-react';
import { assignCluster, useClusteringSummary } from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { formatCompactNumber } from '../lib/formatters';

export const ClusterExplorerPage: React.FC = () => {
  const { data: summary, isLoading } = useClusteringSummary();

  const [useLog, setUseLog] = useState<boolean>(false);

  // Video assignment interactive test
  const [views, setViews] = useState<number>(1500000);
  const [likes, setLikes] = useState<number>(60000);
  const [dislikes, setDislikes] = useState<number>(600);
  const [comments, setComments] = useState<number>(1200);

  const [assignment, setAssignment] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const runAssignment = async (v: number, l: number, d: number, c: number, logT: boolean) => {
    setIsAssigning(true);
    try {
      const res = await assignCluster({
        view_count: v,
        likes: l,
        dislikes: d,
        comment_count: c,
        log_transform: logT,
      });
      setAssignment(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Run initial assignment on mount so output is immediately visible
  useEffect(() => {
    runAssignment(views, likes, dislikes, comments, useLog);
  }, [useLog]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAssignment(views, likes, dislikes, comments, useLog);
  };

  const activeClusterData = useLog ? summary?.log_transformed : summary?.standard;

  // Elbow & Silhouette Dual Chart Option (Standard)
  const elbowSilOption = summary?.standard
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
        },
        legend: {
          data: ['Within-Cluster Inertia', 'Silhouette Score (10k Sample)'],
          textStyle: { color: '#94a3b8', fontSize: 12 },
          top: 0,
        },
        grid: { left: '4%', right: '5%', bottom: '10%', top: '16%', containLabel: true },
        xAxis: {
          type: 'category',
          name: 'Clusters (K)',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          data: Object.keys(summary.standard.elbow_inertia).map((k) => `K=${k}`),
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
          axisLabel: { color: '#94a3b8' },
        },
        yAxis: [
          {
            type: 'value',
            name: 'Inertia',
            nameTextStyle: { color: '#ff0055', fontWeight: 'bold' },
            splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
            axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
          },
          {
            type: 'value',
            name: 'Silhouette',
            nameTextStyle: { color: '#00f2fe', fontWeight: 'bold' },
            splitLine: { show: false },
            axisLabel: { color: '#94a3b8' },
          },
        ],
        series: [
          {
            name: 'Within-Cluster Inertia',
            type: 'line',
            yAxisIndex: 0,
            data: Object.values(summary.standard.elbow_inertia),
            smooth: true,
            itemStyle: { color: '#ff0055' },
            lineStyle: { width: 3, color: '#ff0055' },
            markPoint: {
              data: [{ coord: [2, summary.standard.elbow_inertia['4']], name: 'Chosen K=4' }],
              itemStyle: { color: '#ff0055' },
            },
          },
          {
            name: 'Silhouette Score (10k Sample)',
            type: 'line',
            yAxisIndex: 1,
            data: Object.values(summary.standard.silhouette_scores),
            smooth: true,
            itemStyle: { color: '#00f2fe' },
            lineStyle: { width: 3, color: '#00f2fe' },
          },
        ],
      }
    : {};

  // 2D PCA Scatter Option with clear cluster colors and full interactive Legend
  const pcaColors = ['#ff0055', '#00f2fe', '#f6d365', '#a855f7'];

  // Group sample points into individual series by cluster ID so ECharts generates a full legend
  const clusterIds = [0, 1, 2, 3];
  const pcaSeries = activeClusterData
    ? clusterIds.map((cId) => {
        const clusterPoints = activeClusterData.pca_sample_points.filter((p) => p.cluster === cId);
        return {
          name: `Cluster ${cId}`,
          type: 'scatter',
          symbolSize: 7,
          data: clusterPoints.map((p) => [p.pca_x, p.pca_y]),
          itemStyle: {
            color: pcaColors[cId % pcaColors.length],
            borderColor: '#ffffff',
            borderWidth: 0.5,
          },
        };
      })
    : [];

  const pcaScatterOption = activeClusterData
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            const seriesName = params.seriesName;
            return `
              <div><strong style="color:#ffffff">${seriesName} Point</strong></div>
              <div style="color:#94a3b8">PCA X: ${params.value[0].toFixed(2)}</div>
              <div style="color:#94a3b8">PCA Y: ${params.value[1].toFixed(2)}</div>
            `;
          },
        },
        legend: {
          data: clusterIds.map((cId) => `Cluster ${cId}`),
          textStyle: { color: '#94a3b8', fontSize: 12 },
          top: 0,
        },
        grid: { left: '4%', right: '4%', bottom: '10%', top: '12%', containLabel: true },
        xAxis: {
          name: 'PCA 1 (Principal Component 1)',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: { color: '#94a3b8' },
        },
        yAxis: {
          name: 'PCA 2 (Principal Component 2)',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: { color: '#94a3b8' },
        },
        series: pcaSeries,
      }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Outlier Warning & Mode Toggle Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-red-950/20 border border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Outlier-Dominated Clustering Phenomenon</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                Cluster 1 = 10 Videos
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Standard K-Means is Euclidean distance-based. Because views and likes span multiple orders of magnitude, extreme viral hits isolate into tiny clusters (Cluster 1 has only 10 mega-viral hits). Toggle <strong>Log1p-Transformed</strong> to observe balanced behavioral segmentation!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-xs text-slate-300 font-semibold">Clustering Space:</span>
          <div className="flex rounded-xl bg-white/[0.05] p-1 border border-white/[0.08]">
            <button
              onClick={() => setUseLog(false)}
              className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                !useLog ? 'bg-primary text-white shadow-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Standard (K=4)
            </button>
            <button
              onClick={() => setUseLog(true)}
              className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                useLog ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan' : 'text-slate-400 hover:text-white'
              }`}
            >
              Log1p (Balanced)
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Profiles 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeClusterData?.profiles &&
          Object.entries(activeClusterData.profiles).map(([cId, prof]) => (
            <motion.div
              key={cId}
              whileHover={{ y: -4, scale: 1.02 }}
              className="p-5 rounded-2xl glass-panel border border-white/[0.08] relative group overflow-hidden transition-all duration-300 shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-extrabold text-lg text-white">
                  Cluster {cId}
                </span>
                <span
                  className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-md"
                  style={{ backgroundColor: pcaColors[Number(cId) % pcaColors.length] }}
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                  <span className="text-slate-400">Video Volume:</span>
                  <span className="text-white font-mono font-bold">
                    {prof.size.toLocaleString()} ({prof.percentage}%)
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                  <span className="text-slate-400">Mean Views:</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {formatCompactNumber(prof.mean_views)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                  <span className="text-slate-400">Mean Likes:</span>
                  <span className="text-red-400 font-mono font-bold">
                    {formatCompactNumber(prof.mean_likes)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Mean Comments:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {formatCompactNumber(prof.mean_comments)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* 2D PCA Scatter Projection */}
      <ChartCard
        title="2D PCA Dimensionality Reduction Scatter"
        subtitle={`PCA projection of 4D engagement space onto 2 principal components (${useLog ? 'Log1p Scaled' : 'Standard Scaled'}) with interactive Cluster Legend`}
        badge="Explained Variance: ~81.8%"
      >
        {isLoading ? (
          <Skeleton className="h-80" />
        ) : (
          <EChart option={pcaScatterOption} style={{ height: '400px', width: '100%' }} />
        )}
      </ChartCard>

      {/* Elbow Inertia & Silhouette Curves + Where Does My Video Fall Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Elbow Curve */}
        <ChartCard
          title="Optimal K Evaluation: Elbow & Silhouette"
          subtitle="Within-cluster inertia and silhouette score across K = 2..10 (Cells 101 & 103)"
          badge="K=4 Chosen"
          className="lg:col-span-2"
        >
          {isLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <EChart option={elbowSilOption} style={{ height: '360px', width: '100%' }} />
          )}
        </ChartCard>

        {/* Where Does My Video Fall Interactive Assignment */}
        <ChartCard
          title="Where Does My Video Fall?"
          subtitle="Assign custom metrics into a cluster profile"
          badge="Live K-Means Inference"
        >
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold">Views</label>
              <input
                type="number"
                min={0}
                value={views}
                onChange={(e) => setViews(Number(e.target.value))}
                className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-2.5 outline-none font-mono focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold">Likes</label>
              <input
                type="number"
                min={0}
                value={likes}
                onChange={(e) => setLikes(Number(e.target.value))}
                className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-2.5 outline-none font-mono focus:border-cyan-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Dislikes</label>
                <input
                  type="number"
                  min={0}
                  value={dislikes}
                  onChange={(e) => setDislikes(Number(e.target.value))}
                  className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-2.5 outline-none font-mono focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Comments</label>
                <input
                  type="number"
                  min={0}
                  value={comments}
                  onChange={(e) => setComments(Number(e.target.value))}
                  className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-2.5 outline-none font-mono focus:border-cyan-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAssigning}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-glow-cyan hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>{isAssigning ? 'Clustering...' : 'Assign Video Cluster'}</span>
            </button>

            {/* High-Contrast Segment Output Card */}
            {assignment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-cyan-500/15 border-2 border-cyan-400/40 text-center space-y-1.5 shadow-xl"
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                  Assigned Behavioral Segment
                </span>
                <div className="font-display font-extrabold text-2xl text-white">
                  Cluster {assignment.cluster_id}
                </div>
                <p className="text-xs text-slate-200">
                  Matches segment with mean views: <strong className="text-cyan-300 font-mono">{formatCompactNumber(assignment.cluster_profile.mean_views)}</strong>
                </p>
                <div className="pt-2 border-t border-cyan-400/20 text-[11px] text-slate-300 flex justify-around font-mono">
                  <span>Likes: {formatCompactNumber(assignment.cluster_profile.mean_likes)}</span>
                  <span>Comments: {formatCompactNumber(assignment.cluster_profile.mean_comments)}</span>
                </div>
              </motion.div>
            )}
          </form>
        </ChartCard>
      </div>
    </motion.div>
  );
};
