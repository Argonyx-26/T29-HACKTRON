import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap, UserCheck, TrendingUp, CheckCircle2, FileText, Users } from 'lucide-react';
import { User } from '../../types';
import { learningRepository } from '../../services/learningRepository';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onBackToLanding?: () => void;
}

export const KnowledgeTwinLogo: React.FC<{ className?: string; onClick?: () => void }> = ({ className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`knowledge-twin-logo flex items-center gap-2.5 select-none cursor-pointer group transition-transform duration-200 hover:scale-105 ${className}`}
      title="Knowledge Twin — Return to Landing"
    >
      <img src="/knowledge-twin-wordmark.png" alt="Knowledge Twin" className="shared-wordmark" />
      <div className="relative flex items-center justify-center">
        {/* Glow aura */}
        <div className="absolute w-7 h-7 rounded-full bg-[#9333ea]/50 blur-sm pointer-events-none group-hover:bg-[#9333ea]/80 transition-all" />
        <svg className="w-7 h-7 relative z-10" viewBox="0 0 36 36" fill="none">
          {/* Outer orbital ring */}
          <ellipse cx="18" cy="18" rx="14" ry="6.5" transform="rotate(-30 18 18)" stroke="#c084fc" strokeWidth="1.8" strokeDasharray="3 1.5" opacity="0.9" />
          {/* Inner orbital ring */}
          <ellipse cx="18" cy="18" rx="14" ry="6.5" transform="rotate(45 18 18)" stroke="#9333ea" strokeWidth="1.8" />
          {/* Core nucleus glow */}
          <circle cx="18" cy="18" r="4.5" fill="#f3e8ff" />
          <circle cx="18" cy="18" r="2.5" fill="#a855f7" />
        </svg>
      </div>
      <div className="flex items-center font-bold tracking-wider text-xs sm:text-sm font-sans">
        <span className="text-white">KNOWLEDGE</span>
        <span className="text-[#a855f7] ml-1.5 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">TWIN</span>
      </div>
    </div>
  );
};

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBackToLanding }) => {
  const existingUser = learningRepository.getLastUser();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');

  const handleRoleChange = (newRole: 'student' | 'teacher') => {
    setRole(newRole);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let displayName = name.trim();
    if (!displayName) {
      if (email.includes('@')) {
        const username = email.split('@')[0];
        displayName = username.charAt(0).toUpperCase() + username.slice(1);
        if (displayName.toLowerCase() === 'student') displayName = existingUser?.display_name || 'Aarav Sharma';
        if (displayName.toLowerCase() === 'teacher') displayName = 'Dr. Vance';
      } else {
        displayName = email.trim() || (role === 'student' ? 'Student' : 'Teacher');
      }
    }

    const user = learningRepository.saveUser(displayName, role);
    onLogin(user);
  };

  const handleSocialLogin = (provider: string) => {
    const defaultName = role === 'student' ? (existingUser?.display_name || 'Aarav Sharma') : 'Dr. Vance';
    const user = learningRepository.saveUser(defaultName, role);
    onLogin(user);
  };

  return (
    <div
      className="login-page min-h-screen w-full text-white flex flex-col justify-between p-4 sm:p-8 md:px-12 relative overflow-hidden select-none font-sans"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Top Navigation Header */}
      <header className="login-header relative z-20 w-full max-w-[1400px] mx-auto flex items-center justify-between py-2">
        {/* Knowledge Twin Vector Logo Lockup */}
        <KnowledgeTwinLogo className="login-brand" onClick={onBackToLanding} />

        {/* Top Right Action: New here? Create Account */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-[#a3a3a3] font-medium hidden sm:inline-block">
            {isRegisterMode ? 'Already have an account?' : 'New here?'}
          </span>
          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="login-create-account text-xs sm:text-sm text-white bg-[#1c1b22] hover:bg-[#282732] border border-white/10 transition-all duration-200 px-5 py-2 rounded-full shadow-sm hover:shadow-[#6800cb]/30 hover:border-purple-500/40 cursor-pointer font-medium"
            type="button"
          >
            {isRegisterMode ? 'Log In' : 'Create Account'}
          </button>
        </div>
      </header>

      {/* Main Split-Screen Layout */}
      <div className="login-main relative z-10 w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6">
        
        {/* Left Visual: Glowing Neon Reader Woman */}
        <div className="login-art-column lg:col-span-6 flex flex-col items-center justify-center relative min-h-[460px] lg:min-h-[700px]">
          <div className="login-art-stage relative w-full max-w-[670px] h-[460px] lg:h-[700px] flex items-center justify-center overflow-visible">
            {/* Background subtle purple aura */}
            <div className="absolute w-[380px] h-[380px] bg-[#6800cb]/30 rounded-full blur-[110px] pointer-events-none -z-10" />
            
            <img
              src="/neon-reader.png"
              alt="Student reading book illuminated in purple neon glow"
              className="login-illustration w-full h-full object-contain filter pointer-events-none select-none drop-shadow-[0_0_35px_rgba(104,0,203,0.5)] transition-transform duration-500"
              style={{
                mixBlendMode: 'screen',
                maskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 99%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 99%)'
              }}
            />
            <div className="login-art-note art-note-one"><TrendingUp size={18} /><span>Personalized<br />Learning</span></div>
            <div className="login-art-note art-note-two"><CheckCircle2 size={19} /><span>Track<br />Progress</span></div>
            <div className="login-art-note art-note-three"><FileText size={18} /><span>Create<br />&amp; Share</span></div>
            <div className="login-art-note art-note-four"><Users size={19} /><span>Make an<br />Impact</span></div>
          </div>
        </div>

        {/* Right Card: Authentication Box */}
        <div className="login-form-column lg:col-span-6 flex justify-center lg:justify-end w-full">
          <div
            className="login-card w-full max-w-[596px] rounded-3xl p-7 sm:p-10 relative overflow-hidden transition-all duration-300"
          >
            {/* Top Precision Specular Rim Light */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(192, 132, 252, 0.5), transparent)' }}
            />
            
            {/* Subtle High-Fidelity Glow Auras */}
            <div
              className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-[90px] pointer-events-none"
              style={{ background: 'rgba(104, 0, 203, 0.25)' }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
              style={{ background: 'rgba(109, 17, 173, 0.18)' }}
            />

            {/* Card Header Titles */}
            <div className="text-center mb-7 relative z-10">
              <h1 className="text-[32px] sm:text-[34px] leading-tight font-bold text-white tracking-tight mb-2">
                {isRegisterMode ? 'Create Your ' : 'Welcome '}
                <span
                  className="text-transparent bg-clip-text drop-shadow-[0_2px_14px_rgba(168,85,247,0.5)]"
                  style={{ backgroundImage: 'linear-gradient(135deg, rgb(192, 132, 252) 0%, rgb(224, 182, 255) 50%, rgb(147, 51, 234) 100%)' }}
                >
                  {isRegisterMode ? 'Account' : 'Back'}
                </span>
              </h1>
              <p className="text-[14px] font-medium tracking-wide text-[#a3a3a3]">
                {isRegisterMode ? 'Begin your personalized cognitive journey' : 'Continue your learning journey'}
              </p>
            </div>

            {/* Role Toggle Selector (Capsule Segmented Pill) */}
            <div
              className="relative z-10 grid grid-cols-2 p-1 rounded-full mb-6 shadow-inner"
              style={{ background: 'rgba(10, 9, 13, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                  role === 'student'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={
                  role === 'student'
                    ? {
                        background: 'rgb(104, 0, 203)',
                        border: '1px solid rgba(215, 186, 255, 0.3)',
                        boxShadow: 'rgba(104, 0, 203, 0.5) 0px 4px 16px, rgba(104, 0, 203, 0.3) 0px 0px 12px'
                      }
                    : {}
                }
              >
                <GraduationCap size={18} />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                  role === 'teacher'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={
                  role === 'teacher'
                    ? {
                        background: 'rgb(104, 0, 203)',
                        border: '1px solid rgba(215, 186, 255, 0.3)',
                        boxShadow: 'rgba(104, 0, 203, 0.5) 0px 4px 16px, rgba(104, 0, 203, 0.3) 0px 0px 12px'
                      }
                    : {}
                }
              >
                <UserCheck size={18} />
                <span>Teacher</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10">
              {/* Name field if register mode */}
              {isRegisterMode && (
                <div className="space-y-1.5">
                  <div
                    className="login-field group relative flex items-center rounded-xl transition-all duration-200 focus-within:border-purple-500/60"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <input
                      className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 py-3.5 px-4 rounded-xl focus:outline-none tracking-wide"
                      placeholder="Full Name"
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <div
                  className="login-field group relative flex items-center rounded-xl transition-all duration-200 focus-within:border-purple-500/60"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <Mail size={18} className="login-field-icon absolute left-4 text-gray-400 group-focus-within:text-purple-300 transition-colors pointer-events-none" />
                  <input
                    className="login-field-input w-full bg-transparent text-sm text-white placeholder:text-gray-500 py-3.5 pl-12 pr-4 rounded-xl focus:outline-none tracking-wide"
                    placeholder="Email address"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div
                  className="login-field group relative flex items-center rounded-xl transition-all duration-200 focus-within:border-purple-500/60"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <Lock size={18} className="login-field-icon absolute left-4 text-gray-400 group-focus-within:text-purple-300 transition-colors pointer-events-none" />
                  <input
                    className="login-field-input w-full bg-transparent text-sm text-white placeholder:text-gray-500 py-3.5 pl-12 pr-12 rounded-xl focus:outline-none tracking-wide"
                    placeholder="Password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-password-toggle absolute right-3.5 text-gray-400 hover:text-white focus:outline-none p-1.5 rounded-lg hover:bg-white/[0.06] transition-all cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Options Row (Remember Me & Forgot Password) */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#1c1b22] border-white/20 text-[#6800cb] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#6800cb] transition-colors"
                    type="checkbox"
                  />
                  <span className="text-[13px] text-gray-400 group-hover:text-gray-200 transition-colors">Remember me</span>
                </label>
                <a
                  className="text-[13px] font-medium text-purple-300 hover:text-purple-200 hover:underline underline-offset-4 transition-colors"
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert("Enter your credentials or click 'Log In →' to proceed."); }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="login-submit w-full py-3.5 px-6 rounded-xl font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer text-sm"
                style={{
                  background: 'rgb(104, 0, 203)',
                  border: '1px solid rgba(215, 186, 255, 0.35)',
                  boxShadow: 'rgba(104, 0, 203, 0.45) 0px 0px 25px, rgba(255, 255, 255, 0.2) 0px 1px 1px 0px inset'
                }}
              >
                <span>{isRegisterMode ? 'Create Account' : 'Log In'}</span>
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </form>

            {/* Social Divider */}
            <div className="login-social-divider relative flex items-center justify-center my-6">
              <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)' }} />
              <span
                className="absolute px-4 text-[11px] font-semibold tracking-wider uppercase text-gray-400 rounded-full"
                style={{ background: 'rgb(13, 13, 14)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                or continue with
              </span>
            </div>

            {/* Social Login Buttons */}
            <div className="login-social-providers flex items-center justify-center gap-3.5">
              {/* Google */}
              <button
                type="button"
                aria-label="Log in with Google"
                onClick={() => handleSocialLogin('google')}
                className="w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center group cursor-pointer hover:border-purple-500/50"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 8px' }}
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" fill="#EA4335" />
                  <path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" fill="#4285F4" />
                  <path d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" fill="#FBBC05" />
                  <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z" fill="#34A853" />
                </svg>
              </button>

              {/* GitHub */}
              <button
                type="button"
                aria-label="Log in with GitHub"
                onClick={() => handleSocialLogin('github')}
                className="w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center group cursor-pointer hover:border-purple-500/50"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 8px' }}
              >
                <svg className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" />
                </svg>
              </button>

              {/* Microsoft */}
              <button
                type="button"
                aria-label="Log in with Microsoft"
                onClick={() => handleSocialLogin('microsoft')}
                className="w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center group cursor-pointer hover:border-purple-500/50"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 8px' }}
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 23 23">
                  <path d="M1 1h10v10H1z" fill="#f35325" />
                  <path d="M12 1h10v10H12z" fill="#81bc06" />
                  <path d="M12 12h10v10H12z" fill="#ffba08" />
                  <path d="M1 12h10v10H1z" fill="#05a6f0" />
                </svg>
              </button>
            </div>

            {/* Bottom Footer Navigation */}
            <div className="text-center mt-7 pt-1">
              <p className="text-[13px] font-medium text-[#a3a3a3]">
                {isRegisterMode ? 'Already have an account? ' : 'New here? '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-[13px] text-purple-300 hover:text-purple-200 font-semibold ml-1.5 transition-colors underline-offset-4 hover:underline cursor-pointer bg-transparent border-none"
                >
                  {isRegisterMode ? 'Log In' : 'Create Account'}
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default LoginView;
