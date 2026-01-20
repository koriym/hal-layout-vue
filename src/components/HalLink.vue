<script setup lang="ts" generic="TBody = unknown">
/**
 * HalLink - Renders _links actions
 *
 * Renders actions based on _links relations. Handles state transitions
 * via HTTP methods (GET, POST, PUT, DELETE). Supports URI templates.
 *
 * @example
 * ```vue
 * <!-- Simple delete button -->
 * <HalLink rel="delete" method="DELETE">
 *   Delete
 * </HalLink>
 *
 * <!-- Navigation link -->
 * <HalLink rel="next">
 *   Next Page
 * </HalLink>
 *
 * <!-- With URI template parameters -->
 * <HalLink rel="search" :params="{ q: 'hello', page: 2 }">
 *   Search
 * </HalLink>
 *
 * <!-- With scoped slot -->
 * <HalLink rel="submit" method="POST" :body="{ status: 'approved' }" v-slot="{ loading, execute }">
 *   <button @click="execute" :disabled="loading">
 *     {{ loading ? 'Submitting...' : 'Approve' }}
 *   </button>
 * </HalLink>
 * ```
 */

import { computed } from 'vue';
import { useAction, type ActionMethod } from '../composables/useAction';
import type { TemplateParams } from '../utils/uriTemplate';

/**
 * Props for HalLink component
 */
export interface HalLinkProps<TBody = unknown> {
  /** Relation name from _links */
  rel: string;
  /** HTTP method (default: 'GET' for 'a', 'POST' for 'button') */
  method?: ActionMethod;
  /** URI template parameters */
  params?: TemplateParams;
  /** Request body for POST/PUT/PATCH */
  body?: TBody;
  /** Relations to invalidate after action */
  invalidates?: string[];
  /** Whether to refresh parent after action */
  refreshParent?: boolean;
  /** Element type to render */
  as?: 'button' | 'a' | 'span';
  /** Additional CSS class */
  class?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Title/tooltip */
  title?: string;
  /** Prevent default navigation for 'a' elements */
  preventDefault?: boolean;
  /** Open in new tab (for 'a' elements with GET) */
  target?: '_blank' | '_self' | '_parent' | '_top';
}

/**
 * Slot props exposed to the default slot
 */
export interface HalLinkSlotProps {
  /** Execute the action */
  execute: () => Promise<void>;
  /** Whether action is loading */
  loading: boolean;
  /** Error from action */
  error: Error | null;
  /** Whether the link is available */
  available: boolean;
  /** The link href */
  href: string | null;
}

const props = withDefaults(defineProps<HalLinkProps<TBody>>(), {
  method: 'GET',
  refreshParent: true,
  preventDefault: true,
});

const emit = defineEmits<{
  /** Emitted on successful action */
  success: [response: unknown];
  /** Emitted on error */
  error: [error: Error];
}>();

const { execute: executeAction, loading, error, available, link, href } = useAction<TBody>({
  rel: props.rel,
  method: props.method,
  params: props.params,
  invalidates: props.invalidates,
  refreshParent: props.refreshParent,
  onSuccess: (response) => emit('success', response),
  onError: (err) => emit('error', err),
});

// Determine element type based on method
const effectiveAs = computed(() => props.as ?? (props.method === 'GET' ? 'a' : 'button'));

// Combined disabled state
const isDisabled = computed(() => props.disabled || loading.value);

// Execute wrapper
const execute = async () => {
  await executeAction(props.body);
};

// Handle click
const handleClick = async (e: MouseEvent) => {
  // For 'a' elements with GET method, allow default navigation unless preventDefault
  if (effectiveAs.value === 'a' && props.method === 'GET' && !props.preventDefault) {
    return;
  }

  e.preventDefault();
  await execute();
};

// Handle keyboard navigation
const handleKeyDown = async (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    await execute();
  }
};

// Slot props
const slotProps = computed((): HalLinkSlotProps => ({
  execute,
  loading: loading.value,
  error: error.value,
  available: available.value,
  href: href.value,
}));
</script>

<template>
  <template v-if="available">
    <!-- Scoped slot for custom rendering -->
    <slot v-if="$slots.default" v-bind="slotProps"></slot>

    <!-- Default rendering based on element type -->
    <template v-else>
      <a
        v-if="effectiveAs === 'a'"
        :href="href ?? '#'"
        :class="props.class"
        :title="title ?? link?.title"
        :target="target"
        :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
        :aria-disabled="isDisabled"
        :style="isDisabled ? { pointerEvents: 'none', opacity: 0.5 } : undefined"
        @click="handleClick"
      >
        <slot name="content">Link</slot>
      </a>

      <span
        v-else-if="effectiveAs === 'span'"
        role="button"
        :tabindex="isDisabled ? -1 : 0"
        :class="props.class"
        :title="title ?? link?.title"
        :aria-disabled="isDisabled"
        :style="isDisabled ? { cursor: 'not-allowed', opacity: 0.5 } : { cursor: 'pointer' }"
        @click="handleClick"
        @keydown="handleKeyDown"
      >
        <slot name="content">Link</slot>
      </span>

      <button
        v-else
        type="button"
        :class="props.class"
        :title="title ?? link?.title"
        :disabled="isDisabled"
        @click="handleClick"
      >
        <template v-if="loading">Loading...</template>
        <slot v-else name="content">Submit</slot>
      </button>
    </template>
  </template>
</template>
