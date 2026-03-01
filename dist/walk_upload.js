import * as walk from 'walk';
import * as handler from './minio_client_handler.js';
const localPath = '/Users/jonathan/Local Documents/Photos/Photos from 2024';
const minioBucket = 'photos';
const minioPath = '/Camera Roll/Photos from 2024';
const walker = walk.walk(localPath);
walker.on('file', (root, fileStats, next) => {
    const filePath = root + '/' + fileStats.name;
    const minioFilePath = minioPath + '/' + fileStats.name;
    const minioClient = handler.getClient();
    minioClient.fPutObject(minioBucket, minioFilePath, filePath)
        .then(objInfo => {
        console.log(`Uploaded: ${objInfo.etag}`);
        next();
    }).catch(err => {
        console.error(err);
    });
});
walker.on('end', () => {
    console.log('End upload');
});
