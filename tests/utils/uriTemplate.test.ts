/**
 * Tests for URI Template utilities
 */

import { describe, it, expect } from 'vitest';
import { expandUriTemplate, isUriTemplate } from '../../src/utils/uriTemplate';

describe('URI Template Utilities', () => {
  describe('expandUriTemplate', () => {
    it('should expand simple path parameters', () => {
      const result = expandUriTemplate('/posts/{id}', { id: 123 });
      expect(result).toBe('/posts/123');
    });

    it('should expand multiple path parameters', () => {
      const result = expandUriTemplate('/users/{userId}/posts/{postId}', {
        userId: 1,
        postId: 42,
      });
      expect(result).toBe('/users/1/posts/42');
    });

    it('should expand query string parameters', () => {
      const result = expandUriTemplate('/posts{?q,page}', { q: 'hello', page: 2 });
      expect(result).toBe('/posts?q=hello&page=2');
    });

    it('should expand query continuation parameters', () => {
      const result = expandUriTemplate('/posts?sort=date{&page,limit}', {
        page: 2,
        limit: 10,
      });
      expect(result).toBe('/posts?sort=date&page=2&limit=10');
    });

    it('should skip undefined parameters', () => {
      const result = expandUriTemplate('/posts{?q,page}', { q: 'hello' });
      expect(result).toBe('/posts?q=hello');
    });

    it('should skip null parameters', () => {
      const result = expandUriTemplate('/posts{?q,page}', { q: 'hello', page: null });
      expect(result).toBe('/posts?q=hello');
    });

    it('should skip empty string parameters', () => {
      const result = expandUriTemplate('/posts{?q,page}', { q: '', page: 2 });
      expect(result).toBe('/posts?page=2');
    });

    it('should handle boolean parameters', () => {
      const result = expandUriTemplate('/posts{?active}', { active: true });
      expect(result).toBe('/posts?active=true');
    });

    it('should encode special characters', () => {
      const result = expandUriTemplate('/search{?q}', { q: 'hello world' });
      expect(result).toBe('/search?q=hello%20world');
    });

    it('should remove unexpanded templates when no params', () => {
      const result = expandUriTemplate('/posts/{id}', {});
      expect(result).toBe('/posts/');
    });

    it('should remove unexpanded templates when params is empty', () => {
      const result = expandUriTemplate('/posts{?q}', {});
      expect(result).toBe('/posts');
    });

    it('should handle empty query expansion', () => {
      const result = expandUriTemplate('/posts{?q,page}', {});
      expect(result).toBe('/posts');
    });

    it('should handle empty query continuation', () => {
      const result = expandUriTemplate('/posts?sort=date{&page}', {});
      expect(result).toBe('/posts?sort=date');
    });

    it('should handle mixed expansion types', () => {
      const result = expandUriTemplate('/users/{id}/posts{?page,limit}', {
        id: 1,
        page: 2,
        limit: 10,
      });
      expect(result).toBe('/users/1/posts?page=2&limit=10');
    });

    it('should remove path parameter when value is null', () => {
      const result = expandUriTemplate('/posts/{id}', { id: null });
      expect(result).toBe('/posts/');
    });

    it('should remove path parameter when value is undefined', () => {
      const result = expandUriTemplate('/posts/{id}', { id: undefined });
      expect(result).toBe('/posts/');
    });

    it('should handle path parameter with whitespace in variable name', () => {
      const result = expandUriTemplate('/posts/{ id }', { id: 123 });
      expect(result).toBe('/posts/123');
    });
  });

  describe('isUriTemplate', () => {
    it('should return true for simple templates', () => {
      expect(isUriTemplate('/posts/{id}')).toBe(true);
    });

    it('should return true for query templates', () => {
      expect(isUriTemplate('/posts{?q,page}')).toBe(true);
    });

    it('should return true for continuation templates', () => {
      expect(isUriTemplate('/posts?sort=date{&page}')).toBe(true);
    });

    it('should return false for plain URIs', () => {
      expect(isUriTemplate('/posts/123')).toBe(false);
    });

    it('should return false for URIs with query strings', () => {
      expect(isUriTemplate('/posts?page=1')).toBe(false);
    });
  });
});
