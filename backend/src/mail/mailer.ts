import nodemailer from 'nodemailer';
import type { Config } from '../config.js';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

// En desarrollo apunta a Mailpit: los mails no salen a internet y se leen en su bandeja web.
export function createSmtpMailer(config: Config): Mailer {
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: false,
  });

  return {
    async send(message) {
      await transport.sendMail({ from: config.MAIL_FROM, ...message });
    },
  };
}

export const resetPasswordMail = (to: string, code: string, ttlMinutes: number): MailMessage => ({
  to,
  subject: 'WOD: código para restablecer tu contraseña',
  text: [
    `Tu código es ${code}.`,
    `Vence en ${ttlMinutes} minutos y sirve una sola vez.`,
    'Si no lo pediste, ignorá este mail: tu contraseña no cambió.',
  ].join('\n\n'),
});

export const verifyEmailMail = (to: string, code: string, ttlMinutes: number): MailMessage => ({
  to,
  subject: 'WOD: verificá tu email',
  text: [`Tu código de verificación es ${code}.`, `Vence en ${ttlMinutes} minutos.`].join('\n\n'),
});
