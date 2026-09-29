import nodemailer from "nodemailer";
import type { SentMessageInfo } from "nodemailer";

const host = process.env.ETHEREAL_HOST ?? "smtp.ethereal.email";
const port = Number(process.env.ETHEREAL_PORT ?? 587);
const user = process.env.ETHEREAL_USER;
const password = process.env.ETHEREAL_PASSWORD;

if (!user || !password) {
  console.warn(
    "[email] Ethereal credentials are not configured",
  );
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass: password,
  },
});

export interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | null;
  response: string | null;
}

export async function sendEtherealEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const info: SentMessageInfo = await transporter.sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  const testUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl:
      typeof testUrl === "string"
        ? testUrl
        : null,
    response:
      typeof info.response === "string"
        ? info.response
        : null,
  };
}
