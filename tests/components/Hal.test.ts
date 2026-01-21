/**
 * Tests for Hal component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { MockClient } from '../mocks/ketting';
import Hal from '../../src/components/Hal.vue';
import { HalClientKey } from '../../src/context/halProvider';
import type { HalResource } from '../../src/types/hal';

describe('Hal Component', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = new MockClient();
  });

  const createWrapper = (props: { uri: string; profile?: string; view?: string }) => {
    return mount(Hal, {
      props,
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
      slots: {
        default: '<div data-testid="content">Content loaded</div>',
        fallback: '<div data-testid="loading">Loading...</div>',
        error: '<div data-testid="error">Error occurred</div>',
      },
    });
  };

  it('should show loading state initially', () => {
    mockClient.setResource('/posts', {
      _links: { self: { href: '/posts' } },
      title: 'Posts',
    });

    const wrapper = createWrapper({ uri: '/posts' });

    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true);
  });

  it('should render children after loading', async () => {
    const postData: HalResource<{ title: string }> = {
      _links: { self: { href: '/posts/1' } },
      title: 'Test Post',
    };
    mockClient.setResource('/posts/1', postData);

    const wrapper = createWrapper({ uri: '/posts/1' });

    await flushPromises();

    expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false);
  });

  it('should show error state on fetch failure', async () => {
    mockClient.setResource('/error', { _links: { self: { href: '/error' } } }, new Error('Not found'));

    const wrapper = createWrapper({ uri: '/error' });

    await flushPromises();

    expect(wrapper.find('[data-testid="error"]').exists()).toBe(true);
  });

  it('should emit load event on successful fetch', async () => {
    const postData: HalResource<{ title: string }> = {
      _links: { self: { href: '/posts/1' } },
      title: 'Test Post',
    };
    mockClient.setResource('/posts/1', postData);

    const wrapper = createWrapper({ uri: '/posts/1' });

    await flushPromises();

    expect(wrapper.emitted('load')).toBeTruthy();
    expect(wrapper.emitted('load')![0][0]).toMatchObject({
      data: postData,
    });
  });

  it('should emit error event on fetch failure', async () => {
    const error = new Error('Network error');
    mockClient.setResource('/error', { _links: { self: { href: '/error' } } }, error);

    const wrapper = createWrapper({ uri: '/error' });

    await flushPromises();

    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.emitted('error')![0][0]).toBeInstanceOf(Error);
  });

  it('should append profile parameter to URI', async () => {
    const goSpy = vi.spyOn(mockClient, 'go');
    mockClient.setResource('/posts?profile=detailed', {
      _links: { self: { href: '/posts' } },
    });

    createWrapper({ uri: '/posts', profile: 'detailed' });

    await flushPromises();

    expect(goSpy).toHaveBeenCalledWith(expect.stringContaining('profile=detailed'));
  });

  it('should append view parameter to URI', async () => {
    const goSpy = vi.spyOn(mockClient, 'go');
    mockClient.setResource('/posts?view=summary', {
      _links: { self: { href: '/posts' } },
    });

    createWrapper({ uri: '/posts', view: 'summary' });

    await flushPromises();

    expect(goSpy).toHaveBeenCalledWith(expect.stringContaining('view=summary'));
  });

  it('should expose refresh function that reloads data', async () => {
    const postData: HalResource<{ title: string }> = {
      _links: { self: { href: '/posts/1' } },
      title: 'Test Post',
    };
    mockClient.setResource('/posts/1', postData);

    const wrapper = createWrapper({ uri: '/posts/1' });

    await flushPromises();

    // Call refresh via exposed method
    const vm = wrapper.vm as { refresh: () => Promise<void> };
    await vm.refresh();

    await flushPromises();

    // Should have emitted load event twice (initial + refresh)
    expect(wrapper.emitted('load')?.length).toBe(2);
  });

  it('should handle non-Error thrown during fetch', async () => {
    // Create a custom mock that throws a string
    const customMockClient = {
      go: vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue('string error'),
      }),
    };

    const wrapper = mount(Hal, {
      props: { uri: '/posts/1' },
      global: {
        provide: {
          [HalClientKey as symbol]: customMockClient,
        },
      },
      slots: {
        error: '<div data-testid="error">Error</div>',
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-testid="error"]').exists()).toBe(true);
    expect(wrapper.emitted('error')).toBeTruthy();
  });

  it('should refetch when URI changes', async () => {
    const postData1: HalResource<{ title: string }> = {
      _links: { self: { href: '/posts/1' } },
      title: 'Post 1',
    };
    const postData2: HalResource<{ title: string }> = {
      _links: { self: { href: '/posts/2' } },
      title: 'Post 2',
    };
    mockClient.setResource('/posts/1', postData1);
    mockClient.setResource('/posts/2', postData2);

    const wrapper = mount(Hal, {
      props: { uri: '/posts/1' },
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
      slots: {
        default: '<div data-testid="content">Content</div>',
      },
    });

    await flushPromises();

    expect(wrapper.emitted('load')?.length).toBe(1);

    // Change URI
    await wrapper.setProps({ uri: '/posts/2' });
    await flushPromises();

    expect(wrapper.emitted('load')?.length).toBe(2);
  });

  it('should emit error event on refresh failure', async () => {
    const refreshError = new Error('Refresh failed');

    // Custom mock that succeeds on initial load but fails on refresh
    const customMockClient = {
      go: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          uri: '/posts/1',
          data: { _links: { self: { href: '/posts/1' } }, title: 'Post' },
          headers: new Headers(),
          links: [],
        }),
        refresh: vi.fn().mockRejectedValue(refreshError),
      }),
    };

    const wrapper = mount(Hal, {
      props: { uri: '/posts/1' },
      global: {
        provide: {
          [HalClientKey as symbol]: customMockClient,
        },
      },
      slots: {
        default: '<div data-testid="content">Content</div>',
        error: '<div data-testid="error">Error</div>',
      },
    });

    await flushPromises();

    // Initial load should succeed
    expect(wrapper.emitted('load')?.length).toBe(1);

    // Call refresh which will fail
    const vm = wrapper.vm as { refresh: () => Promise<void> };
    await vm.refresh();
    await flushPromises();

    // Should have emitted error event
    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.emitted('error')![0][0]).toBe(refreshError);
  });

  it('should handle non-Error thrown during refresh', async () => {
    // Custom mock that succeeds on initial load but throws non-Error on refresh
    const customMockClient = {
      go: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          uri: '/posts/1',
          data: { _links: { self: { href: '/posts/1' } }, title: 'Post' },
          headers: new Headers(),
          links: [],
        }),
        refresh: vi.fn().mockRejectedValue('string error'),
      }),
    };

    const wrapper = mount(Hal, {
      props: { uri: '/posts/1' },
      global: {
        provide: {
          [HalClientKey as symbol]: customMockClient,
        },
      },
      slots: {
        default: '<div data-testid="content">Content</div>',
      },
    });

    await flushPromises();

    expect(wrapper.emitted('load')?.length).toBe(1);

    // Call refresh which throws string
    const vm = wrapper.vm as { refresh: () => Promise<void> };
    await vm.refresh();
    await flushPromises();

    // Should have emitted error event with Error instance
    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.emitted('error')![0][0]).toBeInstanceOf(Error);
    expect((wrapper.emitted('error')![0][0] as Error).message).toBe('string error');
  });

  it('should handle absolute URL for uri prop', async () => {
    const goSpy = vi.spyOn(mockClient, 'go');
    mockClient.setResource('https://api.example.com/posts', {
      _links: { self: { href: 'https://api.example.com/posts' } },
    });

    createWrapper({ uri: 'https://api.example.com/posts', profile: 'detailed' });

    await flushPromises();

    // For absolute URLs, the full URL with params should be used
    expect(goSpy).toHaveBeenCalledWith(expect.stringContaining('https://'));
    expect(goSpy).toHaveBeenCalledWith(expect.stringContaining('profile=detailed'));
  });

  it('should show default error message when no error slot is provided', async () => {
    mockClient.setResource('/error', { _links: { self: { href: '/error' } } }, new Error('Test error'));

    const wrapper = mount(Hal, {
      props: { uri: '/error' },
      global: {
        provide: {
          [HalClientKey as symbol]: mockClient,
        },
      },
      // No error slot provided - should use default
    });

    await flushPromises();

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').text()).toContain('Test error');
  });

  it('should handle URI with existing query parameters', async () => {
    const goSpy = vi.spyOn(mockClient, 'go');
    mockClient.setResource('/posts?filter=active&profile=detailed', {
      _links: { self: { href: '/posts' } },
    });

    createWrapper({ uri: '/posts?filter=active', profile: 'detailed' });

    await flushPromises();

    // Should append profile to existing query params
    expect(goSpy).toHaveBeenCalledWith(expect.stringContaining('filter=active'));
    expect(goSpy).toHaveBeenCalledWith(expect.stringContaining('profile=detailed'));
  });
});
