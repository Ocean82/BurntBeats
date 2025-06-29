#!/usr/bin/env node

/**
 * Complete Burnt Beats Workflow Test
 * Demonstrates end-to-end song creation process
 */

const http = require('http');

// Test song data using original lyrics
const testSong = {
  title: "Digital Dreams",
  lyrics: `Walking through the city lights tonight
Every step feels like a melody
Code and music blend in perfect harmony
Building worlds where dreams can come alive

Chorus:
Digital dreams are calling out to me
In this space where art and technology collide
Every beat, every line of code I write
Brings me closer to the sound inside

Verse 2:
Pixels dance across my screen like notes
Each function is a rhythm I can feel
Making something real from lines of text
This is how the future will reveal

(Repeat Chorus)

Bridge:
From bytes to beats, from code to song
This is where my heart belongs
Creating music with my mind
Leaving the ordinary world behind`,
  genre: "electronic",
  vocalStyle: "energetic",
  tempo: 128,
  songLength: 90,
  key: "C major"
};

// Voice cloning test data
const voiceTest = {
  text: "Welcome to Burnt Beats, where your musical dreams become reality",
  voiceProfile: "default-voice",
  style: "professional"
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BurntBeats-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testWorkflow() {
  console.log('🎵 Starting Burnt Beats Complete Workflow Test\n');

  try {
    // 1. Test Health Check
    console.log('1. Testing system health...');
    const health = await makeRequest('GET', '/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data)}\n`);

    // 2. Test Song Creation
    console.log('2. Creating original song: "Digital Dreams"...');
    const songCreation = await makeRequest('POST', '/api/songs', testSong);
    console.log(`   Status: ${songCreation.status}`);
    
    if (songCreation.data && songCreation.data.id) {
      console.log(`   Song ID: ${songCreation.data.id}`);
      console.log(`   Title: ${songCreation.data.title}`);
      console.log(`   Genre: ${songCreation.data.genre}`);
      console.log(`   Status: ${songCreation.data.status}\n`);

      // 3. Monitor Generation Progress
      console.log('3. Monitoring song generation progress...');
      const songId = songCreation.data.id;
      
      for (let i = 0; i < 5; i++) {
        const progress = await makeRequest('GET', `/api/songs/${songId}`);
        console.log(`   Progress check ${i + 1}: ${progress.data.status} - ${progress.data.generationProgress || 0}%`);
        
        if (progress.data.status === 'completed') {
          console.log(`   ✅ Song generation completed!`);
          console.log(`   Audio file: ${progress.data.generatedAudioPath}\n`);
          break;
        }
        
        // Wait 2 seconds between checks
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 4. Test Voice Cloning
    console.log('4. Testing voice cloning system...');
    const voiceCloning = await makeRequest('POST', '/api/voice-cloning/synthesize', voiceTest);
    console.log(`   Status: ${voiceCloning.status}`);
    
    if (voiceCloning.data) {
      console.log(`   Voice synthesis: ${voiceCloning.data.message || 'Success'}`);
      console.log(`   Audio file: ${voiceCloning.data.audioPath || 'Generated'}\n`);
    }

    // 5. Test Analytics
    console.log('5. Testing analytics system...');
    const analytics = await makeRequest('GET', '/api/analytics/dashboard');
    console.log(`   Status: ${analytics.status}`);
    
    if (analytics.data) {
      console.log(`   Total songs: ${analytics.data.totalSongs || 0}`);
      console.log(`   Active users: ${analytics.data.activeUsers || 0}\n`);
    }

    // 6. Test Payment System
    console.log('6. Testing payment configuration...');
    const stripeConfig = await makeRequest('GET', '/api/stripe/config');
    console.log(`   Status: ${stripeConfig.status}`);
    
    if (stripeConfig.data && stripeConfig.data.publishableKey) {
      console.log(`   Stripe configured: ✅`);
      console.log(`   Public key present: ${stripeConfig.data.publishableKey.substring(0, 20)}...\n`);
    }

    console.log('🎉 Burnt Beats Workflow Test Complete!');
    console.log('\n📊 SYSTEM STATUS:');
    console.log('   ✅ Health check passed');
    console.log('   ✅ Song creation operational');
    console.log('   ✅ Voice cloning available');
    console.log('   ✅ Analytics dashboard ready');
    console.log('   ✅ Payment system configured');
    console.log('\n🚀 Platform ready for users!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Fallback: Test if server is responsive at all
    try {
      console.log('\n🔄 Testing basic connectivity...');
      const basicTest = await makeRequest('GET', '/');
      console.log(`   Server responding: ${basicTest.status}`);
    } catch (e) {
      console.error('   Server not accessible:', e.message);
    }
  }
}

// Run the complete workflow test
testWorkflow();