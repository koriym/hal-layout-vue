/**
 * Tests for HAL client utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createHalClient,
  initializeHalClient,
  getHalClient,
  isHalClientInitialized,
  resetHalClient,
} from '../../src/engine/client';

describe('HAL Client Utilities', () => {
  beforeEach(() => {
    resetHalClient();
  });

  afterEach(() => {
    resetHalClient();
  });

  describe('createHalClient', () => {
    it('should create a client with base URL', () => {
      const client = createHalClient({ baseUrl: 'https://api.example.com' });
      expect(client).toBeDefined();
    });

    it('should create a client with custom headers', () => {
      const client = createHalClient({
        baseUrl: 'https://api.example.com',
        headers: { 'X-Custom-Header': 'value' },
      });
      expect(client).toBeDefined();
    });

    it('should create a client with fetch init options', () => {
      const client = createHalClient({
        baseUrl: 'https://api.example.com',
        fetchInit: {
          credentials: 'include',
          headers: { 'X-Init-Header': 'value' },
        },
      });
      expect(client).toBeDefined();
    });
  });

  describe('initializeHalClient', () => {
    it('should initialize default client', () => {
      const client = initializeHalClient({ baseUrl: 'https://api.example.com' });
      expect(client).toBeDefined();
      expect(isHalClientInitialized()).toBe(true);
    });

    it('should return the initialized client', () => {
      const client = initializeHalClient({ baseUrl: 'https://api.example.com' });
      expect(getHalClient()).toBe(client);
    });
  });

  describe('getHalClient', () => {
    it('should throw error when not initialized', () => {
      expect(() => getHalClient()).toThrow(
        'HAL client is not initialized. Call initializeHalClient() or wrap your app in <HalProvider>.'
      );
    });

    it('should return client when initialized', () => {
      initializeHalClient({ baseUrl: 'https://api.example.com' });
      expect(() => getHalClient()).not.toThrow();
    });
  });

  describe('isHalClientInitialized', () => {
    it('should return false when not initialized', () => {
      expect(isHalClientInitialized()).toBe(false);
    });

    it('should return true when initialized', () => {
      initializeHalClient({ baseUrl: 'https://api.example.com' });
      expect(isHalClientInitialized()).toBe(true);
    });
  });

  describe('resetHalClient', () => {
    it('should reset the client', () => {
      initializeHalClient({ baseUrl: 'https://api.example.com' });
      expect(isHalClientInitialized()).toBe(true);

      resetHalClient();
      expect(isHalClientInitialized()).toBe(false);
    });
  });

});
