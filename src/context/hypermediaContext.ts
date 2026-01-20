/**
 * HypermediaContext - Vue 3 Provide/Inject for Hypermedia State
 *
 * Provides both the resource handle (for actions) and state (for display)
 * to child components within a Hal component.
 */

import { inject, provide, type InjectionKey, type Ref } from 'vue';
import type { Resource, State } from 'ketting';
import type { HalResource } from '../types/hal';

/**
 * Context value type for Hypermedia state
 * @typeParam T - Type of the resource data
 */
export interface HypermediaContextType<T = unknown> {
  /** Ketting Resource object for performing actions (follow, post, put, delete) */
  resource: Ref<Resource<HalResource<T>> | null>;
  /** Current state of the resource (data, links, embedded) */
  state: Ref<State<HalResource<T>> | null>;
  /** Loading indicator */
  loading: Ref<boolean>;
  /** Error if request failed */
  error: Ref<Error | null>;
  /** Refresh the resource state */
  refresh: () => Promise<void>;
}

/**
 * Injection key for Hypermedia context
 */
export const HypermediaContextKey: InjectionKey<HypermediaContextType> =
  Symbol('HypermediaContext');

/**
 * Provide hypermedia context to descendant components
 */
export function provideHypermediaContext<T = unknown>(
  context: HypermediaContextType<T>
): void {
  provide(HypermediaContextKey, context as HypermediaContextType);
}

/**
 * Inject the current Hypermedia context
 * @throws Error if used outside of Hal component
 */
export function useHypermediaContext<T = unknown>(): HypermediaContextType<T> {
  const context = inject(HypermediaContextKey);
  if (!context) {
    throw new Error('useHypermediaContext must be used within a <Hal> component.');
  }
  return context as HypermediaContextType<T>;
}

/**
 * Composable to access just the resource data (without HAL metadata)
 */
export function useResourceData<T = unknown>(): Ref<T | null> {
  const { state, loading } = useHypermediaContext<T>();

  // This is a computed-like access pattern
  // In actual usage, wrap in computed() if needed
  return {
    get value(): T | null {
      if (loading.value || !state.value) return null;

      const data = state.value.data;
      if (!data) return null;

      // Extract data excluding HAL properties
      const { _links, _embedded, _templates, ...resourceData } = data;
      return resourceData as T;
    },
  } as Ref<T | null>;
}

/**
 * Get embedded resources by relation
 */
export function useEmbedded<T = unknown>(rel: string): T | T[] | null {
  const { state, loading } = useHypermediaContext();
  if (loading.value || !state.value) return null;

  const embedded = state.value.data?._embedded?.[rel];
  if (!embedded) return null;

  return embedded as T | T[];
}

/**
 * Check if a link relation exists
 */
export function useHasLink(rel: string): boolean {
  const { state, loading } = useHypermediaContext();
  if (loading.value || !state.value) return false;

  return state.value.data?._links?.[rel] !== undefined;
}

/**
 * Get link href by relation
 */
export function useLinkHref(rel: string): string | null {
  const { state, loading } = useHypermediaContext();
  if (loading.value || !state.value) return null;

  const link = state.value.data?._links?.[rel];
  if (!link) return null;

  if (Array.isArray(link)) {
    return link[0]?.href ?? null;
  }
  return link.href;
}
