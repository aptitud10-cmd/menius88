'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SignupInput, LoginInput } from '@/lib/validations';

export async function signup(data: SignupInput) {
  const supabase = createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.full_name },
    },
  });

  if (error) return { error: error.message };

  // If Supabase returned a user but NO session, email confirmation is required.
  if (authData?.user && !authData.session) {
    return {
      error: 'Te enviamos un email de confirmación. Revisa tu bandeja de entrada.',
    };
  }

  // Session exists → user is authenticated. Ensure profile exists.
  if (authData?.user) {
    await supabase.from('profiles').upsert(
      {
        user_id: authData.user.id,
        full_name: data.full_name,
        role: 'owner',
      },
      { onConflict: 'user_id' }
    );
  }

  redirect('/onboarding/create-restaurant');
}

export async function login(data: LoginInput) {
  const supabase = createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) return { error: error.message };

  const user = authData.user;
  if (!user) return { error: 'Error de autenticación' };

  // Check if user already has a restaurant
  const { data: profile } = await supabase
    .from('profiles')
    .select('default_restaurant_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profile?.default_restaurant_id) {
    redirect('/app');
  }

  // Maybe the user owns a restaurant but profile isn't linked — self-heal
  const { data: ownedRestaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (ownedRestaurant?.id) {
    await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        default_restaurant_id: ownedRestaurant.id,
        full_name: (user.user_metadata?.full_name as string) ?? '',
      },
      { onConflict: 'user_id' }
    );
    redirect('/app');
  }

  redirect('/onboarding/create-restaurant');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
