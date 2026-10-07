import { headers } from 'next/headers';

/** The public origin of this deployment, for links meant to be shared. */
export async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  return host ? `${proto}://${host}` : 'http://localhost:3000';
}
