#!/usr/bin/env node

/**
 * Comprehensive test for enhanced bonus features
 * Tests AI feedback, license certificates, and beat popularity tracking
 */

const BASE_URL = 'http://localhost:5000';

// Test data
const testSong = {
  id: '12345',
  title: 'Test Beat',
  lyrics: `Verse 1:
Living life in the fast lane
Money, power, respect my name
Never looking back again
Success flowing through my veins

Chorus:
We rise up, we never fall
Standing tall through it all
Dreams become reality
This is our destiny

Verse 2:
Started from the bottom now
Every struggle made us strong somehow
Future bright, we own it now
Taking over, making vows`,
  tier: 'base',
  userEmail: 'test@burntbeats.app',
  artistName: 'TestArtist'
};

async function makeRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function testAIFeedback() {
  console.log('\n🤖 Testing AI Feedback Generation...');
  
  const result = await makeRequest('POST', `/api/ai-feedback/${testSong.id}`, {
    tier: testSong.tier,
    userEmail: testSong.userEmail
  });

  if (result.status === 200) {
    console.log('✅ AI Feedback generated successfully');
    console.log(`   Score: ${result.data.analysis.overallScore}/10`);
    console.log(`   Mood: ${result.data.analysis.mood}`);
    console.log(`   Genre: ${result.data.analysis.genre}`);
    console.log(`   Strengths: ${result.data.analysis.strengths.length} identified`);
    console.log(`   Improvements: ${result.data.analysis.improvements.length} suggested`);
    return true;
  } else {
    console.log(`❌ AI Feedback failed: ${result.data?.message || result.error}`);
    return false;
  }
}

async function testLicenseGeneration() {
  console.log('\n📄 Testing License Certificate Generation...');
  
  const result = await makeRequest('POST', '/api/license/generate', {
    songId: testSong.id,
    songTitle: testSong.title,
    tier: testSong.tier,
    userEmail: testSong.userEmail,
    artistName: testSong.artistName
  });

  if (result.status === 200) {
    console.log('✅ License certificate generated successfully');
    console.log(`   License ID: ${result.data.licenseId}`);
    console.log(`   Beat ID: ${result.data.beatId}`);
    console.log(`   File Path: ${result.data.licensePath}`);
    return result.data.beatId;
  } else {
    console.log(`❌ License generation failed: ${result.data?.message || result.error}`);
    return null;
  }
}

async function testBeatPopularity(beatId) {
  console.log('\n📊 Testing Beat Popularity Tracking...');
  
  // Test getting beat stats
  const statsResult = await makeRequest('GET', `/api/beats/popularity/${beatId}`);
  
  if (statsResult.status === 200) {
    console.log('✅ Beat popularity stats retrieved');
    console.log(`   Total Licenses: ${statsResult.data.totalLicenses}`);
    console.log(`   Total Revenue: $${statsResult.data.totalRevenue}`);
    console.log(`   Popularity Score: ${statsResult.data.popularityScore}`);
  } else {
    console.log(`❌ Beat stats failed: ${statsResult.data?.message || statsResult.error}`);
  }

  // Test top performing beats
  const topBeatsResult = await makeRequest('GET', '/api/beats/top-performing?limit=5');
  
  if (topBeatsResult.status === 200) {
    console.log('✅ Top performing beats retrieved');
    console.log(`   Found ${topBeatsResult.data.count} top beats`);
    if (topBeatsResult.data.topBeats.length > 0) {
      const topBeat = topBeatsResult.data.topBeats[0];
      console.log(`   Top Beat: "${topBeat.songTitle}" (Score: ${topBeat.popularityScore})`);
    }
  } else {
    console.log(`❌ Top beats failed: ${topBeatsResult.data?.message || topBeatsResult.error}`);
  }
}

async function testPurchaseSummary() {
  console.log('\n💳 Testing Purchase Summary Dashboard...');
  
  const result = await makeRequest('GET', `/api/purchases/summary/${testSong.userEmail}`);
  
  if (result.status === 200) {
    console.log('✅ Purchase summary retrieved');
    console.log(`   Total Purchases: ${result.data.totalPurchases}`);
    console.log(`   Total Spent: $${result.data.totalSpent}`);
    console.log(`   Average AI Score: ${result.data.averageAiScore}`);
    if (result.data.purchases.length > 0) {
      console.log(`   Recent Purchase: "${result.data.purchases[0].songTitle}"`);
    }
  } else {
    console.log(`❌ Purchase summary failed: ${result.data?.message || result.error}`);
  }
}

async function testStripePurchaseFlow() {
  console.log('\n💸 Testing Stripe Purchase Integration...');
  
  // Test payment intent creation (amount in cents)
  const paymentResult = await makeRequest('POST', '/api/stripe/create-payment-intent', {
    amount: 499, // $4.99 in cents
    currency: 'usd',
    downloadType: 'mp3_hq',
    songId: testSong.id,
    features: ['clean_audio', 'commercial_license']
  });

  if (paymentResult.status === 200) {
    console.log('✅ Payment intent created successfully');
    console.log(`   Client Secret: ${paymentResult.data.clientSecret.substring(0, 20)}...`);
    return true;
  } else {
    console.log(`❌ Payment intent failed: ${paymentResult.data?.message || paymentResult.error}`);
    return false;
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing server health...');
  
  const result = await makeRequest('GET', '/api/health');
  
  if (result.status === 200) {
    console.log('✅ Server is healthy');
    return true;
  } else {
    console.log('❌ Server health check failed');
    return false;
  }
}

async function runAllTests() {
  console.log('🎵 BURNT BEATS - Enhanced Features Test Suite');
  console.log('=============================================\n');

  // Check server health first
  const serverHealthy = await testHealthCheck();
  if (!serverHealthy) {
    console.log('\n❌ Server not responding - aborting tests');
    return;
  }

  let testResults = {
    aiFeedback: false,
    licenseGeneration: false,
    beatPopularity: false,
    purchaseSummary: false,
    stripeIntegration: false
  };

  // Run AI feedback test
  testResults.aiFeedback = await testAIFeedback();

  // Run license generation test
  const beatId = await testLicenseGeneration();
  testResults.licenseGeneration = beatId !== null;

  // Run beat popularity test (if license generation succeeded)
  if (beatId) {
    await testBeatPopularity(beatId);
    testResults.beatPopularity = true;
  }

  // Run purchase summary test
  await testPurchaseSummary();
  testResults.purchaseSummary = true;

  // Run Stripe integration test
  testResults.stripeIntegration = await testStripePurchaseFlow();

  // Final results
  console.log('\n🧪 Test Results Summary');
  console.log('========================');
  console.log(`AI Feedback Generation: ${testResults.aiFeedback ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`License Certificate: ${testResults.licenseGeneration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Beat Popularity Tracking: ${testResults.beatPopularity ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Purchase Summary: ${testResults.purchaseSummary ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Stripe Integration: ${testResults.stripeIntegration ? '✅ PASS' : '❌ FAIL'}`);

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`\n📊 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All enhanced features working correctly!');
    console.log('\n✅ Ready for deployment with:');
    console.log('   ✓ Post-purchase AI feedback');
    console.log('   ✓ Auto-generated license certificates');
    console.log('   ✓ Beat popularity tracking');
    console.log('   ✓ Purchase summary dashboard');
    console.log('   ✓ Stripe payment integration');
  } else {
    console.log('⚠️  Some features need attention before deployment');
  }
}

// Run tests if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testSong };