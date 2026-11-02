import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Calculator,
  Sparkles,
  TrendingUp,
  Play,
  BrainCircuit,
  ExternalLink,
  BarChart3,
  Calendar,
  Zap,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Clock,
  Tv,
} from 'lucide-react';
import {
  predictRegression,
  predictRegressionByUrl,
  useRegressionMetrics,
  useLiveYoutubeSamples,
} from '../lib/api';
import { ChartCard } from '../components/ChartCard';
import { Skeleton } from '../components/Skeleton';
import { EChart } from '../components/EChart';
import { CountUpNumber } from '../components/CountUpNumber';
import { formatCompactNumber, formatIndianNumber } from '../lib/formatters';
import { RegressionUrlResponse } from '../types/api';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const RegressionLabPage: React.FC = () => {
  const { data: metrics, isLoading: isMetricsLoading } = useRegressionMetrics();
  const { data: samplePresets } = useLiveYoutubeSamples();

  // Model & URL selection state
  const [modelType, setModelType] = useState<'simple' | 'multiple'>('multiple');
  const [videoUrl, setVideoUrl] = useState<string>('https://www.youtube.com/watch?v=v7K4vGYL9ow');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlAnalysis, setUrlAnalysis] = useState<RegressionUrlResponse | null>(null);

  // Manual What-If parameters (auto-populated by fetched video)
  const [likes, setLikes] = useState<number>(2840000);
  const [dislikes, setDislikes] = useState<number>(12000);
  const [comments, setComments] = useState<number>(185000);
  const [isModifiedFromFetched, setIsModifiedFromFetched] = useState<boolean>(false);

  // Real-time regression prediction state
  const [predictedViews, setPredictedViews] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  // Visualization & diagnostic tabs
  const [diagnosticTab, setDiagnosticTab] = useState<'fit' | 'residuals' | 'growth'>('fit');

  // Time horizon forecast state (Days / Weeks / Month / Year)
  const [horizonDays, setHorizonDays] = useState<number>(30);

  // Run manual or slider prediction
  const runPrediction = async (
    currLikes: number,
    currDislikes: number,
    currComments: number,
    currModel: 'simple' | 'multiple'
  ) => {
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

  // Fetch live video URL and evaluate regression + channel benchmarking
  const handleFetchAndPredictUrl = async (targetUrl?: string, overrideModel?: typeof modelType) => {
    const urlToUse = targetUrl || videoUrl;
    if (!urlToUse.trim()) return;

    setIsLoadingUrl(true);
    setUrlError(null);
    const m = overrideModel || modelType;

    try {
      const res = await predictRegressionByUrl({
        url: urlToUse,
        model: m,
      });

      setUrlAnalysis(res);
      setPredictedViews(res.prediction.predicted_views);

      // Synchronize sliders with live fetched video signals
      setLikes(res.metadata.likes);
      setDislikes(res.metadata.dislikes);
      setComments(res.metadata.comment_count);
      setIsModifiedFromFetched(false);

      if (res.benchmark_comparison.performance_status === 'viral') {
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#10b981', '#ff0055', '#fbbf24'],
        });
      }
    } catch (err: any) {
      console.error(err);
      setUrlError(err.message || 'Failed to fetch video metrics. Please verify URL or network.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Initial load: Fetch default sample URL
  useEffect(() => {
    handleFetchAndPredictUrl(videoUrl, modelType);
  }, []);

  // When model architecture changes
  const handleModelChange = (newModel: 'simple' | 'multiple') => {
    setModelType(newModel);
    if (urlAnalysis && !isModifiedFromFetched) {
      handleFetchAndPredictUrl(videoUrl, newModel);
    } else {
      runPrediction(likes, dislikes, comments, newModel);
    }
  };

  const handleManualPredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await runPrediction(likes, dislikes, comments, modelType);
    setIsModifiedFromFetched(true);
  };

  const activeModel = modelType === 'simple' ? metrics?.simple : metrics?.multiple;

  // Exact mathematical coefficient calculations
  const mathBreakdown = useMemo(() => {
    const isSimple = modelType === 'simple';
    const intercept = isSimple ? 821898.51 : 768064.66;
    const bLikes = isSimple ? 14.2144 : 14.9018;
    const bDislikes = isSimple ? 0 : 6.1333;
    const bComments = isSimple ? 0 : -6.7879;

    const likesContr = likes * bLikes;
    const dislikesContr = dislikes * bDislikes;
    const commentsContr = comments * bComments;
    const totalCalc = Math.max(0, intercept + likesContr + dislikesContr + commentsContr);

    return {
      intercept,
      bLikes,
      bDislikes,
      bComments,
      likesContr,
      dislikesContr,
      commentsContr,
      totalCalc,
    };
  }, [modelType, likes, dislikes, comments]);

  // Dynamic time-horizon view projection based on empirical decay curve
  const temporalForecast = useMemo(() => {
    const baseViews = urlAnalysis
      ? Math.max(urlAnalysis.metadata.view_count, predictedViews || 0)
      : predictedViews || 1000000;

    const engRate = urlAnalysis ? urlAnalysis.metadata.engagement_rate / 100 : 0.03;
    const velocityFactor = Math.min(0.65, Math.max(0.2, 0.25 + engRate * 4.0));

    const projectAtDays = (d: number) => {
      const multiplier = 1.0 + velocityFactor * Math.log(1.0 + d / 3.0);
      return Math.round(baseViews * multiplier);
    };

    const currentHorizonViews = projectAtDays(horizonDays);
    const multiplier = currentHorizonViews / Math.max(1, baseViews);
    const netGained = currentHorizonViews - baseViews;
    const dailyVelocity = Math.round(netGained / Math.max(1, horizonDays));

    // Preset milestones
    const preset7 = projectAtDays(7);
    const preset30 = projectAtDays(30);
    const preset90 = projectAtDays(90);
    const preset365 = projectAtDays(365);

    // Trajectory curve data points
    const daysRange = [1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 240, 300, 365];
    const curvePoints = daysRange.map((d) => {
      const proj = projectAtDays(d);
      const mae = activeModel?.mae || 1596353;
      return {
        day: d,
        views: proj,
        lower: Math.max(0, proj - mae),
        upper: proj + mae,
      };
    });

    return {
      baseViews,
      velocityFactor,
      currentHorizonViews,
      multiplier,
      netGained,
      dailyVelocity,
      preset7,
      preset30,
      preset90,
      preset365,
      curvePoints,
    };
  }, [urlAnalysis, predictedViews, horizonDays, activeModel]);

  // Chart 1: Regression Fit Hyperplane with Live Marker
  const regressionFitPlotOption = useMemo(() => {
    if (!activeModel?.plot_sample) return {};

    const livePoint = urlAnalysis
      ? [urlAnalysis.metadata.likes, urlAnalysis.metadata.view_count]
      : [likes, predictedViews || 0];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesName === 'Live Video Under Test') {
            return `
              <div style="font-weight:bold; color:#fbbf24; margin-bottom:4px; font-size:13px;">
                🎯 LIVE VIDEO ANALYZED
              </div>
              <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">${urlAnalysis?.metadata?.title || 'Current Video'}</div>
              Likes: <strong>${formatIndianNumber(params.value[0])}</strong><br/>
              Actual Views: <span style="color:#00f2fe; font-weight:bold;">${formatIndianNumber(params.value[1])}</span><br/>
              Projected (OLS): <span style="color:#ff0055; font-weight:bold;">${formatIndianNumber(predictedViews || 0)}</span>
            `;
          }
          if (params.seriesName === 'Test Observations') {
            return `
              <div style="font-weight:bold; margin-bottom:2px; color:#94a3b8;">Trending Sample Observation</div>
              Likes: <strong>${formatCompactNumber(params.value[0])}</strong><br/>
              Actual Views: <span style="color:#00f2fe; font-weight:bold;">${formatCompactNumber(params.value[1])}</span>
            `;
          }
          return `
            <div style="font-weight:bold; margin-bottom:2px; color:#ff0055;">Model Regression Line (OLS)</div>
            Likes: <strong>${formatCompactNumber(params.value[0])}</strong><br/>
            Fitted Views: <span style="color:#ff0055; font-weight:bold;">${formatCompactNumber(params.value[1])}</span>
          `;
        },
      },
      legend: {
        data: ['Test Observations', 'Model Regression Line', 'Live Video Under Test'],
        textStyle: { color: '#94a3b8', fontSize: 12 },
        top: 6,
      },
      grid: { left: '4%', right: '5%', bottom: '12%', top: '15%', containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Likes (Engagement Signal)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
        axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
      },
      yAxis: {
        type: 'value',
        name: 'Views Reach',
        nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
        axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
      },
      series: [
        {
          name: 'Test Observations',
          type: 'scatter',
          symbolSize: 6,
          data: activeModel.plot_sample.map((p) => [p.likes, p.actual_views]),
          itemStyle: {
            color: 'rgba(0, 242, 254, 0.70)',
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
        {
          name: 'Live Video Under Test',
          type: 'scatter',
          symbol: 'pin',
          symbolSize: 32,
          data: [livePoint],
          itemStyle: {
            color: '#fbbf24',
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowBlur: 14,
            shadowColor: 'rgba(251, 191, 36, 0.9)',
          },
          z: 10,
        },
      ],
    };
  }, [activeModel, urlAnalysis, likes, predictedViews]);

  // Chart 2: Residual Diagnostic Plot (Residuals vs Fitted)
  const residualPlotOption = useMemo(() => {
    if (!activeModel?.plot_sample) return {};

    const sampleResiduals = activeModel.plot_sample.map((p) => [
      p.predicted_views,
      p.actual_views - p.predicted_views,
    ]);

    const liveResidual = urlAnalysis
      ? [
          urlAnalysis.prediction.predicted_views,
          urlAnalysis.metadata.view_count - urlAnalysis.prediction.predicted_views,
        ]
      : [predictedViews || 0, (likes * 14.9) - (predictedViews || 0)];

    const mae = activeModel.mae || 1596353;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesName === 'Live Video Residual') {
            return `
              <div style="font-weight:bold; color:#fbbf24; margin-bottom:2px;">🎯 LIVE VIDEO RESIDUAL</div>
              Fitted Value: <strong>${formatCompactNumber(params.value[0])}</strong><br/>
              Residual: <span style="color:#00f2fe; font-weight:bold;">${params.value[1] >= 0 ? '+' : ''}${formatCompactNumber(params.value[1])} views</span>
            `;
          }
          return `
            <div style="font-weight:bold; margin-bottom:2px; color:#94a3b8;">Sample Residual</div>
            Fitted Views: <strong>${formatCompactNumber(params.value[0])}</strong><br/>
            Residual (Actual - Fitted): <span style="color:#38bdf8; font-weight:bold;">${params.value[1] >= 0 ? '+' : ''}${formatCompactNumber(params.value[1])}</span>
          `;
        },
      },
      legend: {
        data: ['Sample Residuals', 'Zero Error Baseline (e=0)', 'Live Video Residual'],
        textStyle: { color: '#94a3b8', fontSize: 12 },
        top: 6,
      },
      grid: { left: '4%', right: '5%', bottom: '12%', top: '15%', containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Fitted Views (Predicted)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
        axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
      },
      yAxis: {
        type: 'value',
        name: 'Residual (Actual - Predicted)',
        nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
        axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
      },
      series: [
        {
          name: 'Sample Residuals',
          type: 'scatter',
          symbolSize: 6,
          data: sampleResiduals,
          itemStyle: {
            color: 'rgba(56, 189, 248, 0.65)',
            borderColor: '#38bdf8',
            borderWidth: 0.7,
          },
        },
        {
          name: 'Zero Error Baseline (e=0)',
          type: 'line',
          data: [
            [0, 0],
            [15000000, 0],
          ],
          showSymbol: false,
          itemStyle: { color: '#94a3b8' },
          lineStyle: { width: 2, type: 'dashed', color: '#94a3b8' },
          markLine: {
            silent: true,
            lineStyle: { color: 'rgba(239, 68, 68, 0.4)', type: 'dotted', width: 1.5 },
            data: [
              { yAxis: mae, name: '+1 MAE Band' },
              { yAxis: -mae, name: '-1 MAE Band' },
            ],
          },
        },
        {
          name: 'Live Video Residual',
          type: 'scatter',
          symbol: 'diamond',
          symbolSize: 18,
          data: [liveResidual],
          itemStyle: {
            color: '#fbbf24',
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowBlur: 16,
            shadowColor: 'rgba(251, 191, 36, 0.9)',
          },
          z: 10,
        },
      ],
    };
  }, [activeModel, urlAnalysis, predictedViews, likes]);

  // Chart 3: Cumulative Time Horizon Growth Trajectory (Days, Weeks, Months, Year)
  const growthCurvePlotOption = useMemo(() => {
    const data = temporalForecast.curvePoints;
    const days = data.map((d) => `Day ${d.day}`);
    const views = data.map((d) => d.views);
    const upper = data.map((d) => d.upper);
    const lower = data.map((d) => d.lower);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params: any) => {
          const dayParam = params[0];
          const curr = dayParam?.data;
          const pt = data[dayParam?.dataIndex || 0];
          return `
            <div style="font-weight:bold; color:#00f2fe; margin-bottom:4px;">
              📅 Day ${pt.day} Forecast
            </div>
            Cumulative Views: <strong>${formatIndianNumber(curr)}</strong><br/>
            Upper Bound (+1 MAE): <span style="color:#94a3b8;">${formatCompactNumber(pt.upper)}</span><br/>
            Lower Bound (-1 MAE): <span style="color:#94a3b8;">${formatCompactNumber(pt.lower)}</span>
          `;
        },
      },
      legend: {
        data: ['Projected Growth Trajectory', 'Upper MAE Boundary', 'Lower MAE Boundary'],
        textStyle: { color: '#94a3b8', fontSize: 12 },
        top: 6,
      },
      grid: { left: '4%', right: '5%', bottom: '12%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: 'Projected Views',
        nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
        axisLabel: { color: '#94a3b8', formatter: (val: number) => formatCompactNumber(val) },
      },
      series: [
        {
          name: 'Projected Growth Trajectory',
          type: 'line',
          smooth: true,
          data: views,
          symbolSize: 8,
          itemStyle: { color: '#00f2fe' },
          lineStyle: { width: 3.5, color: '#00f2fe' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 242, 254, 0.40)' },
                { offset: 1, color: 'rgba(0, 242, 254, 0.02)' },
              ],
            },
          },
        },
        {
          name: 'Upper MAE Boundary',
          type: 'line',
          smooth: true,
          data: upper,
          showSymbol: false,
          lineStyle: { width: 1.5, type: 'dashed', color: 'rgba(16, 185, 129, 0.5)' },
        },
        {
          name: 'Lower MAE Boundary',
          type: 'line',
          smooth: true,
          data: lower,
          showSymbol: false,
          lineStyle: { width: 1.5, type: 'dashed', color: 'rgba(239, 68, 68, 0.5)' },
        },
      ],
    };
  }, [temporalForecast]);

  const meta = urlAnalysis?.metadata;
  const channel = urlAnalysis?.channel_analytics;
  const benchmark = urlAnalysis?.benchmark_comparison;

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
          Live YouTube Video URL Regression Inference & Channel Growth Projections
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          View Prediction Lab & Growth Forecaster
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Predict expected video reach using Ordinary Least Squares ($R^2 \approx 0.635$) on 251,277 trending Indian records.
          Paste any live YouTube URL to extract interaction signals, evaluate residuals, examine channel benchmarks, and forecast long-term growth across days, weeks, and years.
        </p>
      </div>

      {/* Quick Test Creator Preset Chips */}
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
            badge: 'Super-Linear Hit',
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
              handleFetchAndPredictUrl(item.url);
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

      {/* URL Fetcher & Model Selection Bar */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/15 p-6 shadow-2xl backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFetchAndPredictUrl();
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
                value={modelType}
                onChange={(e) => handleModelChange(e.target.value as any)}
                className="bg-slate-950/90 border border-white/20 rounded-xl text-xs text-white px-4 py-3.5 outline-none focus:border-rose-500 font-semibold transition-all h-full"
              >
                <option value="multiple">Multiple Linear (R² 63.5%)</option>
                <option value="simple">Simple Linear (R² 62.8%)</option>
              </select>

              <button
                type="submit"
                disabled={isLoadingUrl}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-rose-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer min-w-[170px]"
              >
                {isLoadingUrl ? (
                  <>
                    <BrainCircuit className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Fetch & Predict</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {urlError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{urlError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Video & Channel Analytical Performance Banner */}
      {meta && channel && benchmark && (
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
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <a
                  href={`https://www.youtube.com/watch?v=v7K4vGYL9ow`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-rose-600 text-[11px] text-white flex items-center gap-1.5 transition-colors border border-white/20"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Watch</span>
                </a>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  {meta.categoryName}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-2 leading-snug">
                  {meta.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="text-slate-200 font-semibold">{meta.channelTitle}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Actual Views</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {formatIndianNumber(meta.view_count)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Engagement Rate</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">
                    {meta.engagement_rate}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Likes</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    {formatIndianNumber(meta.likes)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Comments</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {formatIndianNumber(meta.comment_count)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Analytical Intelligence Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  Channel Intelligence
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {channel.tier_badge}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Authority Score</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {channel.authority_score}/100
                  </span>
                  <span className="text-[10px] text-slate-500 block">{channel.channel_tier}</span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Trending Videos</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {channel.appearances.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {channel.rank_appearances ? `Rank #${channel.rank_appearances}` : 'Cataloged'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Channel Avg Views</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {formatCompactNumber(channel.avg_views)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Historical benchmark</span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Popularity Rate</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {(channel.popularity_rate * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">&gt;947k views rate</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                <span className="text-cyan-400 font-bold block mb-0.5">Historical Track Record:</span>
                {channel.channel_verdict}
              </div>
            </div>
          </div>

          {/* Model Regression & Residual Verdict Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-rose-400" />
                  Actual vs OLS Regression
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    benchmark.performance_status === 'viral'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : benchmark.performance_status === 'lagging'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {benchmark.performance_status === 'viral'
                    ? '🚀 Viral Outperformer'
                    : benchmark.performance_status === 'lagging'
                    ? '⚠️ Lagging Engagement'
                    : '⚖️ Balanced Trajectory'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">Actual Views</span>
                  <span className="text-xl font-extrabold text-white font-mono block">
                    {formatCompactNumber(benchmark.actual_views)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {benchmark.actual_views.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">Model Fitted</span>
                  <span className="text-xl font-extrabold text-rose-400 font-mono block">
                    {formatCompactNumber(benchmark.predicted_views)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round(benchmark.predicted_views).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Linear Model Residual (e = Y - Ŷ):</span>
                  <span
                    className={`font-mono font-bold ${
                      benchmark.residual >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {benchmark.residual >= 0 ? '+' : ''}
                    {formatIndianNumber(benchmark.residual)} views
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Actual-to-Projected Velocity Ratio:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {benchmark.ratio_actual_to_predicted}x
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed border-t border-white/10 pt-2">
                {urlAnalysis.regression_verdict}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Temporal Reach Forecaster (Days, Weeks, Months, Year) */}
      <ChartCard
        title="Temporal Reach Forecaster & Long-Term Growth Horizons"
        subtitle="Empirical logarithmic decay projection calibrated on 251k Indian trending records"
        badge="Days • Weeks • Months • 1 Year"
      >
        <div className="space-y-6">
          {/* Quick Horizon Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Select Horizon:
              </span>
              {[
                { label: '7 Days (1 Week)', days: 7, val: temporalForecast.preset7 },
                { label: '30 Days (1 Month)', days: 30, val: temporalForecast.preset30 },
                { label: '90 Days (Quarter)', days: 90, val: temporalForecast.preset90 },
                { label: '365 Days (1 Year)', days: 365, val: temporalForecast.preset365 },
              ].map((h) => (
                <button
                  key={h.days}
                  type="button"
                  onClick={() => setHorizonDays(h.days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    horizonDays === h.days
                      ? 'bg-cyan-500 text-slate-950 shadow-glow font-bold'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-cyan-300">
              Active Forecast: <strong>Day {horizonDays}</strong>
            </div>
          </div>

          {/* Interactive Horizon Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Continuous Horizon Slider (1 to 365 Days):
              </span>
              <span className="text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                +{horizonDays} Days Ahead
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={365}
              step={1}
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Day 1 (Immediate)</span>
              <span>Day 30 (1 Mo)</span>
              <span>Day 90 (3 Mos)</span>
              <span>Day 180 (6 Mos)</span>
              <span>Day 365 (1 Year)</span>
            </div>
          </div>

          {/* Horizon Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Projected Day {horizonDays} Reach
              </span>
              <div className="text-2xl font-black text-cyan-300 font-mono">
                <CountUpNumber end={temporalForecast.currentHorizonViews} duration={1.0} />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                ≈ {formatCompactNumber(temporalForecast.currentHorizonViews)} views
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Cumulative Multiplier
              </span>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {temporalForecast.multiplier.toFixed(2)}x
              </div>
              <span className="text-xs text-emerald-400 font-mono">
                +{((temporalForecast.multiplier - 1) * 100).toFixed(0)}% expansion
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Net Gained Views
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                +{formatCompactNumber(temporalForecast.netGained)}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                +{temporalForecast.netGained.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Estimated Velocity
              </span>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {formatCompactNumber(temporalForecast.dailyVelocity)}/d
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Avg organic daily inflow
              </span>
            </div>
          </div>

          {/* Growth Trajectory Curve Chart */}
          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/10">
            <EChart option={growthCurvePlotOption} style={{ height: '340px', width: '100%' }} />
          </div>
        </div>
      </ChartCard>

      {/* Model Selection & Equation Breakdown Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl glass-panel">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <button
            onClick={() => handleModelChange('multiple')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              modelType === 'multiple'
                ? 'bg-primary text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Multiple Linear (Likes + Dislikes + Comments)
          </button>
          <button
            onClick={() => handleModelChange('simple')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              modelType === 'simple'
                ? 'bg-primary text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Simple Linear (Likes → Views)
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono px-2">
          <span>R² Score: </span>
          <span className="text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
            {modelType === 'simple' ? '0.628 (62.8%)' : '0.635 (63.5%)'}
          </span>
        </div>
      </div>

      {/* Mathematical Regression Formulation Card */}
      <ChartCard
        title="Explicit Mathematical Formulation & Feature Weights"
        subtitle="Ordinary Least Squares (OLS) closed-form regression hyperplane"
        badge={modelType === 'multiple' ? '3 Predictors' : '1 Predictor'}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/15 font-mono text-xs sm:text-sm text-cyan-300 leading-relaxed overflow-x-auto shadow-inner">
            {modelType === 'multiple' ? (
              <div>
                <span className="text-slate-400 block mb-1">
                  Multiple Linear Equation (Trained on 200,942 Indian records):
                </span>
                <span className="text-white font-bold">Predicted Views</span> ={' '}
                <span className="text-amber-400">768,064.66</span> + (
                <span className="text-cyan-400 font-bold">14.9018</span> × Likes) + (
                <span className="text-rose-400 font-bold">6.1333</span> × Dislikes) - (
                <span className="text-purple-400 font-bold">6.7879</span> × Comments)
              </div>
            ) : (
              <div>
                <span className="text-slate-400 block mb-1">
                  Simple Univariate Linear Equation:
                </span>
                <span className="text-white font-bold">Predicted Views</span> ={' '}
                <span className="text-amber-400">821,898.51</span> + (
                <span className="text-cyan-400 font-bold">14.2144</span> × Likes)
              </div>
            )}
          </div>

          {/* Feature Contribution Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">Baseline Intercept (β₀)</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                +{formatCompactNumber(mathBreakdown.intercept)}
              </span>
              <span className="text-[10px] text-slate-500 block">Baseline trending floor</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">Likes Contribution (β₁·X₁)</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">
                +{formatCompactNumber(mathBreakdown.likesContr)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {likes.toLocaleString()} likes × {mathBreakdown.bLikes.toFixed(2)}
              </span>
            </div>

            {modelType === 'multiple' && (
              <>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">
                    Dislikes Contribution (β₂·X₂)
                  </span>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    +{formatCompactNumber(mathBreakdown.dislikesContr)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {dislikes.toLocaleString()} dislikes × +6.13
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">
                    Comments Contribution (β₃·X₃)
                  </span>
                  <span className="text-sm font-bold text-purple-400 font-mono">
                    {formatCompactNumber(mathBreakdown.commentsContr)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {comments.toLocaleString()} comments × -6.79
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </ChartCard>

      {/* Interactive Predictor & Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction Form & Sliders */}
        <ChartCard
          title="What-If Simulator & Manual Controls"
          subtitle="Adjust engagement parameters to simulate custom view outcomes"
          badge={isModifiedFromFetched ? 'Simulated Values' : 'Synced to Video'}
          className="lg:col-span-1"
        >
          <form onSubmit={handleManualPredict} className="space-y-5">
            {isModifiedFromFetched && (
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
                <span>Values modified from fetched video</span>
                <button
                  type="button"
                  onClick={() => {
                    if (urlAnalysis) {
                      setLikes(urlAnalysis.metadata.likes);
                      setDislikes(urlAnalysis.metadata.dislikes);
                      setComments(urlAnalysis.metadata.comment_count);
                      setIsModifiedFromFetched(false);
                      setPredictedViews(urlAnalysis.prediction.predicted_views);
                    }
                  }}
                  className="hover:underline font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            )}

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
                max={5000000}
                step={10000}
                value={likes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLikes(val);
                  setIsModifiedFromFetched(true);
                }}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>2.5M</span>
                <span>5M</span>
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
                  max={250000}
                  step={1000}
                  value={dislikes}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDislikes(val);
                    setIsModifiedFromFetched(true);
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0</span>
                  <span>125K</span>
                  <span>250K</span>
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
                  max={500000}
                  step={2000}
                  value={comments}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setComments(val);
                    setIsModifiedFromFetched(true);
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0</span>
                  <span>250K</span>
                  <span>500K</span>
                </div>
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

            {/* Live Prediction Output Card */}
            {predictedViews !== null ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-950 border-2 border-red-500/40 text-center space-y-2 shadow-2xl relative overflow-hidden"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 animate-spin" />
                  <span>Model Inferred Reach</span>
                </div>
                <div className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight font-mono">
                  <CountUpNumber end={predictedViews} duration={1.2} />
                </div>
                <p className="text-sm font-semibold text-red-300">
                  ≈ {formatCompactNumber(predictedViews)} Projected Views
                </p>
                <div className="pt-2 border-t border-white/10 flex justify-around text-[11px] text-slate-400 font-mono">
                  <span>Likes: {formatCompactNumber(likes)}</span>
                  {modelType === 'multiple' && (
                    <span>• Comments: {formatCompactNumber(comments)}</span>
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

        {/* Diagnostic Plots: Regression Fit vs Residual Analysis */}
        <ChartCard
          title={
            diagnosticTab === 'fit'
              ? 'Fitted Regression Hyperplane & Live Video Marker'
              : 'Residual Diagnostics (Actual - Predicted vs Fitted)'
          }
          subtitle={
            diagnosticTab === 'fit'
              ? 'Plotting test observations, linear regression fit, and highlighted live video marker'
              : 'Testing homoscedasticity and variance expansion across view tiers'
          }
          badge={`R² = ${modelType === 'simple' ? '0.628' : '0.635'}`}
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            {/* Diagnostic Mode Switcher */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] w-fit">
              <button
                type="button"
                onClick={() => setDiagnosticTab('fit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  diagnosticTab === 'fit'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Regression Fit & Live Marker
              </button>
              <button
                type="button"
                onClick={() => setDiagnosticTab('residuals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  diagnosticTab === 'residuals'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Residuals Diagnostic Plot
              </button>
            </div>

            {isMetricsLoading ? (
              <Skeleton className="h-80" />
            ) : diagnosticTab === 'fit' ? (
              <EChart option={regressionFitPlotOption} style={{ height: '380px', width: '100%' }} />
            ) : (
              <div>
                <EChart option={residualPlotOption} style={{ height: '340px', width: '100%' }} />
                <div className="mt-2 p-3 rounded-xl bg-slate-950/70 border border-white/10 text-[11px] text-slate-400 leading-relaxed">
                  <span className="text-cyan-400 font-bold block mb-1">
                    📊 Heteroscedasticity Diagnostic:
                  </span>
                  Notice how residual dispersion fans out as fitted views exceed 5 million. This reflects
                  the exponential "winner-take-all" nature of YouTube virality, where mega-hits depart from purely
                  linear interaction ratios.
                </div>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Model Performance Comparison Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartCard
            title="Coefficient of Determination (R²)"
            subtitle="Variance in views explained by interaction volume"
          >
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Simple Linear (Likes):</span>
                  <span className="font-mono text-white font-bold">
                    {(metrics.simple.r2 * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${metrics.simple.r2 * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Multiple Linear (Likes + Dislikes + Comments):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {(metrics.multiple.r2 * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${metrics.multiple.r2 * 100}%` }} />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                Adding dislikes and comments improves $R^2$ by merely <strong className="text-white">+0.6%</strong>, confirming that likes capture almost all predictive power.
              </p>
            </div>
          </ChartCard>

          <ChartCard
            title="Mean Absolute Error (MAE)"
            subtitle="Average deviation on held-out test records"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center text-xs">
                <span className="text-slate-400">Simple Linear:</span>
                <span className="text-white font-mono font-bold">
                  {formatCompactNumber(metrics.simple.mae)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center text-xs">
                <span className="text-slate-400">Multiple Linear:</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {formatCompactNumber(metrics.multiple.mae)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                MAE is ~1.60 million views, driven by high variance in the multi-million view viral tail.
              </p>
            </div>
          </ChartCard>

          <ChartCard
            title="Root Mean Squared Error (RMSE)"
            subtitle="Penalizes large error outliers quadratically"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center text-xs">
                <span className="text-slate-400">Simple Linear:</span>
                <span className="text-white font-mono font-bold">
                  {formatCompactNumber(metrics.simple.rmse)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center text-xs">
                <span className="text-slate-400">Multiple Linear:</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {formatCompactNumber(metrics.multiple.rmse)}
                </span>
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
