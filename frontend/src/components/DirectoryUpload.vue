<script setup lang="ts">
import {ref} from 'vue';

const localPath = ref('');
const remotePath = ref('');
const bucketName = ref('photos');
const status = ref('');
const isLoading = ref(false);
const progress = ref(0);
const totalFiles = ref(0);
const completedFiles = ref(0);
const currentFile = ref('');

const submitPaths = async () => {
  if (!localPath.value || !remotePath.value) {
    status.value = 'Please fill in both paths.';
    return;
  }

  isLoading.value = true;
  status.value = 'Starting upload...';
  progress.value = 0;
  totalFiles.value = 0;
  completedFiles.value = 0;
  currentFile.value = '';

  const params = new URLSearchParams({
    localPath: localPath.value,
    remotePath: remotePath.value,
    bucketName: bucketName.value,
  });

  const eventSource = new EventSource(`http://localhost:3000/api/upload-progress?${params.toString()}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'progress') {
      completedFiles.value = data.completed;
      totalFiles.value = data.total;
      currentFile.value = data.filename;
      progress.value = Math.round((data.completed / data.total) * 100);
      status.value = `Uploading: ${data.completed}/${data.total}`;
    } else if (data.type === 'done') {
      status.value = `Success: ${data.message}`;
      isLoading.value = false;
      progress.value = 100;
      eventSource.close();
    } else if (data.type === 'error') {
      status.value = `Error: ${data.error}`;
      isLoading.value = false;
      eventSource.close();
    }
  };

  eventSource.onerror = (error) => {
    console.error('EventSource failed:', error);
    status.value = 'Error: Connection lost or failed.';
    isLoading.value = false;
    eventSource.close();
  };
};
</script>

<template>
  <div class="card">
    <div class="form-group">
      <label for="local-path">Local Directory Path</label>
      <input
          id="local-path"
          v-model="localPath"
          type="text"
          placeholder="/Users/jonathan/Local Documents/Photos/..."
      />
    </div>

    <div class="form-group">
      <label for="remote-path">Remote Directory Path</label>
      <input
          id="remote-path"
          v-model="remotePath"
          type="text"
          placeholder="Camera Roll/Photos from ..."
      />
    </div>

    <div class="form-group">
      <label for="bucket-name">Bucket Name</label>
      <input
          id="bucket-name"
          v-model="bucketName"
          type="text"
      />
    </div>

    <button @click="submitPaths" :disabled="isLoading">
      {{ isLoading ? 'Uploading...' : 'Start Upload' }}
    </button>

    <div v-if="isLoading || progress > 0" class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-info">
        <span>{{ progress }}%</span>
        <span v-if="totalFiles > 0">{{ completedFiles }} / {{ totalFiles }} files</span>
      </div>
      <div v-if="currentFile" class="current-file">
        Uploading: {{ currentFile }}
      </div>
    </div>

    <div v-if="status" class="status" :class="{ error: status.includes('Error') }">
      {{ status }}
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #2a2a2a;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #444;
  background: #1a1a1a;
  color: white;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background-color: #535bf2;
}

button:disabled {
  background-color: #444;
  cursor: not-allowed;
}

.status {
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background: #333;
}

.status.error {
  color: #ff5555;
  background: #442222;
}

.progress-container {
  margin-top: 1.5rem;
  text-align: left;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #1a1a1a;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #444;
}

.progress-fill {
  height: 100%;
  background-color: #646cff;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #ccc;
}

.current-file {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>