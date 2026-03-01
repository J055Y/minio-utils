import * as handler from './minio_client_handler';
import {logger} from "./logger";
import * as walk from 'walk';

const minioBucket = 'photos';
const minioPath = 'Camera Roll/Photos from 2024';
const minioClient = handler.getClient();

function walker(path: string, remoteObjectNames: string[    ]): void {
    let missingCount = 0;
    const w = walk.walk(path)
    w.on('file', (root, fileStats, next) => {
        if (!remoteObjectNames.includes(fileStats.name)) {
            logger.info(`Missing: ${fileStats.name}`);
            minioClient.fPutObject(minioBucket, `${minioPath}/${fileStats.name}`, `${root}/${fileStats.name}`)
                .then(r => logger.info(`Uploaded: ${fileStats.name} : ${r.etag}`));
            missingCount++;
        }
        next();
    });
    w.on('end', () => {
        logger.info(`Missing count: ${missingCount}`);
    });
}

export function go(): void {

    const remoteObjects: any[] = [];
    const stream = minioClient.listObjectsV2(minioBucket, minioPath, true);

    stream.on('data', obj => {
        remoteObjects.push(obj);
    });
    stream.on('error', err => {
        logger.error(`Error listing objects: ${err.message}`);
    });
    stream.on('end', () => {
        logger.info(`Found ${remoteObjects.length} objects`);
        const l = minioPath.length;
        const rNames: string[] = remoteObjects.map(obj => obj.name.substring(l + 1));
        walker('/Users/jonathan/Local Documents/Photos/Photos\ from\ 2024/', rNames);
    });

    // minioClient.getObjectTagging(minioBucket, minioPath)
    //     .then(objInfo => {
    //         logger.info(objInfo);
    //     });
}
