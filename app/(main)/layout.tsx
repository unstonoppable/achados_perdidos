"use client";
import { Suspense } from 'react';
import MainLayoutClient from './MainLayoutClient';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Carregando Layout...</div>}>
      <MainLayoutClient>{children}</MainLayoutClient>
    </Suspense>
  );
} 