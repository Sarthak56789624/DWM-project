import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { predictClassification, useCategories, useClassificationMetrics } from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { ClassificationTreeNode } from '../types/api';

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
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${node.prediction === 'Popular' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'}`}>
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
  const { data: metrics, isLoading } = useClassificationMetrics();
  const { data: categories } = useCategories();

  const [model, setModel] = useState<'decision_tree' | 'naive_bayes'>('decision_tree');
  const [likes, setLikes] = useState<number>(100000);
  const [dislikes, setDislikes] = useState<number>(1000);
  const [comments, setComments] = useState<number>(5000);
  const [categoryId, setCategoryId] = useState<number>(24);

  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  const runPrediction = async (m: typeof model, l: number, d: number, c: number, cat: number, triggerConfetti = false) => {
    setIsPredicting(true);
    try {
      const res = await predictClassification({
        likes: l,
        dislikes: d,
        comment_count: c,
        categoryId: cat,
        model: m,
      });
      setPredictionResult(res);

      if (triggerConfetti && res.predicted_class === 'Popular') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff0055', '#00f2fe', '#f6d365'],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  // Run initial prediction so output is immediately visible
  useEffect(() => {
    runPrediction(model, likes, dislikes, comments, categoryId, false);
  }, [model]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    await runPrediction(model, likes, dislikes, comments, categoryId, true);
  };

  const dt = metrics?.decision_tree;
  const nb = metrics?.naive_bayes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Interactive Popularity Classifier Form & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <ChartCard
          title="Classify Video Popularity"
          subtitle="Test whether a video reaches the top 50% (> 947k views threshold)"
          badge="Target: Popular vs Not Popular"
          className="lg:col-span-2"
        >
          <form onSubmit={handlePredict} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Model Architecture</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as any)}
                  className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none focus:border-primary transition-all font-medium"
                >
                  <option value="decision_tree">Decision Tree Classifier (Depth 5, ~82.2% Acc)</option>
                  <option value="naive_bayes">Gaussian Naive Bayes (~74.4% Acc, High Precision)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Content Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none focus:border-primary transition-all font-medium"
                >
                  {categories?.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.name} (Cat {c.categoryId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Likes Count</label>
                <input
                  type="number"
                  min={0}
                  value={likes}
                  onChange={(e) => setLikes(Number(e.target.value))}
                  className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none font-mono focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Dislikes Count</label>
                <input
                  type="number"
                  min={0}
                  value={dislikes}
                  onChange={(e) => setDislikes(Number(e.target.value))}
                  className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none font-mono focus:border-primary transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-slate-300 font-semibold">Comment Count</label>
                <input
                  type="number"
                  min={0}
                  value={comments}
                  onChange={(e) => setComments(Number(e.target.value))}
                  className="mt-1 w-full bg-slate-900 border border-white/15 rounded-xl text-xs text-white p-3 outline-none font-mono focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPredicting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold text-sm shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BrainCircuit className="h-4 w-4" />
              <span>{isPredicting ? 'Classifying Signals...' : 'Predict Popularity Status'}</span>
            </button>
          </form>
        </ChartCard>

        {/* Prediction Result Gauge Card - Always Clearly Visible */}
        <ChartCard
          title="Classification Inference"
          subtitle="Model probability distribution"
          badge={predictionResult ? (predictionResult.model === 'decision_tree' ? 'Decision Tree' : 'Naive Bayes') : 'Model Output'}
        >
          {predictionResult ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-5 text-center pt-2"
            >
              <div
                className={`mx-auto h-24 w-24 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
                  predictionResult.predicted_class === 'Popular'
                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.35)]'
                    : 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.35)]'
                }`}
              >
                {predictionResult.predicted_class === 'Popular' ? (
                  <CheckCircle2 className="h-12 w-12" />
                ) : (
                  <XCircle className="h-12 w-12" />
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Predicted Class
                </span>
                <h3 className="text-3xl font-display font-extrabold text-white">
                  {predictionResult.predicted_class}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  {predictionResult.predicted_class === 'Popular'
                    ? 'Expected to exceed 947,434 views threshold (Top 50%)'
                    : 'Projected below median views threshold'}
                </p>
              </div>

              {/* Class Probabilities Bar */}
              <div className="space-y-3 text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">P(Popular):</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {((predictionResult.probabilities['Popular'] || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                      style={{ width: `${(predictionResult.probabilities['Popular'] || 0) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">P(Not Popular):</span>
                    <span className="text-rose-400 font-mono font-bold">
                      {((predictionResult.probabilities['Not Popular'] || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
                      style={{ width: `${(predictionResult.probabilities['Not Popular'] || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <BrainCircuit className="h-12 w-12 text-primary animate-pulse" />
              <p className="text-xs max-w-xs">
                Computing model predictions...
              </p>
            </div>
          )}
        </ChartCard>
      </div>

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
                      <span className="text-slate-300 font-medium capitalize">{feat.replace('_', ' ')}</span>
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
                <span className="text-xs font-semibold text-slate-200 block mb-2">Confusion Matrix (Test Set: 50,256 items):</span>
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
                <span className="text-xs font-semibold text-slate-200 block mb-2">Confusion Matrix (Test Set: 50,256 items):</span>
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
