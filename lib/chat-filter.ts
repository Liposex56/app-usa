/**
 * Contact-sharing detection for in-app chat (proposal §9). The goal is
 * never to let a booking's conversation slide off the platform:
 *
 *   Phone numbers / emails  -> masked out of the message before it's stored
 *   External payment apps   -> blocked outright (Venmo, Zelle, etc. is how a
 *                               booking bypasses the platform's commission)
 *   Bank account mentions    -> blocked outright
 *   External links           -> blocked outright
 *   Social media mentions    -> allowed through, but flagged for staff review
 *
 * None of this is perfect text-recognition (proposal §9 itself says OCR on
 * images "no se garantiza una detección perfecta") — it's a first, honest
 * line of defense on plain text, not a guarantee.
 *
 * Every pattern below is only ever used inside this file, each time via a
 * freshly-created RegExp (never a shared module-level one) — a global regex
 * remembers its `lastIndex` between calls, so reusing one across messages
 * silently skips matches. Do not hoist these to constants.
 */

function phoneRe() {
  return /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
}
function emailRe() {
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
}
function urlRe() {
  return /\b(?:https?:\/\/|www\.)\S+/i;
}
function paymentAppRe() {
  return /\b(venmo|zelle|cash\s?app|paypal|cashtag|\$[a-z][a-z0-9_]{2,})\b/i;
}
function bankRe() {
  return /\b(routing number|account number|wire transfer|iban)\b/i;
}
function socialRe() {
  return /\b(instagram|insta|facebook|whatsapp|telegram|snapchat|snap|tiktok|@[a-z0-9_.]{3,})\b/i;
}

export type ChatFilterResult = {
  /** Message text to actually store — contact info replaced with a placeholder. */
  body: string;
  /** True when the message should be rejected outright (never stored). */
  blocked: boolean;
  /** Why, in one line — shown to the sender when blocked. */
  blockedReason: string | null;
  /** True when the (allowed) message should be surfaced to staff. */
  flagged: boolean;
  flaggedReason: string | null;
};

export function filterChatMessage(rawBody: string): ChatFilterResult {
  if (paymentAppRe().test(rawBody)) {
    return {
      body: rawBody,
      blocked: true,
      blockedReason:
        'Payments have to go through Havenr — mentioning Venmo, Zelle, Cash App or PayPal isn’t allowed in chat.',
      flagged: false,
      flaggedReason: null,
    };
  }
  if (bankRe().test(rawBody)) {
    return {
      body: rawBody,
      blocked: true,
      blockedReason: 'Bank account details can’t be shared in chat.',
      flagged: false,
      flaggedReason: null,
    };
  }
  if (urlRe().test(rawBody)) {
    return {
      body: rawBody,
      blocked: true,
      blockedReason: 'Links aren’t allowed in chat — share details here instead.',
      flagged: false,
      flaggedReason: null,
    };
  }

  let body = rawBody;
  const maskedKinds: string[] = [];

  const withoutPhones = body.replace(phoneRe(), '[phone number hidden]');
  if (withoutPhones !== body) {
    maskedKinds.push('phone number');
    body = withoutPhones;
  }

  const withoutEmails = body.replace(emailRe(), '[email hidden]');
  if (withoutEmails !== body) {
    maskedKinds.push('email');
    body = withoutEmails;
  }

  const mentionsSocial = socialRe().test(body);

  return {
    body,
    blocked: false,
    blockedReason: null,
    flagged: maskedKinds.length > 0 || mentionsSocial,
    flaggedReason:
      maskedKinds.length > 0
        ? `Masked: ${maskedKinds.join(', ')}`
        : mentionsSocial
          ? 'Mentions a social media app'
          : null,
  };
}
