import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import {
  Share2,
  Sliders,
  Search,
  Filter,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import { useAssociationRules, useTagGraph, useMiningCategories } from '../lib/api';

export const AssociationMiningPage: React.FC = () => {
  const [minSupport, setMinSupport] = useState<number>(0.002);
  const [minConfidence, setMinConfidence] = useState<number>(0.25);
  const [minLift, setMinLift] = useState<number>(1.5);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [graphLimit, setGraphLimit] = useState<number>(60);

  const { data: rulesData, isLoading: isLoadingRules } = useAssociationRules({
    min_support: minSupport,
    min_confidence: minConfidence,
    min_lift: minLift,
    category_id: selectedCategory,
    search: searchQuery,
    limit: 60,
  });

  const { data: graphData, isLoading: isLoadingGraph } = useTagGraph(graphLimit);
  const { data: categories } = useMiningCategories();

  // Network Graph ECharts Options
  const graphOption = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `<div class="p-2 font-sans">
            <strong class="text-sm font-semibold text-white">${params.data.name}</strong><br/>
            <span class="text-xs text-gray-400">Total Appearances: ${params.data.count?.toLocaleString() || 'N/A'}</span>
          </div>`;
        }
        if (params.dataType === 'edge') {
          return `<div class="p-2 font-sans">
            <div class="text-xs text-gray-300">
              <span class="font-semibold text-rose-400">${params.data.source}</span> &rarr;
              <span class="font-semibold text-emerald-400">${params.data.target}</span>
            </div>
            <div class="mt-1 text-xs text-gray-400">
              Lift: <strong class="text-white">${params.data.lift}x</strong> |
              Confidence: <strong class="text-white">${Math.round(params.data.confidence * 100)}%</strong>
            </div>
          </div>`;
        }
        return '';
      },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      borderWidth: 1,
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        animation: true,
        roam: true,
        draggable: true,
        data: (graphData?.nodes || []).map((node) => ({
          id: node.id,
          name: node.name,
          symbolSize: Math.max(16, Math.min(48, node.symbolSize)),
          count: node.count,
          itemStyle: {
            color: '#6366f1',
            borderColor: '#a5b4fc',
            borderWidth: 1.5,
            shadowBlur: 8,
            shadowColor: 'rgba(99, 102, 241, 0.4)',
          },
          label: {
            show: true,
            position: 'right',
            color: '#cbd5e1',
            fontSize: 11,
          },
        })),
        links: (graphData?.links || []).map((link) => ({
          source: link.source,
          target: link.target,
          lift: link.lift,
          confidence: link.confidence,
          lineStyle: {
            color: link.lift > 5 ? '#f43f5e' : link.lift > 3 ? '#fbbf24' : '#64748b',
            width: Math.min(4, Math.max(1, link.weight * 150)),
            curveness: 0.15,
            opacity: 0.65,
          },
        })),
        force: {
          repulsion: 180,
          gravity: 0.1,
          edgeLength: [60, 140],
          friction: 0.6,
        },
      },
    ],
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
            <Share2 className="w-3.5 h-3.5" />
            Data Warehousing & Mining (DWM)
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Tag Association Rule Mining
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Frequent itemset mining and association analysis (Apriori / FP-Growth) on 64,768 unique multi-tag video transactions.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Mined Rule Candidates</div>
            <div className="text-xl font-bold text-white">
              {rulesData?.total_mined_pool?.toLocaleString() || '19,555'}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-5 pb-3 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-rose-400" />
          Mining Parameters & Quality Thresholds
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Min Support */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Min Support (P(A ∩ B))</span>
              <span className="font-mono text-rose-400 font-semibold">{(minSupport * 100).toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.02"
              step="0.001"
              value={minSupport}
              onChange={(e) => setMinSupport(parseFloat(e.target.value))}
              className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <p className="text-[11px] text-slate-500">Minimum co-occurrence threshold</p>
          </div>

          {/* Min Confidence */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Min Confidence (P(B|A))</span>
              <span className="font-mono text-indigo-400 font-semibold">{Math.round(minConfidence * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <p className="text-[11px] text-slate-500">Likelihood of B given A</p>
          </div>

          {/* Min Lift */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Min Lift (Correlation Factor)</span>
              <span className="font-mono text-emerald-400 font-semibold">{minLift.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={minLift}
              onChange={(e) => setMinLift(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <p className="text-[11px] text-slate-500">Lift &gt; 1 indicates positive association</p>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Category Partition</span>
              <span className="text-slate-300 font-medium">{selectedCategory ? `Cat ID ${selectedCategory}` : 'All Categories'}</span>
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-slate-800/80 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Categories (General Indian YouTube)</option>
              {categories?.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.category_name} ({c.rules_count} rules)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">Filter rules by specific vertical</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tag (e.g. trailer, bollywood, funny, pubg, sourav joshi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Network Graph Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Interactive Co-Occurrence Network Graph
            </h2>
            <p className="text-xs text-slate-400">
              Drag nodes to inspect force-directed tag clusters. Node size indicates frequency; line color indicates Lift intensity.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Graph Edges:</span>
            <select
              value={graphLimit}
              onChange={(e) => setGraphLimit(parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs"
            >
              <option value={30}>30 Edges (Minimal)</option>
              <option value={60}>60 Edges (Standard)</option>
              <option value={100}>100 Edges (Dense)</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded-full" />
            <span>High Lift (&gt; 5.0x)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-400 rounded-full" />
            <span>Moderate Lift (&gt; 3.0x)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-slate-500 rounded-full" />
            <span>Standard Lift (&gt; 1.5x)</span>
          </div>
        </div>

        <div className="w-full h-[460px] rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-hidden">
          {isLoadingGraph ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">
              Generating Force-Directed Tag Graph...
            </div>
          ) : (
            <ReactECharts option={graphOption} style={{ height: '100%', width: '100%' }} />
          )}
        </div>
      </div>

      {/* Discovered Rules Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Discovered Association Rules
            </h2>
            <p className="text-xs text-slate-400">
              Showing {rulesData?.rules?.length || 0} active rules matching your confidence and support criteria.
            </p>
          </div>
        </div>

        {isLoadingRules ? (
          <div className="text-center py-12 text-sm text-slate-500">Loading association rules...</div>
        ) : rulesData?.rules && rulesData.rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Antecedent (IF)</th>
                  <th className="py-3 px-2 text-center">&rarr;</th>
                  <th className="py-3 px-4">Consequent (THEN)</th>
                  <th className="py-3 px-4 text-right">Support</th>
                  <th className="py-3 px-4 text-right">Confidence</th>
                  <th className="py-3 px-4 text-right">Lift</th>
                  <th className="py-3 px-4 text-right">Transaction Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {rulesData.rules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium">
                        {rule.antecedent.join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-500">
                      <ArrowRight className="w-3.5 h-3.5 mx-auto text-slate-400" />
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                        {rule.consequent.join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {(rule.support * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-400 font-semibold">
                      {(rule.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          rule.lift > 5
                            ? 'bg-rose-500/20 text-rose-400'
                            : rule.lift > 3
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {rule.lift.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {rule.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <Info className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No association rules found with the selected thresholds.</p>
            <p className="text-xs text-slate-500 mt-1">Try lowering the minimum support or lift sliders.</p>
          </div>
        )}
      </div>
    </div>
  );
};
