import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('fan'); // 'fan' | 'professional'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "FilmDba | Join";
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'professional') {
        navigate('/dashboard/pro');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // Password strength logic
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, color: 'bg-surface-2' };
    if (pass.length < 6) return { score: 1, color: 'bg-red-500' };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return { score: 3, color: 'bg-green-500' };
    return { score: 2, color: 'bg-amber-500' };
  };
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service.');
      return;
    }

    setIsLoading(true);
    try {
      const { user: signUpUser, session } = await signup(name, email, password, role);
      if (signUpUser && !session) {
        setError('Account created! Please check your email to verify your account.');
      }
      // Navigation is handled by the useEffect above when user state changes
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-primary mb-2">
          Join FilmDba
        </h2>
        <p className="text-text-muted">
          Create your account to rate, review and track Nollywood films
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tolu Okafor"
            className="w-full bg-bg border border-border text-text-primary placeholder-text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-bg border border-border text-text-primary placeholder-text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-bg border border-border text-text-primary placeholder-text-muted rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-primary transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          {/* Strength Indicator */}
          <div className="flex gap-1 mt-2">
            <div className={`h-1 flex-1 rounded-full ${password.length > 0 ? strength.color : 'bg-surface-2'}`}></div>
            <div className={`h-1 flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-surface-2'}`}></div>
            <div className={`h-1 flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-surface-2'}`}></div>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-bg border border-border text-text-primary placeholder-text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
          />
        </div>

        {/* Role Selector */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            I am joining as...
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fan Card */}
            <button
              type="button"
              onClick={() => setRole('fan')}
              className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                role === 'fan' 
                  ? 'border-gold bg-gold/5' 
                  : 'border-border bg-bg hover:border-text-muted'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mb-3 ${role === 'fan' ? 'text-gold' : 'text-text-muted'}`}>
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="2" y1="7" x2="7" y2="7"/>
                <line x1="2" y1="17" x2="7" y2="17"/>
                <line x1="17" y1="17" x2="22" y2="17"/>
                <line x1="17" y1="7" x2="22" y2="7"/>
              </svg>
              <span className={`font-bold mb-1 ${role === 'fan' ? 'text-gold' : 'text-text-primary'}`}>
                A Film Fan
              </span>
              <span className="text-xs text-text-muted leading-relaxed">
                Rate films, build a watchlist, follow your favourite filmmakers
              </span>
            </button>

            {/* Professional Card */}
            <button
              type="button"
              onClick={() => setRole('professional')}
              className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                role === 'professional' 
                  ? 'border-gold bg-gold/5' 
                  : 'border-border bg-bg hover:border-text-muted'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mb-3 ${role === 'professional' ? 'text-gold' : 'text-text-muted'}`}>
                <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.4-2.2 1.5-2.5l13.5-4c1.1-.3 2.2.4 2.5 1.5l.6 2.4z"/>
                <path d="m2.6 10.4 17.2-5.1"/>
                <path d="m6 3.4 1.4 4.1"/>
                <path d="m10.3 2.1 1.4 4.1"/>
                <path d="m14.6.8 1.4 4.1"/>
                <path d="m18.9-.5 1.4 4.1"/>
                <path d="M21.4 11.6 3 17l.9 2.4c.3 1.1 1.5 1.8 2.6 1.5l13.5-4c1.1-.3 1.8-1.5 1.5-2.6l-.1-2.7z"/>
                <path d="m2.6 16.4 17.2-5.1"/>
                <path d="m6 19.4 1.4-4.1"/>
                <path d="m10.3 20.7 1.4-4.1"/>
                <path d="m14.6 22 1.4-4.1"/>
                <path d="m18.9 23.3 1.4-4.1"/>
              </svg>
              <span className={`font-bold mb-1 ${role === 'professional' ? 'text-gold' : 'text-text-primary'}`}>
                Industry Professional
              </span>
              <span className="text-xs text-text-muted leading-relaxed">
                Claim your profile, manage your filmography, promote your work
              </span>
            </button>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="peer appearance-none w-5 h-5 border-2 border-border rounded bg-bg checked:bg-gold checked:border-gold transition-colors cursor-pointer"
            />
            <svg 
              className="absolute w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-bg" 
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <label htmlFor="terms" className="text-sm text-text-muted cursor-pointer select-none">
            I agree to FilmDba's <Link to="#" className="text-gold hover:underline">Terms of Service</Link> and <Link to="#" className="text-gold hover:underline">Privacy Policy</Link>
          </label>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gold text-bg font-bold py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed min-h-[44px] mt-4"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-8">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink-0 mx-4 text-text-muted text-sm">— or continue with —</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      {/* Google Button */}
      <button 
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 bg-surface border border-border text-text-primary py-3.5 rounded-xl hover:bg-surface-2 hover:border-text-muted transition-all duration-300 active:scale-95 min-h-[44px]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Sign In Link */}
      <p className="text-center text-text-muted mt-8 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-gold font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
