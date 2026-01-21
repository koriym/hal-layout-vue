<script setup lang="ts">
import { HalEmbedded, HalLink, useHypermedia } from 'hal-layout-vue';

interface Post {
  title: string;
  body: string;
}

interface Author {
  name: string;
  email: string;
}

interface Comment {
  id: number;
  text: string;
  author: string;
}

const { data, loading, error } = useHypermedia<Post>();

const onDeleteSuccess = () => {
  alert('Post deleted!');
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else-if="error" class="error">Error: {{ error.message }}</div>
  <div v-else-if="data" class="card">
    <h1>{{ data.title }}</h1>

    <!-- Render _embedded.author -->
    <HalEmbedded rel="author" v-slot="{ data: author }">
      <div class="author">
        By {{ (author as Author).name }} ({{ (author as Author).email }})
      </div>
    </HalEmbedded>

    <p>{{ data.body }}</p>

    <!-- Action links from _links -->
    <div class="actions">
      <!-- GET → renders as <a> -->
      <HalLink rel="edit">Edit Post</HalLink>

      <!-- DELETE → renders as <button> -->
      <HalLink rel="delete" method="DELETE" @success="onDeleteSuccess">
        Delete Post
      </HalLink>
    </div>

    <!-- Render _embedded.comments -->
    <div class="comments">
      <h3>Comments</h3>
      <HalEmbedded rel="comments" v-slot="{ items }">
        <div v-if="items && items.length > 0">
          <div v-for="item in items" :key="item.index" class="comment">
            <div class="comment-author">{{ (item.data as Comment).author }}</div>
            <div>{{ (item.data as Comment).text }}</div>
          </div>
        </div>
        <p v-else>No comments yet.</p>
      </HalEmbedded>
    </div>
  </div>
</template>
