import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ShieldAlert, Cpu, Pyramid, ChevronRight } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // We default to SciFi for login, but user can toggle later
  const theme = localStorage.getItem('app-theme') || 'scifi';
  document.documentElement.setAttribute('data-theme', theme);

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError("Access Denied: Invalid Credentials");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="bg-grid"></div>
      <div className="scanlines"></div>

      <div className="relative z-10 w-full max-w-md p-8">
        
        {/* Card */}
        <div className="bg-surface/90 backdrop-blur-md border border-primary-dim p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-theme relative">
            
            {/* Corners */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-primary" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-primary" />

            <div className="text-center mb-8">
                <div className="flex justify-center mb-4 text-primary-text">
                    {theme === 'scifi' ? <Cpu size={48} /> : <Pyramid size={48} />}
                </div>
                <h1 className="text-3xl font-bold uppercase tracking-widest text-text-main">
                    {theme === 'scifi' ? 'AUTHENTICATE' : 'ENTER DYNASTY'}
                </h1>
                <p className="text-xs font-mono text-primary-text mt-2 uppercase tracking-widest opacity-70">
                    Identity Verification Required
                </p>
            </div>

            {error && (
                <div className="bg-danger-dim/20 border border-danger p-3 mb-4 text-danger text-xs font-mono flex items-center gap-2">
                    <ShieldAlert size={16} /> {error}
                </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                    <label className="block text-[10px] uppercase font-mono text-text-muted mb-1">Comms ID (Email)</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-background border border-primary-dim p-3 text-text-main focus:border-primary outline-none font-mono text-sm rounded-theme"
                        placeholder="USER@SYSTEM.NET"
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase font-mono text-text-muted mb-1">Passcode</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-background border border-primary-dim p-3 text-text-main focus:border-primary outline-none font-mono text-sm rounded-theme"
                        placeholder="••••••••"
                    />
                </div>

                <button type="submit" className="w-full bg-primary-dim border border-primary text-primary-text hover:bg-primary hover:text-surface py-3 font-bold uppercase tracking-widest transition-all rounded-theme flex justify-center items-center gap-2 group">
                   {isSignUp ? 'Initialize User' : 'Decrypt & Enter'}
                   <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <div className="my-6 flex items-center gap-4 opacity-50">
                <div className="h-px bg-primary-dim flex-1"></div>
                <span className="text-[10px] font-mono text-text-muted">OR USE BIOMETRICS</span>
                <div className="h-px bg-primary-dim flex-1"></div>
            </div>

            <button 
                onClick={handleGoogle}
                className="w-full bg-surface border border-text-muted text-text-muted hover:border-text-main hover:text-text-main py-3 font-mono text-xs uppercase tracking-widest transition-all rounded-theme"
            >
                Google Protocol
            </button>

            <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full mt-4 text-xs font-mono text-primary-text hover:underline uppercase tracking-widest text-center"
            >
                {isSignUp ? 'Already registered? Login' : 'New User? Initialize'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;