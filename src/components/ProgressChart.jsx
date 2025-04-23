// src/components/ProgressChart.jsx
import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const ProgressChart = ({ data }) => {
  // Color based on value - green for high progress (low risk)
  const getColor = (value) => {
    if (value >= 70) return '#4CAF50';
    if (value >= 50) return '#FFC107';
    return '#F44336';
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid strokeDasharray="3 3" />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Tooltip />
        <Radar
          name="Progress"
          dataKey="value"
          stroke="#2196F3"
          fill="#2196F3"
          fillOpacity={0.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default ProgressChart;