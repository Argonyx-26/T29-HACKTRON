import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Brain,
  Sparkles,
  LogIn,
  Activity,
  Compass,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Target,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  BarChart3,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';

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
  // 1. Cognitive Slope Interactive State
  const [sliderStep, setSliderStep] = useState<number>(45); // 0 to 100
  const [activeSlopePoint, setActiveSlopePoint] = useState<'current' | 'remediation' | 'mastery'>('remediation');

  // Sync preset buttons with slider
  const handleSelectPreset = (preset: 'current' | 'remediation' | 'mastery') => {
    setActiveSlopePoint(preset);
    if (preset === 'current') setSliderStep(15);
    else if (preset === 'remediation') setSliderStep(52);
    else setSliderStep(92);
  };

  const handleSliderChange = (val: number) => {
    setSliderStep(val);
    if (val < 35) setActiveSlopePoint('current');
    else if (val < 78) setActiveSlopePoint('remediation');
    else setActiveSlopePoint('mastery');
  };

  // Dynamic telemetry calculations based on sliderStep (0 to 100)
  const slopeTelemetry = useMemo(() => {
    const t = sliderStep / 100;
    // Loss starts at 0.92, dips sharply, stabilizes at 0.04
    const loss = Math.max(0.04, Number((0.92 * Math.exp(-3.2 * t) + 0.04 * (1 - t)).toFixed(3)));
    const convergence = Math.min(99.6, Math.max(12.5, Number((18 + 81.6 * Math.pow(t, 0.85)).toFixed(1))));
    const gradient = Number((-0.85 * Math.exp(-2.5 * t)).toFixed(3));
    const estTime = Math.max(1, Math.round(5.5 * (1 - t)));

    return { loss, convergence, gradient, estTime };
  }, [sliderStep]);

  // SVG coordinate interpolation along the cognitive slope
  // Path formula approximately: starts high (x: 80, y: 55), dips down to valley (x: 440, y: 195), rises to stable plateau (x: 800, y: 85)
  const probeCoordinates = useMemo(() => {
    const t = sliderStep / 100;
    // Bezier parameterization: P0=(80, 50), P1=(250, 60), P2=(420, 220), P3=(800, 85)
    const x = 80 + t * 720;
    // Spline curve for loss landscape: high peak at left, deep valley in middle, balanced mastery terrace at right
    const y = 50 + 160 * Math.sin(t * Math.PI * 0.9) * Math.sin(t * Math.PI * 0.9) - 10 * Math.sin(t * 2 * Math.PI);
    const clampedY = Math.max(45, Math.min(205, y));
    return { x, y: clampedY };
  }, [sliderStep]);

  // 2. Diagnostic X-Ray Comparison State
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<'algebra' | 'calculus' | 'physics'>('algebra');

  const diagnosticScenarios = {
    algebra: {
      title: 'Distributive Property with Negatives',
      problem: 'Simplify: -4(3x - 7) + 2x',
      studentAnswer: '-12x - 28 + 2x = -10x - 28',
      correctAnswer: '-12x + 28 + 2x = -10x + 28',
      traditionalResult: {
        score: '0 / 5 pts (0%)',
        feedback: 'Incorrect. You failed to calculate the correct constant term. Review Chapter 3.',
        friction: 'High Student Frustration'
      },
      twinResult: {
        pattern: 'Sign Inversion on Negative Multiplication',
        classification: 'Procedural Misconception',
        rootPrerequisite: 'Signed Number Multiplication (ID: sk_signed_02)',
        confidenceScore: '94% Confidence',
        remedy: '3-min interactive micro-drill: visual area model showing negative scaling.'
      }
    },
    calculus: {
      title: 'Chain Rule with Composite Trigonometry',
      problem: 'Find d/dx of f(x) = sin(4x³)',
      studentAnswer: 'cos(4x³)',
      correctAnswer: '12x² · cos(4x³)',
      traditionalResult: {
        score: '2 / 10 pts (20%)',
        feedback: 'Missed chain rule derivative. Grade: D. Re-read section 4.2.',
        friction: 'Cognitive Disconnection'
      },
      twinResult: {
        pattern: 'Forgotten Inner Derivative (Composite Neglect)',
        classification: 'Structural Concept Gap',
        rootPrerequisite: 'Composite Function Decomposition (ID: sk_comp_05)',
        confidenceScore: '97% Confidence',
        remedy: 'Nested function box mapping drill: 2 minutes to isolate u(x) vs f(u).'
      }
    },
    physics: {
      title: 'Newtonian Work-Energy & Kinetic Friction',
      problem: 'Calculate net work on a sliding 5kg crate with μk = 0.3 over 4m on a flat floor (F_pull = 30N)',
      studentAnswer: 'W_net = 30N × 4m = 120 Joules',
      correctAnswer: 'W_friction = -(0.3 × 5 × 9.8) × 4 = -58.8 J; W_net = 120 - 58.8 = 61.2 J',
      traditionalResult: {
        score: '0 / 8 pts (0%)',
        feedback: 'Wrong answer. Friction was completely ignored. Try question again.',
        friction: 'Repeat Error Cycle'
      },
      twinResult: {
        pattern: 'Isolated Force Oversight (Omission of Non-Conservative Work)',
        classification: 'Conceptual Model Friction',
        rootPrerequisite: 'Free-Body Diagram Vector Summation (ID: sk_fbd_01)',
        confidenceScore: '91% Confidence',
        remedy: 'Force-vector superposition micro-simulation before numeric calculation.'
      }
    }
  };

  // 3. Interactive Skill Topology Node State
  const [selectedNode, setSelectedNode] = useState<number>(2);

  const topologyNodes = [
    {
      id: 0,
      code: 'SK-ALG-01',
      title: 'Foundational Arithmetic & Signs',
      mastery: 98,
      status: 'Mastered',
      statusColor: '#10b981',
      prereq: 'Elementary Number Line',
      desc: 'Fluency with negative integers, absolute value, and order of operations.'
    },
    {
      id: 1,
      code: 'SK-ALG-02',
      title: 'Signed Multiplication & Exponents',
      mastery: 89,
      status: 'Stable',
      statusColor: '#38bdf8',
      prereq: 'SK-ALG-01',
      desc: 'Even/odd exponent sign parity and multiplicative identity properties.'
    },
    {
      id: 2,
      code: 'SK-ALG-03',
      title: 'Distributive Expansion & Grouping',
      mastery: 54,
      status: 'Active Ridge (Misconception)',
      statusColor: '#f43f5e',
      prereq: 'SK-ALG-02',
      desc: 'Distributing negative multipliers across multi-term polynomials.'
    },
    {
      id: 3,
      code: 'SK-ALG-04',
      title: 'Linear Equation Systems',
      mastery: 72,
      status: 'In Progress',
      statusColor: '#f59e0b',
      prereq: 'SK-ALG-03',
      desc: 'Simultaneous elimination and graphical intersection points.'
    },
    {
      id: 4,
      code: 'SK-ALG-05',
      title: 'Quadratic Polynomial Factoring',
      mastery: 38,
      status: 'Prerequisite Blocked',
      statusColor: '#a855f7',
      prereq: 'SK-ALG-03, SK-ALG-04',
      desc: 'Decomposing trinomials into binomial factors with integer roots.'
    },
    {
      id: 5,
      code: 'SK-ALG-06',
      title: 'Nonlinear Optimization & Graphs',
      mastery: 15,
      status: 'Upcoming Frontier',
      statusColor: '#64748b',
      prereq: 'SK-ALG-05',
      desc: 'Vertex extrema, discriminant analysis, and parabolic trajectory modeling.'
    }
  ];

  // 4. Feature Showcase Tabs
  const [activeFeatureTab, setActiveFeatureTab] = useState<'twin' | 'remediation' | 'teacher' | 'ingestion'>('twin');

  // 5. FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How is Knowledge Twin different from traditional adaptive learning platforms?',
      a: 'Traditional platforms simply give easier or harder questions based on whether you got the previous item right or wrong. Knowledge Twin does continuous Bayesian Knowledge Tracing across a semantic dependency DAG (Directed Acyclic Graph). It uncovers the hidden prerequisite misconception causing errors three steps downstream.'
    },
    {
      q: 'What is the "Cognitive Slope" and how does gradient descent apply to learning?',
      a: 'In machine learning, models descend a loss landscape toward zero prediction error. In Knowledge Twin, a student’s cognitive state is modeled as a topological surface where misconceptions represent high-loss friction ridges. The engine calculates the steepest descent vector (the fastest sequence of micro-drills) to reach conceptual convergence.'
    },
    {
      q: 'How long do micro-interventions take, and when are they triggered?',
      a: 'Interventions are brief (typically 2 to 4 minutes) and trigger precisely when a repeated misconception pattern is verified with >85% probabilistic certainty. Instead of forcing a student through a 45-minute lecture, it fixes the specific conceptual knot immediately.'
    },
    {
      q: 'Can educators ingest their own custom textbooks, syllabi, or course documents?',
      a: 'Yes. Knowledge Twin includes an automated Document Ingestion Engine. Teachers can upload PDF syllabi, lecture notes, or problem banks. The system automatically constructs the prerequisite skill graph and associates diagnostic assessment items with semantic embeddings.'
    },
    {
      q: 'Can students collaborate or form study groups using their Knowledge Twins?',
      a: 'Absolutely. Knowledge Twin analyzes complementary skill profiles across study groups. If Student A has mastered Quadratic Factoring but struggles with Negative Exponents, while Student B has the reverse profile, the system pairs them for high-impact peer remediation.'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#04060c',
      color: '#e2e8f0',
      fontFamily: '"Plus Jakarta Sans", "Space Grotesk", system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Inline styles for custom glow animations and smooth transitions */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes dashMove {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        .shimmer-text {
          background: linear-gradient(135deg, #ffffff 0%, #38bdf8 30%, #06b6d4 60%, #818cf8 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientFlow 6s ease infinite;
        }
        .glow-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glow-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px -10px rgba(6, 182, 212, 0.3), 0 0 20px rgba(56, 189, 248, 0.15);
          border-color: rgba(56, 189, 248, 0.45) !important;
        }
        .interactive-tab {
          transition: all 0.2s ease;
        }
        .interactive-tab:hover {
          background: rgba(6, 182, 212, 0.12) !important;
          color: #ffffff !important;
        }
      `}</style>

      {/* Ambient Radial Lights */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1200px',
        height: '600px',
        background: 'radial-gradient(ellipse 70% 55% at 50% 20%, rgba(6, 182, 212, 0.22) 0%, rgba(59, 130, 246, 0.12) 45%, rgba(139, 92, 246, 0.05) 70%, transparent 90%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        top: '900px',
        left: '10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        top: '2000px',
        right: '5%',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Geometric Matrix Grid Lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 90% 70% at 50% 15%, black 40%, transparent 95%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 15%, black 40%, transparent 95%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Glassmorphic Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        background: 'rgba(4, 6, 12, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          {/* Brand */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 24px rgba(6, 182, 212, 0.55)'
            }}>
              <Cpu size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', color: '#ffffff' }}>
                  Knowledge <span style={{ color: '#38bdf8' }}>Twin</span>
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#38bdf8',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  v2.4 AI
                </span>
              </div>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: '#94a3b8'
          }} className="hidden md:flex">
            <a
              href="#slope-visualizer"
              style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
            >
              Cognitive Slope
            </a>
            <a
              href="#diagnostic-xray"
              style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
            >
              Diagnostic X-Ray
            </a>
            <a
              href="#skill-topology"
              style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
            >
              Skill Topology
            </a>
            <a
              href="#architecture"
              style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
            >
              Platform
            </a>
            <a
              href="#faqs"
              style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
            >
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onNavigateToLogin}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#e2e8f0',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <LogIn size={15} />
              <span>Log In</span>
            </button>

            <button
              onClick={onGetStarted}
              style={{
                padding: '9px 22px',
                borderRadius: '9px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(6, 182, 212, 0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(6, 182, 212, 0.4)';
              }}
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '50px 24px 100px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1
      }}>
        {/* Floating AI Notification Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 20px',
          borderRadius: '9999px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          color: '#38bdf8',
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          marginBottom: '28px',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
          animation: 'floatBadge 4s ease-in-out infinite'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
            display: 'inline-block'
          }} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.78rem', color: '#67e8f9' }}>
            &nabla; L(θ) COGNITIVE OPTIMIZATION
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>14,280+ Knowledge Nodes Online</span>
        </div>

        {/* Hero Headline */}
        <h1 style={{
          fontSize: 'clamp(2.6rem, 6vw, 4.6rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          textAlign: 'center',
          color: '#ffffff',
          maxWidth: '960px',
          marginBottom: '24px'
        }}>
          Mastery is a Gradient.<br />
          <span className="shimmer-text">
            Navigate the Cognitive Slope.
          </span>
        </h1>

        <p style={{
          fontSize: '1.2rem',
          lineHeight: 1.65,
          color: '#94a3b8',
          maxWidth: '720px',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          Knowledge Twin models human understanding as an evolving probabilistic loss landscape. It detects prerequisite drop-offs, pinpoints latent misconceptions, and plots the mathematical gradient to mastery.
        </p>

        {/* Action CTAs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '70px'
        }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: '16px 36px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              color: '#ffffff',
              fontSize: '1.05rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(6, 182, 212, 0.45)',
              transition: 'all 0.25s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 14px 40px rgba(6, 182, 212, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.45)';
            }}
          >
            <span>Ascend Your Learning Slope</span>
            <ArrowRight size={20} />
          </button>

          <a
            href="#slope-visualizer"
            style={{
              padding: '16px 30px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#ffffff',
              fontSize: '1.05rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <Sliders size={18} style={{ color: '#38bdf8' }} />
            <span>Interactive Simulator</span>
          </a>

          {onViewCurriculum && (
            <button
              onClick={onViewCurriculum}
              style={{
                padding: '16px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Explore Topology
            </button>
          )}
        </div>

        {/* SECTION 1: INTERACTIVE COGNITIVE LOSS LANDSCAPE SIMULATOR */}
        <section
          id="slope-visualizer"
          className="glow-card"
          style={{
            width: '100%',
            maxWidth: '1060px',
            borderRadius: '24px',
            background: 'linear-gradient(180deg, rgba(12, 18, 34, 0.94) 0%, rgba(6, 10, 20, 0.98) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            boxShadow: '0 24px 70px -15px rgba(0, 0, 0, 0.85), 0 0 50px -10px rgba(6, 182, 212, 0.15)',
            padding: '32px',
            boxSizing: 'border-box',
            marginBottom: '90px',
            position: 'relative'
          }}
        >
          {/* Header row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#06b6d4',
                boxShadow: '0 0 12px #06b6d4',
                animation: 'pulseGlow 2s infinite'
              }} />
              <div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  Live Cognitive Loss Landscape &amp; Gradient Trajectory
                </span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace' }}>
                  Real-time interactive probe &bull; Drag slider or click milestone vectors
                </span>
              </div>
            </div>

            {/* Mode Selector Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSelectPreset('current')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: activeSlopePoint === 'current' ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.08)',
                  background: activeSlopePoint === 'current' ? 'rgba(244, 63, 94, 0.18)' : 'rgba(255,255,255,0.02)',
                  color: activeSlopePoint === 'current' ? '#fda4af' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e' }} />
                1. Latent Ridge (High Loss)
              </button>

              <button
                onClick={() => handleSelectPreset('remediation')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: activeSlopePoint === 'remediation' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.08)',
                  background: activeSlopePoint === 'remediation' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.02)',
                  color: activeSlopePoint === 'remediation' ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }} />
                2. &nabla;&theta; Micro-Intervention
              </button>

              <button
                onClick={() => handleSelectPreset('mastery')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: activeSlopePoint === 'mastery' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                  background: activeSlopePoint === 'mastery' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.02)',
                  color: activeSlopePoint === 'mastery' ? '#6ee7b7' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                3. Global Optimum (Mastery)
              </button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div style={{ padding: '28px 0 10px', position: 'relative' }}>
            <svg
              viewBox="0 0 880 270"
              style={{ width: '100%', height: 'auto', overflow: 'visible', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
            >
              <defs>
                <linearGradient id="slopeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="35%" stopColor="#06b6d4" />
                  <stop offset="70%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                <linearGradient id="slopeAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="contourGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(244, 63, 94, 0.18)" />
                  <stop offset="45%" stopColor="rgba(6, 182, 212, 0.25)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0.2)" />
                </linearGradient>

                <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Grid Background within SVG */}
              <rect x="20" y="20" width="840" height="230" fill="url(#gridPattern)" rx="10" />

              {/* Topographical Contour Wireframe Bands */}
              <path d="M 40 75 Q 240 185 440 115 T 840 195" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M 40 105 Q 240 215 440 145 T 840 215" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M 40 135 Q 240 235 440 175 T 840 235" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="4 4" />

              {/* Under-slope Gradient Fill */}
              <path d="M 60 50 C 200 55, 260 210, 460 170 S 700 80, 820 85 L 820 250 L 60 250 Z" fill="url(#contourGrad1)" />

              {/* Main Cognitive Gradient Curve */}
              <path
                d="M 60 50 C 200 55, 260 210, 460 170 S 700 80, 820 85"
                fill="none"
                stroke="url(#slopeLineGrad)"
                strokeWidth="4.5"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 14px rgba(6, 182, 212, 0.7))' }}
              />

              {/* Animated Particle Dash Effect */}
              <path
                d="M 60 50 C 200 55, 260 210, 460 170 S 700 80, 820 85"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="8 32"
                style={{ animation: 'dashMove 2s linear infinite', opacity: 0.7 }}
              />

              {/* Fixed Landmark 1: Latent Peak */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleSelectPreset('current')}>
                <circle cx="100" cy="52" r="12" fill="#f43f5e" opacity="0.25" />
                <circle cx="100" cy="52" r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                <text x="100" y="32" fill="#fda4af" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily='"JetBrains Mono", monospace'>
                  Ridge: Misconception (L=0.92)
                </text>
              </g>

              {/* Fixed Landmark 2: Intervention inflection */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleSelectPreset('remediation')}>
                <circle cx="440" cy="174" r="14" fill="#06b6d4" opacity="0.25" />
                <circle cx="440" cy="174" r="6.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
                <text x="440" y="206" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily='"JetBrains Mono", monospace'>
                  &nabla;&theta; Active Micro-Intervention
                </text>
              </g>

              {/* Fixed Landmark 3: Global Optimum */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleSelectPreset('mastery')}>
                <circle cx="810" cy="85" r="16" fill="#10b981" opacity="0.25" />
                <circle cx="810" cy="85" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                <text x="810" y="65" fill="#6ee7b7" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily='"JetBrains Mono", monospace'>
                  Optimum: 99.6% Mastery
                </text>
              </g>

              {/* DYNAMIC PROBE MARKER (Tracks Slider Value) */}
              <g transform={`translate(${probeCoordinates.x}, ${probeCoordinates.y})`}>
                {/* Tangent slope guide line */}
                <line
                  x1="-30"
                  y1={-slopeTelemetry.gradient * 40}
                  x2="30"
                  y2={slopeTelemetry.gradient * 40}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />

                {/* Outer pulsing ring */}
                <circle r="18" fill="#38bdf8" opacity="0.3" style={{ animation: 'pulseGlow 1.5s infinite' }} />
                {/* Core student twin coordinate */}
                <circle r="8" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />

                {/* Coordinate HUD tag */}
                <rect x="-42" y="-34" width="84" height="20" rx="4" fill="rgba(4, 6, 12, 0.9)" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="-20" fill="#38bdf8" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily='"JetBrains Mono", monospace'>
                  θ = {sliderStep}%
                </text>
              </g>
            </svg>
          </div>

          {/* Interactive Range Slider */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            padding: '16px 20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={16} style={{ color: '#38bdf8' }} />
                Drag Learning Iteration Step (Cognitive Descent Vector &theta;):
              </span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>
                Step {sliderStep} / 100
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderStep}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              style={{
                width: '100%',
                height: '7px',
                borderRadius: '8px',
                accentColor: '#06b6d4',
                cursor: 'pointer',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginTop: '6px' }}>
              <span>Initial Misconception (High Friction)</span>
              <span>Targeted 3-Min Micro-Intervention</span>
              <span>Conceptual Convergence (Mastery)</span>
            </div>
          </div>

          {/* Real-time Dynamic Telemetry HUD */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            background: 'rgba(0, 0, 0, 0.45)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Loss Gradient (&nabla;L / &part;&theta;)
              </span>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: sliderStep < 35 ? '#fda4af' : '#38bdf8',
                marginTop: '4px',
                fontFamily: '"JetBrains Mono", monospace'
              }}>
                {slopeTelemetry.gradient} &nabla;L
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {sliderStep < 35 ? 'Stagnant high error ridge' : sliderStep < 78 ? 'Fastest downward convergence' : 'Zero slope (Optimum reached)'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Cognitive Convergence
              </span>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: sliderStep > 75 ? '#10b981' : '#38bdf8',
                marginTop: '4px',
                fontFamily: '"JetBrains Mono", monospace'
              }}>
                {slopeTelemetry.convergence}%
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Bayesian posterior confidence
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Cognitive Loss L(&theta;)
              </span>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: slopeTelemetry.loss > 0.4 ? '#f43f5e' : '#10b981',
                marginTop: '4px',
                fontFamily: '"JetBrains Mono", monospace'
              }}>
                {slopeTelemetry.loss}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Residual error entropy
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Prescribed Micro-Intervention
              </span>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Zap size={18} style={{ color: '#06b6d4' }} />
                <span>{slopeTelemetry.estTime} min sprint</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
                {sliderStep < 35 ? 'Root prerequisite isolation' : sliderStep < 78 ? 'Targeted procedural recalibration' : 'Verification mastery check'}
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE DIAGNOSTIC X-RAY (TRADITIONAL TEST VS KNOWLEDGE TWIN) */}
        <section
          id="diagnostic-xray"
          style={{
            width: '100%',
            maxWidth: '1060px',
            marginBottom: '90px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#06b6d4'
            }}>
              Interactive Diagnostic X-Ray
            </span>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              margin: '8px 0 12px'
            }}>
              Scores Hide Misconceptions. Knowledge Twin Decodes Them.
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
              Select a STEM discipline below to see how traditional grading misses root causes, while Knowledge Twin constructs an actionable cognitive diagnosis.
            </p>

            {/* Subject Selector Tabs */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '24px',
              gap: '6px'
            }}>
              {(['algebra', 'calculus', 'physics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedSubjectTab(tab)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: 'none',
                    background: selectedSubjectTab === tab ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'transparent',
                    color: selectedSubjectTab === tab ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab === 'algebra' ? '📐 High School Algebra' : tab === 'calculus' ? '📈 AP Calculus' : '⚡ University Physics'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Inspection Card */}
          <div className="glow-card" style={{
            background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.9) 0%, rgba(8, 12, 22, 0.95) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '28px',
            boxSizing: 'border-box'
          }}>
            {/* Problem Header */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              padding: '18px 22px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 800 }}>
                Diagnostic Question &bull; {diagnosticScenarios[selectedSubjectTab].title}
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '6px 0 10px', fontFamily: '"JetBrains Mono", monospace' }}>
                {diagnosticScenarios[selectedSubjectTab].problem}
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Student Submitted: </span>
                  <span style={{ color: '#f43f5e', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                    {diagnosticScenarios[selectedSubjectTab].studentAnswer}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Expected Solution: </span>
                  <span style={{ color: '#10b981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                    {diagnosticScenarios[selectedSubjectTab].correctAnswer}
                  </span>
                </div>
              </div>
            </div>

            {/* Split Comparison Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Old Traditional Testing */}
              <div style={{
                background: 'rgba(244, 63, 94, 0.04)',
                borderRadius: '16px',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                padding: '24px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertTriangle size={18} style={{ color: '#f43f5e' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f43f5e', textTransform: 'uppercase' }}>
                    Traditional LMS / Testing
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Grading Output</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fda4af', marginTop: '2px' }}>
                    {diagnosticScenarios[selectedSubjectTab].traditionalResult.score}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Feedback Provided</span>
                  <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.5 }}>
                    "{diagnosticScenarios[selectedSubjectTab].traditionalResult.feedback}"
                  </p>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(244, 63, 94, 0.15)',
                  fontSize: '0.78rem',
                  color: '#fda4af',
                  fontWeight: 600
                }}>
                  Result: {diagnosticScenarios[selectedSubjectTab].traditionalResult.friction}. Student doesn't understand the underlying breakdown.
                </div>
              </div>

              {/* Knowledge Twin AI Diagnostic */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.06)',
                borderRadius: '16px',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                padding: '24px',
                position: 'relative',
                boxShadow: '0 8px 30px rgba(6, 182, 212, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={18} style={{ color: '#06b6d4' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      Knowledge Twin AI Diagnostics
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#6ee7b7',
                    fontWeight: 700,
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    {diagnosticScenarios[selectedSubjectTab].twinResult.confidenceScore}
                  </span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Identified Misconception Pattern</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                    {diagnosticScenarios[selectedSubjectTab].twinResult.pattern}
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#38bdf8',
                    fontFamily: '"JetBrains Mono", monospace'
                  }}>
                    Type: {diagnosticScenarios[selectedSubjectTab].twinResult.classification}
                  </span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Root Prerequisite Fault</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cbd5e1', marginTop: '2px' }}>
                    {diagnosticScenarios[selectedSubjectTab].twinResult.rootPrerequisite}
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  fontSize: '0.82rem',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <Zap size={16} style={{ color: '#06b6d4', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#38bdf8' }}>Prescribed Micro-Intervention:</strong>{' '}
                    {diagnosticScenarios[selectedSubjectTab].twinResult.remedy}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: INTERACTIVE SKILL TOPOLOGY & DEPENDENCY GRAPH */}
        <section
          id="skill-topology"
          style={{
            width: '100%',
            maxWidth: '1060px',
            marginBottom: '90px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#10b981'
            }}>
              Topological Knowledge Graphs
            </span>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              margin: '8px 0 12px'
            }}>
              Click Any Node in the Prerequisite Network
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
              Concepts do not live in silos. Explore how a misconception in an upstream node cascades down into advanced topics.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Interactive Node Map */}
            <div className="glow-card" style={{
              background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.9) 0%, rgba(8, 12, 22, 0.95) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '24px',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Prerequisite Skill DAG</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select node to inspect</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topologyNodes.map((node) => {
                  const isSelected = selectedNode === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.25)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: node.statusColor,
                          boxShadow: `0 0 8px ${node.statusColor}`
                        }} />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                            {node.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace' }}>
                            {node.code} &bull; Prereq: {node.prereq}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: node.statusColor,
                          fontFamily: '"JetBrains Mono", monospace'
                        }}>
                          {node.mastery}%
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{node.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Node Deep Inspector */}
            <div className="glow-card" style={{
              background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.9) 0%, rgba(8, 12, 22, 0.95) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              padding: '28px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: topologyNodes[selectedNode].statusColor,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: `${topologyNodes[selectedNode].statusColor}18`,
                    border: `1px solid ${topologyNodes[selectedNode].statusColor}44`
                  }}>
                    {topologyNodes[selectedNode].status}
                  </span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.78rem', color: '#64748b' }}>
                    {topologyNodes[selectedNode].code}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                  {topologyNodes[selectedNode].title}
                </h3>

                <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '22px' }}>
                  {topologyNodes[selectedNode].desc}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Posterior Mastery Probability</span>
                    <span style={{ color: topologyNodes[selectedNode].statusColor, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace' }}>
                      {topologyNodes[selectedNode].mastery}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${topologyNodes[selectedNode].mastery}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, #0284c7, ${topologyNodes[selectedNode].statusColor})`,
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Cognitive Diagnostics Summary */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                    Dependency Topology Analysis
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                    {selectedNode === 2 ? (
                      <span style={{ color: '#fda4af' }}>
                        &bull; Critical bottleneck: 74% of downstream failures in Polynomial Factoring originate from this unaddressed sign error ridge.
                      </span>
                    ) : selectedNode === 4 ? (
                      <span style={{ color: '#fcd34d' }}>
                        &bull; Locked by prerequisite friction in SK-ALG-03. Resolving distributive expansion will unlock 85% expected mastery here.
                      </span>
                    ) : (
                      <span style={{ color: '#6ee7b7' }}>
                        &bull; Prerequisite foundations verified. Low cognitive friction detected on this pathway.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={onGetStarted}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(6, 182, 212, 0.35)'
                }}
              >
                <span>Launch Diagnostic on {topologyNodes[selectedNode].title}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: PLATFORM ARCHITECTURE & CAPABILITIES (TABS) */}
        <section
          id="architecture"
          style={{
            width: '100%',
            maxWidth: '1060px',
            marginBottom: '90px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#38bdf8'
            }}>
              System Architecture
            </span>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              margin: '8px 0 12px'
            }}>
              Built for Cognitive Precision
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
              Four core engineering pillars powering the modern continuous knowledge twin runtime.
            </p>

            {/* Feature Tabs */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '24px'
            }}>
              {[
                { id: 'twin', label: '1. Neural Cognitive Twin', icon: Brain },
                { id: 'remediation', label: '2. Micro-Interventions', icon: Zap },
                { id: 'teacher', label: '3. Teacher Telemetry', icon: BarChart3 },
                { id: 'ingestion', label: '4. Dynamic Ingestion', icon: BookOpen }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFeatureTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFeatureTab(tab.id as any)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: isActive ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Preview Card */}
          <div className="glow-card" style={{
            background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.92) 0%, rgba(6, 10, 20, 0.96) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            padding: '36px',
            boxSizing: 'border-box'
          }}>
            {activeFeatureTab === 'twin' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Continuous State Estimation
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 14px' }}>
                    Probabilistic Bayesian Knowledge Tracing &amp; Memory
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.65, marginBottom: '20px' }}>
                    Unlike static grades that expire the moment a test is handed in, your Knowledge Twin is a living digital twin. Every solved problem, step hesitation, and error pattern updates an underlying Bayesian belief network.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Ebbinghaus memory decay curves model long-term retention
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      LLM-powered reasoning maps raw student responses to specific error taxonomy
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Transparent confidence scores with full mathematical explainability
                    </li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', marginBottom: '12px' }}>
                    &gt; RUNTIME: TWIN_ESTIMATE_STATE()
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.82rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>p(Mastery | Evidence): </span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>0.892 (High)</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Slip Probability (S): </span>
                      <span style={{ color: '#38bdf8' }}>0.081</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Guess Probability (G): </span>
                      <span style={{ color: '#38bdf8' }}>0.042</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Active Misconception: </span>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>None (Converged)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'remediation' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase' }}>
                    Cognitive Efficiency
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 14px' }}>
                    3-Minute Micro-Interventions
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.65, marginBottom: '20px' }}>
                    Nobody learns well when forced to rewatch a 45-minute lecture for a 30-second sign mistake. Knowledge Twin serves targeted, laser-focused micro-sprints that tackle the exact faulty rule representation.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Visual contrastive examples showing Right vs Wrong side-by-side
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Instant 2-step verification check to confirm cognitive knot resolution
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      89% drop in repeated diagnostic errors across subsequent problem sets
                    </li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Zap size={18} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>Targeted Remediation Sprint</span>
                  </div>
                  <div style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.85rem',
                    color: '#e2e8f0',
                    lineHeight: 1.5,
                    marginBottom: '12px'
                  }}>
                    "Remember: when multiplying a negative coefficient into brackets, each internal term inverts its sign: <code style={{ color: '#38bdf8' }}>-a(b - c) = -ab + ac</code>."
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Estimated Duration: 2.5 mins</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>Instant Retest Available</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'teacher' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase' }}>
                    Instructor Cockpit
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 14px' }}>
                    Classroom Friction Heatmaps
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.65, marginBottom: '20px' }}>
                    Instructors gain supernatural visibility into collective misunderstandings. Instead of wondering why a midterm average dropped, the Teacher Dashboard highlights exactly which prerequisite node stalled 42% of students.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Aggregated cohort misconception rankings with one-click group intervention
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Automatic peer study group pairing by complementary skill vectors
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Real-time live assessment monitoring during classroom lectures
                    </li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                    Classroom Cohort Friction Radar
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#e2e8f0' }}>Distributive Property Negatives</span>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>42% Stalled</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                      <div style={{ width: '42%', height: '100%', background: '#f43f5e', borderRadius: '4px' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
                      <span style={{ color: '#e2e8f0' }}>Linear Elimination Steps</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>21% Stalled</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                      <div style={{ width: '21%', height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
                      <span style={{ color: '#e2e8f0' }}>Basic Order of Operations</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>4% (Healthy)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                      <div style={{ width: '4%', height: '100%', background: '#10b981', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'ingestion' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                    Automated Curriculum Engine
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 14px' }}>
                    Drop Any Syllabus or Textbook PDF
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.65, marginBottom: '20px' }}>
                    No manual question entry required. The Knowledge Twin Ingestion Pipeline extracts concepts, parses prerequisite hierarchies, and generates calibrated diagnostic assessments automatically.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Parses PDFs, Word docs, PowerPoint lecture decks, and markdown
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Generates prerequisite dependency graphs with auto-order sequencing
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      Synthesizes step-by-step diagnostic questions with verified distractors
                    </li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px dashed rgba(6, 182, 212, 0.4)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <BookOpen size={24} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    Curriculum Document Ingested
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', marginBottom: '14px' }}>
                    Linear_Algebra_Chapter4.pdf &bull; 42 pages
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#6ee7b7',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    <CheckCircle2 size={14} /> 6 Skills &bull; 18 Diagnostic Questions Synthesized
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: PROVEN IMPACT METRICS */}
        <section style={{
          width: '100%',
          maxWidth: '1060px',
          marginBottom: '90px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            <div className="glow-card" style={{
              background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.7) 0%, rgba(6, 10, 20, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '28px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                color: '#38bdf8',
                letterSpacing: '-0.03em',
                fontFamily: '"JetBrains Mono", monospace'
              }}>
                3.4x
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 4px' }}>
                Faster Convergence
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Compared to linear textbook review
              </div>
            </div>

            <div className="glow-card" style={{
              background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.7) 0%, rgba(6, 10, 20, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '28px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                color: '#10b981',
                letterSpacing: '-0.03em',
                fontFamily: '"JetBrains Mono", monospace'
              }}>
                89%
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 4px' }}>
                Fewer Repeat Errors
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Misconceptions resolved permanently
              </div>
            </div>

            <div className="glow-card" style={{
              background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.7) 0%, rgba(6, 10, 20, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '28px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                color: '#a855f7',
                letterSpacing: '-0.03em',
                fontFamily: '"JetBrains Mono", monospace'
              }}>
                &lt; 3.5m
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 4px' }}>
                Intervention Length
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Zero cognitive fatigue or boredom
              </div>
            </div>

            <div className="glow-card" style={{
              background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.7) 0%, rgba(6, 10, 20, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '28px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                color: '#f59e0b',
                letterSpacing: '-0.03em',
                fontFamily: '"JetBrains Mono", monospace'
              }}>
                99.4%
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 4px' }}>
                Diagnostic Precision
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Accurate root-cause identification
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: INTERACTIVE FAQ ACCORDION */}
        <section
          id="faqs"
          style={{
            width: '100%',
            maxWidth: '860px',
            marginBottom: '90px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#38bdf8'
            }}>
              Frequently Asked Questions
            </span>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.8vw, 2.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              margin: '8px 0 12px'
            }}>
              Everything You Need to Know
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    background: 'rgba(14, 20, 36, 0.7)',
                    borderRadius: '14px',
                    border: isOpen ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 8px 30px rgba(6, 182, 212, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: isOpen ? '#38bdf8' : '#ffffff' }}>
                      {faq.q}
                    </span>
                    {isOpen ? <ChevronUp size={20} style={{ color: '#38bdf8', flexShrink: 0 }} /> : <ChevronDown size={20} style={{ color: '#64748b', flexShrink: 0 }} />}
                  </div>

                  {isOpen && (
                    <p style={{
                      marginTop: '14px',
                      fontSize: '0.92rem',
                      lineHeight: 1.6,
                      color: '#94a3b8',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: '12px'
                    }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM HERO CTA SECTION */}
        <section style={{
          width: '100%',
          maxWidth: '1060px',
          borderRadius: '24px',
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.18) 0%, rgba(2, 132, 199, 0.08) 50%, rgba(4, 6, 12, 0.95) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          padding: '60px 32px',
          textAlign: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            fontSize: '0.78rem',
            fontWeight: 800,
            marginBottom: '20px'
          }}>
            <Sparkles size={14} />
            <span>Ready to Transform How You Learn?</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            marginBottom: '18px'
          }}>
            Build Your Knowledge Twin in 60 Seconds
          </h2>

          <p style={{
            fontSize: '1.1rem',
            color: '#94a3b8',
            maxWidth: '620px',
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Take a 3-question diagnostic probe. Watch your real-time cognitive loss landscape generate instantly.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onGetStarted}
              style={{
                padding: '16px 36px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                color: '#ffffff',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 30px rgba(6, 182, 212, 0.5)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <span>Initialize My Twin</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onNavigateToLogin}
              style={{
                padding: '16px 28px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#e2e8f0',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <LogIn size={18} />
              <span>Log In as Demo Student</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#020408',
        padding: '36px 24px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Cpu size={16} />
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
              Knowledge <span style={{ color: '#38bdf8' }}>Twin</span>
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              &bull; AI Cognitive Loss Landscape &amp; Slope Architecture
            </span>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: '#64748b' }}>
            <span>Continuous Diagnostics</span>
            <span>&bull;</span>
            <span>Bayesian Knowledge Tracing</span>
            <span>&bull;</span>
            <span>DAG Prerequisite Topologies</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
