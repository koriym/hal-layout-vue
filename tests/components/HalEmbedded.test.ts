/**
 * Tests for HalEmbedded component
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, h, defineComponent } from 'vue';
import HalEmbedded from '../../src/components/HalEmbedded.vue';
import { HypermediaContextKey, type HypermediaContextType } from '../../src/context/hypermediaContext';
import type { HalResource } from '../../src/types/hal';

describe('HalEmbedded Component', () => {
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

  const createWrapper = (
    props: { rel: string },
    context: HypermediaContextType,
    slotContent?: string
  ) => {
    return mount(HalEmbedded, {
      props,
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
        },
      },
      slots: {
        default: slotContent || '<div data-testid="item">{{ data.name }}</div>',
        fallback: '<div data-testid="fallback">Not found</div>',
      },
    });
  };

  it('should render single embedded resource', () => {
    const context = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _embedded: {
        author: {
          _links: { self: { href: '/users/1' } },
          name: 'John Doe',
        },
      },
    });

    const wrapper = mount(HalEmbedded, {
      props: { rel: 'author' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
        },
      },
      slots: {
        default: ({ data }: { data: { name: string } }) => h('span', { 'data-testid': 'author' }, data.name),
      },
    });

    expect(wrapper.find('[data-testid="author"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="author"]').text()).toBe('John Doe');
  });

  it('should render collection of embedded resources', () => {
    const context = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _embedded: {
        comments: [
          { _links: { self: { href: '/comments/1' } }, text: 'Comment 1' },
          { _links: { self: { href: '/comments/2' } }, text: 'Comment 2' },
          { _links: { self: { href: '/comments/3' } }, text: 'Comment 3' },
        ],
      },
    });

    const wrapper = mount(HalEmbedded, {
      props: { rel: 'comments' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
        },
      },
      slots: {
        default: ({ data, index }: { data: { text: string }; index: number }) =>
          h('div', { 'data-testid': `comment-${index}` }, data.text),
      },
    });

    expect(wrapper.find('[data-testid="comment-0"]').text()).toBe('Comment 1');
    expect(wrapper.find('[data-testid="comment-1"]').text()).toBe('Comment 2');
    expect(wrapper.find('[data-testid="comment-2"]').text()).toBe('Comment 3');
  });

  it('should render fallback when embedded resource not found', () => {
    const context = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _embedded: {},
    });

    const wrapper = mount(HalEmbedded, {
      props: { rel: 'nonexistent' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
        },
      },
      slots: {
        fallback: () => h('div', { 'data-testid': 'fallback' }, 'Not found'),
      },
    });

    expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(true);
  });

  it('should render fallback when _embedded is undefined', () => {
    const context = createMockContext({
      _links: { self: { href: '/posts/1' } },
    });

    const wrapper = mount(HalEmbedded, {
      props: { rel: 'author' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
        },
      },
      slots: {
        fallback: () => h('div', { 'data-testid': 'fallback' }, 'Not found'),
      },
    });

    expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(true);
  });

  it('should provide slot props with correct data', () => {
    const authorData = {
      _links: { self: { href: '/users/1' } },
      name: 'John Doe',
      email: 'john@example.com',
    };

    const context = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _embedded: {
        author: authorData,
      },
    });

    let receivedProps: Record<string, unknown> = {};

    mount(HalEmbedded, {
      props: { rel: 'author' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
        },
      },
      slots: {
        default: (props: Record<string, unknown>) => {
          receivedProps = props;
          return h('span', 'test');
        },
      },
    });

    expect(receivedProps.data).toEqual({ name: 'John Doe', email: 'john@example.com' });
    expect(receivedProps.halData).toEqual(authorData);
    expect(receivedProps.index).toBe(0);
    expect(receivedProps.isCollection).toBe(false);
    expect(receivedProps.total).toBe(1);
  });

  it('should provide isCollection=true for arrays', () => {
    const context = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _embedded: {
        comments: [
          { _links: { self: { href: '/comments/1' } }, text: 'Comment 1' },
        ],
      },
    });

    let receivedIsCollection = false;

    mount(HalEmbedded, {
      props: { rel: 'comments' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
        },
      },
      slots: {
        default: (props: { isCollection: boolean }) => {
          receivedIsCollection = props.isCollection;
          return h('span', 'test');
        },
      },
    });

    expect(receivedIsCollection).toBe(true);
  });

  it('should provide correct total count', () => {
    const context = createMockContext({
      _links: { self: { href: '/posts/1' } },
      _embedded: {
        comments: [
          { _links: { self: { href: '/comments/1' } }, text: 'Comment 1' },
          { _links: { self: { href: '/comments/2' } }, text: 'Comment 2' },
          { _links: { self: { href: '/comments/3' } }, text: 'Comment 3' },
        ],
      },
    });

    const totals: number[] = [];

    mount(HalEmbedded, {
      props: { rel: 'comments' },
      global: {
        provide: {
          [HypermediaContextKey as symbol]: context,
        },
      },
      slots: {
        default: (props: { total: number }) => {
          totals.push(props.total);
          return h('span', 'test');
        },
      },
    });

    expect(totals).toEqual([3, 3, 3]);
  });
});
