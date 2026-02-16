import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  renderHook,
  type RenderHookOptions,
} from '@testing-library/react-native';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

export function renderHookWithProviders<TResult>(
  hook: () => TResult,
  options?: Omit<RenderHookOptions<any>, 'wrapper'>,
) {
  return renderHook(hook, {
    wrapper: createWrapper(),
    ...options,
  });
}
