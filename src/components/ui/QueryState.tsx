'use client';

import { ReactNode } from 'react';
import { PageSpinner } from './Spinner';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  isFetching?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ElementType;
  emptyAction?: ReactNode;
  children: ReactNode;
}

/**
 * Single entry point for the loading / error / empty / success sequence so every page
 * handles a failed fetch the same way instead of re-deriving it per page (which is how
 * several pages ended up rendering blank, or stuck spinning forever, on API failure).
 */
export function QueryState({
  isLoading, isError, error, onRetry, isFetching,
  isEmpty, emptyTitle, emptyDescription, emptyIcon, emptyAction,
  children,
}: QueryStateProps) {
  if (isLoading) return <PageSpinner />;
  if (isError) return <ErrorState error={error} onRetry={onRetry} isRetrying={isFetching} />;
  if (isEmpty) return <EmptyState message={emptyTitle} description={emptyDescription} icon={emptyIcon} action={emptyAction} />;
  return <>{children}</>;
}
