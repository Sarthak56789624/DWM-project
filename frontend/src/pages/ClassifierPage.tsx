import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Award,
  Zap,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Play,
  BarChart3,
  Flame,
  Search,
  Tv,
} from 'lucide-react';
import {
  predictClassification,
  predictClassificationByUrl,
  useCategories,
  useClassificationMetrics,
  useLiveYoutubeSamples,
} from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { ClassificationTreeNode, ClassificationUrlResponse } from '../types/api';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// Recursive Collapsible Tree Viewer Component
const TreeNodeView: React.FC<{ node: ClassificationTreeNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState<boolean>(depth < 2);
  const isLeaf = !node.children || node.children.length === 0;

  return (
    <div className="text-xs font-mono my-1 pl-3 border-l border-white/15">
      <div
        onClick={() => !isLeaf && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors ${
          isLeaf
            ? node.prediction === 'Popular'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            : 'hover:bg-white/10 text-slate-100 bg-white/[0.03]'
        }`}
      >
        {!isLeaf && (
          <span className="text-slate-400">
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        )}
        <span className="font-semibold text-white">{node.name}</span>
        <span className="text-[10px] text-slate-400">
          ({node.samples.toLocaleString()} samples, gini: {node.impurity})
        </span>
        {isLeaf && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              node.prediction === 'Popular'
                ? 'bg-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/30 text-rose-200'
            }`}
          >
            {node.prediction}
          </span>
        )}
      </div>

      {!isLeaf && isOpen && node.children && (
        <div className="pl-3 mt-1 space-y-1">
          {node.children.map((child, idx) => (
            <TreeNodeView key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ClassifierPage: React.FC = () => {
  const { data: metrics } = useClassificationMetrics();
  const { data: categories } = useCategories();
  const { data: samplePresets } = useLiveYoutubeSamples();

  // URL input state
  const [videoUrl, setVideoUrl] = useState<string>('https://www.youtube.com/watch?v=v7K4vGYL9ow');
  const [model, setModel] = useState<'decision_tree' | 'naive_bayes'>('decision_tree');

  // Fine-tunable numerical signal parameters (auto-populated upon fetch)
  const [likes, setLikes] = useState<number>(2840000);
  const [dislikes, setDislikes] = useState<number>(12000);
  const [comments, setComments] = useState<number>(185000);
  const [categoryId, setCategoryId] = useState<number>(24);

  // Results state
  const [urlAnalysis, setUrlAnalysis] = useState<ClassificationUrlResponse | null>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModifiedFromFetched, setIsModifiedFromFetched] = useState<boolean>(false);

  // Fetch video from URL and run prediction + channel analytics
  const handleFetchAndClassify = async (targetUrl?: string, overrideModel?: typeof model) => {
    const urlToUse = targetUrl || videoUrl;
    if (!urlToUse.trim()) return;

    setIsLoading(true);
    setFetchError(null);
    const m = overrideModel || model;

    try {
      const res = await predictClassificationByUrl({
        url: urlToUse,
        model: m,
      });

      setUrlAnalysis(res);
      setPredictionResult(res.classification);

      // Automatically sync input parameters with real fetched values
      setLikes(res.metadata.likes);
      setDislikes(res.metadata.dislikes);
      setComments(res.metadata.comment_count);
      setCategoryId(res.metadata.categoryId);
      setIsModifiedFromFetched(false);

      if (res.classification.predicted_class === 'Popular') {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ff0055', '#00f2fe', '#10b981', '#f6d365'],
        });
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || 'Failed to fetch video metrics. Please verify URL or network.');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run prediction when user manually modifies values (What-If simulation)
  const handleManualPredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const res = await predictClassification({
        likes,
        dislikes,
        comment_count: comments,
        categoryId,
        model,
      });
      setPredictionResult(res);
      setIsModifiedFromFetched(true);

      if (res.predicted_class === 'Popular') {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // When model architecture is changed, update active prediction
  const handleModelChange = (newModel: 'decision_tree' | 'naive_bayes') => {
    setModel(newModel);
    if (urlAnalysis && !isModifiedFromFetched) {
      handleFetchAndClassify(videoUrl, newModel);
    } else {
      // Re-run manual predict with new model
      predictClassification({
        likes,
        dislikes,
        comment_count: comments,
        categoryId,
        model: newModel,
      }).then((res) => setPredictionResult(res));
    }
  };

  // Initial load
  useEffect(() => {
    handleFetchAndClassify(videoUrl, model);
  }, []);

  const dt = metrics?.decision_tree;
  const nb = metrics?.naive_bayes;
  const channel = urlAnalysis?.channel_analytics;
  const meta = urlAnalysis?.metadata;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12 max-w-7xl mx-auto"
    >
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
          <YoutubeIcon className="w-3.5 h-3.5 text-rose-500" />
          Live YouTube Video URL Popularity Classifier & Channel Analytics
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          Video Virality & Channel Analytics Classifier
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Paste any YouTube video URL to automatically extract its live interaction signals (likes, comments, views, category) and evaluate whether the video will reach <strong>Popular</strong> status (&gt; 947,434 median views threshold) based on its analytical channel performance in 251,277 Indian trending records.
        </p>
      </div>

      {/* Quick Benchmark Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Test Popular Creators:
        </span>
        {[
          {
            name: 'YRF (Pathaan)',
            url: 'https://www.youtube.com/watch?v=v7K4vGYL9ow',
            badge: 'Tier 1 Mega',
          },
          {
            name: 'CarryMinati (Yalgaar)',
            url: 'https://www.youtube.com/watch?v=zzwRbGO4SmQ',
            badge: '100% Popular Rate',
          },
          {
            name: 'Sourav Joshi Vlogs',
            url: 'https://www.youtube.com/watch?v=1poXp7r7_rM',
            badge: '2,845 Trending',
          },
          {
            name: 'T-Series (Naatu Naatu)',
            url: 'https://www.youtube.com/watch?v=OsM3PcwB_2A',
            badge: '23.3M Avg Views',
          },
        ].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setVideoUrl(item.url);
              handleFetchAndClassify(item.url);
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2 group shadow-sm"
          >
            <Play className="w-3 h-3 text-rose-400 fill-rose-400 group-hover:scale-110 transition-transform" />
            <span>{item.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
              {item.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Main Interactive URL Fetcher Box */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/15 p-6 shadow-2xl backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFetchAndClassify();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <YoutubeIcon className="w-5 h-5 text-rose-500" />
              </div>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=v7K4vGYL9ow or video ID)"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/90 border border-white/20 text-sm text-white placeholder-slate-400 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-mono transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={model}
                onChange={(e) => handleModelChange(e.target.value as any)}
                className="bg-slate-950/90 border border-white/20 rounded-xl text-xs text-white px-4 py-3.5 outline-none focus:border-rose-500 font-semibold transition-all h-full"
              >
                <option value="decision_tree">Decision Tree (82.2% Acc)</option>
                <option value="naive_bayes">Naive Bayes (74.4% Acc)</option>
              </select>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-rose-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer min-w-[170px]"
              >
                {isLoading ? (
                  <>
                    <BrainCircuit className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Auto-Classify</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {fetchError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{fetchError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Video & Channel Analytical Performance Banner */}
      {meta && channel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Video Metadata Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 group">
                <img
                  src={meta.thumbnail_url}
                  alt={meta.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white border border-white/20 backdrop-blur-sm">
                    {meta.categoryName} (Cat {meta.categoryId})
                  </span>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${meta.video_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-colors"
                  title="Open video on YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                  {meta.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <Tv className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-bold text-slate-200">{meta.channelTitle}</span>
                  {channel.is_tracked && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified in 251k Data
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-Fetched Engagement Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-white/10 mt-4 text-center">
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Views</span>
                <span className="font-mono text-xs font-bold text-white">
                  {meta.view_count.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Likes</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {meta.likes.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Comments</span>
                <span className="font-mono text-xs font-bold text-cyan-400">
                  {meta.comment_count.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Engagement</span>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {meta.engagement_rate}%
                </span>
              </div>
            </div>
          </div>

          {/* Channel Analytical Performance Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Channel Authority & Standing
                    </span>
                    <h4 className="text-sm font-extrabold text-white">{channel.channel_title}</h4>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                    channel.tier_color === 'purple'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : channel.tier_color === 'amber'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : channel.tier_color === 'emerald'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                  }`}
                >
                  {channel.tier_badge}
                </span>
              </div>

              {/* Channel Stats 2x2 */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Trending Appearances
                  </span>
                  <div className="font-mono text-base font-extrabold text-white mt-0.5">
                    {channel.appearances > 0 ? `${channel.appearances.toLocaleString()} videos` : 'Uncatalogued'}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {channel.rank_appearances ? `Rank #${channel.rank_appearances} overall` : 'New creator'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Channel Avg Views
                  </span>
                  <div className="font-mono text-base font-extrabold text-cyan-400 mt-0.5">
                    {(channel.avg_views / 1_000_000).toFixed(1)}M
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Median: {(channel.median_views / 1_000_000).toFixed(1)}M
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Historical Virality Rate
                  </span>
                  <div className="font-mono text-base font-extrabold text-emerald-400 mt-0.5">
                    {channel.popularity_rate}%
                  </div>
                  <span className="text-[10px] text-slate-400">Videos &gt; 947k median</span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Engagement Velocity
                  </span>
                  <div className="font-mono text-base font-extrabold text-amber-400 mt-0.5">
                    {channel.video_engagement_ratio}x
                  </div>
                  <span className="text-[10px] text-slate-400">vs channel standard</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Narrative */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 mt-3 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white block mb-0.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Channel Performance Verdict:
              </span>
              {channel.channel_verdict}
            </div>
          </div>

          {/* Popularity Classification Result Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Popularity Prediction
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-red-300 border border-primary/30">
                  {model === 'decision_tree' ? 'Decision Tree (Depth 5)' : 'Gaussian Naive Bayes'}
                </span>
              </div>

              {predictionResult && (
                <div className="text-center pt-1">
                  <div
                    className={`mx-auto h-20 w-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all mb-3 ${
                      predictionResult.predicted_class === 'Popular'
                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                        : 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/40 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
                    }`}
                  >
                    {predictionResult.predicted_class === 'Popular' ? (
                      <CheckCircle2 className="h-10 w-10" />
                    ) : (
                      <XCircle className="h-10 w-10" />
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Classification Status
                  </span>
                  <h3
                    className={`text-2xl font-black font-display tracking-tight ${
                      predictionResult.predicted_class === 'Popular' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {predictionResult.predicted_class === 'Popular' ? 'POPULAR' : 'NOT POPULAR'}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 max-w-xs mx-auto">
                    {predictionResult.predicted_class === 'Popular'
                      ? 'Projected to surpass the 947,434 Indian trending views median (Top 50%)'
                      : 'Projected below the 947,434 Indian trending views threshold'}
                  </p>

                  {/* Probabilities */}
                  <div className="space-y-2 text-left p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] mt-4">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300 font-medium">P(Popular):</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {((predictionResult.probabilities?.['Popular'] || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                          style={{
                            width: `${(predictionResult.probabilities?.['Popular'] || 0) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300 font-medium">P(Not Popular):</span>
                        <span className="text-rose-400 font-mono font-bold">
                          {((predictionResult.probabilities?.['Not Popular'] || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
                          style={{
                            width: `${(predictionResult.probabilities?.['Not Popular'] || 0) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Virality Benchmark Badge */}
            {urlAnalysis?.benchmark_comparison && (
              <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10 mt-3">
                <span className="text-slate-400 text-[11px]">
                  Dataset Percentile:{' '}
                  <strong className="text-white font-mono">
                    {urlAnalysis.benchmark_comparison.percentile_rank}%
                  </strong>
                </span>
                <span className="px-2 py-0.5 rounded font-black text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Grade {urlAnalysis.benchmark_comparison.virality_grade}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Analytical Verdict Banner */}
      {predictionResult?.analytical_verdict && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Machine Learning & Channel Momentum Diagnostic
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {predictionResult.analytical_verdict}
            </p>
          </div>
        </motion.div>
      )}

      {/* Interactive Signal Parameter Adjuster (What-If Simulator) */}
      <ChartCard
        title="Interactive Signal Parameters (What-If Sensitivity)"
        subtitle="Values were automatically populated from the YouTube video. Modify them to test hypothetical virality thresholds."
        badge={
          isModifiedFromFetched ? 'Simulating Modified Values' : 'Synced with YouTube Video Signals'
        }
      >
        <form onSubmit={handleManualPredict} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-300 font-semibold">Likes Count</label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {likes.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={likes}
                onChange={(e) => {
                  setLikes(Number(e.target.value));
                  setIsModifiedFromFetched(true);
                }}
                className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none font-mono focus:border-primary transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-300 font-semibold">Dislikes Count</label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {dislikes.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={dislikes}
                onChange={(e) => {
                  setDislikes(Number(e.target.value));
                  setIsModifiedFromFetched(true);
                }}
                className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none font-mono focus:border-primary transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-300 font-semibold">Comments Count</label>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  {comments.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={comments}
                onChange={(e) => {
                  setComments(Number(e.target.value));
                  setIsModifiedFromFetched(true);
                }}
                className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none font-mono focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold">Content Category</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(Number(e.target.value));
                  setIsModifiedFromFetched(true);
                }}
                className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none focus:border-primary transition-all font-medium"
              >
                {categories?.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name} (Cat {c.categoryId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary" />
              Adjusting parameters will test sensitivity on the trained Decision Tree (~82.2% Acc).
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isModifiedFromFetched && meta && (
                <button
                  type="button"
                  onClick={() => {
                    setLikes(meta.likes);
                    setDislikes(meta.dislikes);
                    setComments(meta.comment_count);
                    setCategoryId(meta.categoryId);
                    setIsModifiedFromFetched(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Fetched</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs uppercase tracking-wider hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Re-Calculate Prediction</span>
              </button>
            </div>
          </div>
        </form>
      </ChartCard>

      {/* Decision Tree vs Naive Bayes Benchmark Cards */}
      {metrics && dt && nb && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Decision Tree Details */}
          <ChartCard
            title="Decision Tree Classifier"
            subtitle="Criterion: Gini • Max Depth: 5 • Stratified Split (80/20)"
            badge={`Accuracy: ${(dt.accuracy * 100).toFixed(1)}%`}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Precision</span>
                  <div className="font-mono text-base font-bold text-white mt-0.5">
                    {(dt.precision * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Recall</span>
                  <div className="font-mono text-base font-bold text-white mt-0.5">
                    {(dt.recall * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">F1-Score</span>
                  <div className="font-mono text-base font-bold text-red-400 mt-0.5">
                    {(dt.f1 * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Feature Importances Bar */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-200">Gini Feature Importances:</span>
                {Object.entries(dt.feature_importances).map(([feat, val]: any) => (
                  <div key={feat} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-300 font-medium capitalize">
                        {feat.replace('_', ' ')}
                      </span>
                      <span className="text-white font-bold">{(val * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${val * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Confusion Matrix with Clear Table Headers */}
              <div>
                <span className="text-xs font-semibold text-slate-200 block mb-2">
                  Confusion Matrix (Test Set: 50,256 items):
                </span>
                <div className="overflow-hidden rounded-xl border border-white/10 text-xs font-mono">
                  <div className="grid grid-cols-3 bg-white/[0.05] p-2 font-bold text-slate-300 text-center border-b border-white/10">
                    <div>Actual \ Pred</div>
                    <div className="text-rose-400">Pred: Not Pop</div>
                    <div className="text-emerald-400">Pred: Popular</div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-white/5 items-center text-center p-2">
                    <div className="font-bold text-slate-400">Actual: Not Pop</div>
                    <div className="p-2 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20">
                      TN: {dt.confusion_matrix[0][0].toLocaleString()}
                    </div>
                    <div className="p-2 rounded bg-rose-500/15 text-rose-300 font-bold border border-rose-500/20">
                      FP: {dt.confusion_matrix[0][1].toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center text-center p-2">
                    <div className="font-bold text-slate-400">Actual: Popular</div>
                    <div className="p-2 rounded bg-rose-500/15 text-rose-300 font-bold border border-rose-500/20">
                      FN: {dt.confusion_matrix[1][0].toLocaleString()}
                    </div>
                    <div className="p-2 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20">
                      TP: {dt.confusion_matrix[1][1].toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Naive Bayes Details */}
          <ChartCard
            title="Gaussian Naïve Bayes Classifier"
            subtitle="Probabilistic Bayes Rule • Identical 80/20 Stratified Split"
            badge={`Accuracy: ${(nb.accuracy * 100).toFixed(1)}%`}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Precision</span>
                  <div className="font-mono text-base font-bold text-cyan-400 mt-0.5">
                    {(nb.precision * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Recall</span>
                  <div className="font-mono text-base font-bold text-white mt-0.5">
                    {(nb.recall * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">F1-Score</span>
                  <div className="font-mono text-base font-bold text-white mt-0.5">
                    {(nb.f1 * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 leading-relaxed">
                <strong>Why 97.2% Precision?</strong> When Naïve Bayes asserts a video is "Popular", it is almost guaranteed to be correct (only 366 False Positives out of 50,256 test cases!). However, it is conservative, leading to lower recall (50.3%).
              </div>

              {/* Confusion Matrix with Clear Table Headers */}
              <div>
                <span className="text-xs font-semibold text-slate-200 block mb-2">
                  Confusion Matrix (Test Set: 50,256 items):
                </span>
                <div className="overflow-hidden rounded-xl border border-white/10 text-xs font-mono">
                  <div className="grid grid-cols-3 bg-white/[0.05] p-2 font-bold text-slate-300 text-center border-b border-white/10">
                    <div>Actual \ Pred</div>
                    <div className="text-rose-400">Pred: Not Pop</div>
                    <div className="text-emerald-400">Pred: Popular</div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-white/5 items-center text-center p-2">
                    <div className="font-bold text-slate-400">Actual: Not Pop</div>
                    <div className="p-2 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20">
                      TN: {nb.confusion_matrix[0][0].toLocaleString()}
                    </div>
                    <div className="p-2 rounded bg-rose-500/15 text-rose-300 font-bold border border-rose-500/20">
                      FP: {nb.confusion_matrix[0][1].toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center text-center p-2">
                    <div className="font-bold text-slate-400">Actual: Popular</div>
                    <div className="p-2 rounded bg-rose-500/15 text-rose-300 font-bold border border-rose-500/20">
                      FN: {nb.confusion_matrix[1][0].toLocaleString()}
                    </div>
                    <div className="p-2 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20">
                      TP: {nb.confusion_matrix[1][1].toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Interactive Decision Tree Visualizer */}
      {dt?.tree_structure && (
        <ChartCard
          title="Interactive Decision Tree Architecture"
          subtitle="Explore internal branch nodes, splits, and leaf decisions (Max Depth: 5)"
          badge="Exported from sklearn.tree"
        >
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 max-h-96 overflow-y-auto">
            <TreeNodeView node={dt.tree_structure} />
          </div>
        </ChartCard>
      )}
    </motion.div>
  );
};
