import { redirect } from 'next/navigation';

/** The instant "request a booking" form was replaced by the contact summary. */
export default async function BookSitterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string; service?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const qs = new URLSearchParams(
    Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1]))
  ).toString();
  redirect(`/sitters/${id}/contact${qs ? `?${qs}` : ''}`);
}
