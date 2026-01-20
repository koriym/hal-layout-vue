# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hal-layout-vue is a Vue 3 component library for rendering HAL (Hypertext Application Language) resources. It maps HAL API response structures directly to Vue component hierarchies, enabling hypermedia-driven UIs.

This is the Vue 3 port of [hal-layout](https://github.com/koriym/hal-layout) (React version).

## Commands

```bash
# Development
npm run dev          # Start Vite dev server
npm run typecheck    # TypeScript check only (vue-tsc)

# Testing
npm test             # Run tests in watch mode
npm run test:run     # Run tests once (CI mode)

# Build
npm run build        # TypeScript check + Vite build

# Linting
npm run lint         # ESLint src/
```

## Architecture

### Component Tree & Data Flow

```
useHalProvider({ baseUrl })    # Provides Ketting client via provide/inject
  <Hal uri="/posts/1">         # Fetches HAL resource, provides context
    <HalEmbedded rel="author"> # Renders from _embedded (no HTTP request)
    <HalLink rel="delete">     # Renders action from _links
```

### Directory Structure

```
src/
├── components/      # Hal.vue, HalEmbedded.vue, HalLink.vue
├── context/         # halProvider (Ketting client), hypermediaContext (resource state)
├── composables/     # useHypermedia (data), useAction (mutations)
├── engine/          # Ketting client wrapper, cache invalidation
├── types/           # HAL protocol types and type guards
└── utils/           # URI template expansion (RFC 6570)
```

### Key Patterns

- **Vue Provide/Inject**: Ketting client at root (`useHalProvider`), resource state per `Hal` component (`provideHypermediaContext`)
- **Scoped Slots**: `HalEmbedded` and `HalLink` expose data via `v-slot`
- **Type-Safe Generics**: `useHypermedia<T>()`, `HalResource<T>` separate data from HAL metadata
- **Composition API**: All composables use Vue 3 Composition API with `ref`, `computed`

### HTTP Client

Uses [Ketting](https://github.com/badgateway/ketting) for HAL/REST API communication with built-in caching.

## Testing

- **Framework**: Vitest with jsdom environment
- **Testing Library**: @vue/test-utils
- **Mocks**: Custom MockClient for Ketting in `tests/mocks/ketting.ts`

## Build Output

Dual format library build:
- ESM: `dist/index.js`
- CJS: `dist/index.cjs`
- Types: `dist/index.d.ts`

Externals: vue, ketting (peer/external dependencies)

## Vue 3 Specifics

### Using the Provider

```vue
<script setup>
import { useHalProvider } from 'hal-layout-vue';

useHalProvider({ baseUrl: 'https://api.example.com' });
</script>
```

### Component Usage

```vue
<template>
  <Hal uri="/posts/1">
    <HalEmbedded rel="author" v-slot="{ data }">
      <span>{{ data.name }}</span>
    </HalEmbedded>
    <HalLink rel="edit" method="PUT" :body="formData" @success="onSaved">
      Save
    </HalLink>
  </Hal>
</template>
```

### Composables

```vue
<script setup>
import { useHypermedia, useAction } from 'hal-layout-vue';

const { data, loading, getEmbedded } = useHypermedia<Post>();
const { execute, loading: deleting } = useAction({
  rel: 'delete',
  method: 'DELETE',
});
</script>
```
