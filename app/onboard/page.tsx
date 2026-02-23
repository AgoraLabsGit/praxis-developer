import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createOrganizationForUser } from './actions';
import { OnboardError } from './onboard-error';

export default async function OnboardPage() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (org) {
      redirect('/dashboard');
    }

    await createOrganizationForUser(user.id);
    redirect('/dashboard');
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error && (error as { digest?: string }).digest === 'NEXT_REDIRECT') {
      throw error;
    }
    return (
      <OnboardError
        message={
          error instanceof Error ? error.message : 'Something went wrong during setup'
        }
      />
    );
  }
}
