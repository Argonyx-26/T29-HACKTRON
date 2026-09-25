import React, { useState } from 'react';
import { mockInterventions } from '../../services/learningRepository';
import { InterventionPlan } from '../../types';

export const InterventionView: React.FC = () => {
  const [plans, setPlans] = useState<InterventionPlan[]>(mockInterventions);

  const toggleComplete = (id: string) => {
    setPlans((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Targeted Micro-Interventions</h2>
          <p className="subtitle">AI-prescribed learning interventions designed to close active cognitive gaps</p>
        </div>
        <span className="badge badge-warning">
          {plans.filter((p) => !p.completed).length} Pending Actions
        </span>
      </div>

      <div className="interventions-list">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card intervention-card ${plan.completed ? 'completed' : ''}`}
          >
            <div className="intervention-top">
              <div className="intervention-meta">
                <span className={`badge ${plan.urgency === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                  {plan.urgency.toUpperCase()} PRIORITY
                </span>
                <span className="concept-tag">{plan.conceptTitle}</span>
              </div>
              <button
                className={`btn btn-sm ${plan.completed ? 'btn-secondary' : 'btn-success'}`}
                onClick={() => toggleComplete(plan.id)}
              >
                {plan.completed ? 'Mark Incomplete' : 'Complete Intervention'}
              </button>
            </div>

            <div className="intervention-body">
              <div className="gap-definition">
                <span className="gap-label">Detected Misconception:</span>
                <p>{plan.misconception}</p>
              </div>

              <div className="recommended-action-box">
                <span className="action-label">Prescribed Micro-Action:</span>
                <p>{plan.recommendedAction}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterventionView;
