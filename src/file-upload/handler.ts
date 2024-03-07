import { APIGatewayProxyHandler } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Create a presigned URL for a PUT request to upload a file to the specified Amazon S3 bucket
 *
 * @param region The region of the Amazon S3 bucket
 * @param bucket The name of the Amazon S3 bucket
 * @param key The key of the object to upload
 * @returns A promise that resolves to the presigned URL
 */
const createPresignedUrlWithClient = (region: string, bucket: string, key: string) => {
  const client = new S3Client({ region: region });
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });

  return getSignedUrl(client, command, { expiresIn: 3600 });
};

/**
 * Lambda function that returns a presigned URL for a PUT request to upload a file to the specified Amazon S3 bucket
 */
export const main: APIGatewayProxyHandler = async ({ body }) => {
  try {
    const { path } = JSON.parse(body || '{}');
    const { BUCKET_NAME, BUCKET_REGION } = process.env;

    if (!path) {
      throw Error("Invalid request body");
    }

    if (!BUCKET_NAME || !BUCKET_REGION) {
      throw Error("Invalid environment variables");
    }

    const presignedUrl = await createPresignedUrlWithClient(
      BUCKET_REGION,
      BUCKET_NAME,
      path,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        error: false,
        data: presignedUrl,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message,
      }),
    }
  }
};