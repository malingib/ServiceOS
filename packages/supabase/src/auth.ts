import { supabase } from './client';
import type { Session } from '@supabase/supabase-js';

/**
 * Create a Supabase user with custom metadata for multi-tenancy
 */
export async function createSupabaseUser(data: {
  phone: string;
  email?: string;
  password?: string;
  userMetadata: {
    first_name: string;
    last_name: string;
    tenant_id: string;
    role: string;
  };
}) {
  return supabase.auth.admin.createUser({
    phone: data.phone,
    email: data.email,
    password: data.password || undefined,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: data.userMetadata,
  });
}

/**
 * Get a user by phone number
 */
export async function getUserByPhone(phone: string) {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) throw error;

  return data.users.find((user) => user.phone === phone);
}

/**
 * Update user metadata (e.g., tenant association, role)
 */
export async function updateUserMetadata(userId: string, metadata: Record<string, any>) {
  return supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });
}

/**
 * Get user session from JWT token
 */
export async function verifyToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);

  if (error) throw error;

  return data.user;
}

/**
 * Revoke user session
 */
export async function revokeToken(sessionId: string) {
  return supabase.auth.admin.deleteSession(sessionId);
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  return supabase.auth.admin.deleteUser(userId);
}

/**
 * Generate OTP and send via SMS (if provider configured)
 * Note: Supabase OTP is managed server-side but we keep Africa's Talking integration
 */
export async function createOtpSession(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    shouldCreateUser: true,
  });

  if (error) throw error;

  return data;
}

export default {
  createSupabaseUser,
  getUserByPhone,
  updateUserMetadata,
  verifyToken,
  revokeToken,
  deleteUser,
  createOtpSession,
};
