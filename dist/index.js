import * as compare from './compare';
import { logger } from "./logger";
const date = '2026';
const localPath = `/Users/jonathan/Local Documents/Photos/Photos from ${date}`;
const remotePath = `Camera Roll/Photos from ${date}`;
compare.go(localPath, remotePath, 'photos', ['.DS_Store']).then(() => {
    logger.info('Operation complete');
    process.exit(0);
}).catch(err => {
    logger.error(`Operation failed: ${err.message}`);
    process.exit(1);
});
// const minioPath = 'Camera Roll/Photos from 2024';
// const l = minioPath.length;
// const test = [{"name":"Camera Roll/Photos from 2024/11D478DD-2409-46E8-93F9-60B3DB8C1324.jpg","lastModified":"2026-02-28T19:43:04.454Z","etag":"28cda0c2fe3d82b0964d71cc7310ce1c","size":1297291}
// ]
// const test2 = test.map(obj => obj.name.substring(l + 1));
//
// logger.info(`Test: ${test2}`)
