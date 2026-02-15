/**
 * Test Setup
 * 
 * Loads environment variables for testing.
 * Tests run against the REAL Supabase instance to verify actual RLS policies.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local for Supabase credentials
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Verify required environment variables
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}. Create .env.local with your Supabase credentials.`);
  }
}

console.log('✓ Test environment loaded');
console.log(`  Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
