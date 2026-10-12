import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  tooltipText?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  tooltipText,
  children,
  actions,
  className = '',
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`glass-panel rounded-2xl p-6 border border-white/[0.08] relative group ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-lg font-bold text-white tracking-wide">
              {title}
            </h3>
            {badge && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-red-300 border border-primary/30">
                {badge}
              </span>
            )}
            {tooltipText && (
              <div className="relative group/tooltip">
                <Info className="h-4 w-4 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 shadow-2xl z-50 pointer-events-none">
                  {tooltipText}
                </div>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      <div className="w-full relative">{children}</div>
    </motion.div>
  );
};
