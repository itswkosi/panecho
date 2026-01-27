/**
 * Demo User Setup Script
 * Run this once to create the demo user in Supabase
 * Usage: node docs/setup-demo-user.mjs
 */

import { createClient } from '@supabase/supabase-js';

const DEMO_USER_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

async function setupDemoUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🔧 Creating Supabase admin client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('👤 Creating demo user...');
    
    // Use Supabase Admin API to create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'demo@panecho.local',
      password: 'demo-password-not-used',
      email_confirm: true,
      user_metadata: {
        name: 'Demo User',
      },
      // Force the specific UUID
      id: DEMO_USER_ID,
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('✅ Demo user already exists');
        return;
      }
      throw error;
    }

    console.log('✅ Demo user created successfully');
    console.log('   ID:', data.user?.id);
    console.log('   Email:', data.user?.email);
    
  } catch (error) {
    console.error('❌ Failed to create demo user:', error.message);
    process.exit(1);
  }
}

setupDemoUser();
