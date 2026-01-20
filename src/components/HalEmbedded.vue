<script setup lang="ts" generic="T = unknown">
/**
 * HalEmbedded - Renders _embedded resources
 *
 * Renders embedded resources from _embedded by relation name.
 * Does NOT make additional HTTP requests - it only renders what's already embedded.
 *
 * @example
 * ```vue
 * <!-- Single embedded resource -->
 * <HalEmbedded rel="author" v-slot="{ data }">
 *   <span>{{ data.name }}</span>
 * </HalEmbedded>
 *
 * <!-- Collection of embedded resources -->
 * <HalEmbedded rel="comments" v-slot="{ data, index }">
 *   <CommentCard :key="data.id" :comment="data" />
 * </HalEmbedded>
 * ```
 */

import { computed } from 'vue';
import { useHypermediaContext } from '../context/hypermediaContext';
import type { HalResource } from '../types/hal';

/**
 * Props for HalEmbedded component
 */
export interface HalEmbeddedProps {
  /** Relation name to look up in _embedded */
  rel: string;
}

/**
 * Slot props exposed to the default slot
 */
export interface HalEmbeddedSlotProps<T> {
  /** Resource data (excluding HAL metadata) */
  data: T;
  /** Full HAL resource data */
  halData: HalResource<T>;
  /** Index in collection (0 for single resources) */
  index: number;
  /** Whether this is part of a collection */
  isCollection: boolean;
  /** Total count if collection */
  total: number;
}

const props = defineProps<HalEmbeddedProps>();

const { state } = useHypermediaContext();

/**
 * Extract data from HAL resource (excluding HAL metadata)
 */
function extractData<U>(halResource: HalResource<U>): U {
  const { _links, _embedded, _templates, ...data } = halResource;
  return data as U;
}

// Get embedded resource(s)
const embedded = computed(() => {
  return state.value?.data?._embedded?.[props.rel] ?? null;
});

// Check if it's an array
const isArray = computed(() => Array.isArray(embedded.value));

// Get items as array (normalize single item to array)
const items = computed((): Array<{ data: T; halData: HalResource<T>; index: number }> => {
  if (!embedded.value) return [];

  if (Array.isArray(embedded.value)) {
    return (embedded.value as HalResource<T>[]).map((halResource, index) => ({
      data: extractData<T>(halResource),
      halData: halResource,
      index,
    }));
  }

  // Single resource
  const halResource = embedded.value as HalResource<T>;
  return [
    {
      data: extractData<T>(halResource),
      halData: halResource,
      index: 0,
    },
  ];
});

</script>

<template>
  <template v-if="!embedded">
    <slot name="fallback"></slot>
  </template>
  <template v-else>
    <template v-for="item in items" :key="item.index">
      <slot
        :data="item.data"
        :halData="item.halData"
        :index="item.index"
        :isCollection="isArray"
        :total="items.length"
      ></slot>
    </template>
  </template>
</template>
