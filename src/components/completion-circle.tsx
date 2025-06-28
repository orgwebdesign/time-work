"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface CompletionCircleProps {
  percentage: number;
}

export function CompletionCircle({ percentage }: CompletionCircleProps) {
  const data = [{ name: 'completed', value: percentage }];

  return (
    <div className="relative size-16">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          barSize={8}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: 'hsl(var(--muted))' }}
            dataKey="value"
            angleAxisId={0}
            fill="hsl(var(--primary))"
            className="transition-all duration-500"
            cornerRadius={4}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-foreground">{`${percentage}%`}</span>
      </div>
    </div>
  );
}
