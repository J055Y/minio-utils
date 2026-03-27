<script setup lang="ts">

import DirectoryUpload from "./components/DirectoryUpload.vue";
</script>

<template>
  <div class="container">
    <h1>Minio Upload Utility</h1>
    <DirectoryUpload/>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: sans-serif;
}
</style>
