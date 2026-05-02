import 'server-only';

import { Resend } from 'resend';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

let resendInstance: Resend | null = null;
function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resendInstance) resendInstance = new Resend(env.RESEND_API_KEY);
  return resendInstance;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  react: React.ReactElement;
  from?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean }> {
  const resend = getResend();
  if (!resend) {
    logger.warn('email.send.skipped', { reason: 'no_api_key', to: input.to });
    return { ok: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: input.from ?? 'costo <onboarding@resend.dev>',
      to: input.to,
      subject: input.subject,
      react: input.react,
    });
    if (error) {
      logger.error('email.send.failed', { error, to: input.to });
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    logger.error('email.send.error', { error, to: input.to });
    return { ok: false };
  }
}
