import React, { useState } from 'react';
import {
  Search,
  Activity,
  Sun,
  Moon,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useHealth } from '../lib/api';
import { TabId } from './Sidebar';

interface NavbarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const tabTitles: Record<TabId, string> = {
  overview: 'Executive Dataset Overview',
  distributions: 'Metrics Distributions & Box-Plots',
  channels: 'Channels & Category Domination',
  relationships: 'Feature Correlations & Scatter Plotter',
  trends: 'Time-Series & Volume Progression',
  videos: 'Top 10 Hall-of-Fame & Engagement',
  regression: 'Interactive Regression Lab',
  classifier: 'Popularity Classifier Studio',
  clustering: 'Behavioral Cluster Explorer',
  mining: 'Tag Association Rule Mining (DWM)',
  creator: 'Virality Simulator & Timing Heatmap',
  live: 'Live Video URL Analyzer',
  report: 'Executive Audit & Research Report',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  onToggleTheme,
}) => {
  const { data: health, isLoading: healthLoading } = useHealth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchItems = [
    { label: 'Overview & KPIs', tab: 'overview' as TabId, keywords: 'summary rows dataset stats' },
    { label: 'Views & Likes Distributions', tab: 'distributions' as TabId, keywords: 'skew log scale histogram boxplot' },
    { label: 'Top Channels & Categories', tab: 'channels' as TabId, keywords: 'vijay television sony sab entertainment music' },
    { label: 'Correlation Heatmap', tab: 'relationships' as TabId, keywords: 'pearson heatmap scatter zoom' },
    { label: 'Time Trends & Seasonality', tab: 'trends' as TabId, keywords: 'daily monthly temporal date' },
    { label: 'Top 10 Most Viewed Videos', tab: 'videos' as TabId, keywords: 'leaderboard engagement disabled comments' },
    { label: 'Regression Lab (Views Predictor)', tab: 'regression' as TabId, keywords: 'linear regression mae rmse r2' },
    { label: 'Popularity Classifier (DT & NB)', tab: 'classifier' as TabId, keywords: 'decision tree naive bayes accuracy popular' },
    { label: 'Clustering Explorer (K-Means)', tab: 'clustering' as TabId, keywords: 'kmeans pca elbow silhouette clusters' },
    { label: 'Tag Association Mining (Apriori)', tab: 'mining' as TabId, keywords: 'apriori tags lift support confidence network' },
    { label: 'Creator Virality Simulator', tab: 'creator' as TabId, keywords: 'virality predict simulate publish timing heatmap' },
    { label: 'Live Video Analyzer', tab: 'live' as TabId, keywords: 'live youtube url paste real-time benchmark' },
    { label: 'Executive DWM Audit Report', tab: 'report' as TabId, keywords: 'pdf report export audit download summary' },
  ];

  const filteredItems = searchItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-30 h-20 w-full border-b border-white/[0.08] bg-[#090a10]/85 backdrop-blur-xl px-6 flex items-center justify-between">
      {/* Active Tab Heading */}
      <div>
        <h1 className="font-display font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
          {tabTitles[currentTab]}
          <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
            India Trending
          </span>
        </h1>
        <p className="text-xs text-slate-400 hidden sm:block">
          DWM Mining Studio • 251,277 Records • In-Memory Parquet Engine
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Global Quick Jump Search */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-xs text-slate-300 focus-within:border-primary focus-within:bg-white/[0.08] transition-all">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Jump to section... (⌘K)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-36 sm:w-48"
            />
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-2xl p-2 z-50">
              <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">
                Sections & Analytics
              </div>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => {
                      onSelectTab(item.tab);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs text-left text-slate-200 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <span>{item.label}</span>
                    <Sparkles className="h-3.5 w-3.5 text-primary opacity-60" />
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500">
                  No matching section
                </div>
              )}
            </div>
          )}
        </div>

        {/* API Health Live Dot */}
        <div
          className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-xs text-slate-300"
          title="Backend FastAPI Health Status"
        >
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            {health?.status === 'healthy' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </>
            ) : healthLoading ? (
              <span className="inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse" />
            ) : (
              <span className="inline-flex rounded-full h-2 w-2 bg-rose-500" />
            )}
          </div>
          <span className="hidden md:inline font-mono text-[11px] text-slate-400">
            {healthLoading ? 'Connecting...' : health?.status === 'healthy' ? 'API Online' : 'API Degraded'}
          </span>
        </div>

        {/* FastAPI Docs Link */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden lg:flex items-center gap-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1.5 text-xs text-slate-300 transition-colors"
          title="Open FastAPI Swagger Interactive Documentation"
        >
          <span>Swagger</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </a>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
};
