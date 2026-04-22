#!/usr/bin/env node
/**
 * PayPal Credentials Diagnostic Script
 * Tests PayPal OAuth authentication locally
 *
 * Usage: node scripts/test-paypal-credentials.js
 */

const clientId = process.env.PAYPAL_CLIENT_ID || '';
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
const sandboxMode = process.env.PAYPAL_SANDBOX_MODE === 'true';

const PAYPAL_API = sandboxMode ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

async function testPayPalCredentials() {
  console.log('🔍 PayPal Credentials Diagnostic');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();

  // Check if credentials are set
  if (!clientId || !clientSecret) {
    console.error('❌ ERROR: PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not set');
    console.log();
    console.log('Set these environment variables:');
    console.log('  export PAYPAL_CLIENT_ID="your-client-id"');
    console.log('  export PAYPAL_CLIENT_SECRET="your-secret"');
    console.log('  export PAYPAL_SANDBOX_MODE="true"');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`  Mode: ${sandboxMode ? 'SANDBOX' : 'LIVE'}`);
  console.log(`  API URL: ${PAYPAL_API}`);
  console.log(`  Client ID: ${clientId.substring(0, 15)}...`);
  console.log(`  Client ID Length: ${clientId.length} characters`);
  console.log(`  Client Secret Length: ${clientSecret.length} characters`);
  console.log();

  // Validate format
  console.log('✅ Format Check:');
  if (clientId.length !== 80) {
    console.log(`  ⚠️  Client ID length is ${clientId.length}, expected 80`);
  } else {
    console.log(`  ✅ Client ID length correct (80)`);
  }

  if (clientSecret.length < 50) {
    console.log(`  ⚠️  Client Secret seems short (${clientSecret.length} chars)`);
  } else {
    console.log(`  ✅ Client Secret length OK`);
  }

  if (!clientId.startsWith('A')) {
    console.log(`  ⚠️  Client ID doesn't start with 'A' (typical for Sandbox)`);
  } else {
    console.log(`  ✅ Client ID starts with 'A'`);
  }
  console.log();

  // Test authentication
  console.log('🧪 Testing PayPal OAuth Authentication...');
  console.log();

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    const responseText = await response.text();

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ AUTHENTICATION SUCCESSFUL!');
      console.log();
      console.log('Token Details:');
      console.log(`  Access Token: ${data.access_token.substring(0, 20)}...`);
      console.log(`  Expires in: ${data.expires_in} seconds`);
      console.log(`  Token Type: ${data.token_type}`);
      console.log();
      console.log('Your PayPal credentials are working correctly ✅');
    } else {
      console.error('❌ AUTHENTICATION FAILED');
      console.log();
      console.error('Response Status:', response.status);
      console.error('Response Body:', responseText);
      console.log();
      console.log('Common causes:');
      console.log('  1. Wrong credentials (Live vs Sandbox)');
      console.log('  2. App not active in PayPal Developer');
      console.log('  3. Credentials contain extra spaces');
      console.log('  4. App permissions not configured');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testPayPalCredentials();
