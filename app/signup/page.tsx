'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 text-center">
          Sign Up
        </h1>
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

