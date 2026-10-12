import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Rocket,
  Clock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  BrainCircuit,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import { simulateCreatorVideo, useCategoryTiming } from '../lib/api';
import { CreatorSimulateResponse } from '../types/api';

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
  const [title, setTitle] = useState<string>('Pathaan 2 Official Teaser | Shah Rukh Khan | High Octane Action');
  const [categoryId, setCategoryId] = useState<number>(24);
  const [plannedDay, setPlannedDay] = useState<string>('Friday');
  const [plannedHour, setPlannedHour] = useState<number>(18);
  const [likes, setLikes] = useState<number>(120000);
  const [dislikes, setDislikes] = useState<number>(2500);
  const [comments, setComments] = useState<number>(8500);
  const [tags, setTags] = useState<string>('bollywood, trailer, action');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CreatorSimulateResponse | null>(null);

  const { data: timingProfile } = useCategoryTiming(categoryId);

  const handleSimulate = async () => {
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
          particleCount: 80,
          spread: 70,
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

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
          <Rocket className="w-3.5 h-3.5" />
          Predictive Creator Studio
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          "Will My Video Trend?" Virality Simulator
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Test prospective video releases against regression view models, Decision Tree popularity classifiers, and historical category timing heatmaps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
          <div className="text-sm font-semibold text-slate-200 pb-3 border-b border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Video Parameters & Strategy
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Proposed Video Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Enter release title..."
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{title.length} characters</span>
              <span>Ideal: 35–85 chars</span>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
              className="w-full bg-slate-800/80 border border-slate-700 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Category {c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Planned Day & Hour */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Publish Day
              </label>
              <select
                value={plannedDay}
                onChange={(e) => setPlannedDay(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Time (IST)
              </label>
              <select
                value={plannedHour}
                onChange={(e) => setPlannedHour(parseInt(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}:00 IST ({h >= 12 ? `${h === 12 ? 12 : h - 12} PM` : `${h === 0 ? 12 : h} AM`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Optimal Window Hint */}
          {timingProfile && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong>Historical Peak:</strong> Best window for {timingProfile.category_name} is{' '}
                <span className="font-semibold text-white">{timingProfile.best_day}</span> around{' '}
                <span className="font-semibold text-white">{timingProfile.best_window}</span>.
              </div>
            </div>
          )}

          {/* Expected Engagement Metrics */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300">Expected Engagement Velocity (First 48h)</div>

            {/* Likes Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Target Likes</span>
                <span className="font-mono text-emerald-400 font-semibold">{likes.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="500000"
                step="5000"
                value={likes}
                onChange={(e) => setLikes(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
            </div>

            {/* Comments Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Target Comments</span>
                <span className="font-mono text-indigo-400 font-semibold">{comments.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="100"
                max="50000"
                step="500"
                value={comments}
                onChange={(e) => setComments(parseInt(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
            </div>

            {/* Dislikes Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Estimated Dislikes</span>
                <span className="font-mono text-rose-400 font-semibold">{dislikes.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50"
                max="25000"
                step="250"
                value={dislikes}
                onChange={(e) => setDislikes(parseInt(e.target.value))}
                className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
            </div>
          </div>

          {/* Planned Tags */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Planned Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. trailer, songs, entertainment"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSimulate}
            disabled={isLoading || !title.trim()}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Simulating with ML Models...</span>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Simulate Virality Score
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output & Simulation Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Main Virality Score Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                        Composite Virality Readiness Index
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                          {result.virality_index}
                        </span>
                        <span className="text-lg text-slate-500 font-bold">/ 100</span>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Flame className="w-3.5 h-3.5" />
                        {result.tier}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 max-w-md">{result.tier_description}</p>
                    </div>

                    {/* Circular Score Visual */}
                    <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center relative shadow-inner">
                      <div
                        className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent"
                        style={{ transform: `rotate(${result.virality_index * 3.6}deg)` }}
                      />
                      <div className="text-center">
                        <div className="text-2xl font-black text-white">{Math.round(result.virality_index)}%</div>
                        <div className="text-[10px] text-slate-400 font-semibold">Traction</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metric Projections Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ML Predicted Views */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Multiple Linear Regression Projection
                    </div>
                    <div className="text-2xl font-black text-white">
                      {result.predicted_metrics.predicted_views_range.mid.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Expected Range:{' '}
                      <span className="text-slate-300 font-mono">
                        {(result.predicted_metrics.predicted_views_range.low / 1e6).toFixed(2)}M &ndash;{' '}
                        {(result.predicted_metrics.predicted_views_range.high / 1e6).toFixed(2)}M views
                      </span>
                    </div>
                  </div>

                  {/* Decision Tree Classification */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                      <BrainCircuit className="w-4 h-4 text-indigo-400" />
                      Decision Tree Trending Likelihood
                    </div>
                    <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                      {result.predicted_metrics.popularity_classification}
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Trending Probability:{' '}
                      <span className="text-white font-bold font-mono">
                        {Math.round(result.predicted_metrics.popularity_probability * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timing Analysis Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Publish Timing Optimization
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        result.timing_insights.is_timing_optimal
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      Timing Score: {Math.round(result.timing_insights.timing_score)}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{result.timing_insights.timing_advice}</p>
                </div>

                {/* Title Analysis Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Title Quality & Indexing Analysis
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300">
                      Score: {result.title_analysis.title_score}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                    <div>Length: <strong className="text-white">{result.title_analysis.character_count} chars</strong></div>
                    <div>Uppercase Ratio: <strong className="text-white">{result.title_analysis.uppercase_ratio}%</strong></div>
                  </div>
                  {result.title_analysis.suggestions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      {result.title_analysis.suggestions.map((s, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-amber-300/90">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Complementary Tags */}
                {result.tag_recommendations.recommended_tags.length > 0 && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Tag className="w-4 h-4 text-rose-400" />
                        High-Lift Tag Recommendations (DWM Mined)
                      </div>
                      <span className="text-[11px] text-slate-400">Click to append</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.tag_recommendations.recommended_tags.map((tagItem) => (
                        <button
                          key={tagItem}
                          onClick={() => handleAddTag(tagItem)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center gap-1.5 group"
                        >
                          <span>#{tagItem}</span>
                          {copiedTag === tagItem ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Empty State */
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
              <div className="p-4 rounded-2xl bg-slate-800/60 text-slate-500 mb-4">
                <Rocket className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-300">Awaiting Simulation Parameters</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Configure your video title, category, publish slot, and expected engagement targets on the left, then click "Simulate Virality Score".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
