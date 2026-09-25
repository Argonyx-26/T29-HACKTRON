import React, { useState } from 'react';
import { mockDiagnostic } from '../../services/learningRepository';

export const AssessmentView: React.FC = () => {
  const [selectedAssessment] = useState(mockDiagnostic);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const question = selectedAssessment.questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (!submitted) setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setSubmitted(true);
    if (selectedOption === question.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setSubmitted(false);
    if (currentIndex + 1 < selectedAssessment.questions.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const isCompleted = currentIndex >= selectedAssessment.questions.length - 1 && submitted;

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Formative Concept Assessment</h2>
          <p className="subtitle">{selectedAssessment.title} ({selectedAssessment.estimatedMinutes} mins)</p>
        </div>
        <div className="badge badge-accent">
          Question {currentIndex + 1} of {selectedAssessment.questions.length}
        </div>
      </div>

      <div className="card assessment-card">
        <div className="question-header">
          <span className="badge badge-subtle">Difficulty: {question.difficulty}</span>
          <span className="badge badge-accent">Concept: {question.conceptId}</span>
        </div>

        <h3 className="question-prompt">{question.prompt}</h3>

        <div className="options-list">
          {question.options.map((opt, idx) => {
            let itemClass = 'option-item';
            if (selectedOption === idx) itemClass += ' selected';
            if (submitted) {
              if (idx === question.correctIndex) itemClass += ' correct';
              else if (selectedOption === idx) itemClass += ' incorrect';
            }

            return (
              <button
                key={idx}
                className={itemClass}
                onClick={() => handleSelect(idx)}
                disabled={submitted}
              >
                <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="opt-text">{opt}</span>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="explanation-box">
            <h4>💡 Cognitive Feedback</h4>
            <p>{question.explanation}</p>
          </div>
        )}

        <div className="assessment-actions">
          {!submitted ? (
            <button
              className="btn btn-primary"
              disabled={selectedOption === null}
              onClick={handleSubmit}
            >
              Submit Answer
            </button>
          ) : !isCompleted ? (
            <button className="btn btn-primary" onClick={handleNext}>
              Next Question &rarr;
            </button>
          ) : (
            <div className="completion-banner">
              🎉 Assessment Complete! Final Score: {score} / {selectedAssessment.questions.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentView;
