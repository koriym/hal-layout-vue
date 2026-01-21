/**
 * Tests for Hypermedia Context
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import {
  useHypermediaContext,
  provideHypermediaContext,
  useResourceData,
  useEmbedded,
  useHasLink,
  useLinkHref,
  HypermediaContextKey,
  type HypermediaContextType,
} from '../../src/context/hypermediaContext';
import type { HalResource } from '../../src/types/hal';

describe('Hypermedia Context', () => {
  const createMockContext = (data: HalResource): HypermediaContextType => ({
    resource: ref(null),
    state: ref({
      uri: '/test',
      data,
      headers: new Headers(),
      links: [],
    }),
    loading: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  });

  describe('useHypermediaContext', () => {
    it('should return context when provided', () => {
      let receivedContext: HypermediaContextType | null = null;
      const mockContext = createMockContext({
        _links: { self: { href: '/test' } },
        title: 'Test',
      });

      const ChildComponent = defineComponent({
        setup() {
          receivedContext = useHypermediaContext();
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(receivedContext).toBe(mockContext);
    });

    it('should throw when used outside context', () => {
      const Component = defineComponent({
        setup() {
          expect(() => useHypermediaContext()).toThrow(
            'useHypermediaContext must be used within a <Hal> component.'
          );
          return () => h('div', 'Test');
        },
      });

      mount(Component);
    });
  });

  describe('provideHypermediaContext', () => {
    it('should provide context to descendants', () => {
      const mockContext = createMockContext({
        _links: { self: { href: '/test' } },
      });

      let receivedContext: HypermediaContextType | null = null;

      const ChildComponent = defineComponent({
        setup() {
          receivedContext = useHypermediaContext();
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(receivedContext).toBe(mockContext);
    });
  });

  describe('useEmbedded', () => {
    it('should return embedded resource', () => {
      const mockContext = createMockContext({
        _links: { self: { href: '/test' } },
        _embedded: {
          author: { _links: { self: { href: '/users/1' } }, name: 'John' },
        },
      });

      let embedded: unknown = null;

      const ChildComponent = defineComponent({
        setup() {
          embedded = useEmbedded('author');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(embedded).toEqual({ _links: { self: { href: '/users/1' } }, name: 'John' });
    });

    it('should return null when embedded not found', () => {
      const mockContext = createMockContext({
        _links: { self: { href: '/test' } },
      });

      let embedded: unknown = 'initial';

      const ChildComponent = defineComponent({
        setup() {
          embedded = useEmbedded('nonexistent');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(embedded).toBeNull();
    });

    it('should return null when loading', () => {
      const mockContext: HypermediaContextType = {
        resource: ref(null),
        state: ref(null),
        loading: ref(true),
        error: ref(null),
        refresh: vi.fn(),
      };

      let embedded: unknown = 'initial';

      const ChildComponent = defineComponent({
        setup() {
          embedded = useEmbedded('author');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(embedded).toBeNull();
    });
  });

  describe('useHasLink', () => {
    it('should return true when link exists', () => {
      const mockContext = createMockContext({
        _links: {
          self: { href: '/test' },
          edit: { href: '/test/edit' },
        },
      });

      let hasLink = false;

      const ChildComponent = defineComponent({
        setup() {
          hasLink = useHasLink('edit');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(hasLink).toBe(true);
    });

    it('should return false when link does not exist', () => {
      const mockContext = createMockContext({
        _links: { self: { href: '/test' } },
      });

      let hasLink = true;

      const ChildComponent = defineComponent({
        setup() {
          hasLink = useHasLink('nonexistent');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(hasLink).toBe(false);
    });

    it('should return false when loading', () => {
      const mockContext: HypermediaContextType = {
        resource: ref(null),
        state: ref(null),
        loading: ref(true),
        error: ref(null),
        refresh: vi.fn(),
      };

      let hasLink = true;

      const ChildComponent = defineComponent({
        setup() {
          hasLink = useHasLink('edit');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(hasLink).toBe(false);
    });
  });

  describe('useLinkHref', () => {
    it('should return link href', () => {
      const mockContext = createMockContext({
        _links: {
          self: { href: '/test' },
          edit: { href: '/test/edit' },
        },
      });

      let href: string | null = null;

      const ChildComponent = defineComponent({
        setup() {
          href = useLinkHref('edit');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(href).toBe('/test/edit');
    });

    it('should return first href for array of links', () => {
      const mockContext = createMockContext({
        _links: {
          self: { href: '/test' },
          related: [{ href: '/related/1' }, { href: '/related/2' }],
        },
      });

      let href: string | null = null;

      const ChildComponent = defineComponent({
        setup() {
          href = useLinkHref('related');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(href).toBe('/related/1');
    });

    it('should return null when link does not exist', () => {
      const mockContext = createMockContext({
        _links: { self: { href: '/test' } },
      });

      let href: string | null = 'initial';

      const ChildComponent = defineComponent({
        setup() {
          href = useLinkHref('nonexistent');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(href).toBeNull();
    });

    it('should return null when loading', () => {
      const mockContext: HypermediaContextType = {
        resource: ref(null),
        state: ref(null),
        loading: ref(true),
        error: ref(null),
        refresh: vi.fn(),
      };

      let href: string | null = 'initial';

      const ChildComponent = defineComponent({
        setup() {
          href = useLinkHref('edit');
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(href).toBeNull();
    });
  });

  describe('useResourceData', () => {
    it('should return resource data without HAL metadata', () => {
      const mockContext = createMockContext({
        _links: { self: { href: '/test' } },
        _embedded: { author: { _links: { self: { href: '/users/1' } }, name: 'John' } },
        title: 'Test Title',
        body: 'Test Body',
      });

      let dataRef: ReturnType<typeof useResourceData<{ title: string; body: string }>> | null = null;

      const ChildComponent = defineComponent({
        setup() {
          dataRef = useResourceData<{ title: string; body: string }>();
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(dataRef!.value).toEqual({ title: 'Test Title', body: 'Test Body' });
    });

    it('should return null when loading', () => {
      const mockContext: HypermediaContextType = {
        resource: ref(null),
        state: ref(null),
        loading: ref(true),
        error: ref(null),
        refresh: vi.fn(),
      };

      let dataRef: ReturnType<typeof useResourceData> | null = null;

      const ChildComponent = defineComponent({
        setup() {
          dataRef = useResourceData();
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(dataRef!.value).toBeNull();
    });

    it('should return null when data is null', () => {
      const mockContext: HypermediaContextType = {
        resource: ref(null),
        state: ref({
          uri: '/test',
          data: null as unknown as HalResource,
          headers: new Headers(),
          links: [],
        }),
        loading: ref(false),
        error: ref(null),
        refresh: vi.fn(),
      };

      let dataRef: ReturnType<typeof useResourceData> | null = null;

      const ChildComponent = defineComponent({
        setup() {
          dataRef = useResourceData();
          return () => h('div', 'Child');
        },
      });

      const ParentComponent = defineComponent({
        setup() {
          provideHypermediaContext(mockContext);
          return () => h(ChildComponent);
        },
      });

      mount(ParentComponent);

      expect(dataRef!.value).toBeNull();
    });
  });
});
