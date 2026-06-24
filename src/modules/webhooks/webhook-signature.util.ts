import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const logger = new Logger('WebhookSignature');

/**
 * Verify a YCloud webhook signature header of the form: t=TIMESTAMP,s=SIGNATURE
 * HMAC-SHA256 over `${timestamp}.${rawBody}` with a 5-minute replay window.
 */
export function verifyYcloudSignature(
  signatureHeader: string | undefined,
  rawBody: Buffer | undefined,
  secret: string | undefined,
  isProduction: boolean,
): boolean {
  if (!secret || secret.trim().length === 0) {
    if (isProduction) {
      logger.error(
        'YCLOUD_WEBHOOK_SECRET is not configured in production. Webhook requests are blocked.',
      );
      return false;
    }
    logger.warn(
      'YCLOUD_WEBHOOK_SECRET not set. Signature verification bypassed in development mode.',
    );
    return true;
  }

  if (!signatureHeader) {
    logger.warn('Signature verification failed: missing signature header.');
    return false;
  }

  if (!rawBody || rawBody.length === 0) {
    logger.warn('Signature verification failed: empty raw body.');
    return false;
  }

  try {
    let timestamp = '';
    let signature = '';
    for (const part of signatureHeader.split(',')) {
      const [key, value] = part.split('=');
      if (key === 't') timestamp = value;
      if (key === 's') signature = value;
    }

    if (!timestamp || !signature) {
      logger.warn('Signature verification failed: invalid header format.');
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) {
      logger.warn('Signature verification failed: timestamp out of range.');
      return false;
    }

    const payload = `${timestamp}.${rawBody.toString('utf8')}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      logger.warn('Signature verification failed: length mismatch.');
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    logger.error(
      `Signature verification exception: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}
