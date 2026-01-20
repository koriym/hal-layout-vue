/**
 * Tests for HAL type definitions and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isHalResource,
  isHalResourceArray,
  getEmbedded,
  getLink,
  getTemplate,
  type HalResource,
} from '../../src/types/hal';

describe('HAL Type Utilities', () => {
  describe('isHalResource', () => {
    it('should return true for valid HAL resource', () => {
      const resource: HalResource = {
        _links: {
          self: { href: '/posts/1' },
        },
        title: 'Test Post',
      };
      expect(isHalResource(resource)).toBe(true);
    });

    it('should return false for object without _links', () => {
      const notResource = { title: 'Test' };
      expect(isHalResource(notResource)).toBe(false);
    });

    it('should return false for object without self link', () => {
      const notResource = {
        _links: {
          next: { href: '/posts/2' },
        },
      };
      expect(isHalResource(notResource)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isHalResource(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isHalResource(undefined)).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isHalResource('string')).toBe(false);
      expect(isHalResource(123)).toBe(false);
      expect(isHalResource(true)).toBe(false);
    });
  });

  describe('isHalResourceArray', () => {
    it('should return true for array', () => {
      const resources: HalResource[] = [
        { _links: { self: { href: '/1' } } },
        { _links: { self: { href: '/2' } } },
      ];
      expect(isHalResourceArray(resources)).toBe(true);
    });

    it('should return false for single resource', () => {
      const resource: HalResource = { _links: { self: { href: '/1' } } };
      expect(isHalResourceArray(resource)).toBe(false);
    });
  });

  describe('getEmbedded', () => {
    const resource: HalResource = {
      _links: { self: { href: '/posts/1' } },
      _embedded: {
        author: { _links: { self: { href: '/users/1' } }, name: 'John' },
        comments: [
          { _links: { self: { href: '/comments/1' } }, text: 'Comment 1' },
          { _links: { self: { href: '/comments/2' } }, text: 'Comment 2' },
        ],
      },
    };

    it('should return single embedded resource', () => {
      const author = getEmbedded(resource, 'author');
      expect(author).toEqual({
        _links: { self: { href: '/users/1' } },
        name: 'John',
      });
    });

    it('should return array of embedded resources', () => {
      const comments = getEmbedded(resource, 'comments');
      expect(Array.isArray(comments)).toBe(true);
      expect(comments).toHaveLength(2);
    });

    it('should return null for non-existent relation', () => {
      const notFound = getEmbedded(resource, 'nonexistent');
      expect(notFound).toBeNull();
    });

    it('should return null when _embedded is missing', () => {
      const noEmbedded: HalResource = { _links: { self: { href: '/' } } };
      expect(getEmbedded(noEmbedded, 'author')).toBeNull();
    });
  });

  describe('getLink', () => {
    const resource: HalResource = {
      _links: {
        self: { href: '/posts/1' },
        next: { href: '/posts/2' },
        tags: [{ href: '/tags/1' }, { href: '/tags/2' }],
      },
    };

    it('should return single link', () => {
      const link = getLink(resource, 'next');
      expect(link).toEqual({ href: '/posts/2' });
    });

    it('should return array of links', () => {
      const links = getLink(resource, 'tags');
      expect(Array.isArray(links)).toBe(true);
      expect(links).toHaveLength(2);
    });

    it('should return null for non-existent relation', () => {
      const notFound = getLink(resource, 'nonexistent');
      expect(notFound).toBeNull();
    });

    it('should return null when _links is missing', () => {
      const noLinks = {} as HalResource;
      expect(getLink(noLinks, 'self')).toBeNull();
    });
  });

  describe('getTemplate', () => {
    const resource: HalResource = {
      _links: { self: { href: '/posts/1' } },
      _templates: {
        default: {
          method: 'PUT',
          properties: [{ name: 'title', type: 'text' }],
        },
        delete: {
          method: 'DELETE',
        },
      },
    };

    it('should return default template when no name specified', () => {
      const template = getTemplate(resource);
      expect(template).toEqual({
        method: 'PUT',
        properties: [{ name: 'title', type: 'text' }],
      });
    });

    it('should return named template', () => {
      const template = getTemplate(resource, 'delete');
      expect(template).toEqual({ method: 'DELETE' });
    });

    it('should return null for non-existent template', () => {
      const notFound = getTemplate(resource, 'nonexistent');
      expect(notFound).toBeNull();
    });

    it('should return null when _templates is missing', () => {
      const noTemplates: HalResource = { _links: { self: { href: '/' } } };
      expect(getTemplate(noTemplates)).toBeNull();
    });
  });
});
