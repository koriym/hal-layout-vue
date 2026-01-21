/**
 * Tests for cache utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  invalidateResource,
  invalidateResources,
  invalidateParent,
  clearCache,
  getSelfUri,
} from '../../src/engine/cache';

describe('Cache Utilities', () => {
  describe('invalidateResource', () => {
    it('should refresh the resource', async () => {
      const mockRefresh = vi.fn().mockResolvedValue(undefined);
      const mockClient = {
        go: vi.fn().mockReturnValue({
          refresh: mockRefresh,
        }),
      };

      await invalidateResource(mockClient as any, '/posts/1');

      expect(mockClient.go).toHaveBeenCalledWith('/posts/1');
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should ignore errors when resource is not cached', async () => {
      const mockClient = {
        go: vi.fn().mockReturnValue({
          refresh: vi.fn().mockRejectedValue(new Error('Not cached')),
        }),
      };

      // Should not throw
      await expect(invalidateResource(mockClient as any, '/posts/1')).resolves.toBeUndefined();
    });
  });

  describe('invalidateResources', () => {
    it('should refresh multiple resources', async () => {
      const mockRefresh = vi.fn().mockResolvedValue(undefined);
      const mockClient = {
        go: vi.fn().mockReturnValue({
          refresh: mockRefresh,
        }),
      };

      await invalidateResources(mockClient as any, ['/posts/1', '/posts/2', '/posts/3']);

      expect(mockClient.go).toHaveBeenCalledTimes(3);
      expect(mockRefresh).toHaveBeenCalledTimes(3);
    });

    it('should handle empty array', async () => {
      const mockClient = {
        go: vi.fn(),
      };

      await invalidateResources(mockClient as any, []);

      expect(mockClient.go).not.toHaveBeenCalled();
    });
  });

  describe('invalidateParent', () => {
    it('should refresh parent via up link', async () => {
      const mockParentRefresh = vi.fn().mockResolvedValue(undefined);
      const mockFollow = vi.fn().mockResolvedValue({
        refresh: mockParentRefresh,
      });

      const mockResource = {
        links: vi.fn().mockResolvedValue([
          { rel: 'up', href: '/posts' },
        ]),
        follow: mockFollow,
      };

      await invalidateParent(mockResource as any);

      expect(mockFollow).toHaveBeenCalledWith('up');
      expect(mockParentRefresh).toHaveBeenCalled();
    });

    it('should refresh parent via collection link', async () => {
      const mockParentRefresh = vi.fn().mockResolvedValue(undefined);
      const mockFollow = vi.fn().mockResolvedValue({
        refresh: mockParentRefresh,
      });

      const mockResource = {
        links: vi.fn().mockResolvedValue([
          { rel: 'collection', href: '/posts' },
        ]),
        follow: mockFollow,
      };

      await invalidateParent(mockResource as any);

      expect(mockFollow).toHaveBeenCalledWith('collection');
      expect(mockParentRefresh).toHaveBeenCalled();
    });

    it('should not throw when no parent link exists', async () => {
      const mockResource = {
        links: vi.fn().mockResolvedValue([
          { rel: 'self', href: '/posts/1' },
        ]),
      };

      await expect(invalidateParent(mockResource as any)).resolves.toBeUndefined();
    });

    it('should ignore errors', async () => {
      const mockResource = {
        links: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      await expect(invalidateParent(mockResource as any)).resolves.toBeUndefined();
    });
  });

  describe('clearCache', () => {
    it('should not throw', () => {
      const mockClient = {};
      expect(() => clearCache(mockClient as any)).not.toThrow();
    });
  });

  describe('getSelfUri', () => {
    it('should return the self URI from resource state', async () => {
      const mockResource = {
        get: vi.fn().mockResolvedValue({
          uri: '/posts/1',
          data: { title: 'Test' },
        }),
      };

      const uri = await getSelfUri(mockResource as any);

      expect(uri).toBe('/posts/1');
    });
  });
});
