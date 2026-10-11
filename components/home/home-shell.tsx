'use client';

import { useCallback, useState } from 'react';

import { INTRO_SEEN_COOKIE } from './content';
import { Intro } from './intro';

// The page is rendered behind the entrance so it appears ready when the
// animation ends.
export function HomeShell({
  showIntro,
  children,
}: {
  showIntro: boolean;
  children: React.ReactNode;
}) {
  const [entered, setEntered] = useState(!showIntro);

  const onDone = useCallback(() => {
    document.cookie = `${INTRO_SEEN_COOKIE}=1; path=/; SameSite=Lax`;
    setEntered(true);
  }, []);

  return (
    <>
      {!entered && <Intro onDone={onDone} />}
      {children}
    </>
  );
}
