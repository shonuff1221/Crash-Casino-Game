import { FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '@/styles/MultiplierGraph.module.scss';

interface MultiplierGraphProps {
  data: { name: string; multiplier?: number }[];
  speedMs: number;
  userWon?: boolean;
  isPlaying: boolean;
  finalMultiplier?: number;
}

interface DotProps {
  cx: number;
  cy: number;
  value: number;
  index: number;
  payload: { name: string; multiplier?: number };
}

const MultiplierGraph: FC<MultiplierGraphProps> = ({ 
  data, 
  speedMs, 
  userWon, 
  isPlaying,
  finalMultiplier 
}) => {
  const CustomDot = ({ cx, cy, index, payload }: DotProps) => {
    const isLast = index === data.length - 1;
    if (isLast && payload.multiplier !== undefined) {
      return (
        <svg x={cx - 6} y={cy - 6} width={12} height={12}>
          <circle
            cx={6}
            cy={6}
            r={6}
            stroke="none"
            fill={isPlaying ? "yellow" : userWon ? "#4caf50" : "#f44336"}
          />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={styles.graphContainer}>
      <ResponsiveContainer width="100%" height={420} className={styles.chart}>
        <LineChart data={data}>
          <XAxis 
            dataKey="name" 
            stroke="#fff"
            tick={{ fill: '#fff' }}
          />
          <YAxis 
            stroke="#fff"
            tick={{ fill: '#fff' }}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e2230', border: 'none', color: '#fff' }}
            labelStyle={{ color: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="multiplier" 
            stroke={isPlaying ? "#8884d8" : userWon ? "#4caf50" : "#f44336"}
            isAnimationActive={true}
            animationDuration={speedMs} 
            animationBegin={0}
            dot={(props) => <CustomDot {...props as DotProps} />}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      {!isPlaying && userWon !== undefined && (
        <div className={`${styles.resultOverlay} ${userWon ? styles.win : styles.lose}`}>
          <div className={styles.resultText}>
            {userWon ? 'WIN!' : 'CRASH!'}
            <div className={styles.multiplier}>
              {finalMultiplier?.toFixed(2)}x
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MultiplierGraph.defaultProps = {
  speedMs: 1000,
};

export default MultiplierGraph;
