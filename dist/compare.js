import * as handler from './minio_client_handler';
import { logger, fatal } from "./logger";
import * as walk from 'walk';
let minioClient = null;
function ensureClient() {
    if (!minioClient) {
        try {
            minioClient = handler.getClient();
        }
        catch (err) {
            fatal("Could not initialize Minio client, exiting.");
            throw err; // Ensure execution stops here for the caller
        }
    }
    return minioClient;
}
let minioBucket = '';
let minioPath = '';
let excludedList = [];
async function putObject(filepath, filename, onProgress) {
    let errCount = 0;
    const client = ensureClient();
    while (errCount <= 3) {
        try {
            const r = await client.fPutObject(minioBucket, `${minioPath}/${filename}`, `${filepath}/${filename}`);
            logger.info(`Uploaded: ${filename} : ${r.etag}`);
            if (onProgress) {
                onProgress(filename);
            }
            return;
        }
        catch (err) {
            logger.error(err);
            errCount++;
            if (errCount > 3) {
                logger.error(`Failed to upload ${filename}`);
            }
        }
    }
}
async function walker(path, remoteObjectNames, onProgress) {
    let missingCount = 0;
    let completedCount = 0;
    const uploadPromises = [];
    const filesToUpload = [];
    const w = walk.walk(path);
    return new Promise((resolve, reject) => {
        w.on('file', (root, fileStats, next) => {
            if (!remoteObjectNames.includes(fileStats.name) && !excludedList.includes(fileStats.name)) {
                filesToUpload.push({ root, name: fileStats.name });
                missingCount++;
            }
            next();
        });
        w.on('end', async () => {
            try {
                for (const file of filesToUpload) {
                    uploadPromises.push(putObject(file.root, file.name, (filename) => {
                        completedCount++;
                        if (onProgress) {
                            onProgress(completedCount, missingCount, filename);
                        }
                    }));
                }
                await Promise.all(uploadPromises);
                resolve(missingCount);
            }
            catch (err) {
                reject(err);
            }
        });
        w.on('errors', (root, nodeStatsArray, next) => {
            logger.error(`Error walking ${root}: ${JSON.stringify(nodeStatsArray)}`);
            next();
        });
    });
}
export async function go(localPath, remotePath, bucket, exclude, onProgress) {
    minioPath = remotePath;
    minioBucket = bucket;
    excludedList = exclude || [];
    const remoteObjects = [];
    const client = ensureClient();
    // Use a loop with listObjectsV2Query to handle pagination with a smaller maxKeys.
    // This avoids "Entity expansion limit exceeded" errors in the minio SDK's internal XML parser
    // when listing directories with many objects.
    let continuationToken = '';
    let isTruncated = true;
    while (isTruncated) {
        // listObjectsV2Query is a lower-level method that allows specifying maxKeys.
        // We use 500 to stay well within the default 1000 entity expansion limit of the XML parser.
        const result = await client.listObjectsV2Query(minioBucket, remotePath, continuationToken, '', // delimiter (empty for recursive)
        500, // maxKeys
        '' // startAfter
        );
        remoteObjects.push(...result.objects);
        isTruncated = result.isTruncated;
        continuationToken = result.nextContinuationToken || '';
    }
    logger.info(`Found ${remoteObjects.length} objects`);
    const l = remotePath.length;
    const rNames = remoteObjects.map(obj => obj.name.substring(l + 1));
    try {
        const missingCount = await walker(localPath, rNames, onProgress);
        logger.info(`Finished walker`);
        logger.info(`Missing count: ${missingCount}`);
    }
    catch (err) {
        throw err;
    }
}
