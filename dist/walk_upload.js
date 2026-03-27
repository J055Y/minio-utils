import * as walk from 'walk';
import * as handler from './minio_client_handler.js';
import { logger } from "./logger";
const localPath = '/Users/jonathan/Local Documents/Photos/Photos from 2024';
const minioBucket = 'photos';
const minioPath = '/Camera Roll/Photos from 2024';
const walker = walk.walk(localPath);
walker.on('file', (root, fileStats, next) => {
    const filePath = root + '/' + fileStats.name;
    const minioFilePath = minioPath + '/' + fileStats.name;
    try {
        const minioClient = handler.getClient();
        minioClient.fPutObject(minioBucket, minioFilePath, filePath)
            .then(objInfo => {
            logger.info(`Uploaded: ${objInfo.etag}`);
            next();
        }).catch(err => {
            logger.error(err);
        });
    }
    catch (err) {
        logger.error(`Skipping file due to Minio client initialization failure: ${err instanceof Error ? err.message : 'Unknown error'}`);
        next();
    }
});
walker.on('end', () => {
    logger.info('End upload');
});
