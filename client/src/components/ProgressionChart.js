import React, { useState } from 'react';

export default function ProgressionChart({ trends = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!trends || trends.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        No interview session trends recorded yet. Complete your first practice session to see progression!
      </div>
    );
  }

  // Chart dimensions
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max scale is 10.0, Min scale is 0.0 or 2.0
  const minY = 0;
  const maxY = 10;

  const getX = (index) => {
    if (trends.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (trends.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padding.top + chartHeight - ((clamped - minY) / (maxY - minY)) * chartHeight;
  };

  // Generate SVG path for Total Score
  const points = trends.map((t, i) => `${getX(i)},${getY(t.totalScore)}`).join(' ');
  const areaPoints = `${getX(0)},${getY(0)} ${points} ${getX(trends.length - 1)},${getY(0)}`;

  // Threshold line at 7.0 (Offer Readiness)
  const thresholdY = getY(7.0);

  return (
    <div className="chart-svg-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[2, 4, 6, 8, 10].map((score) => {
          const y = getY(score);
          return (
            <g key={score}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#243247"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fill="#64748b"
                fontSize="11"
                textAnchor="end"
                fontFamily="var(--font-mono)"
              >
                {score}.0
              </text>
            </g>
          );
        })}

        {/* 7.0 Readiness Target Line */}
        <line
          x1={padding.left}
          y1={thresholdY}
          x2={width - padding.right}
          y2={thresholdY}
          stroke="#10b981"
          strokeWidth="1.5"
          strokeDasharray="6 3"
          opacity="0.7"
        />
        <text
          x={width - padding.right}
          y={thresholdY - 6}
          fill="#10b981"
          fontSize="10"
          fontWeight="700"
          textAnchor="end"
        >
          7.0 Offer Ready
        </text>

        {/* Area fill */}
        {trends.length > 1 && (
          <polygon
            points={areaPoints}
            fill="url(#scoreAreaGradient)"
          />
        )}

        {/* Score line */}
        <polyline
          fill="none"
          stroke="#6366f1"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {trends.map((t, i) => {
          const cx = getX(i);
          const cy = getY(t.totalScore);
          const isHovered = hoveredPoint === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 8 : 5}
                fill="#fff"
                stroke="#4f46e5"
                strokeWidth={isHovered ? 4 : 3}
                style={{ transition: 'r 0.15s ease' }}
              />

              {/* X Axis Labels */}
              <text
                x={cx}
                y={height - 12}
                fill={isHovered ? '#f8fafc' : '#94a3b8'}
                fontSize="11"
                fontWeight={isHovered ? '700' : '500'}
                textAnchor="middle"
              >
                Sess #{t.sessionNumber}
              </text>

              {/* Hover Tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={cx - 70}
                    y={cy - 52}
                    width="140"
                    height="42"
                    rx="8"
                    fill="#1e293b"
                    stroke="#4f46e5"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={cy - 34}
                    fill="#10b981"
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    {t.totalScore} / 10
                  </text>
                  <text
                    x={cx}
                    y={cy - 18}
                    fill="#94a3b8"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {t.jobTitle ? t.jobTitle.slice(0, 18) : 'Session'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
