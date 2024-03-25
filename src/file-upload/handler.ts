import { APIGatewayProxyHandler } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type CreatePresignedUrlWithClientParams = {
  region: string;
  bucket: string;
  key: string;
  contentType: string;
};

/**
 * Create a presigned URL for a PUT request to upload a file to the specified Amazon S3 bucket
 *
 * @param params {CreatePresignedUrlWithClientParams}
 * @returns A promise that resolves to the presigned URL
 */
const createPresignedUrlWithClient = ({ region, bucket, key, contentType }: CreatePresignedUrlWithClientParams) => {
  const client = new S3Client({ region: region });
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
   });

  return getSignedUrl(client, command, { expiresIn: 3600 });
};

/**
 * We need to respond with adequate CORS headers.
 */
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true
};

/**
 * Lambda function that returns a presigned URL for a PUT request to upload a file to the specified Amazon S3 bucket
 */
export const main: APIGatewayProxyHandler = async ({ body }) => {
  try {
    const { path, contentType } = JSON.parse(body || '{}');
    const { BUCKET_NAME, BUCKET_REGION } = process.env;

    if (!path) {
      throw {
        statusCode: 400,
        message: "Invalid request body",
      };
    }

    if (!BUCKET_NAME || !BUCKET_REGION) {
      throw {
        statusCode: 500,
        message: "Invalid lambda environment variables",
      };
    }

    const presignedUrl = await createPresignedUrlWithClient({
      region: BUCKET_REGION,
      bucket: BUCKET_NAME,
      key: path,
      contentType: contentType
    });

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        error: false,
        data: presignedUrl,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: true,
        message: error.message,
      }),
    }
  }
};