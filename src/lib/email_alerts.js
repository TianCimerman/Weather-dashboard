import nodemailer from "nodemailer";

let cachedTransporter = null;

function maskEmail(value) {
  if (!value || typeof value !== "string") return "<missing>";
  const [name = "", domain = ""] = value.split("@");
  if (!domain) return `${name.slice(0, 2)}***`;
  return `${name.slice(0, 2)}***@${domain}`;
}

function getEmailConfigStatus() {
  const required = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_TO: process.env.EMAIL_TO,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value || String(value).trim() === "")
    .map(([key]) => key);

  return { required, missing };
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS ?? "").replace(/\s+/g, "");

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) {
    console.warn("[feeder-alert][email] SMTP config invalid or incomplete; transporter not created");
    return null;
  }

  cachedTransporter = nodemailer.createTransport(smtpConfig);
  console.log(
    `[feeder-alert][email] Transporter initialized host=${smtpConfig.host} port=${smtpConfig.port} secure=${smtpConfig.secure}`
  );
  return cachedTransporter;
}

export async function sendFeederLowFillEmail({ thresholdPercent, currentPercent, distanceCm, measuredAt }) {
  console.log(
    `[feeder-alert][email] Attempting send currentPercent=${currentPercent} threshold=${thresholdPercent} distanceCm=${distanceCm ?? "null"}`
  );

  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_TO;
  const { missing, required } = getEmailConfigStatus();

  if (!transporter || !from || !to) {
    console.warn(
      `[feeder-alert][email] Email not sent: missing config keys: ${missing.length ? missing.join(", ") : "unknown"}`
    );
    console.warn(
      `[feeder-alert][email] Config snapshot SMTP_HOST=${required.SMTP_HOST ? "set" : "missing"} SMTP_PORT=${required.SMTP_PORT ? "set" : "missing"} SMTP_USER=${maskEmail(required.SMTP_USER)} SMTP_PASS=${required.SMTP_PASS ? `set(len=${String(required.SMTP_PASS).length})` : "missing"} EMAIL_FROM=${maskEmail(required.EMAIL_FROM)} EMAIL_TO=${maskEmail(required.EMAIL_TO)}`
    );
    return { ok: false, skipped: true, reason: "missing_email_config" };
  }

  const measuredText = measuredAt ? new Date(measuredAt).toLocaleString() : "Unknown";
  const subject = `Feeder alert: fill ${currentPercent}% (below ${thresholdPercent}%)`;
  const text = [
    "Pet feeder low-fill alert",
    `Current percentage: ${currentPercent}%`,
    `Threshold: ${thresholdPercent}%`,
    `Measured distance: ${distanceCm ?? "Unknown"} cm`,
    `Measured at: ${measuredText}`,
  ].join("\n");

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
    console.log(
      `[feeder-alert][email] Sent messageId=${info?.messageId ?? "unknown"} accepted=${Array.isArray(info?.accepted) ? info.accepted.length : 0} rejected=${Array.isArray(info?.rejected) ? info.rejected.length : 0}`
    );
  } catch (err) {
    console.error("[feeder-alert][email] sendMail failed:", err);
    return { ok: false, skipped: false, reason: "send_failed", error: String(err?.message ?? err) };
  }

  return { ok: true };
}
