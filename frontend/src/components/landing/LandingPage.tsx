import React from 'react';
import { ArrowRight, BookOpen, Sparkles, LogIn, Compass, Target, CheckCircle2 } from 'lucide-react';

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
  return (
    <div className="bg-[#050505] text-white min-h-screen flex flex-col selection:bg-purple-800 selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Micro-animations CSS inline for high fidelity */}
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        @keyframes warmLampGlow {
          0%, 100% { opacity: 0.45; transform: scale(0.98); filter: blur(50px); }
          50% { opacity: 0.75; transform: scale(1.08); filter: blur(65px); }
        }
        @keyframes purpleAmbientGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); filter: blur(60px); }
          50% { opacity: 0.58; transform: scale(1.08); filter: blur(72px); }
        }
        @keyframes lampBreathingPulse {
          0%, 100% { opacity: 0.55; transform: scale(0.95); }
          50% { opacity: 0.95; transform: scale(1.08); }
        }
        @keyframes writingMotion {
          0% { transform: translate(0px, 0px); opacity: 0.7; }
          25% { transform: translate(7px, 3px); opacity: 1; }
          50% { transform: translate(3px, 6px); opacity: 0.85; }
          75% { transform: translate(11px, 2px); opacity: 1; }
          100% { transform: translate(0px, 0px); opacity: 0.7; }
        }
        @keyframes pencilGlowFlicker {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(254, 240, 138, 0.8)) drop-shadow(0 0 10px rgba(234, 179, 8, 0.6));
            opacity: 0.8;
          }
          30% {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 16px rgba(234, 179, 8, 0.9));
            opacity: 1;
          }
          70% {
            filter: drop-shadow(0 0 5px rgba(254, 240, 138, 0.85)) drop-shadow(0 0 12px rgba(234, 179, 8, 0.7));
            opacity: 0.85;
          }
        }
        .hero-float-container {
          animation: heroFloat 6.5s ease-in-out infinite;
          will-change: transform;
        }
        .hero-glow-warm {
          animation: warmLampGlow 5.5s ease-in-out infinite;
          background: radial-gradient(circle at 35% 42%, rgba(234, 179, 8, 0.48) 0%, rgba(245, 158, 11, 0.22) 40%, transparent 72%);
        }
        .hero-glow-purple {
          animation: purpleAmbientGlow 7s ease-in-out infinite 0.6s;
          background: radial-gradient(circle at 65% 58%, rgba(104, 0, 203, 0.45) 0%, rgba(120, 14, 221, 0.2) 45%, transparent 75%);
        }
        .seamless-hero-img-wrap {
          mask-image: radial-gradient(ellipse 75% 72% at 50% 50%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0.85) 60%, rgba(0, 0, 0, 0.25) 80%, transparent 98%);
          -webkit-mask-image: radial-gradient(ellipse 75% 72% at 50% 50%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0.85) 60%, rgba(0, 0, 0, 0.25) 80%, transparent 98%);
        }
        .btn-violet {
          background-color: #6800CB;
          transition: all 0.2s ease;
          box-shadow: 0 4px 18px rgba(104, 0, 203, 0.35);
        }
        .btn-violet:hover {
          background-color: #780edd;
          box-shadow: 0 6px 24px rgba(104, 0, 203, 0.55);
          transform: translateY(-1px);
        }
        .btn-outline {
          border: 1px solid rgba(255, 255, 255, 0.22);
          transition: all 0.2s ease;
        }
        .btn-outline:hover {
          background-color: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }
      `}</style>

      {/* BEGIN: NavigationBar */}
      <header className="w-full bg-[#050505] border-b border-neutral-900/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 h-20 flex items-center justify-between">
          {/* Brand Logo Lockup */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onGetStarted}>
            <img
              alt="Knowledge Twin Logo"
              className="h-10 md:h-12 w-auto object-contain"
              src="/knowledge-twin-logo.png"
              onError={(e) => {
                // Fallback text if logo fails
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6800cb] shadow-[0_0_10px_#8b2cf5]" />
              Knowledge <span className="text-[#a855f7]">Twin</span>
            </span>
          </div>

          {/* Primary Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-10 text-sm font-medium text-neutral-400">
            <button
              onClick={onViewCurriculum || onGetStarted}
              className="hover:text-white transition-colors duration-150"
            >
              Curriculum
            </button>
            <a href="#makers" className="hover:text-white transition-colors duration-150">
              Makers
            </a>
            <a href="#outcomes" className="hover:text-white transition-colors duration-150">
              Outcomes
            </a>
            <a href="#pricing" className="hover:text-white transition-colors duration-150">
              Pricing
            </a>
          </nav>

          {/* Right Header Actions (Auth & Get Started) */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={onNavigateToLogin}
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors duration-150"
            >
              Log In
            </button>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors duration-150 shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>
      {/* END: NavigationBar */}

      {/* BEGIN: HeroSection */}
      <main className="flex-1 flex flex-col justify-center py-10 lg:py-16">
        <section className="max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Visual Chalk Artwork with blended ambient lighting */}
            <div className="lg:col-span-6 flex justify-center lg:justify-start">
              <div className="relative w-full max-w-lg hero-float-container">
                {/* Ambient dynamic backdrops */}
                <div className="absolute -inset-10 rounded-full hero-glow-warm pointer-events-none" />
                <div className="absolute -inset-14 rounded-full hero-glow-purple pointer-events-none" />
                
                {/* Illustration Card Frame */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#070709] shadow-2xl p-2">
                  <div className="seamless-hero-img-wrap relative flex items-center justify-center overflow-hidden rounded-xl bg-black">
                    <img
                      src="/hero-chalk-student.png"
                      alt="Student studying attentively under warm desk lamp"
                      className="w-full h-auto max-h-[480px] object-contain select-none"
                    />
                    
                    {/* Synchronized light overlays */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(ellipse 55% 50% at 38% 46%, rgba(254, 240, 138, 0.22) 0%, rgba(234, 179, 8, 0.12) 40%, transparent 80%)',
                        mixBlendMode: 'screen'
                      }}
                    />
                    <div
                      className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#090810]/85 border border-white/10 backdrop-blur-md flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold text-zinc-200">
                          Active Cognitive Diagnostics
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-300">
                        100% Individualized
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Content & Call to Actions */}
            <div className="lg:col-span-6 flex flex-col items-start justify-center">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6">
                <Sparkles size={14} className="text-[#EAB308]" />
                <span>Next-Generation Adaptive Learning</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] leading-[1.08] font-bold tracking-tight text-white mb-6">
                Education<br />
                Built Around<br />
                <span className="text-[#EAB308]">Your Hands.</span>
              </h1>

              {/* Body Description */}
              <p className="text-base sm:text-lg lg:text-[19px] text-[#A3A3A3] leading-relaxed max-w-xl font-normal mb-8 lg:mb-10">
                A non-linear space where mentorship matches momentum. We've cast off the old syllabus to build support systems that actually hold you up.
              </p>

              {/* Action Buttons Group */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-5 w-full sm:w-auto">
                {/* Primary CTA */}
                <button
                  onClick={onGetStarted}
                  className="btn-violet text-white text-xs sm:text-sm font-bold tracking-wider px-7 py-3.5 rounded-lg text-center uppercase inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>JOIN THE COHORT</span>
                  <ArrowRight size={16} />
                </button>

                {/* Secondary Outline CTA */}
                <button
                  onClick={onViewCurriculum || onGetStarted}
                  className="btn-outline text-white text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-lg text-center inline-flex items-center justify-center cursor-pointer"
                >
                  View Curriculum
                </button>
              </div>

              {/* Value metric pills */}
              <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6 w-full max-w-lg text-left">
                <div>
                  <div className="text-2xl font-extrabold text-white">48+</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Active Cohorts</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-purple-400">92%</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Mastery Retention</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#EAB308]">1:1</div>
                  <div className="text-xs text-zinc-400 mt-0.5">AI Twin Modeling</div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Section: How It Works / Curriculum Highlights */}
        <section id="curriculum" className="max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 mt-24 pt-16 border-t border-white/5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-widest text-purple-400 uppercase">
              How Knowledge Twin Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Beyond flat scores. Real understanding.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-3">
              Two students can get the same test score for entirely different reasons. Knowledge Twin pinpoints the exact cognitive misconception.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0c0c10] border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">01 / Concept Discovery</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Explore interactive subjects and chapters at your own pace without rigid, linear constraints.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c0c10] border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
                <Compass size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">02 / Deep Diagnostics</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Our diagnostic engine doesn't just grade right or wrong—it uncovers the underlying conceptual patterns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c0c10] border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
                <Target size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">03 / Precision Remediation</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Get targeted 3-minute targeted micro-interventions that resolve root prerequisites effortlessly.
              </p>
            </div>
          </div>
        </section>
      </main>
      {/* END: HeroSection */}

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-xs text-zinc-500 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6800cb]" />
            <span className="font-semibold text-zinc-300">Knowledge Twin</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-zinc-500">Education Built Around Your Hands.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
