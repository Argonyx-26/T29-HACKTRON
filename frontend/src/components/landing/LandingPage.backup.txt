import React from 'react';
import { ArrowRight, BookOpen, Brain, Compass, Sparkles, Target } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onGetStarted: () => void;
  onViewCurriculum?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onGetStarted }) => (
  <div className="landing-viewport">
    <div className="landing-frame">
      <header className="landing-header">
        <a className="landing-brand" href="#top" aria-label="Knowledge Twin home">
          <img src="/knowledge-twin-wordmark.png" alt="Knowledge Twin" />
        </a>
        <nav className="landing-section-nav" aria-label="Explore Knowledge Twin">
          <a href="#how-it-works">How it works</a>
          <a href="#outcomes">Outcomes</a>
        </nav>
        <nav className="landing-actions" aria-label="Main navigation">
          <button className="landing-login" onClick={onNavigateToLogin}>Log In</button>
          <button className="landing-get-started" onClick={onGetStarted}>Get Started</button>
        </nav>
      </header>

      <main id="top" className="landing-hero">
        <div className="landing-art-wrap">
          <video className="landing-art landing-video" autoPlay muted loop playsInline preload="metadata" poster="/hero-chalk-student.png" aria-label="Student studying at a desk under a lamp">
            <source src="/studying-hero.mp4" type="video/mp4" />
          </video>
        </div>

        <section className="landing-copy" aria-labelledby="landing-title">
          <h1 id="landing-title" className="landing-title">
            <span className="landing-line line-one">Your Score is Only</span>
            <span className="landing-line line-two">The Surface.</span>
            <span className="landing-line landing-accent line-three">Understand How You</span>
            <span className="landing-line landing-accent line-four">Learn.</span>
          </h1>
          <p className="landing-description">Knowledge Twin learns from your answers, identifies where your understanding breaks down, and adapts what you learn next.</p>
          <div className="landing-hero-actions">
            <button className="landing-primary-cta" onClick={onGetStarted}>Build My Knowledge Twin</button>
            <button className="landing-secondary-cta" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>See How It Works</button>
          </div>
        </section>
      </main>

      <section id="how-it-works" className="landing-section">
        <header className="landing-section-heading">
          <span className="landing-section-eyebrow">A CLEARER WAY TO LEARN</span>
          <h2>Understand the why.<br /><span>Then master the what.</span></h2>
          <p>Knowledge Twin turns every answer into useful guidance, so you know what to practice and why it matters.</p>
        </header>
        <div className="landing-step-grid">
          <article className="landing-info-card"><span className="landing-info-icon"><BookOpen size={21} /></span><small>01 / LEARN</small><h3>Start with what interests you</h3><p>Explore a topic or bring your own learning material. Move at your pace and build understanding as you go.</p></article>
          <article className="landing-info-card"><span className="landing-info-icon"><Brain size={21} /></span><small>02 / UNDERSTAND</small><h3>See beyond the score</h3><p>Short diagnostics uncover the concepts behind your answers and identify misconceptions a score can miss.</p></article>
          <article className="landing-info-card"><span className="landing-info-icon"><Target size={21} /></span><small>03 / GROW</small><h3>Practice the right next step</h3><p>Your Knowledge Twin highlights skills to strengthen and guides you through focused practice.</p></article>
        </div>
      </section>

      <section id="outcomes" className="landing-outcomes-section">
        <div className="landing-outcomes-copy"><span className="landing-section-eyebrow">A BETTER VIEW OF PROGRESS</span><h2>Progress that shows<br /><span>how you think.</span></h2><p>See your strengths, skill confidence, and learning gaps together. Each response adds evidence to a living picture of your understanding.</p><button className="landing-inline-link" onClick={onGetStarted}>Build your Knowledge Twin <ArrowRight size={16} /></button></div>
        <div className="landing-twin-visual"><div className="twin-orbit orbit-one" /><div className="twin-orbit orbit-two" /><div className="twin-core"><Sparkles size={28} /><strong>Your Twin</strong><small>Learning with you</small></div><div className="twin-skill skill-one"><Compass size={16} />Skill mastery</div><div className="twin-skill skill-two"><Target size={16} />Next steps</div><div className="twin-skill skill-three"><Brain size={16} />Understanding</div></div>
      </section>

      <footer className="landing-footer"><a href="#top" className="landing-footer-brand"><img src="/knowledge-twin-wordmark.png" alt="Knowledge Twin" /></a><span>Understand more with every answer.</span><button onClick={onNavigateToLogin}>Log In</button></footer>
    </div>
  </div>
);

export default LandingPage;
