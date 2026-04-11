const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

const s3Config = {
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
};

// Add endpoint for MinIO (dev) — omit for AWS S3 in prod
if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
  s3Config.forcePathStyle = true;
}

const s3 = new S3Client(s3Config);
const BUCKET = process.env.S3_BUCKET || 'icx-uploads';

const sanitizeFileName = (fileName) => {
  const ext = path.extname(fileName);
  const name = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uuid = crypto.randomUUID().slice(0, 8);
  return `${uuid}_${name}${ext}`;
};

const getUploadPresignedUrl = async (orgId, entityType, entityId, fileName, mimeType) => {
  const sanitized = sanitizeFileName(fileName);
  const key = `${orgId}/${entityType}/${entityId}/${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
  return { url, key, fileName: sanitized };
};

const getDownloadPresignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
};

const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3.send(command);
};

module.exports = { getUploadPresignedUrl, getDownloadPresignedUrl, deleteFile };
