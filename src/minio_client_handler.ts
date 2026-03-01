import * as Minio from 'minio';
import * as dotenv from 'dotenv';

dotenv.config();

export const getClient = (): Minio.Client => {
    try {
        const endPoint = process.env.MINIO_ENDPOINT;
        const portStr = process.env.MINIO_PORT;
        const accessKey = process.env.MINIO_ACCESS_KEY;
        const secretKey = process.env.MINIO_SECRET_KEY;

        if (!endPoint || !portStr || !accessKey || !secretKey) {
            throw new Error('Missing required MinIO environment variables (MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY)');
        }

        return new Minio.Client({
            endPoint,
            port: parseInt(portStr, 10),
            useSSL: true,
            accessKey,
            secretKey
        });
    } catch (error) {
        console.error('Failed to initialize Minio client:', error);
        throw error;
    }
}