
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ActionButton from './ActionButton';

const EyeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const EyeSlashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38c-1.28-4.09-5.08-7.12-9.255-7.12A9.922 9.922 0 006.135 4.512L3.28 2.22zM10 12a2 2 0 01-2-2l.992-.992a.5.5 0 00.707.707l-.992.992a2 2 0 012 2z" />
      <path d="M10 3a9.954 9.954 0 014.242 1.055l-1.036 1.036a8.455 8.455 0 00-3.206-.491C5.08 4.88 1.28 7.91 0 12c.682 1.8 2.16 3.337 4.03 4.33l-1.18 1.18A.75.75 0 003.91 18.6l1.06-1.06L17.78 3.28a.75.75 0 00-1.06-1.06L10 9.19V3z" />
    </svg>
);

const Login: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        if (!name.trim()) {
            setError("Please enter your full name.");
            setIsLoading(false);
            return;
        }
        await signup(name, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleView = () => {
      setIsLoginView(!isLoginView);
      setError(null);
      setName('');
      setEmail('');
      setPassword('');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden md:grid md:grid-cols-2">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 md:p-12 text-white flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Aswab Invoice & Stock Manager</h2>
            <p className="text-green-100">Your all-in-one solution for seamless invoicing and intelligent inventory tracking. Streamline your business, save time, and stay organized.</p>
        </div>
        <div className="p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900">{isLoginView ? 'Welcome Back!' : 'Create Your Account'}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {isLoginView ? 'Sign in to continue.' : 'Get started in just a few clicks.'}
          </p>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 text-sm text-red-800 bg-red-100 rounded-lg border border-red-200">{error}</div>}
            
            {!isLoginView && (
               <div>
                  <label htmlFor="name-signup" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                  id="name-signup"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="e.g., Jane Doe"
                  />
              </div>
            )}

            <div>
              <label htmlFor="email-auth" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                id="email-auth"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password-auth" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <input
                  id="password-auth"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLoginView ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <ActionButton type="submit" className="w-full !py-3 text-base" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isLoginView ? 'Sign in' : 'Create Account')}
              </ActionButton>
            </div>
             <div className="text-sm text-center">
                  <button type="button" onClick={toggleView} className="font-medium text-green-600 hover:text-green-500">
                      {isLoginView ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
              </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
