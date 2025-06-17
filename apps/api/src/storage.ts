import { HTTPException } from 'hono/http-exception';
import mime from 'mime-types';
import path from 'path';
import { storage } from './config';

/**
 * @storageDirName the bucket directory in which the file will be stored
 * @mediaBase64 a base64 encoded image (or video) prefixed by mime type
 */
export const uploadMedia = async (
  storageDirName: string,
  mediaBase64: string,
  opts?: {
    validTypes?: ('image' | 'video')[];
  },
) => {
  const options = { validTypes: ['image', 'video'], ...opts };

  const [imageMeta, image] = mediaBase64.split(',');

  const contentType = imageMeta.match(/data:(.*);base64/)?.[1];
  if (!contentType) {
    throw new HTTPException(400, { message: 'missing mime type' });
  }

  const extension = mime.extension(contentType);
  if (!extension) {
    throw new HTTPException(400, { message: 'invalid mime type' });
  }

  const [mimeType] = contentType.split('/');
  if (!(options.validTypes as string[]).includes(mimeType)) {
    throw new HTTPException(400, {
      message: `mime type must be one of [${options.validTypes.join(', ')}]`,
    });
  }

  const bucket = storage.bucket();

  const imageId = crypto.randomUUID();
  const imageFilePath = path.join(storageDirName, `${imageId}.${extension}`);
  await bucket.file(imageFilePath).save(Buffer.from(image, 'base64'));

  return imageFilePath;
};
