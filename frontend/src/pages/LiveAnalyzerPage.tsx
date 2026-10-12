import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ExternalLink,
  Award,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Network,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { analyzeLiveYoutube, useLiveYoutubeSamples } from '../lib/api';
import { LiveYoutubeAnalyzeResponse } from '../types/api';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export const LiveAnalyzerPage: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>('https://www.youtube.com/watch?v=v7K4vGYL9ow');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<LiveYoutubeAnalyzeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: samplePresets } = useLiveYoutubeSamples();

  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || urlInput;
    if (!targetUrl.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await analyzeLiveYoutube({ url: targetUrl });
      setAnalysis(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch live YouTube video metadata.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
    handleAnalyze(sampleUrl);
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
          <YoutubeIcon className="w-3.5 h-3.5 text-rose-500" />
          Real-Time Video Benchmarking
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          Live YouTube Video URL Analyzer
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Paste any live YouTube video URL to retrieve its current engagement metrics and benchmark it against the 251,277 Indian trending records and pre-trained ML models.
        </p>
      </div>

      {/* Preset Quick Chips */}
      {samplePresets && samplePresets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Benchmark Presets:
          </span>
          {samplePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectSample(`https://www.youtube.com/watch?v=${preset.video_id}`)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2"
            >
              <Play className="w-3 h-3 text-rose-400 fill-rose-400" />
              <span>{preset.title.length > 30 ? `${preset.title.slice(0, 30)}...` : preset.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Search Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <YoutubeIcon className="absolute left-3.5 top-3 w-4 h-4 text-rose-500" />
            <input
              type="text"
              placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Analyzing...</span>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Analyze Live Video
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {analysis && (
        <AnimatePresence mode="wait">
          <motion.div
            key="analysis-result"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Live Video Summary Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Thumbnail */}
                <div className="relative w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                  <img
                    src={analysis.metadata.thumbnail_url}
                    alt={analysis.metadata.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60';
                    }}
                  />
                  <a
                    href={`https://www.youtube.com/watch?v=${analysis.metadata.video_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-all flex items-center justify-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-600/90 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </a>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {analysis.metadata.categoryName || `Category ${analysis.metadata.categoryId}`}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{analysis.metadata.channelTitle}</span>
                  </div>

                  <h2 className="text-lg font-bold text-white leading-snug">{analysis.metadata.title}</h2>

                  {/* Metrics Counter Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Total Views</div>
                      <div className="text-sm font-black text-white font-mono">
                        {analysis.metadata.view_count.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Total Likes</div>
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        {analysis.metadata.likes.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Total Comments</div>
                      <div className="text-sm font-black text-indigo-400 font-mono">
                        {analysis.metadata.comment_count.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Estimated Dislikes</div>
                      <div className="text-sm font-black text-rose-400 font-mono">
                        {analysis.metadata.dislikes.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DWM Benchmarking Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Percentile & Virality Grade */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    Trending Percentile Rank
                  </span>
                  <span className="text-2xl font-black text-amber-400">
                    Grade {analysis.benchmark_analysis.virality_grade}
                  </span>
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  Top {(100 - analysis.benchmark_analysis.percentile_rank).toFixed(1)}%
                </div>
                <p className="text-xs text-slate-400">
                  Surpasses <strong className="text-slate-200">{analysis.benchmark_analysis.percentile_rank}%</strong> of all 251,277 videos recorded on Indian YouTube trending between 2020–2024.
                </p>
              </div>

              {/* Card 2: Regression Velocity Comparison */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Model Velocity Multiplier
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      analysis.benchmark_analysis.performance_status === 'viral'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {analysis.benchmark_analysis.ratio_actual_to_predicted}x Expected
                  </span>
                </div>
                <div className="text-sm text-slate-300 font-medium">
                  {analysis.benchmark_analysis.performance_verdict}
                </div>
                <div className="text-xs text-slate-400">
                  Predicted baseline:{' '}
                  <span className="font-mono text-white">
                    {Math.round(analysis.benchmark_analysis.model_predicted_views).toLocaleString()} views
                  </span>
                </div>
              </div>

              {/* Card 3: Classification & Cluster */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    ML Archetype Assignment
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    Cluster {analysis.clustering.cluster_id}
                  </span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Class: {analysis.classification.predicted_class}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400">
                  Confidence:{' '}
                  <strong className="text-white">
                    {Math.round(
                      (analysis.classification.probabilities[analysis.classification.predicted_class] || 0.8) * 100
                    )}
                    %
                  </strong>{' '}
                  under Decision Tree model.
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
