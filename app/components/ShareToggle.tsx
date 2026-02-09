'use client';

import { useState, useTransition } from 'react';
import { toggleShare } from '@/lib/actions/notes';

type ShareToggleProps = {
  noteId: string;
  initialIsShared: boolean;
  initialSlug: string | null;
};

export function ShareToggle({ noteId, initialIsShared, initialSlug }: ShareToggleProps) {
  const [isShared, setIsShared] = useState(initialIsShared);
  const [slug, setSlug] = useState(initialSlug);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const shareUrl = slug ? `${window.location.origin}/share/${slug}` : null;

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleShare(noteId);
      if ('error' in result) {
        alert(result.error);
        return;
      }
      setIsShared(result.is_shared);
      setSlug(result.shared_slug);
    });
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className='flex items-center gap-2'>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`rounded-md px-4 py-2 text-white ${
          isShared ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
        } disabled:opacity-50`}
      >
        {isPending ? 'Updating...' : isShared ? 'Stop Sharing' : 'Share'}
      </button>

      {isShared && shareUrl && (
        <>
          <span className='text-sm text-gray-600 truncate max-w-xs' title={shareUrl}>
            {shareUrl}
          </span>
          <button
            onClick={handleCopy}
            className='rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </>
      )}
    </div>
  );
}
