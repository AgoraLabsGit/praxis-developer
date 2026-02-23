import { redirect } from 'next/navigation';

export default async function LegacyIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.error) qs.set('error', params.error);
  if (params.connected) qs.set('connected', params.connected);
  const query = qs.toString();
  redirect(`/dashboard/integrations/code${query ? `?${query}` : ''}`);
}
