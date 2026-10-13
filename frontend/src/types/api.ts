export interface HealthResponse {
  status: string;
  uptime_seconds: number;
  data_loaded: boolean;
  total_rows: number;
}

export interface MetaResponse {
  app_name: string;
  version: string;
  dataset: string;
  date_range: { min: string; max: string };
  total_rows: number;
  models_available: string[];
  cache_info: { load_time_seconds: number; in_memory_rows: number };
}

export interface OverviewResponse {
  total_rows: number;
  total_columns: number;
  unique_videos: number;
  unique_channels: number;
  median_views: number;
  date_range: {
    min_trending_date: string;
    max_trending_date: string;
    min_published_date: string;
    max_published_date: string;
  };
  missing_values: Record<string, number>;
  numerical_summary: Record<string, {
    count: number;
    mean: number;
    std: number;
    min: number;
    '25%': number;
    '50%': number;
    '75%': number;
    max: number;
  }>;
  comments_disabled: { count: number; percentage: number };
  ratings_disabled: { count: number; percentage: number };
}

export interface DistributionResponse {
  metric: string;
  is_log: boolean;
  bins: number;
  bin_edges: number[];
  counts: number[];
  boxplot: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outlier_count: number;
  };
  summary: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
}

export interface ChannelCount {
  channel: string;
  trending_appearances: number;
}

export interface ChannelAvgViews {
  channel: string;
  avg_views: number;
}

export interface CategoryItem {
  categoryId: number;
  name: string;
  count: number;
  percentage: number;
}

export interface CorrelationResponse {
  columns: string[];
  matrix: number[][];
}

export interface ScatterPoint {
  x: number;
  y: number;
}

export interface ScatterResponse {
  x_metric: string;
  y_metric: string;
  sample_size: number;
  points: ScatterPoint[];
}

export interface TimeSeriesPoint {
  date: string;
  video_count: number;
  avg_view_count: number;
}

export interface TimeSeriesResponse {
  granularity: string;
  series: TimeSeriesPoint[];
}

export interface TopVideoItem {
  video_id: string;
  title: string;
  channel: string;
  view_count: number;
  likes: number;
  thumbnail_url: string;
}

export interface EngagementResponse {
  describe: Record<string, number>;
  histogram: {
    bin_edges: number[];
    counts: number[];
  };
  comments_status: { enabled: number; disabled: number };
  ratings_status: { enabled: number; disabled: number };
}

export interface RegressionMetricsResponse {
  simple: {
    features: string[];
    target: string;
    intercept: number;
    coefficients: Record<string, number>;
    mae: number;
    rmse: number;
    r2: number;
    plot_sample: Array<{ likes: number; actual_views: number; predicted_views: number }>;
  };
  multiple: {
    features: string[];
    target: string;
    intercept: number;
    coefficients: Record<string, number>;
    mae: number;
    rmse: number;
    r2: number;
    plot_sample: Array<{ likes: number; dislikes: number; comment_count: number; actual_views: number; predicted_views: number }>;
  };
}

export interface RegressionPredictResponse {
  model: string;
  predicted_views: number;
  inputs: {
    likes: number;
    dislikes: number;
    comment_count: number;
  };
}

export interface ClassificationTreeNode {
  name: string;
  feature?: string;
  threshold?: number;
  prediction?: string;
  samples: number;
  impurity: number;
  value: number[];
  children?: ClassificationTreeNode[];
}

export interface ClassificationMetricsResponse {
  decision_tree: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    confusion_matrix: number[][];
    classification_report: Record<string, any>;
    feature_importances: Record<string, number>;
    tree_structure: ClassificationTreeNode;
  };
  naive_bayes: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    confusion_matrix: number[][];
    classification_report: Record<string, any>;
  };
}

export interface ClassificationPredictResponse {
  model: string;
  predicted_class: 'Popular' | 'Not Popular';
  probabilities: Record<string, number>;
  inputs: {
    likes: number;
    dislikes: number;
    comment_count: number;
    categoryId: number;
  };
}

export interface ChannelAnalytics {
  channel_title: string;
  matched_channel: string | null;
  is_tracked: boolean;
  appearances: number;
  unique_videos: number;
  avg_views: number;
  median_views: number;
  avg_likes: number;
  avg_comments: number;
  avg_engagement_rate: number;
  popularity_rate: number;
  channel_tier: string;
  tier_badge: string;
  tier_color: string;
  authority_score: number;
  rank_appearances?: number | null;
  rank_avg_views?: number | null;
  dominant_category_id: number;
  dominant_category_name: string;
  video_views_ratio: number;
  video_engagement_ratio: number;
  video_engagement_rate: number;
  channel_verdict: string;
  category_benchmark: {
    categoryId: number;
    category_name: string;
    total_videos: number;
    avg_views: number;
    median_views: number;
    avg_likes: number;
    avg_comments: number;
    avg_engagement_rate: number;
    popularity_rate: number;
  };
}

export interface ClassificationUrlRequest {
  url: string;
  model?: 'decision_tree' | 'naive_bayes';
  categoryId?: number;
}

