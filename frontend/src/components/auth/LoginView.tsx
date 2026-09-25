import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Brain, GraduationCap, UserCheck } from 'lucide-react';
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
      <span className="knowledge-twin-mark"><Brain size={18} strokeWidth={1.8} /></span>
      <span className="knowledge-twin-wordmark"><span>Knowledge</span> <em>Twin</em></span>
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
      className="login-page min-h-screen w-full text-[#17232c] flex flex-col relative select-none font-sans"
    >
      {/* Top Navigation Header */}
      <header className="landing-header login-header">
        <button className="landing-brand login-brand" type="button" onClick={onBackToLanding} aria-label="Knowledge Twin home">
          <span className="landing-brand-mark"><Brain size={18} strokeWidth={1.8} /></span>
          <span className="landing-brand-name">Knowledge <em>Twin</em></span>
        </button>
        <div className="landing-actions">
          <span className="login-nav-prompt">
            {isRegisterMode ? 'Already have an account?' : 'New here?'}
          </span>
          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="landing-get-started login-create-account"
            type="button"
          >
            {isRegisterMode ? 'Log In' : 'Create Account'} <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* Main Split-Screen Layout */}
      <div className="login-main relative z-10 w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6">
        
        {/* Student reading illustration */}
        <div className="login-art-column lg:col-span-6 flex flex-col items-center justify-center relative min-h-[460px] lg:min-h-[700px]">
          <div className="login-art-stage relative w-full max-w-[670px] h-[460px] lg:h-[700px] flex items-center justify-center overflow-visible">
            <div className="login-reader-frame">
              <img
                className="login-reader-gif"
                src="/login-reader.jpg"
                alt="Pencil sketch of a student reading a book"
              />
            </div>
          </div>
        </div>

        {/* Login form */}
        <div className="login-form-column lg:col-span-6 flex justify-center lg:justify-end w-full">
          <div
            className="login-card w-full max-w-[520px] relative"
          >
            {/* Card Header Titles */}
            <div className="text-center mb-7 relative z-10">
              <h1 className="login-heading">
                {isRegisterMode ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="login-subtitle">
                {isRegisterMode ? 'Begin your personalized cognitive journey' : 'Continue your learning journey'}
              </p>
            </div>

            {/* Paper-style role selector */}
            <div
              className="login-role-switch relative z-10 grid grid-cols-2 p-1 mb-6"
            >
              <button
                type="button"
                aria-pressed={role === 'student'}
                onClick={() => handleRoleChange('student')}
                className={`login-role-option flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold transition-colors cursor-pointer ${role === 'student' ? 'is-active' : ''}`}
              >
                <GraduationCap size={18} />
                <span>Student</span>
              </button>

              <button
                type="button"
                aria-pressed={role === 'teacher'}
                onClick={() => handleRoleChange('teacher')}
                className={`login-role-option flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold transition-colors cursor-pointer ${role === 'teacher' ? 'is-active' : ''}`}
              >
                <UserCheck size={18} />
                <span>Teacher</span>
              </button>
            </div>
            <p className="login-role-confirmation" aria-live="polite">Signing in as <strong>{role === 'student' ? 'Student' : 'Teacher'}</strong></p>

            {/* Form Fields */}
            <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10">
              {/* Name field if register mode */}
              {isRegisterMode && (
                <div className="space-y-1.5">
                  <div
                    className="login-field group relative flex items-center"
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
                  className="login-field group relative flex items-center"
                >
                  <Mail size={18} className="login-field-icon absolute left-4 pointer-events-none" />
                  <input
                    className="login-field-input w-full bg-transparent text-sm py-3.5 pl-12 pr-4 rounded-xl focus:outline-none tracking-wide"
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
                  className="login-field group relative flex items-center"
                >
                  <Lock size={18} className="login-field-icon absolute left-4 pointer-events-none" />
                  <input
                    className="login-field-input w-full bg-transparent text-sm py-3.5 pl-12 pr-12 rounded-xl focus:outline-none tracking-wide"
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
                    className="login-password-toggle absolute right-3.5 focus:outline-none p-1.5 rounded-lg transition-all cursor-pointer"
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
                    className="login-remember-checkbox cursor-pointer"
                    type="checkbox"
                  />
                  <span className="text-[13px] text-gray-400 group-hover:text-gray-200 transition-colors">Remember me</span>
                </label>
                <a
                  className="login-forgot-link text-[13px] font-medium hover:underline underline-offset-4 transition-colors"
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
              >
                <span>{isRegisterMode ? 'Create Account' : 'Log In'}</span>
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </form>

            {/* Social Divider */}
            <div className="login-social-divider relative flex items-center justify-center my-6">
              <div className="w-full h-px" />
              <span className="absolute px-4 text-[11px] font-semibold tracking-wider uppercase">
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
                className="login-social-button flex items-center justify-center group cursor-pointer transition-colors"
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
                className="login-social-button flex items-center justify-center group cursor-pointer transition-colors"
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
                className="login-social-button flex items-center justify-center group cursor-pointer transition-colors"
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
                  className="login-create-account-inline text-[13px] font-semibold ml-1.5 transition-colors underline-offset-4 hover:underline cursor-pointer bg-transparent border-none"
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
