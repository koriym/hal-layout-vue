/**
 * Tests for useHypermedia composable
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { useHypermedia, type UseHypermediaResult } from '../../src/composables/useHypermedia';
import { provideHypermediaContext, type HypermediaContextType } from '../../src/context/hypermediaContext';
import type { HalResource } from '../../src/types/hal';

describe('useHypermedia Composable', () => {
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

  it('should return data without HAL metadata', () => {
    const mockContext = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _embedded: { author: { _links: { self: { href: '/users/1' } }, name: 'John' } },
      title: 'Test Post',
      body: 'Content',
    });

    let result: UseHypermediaResult<{ title: string; body: string }> | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia<{ title: string; body: string }>();
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

    expect(result!.data.value).toEqual({ title: 'Test Post', body: 'Content' });
  });

  it('should return halData with all metadata', () => {
    const halResource: HalResource<{ title: string }> = {
      _links: { self: { href: '/posts/1' } },
      _embedded: { author: { _links: { self: { href: '/users/1' } }, name: 'John' } },
      title: 'Test Post',
    };

    const mockContext = createMockContext(halResource);

    let result: UseHypermediaResult<{ title: string }> | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia<{ title: string }>();
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

    expect(result!.halData.value).toEqual(halResource);
  });

  it('should return null data when state is null', () => {
    const mockContext: HypermediaContextType = {
      resource: ref(null),
      state: ref(null),
      loading: ref(true),
      error: ref(null),
      refresh: vi.fn(),
    };

    let result: UseHypermediaResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia();
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

    expect(result!.data.value).toBeNull();
    expect(result!.halData.value).toBeNull();
  });

  it('should provide getEmbedded function', () => {
    const mockContext = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _embedded: {
        author: { _links: { self: { href: '/users/1' } }, name: 'John' },
        comments: [
          { _links: { self: { href: '/comments/1' } }, text: 'Comment 1' },
          { _links: { self: { href: '/comments/2' } }, text: 'Comment 2' },
        ],
      },
    });

    let result: UseHypermediaResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia();
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

    expect(result!.getEmbedded('author')).toEqual({
      _links: { self: { href: '/users/1' } },
      name: 'John',
    });
    expect(result!.getEmbedded('comments')).toHaveLength(2);
    expect(result!.getEmbedded('nonexistent')).toBeNull();
  });

  it('should provide getLink function', () => {
    const mockContext = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        edit: { href: '/posts/1/edit' },
        tags: [{ href: '/tags/1' }, { href: '/tags/2' }],
      },
    });

    let result: UseHypermediaResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia();
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

    expect(result!.getLink('edit')).toEqual({ href: '/posts/1/edit' });
    expect(result!.getLink('tags')).toHaveLength(2);
    expect(result!.getLink('nonexistent')).toBeNull();
  });

  it('should provide hasLink function', () => {
    const mockContext = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        edit: { href: '/posts/1/edit' },
      },
    });

    let result: UseHypermediaResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia();
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

    expect(result!.hasLink('edit')).toBe(true);
    expect(result!.hasLink('nonexistent')).toBe(false);
  });

  it('should provide getTemplate and hasTemplate functions', () => {
    const mockContext = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _templates: {
        default: { method: 'PUT', properties: [{ name: 'title' }] },
        delete: { method: 'DELETE' },
      },
    });

    let result: UseHypermediaResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia();
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

    expect(result!.hasTemplate()).toBe(true);
    expect(result!.hasTemplate('delete')).toBe(true);
    expect(result!.hasTemplate('nonexistent')).toBe(false);

    expect(result!.getTemplate()).toEqual({ method: 'PUT', properties: [{ name: 'title' }] });
    expect(result!.getTemplate('delete')).toEqual({ method: 'DELETE' });
    expect(result!.getTemplate('nonexistent')).toBeNull();
  });

  it('should expose loading and error state', () => {
    const mockContext: HypermediaContextType = {
      resource: ref(null),
      state: ref(null),
      loading: ref(true),
      error: ref(new Error('Test error')),
      refresh: vi.fn(),
    };

    let result: UseHypermediaResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia();
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

    expect(result!.loading.value).toBe(true);
    expect(result!.error.value).toBeInstanceOf(Error);
    expect(result!.error.value?.message).toBe('Test error');
  });

  it('should expose refresh function', () => {
    const mockRefresh = vi.fn();
    const mockContext: HypermediaContextType = {
      resource: ref(null),
      state: ref({
        uri: '/test',
        data: { _links: { self: { href: '/test' } } },
        headers: new Headers(),
        links: [],
      }),
      loading: ref(false),
      error: ref(null),
      refresh: mockRefresh,
    };

    let result: UseHypermediaResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useHypermedia();
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

    result!.refresh();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
