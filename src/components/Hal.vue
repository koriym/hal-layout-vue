<script setup lang="ts" generic="T = unknown">
/**
 * Hal - Root component for HAL-driven UI
 *
 * Entry point for HAL-driven UI. Fetches a HAL resource and provides
 * its state to child components via Vue provide/inject.
 *
 * @example
 * ```vue
 * <Hal uri="/posts">
 *   <HalEmbedded rel="author">...</HalEmbedded>
 *   <HalLink rel="edit">Edit</HalLink>
 * </Hal>
 * ```
 */

import { ref, computed, watch, onMounted, type Ref } from 'vue';
import type { Resource, State } from 'ketting';
import { useHalClient } from '../context/halProvider';
import { provideHypermediaContext } from '../context/hypermediaContext';
import type { HalResource } from '../types/hal';

/**
 * Props for Hal
 */
export interface HalProps {
  /** URI of the resource to fetch (supports app://self/, page://self/, or HTTP URLs) */
  uri: string;
  /** Content profile for content negotiation */
  profile?: string;
  /** View parameter for representation selection */
  view?: string;
}

const props = defineProps<HalProps>();

const emit = defineEmits<{
  /** Emitted when resource is successfully loaded */
  load: [state: State<HalResource<T>>];
  /** Emitted when an error occurs */
  error: [error: Error];
}>();

const client = useHalClient();

// State for resource, loading, and error
const resource: Ref<Resource<HalResource<T>> | null> = ref(null);
const state: Ref<State<HalResource<T>> | null> = ref(null);
const loading = ref(true);
const error: Ref<Error | null> = ref(null);

// Build the URI with optional profile/view parameters
const resolvedUri = computed(() => {
  const url = new URL(props.uri, 'http://placeholder');
  if (props.profile) {
    url.searchParams.set('profile', props.profile);
  }
  if (props.view) {
    url.searchParams.set('view', props.view);
  }
  // Return just the path + query if it was a relative URL
  if (
    props.uri.startsWith('/') ||
    props.uri.startsWith('app://') ||
    props.uri.startsWith('page://')
  ) {
    return props.uri.includes('?')
      ? `${props.uri}&${url.searchParams.toString()}`
      : `${props.uri}${url.searchParams.toString() ? '?' + url.searchParams.toString() : ''}`;
  }
  return url.toString();
});

// Fetch the resource
const fetchResource = async () => {
  loading.value = true;
  error.value = null;

  try {
    const res = client.go<HalResource<T>>(resolvedUri.value);
    const resourceState = await res.get();

    resource.value = res;
    state.value = resourceState;
    emit('load', resourceState);
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    error.value = e;
    emit('error', e);
  } finally {
    loading.value = false;
  }
};

// Refresh function exposed via context
const refresh = async () => {
  if (resource.value) {
    loading.value = true;
    try {
      const newState = await resource.value.refresh();
      state.value = newState;
      emit('load', newState);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      emit('error', e);
    } finally {
      loading.value = false;
    }
  }
};

// Provide context to descendants
provideHypermediaContext({
  resource,
  state,
  loading,
  error,
  refresh,
});

// Fetch on mount
onMounted(() => {
  fetchResource();
});

// Refetch when URI changes
watch(resolvedUri, () => {
  fetchResource();
});

// Expose state to parent
defineExpose({
  refresh,
  loading,
  error,
});
</script>

<template>
  <slot v-if="loading && !state" name="fallback">
    <div>Loading...</div>
  </slot>
  <slot v-else-if="error && !state" name="error" :error="error">
    <div role="alert" style="color: red">Error: {{ error.message }}</div>
  </slot>
  <slot v-else></slot>
</template>
