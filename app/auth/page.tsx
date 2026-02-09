'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = searchParams.get('mode') === 'signup';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: email })
      : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? (isSignUp ? 'Sign up failed' : 'Sign in failed'));
      setLoading(false);
      return;
    }

    router.push('/notes');
  }

  return (
    <main className='grid min-h-screen place-items-center p-8'>
      <div className='w-full max-w-sm'>
        <h1 className='text-2xl font-bold text-center mb-6'>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label htmlFor='email' className='block text-sm font-medium mb-1'>
              Email
            </label>
            <input
              id='email'
              name='email'
              type='email'
              required
              autoComplete='email'
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label htmlFor='password' className='block text-sm font-medium mb-1'>
              Password
            </label>
            <input
              id='password'
              name='password'
              type='password'
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          {error && (
            <p role='alert' className='text-sm text-red-600'>
              {error}
            </p>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className='mt-4 text-center text-sm text-gray-600'>
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <Link href='/auth' className='text-blue-600 hover:underline'>
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link href='/auth?mode=signup' className='text-blue-600 hover:underline'>
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
