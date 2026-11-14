<script setup lang="ts">
import { ref, onMounted } from 'vue';

const status = ref('');
const isLoading = ref(false);

const buckets = ref<string[]>([]);
const bucketName = ref('');
const bucketSizeStatus = ref('');
const isSizeLoading = ref(false);

const fetchBuckets = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/buckets');
    const data = await response.json();
    if (response.ok && Array.isArray(data.buckets)) {
      buckets.value = data.buckets;
    }
  } catch (error) {
    console.error('Failed to fetch buckets:', error);
  }
};

onMounted(() => {
  fetchBuckets();
});

const testConnection = async () => {
  isLoading.value = true;
  status.value = 'Testing...';
  try {
    const response = await fetch('http://localhost:3000/api/test-connection');
    const data = await response.json();
    if (response.ok) {
      status.value = '✅ ' + data.message;
      await fetchBuckets();
    } else {
      status.value = '❌ ' + (data.error || 'Connection failed');
    }
  } catch (error) {
    status.value = '❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error');
  } finally {
    isLoading.value = false;
  }
};

const getBucketSize = async () => {
  isSizeLoading.value = true;
  bucketSizeStatus.value = 'Calculating size...';
  try {
    const params = new URLSearchParams();
    if (bucketName.value.trim()) {
      params.append('bucketName', bucketName.value.trim());
    }
    const queryString = params.toString();
    const url = queryString
      ? `http://localhost:3000/api/bucket-size?${queryString}`
      : 'http://localhost:3000/api/bucket-size';

    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      bucketSizeStatus.value = '✅ ' + data.message;
    } else {
      bucketSizeStatus.value = '❌ ' + (data.error || 'Failed to retrieve bucket size');
    }
  } catch (error) {
    bucketSizeStatus.value = '❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error');
  } finally {
    isSizeLoading.value = false;
  }
};
</script>

<template>
  <div class="minio-test">
    <div class="test-row">
      <button @click="testConnection" :disabled="isLoading">
        {{ isLoading ? 'Testing...' : 'Test MinIO Connection' }}
      </button>
    </div>
    <p v-if="status" :class="{ 'error': status.includes('❌'), 'success': status.includes('✅') }">
      {{ status }}
    </p>

    <div class="bucket-size-section">
      <div class="input-group">
        <label for="test-bucket-name">Bucket Name</label>
        <select
          id="test-bucket-name"
          v-model="bucketName"
        >
          <option value="">All Buckets (Total Instance Size)</option>
          <option v-for="bucket in buckets" :key="bucket" :value="bucket">
            {{ bucket }}
          </option>
        </select>
      </div>
      <button @click="getBucketSize" :disabled="isSizeLoading">
        {{ isSizeLoading ? 'Calculating...' : 'Get Bucket Size' }}
      </button>
      <p v-if="bucketSizeStatus" :class="{ 'error': bucketSizeStatus.includes('❌'), 'success': bucketSizeStatus.includes('✅') }">
        {{ bucketSizeStatus }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.minio-test {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #444;
  border-radius: 8px;
  background: #2a2a2a;
}

.test-row {
  margin-bottom: 0.5rem;
}

.bucket-size-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #444;
  text-align: left;
}

.input-group {
  margin-bottom: 0.75rem;
}

label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: bold;
  font-size: 0.9rem;
}

input,
select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #444;
  background: #1a1a1a;
  color: white;
  box-sizing: border-box;
}

button {
  padding: 0.5rem 1rem;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

button:hover:not(:disabled) {
  background-color: #535bf2;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #444;
}

p {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.error {
  color: #ff5555;
  background: #442222;
}

.success {
  color: #4ade80;
  background: #1e3a29;
}
</style>
