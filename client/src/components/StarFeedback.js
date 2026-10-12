import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function StarFeedback({ breakdown = {} }) {
  const items = [
    {
      key: 'situation',
      title: 'Situation',
      desc: 'Context & Background',
      data: breakdown.situation || {}
    },
    {
      key: 'task',
      title: 'Task',
      desc: 'Problem & Objective',
      data: breakdown.task || {}
    },
    {
      key: 'action',
      title: 'Action',
      desc: 'Technical Decisions & Work',
      data: breakdown.action || {}
    },
    {
      key: 'result',
      title: 'Result',
      desc: 'Measurable Outcomes & Impact',
      data: breakdown.result || {}
    }
  ];

  return (
    <div className="star-grid">
      {items.map((item) => {
        const isPresent = item.data.present;
        return (
          <div key={item.key} className={`star-card ${isPresent ? 'active' : 'inactive'}`}>
            <div className="star-letter">
              <span>{item.title}</span>
              {isPresent ? (
                <CheckCircle2 size={16} color="#10b981" />
              ) : (
                <AlertCircle size={16} color="#64748b" />
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {item.desc}
            </div>
            <p className="star-excerpt">
              {isPresent ? (
                <span>&ldquo;{item.data.excerpt ? item.data.excerpt.slice(0, 95) + '...' : 'Identified'}&rdquo;</span>
              ) : (
                <span style={{ color: '#ef4444' }}>Missing clear {item.title}</span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
