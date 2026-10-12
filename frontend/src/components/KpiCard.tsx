import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { CountUpNumber } from './CountUpNumber';

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: string;
  colorScheme?: 'red' | 'cyan' | 'amber' | 'purple';
}

const colorMap = {
  red: {
    bg: 'from-rose-500/10 to-red-500/5',
    border: 'border-red-500/20 group-hover:border-red-500/50',
    iconBg: 'bg-red-500/10 text-red-400',
    glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(255,0,85,0.3)]',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-blue-500/5',
    border: 'border-cyan-500/20 group-hover:border-cyan-500/50',
    iconBg: 'bg-cyan-500/10 text-cyan-400',
    glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(0,242,254,0.3)]',
  },
  amber: {
    bg: 'from-amber-500/10 to-orange-500/5',
    border: 'border-amber-500/20 group-hover:border-amber-500/50',
    iconBg: 'bg-amber-500/10 text-amber-400',
    glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(246,211,101,0.3)]',
  },
  purple: {
    bg: 'from-purple-500/10 to-pink-500/5',
    border: 'border-purple-500/20 group-hover:border-purple-500/50',
    iconBg: 'bg-purple-500/10 text-purple-400',
    glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(157,80,187,0.3)]',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  subtitle,
  trend,
  colorScheme = 'red',
}) => {
  const c = colorMap[colorScheme];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${c.bg} ${c.border} ${c.glow} p-6 backdrop-blur-xl transition-all duration-300 shadow-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={`rounded-xl p-2.5 ${c.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <h3 className="font-display text-3xl font-extrabold tracking-tight text-white">
          <CountUpNumber
            end={value}
            decimals={decimals}
            duration={1.8}
            prefix={prefix}
            suffix={suffix}
          />
        </h3>
        {trend && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400/80 leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Ambient background blur flare */}
      <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-white/[0.02] blur-xl pointer-events-none" />
    </motion.div>
  );
};
