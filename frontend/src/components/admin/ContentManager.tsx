import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  Database,
  Plus,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
  Terminal,
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react';

interface ContentManagerProps {
  onBackToApp?: () => void;
}

export const ContentManager: React.FC<ContentManagerProps> = ({ onBackToApp }) => {
  const [patternsData, setPatternsData] = useState<{ total_count: number; patterns: any[] }>({ total_count: 18, patterns: [] });
  const [logsData, setLogsData] = useState<{ audit_logs: any[]; llm_request_logs: any[] }>({ audit_logs: [], llm_request_logs: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'patterns' | 'content' | 'system'>('patterns');

  // Form State
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('sk_dist_04');
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const pats = await apiClient.getAdminPatterns();
      setPatternsData(pats);
      const logs = await apiClient.getAdminLogs();
      setLogsData(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText || !newCorrectAnswer) return;

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: 'chap_linear_eq',
          skill_id: selectedSkillId,
          question_text: newQuestionText,
          correct_answer: newCorrectAnswer,
          expected_steps: [newQuestionText, `x = ${newCorrectAnswer}`],
          difficulty: 'medium'
        })
      });
      if (res.ok) {
        setCreatedMessage('Question dynamically inserted into PostgreSQL! Available immediately across diagnostic sessions.');
        setNewQuestionText('');
        setNewCorrectAnswer('');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      
      {/* Header Banner */}
      <div className="card-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold tracking-widest text-primary-light uppercase">
              Admin & System
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Database Authority
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Observability & Pattern Registry
          </h1>
          <p className="text-xs text-surface-variant mt-1">
            Inspect live pattern library growth, add curriculum items, and audit real-time system operations.
          </p>
        </div>

        {/* 3-Item Navigation Pills */}
        <div className="flex items-center gap-1.5 bg-surface-container-high/80 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'patterns'
                ? 'bg-primary text-black shadow-[0_0_14px_rgba(215,186,255,0.4)]'
                : 'text-surface-variant hover:text-white'
            }`}
            onClick={() => setActiveTab('patterns')}
          >
            Patterns ({patternsData.total_count})
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'content'
                ? 'bg-primary text-black shadow-[0_0_14px_rgba(215,186,255,0.4)]'
                : 'text-surface-variant hover:text-white'
            }`}
            onClick={() => setActiveTab('content')}
          >
            Add Question
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'system'
                ? 'bg-primary text-black shadow-[0_0_14px_rgba(215,186,255,0.4)]'
                : 'text-surface-variant hover:text-white'
            }`}
            onClick={() => setActiveTab('system')}
          >
            System Logs
          </button>
        </div>
      </div>

      {/* 1. PATTERN LIBRARY */}
      {activeTab === 'patterns' && (
        <div className="card-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-light" />
                Misconception Pattern Registry
              </h3>
              <p className="text-xs text-surface-variant mt-0.5">
                The library expands dynamically when uncataloged errors are classified by the fallback engine.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary-light border border-primary/30">
              {patternsData.total_count} Active Patterns
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-surface-variant flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <span>Loading pattern database...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {patternsData.patterns.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-surface-container-low border border-white/5 flex flex-col justify-between gap-3 hover:border-white/15 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-high text-surface-variant uppercase tracking-wider">
                        {p.classification || 'procedural'}
                      </span>
                      {p.source === 'llm_generalized' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary-light border border-primary/30">
                          Discovered
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/40 text-blue-300 border border-blue-500/30">
                          Seeded
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-white">
                      {p.name}
                    </div>
                    <div className="text-xs text-surface-variant mt-1.5 leading-relaxed">
                      {p.description}
                    </div>
                  </div>

                  <div className="text-[11px] text-surface-variant/80 border-t border-white/5 pt-2 font-mono">
                    Rule: {p.rule_type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. DYNAMIC CONTENT INSERTION */}
      {activeTab === 'content' && (
        <div className="card-panel p-6 rounded-2xl border border-white/10 max-w-2xl mx-auto w-full">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary-light" />
              Add Question to Database
            </h3>
            <p className="text-xs text-surface-variant mt-0.5">
              New questions become immediately available to learners in assessments with 0 frontend changes.
            </p>
          </div>

          {createdMessage && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 mb-5 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <span>{createdMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateQuestion} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-white block mb-1.5 uppercase tracking-wider">
                Question Prompt
              </label>
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="e.g. Solve for x: 5(x - 3) = 25"
                className="w-full px-3.5 py-2.5 bg-surface-container-high border border-white/15 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-white block mb-1.5 uppercase tracking-wider">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={newCorrectAnswer}
                  onChange={(e) => setNewCorrectAnswer(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full px-3.5 py-2.5 bg-surface-container-high border border-white/15 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1.5 uppercase tracking-wider">
                  Associated Skill
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-high border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                >
                  <option value="sk_dist_04">Distributive Property (DIST-04)</option>
                  <option value="sk_like_03">Combining Like Terms (LIKE-03)</option>
                  <option value="sk_isol_05">Isolating the Variable (ISOL-05)</option>
                  <option value="sk_multi_06">Multi-Step Equations (MULTI-06)</option>
                  <option value="sk_phy_01">Ohm's Law & Resistance (OHM-01)</option>
                  <option value="sk_chem_03">Balancing Chemical Equations (CHEM-03)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button type="submit" className="purple-glow-btn flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl">
                <Plus size={16} /> Insert Question into Database
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. SYSTEM LOGS & TELEMETRY */}
      {activeTab === 'system' && (
        <div className="card-panel p-6 rounded-2xl border border-white/10">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary-light" />
              System Audit & Reasoning Telemetry
            </h3>
            <p className="text-xs text-surface-variant mt-0.5">
              Deterministic rule dispatch logs and dual-key LLM fallback operations.
            </p>
          </div>

          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scrollbar">
            {logsData.audit_logs && logsData.audit_logs.length > 0 ? (
              logsData.audit_logs.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface-container-low border border-white/5 font-mono text-xs flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-primary-light font-bold">[{log.action || 'EXECUTE'}]</span>{' '}
                    <span className="text-gray-200">{log.details ? JSON.stringify(log.details) : log.entity_type}</span>
                  </div>
                  <span className="text-[11px] text-surface-variant flex-shrink-0">{log.created_at || 'just now'}</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-surface-variant text-xs border border-dashed border-white/10 rounded-xl">
                System operational. All events persisted to PostgreSQL database.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

