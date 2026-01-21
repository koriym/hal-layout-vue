/**
 * Tests for HalLink component
 */

import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, h } from 'vue';
import HalLink from '../../src/components/HalLink.vue';
import { HypermediaContextKey, type HypermediaContextType } from '../../src/context/hypermediaContext';
import { HalClientKey } from '../../src/context/halProvider';
import { MockClient } from '../mocks/ketting';
import type { HalResource } from '../../src/types/hal';

describe('HalLink Component', () => {
  const createMockContext = (data: HalResource): HypermediaContextType => {
    const mockClient = new MockClient();
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

  const createWrapper = (
    props: Record<string, unknown>,
    context: HypermediaContextType,
    mockClient: MockClient
  ) => {
    return mount(HalLink, {
      props: { rel: 'edit', ...props },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
      slots: {
        default: 'Click me',
        content: 'Link Text',
      },
    });
  };

  it('should render anchor for GET method', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        next: { href: '/posts/2' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'next', method: 'GET' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
      slots: {
        content: 'Next Page',
      },
    });

    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.find('a').attributes('href')).toBe('/posts/2');
  });

  it('should render button for POST method', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        submit: { href: '/posts/1/submit' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'submit', method: 'POST' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
      slots: {
        content: 'Submit',
      },
    });

    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('should render button for DELETE method', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        delete: { href: '/posts/1' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'delete', method: 'DELETE' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
      slots: {
        content: 'Delete',
      },
    });

    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('should not render when link is not available', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'nonexistent' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('should render span when as="span"', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        action: { href: '/posts/1/action' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'action', as: 'span' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
      slots: {
        content: 'Action',
      },
    });

    expect(wrapper.find('span[role="button"]').exists()).toBe(true);
  });

  it('should use link title as tooltip', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        edit: { href: '/posts/1/edit', title: 'Edit this post' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'edit' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(wrapper.find('a').attributes('title')).toBe('Edit this post');
  });

  it('should use custom title over link title', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        edit: { href: '/posts/1/edit', title: 'Edit this post' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'edit', title: 'Custom Title' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(wrapper.find('a').attributes('title')).toBe('Custom Title');
  });

  it('should emit success event on successful action', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1', {
      _links: { self: { href: '/posts/1' } },
    });

    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        delete: { href: '/posts/1' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'delete', method: 'DELETE' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('success')).toBeTruthy();
  });

  it('should add target and rel attributes for external links', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        external: { href: 'https://example.com' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'external', target: '_blank' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(wrapper.find('a').attributes('target')).toBe('_blank');
    expect(wrapper.find('a').attributes('rel')).toBe('noopener noreferrer');
  });

  it('should handle array of links (use first)', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        related: [{ href: '/related/1' }, { href: '/related/2' }],
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'related' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(wrapper.find('a').attributes('href')).toBe('/related/1');
  });

  it('should render scoped slot with execute and loading', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        submit: { href: '/posts/1/submit' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'submit', method: 'POST' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
      slots: {
        default: ({ loading, execute, available }: { loading: boolean; execute: () => void; available: boolean }) =>
          h('button', { onClick: execute, disabled: loading }, available ? 'Submit' : 'N/A'),
      },
    });

    expect(wrapper.find('button').text()).toBe('Submit');
  });

  it('should disable button when disabled prop is true', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        submit: { href: '/posts/1/submit' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'submit', method: 'POST', disabled: true },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('should handle keyboard navigation with Enter key for span elements', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1/action', {
      _links: { self: { href: '/posts/1/action' } },
    });

    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        action: { href: '/posts/1/action' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'action', as: 'span', method: 'POST' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await wrapper.find('span').trigger('keydown', { key: 'Enter' });
    await flushPromises();

    expect(wrapper.emitted('success')).toBeTruthy();
  });

  it('should handle keyboard navigation with Space key for span elements', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/1/action', {
      _links: { self: { href: '/posts/1/action' } },
    });

    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        action: { href: '/posts/1/action' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'action', as: 'span', method: 'POST' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await wrapper.find('span').trigger('keydown', { key: ' ' });
    await flushPromises();

    expect(wrapper.emitted('success')).toBeTruthy();
  });

  it('should apply custom class', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        edit: { href: '/posts/1/edit' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'edit', class: 'custom-class' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    expect(wrapper.find('a').classes()).toContain('custom-class');
  });

  it('should allow default navigation for GET anchor with preventDefault=false', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/2', {
      _links: { self: { href: '/posts/2' } },
    });

    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        next: { href: '/posts/2' },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'next', method: 'GET', preventDefault: false },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    // For GET anchor with preventDefault=false, clicking should NOT execute the action
    // The handler returns early, allowing default browser navigation
    await wrapper.find('a').trigger('click');
    await flushPromises();

    // The success event should NOT be emitted because the action wasn't executed
    expect(wrapper.emitted('success')).toBeFalsy();
  });

  it('should use # as fallback href when link has no href', () => {
    const mockClient = new MockClient();
    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        // Link without href property
        action: { title: 'Action' } as unknown as { href: string },
      },
    });

    const wrapper = mount(HalLink, {
      props: { rel: 'action', method: 'GET' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    // When href is null, template uses '#' as fallback
    expect(wrapper.find('a').attributes('href')).toBe('#');
  });

  it('should execute action for GET anchor with default preventDefault=true', async () => {
    const mockClient = new MockClient();
    mockClient.setResource('/posts/2', {
      _links: { self: { href: '/posts/2' } },
    });

    const context = createMockContext({
      _links: {
        self: { href: '/posts/1' },
        next: { href: '/posts/2' },
      },
    });

    const wrapper = mount(HalLink, {
      // preventDefault defaults to true
      props: { rel: 'next', method: 'GET' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
          [HalClientKey as symbol]: mockClient,
        },
      },
    });

    await wrapper.find('a').trigger('click');
    await flushPromises();

    // With default preventDefault=true, the action should execute
    expect(wrapper.emitted('success')).toBeTruthy();
  });
});
