'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push('/auth');
  }

  return (
    <button onClick={handleLogout} className='text-sm text-gray-600 hover:text-gray-900'>
      Logout
    </button>
  );
}
