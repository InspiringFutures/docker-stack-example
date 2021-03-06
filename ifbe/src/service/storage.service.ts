import aws from 'aws-sdk';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';

interface S3Config {
    url: string;
    accessKey: string;
    accessSecret: string;
    container: string;
}

export class StorageService{
    private s3: aws.S3;
    constructor(private config: S3Config) {
        this.s3 = new aws.S3({
            endpoint: config.url,
            accessKeyId: config.accessKey,
            secretAccessKey: config.accessSecret,
            params: {
                Bucket: config.container,
            },
        });
    }

    async getSignedUrl(id: string): Promise<string> {
        return await this.s3.getSignedUrlPromise('getObject', {Bucket: this.config.container, Key: id});
    }

    multerStorage() {
        return multerS3({
            s3: this.s3,
            bucket: this.config.container,
            metadata: function (req, file, cb) {
                // CHECKME: These must align with ClientController#uploadMedia
                const metadata: {clientId: string, journalId: string, xref?: string} = {clientId: req.params.clientId, journalId: req.params.journalId};
                // Also store a xref from the client which is not trusted but might be useful if available
                if (req.body.xref) {
                    metadata.xref = req.body.xref;
                }
                cb(null, metadata);
            },
            key: function (req, file, cb) {
                cb(null, uuidv4());
            }
        });
    }

    async status() {
        return this.s3.headBucket({Bucket: this.config.container});
    }
}

export const StorageServiceProvider = {
    provide: StorageService,
    useFactory: async () => {
        return new StorageService({
            url: process.env.S3_URL,
            accessKey: process.env.S3_ACCESS_KEY,
            accessSecret: process.env.S3_ACCESS_SECRET,
            container: process.env.S3_CONTAINER,
        });
    },
};
