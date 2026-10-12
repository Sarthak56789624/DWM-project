import { useQuery } from '@tanstack/react-query';
import {
  CategoryItem,
  ChannelAvgViews,
  ChannelCount,
  ClassificationMetricsResponse,
  ClassificationPredictResponse,
  ClusteringAssignResponse,
  ClusteringSummaryResponse,
  CorrelationResponse,
  DistributionResponse,
  EngagementResponse,
  HealthResponse,
  MetaResponse,
  OverviewResponse,
  RegressionMetricsResponse,
  RegressionPredictResponse,
  ScatterResponse,
  TimeSeriesResponse,
  TopVideoItem,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const err = await res.json();
      if (err.error?.message) errMessage = err.error.message;
    } catch {}
    throw new Error(errMessage);
  }
  return res.json();
}

// ----------------- Hooks -----------------

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: () => fetchJson<HealthResponse>('/health'),
    refetchInterval: 15000,
  });
}

export function useMeta() {
  return useQuery<MetaResponse>({
    queryKey: ['meta'],
    queryFn: () => fetchJson<MetaResponse>('/meta'),
    staleTime: 600000,
  });
}

export function useOverview() {
  return useQuery<OverviewResponse>({
    queryKey: ['overview'],
    queryFn: () => fetchJson<OverviewResponse>('/overview'),
    staleTime: 300000,
  });
}

export function useDistribution(metric: string, bins: number = 30, log: boolean = false) {
  return useQuery<DistributionResponse>({
    queryKey: ['distribution', metric, bins, log],
    queryFn: () => fetchJson<DistributionResponse>(`/distributions?metric=${metric}&bins=${bins}&log=${log}`),
    staleTime: 300000,
  });
}

export function useTopChannels(limit: number = 10) {
  return useQuery<ChannelCount[]>({
    queryKey: ['topChannels', limit],
    queryFn: () => fetchJson<ChannelCount[]>(`/channels/top?limit=${limit}`),
    staleTime: 300000,
  });
}

export function useChannelAvgViews(limit: number = 10) {
  return useQuery<ChannelAvgViews[]>({
    queryKey: ['channelAvgViews', limit],
    queryFn: () => fetchJson<ChannelAvgViews[]>(`/channels/avg-views?limit=${limit}`),
    staleTime: 300000,
  });
}

export function useCategories() {
  return useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => fetchJson<CategoryItem[]>('/categories'),
    staleTime: 300000,
  });
}

export function useCorrelation() {
  return useQuery<CorrelationResponse>({
    queryKey: ['correlation'],
    queryFn: () => fetchJson<CorrelationResponse>('/correlation'),
    staleTime: 300000,
  });
}

export function useScatter(x: string, y: string, sample: number = 2500) {
  return useQuery<ScatterResponse>({
    queryKey: ['scatter', x, y, sample],
    queryFn: () => fetchJson<ScatterResponse>(`/scatter?x=${x}&y=${y}&sample=${sample}`),
    staleTime: 300000,
  });
}

export function useTimeSeries(granularity: string = 'day') {
  return useQuery<TimeSeriesResponse>({
    queryKey: ['timeseries', granularity],
    queryFn: () => fetchJson<TimeSeriesResponse>(`/timeseries/daily?granularity=${granularity}`),
    staleTime: 300000,
  });
}

export function useTopVideos(limit: number = 10) {
  return useQuery<TopVideoItem[]>({
    queryKey: ['topVideos', limit],
    queryFn: () => fetchJson<TopVideoItem[]>(`/videos/top?limit=${limit}`),
    staleTime: 300000,
  });
}

export function useEngagement() {
  return useQuery<EngagementResponse>({
    queryKey: ['engagement'],
    queryFn: () => fetchJson<EngagementResponse>('/engagement'),
    staleTime: 300000,
  });
}

export function useRegressionMetrics() {
  return useQuery<RegressionMetricsResponse>({
    queryKey: ['regressionMetrics'],
    queryFn: () => fetchJson<RegressionMetricsResponse>('/regression/metrics'),
    staleTime: 600000,
  });
}

