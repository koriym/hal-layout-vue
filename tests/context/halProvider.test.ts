/**
 * Tests for HAL Provider
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import {
  useHalProvider,
  useHalClient,
  useHasHalProvider,
  HalClientKey,
} from '../../src/context/halProvider';
import { Client } from 'ketting';

describe('HAL Provider', () => {
  describe('useHalProvider', () => {
    it('should provide client to descendants', () => {
      let receivedClient: unknown = null;

      const ChildComponent = defineComponent({
        setup() {
          receivedClient = useHalClient();
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          useHalProvider({ baseUrl: 'https://api.example.com' });
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(receivedClient).toBeDefined();
      expect(receivedClient).toBeInstanceOf(Client);
    });

    it('should use custom client when provided', () => {
      const customClient = new Client('https://custom.example.com');
      let receivedClient: unknown = null;

      const ChildComponent = defineComponent({
        setup() {
          receivedClient = useHalClient();
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          useHalProvider({
            baseUrl: 'https://api.example.com',
            client: customClient,
          });
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(receivedClient).toBe(customClient);
    });

    it('should return the created client', () => {
      let returnedClient: unknown = null;

      const Component = defineComponent({
        setup() {
          returnedClient = useHalProvider({ baseUrl: 'https://api.example.com' });
          return () => h('div', 'Test');
        },
      });

      mount(Component);

      expect(returnedClient).toBeInstanceOf(Client);
    });
  });

  describe('useHalClient', () => {
    it('should throw when used outside provider', () => {
      const Component = defineComponent({
        setup() {
          expect(() => useHalClient()).toThrow(
            'useHalClient must be used within a component that called useHalProvider.'
          );
          return () => h('div', 'Test');
        },
      });

      mount(Component);
    });
  });

  describe('useHasHalProvider', () => {
    it('should return true when provider exists', () => {
      let hasProvider = false;

      const ChildComponent = defineComponent({
        setup() {
          hasProvider = useHasHalProvider();
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          useHalProvider({ baseUrl: 'https://api.example.com' });
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(hasProvider).toBe(true);
    });

    it('should return false when provider does not exist', () => {
      let hasProvider = true;

      const Component = defineComponent({
        setup() {
          hasProvider = useHasHalProvider();
          return () => h('div', 'Test');
        },
      });

      mount(Component);

      expect(hasProvider).toBe(false);
    });
  });
});
