import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

interface EChartProps {
  option: any;
  style?: React.CSSProperties;
  className?: string;
  onEvents?: Record<string, (params: any) => void>;
  theme?: 'dark' | 'light';
}

export const EChart: React.FC<EChartProps> = ({ option, style, className = '', onEvents, theme }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );

  // Track theme changes dynamically
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const activeTheme = theme || (isDark ? 'dark' : undefined);

  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose old instance on theme change to apply correct palette
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    chartInstance.current = echarts.init(chartRef.current, activeTheme);

    if (onEvents) {
      Object.entries(onEvents).forEach(([event, handler]) => {
        chartInstance.current?.off(event);
        chartInstance.current?.on(event, handler);
      });
    }

    if (option && Object.keys(option).length > 0) {
      const mergedOption = {
        backgroundColor: 'transparent',
        ...option,
      };
      chartInstance.current.setOption(mergedOption, true);
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [option, onEvents, activeTheme]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  return <div ref={chartRef} style={style} className={`w-full ${className}`} />;
};

export default EChart;
