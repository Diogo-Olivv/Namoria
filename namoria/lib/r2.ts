import "server-only";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@/lib/env";

const PUT_TTL_SECONDS = 60 * 5; // 5 min — enough for an upload
const GET_TTL_SECONDS = 60 * 60; // 1 h — matches the client-side URL cache

let client: S3Client | null = null;

function r2(): { s3: S3Client; bucket: string } {
  const env = serverEnv();
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: env.r2Endpoint,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    });
  }
  return { s3: client, bucket: env.r2BucketName };
}

/** Presigned PUT so the browser can upload an object directly to R2. */
export async function presignPut(
  key: string,
  contentType: string,
): Promise<string> {
  const { s3, bucket } = r2();
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: PUT_TTL_SECONDS },
  );
}

/** Presigned GET for reading an object (image, poster or video with Range). */
export async function presignGet(key: string): Promise<string> {
  const { s3, bucket } = r2();
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: GET_TTL_SECONDS },
  );
}

/** `web/<albumId>/<uuid>.webp` — optimized display asset (thumb/poster). */
export function webKey(albumId: string): string {
  return `web/${albumId}/${randomUUID()}.webp`;
}

/** `vault/<albumId>/<uuid>.<ext>` — raw original (photo/video) for backup/playback. */
export function vaultKey(albumId: string, ext: string): string {
  const clean = ext.replace(/^\./, "").toLowerCase() || "bin";
  return `vault/${albumId}/${randomUUID()}.${clean}`;
}
