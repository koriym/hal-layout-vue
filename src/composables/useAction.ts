/**
 * useAction Composable
 *
 * Composable for executing actions on HAL link relations.
 * Handles POST, PUT, DELETE operations with automatic cache invalidation.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { useHypermediaContext } from '../context/hypermediaContext';
import { useHalClient } from '../context/halProvider';
import { expandUriTemplate, type TemplateParams } from '../utils/uriTemplate';
import type { HalLink } from '../types/hal';

/**
 * HTTP methods supported for actions
 */
export type ActionMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Options for useAction composable
 */
export interface UseActionOptions {
  /** Relation name to follow */
  rel: string;
  /** HTTP method (default: 'POST') */
  method?: ActionMethod;
  /** URI template parameters */
  params?: TemplateParams;
  /** Callback on successful action */
  onSuccess?: (response: unknown) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Relations to invalidate after successful action */
  invalidates?: string[];
  /** Whether to refresh the parent resource after action */
  refreshParent?: boolean;
}

/**
 * Return type for useAction composable
 */
export interface UseActionResult<TBody = unknown, TResponse = unknown> {
  /** Execute the action */
  execute: (body?: TBody) => Promise<TResponse | null>;
  /** Whether action is currently executing */
  loading: Ref<boolean>;
  /** Error from last execution */
  error: Ref<Error | null>;
  /** Reset error state */
  resetError: () => void;
  /** Whether the link relation exists */
  available: ComputedRef<boolean>;
  /** The link object (if available) */
  link: ComputedRef<HalLink | null>;
  /** The resolved href (with template params expanded) */
  href: ComputedRef<string | null>;
}

/**
 * Composable for executing actions on HAL link relations
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useAction } from 'hal-layout-vue';
 *
 * const { execute, loading, error } = useAction({
 *   rel: 'delete',
 *   method: 'DELETE',
 *   onSuccess: () => alert('Deleted!'),
 * });
 * </script>
 *
 * <template>
 *   <button @click="execute()" :disabled="loading">
 *     {{ loading ? 'Deleting...' : 'Delete' }}
 *   </button>
 * </template>
 * ```
 */
export function useAction<TBody = unknown, TResponse = unknown>(
  options: UseActionOptions
): UseActionResult<TBody, TResponse> {
  const {
    rel,
    method = 'POST',
    params,
    onSuccess,
    onError,
    invalidates,
    refreshParent = true,
  } = options;

  const { resource, state, refresh } = useHypermediaContext();
  const client = useHalClient();

  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Get the link for this relation
  const link = computed((): HalLink | null => {
    const linkData = state.value?.data?._links?.[rel];
    if (!linkData) return null;
    return Array.isArray(linkData) ? linkData[0] : linkData;
  });

  const available = computed(() => link.value !== null);

  // Resolve URI template with params
  const href = computed((): string | null => {
    if (!link.value?.href) return null;
    if (params && Object.keys(params).length > 0) {
      return expandUriTemplate(link.value.href, params);
    }
    return link.value.href;
  });

  // Execute the action
  const execute = async (body?: TBody): Promise<TResponse | null> => {
    if (!href.value || !resource.value) {
      const err = new Error(`Link relation '${rel}' not found`);
      error.value = err;
      onError?.(err);
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      // Follow the link and execute the action (using resolved href)
      const targetResource = resource.value.go(href.value);
      let response: unknown;

      switch (method) {
        case 'GET':
          response = await targetResource.get();
          break;
        case 'POST':
          response = await targetResource.post({ data: body });
          break;
        case 'PUT':
          response = await targetResource.put({ data: body });
          break;
        case 'PATCH':
          response = await targetResource.patch({ data: body });
          break;
        case 'DELETE':
          response = await targetResource.delete();
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      // Invalidate specified resources
      if (invalidates) {
        for (const invalidateRel of invalidates) {
          const invalidateLink = state.value?.data?._links?.[invalidateRel];
          if (invalidateLink) {
            const invalidateHref = Array.isArray(invalidateLink)
              ? invalidateLink[0].href
              : invalidateLink.href;
            const invalidateResource = client.go(invalidateHref);
            await invalidateResource.refresh().catch(() => {
              // Ignore refresh errors
            });
          }
        }
      }

      // Refresh parent resource
      if (refreshParent) {
        await refresh();
      }

      onSuccess?.(response);
      return response as TResponse;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      onError?.(e);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Reset error state
  const resetError = () => {
    error.value = null;
  };

  return {
    execute,
    loading,
    error,
    resetError,
    available,
    link,
    href,
  };
}
