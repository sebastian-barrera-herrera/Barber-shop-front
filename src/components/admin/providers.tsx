'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { AuthProvider } from '@/lib/admin/auth';

export function AdminProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            // No reintentar errores de permisos o validación, solo fallas de red/servidor.
            retry: (count, err) => count < 2 && !(err instanceof ApiError && err.status < 500),
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <ToastProvider>{children}</ToastProvider>
        </MotionConfig>
      </AuthProvider>
    </QueryClientProvider>
  );
}
