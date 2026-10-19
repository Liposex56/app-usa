/**
 * Transactional email through Resend (https://resend.com). It stays switched
 * off — nothing is sent, nothing breaks — until RESEND_API_KEY is set.
 *
 *   RESEND_API_KEY   the API key from Resend
 *   EMAIL_FROM       e.g. "Havenr <hello@yourdomain.com>" (a domain verified in Resend)
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!emailConfigured()) return { ok: false, error: 'Email is not configured.' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!response.ok) {
      return { ok: false, error: `Resend answered ${response.status}.` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Network error.' };
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char];
  });

/** The email a notification becomes: its title, its line of detail and a button. */
export function notificationEmail(input: {
  title: string;
  body: string | null;
  link: string | null;
}): { subject: string; text: string; html: string } {
  const text = [input.title, input.body, input.link ? `Open it: ${input.link}` : null]
    .filter(Boolean)
    .join('\n\n');
  const html =
    `<div style="font-family:Helvetica,Arial,sans-serif;color:#26100B;max-width:520px">` +
    `<h2 style="margin:0 0 12px">${escapeHtml(input.title)}</h2>` +
    (input.body ? `<p style="margin:0 0 16px;font-size:16px">${escapeHtml(input.body)}</p>` : '') +
    (input.link
      ? `<p><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#26100B;color:#F8F5E6;` +
        `padding:10px 22px;border-radius:999px;text-decoration:none;font-weight:600">Open in Havenr</a></p>`
      : '') +
    `<p style="color:#69532A;font-size:13px;margin-top:24px">You get this because of activity on your Havenr account.</p>` +
    `</div>`;
  return { subject: input.title, text, html };
}
