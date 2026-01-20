/**
 * HAL Provider - Vue 3 Provide/Inject for HAL Hypermedia
 *
 * Provides the Ketting client to all descendant components.
 */

import { inject, provide, type InjectionKey } from 'vue';
import { Client } from 'ketting';
import { createHalClient, type HalClientOptions } from '../engine/client';

/**
 * Injection key for the Ketting client
 */
export const HalClientKey: InjectionKey<Client> = Symbol('HalClient');

/**
 * Props for useHalProvider
 */
export interface HalProviderOptions {
  /** Base URL for API requests */
  baseUrl: string;
  /** Optional custom Ketting client (if not provided, one will be created) */
  client?: Client;
  /** Additional client options */
  options?: Omit<HalClientOptions, 'baseUrl'>;
}

/**
 * Provide the HAL client to descendant components
 *
 * Call this in your root component's setup function:
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useHalProvider } from 'hal-layout-vue';
 *
 * useHalProvider({ baseUrl: 'https://api.example.com' });
 * </script>
 * ```
 */
export function useHalProvider(options: HalProviderOptions): Client {
  const { baseUrl, client: customClient, options: clientOptions } = options;

  const client = customClient ?? createHalClient({ baseUrl, ...clientOptions });

  provide(HalClientKey, client);

  return client;
}

/**
 * Inject the HAL client
 * @throws Error if used outside of HalProvider
 */
export function useHalClient(): Client {
  const client = inject(HalClientKey);
  if (!client) {
    throw new Error('useHalClient must be used within a component that called useHalProvider.');
  }
  return client;
}

/**
 * Check if HAL provider is available
 */
export function useHasHalProvider(): boolean {
  const client = inject(HalClientKey, null);
  return client !== null;
}
