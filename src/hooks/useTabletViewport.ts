import { useEffect, useState } from 'react';

export interface TabletViewportState {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isTabletLandscape: boolean;
  isSplitScreen: boolean;
}

function readViewportState(): TabletViewportState {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 800,
      isLandscape: true,
      isTablet: true,
      isTabletLandscape: true,
      isSplitScreen: false,
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;
  const isTablet = width >= 600 && width <= 1440;
  const isTabletLandscape = isLandscape && width >= 900;
  const isSplitScreen = width < 600 && height >= 600;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isTabletLandscape,
    isSplitScreen,
  };
}

export function useTabletViewport(): TabletViewportState {
  const [viewport, setViewport] = useState<TabletViewportState>(readViewportState);

  useEffect(() => {
    let rafId = 0;
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setViewport(readViewportState());
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
}
