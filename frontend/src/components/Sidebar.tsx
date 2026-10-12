import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  Tv,
  Share2,
  TrendingUp,
  Award,
  LineChart,
  BrainCircuit,
  Network,
  Play,
  ChevronLeft,
  ChevronRight,
  Flame,
  Rocket,
  Video,
  FileText,
  Layers,
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'distributions'
  | 'channels'
  | 'relationships'
  | 'trends'
  | 'videos'
  | 'regression'
  | 'classifier'
  | 'clustering'
  | 'mining'
  | 'creator'
  | 'live'
  | 'report';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: TabId;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'distributions', label: 'Distributions', icon: BarChart3 },
  { id: 'channels', label: 'Channels & Categories', icon: Tv },
  { id: 'relationships', label: 'Relationships', icon: Share2 },
  { id: 'trends', label: 'Time Trends', icon: TrendingUp },
  { id: 'videos', label: 'Top Videos & Engagement', icon: Award },
  { id: 'regression', label: 'Regression Lab', badge: 'ML', icon: LineChart },
  { id: 'classifier', label: 'Popularity Classifier', badge: '82%', icon: BrainCircuit },
  { id: 'clustering', label: 'Cluster Explorer', badge: 'K=4', icon: Network },
  { id: 'mining', label: 'Tag Association Mining', badge: 'DWM', icon: Layers },
  { id: 'creator', label: 'Virality Simulator', badge: 'Tool', icon: Rocket },
  { id: 'live', label: 'Live Video Analyzer', badge: 'Live', icon: Video },
  { id: 'report', label: 'Executive Audit Report', badge: 'PDF', icon: FileText },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col border-r border-white/[0.08] bg-[#090a10]/95 backdrop-blur-2xl transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex items-center justify-center h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-glow">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            <div className="absolute -top-1 -right-1">
              <Flame className="h-3.5 w-3.5 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col truncate"
            >
              <span className="font-display font-extrabold text-base tracking-tight text-white leading-tight truncate">
                Trending India
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-red-400 truncate">
                Analytics Studio
              </span>
            </motion.div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5">
        <div className="px-3 pb-2">
          {!isCollapsed && (
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              Navigation
            </span>
          )}
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex items-center w-full rounded-xl transition-all duration-200 group ${
                isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3 gap-3.5'
              } ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {/* Active Layout Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeSidebarIndicator"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 via-red-500/10 to-transparent border-l-2 border-primary shadow-[inset_0_0_15px_rgba(255,0,85,0.15)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate text-sm text-left flex-1 relative z-10">
                  {item.label}
                </span>
              )}

              {!isCollapsed && item.badge && (
                <span
                  className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-white/[0.08] text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dataset Footprint Footer */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>IN Trending Data</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              251.2K
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Aug 2020 – Apr 2024 (India)
          </p>
        </div>
      )}
    </aside>
  );
};
