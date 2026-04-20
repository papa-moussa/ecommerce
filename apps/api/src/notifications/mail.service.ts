import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

import { type AppConfig } from '../config/configuration';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private from!: string;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    this.from = this.config.get('SMTP_FROM', { infer: true });

    this.transporter = createTransport({
      host: this.config.get('SMTP_HOST', { infer: true }),
      port: this.config.get('SMTP_PORT', { infer: true }),
      secure: this.config.get('SMTP_SECURE', { infer: true }),
      auth: {
        user: this.config.get('SMTP_USER', { infer: true }) || undefined,
        pass: this.config.get('SMTP_PASS', { infer: true }) || undefined,
      },
    });
  }

  async sendMail(opts: MailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });
      this.logger.log(`Email sent to ${opts.to} — "${opts.subject}"`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}`, err);
      // Swallow error — do not let email failure break the main flow
    }
  }

  // ---------------------------------------------------------------------------
  // Templated helpers
  // ---------------------------------------------------------------------------

  async sendVerificationEmail(to: string, firstName: string, verifyUrl: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Confirmez votre adresse e-mail — Maison Parfum',
      text: `Bonjour ${firstName},\n\nCliquez sur ce lien pour confirmer votre adresse :\n${verifyUrl}\n\nCe lien expire dans 24 h.`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 0">
          <h2 style="color:#1a1a1a;font-size:22px;margin-bottom:16px">Bienvenue, ${firstName}&nbsp;!</h2>
          <p style="color:#555;line-height:1.6;margin-bottom:24px">
            Merci de vous être inscrit(e) sur <strong>Maison Parfum</strong>.<br>
            Confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous.
          </p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#1a1a1a;color:#f5f0e8;text-decoration:none;
                    padding:14px 28px;border-radius:99px;font-size:14px;font-weight:600">
            Confirmer mon adresse
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">
            Ce lien expire dans <strong>24 heures</strong>.<br>
            Si vous n'avez pas créé de compte, ignorez cet e-mail.
          </p>
        </div>
      `,
    });
  }

  async sendOrderStatusEmail(
    to: string,
    firstName: string,
    orderId: string,
    status: string,
    trackingNumber?: string | null,
  ): Promise<void> {
    const shortId = orderId.slice(-8).toUpperCase();
    const subjects: Record<string, string> = {
      PROCESSING: `Votre commande #${shortId} est en préparation`,
      SHIPPED: `Votre commande #${shortId} est expédiée !`,
      DELIVERED: `Votre commande #${shortId} a été livrée`,
      CANCELLED: `Votre commande #${shortId} a été annulée`,
      REFUNDED: `Remboursement de votre commande #${shortId}`,
    };
    const bodies: Record<string, string> = {
      PROCESSING: `Bonne nouvelle, ${firstName}&nbsp;! Notre équipe prépare votre commande <strong>#${shortId}</strong>. Vous recevrez un e-mail dès l'expédition.`,
      SHIPPED: `Votre commande <strong>#${shortId}</strong> a été confiée au transporteur.${trackingNumber ? `<br><br>Numéro de suivi&nbsp;: <strong>${trackingNumber}</strong>` : ''}`,
      DELIVERED: `Votre commande <strong>#${shortId}</strong> a été livrée. Nous espérons que vous êtes pleinement satisfait(e).`,
      CANCELLED: `Votre commande <strong>#${shortId}</strong> a été annulée. Si vous avez des questions, contactez notre service client.`,
      REFUNDED: `Le remboursement de votre commande <strong>#${shortId}</strong> a été initié. Il apparaîtra sur votre relevé bancaire sous 5 à 10 jours ouvrés.`,
    };
    const subject = subjects[status];
    const body = bodies[status];
    if (!subject || !body) return;

    await this.sendMail({
      to,
      subject,
      text: subject,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 0">
          <h2 style="color:#1a1a1a;font-size:20px;margin-bottom:16px">${subject}</h2>
          <p style="color:#555;line-height:1.6;margin-bottom:24px">Bonjour ${firstName},<br><br>${body}</p>
          <p style="color:#999;font-size:12px;margin-top:32px">
            Maison Parfum · Une sélection rigoureuse de parfums de niche
          </p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, firstName: string, resetUrl: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Réinitialisation de votre mot de passe — Maison Parfum',
      text: `Bonjour ${firstName},\n\nCliquez sur ce lien pour réinitialiser votre mot de passe :\n${resetUrl}\n\nCe lien expire dans 1 h.`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 0">
          <h2 style="color:#1a1a1a;font-size:22px;margin-bottom:16px">Réinitialisation du mot de passe</h2>
          <p style="color:#555;line-height:1.6;margin-bottom:24px">
            Bonjour ${firstName},<br><br>
            Vous avez demandé la réinitialisation de votre mot de passe.<br>
            Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#1a1a1a;color:#f5f0e8;text-decoration:none;
                    padding:14px 28px;border-radius:99px;font-size:14px;font-weight:600">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">
            Ce lien expire dans <strong>1 heure</strong>.<br>
            Si vous n'avez pas fait cette demande, ignorez cet e-mail.
          </p>
        </div>
      `,
    });
  }
}
