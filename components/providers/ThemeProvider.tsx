'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { theme, createEmotionCache } from '../../lib/theme';

// 클라이언트 사이드 캐시
const clientSideEmotionCache = createEmotionCache();

interface CustomThemeProviderProps {
  children: React.ReactNode;
  emotionCache?: ReturnType<typeof createEmotionCache>;
}

export default function CustomThemeProvider({
  children,
  emotionCache = clientSideEmotionCache,
}: CustomThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버 사이드와 클라이언트 사이드 모두에서 동일한 구조 유지
  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
      </ThemeProvider>
    </CacheProvider>
  );
} 