export interface ClassificationUrlResponse {
  metadata: {
    video_id: string;
    title: string;
    channelTitle: string;
    view_count: number;
    likes: number;
    dislikes: number;
    comment_count: number;
    categoryId: number;
    categoryName: string;
    thumbnail_url: string;
    engagement_rate: number;
  };
  channel_analytics: ChannelAnalytics;
  classification: {
    model: string;
    predicted_class: 'Popular' | 'Not Popular';
    probabilities: Record<string, number>;
    inputs: {
      likes: number;
      dislikes: number;
      comment_count: number;
      categoryId: number;
    };
    decision_tree: {
      predicted_class: 'Popular' | 'Not Popular';
      probabilities: Record<string, number>;
    };
    naive_bayes: {
      predicted_class: 'Popular' | 'Not Popular';
      probabilities: Record<string, number>;
    };
    analytical_verdict: string;
  };
  benchmark_comparison: {
    median_threshold: number;
    actual_views: number;
    exceeds_threshold: boolean;
    percentile_rank: number;
    virality_grade: string;
  };
}

export interface ClusterProfile {
  size: number;
  percentage: number;
  mean_views: number;
  mean_likes: number;
  mean_dislikes: number;
  mean_comments: number;
}

export interface PcaSamplePoint {
  pca_x: number;
  pca_y: number;
  cluster: number;
  view_count: number;
  likes: number;
  dislikes: number;
  comment_count: number;
}

export interface ClusteringSummaryResponse {
  standard: {
    k: number;
    elbow_inertia: Record<string, number>;
    silhouette_scores: Record<string, number>;
    cluster_sizes: Record<string, number>;
    profiles: Record<string, ClusterProfile>;
    pca_variance_ratio: number[];
    pca_sample_points: PcaSamplePoint[];
    note: string;
  };
  log_transformed: {
    k: number;
    profiles: Record<string, ClusterProfile>;
    pca_variance_ratio: number[];
    pca_sample_points: PcaSamplePoint[];
    note: string;
  };
}

export interface ClusteringAssignResponse {
  cluster_id: number;
  is_log_transformed: boolean;
  cluster_profile: ClusterProfile;
}

export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  count: number;
}

export interface AssociationRulesResponse {
  total_rules: number;
  total_mined_pool: number;
  total_transactions: number;
  rules: AssociationRule[];
}

export interface TagGraphNode {
  id: string;
  name: string;
  symbolSize: number;
  count: number;
}

export interface TagGraphLink {
  source: string;
  target: string;
  weight: number;
  lift: number;
  confidence: number;
}

export interface TagGraphResponse {
  nodes: TagGraphNode[];
  links: TagGraphLink[];
}

export interface MiningCategory {
  categoryId: number;
  category_name: string;
  rules_count: number;
  top_tags_count: number;
}

export interface CreatorSimulateRequest {
  title: string;
  categoryId: number;
  planned_day: string;
  planned_hour_ist: number;
  expected_likes: number;
  expected_dislikes: number;
  expected_comments: number;
  planned_tags?: string;
}

export interface CreatorSimulateResponse {
  virality_index: number;
  tier: string;
  tier_color: string;
  tier_description: string;
  predicted_metrics: {
    predicted_views: number;
    predicted_views_range: {
      low: number;
      mid: number;
      high: number;
    };
    popularity_classification: string;
    popularity_probability: number;
  };
  timing_insights: {
    selected_day: string;
    selected_hour_ist: number;
    timing_score: number;
    category_best_day: string;
    category_best_window: string;
    is_timing_optimal: boolean;
    timing_advice: string;
  };
  title_analysis: {
    title_score: number;
    character_count: number;
    uppercase_ratio: number;
    detected_keywords: string[];
    suggestions: string[];
  };
  tag_recommendations: {
    current_tags: string[];
    recommended_tags: string[];
  };
}

export interface CategoryTimingResponse {
  categoryId: number;
  category_name: string;
  total_videos: number;
  best_day: string;
  best_hour_ist: number;
  most_active_hour_ist: number;
  best_window: string;
  day_distribution: Array<{ day: string; video_count: number; median_views: number }>;
  hour_distribution: Array<{ hour: number; video_count: number; median_views: number }>;
  heatmap_grid: number[][];
  suggested_tags: string[];
}

export interface LiveYoutubeSample {
  id: string;
  video_id: string;
  title: string;
  channelTitle: string;
  view_count: number;
  likes: number;
  comment_count: number;
  dislikes: number;
  categoryId: number;
  categoryName: string;
  thumbnail_url: string;
}

export interface LiveYoutubeAnalyzeResponse {
  metadata: LiveYoutubeSample;
  benchmark_analysis: {
    percentile_rank: number;
    virality_grade: string;
    performance_verdict: string;
    performance_status: 'viral' | 'lagging' | 'normal';
    actual_views: number;
    model_predicted_views: number;
    ratio_actual_to_predicted: number;
  };
  classification: ClassificationPredictResponse;
  clustering: ClusteringAssignResponse;
}

export interface ExecutiveReportResponse {
  project_title: string;
  dataset_profile: {
    total_records: number;
    unique_videos: number;
    unique_channels: number;
    median_views: number;
    date_range: {
      min_trending_date: string;
      max_trending_date: string;
      min_published_date: string;
      max_published_date: string;
    };
    missing_values: Record<string, number>;
    comments_disabled_pct: number;
  };
  ml_evaluation: {
    simple_linear_regression: { r2: number; mae: number; rmse: number };
    multiple_linear_regression: { r2: number; mae: number; rmse: number };
    decision_tree: { accuracy: number; precision: number; recall: number; f1_score: number };
    gaussian_naive_bayes: { accuracy: number; precision: number; recall: number; f1_score: number };
    kmeans_clustering: {
      k_clusters: number;
      elbow_inertia: Record<string, number>;
      silhouette_scores: Record<string, number>;
      profiles: Record<string, ClusterProfile>;
    };
  };
  association_rule_mining: {
    total_transactions: number;
    mined_rules_count: number;
    top_rules: AssociationRule[];
  };
  key_insights: string[];
}
