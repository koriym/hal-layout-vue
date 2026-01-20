# hal-layout-vue

Vue 3 components for rendering [HAL (Hypertext Application Language)](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal) resources.

This is the Vue 3 port of [hal-layout](https://github.com/koriym/hal-layout) (React version).

## Installation

```bash
npm install hal-layout-vue
```

## Quick Start

```vue
<script setup lang="ts">
import { useHalProvider, Hal, HalEmbedded, HalLink } from 'hal-layout-vue';

// Initialize the HAL client at root
useHalProvider({ baseUrl: 'https://api.example.com' });
</script>

<template>
  <Hal uri="/posts/1">
    <template #default>
      <HalEmbedded rel="author" v-slot="{ data }">
        <p>Author: {{ data.name }}</p>
      </HalEmbedded>

      <HalLink rel="edit">Edit Post</HalLink>
      <HalLink rel="delete" method="DELETE">Delete</HalLink>
    </template>

    <template #fallback>
      <p>Loading...</p>
    </template>

    <template #error="{ error }">
      <p>Error: {{ error.message }}</p>
    </template>
  </Hal>
</template>
```

## Components

### `<Hal>`

Root component that fetches a HAL resource and provides context to children.

```vue
<Hal
  uri="/posts/1"
  profile="detailed"
  view="full"
  @load="onLoad"
  @error="onError"
>
  <!-- Children have access to resource data -->
</Hal>
```

**Props:**
- `uri` - Resource URI (required)
- `profile` - Content profile for content negotiation
- `view` - View parameter for representation selection

**Events:**
- `@load` - Emitted when resource is loaded
- `@error` - Emitted when an error occurs

**Slots:**
- `default` - Content to render when loaded
- `fallback` - Loading state
- `error` - Error state (receives `{ error }`)

### `<HalEmbedded>`

Renders embedded resources from `_embedded`.

```vue
<!-- Single resource -->
<HalEmbedded rel="author" v-slot="{ data, halData }">
  <span>{{ data.name }}</span>
</HalEmbedded>

<!-- Collection -->
<HalEmbedded rel="comments" v-slot="{ data, index, total }">
  <div :key="index">{{ data.text }}</div>
</HalEmbedded>
```

**Props:**
- `rel` - Relation name in `_embedded` (required)

**Slot Props:**
- `data` - Resource data (without HAL metadata)
- `halData` - Full HAL resource
- `index` - Index in collection
- `isCollection` - Whether it's a collection
- `total` - Total count

### `<HalLink>`

Renders actionable links from `_links`.

```vue
<!-- Navigation (GET) -->
<HalLink rel="next">Next Page</HalLink>

<!-- Action (POST/PUT/DELETE) -->
<HalLink rel="delete" method="DELETE" @success="onDeleted">
  Delete
</HalLink>

<!-- With body -->
<HalLink rel="update" method="PUT" :body="{ title: 'New Title' }">
  Update
</HalLink>

<!-- Custom rendering -->
<HalLink rel="submit" method="POST" v-slot="{ execute, loading }">
  <button @click="execute" :disabled="loading">
    {{ loading ? 'Submitting...' : 'Submit' }}
  </button>
</HalLink>
```

**Props:**
- `rel` - Relation name in `_links` (required)
- `method` - HTTP method (default: 'GET')
- `params` - URI template parameters
- `body` - Request body for POST/PUT/PATCH
- `as` - Element type ('a', 'button', 'span')
- `invalidates` - Relations to invalidate after action
- `refreshParent` - Refresh parent after action (default: true)

**Events:**
- `@success` - Emitted on successful action
- `@error` - Emitted on error

## Composables

### `useHypermedia<T>()`

Access hypermedia context within `<Hal>`.

```vue
<script setup lang="ts">
import { useHypermedia } from 'hal-layout-vue';

interface Post {
  title: string;
  body: string;
}

const {
  data,           // ComputedRef<Post | null>
  halData,        // ComputedRef<HalResource<Post> | null>
  loading,        // Ref<boolean>
  error,          // Ref<Error | null>
  refresh,        // () => Promise<void>
  getEmbedded,    // <E>(rel: string) => E | E[] | null
  getLink,        // (rel: string) => HalLink | null
  hasLink,        // (rel: string) => boolean
} = useHypermedia<Post>();
</script>
```

### `useAction<TBody, TResponse>(options)`

Execute actions on HAL links.

```vue
<script setup lang="ts">
import { useAction } from 'hal-layout-vue';

const { execute, loading, error, available, href } = useAction({
  rel: 'delete',
  method: 'DELETE',
  onSuccess: () => console.log('Deleted!'),
  onError: (err) => console.error(err),
  refreshParent: true,
});
</script>

<template>
  <button @click="execute()" :disabled="loading || !available">
    {{ loading ? 'Deleting...' : 'Delete' }}
  </button>
</template>
```

## URI Templates

Supports [RFC 6570](https://tools.ietf.org/html/rfc6570) URI templates:

```vue
<HalLink rel="search" :params="{ q: 'hello', page: 2 }">
  Search
</HalLink>
```

## HAL Response Structure

```json
{
  "_links": {
    "self": { "href": "/posts/1" },
    "edit": { "href": "/posts/1" },
    "delete": { "href": "/posts/1" }
  },
  "_embedded": {
    "author": {
      "_links": { "self": { "href": "/users/1" } },
      "name": "John Doe"
    }
  },
  "title": "Hello World",
  "body": "This is a post."
}
```

## Related

- [hal-layout](https://github.com/koriym/hal-layout) - React version
- [HAL Specification](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal)
- [Ketting](https://github.com/badgateway/ketting) - HTTP client for REST APIs

## License

MIT
