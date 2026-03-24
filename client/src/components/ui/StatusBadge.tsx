import React from 'react';
import clsx from 'clsx';
import type { IndicatorStatus } from '../../types/indicators.js';

interface Props { status: IndicatorStatus; label?: string; }

const CONFIG: Record<IndicatorStatus, { dot: string; bg: string; text: string; defaultLabel: string }> = {
  good:    { dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  defaultLabel: 'Good' },
  warning: { dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700',  defaultLabel: 'Watch' },
  danger:  { dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    defaultLabel: 'Alert' },
  unknown: { dot: 'bg-gray-400',   bg: 'bg-gray-50',   text: 'text-gray-500',   defaultLabel: 'No data' },
};

export default function StatusBadge({ status, label }: Props): React.ReactElement {
  const c = CONFIG[status];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', c.dot)} />
      {label ?? c.defaultLabel}
    </span>
  );
}
