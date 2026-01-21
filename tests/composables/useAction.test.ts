/**
 * Tests for useAction composable
 */

import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { useAction, type UseActionResult } from '../../src/composables/useAction';
import { provideHypermediaContext, type HypermediaContextType } from '../../src/context/hypermediaContext';
import { HalClientKey } from '../../src/context/halProvider';
import { MockClient } from '../mocks/ketting';
import type { HalResource } from '../../src/types/hal';

describe('useAction Composable', () => {
  const createMockContext = (
    data: HalResource,
    mockClient: MockClient
  ): HypermediaContextType => {
    const resource = mockClient.go('/test');

    return {
      resource: ref(resource) as HypermediaContextType['resource'],
      state: ref({
        uri: '/test',
        data,
        headers: new Headers(),
        links: [],
      }),
      loading: ref(false),
      error: ref(null),
      refresh: vi.fn().mockResolvedValue(undefined),
    };
  };

  it('should return available=true when link exists', () => {
    const mockClient = new MockClient();
    const mockContext = createMockContext(
      {
        _links: {
          self: { href: '/posts/1' },
          delete: { href: '/posts/1' },
        },
      },
      mockClient
    );

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({ rel: 'delete', method: 'DELETE' });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(result!.available.value).toBe(true);
    expect(result!.link.value).toEqual({ href: '/posts/1' });
    expect(result!.href.value).toBe('/posts/1');
  });

  it('should return available=false when link does not exist', () => {
    const mockClient = new MockClient();
    const mockContext = createMockContext(
      {
        _links: { self: { href: '/posts/1' } },
      },
      mockClient
    );

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({ rel: 'nonexistent', method: 'DELETE' });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(result!.available.value).toBe(false);
    expect(result!.link.value).toBeNull();
    expect(result!.href.value).toBeNull();
  });

  it('should expand URI template with params', () => {
    const mockClient = new MockClient();
    const mockContext = createMockContext(
      {
        _links: {
          self: { href: '/posts' },
          search: { href: '/posts{?q,page}', templated: true },
        },
      },
      mockClient
    );

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({
          rel: 'search',
          method: 'GET',
          params: { q: 'hello', page: 2 },
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(result!.href.value).toBe('/posts?q=hello&page=2');
  });

  it('should execute DELETE action successfully', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1', {
      _links: { self: { href: '/posts/1' } },
    });

    const mockContext = createMockContext(
      {
        _links: {
          self: { href: '/posts/1' },
          delete: { href: '/posts/1' },
        },
      },
      mockClient
    );

    const onSuccess = vi.fn();
    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({
          rel: 'delete',
          method: 'DELETE',
          onSuccess,
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute();
    await flushPromises();

    expect(onSuccess).toHaveBeenCalled();
    expect(result!.loading.value).toBe(false);
    expect(result!.error.value).toBeNull();
  });

  it('should execute POST action with body', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts', {
      _links: { self: { href: '/posts' } },
    });

    const mockContext = createMockContext(
      {
        _links: {
          self: { href: '/posts' },
          create: { href: '/posts' },
        },
      },
      mockClient
    );

    let result: UseActionResult<{ title: string }> | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction<{ title: string }>({
          rel: 'create',
          method: 'POST',
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute({ title: 'New Post' });
    await flushPromises();

    expect(result!.error.value).toBeNull();
  });

  it('should execute PUT action', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1', {
      _links: { self: { href: '/posts/1' } },
    });

    const mockContext = createMockContext(
      {
        _links: {
          self: { href: '/posts/1' },
          edit: { href: '/posts/1' },
        },
      },
      mockClient
    );

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({ rel: 'edit', method: 'PUT' });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute({ title: 'Updated' });
    await flushPromises();

    expect(result!.error.value).toBeNull();
  });

  it('should execute PATCH action', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1', {
      _links: { self: { href: '/posts/1' } },
    });

    const mockContext = createMockContext(
      {
        _links: {
          self: { href: '/posts/1' },
          patch: { href: '/posts/1' },
        },
      },
      mockClient
    );

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({ rel: 'patch', method: 'PATCH' });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute({ title: 'Patched' });
    await flushPromises();

    expect(result!.error.value).toBeNull();
  });

  it('should execute GET action', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1', {
      _links: { self: { href: '/posts/1' } },
    });

    const mockContext = createMockContext(
      {
        _links: {
          self: { href: '/posts/1' },
          related: { href: '/posts/1/related' },
        },
      },
      mockClient
    );

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({ rel: 'related', method: 'GET' });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute();
    await flushPromises();

    expect(result!.error.value).toBeNull();
  });

  it('should set error when link not found during execute', async () => {
    const mockClient = new MockClient();
    const mockContext = createMockContext(
      {
        _links: { self: { href: '/posts/1' } },
      },
      mockClient
    );

    const onError = vi.fn();
    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({
          rel: 'nonexistent',
          method: 'DELETE',
          onError,
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    const response = await result!.execute();

    expect(response).toBeNull();
    expect(result!.error.value).toBeInstanceOf(Error);
    expect(result!.error.value?.message).toContain('nonexistent');
    expect(onError).toHaveBeenCalled();
  });

  it('should reset error', async () => {
    const mockClient = new MockClient();
    const mockContext = createMockContext(
      {
        _links: { self: { href: '/posts/1' } },
      },
      mockClient
    );

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({ rel: 'nonexistent', method: 'DELETE' });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute();
    expect(result!.error.value).not.toBeNull();

    result!.resetError();
    expect(result!.error.value).toBeNull();
  });

  it('should use first link from array', () => {
    const mockClient = new MockClient();
    const mockContext = createMockContext(
      {
        _links: {
          self: { href: '/posts/1' },
          related: [{ href: '/related/1' }, { href: '/related/2' }],
        },
      },
      mockClient
    );

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({ rel: 'related', method: 'GET' });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(result!.link.value).toEqual({ href: '/related/1' });
    expect(result!.href.value).toBe('/related/1');
  });

  it('should call refresh when refreshParent=true', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1', {
      _links: { self: { href: '/posts/1' } },
    });

    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const mockContext: HypermediaContextType = {
      resource: ref(mockClient.go('/posts/1')) as HypermediaContextType['resource'],
      state: ref({
        uri: '/posts/1',
        data: {
          _links: {
            self: { href: '/posts/1' },
            delete: { href: '/posts/1' },
          },
        },
        headers: new Headers(),
        links: [],
      }),
      loading: ref(false),
      error: ref(null),
      refresh: mockRefresh,
    };

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({
          rel: 'delete',
          method: 'DELETE',
          refreshParent: true,
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute();
    await flushPromises();

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should invalidate specified relations', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1', {
      _links: { self: { href: '/posts/1' } },
    });
    mockClient.setResource('/posts', {
      _links: { self: { href: '/posts' } },
    });

    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const mockContext: HypermediaContextType = {
      resource: ref(mockClient.go('/posts/1')) as HypermediaContextType['resource'],
      state: ref({
        uri: '/posts/1',
        data: {
          _links: {
            self: { href: '/posts/1' },
            delete: { href: '/posts/1' },
            collection: { href: '/posts' },
          },
        },
        headers: new Headers(),
        links: [],
      }),
      loading: ref(false),
      error: ref(null),
      refresh: mockRefresh,
    };

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({
          rel: 'delete',
          method: 'DELETE',
          invalidates: ['collection'],
          refreshParent: false,
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute();
    await flushPromises();

    // Should have executed without error
    expect(result!.error.value).toBeNull();
  });

  it('should invalidate array links', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1', {
      _links: { self: { href: '/posts/1' } },
    });
    mockClient.setResource('/tags/1', {
      _links: { self: { href: '/tags/1' } },
    });

    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const mockContext: HypermediaContextType = {
      resource: ref(mockClient.go('/posts/1')) as HypermediaContextType['resource'],
      state: ref({
        uri: '/posts/1',
        data: {
          _links: {
            self: { href: '/posts/1' },
            update: { href: '/posts/1' },
            tags: [{ href: '/tags/1' }, { href: '/tags/2' }],
          },
        },
        headers: new Headers(),
        links: [],
      }),
      loading: ref(false),
      error: ref(null),
      refresh: mockRefresh,
    };

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({
          rel: 'update',
          method: 'PUT',
          invalidates: ['tags'],
          refreshParent: false,
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute({ title: 'Updated' });
    await flushPromises();

    expect(result!.error.value).toBeNull();
  });

  it('should handle error during action execution', async () => {
    const mockClient = new MockClient();
    const serverError = new Error('Server error');

    // Create a mock resource that throws error on delete
    const mockResource = {
      go: vi.fn().mockReturnValue({
        delete: vi.fn().mockRejectedValue(serverError),
      }),
    };

    const mockContext: HypermediaContextType = {
      resource: ref(mockResource) as HypermediaContextType['resource'],
      state: ref({
        uri: '/posts/1',
        data: {
          _links: {
            self: { href: '/posts/1' },
            delete: { href: '/posts/1' },
          },
        },
        headers: new Headers(),
        links: [],
      }),
      loading: ref(false),
      error: ref(null),
      refresh: vi.fn(),
    };

    const onError = vi.fn();
    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({
          rel: 'delete',
          method: 'DELETE',
          onError,
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute();
    await flushPromises();

    expect(result!.error.value).toBeInstanceOf(Error);
    expect(result!.error.value?.message).toBe('Server error');
    expect(onError).toHaveBeenCalledWith(serverError);
  });

  it('should handle non-Error thrown during action', async () => {
    const mockClient = new MockClient();

    // Create a mock that throws a string
    const mockResource = {
      go: vi.fn().mockReturnValue({
        delete: vi.fn().mockRejectedValue('string error'),
      }),
    };

    const mockContext: HypermediaContextType = {
      resource: ref(mockResource) as HypermediaContextType['resource'],
      state: ref({
        uri: '/posts/1',
        data: {
          _links: {
            self: { href: '/posts/1' },
            delete: { href: '/posts/1' },
          },
        },
        headers: new Headers(),
        links: [],
      }),
      loading: ref(false),
      error: ref(null),
      refresh: vi.fn(),
    };

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        result = useAction({
          rel: 'delete',
          method: 'DELETE',
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute();
    await flushPromises();

    expect(result!.error.value).toBeInstanceOf(Error);
    expect(result!.error.value?.message).toBe('string error');
  });

  it('should throw error for unsupported method', async () => {
    const mockClient = new MockClient();

    const mockResource = {
      go: vi.fn().mockReturnValue({}),
    };

    const mockContext: HypermediaContextType = {
      resource: ref(mockResource) as HypermediaContextType['resource'],
      state: ref({
        uri: '/posts/1',
        data: {
          _links: {
            self: { href: '/posts/1' },
            action: { href: '/posts/1/action' },
          },
        },
        headers: new Headers(),
        links: [],
      }),
      loading: ref(false),
      error: ref(null),
      refresh: vi.fn(),
    };

    let result: UseActionResult | null = null;

    const ChildComponent = defineComponent({
      setup() {
        // Cast to any to test unsupported method at runtime
        result = useAction({
          rel: 'action',
          method: 'OPTIONS' as unknown as 'GET',
        });
        return () => h('div', 'Child');
      },
    });

    const ParentComponent = defineComponent({
      setup() {
        provideHypermediaContext(mockContext);
        return () => h(ChildComponent);
      },
    });

    mount(ParentComponent, {
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await result!.execute();
    await flushPromises();

    expect(result!.error.value).toBeInstanceOf(Error);
    expect(result!.error.value?.message).toBe('Unsupported method: OPTIONS');
  });
});
