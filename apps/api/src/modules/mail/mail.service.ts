import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface TenantVerificationEmail {
  to: string;
  verifyUrl: string;
  companyName: string;
}

export type MailSendErrorCategory = 'connection' | 'auth' | 'other';

export class MailSendError extends Error {
  constructor(
    readonly category: MailSendErrorCategory,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MailSendError';
  }
}

const SMTP_TIMEOUT_MS = 10_000;
const SMTP_SECURE_TRUE_VALUES = new Set(['true', '1', 'yes', 'ssl']);
const IMPLICIT_TLS_PORT = 465;

export function resolveSecureFlag(
  raw: string | undefined,
  port: number,
): boolean {
  const parsed =
    raw !== undefined && SMTP_SECURE_TRUE_VALUES.has(raw.trim().toLowerCase());
  return parsed || port === IMPLICIT_TLS_PORT;
}

export function classifyMailError(error: unknown): MailSendErrorCategory {
  const err = error as { code?: string; responseCode?: number } | undefined;
  if (err?.code === 'EAUTH' || err?.responseCode === 535) {
    return 'auth';
  }
  if (
    err?.code === 'ESOCKET' ||
    err?.code === 'ETIMEDOUT' ||
    err?.code === 'ECONNREFUSED' ||
    err?.code === 'ECONNECTION'
  ) {
    return 'connection';
  }
  return 'other';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * SMTP mail service behind a swappable interface. Uses nodemailer with
 * standard SMTP env config. In development without SMTP configured, logs
 * the verification link instead of failing so e2e/dev flows keep working.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    if (host) {
      const port = Number(process.env.SMTP_PORT ?? 587);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: resolveSecureFlag(process.env.SMTP_SECURE, port),
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
        auth:
          process.env.SMTP_USER || process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.transporter) {
      return;
    }
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified');
    } catch (error) {
      const category = classifyMailError(error);
      this.logger.warn(
        `SMTP startup verification failed (${category}): ${errorMessage(error)}`,
      );
    }
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendTenantVerification(email: TenantVerificationEmail): Promise<void> {
    const from = process.env.SMTP_FROM ?? 'Ecommerce SaaS <no-reply@localhost>';
    const subject = `Verify your ${email.companyName} store`;
    const text =
      `Thanks for signing up ${email.companyName}!\n\n` +
      `Verify your email to activate your store:\n${email.verifyUrl}\n\n` +
      `This link expires in 24 hours. If you did not request this, ignore this email.`;
    const html =
      `<p>Thanks for signing up <strong>${this.escapeHtml(email.companyName)}</strong>!</p>` +
      `<p><a href="${this.escapeHtml(email.verifyUrl)}">Verify your email to activate your store</a></p>` +
      `<p>This link expires in 24 hours. If you did not request this, ignore this email.</p>`;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured - verification email to ${email.to} logged instead: ${email.verifyUrl}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: email.to,
        subject,
        text,
        html,
      });
    } catch (error) {
      const category = classifyMailError(error);
      this.logger.error(
        `Failed to send verification email to ${email.to} (${category}): ${errorMessage(error)}`,
      );
      throw new MailSendError(
        category,
        `Failed to send verification email (${category})`,
        error,
      );
    }
    this.logger.log(`Verification email sent to ${email.to}`);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
