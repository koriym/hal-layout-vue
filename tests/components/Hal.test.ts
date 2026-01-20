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
});
