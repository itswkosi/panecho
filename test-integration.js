#!/usr/bin/env node
// Integration test for scan processing flow
const fs = require('fs');

console.log('🧪 Testing Complete Scan Processing Flow\n');
console.log('='.repeat(60));

// Load environment
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
    process.env[match[1]] = match[2].trim();
  }
});

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

console.log('\n📋 Part 1: Environment Variables');
console.log('-'.repeat(60));

test('NEXT_PUBLIC_SUPABASE_URL is set', () => {
  if (!envVars.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing');
  if (envVars.NEXT_PUBLIC_SUPABASE_URL.includes(' ')) throw new Error('Contains spaces');
});

test('NEXT_PUBLIC_SUPABASE_ANON_KEY is set', () => {
  if (!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('Missing');
  if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes(' ')) throw new Error('Contains spaces');
});

test('SUPABASE_SERVICE_ROLE_KEY is set', () => {
  if (!envVars.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing');
  if (envVars.SUPABASE_SERVICE_ROLE_KEY.includes(' ')) throw new Error('Contains spaces');
});

test('GEMINI_API_KEY is set', () => {
  if (!envVars.GEMINI_API_KEY) throw new Error('Missing');
  if (envVars.GEMINI_API_KEY.includes(' ')) throw new Error('Contains spaces');
});

console.log('\n🔍 Part 2: Format Validation');
console.log('-'.repeat(60));

test('Supabase URL format', () => {
  if (!envVars.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    throw new Error('Must start with https://');
  }
  if (!envVars.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co')) {
    throw new Error('Must be a Supabase URL');
  }
});

test('Anon key JWT format', () => {
  if (!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ')) {
    throw new Error('Invalid JWT format');
  }
  if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.').length !== 3) {
    throw new Error('JWT must have 3 parts');
  }
});

test('Service key JWT format', () => {
  if (!envVars.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
    throw new Error('Invalid JWT format');
  }
  if (envVars.SUPABASE_SERVICE_ROLE_KEY.split('.').length !== 3) {
    throw new Error('JWT must have 3 parts');
  }
});

test('Gemini API key format', () => {
  if (!envVars.GEMINI_API_KEY.startsWith('AIza')) {
    throw new Error('Invalid Gemini key format');
  }
  if (envVars.GEMINI_API_KEY.length < 30) {
    throw new Error('Key too short');
  }
});

console.log('\n🔌 Part 3: Client Initialization');
console.log('-'.repeat(60));

test('Supabase client initialization', () => {
  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!client) throw new Error('Client is null');
  if (typeof client.from !== 'function') throw new Error('Missing query methods');
});

test('Gemini client initialization', () => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(envVars.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  if (!model) throw new Error('Model is null');
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${testsPassed} passed, ${testsFailed} failed\n`);

if (testsFailed > 0) {
  console.log('❌ Some tests failed. Please fix the issues above.\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed! Configuration is correct.\n');
  console.log('📝 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Upload a scan and test the flow');
  console.log('   3. Check browser console for any errors');
  console.log('   4. Deploy to Vercel with same environment variables\n');
}
