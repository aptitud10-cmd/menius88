import { createClient } from '@/lib/supabase/server';
import { AdminUsers } from '@/components/admin/AdminUsers';

export default async function AdminUsersPage() {
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch restaurant names separately
  const restIds = Array.from(new Set((profiles ?? []).map(p => p.default_restaurant_id).filter(Boolean)));
  const { data: rests } = restIds.length > 0
    ? await supabase.from('restaurants').select('id, name, slug').in('id', restIds)
    : { data: [] };
  const restMap = new Map((rests ?? []).map(r => [r.id, r]));
  const profilesWithRest = (profiles ?? []).map(p => ({
    ...p,
    restaurant: p.default_restaurant_id ? restMap.get(p.default_restaurant_id) ?? null : null,
  }));

  return <AdminUsers profiles={profilesWithRest} />;
}
