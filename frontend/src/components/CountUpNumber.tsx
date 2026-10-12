import React, { useEffect, useState } from 'react';

export interface CountUpNumberProps {
  end: number;
  duration?: number;
  decimals?: number;
  separator?: string;
  prefix?: string;
  suffix?: string;
  useEasing?: boolean;
  formattingFn?: (val: number) => string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  end,
  duration = 1.5,
  decimals = 0,
  prefix = '',
  suffix = '',
  formattingFn,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animId: number;
    const startValue = 0;
    const durationMs = duration * 1000;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out expo curve
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (end - startValue) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [end, duration]);

  if (formattingFn) {
    return <>{formattingFn(displayValue)}</>;
  }

  const formatted =
    decimals > 0
      ? displayValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(displayValue).toLocaleString();

  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
};

export default CountUpNumber;
