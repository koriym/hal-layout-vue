<script setup lang="ts">
import { Hal, useHalProvider } from 'hal-layout-vue';
import { createMockClient } from './mockServer';
import PostDetail from './PostDetail.vue';

// Create mock client with HAL responses
const mockClient = createMockClient();

// Provide HAL client at app level
useHalProvider({ baseUrl: 'http://localhost:3000' }, mockClient as unknown as Parameters<typeof useHalProvider>[1]);

const halResponse = {
  "title": "Introduction to HAL",
  "body": "HAL (Hypertext Application Language) is a simple format...",
  "_links": {
    "self": { "href": "/posts/1" },
    "edit": { "href": "/posts/1" },
    "delete": { "href": "/posts/1" },
    "search": { "href": "/posts{?q}", "templated": true }
  },
  "_embedded": {
    "author": {
      "name": "John Doe",
      "email": "john@example.com",
      "_links": { "self": { "href": "/users/1" } }
    },
    "comments": [
      { "id": 1, "text": "Great article!", "author": "Alice", "_links": { "self": { "href": "/comments/1" } } },
      { "id": 2, "text": "Very helpful, thanks!", "author": "Bob", "_links": { "self": { "href": "/comments/2" } } }
    ]
  }
};
</script>

<template>
  <h1>hal-layout-vue Demo <span class="vue-badge">Vue 3</span></h1>

  <h2>HAL Response (Mock)</h2>
  <pre class="hal-json">{{ JSON.stringify(halResponse, null, 2) }}</pre>

  <h2>Rendered UI</h2>

  <Hal uri="/posts/1">
    <template #fallback>
      <div class="loading">Loading...</div>
    </template>

    <template #error="{ error }">
      <div class="error">Error: {{ error.message }}</div>
    </template>

    <template #default>
      <PostDetail />
    </template>
  </Hal>
</template>
