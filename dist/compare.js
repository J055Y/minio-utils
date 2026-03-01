import * as handler from './minio_client_handler.js';
export function go() {
    const minioBucket = 'photos';
    const minioPath = 'Camera Roll/Photos from 2024/_DSC0616.jpg';
    const minioClient = handler.getClient();
    minioClient.listObjectsV2(minioBucket)
        .on('data', obj => {
        console.log(obj);
    });
    minioClient.getObjectTagging(minioBucket, minioPath)
        .then(objInfo => {
        console.log(objInfo);
    });
}
