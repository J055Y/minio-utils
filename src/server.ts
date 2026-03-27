import express from 'express';
import cors from 'cors';
import * as compare from './compare';
import { logger } from './logger';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

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
