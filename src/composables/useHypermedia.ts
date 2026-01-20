/**
 * useHypermedia Composable
 *
 * Main composable for accessing hypermedia context within Hal component.
 * Provides access to resource data, links, embedded resources, and templates.
 */

import { computed, type ComputedRef, type Ref } from 'vue';
import type { Resource, State } from 'ketting';
import { useHypermediaContext } from '../context/hypermediaContext';
import type { HalResource, HalLink, HalTemplate } from '../types/hal';

/**
 * Return type for useHypermedia composable
 */
export interface UseHypermediaResult<T = unknown> {
  /** Resource data (excluding HAL metadata) */
  data: ComputedRef<T | null>;
  /** Full HAL resource including _links, _embedded, _templates */
  halData: ComputedRef<HalResource<T> | null>;
  /** Ketting Resource object for actions */
  resource: Ref<Resource<HalResource<T>> | null>;
  /** Current resource state */
  state: Ref<State<HalResource<T>> | null>;
  /** Loading indicator */
  loading: Ref<boolean>;
  /** Error if any */
  error: Ref<Error | null>;
  /** Refresh the resource */
  refresh: () => Promise<void>;
  /** Get embedded resource(s) by rel */
  getEmbedded: <E = unknown>(rel: string) => E | E[] | null;
  /** Get link by rel */
  getLink: (rel: string) => HalLink | HalLink[] | null;
  /** Check if link exists */
  hasLink: (rel: string) => boolean;
  /** Get template by name */
  getTemplate: (name?: string) => HalTemplate | null;
  /** Check if template exists */
  hasTemplate: (name?: string) => boolean;
}

/**
 * Main composable for accessing hypermedia context
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useHypermedia } from 'hal-layout-vue';
 *
 * const { data, loading, getEmbedded } = useHypermedia<{ title: string }>();
 *
 * const posts = computed(() => getEmbedded<Post[]>('posts'));
 * </script>
 * ```
 */
export function useHypermedia<T = unknown>(): UseHypermediaResult<T> {
  const context = useHypermediaContext<T>();

  const { resource, state, loading, error, refresh } = context;

  // Extract data excluding HAL properties
  const data = computed((): T | null => {
    if (!state.value?.data) return null;
    const { _links, _embedded, _templates, ...resourceData } = state.value.data;
    return resourceData as T;
  });

  // Get full HAL data
  const halData = computed((): HalResource<T> | null => {
    return state.value?.data ?? null;
  });

  // Get embedded resource(s)
  const getEmbedded = <E = unknown>(rel: string): E | E[] | null => {
    return (state.value?.data?._embedded?.[rel] as E | E[] | undefined) ?? null;
  };

  // Get link by rel
  const getLink = (rel: string): HalLink | HalLink[] | null => {
    return state.value?.data?._links?.[rel] ?? null;
  };

  // Check if link exists
  const hasLink = (rel: string): boolean => {
    return state.value?.data?._links?.[rel] !== undefined;
  };

  // Get template by name
  const getTemplate = (name: string = 'default'): HalTemplate | null => {
    return state.value?.data?._templates?.[name] ?? null;
  };

  // Check if template exists
  const hasTemplate = (name: string = 'default'): boolean => {
    return state.value?.data?._templates?.[name] !== undefined;
  };

  return {
    data,
    halData,
    resource: resource as Ref<Resource<HalResource<T>> | null>,
    state: state as Ref<State<HalResource<T>> | null>,
    loading,
    error,
    refresh,
    getEmbedded,
    getLink,
    hasLink,
    getTemplate,
    hasTemplate,
  };
}
