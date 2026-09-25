import React, { useState } from 'react';
import { ArrowRight, Brain, Sparkles, LogIn, Activity, Compass, Cpu, Layers } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onGetStarted: () => void;
  onViewCurriculum?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onGetStarted,
  onViewCurriculum,
}) => {
  const [activeSlopePoint, setActiveSlopePoint] = useState<'current' | 'remediation' | 'mastery'>('remediation');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#04060a',
      color: '#e2e8f0',
      fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Slope Lighting Effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1000px',
        height: '480px',
        background: 'radial-gradient(ellipse 65% 50% at 50% 0%, rgba(6, 182, 212, 0.18) 0%, rgba(2, 132, 199, 0.08) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Subtle Topographical Grid Lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 20%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Navbar */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '22px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
          }}>
            <Cpu size={20} />
          </div>
          <span style={{ color: '#fff' }}>Knowledge <span style={{ color: '#38bdf8' }}>Twin</span></span>
          <span style={{
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#38bdf8',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Slope AI
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onNavigateToLogin}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: '#e2e8f0',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <LogIn size={15} /> Log In
          </button>
          <button
            onClick={onGetStarted}
            style={{
              padding: '9px 22px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              color: '#fff',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(6, 182, 212, 0.35)'
            }}
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '60px 24px 80px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: '#38bdf8',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          marginBottom: '26px'
        }}>
          <Activity size={14} className="animate-pulse" />
          <span>Continuous Gradient Optimization for Human Learning</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: '-0.035em',
          textAlign: 'center',
          color: '#ffffff',
          maxWidth: '920px',
          marginBottom: '20px'
        }}>
          Mastery is a Gradient.<br />
          <span style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 40%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Navigate the Cognitive Slope.
          </span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          lineHeight: 1.6,
          color: '#94a3b8',
          maxWidth: '680px',
          textAlign: 'center',
          marginBottom: '36px'
        }}>
          Knowledge Twin models your learning as a continuous mathematical landscape. It detects prerequisite drop-offs, traces misconceptions, and plots the fastest slope to true conceptual convergence.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '60px'
        }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: '14px 30px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              boxShadow: '0 8px 25px rgba(6, 182, 212, 0.4)'
            }}
          >
            Ascend Your Learning Slope <ArrowRight size={18} />
          </button>

          {onViewCurriculum && (
            <button
              onClick={onViewCurriculum}
              style={{
                padding: '14px 26px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Explore Topology
            </button>
          )}
        </div>

        {/* 3D AI Gradient Slope Visualizer Card */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
          borderRadius: '20px',
          background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.9) 0%, rgba(8, 12, 22, 0.95) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(6, 182, 212, 0.2)',
          padding: '28px',
          boxSizing: 'border-box',
          marginBottom: '60px',
          position: 'relative'
        }}>
          {/* Visual Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }}></span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Cognitive Loss Landscape &amp; Gradient Trajectory</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveSlopePoint('current')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: activeSlopePoint === 'current' ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.08)',
                  background: activeSlopePoint === 'current' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                  color: activeSlopePoint === 'current' ? '#fda4af' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                1. Latent Gap (High Loss)
              </button>
              <button
                onClick={() => setActiveSlopePoint('remediation')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: activeSlopePoint === 'remediation' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.08)',
                  background: activeSlopePoint === 'remediation' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: activeSlopePoint === 'remediation' ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                2. Micro-Intervention Slope
              </button>
              <button
                onClick={() => setActiveSlopePoint('mastery')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: activeSlopePoint === 'mastery' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                  background: activeSlopePoint === 'mastery' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: activeSlopePoint === 'mastery' ? '#6ee7b7' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                3. Global Optimum (Mastery)
              </button>
            </div>
          </div>

          {/* Interactive SVG Slope Diagram */}
          <div style={{ padding: '24px 0', position: 'relative' }}>
            <svg viewBox="0 0 880 260" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              <defs>
                <linearGradient id="slopeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="35%" stopColor="#06b6d4" />
                  <stop offset="70%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                <linearGradient id="slopeAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="contourGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(244, 63, 94, 0.15)" />
                  <stop offset="50%" stopColor="rgba(6, 182, 212, 0.25)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0.15)" />
                </linearGradient>
              </defs>

              {/* Wireframe Slope Contour Lines */}
              <path d="M 40 70 Q 240 180 440 110 T 840 190" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M 40 100 Q 240 210 440 140 T 840 210" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M 40 130 Q 240 230 440 170 T 840 230" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="4 4" />

              {/* Topographical Contour Band */}
              <path d="M 40 60 Q 240 190 440 120 T 840 200 L 840 240 L 40 240 Z" fill="url(#contourGrad1)" />

              {/* Primary Cognitive Gradient Descent Slope */}
              <path
                d="M 60 40 C 200 45, 260 210, 460 170 S 700 80, 820 85"
                fill="none"
                stroke="url(#slopeLineGrad)"
                strokeWidth="4"
                style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))' }}
              />

              {/* Gradient Descent Step Arrows */}
              <line x1="160" y1="52" x2="240" y2="130" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
              <polygon points="240,130 233,122 239,121" fill="#f43f5e" />

              <line x1="320" y1="184" x2="430" y2="175" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
              <polygon points="430,175 422,170 423,178" fill="#38bdf8" />

              {/* Point 1: Misconception / High Loss Peak */}
              <g style={{ cursor: 'pointer' }} onClick={() => setActiveSlopePoint('current')}>
                <circle cx="90" cy="42" r="10" fill="#f43f5e" opacity="0.3" className="animate-ping" />
                <circle cx="90" cy="42" r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                <text x="90" y="24" fill="#fda4af" fontSize="12" fontWeight="700" textAnchor="middle">
                  High Error Ridge (Mistake Pattern)
                </text>
              </g>

              {/* Point 2: Active Slope Remediation */}
              <g style={{ cursor: 'pointer' }} onClick={() => setActiveSlopePoint('remediation')}>
                <circle cx="380" cy="180" r="14" fill="#06b6d4" opacity="0.25" />
                <circle cx="380" cy="180" r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
                <text x="380" y="210" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">
                  &nabla; &theta; Micro-Intervention Vector
                </text>
              </g>

              {/* Point 3: Global Optimum / Converged Mastery */}
              <g style={{ cursor: 'pointer' }} onClick={() => setActiveSlopePoint('mastery')}>
                <circle cx="800" cy="85" r="16" fill="#10b981" opacity="0.25" />
                <circle cx="800" cy="85" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                <text x="800" y="65" fill="#6ee7b7" fontSize="12" fontWeight="700" textAnchor="middle">
                  Converged Model (100% Mastery)
                </text>
              </g>
            </svg>
          </div>

          {/* Telemetry Footer Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Active Slope Gradient</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                -0.428 &nabla;L / step
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Cognitive Convergence</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                94.2% Optimal
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Prerequisite Ridge Status</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                Balanced · Low Friction
              </div>
            </div>
          </div>
        </div>

        {/* 3 Pillar Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '960px',
          textAlign: 'left'
        }}>
          <div style={{
            background: 'rgba(14, 20, 36, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '26px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(2, 132, 199, 0.2)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Compass size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>01 // Topographical Mapping</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px' }}>
              Cognitive Manifolds
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Instead of flat grades, skills are modeled as interconnected mathematical surfaces where prerequisite dependencies dictate friction.
            </p>
          </div>

          <div style={{
            background: 'rgba(14, 20, 36, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '26px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.2)',
              color: '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Brain size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>02 // Root Cause Tracing</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px' }}>
              Latent Ridge Detection
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              When you struggle with an advanced concept, the engine scans uphill to find the exact prerequisite misconception causing the error.
            </p>
          </div>

          <div style={{
            background: 'rgba(14, 20, 36, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '26px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Layers size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>03 // Adaptive Interventions</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px' }}>
              Fastest Descent to Mastery
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Receive targeted 3-minute micro-interventions that systematically eliminate the error pattern with minimum cognitive fatigue.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '24px 20px',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#64748b'
      }}>
        <span>Knowledge Twin · AI Cognitive Loss Landscape &amp; Slope Architecture</span>
      </footer>
    </div>
  );
};

export default LandingPage;
