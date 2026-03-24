import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data: { date: string; value: number }[];
  color?: string;
}

export default function Sparkline({ data, color = '#6366f1' }: Props): React.ReactElement {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: '2px 6px', border: 'none', background: '#1e1b4b', color: '#fff', borderRadius: 4 }}
          formatter={(v: number) => [v.toFixed(2), '']}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