export async function predictRegression(params: {
  likes: number;
  dislikes: number;
  comment_count: number;
  model: 'simple' | 'multiple';
}): Promise<RegressionPredictResponse> {
  return fetchJson<RegressionPredictResponse>('/regression/predict', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function useClassificationMetrics() {
  return useQuery<ClassificationMetricsResponse>({
    queryKey: ['classificationMetrics'],
    queryFn: () => fetchJson<ClassificationMetricsResponse>('/classification/metrics'),
    staleTime: 600000,
  });
}

export async function predictClassification(params: {
  likes: number;
  dislikes: number;
  comment_count: number;
  categoryId: number;
  model: 'decision_tree' | 'naive_bayes';
}): Promise<ClassificationPredictResponse> {
  return fetchJson<ClassificationPredictResponse>('/classification/predict', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function useClusteringSummary() {
  return useQuery<ClusteringSummaryResponse>({
    queryKey: ['clusteringSummary'],
    queryFn: () => fetchJson<ClusteringSummaryResponse>('/clustering/summary'),
    staleTime: 600000,
  });
}

export async function assignCluster(params: {
  view_count: number;
  likes: number;
  dislikes: number;
  comment_count: number;
  log_transform: boolean;
}): Promise<ClusteringAssignResponse> {
  return fetchJson<ClusteringAssignResponse>('/clustering/assign', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ----------------- Association Rule Mining Hooks -----------------

export function useAssociationRules(params: {
  min_support?: number;
  min_confidence?: number;
  min_lift?: number;
  category_id?: number | null;
  search?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.min_support !== undefined) query.set('min_support', String(params.min_support));
  if (params.min_confidence !== undefined) query.set('min_confidence', String(params.min_confidence));
  if (params.min_lift !== undefined) query.set('min_lift', String(params.min_lift));
  if (params.category_id !== undefined && params.category_id !== null) query.set('category_id', String(params.category_id));
  if (params.search) query.set('search', params.search);
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  return useQuery<import('../types/api').AssociationRulesResponse>({
    queryKey: ['associationRules', params],
    queryFn: () => fetchJson(`/mining/rules?${query.toString()}`),
    staleTime: 300000,
  });
}

export function useTagGraph(limit = 60) {
  return useQuery<import('../types/api').TagGraphResponse>({
    queryKey: ['tagGraph', limit],
    queryFn: () => fetchJson(`/mining/graph?limit=${limit}`),
    staleTime: 300000,
  });
}

export function useMiningCategories() {
  return useQuery<import('../types/api').MiningCategory[]>({
    queryKey: ['miningCategories'],
    queryFn: () => fetchJson('/mining/categories'),
    staleTime: 600000,
  });
}

// ----------------- Creator Simulator Hooks -----------------

export async function simulateCreatorVideo(
  params: import('../types/api').CreatorSimulateRequest
): Promise<import('../types/api').CreatorSimulateResponse> {
  return fetchJson<import('../types/api').CreatorSimulateResponse>('/creator/simulate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function useCategoryTiming(categoryId: number) {
  return useQuery<import('../types/api').CategoryTimingResponse>({
    queryKey: ['categoryTiming', categoryId],
    queryFn: () => fetchJson(`/creator/timing/${categoryId}`),
    staleTime: 600000,
  });
}

// ----------------- Live YouTube Analyzer Hooks -----------------

export function useLiveYoutubeSamples() {
  return useQuery<import('../types/api').LiveYoutubeSample[]>({
    queryKey: ['youtubeSamples'],
    queryFn: () => fetchJson('/youtube/samples'),
    staleTime: 600000,
  });
}

export async function analyzeLiveYoutube(params: {
  url: string;
  categoryId?: number;
}): Promise<import('../types/api').LiveYoutubeAnalyzeResponse> {
  return fetchJson<import('../types/api').LiveYoutubeAnalyzeResponse>('/youtube/analyze', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ----------------- Executive Report Hook -----------------

export function useExecutiveReport() {
  return useQuery<import('../types/api').ExecutiveReportResponse>({
    queryKey: ['executiveReport'],
    queryFn: () => fetchJson('/report/summary'),
    staleTime: 600000,
  });
}
