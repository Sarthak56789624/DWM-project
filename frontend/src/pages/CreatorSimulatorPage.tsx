import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Rocket,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  TrendingUp,
  BrainCircuit,
  Copy,
  Check,
  Calendar,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sliders,
  Tv,
  Zap,
} from 'lucide-react';
import {
  simulateCreatorVideo,
  simulateCreatorVideoByUrl,
  useCategoryTiming,
  useLiveYoutubeSamples,
} from '../lib/api';
import { CreatorSimulateResponse } from '../types/api';
import { formatCompactNumber, formatIndianNumber } from '../lib/formatters';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const CATEGORIES = [
  { id: 24, name: 'Entertainment' },
  { id: 10, name: 'Music' },
  { id: 22, name: 'People & Blogs' },
  { id: 23, name: 'Comedy' },
  { id: 20, name: 'Gaming' },
  { id: 25, name: 'News & Politics' },
  { id: 17, name: 'Sports' },
  { id: 1, name: 'Film & Animation' },
  { id: 28, name: 'Science & Technology' },
  { id: 26, name: 'Howto & Style' },
  { id: 27, name: 'Education' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const CreatorSimulatorPage: React.FC = () => {
  const { data: samplePresets } = useLiveYoutubeSamples();

  // URL input state (Automated Workflow)
  const [videoUrl, setVideoUrl] = useState<string>('https://www.youtube.com/watch?v=v7K4vGYL9ow');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Core Simulation Output
  const [result, setResult] = useState<CreatorSimulateResponse | null>(null);

  // Optional manual fine-tuning / what-if customization
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('Pathaan 2 Official Teaser | Shah Rukh Khan');
  const [categoryId, setCategoryId] = useState<number>(24);
  const [plannedDay, setPlannedDay] = useState<string>('Friday');
  const [plannedHour, setPlannedHour] = useState<number>(18);
  const [likes, setLikes] = useState<number>(2840000);
  const [dislikes, setDislikes] = useState<number>(12000);
  const [comments, setComments] = useState<number>(185000);
  const [tags, setTags] = useState<string>('bollywood, trailer, action');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const { data: timingProfile } = useCategoryTiming(categoryId);

  // Automated Virality Simulation directly from YouTube Video URL
  const handleSimulateUrl = async (targetUrl?: string) => {
    const urlToUse = targetUrl || videoUrl;
    if (!urlToUse.trim()) return;

    setIsLoading(true);
    setUrlError(null);

    try {
      const res = await simulateCreatorVideoByUrl({
        url: urlToUse,
        planned_day: plannedDay,
        planned_hour_ist: plannedHour,
        planned_tags: tags,
      });

      setResult(res);

      // Auto-populate what-if fields with live extracted video metadata
      if (res.metadata) {
        setTitle(res.metadata.title);
        setCategoryId(res.metadata.categoryId);
        setLikes(res.metadata.likes);
        setDislikes(res.metadata.dislikes);
        setComments(res.metadata.comment_count);
      }

      // Celebrate if viral!
      if (res.is_viral || res.virality_index >= 70) {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#00f2fe', '#f59e0b', '#ec4899'],
        });
      }
    } catch (err: any) {
      console.error(err);
      setUrlError(err.message || 'Failed to simulate video virality. Please verify URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load: automatically simulate the default popular video
  useEffect(() => {
    handleSimulateUrl(videoUrl);
  }, []);

  // Re-run simulation with manually tweaked what-if parameters
  const handleManualSimulate = async () => {
    setIsLoading(true);
    try {
      const res = await simulateCreatorVideo({
        title,
        categoryId,
        planned_day: plannedDay,
        planned_hour_ist: plannedHour,
        expected_likes: likes,
        expected_dislikes: dislikes,
        expected_comments: comments,
        planned_tags: tags,
      });
      setResult(res);

      if (res.virality_index >= 70) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#ec4899', '#f59e0b'],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const current = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (!current.includes(tagToAdd.toLowerCase())) {
      const updated = [...current, tagToAdd].join(', ');
      setTags(updated);
      setCopiedTag(tagToAdd);
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  const meta = result?.metadata;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
          <Rocket className="w-3.5 h-3.5 text-emerald-400" />
          Automated YouTube Virality Forecaster & Creator Studio
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          "Will It Go Viral?" Virality Simulator
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Paste any YouTube video URL to automatically extract interaction velocity (likes, dislikes, comments, views, category)
          and predict whether the video will trend using Decision Tree classification, Multiple Linear Regression, category timing heatmaps, and DWM tag rules.
        </p>
      </div>

      {/* Quick Test Creator Presets */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Test Popular Releases:
        </span>
        {[
          {
            name: 'YRF (Pathaan)',
            url: 'https://www.youtube.com/watch?v=v7K4vGYL9ow',
            badge: 'Supernova',
          },
          {
            name: 'CarryMinati (Yalgaar)',
            url: 'https://www.youtube.com/watch?v=zzwRbGO4SmQ',
            badge: 'Top Viral',
          },
          {
            name: 'Sourav Joshi Vlogs',
            url: 'https://www.youtube.com/watch?v=1poXp7r7_rM',
            badge: 'High Traction',
          },
          {
            name: 'T-Series (Naatu Naatu)',
            url: 'https://www.youtube.com/watch?v=OsM3PcwB_2A',
            badge: 'Global Hit',
          },
        ].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setVideoUrl(item.url);
              handleSimulateUrl(item.url);
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2 group shadow-sm"
          >
            <Play className="w-3 h-3 text-emerald-400 fill-emerald-400 group-hover:scale-110 transition-transform" />
            <span>{item.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
              {item.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Primary URL Input Bar */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-white/15 p-6 shadow-2xl backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSimulateUrl();
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
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/90 border border-white/20 text-sm text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !videoUrl.trim()}
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <BrainCircuit className="w-4 h-4 animate-spin text-white" />
                  <span>Predicting Virality...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 text-emerald-200" />
                  <span>Auto-Predict Virality</span>
                </>
              )}
            </button>
          </div>

          {urlError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{urlError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Main Virality Simulator Dashboard */}
      {result ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={result.virality_index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Top Row: Auto-Fetched Video Card & Virality Prediction Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Video Metadata Card */}
              {meta ? (
                <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {meta.categoryName} (Category {meta.categoryId})
                      </span>
                      <a
                        href={`https://www.youtube.com/watch?v=${meta.video_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Watch on YouTube</span>
                      </a>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 group">
                      <img
                        src={meta.thumbnail_url}
                        alt={meta.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-xs font-bold text-white line-clamp-1">
                        {meta.title}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                        {meta.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <span className="text-slate-200 font-semibold">{meta.channelTitle}</span>
                      </p>
                    </div>

                    {/* Auto-Fetched Engagement Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-center">
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Views</span>
                        <span className="font-mono text-xs font-bold text-white block mt-0.5">
                          {formatCompactNumber(meta.view_count)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Likes</span>
                        <span className="font-mono text-xs font-bold text-emerald-400 block mt-0.5">
                          {formatCompactNumber(meta.likes)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Comments</span>
                        <span className="font-mono text-xs font-bold text-cyan-400 block mt-0.5">
                          {formatCompactNumber(meta.comment_count)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Engagement</span>
                        <span className="font-mono text-xs font-bold text-amber-400 block mt-0.5">
                          {meta.engagement_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-xl flex items-center justify-center text-slate-400 text-xs">
                  Video parameters loaded from custom simulation.
                </div>
              )}

              {/* Right Column: "WILL IT GO VIRAL?" Decision Banner & Composite Score */}
              <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/15 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Primary Viral Verdict Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Virality Classification Outcome:
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border shadow-sm ${
                        result.is_viral || result.virality_index >= 70
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                          : result.virality_index >= 50
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {result.is_viral || result.virality_index >= 70 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>YES — PREDICTED VIRAL HIT</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>NOT VIRAL / NICHE REACH</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Main Score & Radial Gauge */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Composite Virality Readiness Index</div>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-mono">
                          {result.virality_index}
                        </span>
                        <span className="text-lg text-slate-500 font-bold">/ 100</span>
                      </div>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>{result.tier}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 max-w-md leading-relaxed">
                        {result.virality_verdict || result.tier_description}
                      </p>
                    </div>

                    {/* Circular Score Visual Gauge */}
                    <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center relative shadow-inner shrink-0">
                      <div
                        className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent"
                        style={{ transform: `rotate(${result.virality_index * 3.6}deg)` }}
                      />
                      <div className="text-center">
                        <div className="text-2xl font-black text-white font-mono">
                          {Math.round(result.virality_index)}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">Traction Score</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>Based on: {likes.toLocaleString()} likes • {comments.toLocaleString()} comments</span>
                  <span className="text-cyan-400 font-mono">Decision Tree + OLS Multi-Model</span>
                </div>
              </div>
            </div>

            {/* Detailed ML Projections Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Decision Tree Likelihood */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  Decision Tree Classification
                </div>
                <div className="text-xl font-black text-emerald-400 flex items-center gap-2">
                  <span>{result.predicted_metrics.popularity_classification}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xs text-slate-400">
                  Trending Probability:{' '}
                  <span className="text-white font-bold font-mono">
                    {Math.round(result.predicted_metrics.popularity_probability * 100)}%
                  </span>
                </div>
              </div>

              {/* OLS Multiple Regression Views */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Regression Projected Views
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {formatCompactNumber(result.predicted_metrics.predicted_views)}
                </div>
                <div className="text-xs text-slate-400">
                  Expected Range:{' '}
                  <span className="text-slate-300 font-mono">
                    {formatCompactNumber(result.predicted_metrics.predicted_views_range.low)} –{' '}
                    {formatCompactNumber(result.predicted_metrics.predicted_views_range.high)}
                  </span>
                </div>
              </div>

              {/* Timing Optimization Score */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Publish Timing Optimization
                </div>
                <div className="text-xl font-black text-cyan-400 font-mono">
                  {Math.round(result.timing_insights.timing_score)}/100
                </div>
                <div className="text-xs text-slate-400 line-clamp-1">
                  Peak: <strong className="text-white">{result.timing_insights.category_best_day}</strong> ({result.timing_insights.category_best_window})
                </div>
              </div>

              {/* Title SEO & Hype Score */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Title SEO & Indexing Score
                </div>
                <div className="text-xl font-black text-amber-400 font-mono">
                  {result.title_analysis.title_score}/100
                </div>
                <div className="text-xs text-slate-400">
                  {result.title_analysis.character_count} chars • {result.title_analysis.detected_keywords.length} hype triggers
                </div>
              </div>
            </div>

            {/* Timing & Title Advice Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timing Insights */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Timing Analysis & Heatmap Matching
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      result.timing_insights.is_timing_optimal
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {result.timing_insights.is_timing_optimal ? 'Optimal Slot' : 'Sub-Optimal Slot'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.timing_insights.timing_advice}
                </p>
                {timingProfile && (
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-300 flex items-center justify-between font-mono">
                    <span>Category Peak Day: <strong className="text-cyan-400">{timingProfile.best_day}</strong></span>
                    <span>Best Window: <strong className="text-cyan-400">{timingProfile.best_window}</strong></span>
                  </div>
                )}
              </div>

              {/* Title & SEO Suggestions */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Title Optimization Recommendations
                  </div>
                  <span className="text-xs text-slate-400">
                    Caps: <strong className="text-white">{result.title_analysis.uppercase_ratio}%</strong>
                  </span>
                </div>

                {result.title_analysis.suggestions.length > 0 ? (
                  <div className="space-y-1.5">
                    {result.title_analysis.suggestions.map((s, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-amber-300/90">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Title length and capitalization fall cleanly within high-CTR benchmarks!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended High-Lift Complementary Tags */}
            {result.tag_recommendations.recommended_tags.length > 0 && (
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Tag className="w-4 h-4 text-rose-400" />
                    High-Lift Tag Recommendations (DWM Mined from 251k Indian Records)
                  </div>
                  <span className="text-[11px] text-slate-400">Click tag to append to simulation</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.tag_recommendations.recommended_tags.map((tagItem) => (
                    <button
                      key={tagItem}
                      onClick={() => handleAddTag(tagItem)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center gap-1.5 group cursor-pointer"
                    >
                      <span>#{tagItem}</span>
                      {copiedTag === tagItem ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Collapsible: Advanced What-If Simulation Controls */}
            <div className="rounded-2xl bg-slate-900/70 border border-white/10 overflow-hidden shadow-lg">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors bg-white/[0.02] border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Optional: Fine-Tune / Test "What-If" Counterfactual Scenarios</span>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 space-y-5"
                >
                  <p className="text-xs text-slate-400">
                    Modify the video's parameters below to test hypothetical scenarios (e.g. testing different release days, times, or target likes).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Video Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Category</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-white/15 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Category {c.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Publish Day */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Publish Day</label>
                      <select
                        value={plannedDay}
                        onChange={(e) => setPlannedDay(e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Publish Time */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Publish Time (IST)</label>
                      <select
                        value={plannedHour}
                        onChange={(e) => setPlannedHour(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-white/15 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {Array.from({ length: 24 }).map((_, h) => (
                          <option key={h} value={h}>
                            {h.toString().padStart(2, '0')}:00 IST ({h >= 12 ? `${h === 12 ? 12 : h - 12} PM` : `${h === 0 ? 12 : h} AM`})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sliders for What-If Simulation */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/10">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Likes</span>
                        <span className="font-mono text-emerald-400 font-bold">{likes.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="5000000"
                        step="10000"
                        value={likes}
                        onChange={(e) => setLikes(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Dislikes</span>
                        <span className="font-mono text-rose-400 font-bold">{dislikes.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="250000"
                        step="1000"
                        value={dislikes}
                        onChange={(e) => setDislikes(parseInt(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Comments</span>
                        <span className="font-mono text-cyan-400 font-bold">{comments.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="500000"
                        step="2000"
                        value={comments}
                        onChange={(e) => setComments(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* What-If Re-simulate button */}
                  <button
                    type="button"
                    onClick={handleManualSimulate}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Re-Calculate What-If Scenario</span>
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Empty State */
        <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
          <div className="p-4 rounded-2xl bg-slate-800/60 text-slate-500 mb-4">
            <Rocket className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-300">Awaiting YouTube URL Input</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Paste any YouTube video link in the box above or choose one of the popular test creators to automatically run the virality simulation.
          </p>
        </div>
      )}
    </div>
  );
};
