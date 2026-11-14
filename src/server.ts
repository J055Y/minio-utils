import express from 'express';
import cors from 'cors';
import * as compare from './compare';
import { logger } from './logger';
import { getClient } from './minio_client_handler';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

app.get('/api/test-connection', async (req, res) => {
  try {
    const client = getClient();
    await client.listBuckets();
    res.json({ message: 'MinIO connection successful' });
  } catch (error) {
    logger.error(`MinIO connection test failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: error instanceof Error ? error.message : 'MinIO connection failed' });
  }
});

app.get('/api/buckets', async (req, res) => {
  try {
    const client = getClient();
    const buckets = await client.listBuckets();
    const bucketNames = buckets.map(b => b.name);
    res.json({ buckets: bucketNames });
  } catch (error) {
    logger.error(`Failed to list buckets: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list buckets' });
  }
});

async function getSingleBucketSize(client: any, bucketName: string) {
  let continuationToken = '';
  let isTruncated = true;
  let totalSizeBytes = 0;
  let totalObjects = 0;

  while (isTruncated) {
    const result: any = await client.listObjectsV2Query(
      bucketName,
      '', // prefix
      continuationToken,
      '', // delimiter
      500, // maxKeys
      '' // startAfter
    );

    if (result.objects && Array.isArray(result.objects)) {
      for (const obj of result.objects) {
        if (typeof obj.size === 'number') {
          totalSizeBytes += obj.size;
        }
        totalObjects++;
      }
    }
    isTruncated = Boolean(result.isTruncated);
    continuationToken = result.nextContinuationToken || '';
  }

  return { totalSizeBytes, totalObjects };
}

app.get('/api/bucket-size', async (req, res) => {
  const bucketName = (req.query.bucketName as string)?.trim();

  try {
    const client = getClient();

    if (!bucketName || bucketName === 'all' || bucketName === '__all__') {
      logger.info('Calculating total size for all buckets in MinIO instance');
      const buckets = await client.listBuckets();
      let totalSizeBytes = 0;
      let totalObjects = 0;

      for (const bucket of buckets) {
        const { totalSizeBytes: bSize, totalObjects: bCount } = await getSingleBucketSize(client, bucket.name);
        totalSizeBytes += bSize;
        totalObjects += bCount;
      }

      const formattedSize = formatBytes(totalSizeBytes);
      logger.info(`MinIO instance total size: ${totalSizeBytes} bytes (${formattedSize}), objects: ${totalObjects}, buckets: ${buckets.length}`);

      return res.json({
        bucketName: 'all',
        totalSizeBytes,
        formattedSize,
        totalObjects,
        bucketCount: buckets.length,
        message: `Total size of all buckets (${buckets.length} bucket${buckets.length === 1 ? '' : 's'}): ${formattedSize} (${totalSizeBytes.toLocaleString()} bytes, ${totalObjects} objects)`
      });
    }

    logger.info(`Calculating total size for bucket: ${bucketName}`);
    const bucketExists = await client.bucketExists(bucketName);
    if (!bucketExists) {
      return res.status(404).json({ error: `Bucket '${bucketName}' does not exist` });
    }

    const { totalSizeBytes, totalObjects } = await getSingleBucketSize(client, bucketName);
    const formattedSize = formatBytes(totalSizeBytes);
    logger.info(`Bucket '${bucketName}' total size: ${totalSizeBytes} bytes (${formattedSize}), objects: ${totalObjects}`);

    res.json({
      bucketName,
      totalSizeBytes,
      formattedSize,
      totalObjects,
      message: `Total size of '${bucketName}': ${formattedSize} (${totalSizeBytes.toLocaleString()} bytes, ${totalObjects} objects)`
    });
  } catch (error) {
    logger.error(`Failed to calculate bucket size: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to calculate bucket size' });
  }
});

app.get('/api/upload-progress', (req, res) => {
  const { localPath, remotePath, bucketName } = req.query;

  if (!localPath || !remotePath || !bucketName) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  logger.info(`Starting upload via SSE from ${localPath} to ${remotePath} in bucket ${bucketName}`);

  compare.go(
    localPath as string,
    remotePath as string,
    bucketName as string,
    ['.DS_Store'],
    (completed, total, filename) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', completed, total, filename })}\n\n`);
    }
  ).then(() => {
    res.write(`data: ${JSON.stringify({ type: 'done', message: 'Upload completed successfully' })}\n\n`);
    res.end();
  }).catch(error => {
    logger.error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Internal server error' })}\n\n`);
    res.end();
  });

  req.on('close', () => {
    logger.info('Client closed SSE connection');
  });
});

app.post('/api/upload', async (req, res) => {
  const { localPath, remotePath, bucketName } = req.body;

  if (!localPath || !remotePath || !bucketName) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  logger.info(`Starting upload from ${localPath} to ${remotePath} in bucket ${bucketName}`);

  try {
    // Assuming go function handles the upload and returns when done
    // You might want to run this asynchronously and return a status if it takes long
    await compare.go(localPath, remotePath, bucketName, ['.DS_Store']);
    res.json({ message: 'Upload completed successfully' });
  } catch (error) {
    logger.error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
