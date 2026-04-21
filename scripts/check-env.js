#!/usr/bin/env node
/**
 * Environment Variables Checker
 * Verifies that all required environment variables are set
 * Run this locally to check your configuration
 */

const REQUIRED_VARS = {
  // Database
  DATABASE_URL: 'PostgreSQL connection string',
  DIRECT_URL: 'PostgreSQL direct connection (for migrations)',

  // Authentication
  NEXTAUTH_SECRET: 'NextAuth secret for JWT signing',
  NEXTAUTH_URL: 'Your app URL (http://localhost:3000 for dev)',

  // Stripe
  STRIPE_SECRET_KEY: 'Stripe secret key (sk_test_... or sk_live_...)',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret (whsec_...)',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key (pk_test_... or pk_live_...)',

  // PayPal
  PAYPAL_CLIENT_ID: 'PayPal Client ID (starts with A for Live, or sandbox ID)',
  PAYPAL_CLIENT_SECRET: 'PayPal Client Secret (long string)',
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: 'Same as PAYPAL_CLIENT_ID (for frontend)',
  PAYPAL_SANDBOX_MODE: 'Set to "true" for sandbox mode',

  // Other
  UPLOADTHING_TOKEN: 'UploadThing token for file uploads',
};

const OPTIONAL_VARS = {
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (for admin operations)',
  RESEND_API_KEY: 'Resend API key for email sending',
  CRON_SECRET: 'Secret for cron job authentication',
};

console.log('🔍 Checking Environment Variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('📋 REQUIRED VARIABLES:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
for (const [varName, description] of Object.entries(REQUIRED_VARS)) {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    console.log(`   ${description}`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const masked = value.length > 10 ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}` : '****';
    console.log(`✅ ${varName}: ${masked}`);

    // Additional validation for specific vars
    if (varName === 'PAYPAL_CLIENT_ID' && !process.env.PAYPAL_SANDBOX_MODE) {
      console.log(`   ⚠️  PAYPAL_SANDBOX_MODE not set - PayPal will use Live mode!`);
      hasWarnings = true;
    }

    if (varName === 'PAYPAL_SANDBOX_MODE' && value !== 'true') {
      console.log(`   ⚠️  PayPal Sandbox Mode is OFF - Using Live API`);
      hasWarnings = true;
    }
  }
}

console.log('\n📋 OPTIONAL VARIABLES:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
for (const [varName, description] of Object.entries(OPTIONAL_VARS)) {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: NOT SET (optional)`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${varName}: Set`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (hasErrors) {
  console.log('❌ RESULT: Missing required variables!');
  console.log('   Please set all required variables in your .env.local file');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  RESULT: All required variables set, but some warnings found');
  process.exit(0);
} else {
  console.log('✅ RESULT: All environment variables configured correctly!');
  process.exit(0);
}
