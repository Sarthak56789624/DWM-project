import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EChart } from '../components/EChart';
import { CountUpNumber } from '../components/CountUpNumber';
import { Calculator, Sparkles, TrendingUp } from 'lucide-react';
import { predictRegression, useRegressionMetrics } from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { formatCompactNumber } from '../lib/formatters';

export const RegressionLabPage: React.FC = () => {
  const { data: metrics, isLoading } = useRegressionMetrics();

  const [modelType, setModelType] = useState<'simple' | 'multiple'>('multiple');
  const [likes, setLikes] = useState<number>(75000);
  const [dislikes, setDislikes] = useState<number>(800);
  const [comments, setComments] = useState<number>(2500);

  const [predictedViews, setPredictedViews] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  const runPrediction = async (currLikes: number, currDislikes: number, currComments: number, currModel: 'simple' | 'multiple') => {
    setIsPredicting(true);
    try {
      const res = await predictRegression({
        likes: currLikes,
        dislikes: currDislikes,
        comment_count: currComments,
        model: currModel,
      });
      setPredictedViews(res.predicted_views);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  // Initial calculation on mount so output is immediately visible to user
  useEffect(() => {
    runPrediction(likes, dislikes, comments, modelType);
  }, [modelType]);

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await runPrediction(likes, dislikes, comments, modelType);
  };

  const activeModel = modelType === 'simple' ? metrics?.simple : metrics?.multiple;

  // Regression Line Plot Option with high-contrast scatter dots
  const regressionPlotOption = activeModel
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            if (params.seriesName === 'Test Observations') {
              return `<div style="font-weight:bold; margin-bottom:2px;">Actual Video Data</div>Likes: <strong>${formatCompactNumber(params.value[0])}</strong><br/>Actual Views: <span style="color:#00f2fe; font-weight:bold;">${formatCompactNumber(params.value[1])}</span>`;
            }
            return `<div style="font-weight:bold; margin-bottom:2px;">Regression Fit</div>Likes: <strong>${formatCompactNumber(params.value[0])}</strong><br/>Predicted Views: <span style="color:#ff0055; font-weight:bold;">${formatCompactNumber(params.value[1])}</span>`;
          },
        },
        legend: {
          data: ['Test Observations', 'Model Regression Line'],
          textStyle: { color: '#94a3b8', fontSize: 12 },
          top: 4,
        },
        grid: { left: '4%', right: '5%', bottom: '12%', top: '14%', containLabel: true },
        xAxis: {
          type: 'value',
          name: 'Likes',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
        },
        yAxis: {
          type: 'value',
          name: 'Views',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
          axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
        },
        series: [
          {
            name: 'Test Observations',
            type: 'scatter',
            symbolSize: 7,
            data: activeModel.plot_sample.map((p) => [p.likes, p.actual_views]),
            itemStyle: {
              color: 'rgba(0, 242, 254, 0.75)',
              borderColor: '#00f2fe',
              borderWidth: 0.8,
            },
          },
          {
            name: 'Model Regression Line',
            type: 'line',
            data: [...activeModel.plot_sample]
              .sort((a, b) => a.likes - b.likes)
              .map((p) => [p.likes, p.predicted_views]),
            smooth: false,
            showSymbol: false,
            itemStyle: { color: '#ff0055' },
            lineStyle: { width: 3.5, color: '#ff0055' },
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
      {/* Model Selection Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl glass-panel">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <button
            onClick={() => setModelType('simple')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              modelType === 'simple'
                ? 'bg-primary text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Simple Linear (Likes → Views)
          </button>
          <button
            onClick={() => setModelType('multiple')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              modelType === 'multiple'
                ? 'bg-primary text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Multiple Linear (Likes + Dislikes + Comments)
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono px-2">
          <span>R² Score: </span>
          <span className="text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
            {modelType === 'simple' ? '0.628 (62.8%)' : '0.635 (63.5%)'}
          </span>
        </div>
      </div>

      {/* Interactive Predictor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction Form & Sliders */}
        <ChartCard
          title="Predict Expected Views"
          subtitle="Adjust engagement parameters to simulate predicted reach"
          badge="Live ML Inference"
          className="lg:col-span-1"
        >
          <form onSubmit={handlePredict} className="space-y-5">
            {/* Likes Slider & Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Likes:</span>
                <span className="text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {likes.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={500000}
                step={5000}
                value={likes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLikes(val);
                }}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>250K</span>
                <span>500K</span>
              </div>
            </div>

            {/* Dislikes Slider & Input */}
            {modelType === 'multiple' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Dislikes:</span>
                  <span className="text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {dislikes.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25000}
                  step={200}
                  value={dislikes}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDislikes(val);
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0</span>
                  <span>12.5K</span>
                  <span>25K</span>
                </div>
              </div>
            )}

            {/* Comments Slider & Input */}
            {modelType === 'multiple' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Comments:</span>
                  <span className="text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {comments.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={comments}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setComments(val);
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0</span>
                  <span>25K</span>
                  <span>50K</span>
                </div>
              </div>
            )}

            {modelType === 'simple' && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-400 leading-relaxed">
                <span className="text-cyan-400 font-semibold block mb-1">💡 Univariate Formulation:</span>
                In the simple linear model, views are predicted purely as a linear function of likes: <span className="font-mono text-white">Views = β₀ + β₁·Likes</span>.
              </div>
            )}

            <button
              type="submit"
              disabled={isPredicting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              <span>{isPredicting ? 'Inferencing...' : 'Compute Predicted Views'}</span>
            </button>

            {/* Live Prediction Output Card - High Contrast & Clearly Visible */}
            {predictedViews !== null ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-950 border-2 border-red-500/40 text-center space-y-2 shadow-2xl relative overflow-hidden"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 animate-spin" />
                  <span>Model Output Result</span>
                </div>
                <div className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                  <CountUpNumber end={predictedViews} duration={1.2} />
                </div>
                <p className="text-sm font-semibold text-red-300">
                  ≈ {formatCompactNumber(predictedViews)} Projected Views
                </p>
                <div className="pt-2 border-t border-white/10 flex justify-around text-[11px] text-slate-400 font-mono">
                  <span>Based on: {formatCompactNumber(likes)} Likes</span>
                  {modelType === 'multiple' && (
                    <span>• {formatCompactNumber(comments)} Comments</span>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-500">
                Click above to generate real-time prediction
              </div>
            )}
          </form>
        </ChartCard>

        {/* Regression Fit Visualization */}
        <ChartCard
          title="Fitted Regression Hyperplane vs Observations"
          subtitle="Plotting test data actual views vs model regression line"
          badge={`R² = ${modelType === 'simple' ? '0.628' : '0.635'}`}
          className="lg:col-span-2"
        >
          {isLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <EChart option={regressionPlotOption} style={{ height: '380px', width: '100%' }} />
          )}
        </ChartCard>
      </div>

      {/* Model Performance Comparison Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartCard title="Coefficient of Determination (R²)" subtitle="Variance in views explained by engagement">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Simple Linear (Likes):</span>
                  <span className="font-mono text-white font-bold">{(metrics.simple.r2 * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${metrics.simple.r2 * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Multiple Linear (All 3):</span>
                  <span className="font-mono text-cyan-400 font-bold">{(metrics.multiple.r2 * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${metrics.multiple.r2 * 100}%` }} />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                Adding dislikes and comments improves R² by merely <strong className="text-white">+0.6%</strong>, confirming that likes capture almost all predictive power.
              </p>
            </div>
          </ChartCard>

          <ChartCard title="Mean Absolute Error (MAE)" subtitle="Average deviation on test set">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center text-xs">
                <span className="text-slate-400">Simple Linear:</span>
                <span className="text-white font-mono font-bold">{formatCompactNumber(metrics.simple.mae)}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center text-xs">
                <span className="text-slate-400">Multiple Linear:</span>
                <span className="text-cyan-400 font-mono font-bold">{formatCompactNumber(metrics.multiple.mae)}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                MAE is ~1.60 million views, driven by high variance in the multi-million view viral tail.
              </p>
            </div>
          </ChartCard>

          <ChartCard title="Root Mean Squared Error (RMSE)" subtitle="Penalizes large error outliers">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center text-xs">
                <span className="text-slate-400">Simple Linear:</span>
                <span className="text-white font-mono font-bold">{formatCompactNumber(metrics.simple.rmse)}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center text-xs">
                <span className="text-slate-400">Multiple Linear:</span>
                <span className="text-cyan-400 font-mono font-bold">{formatCompactNumber(metrics.multiple.rmse)}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                RMSE is ~4.13 million views, reflecting quadratic penalties on runaway viral hits.
              </p>
            </div>
          </ChartCard>
        </div>
      )}
    </motion.div>
  );
};
