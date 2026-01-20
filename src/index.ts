/**
 * hal-layout-vue
 *
 * Vue 3 components for rendering HAL (Hypertext Application Language) resources
 */

// Components
export { default as Hal } from './components/Hal.vue';
export { default as HalEmbedded } from './components/HalEmbedded.vue';
export { default as HalLink } from './components/HalLink.vue';

// Component prop types
export type { HalProps } from './components/Hal.vue';
export type { HalEmbeddedProps, HalEmbeddedSlotProps } from './components/HalEmbedded.vue';
export type { HalLinkProps, HalLinkSlotProps } from './components/HalLink.vue';

// Context / Provider
export {
  useHalProvider,
  useHalClient,
  useHasHalProvider,
  HalClientKey,
  type HalProviderOptions,
} from './context/halProvider';

export {
  useHypermediaContext,
  provideHypermediaContext,
  useResourceData,
  useEmbedded,
  useHasLink,
  useLinkHref,
  HypermediaContextKey,
  type HypermediaContextType,
} from './context/hypermediaContext';

// Composables
export { useHypermedia, type UseHypermediaResult } from './composables/useHypermedia';
export {
  useAction,
  type UseActionOptions,
  type UseActionResult,
  type ActionMethod,
} from './composables/useAction';

// Engine - Client
export {
  createHalClient,
  initializeHalClient,
  getHalClient,
  isHalClientInitialized,
  resetHalClient,
  type HalClientOptions,
  type Client,
} from './engine/client';

// Engine - Cache
export {
  invalidateResource,
  invalidateResources,
  invalidateParent,
  clearCache,
  getSelfUri,
} from './engine/cache';

// Types
export type {
  HalLink as HalLinkType,
  HalLinks,
  HalEmbedded as HalEmbeddedType,
  HalResource,
  HalResourceData,
  HalTemplate,
  HalTemplates,
  HalTemplateProperty,
  HalTemplateOption,
} from './types/hal';
export { isHalResource, isHalResourceArray, getEmbedded, getLink, getTemplate } from './types/hal';

// Utils
export { expandUriTemplate, isUriTemplate, type TemplateParams } from './utils/uriTemplate';
