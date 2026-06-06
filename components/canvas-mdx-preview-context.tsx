'use client';

import { createContext, useContext, type ReactNode } from 'react';

export const CanvasMdxPreviewContext = createContext<Record<string, ReactNode>>({});

export function useCanvasMdxPreview(nodeId: string) {
  return useContext(CanvasMdxPreviewContext)[nodeId];
}
