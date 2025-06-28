
const fs = require('fs');
const path = require('path');

async function testVoiceProcessing() {
  try {
    console.log('🎵 Testing Voice Sample Processing...');
    
    // Check if audio files exist
    const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
    const audioFiles = fs.readdirSync(attachedAssetsDir)
      .filter(file => file.includes('audio') && (file.endsWith('.mp3') || file.endsWith('.wav')))
      .filter(file => !file.includes('.aup3')); // Exclude Audacity project files

    console.log(`📁 Found ${audioFiles.length} audio files in attached_assets:`);
    audioFiles.forEach(file => {
      const filePath = path.join(attachedAssetsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    });

    if (audioFiles.length === 0) {
      console.log('❌ No valid audio files found for processing');
      return;
    }

    // Test API call to process voice samples
    const response = await fetch('http://localhost:5000/api/voice-processing/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Voice processing status:', data);
    } else {
      console.log('⚠️  Server not running or endpoint not available');
      console.log('   Start the server with: npm run dev');
      console.log('   Then process samples with: POST /api/voice-processing/process-all');
    }

    console.log('\n🔧 To process these files into voice clones:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Make a POST request to: http://localhost:5000/api/voice-processing/process-all');
    console.log('3. Each file will be processed through the voice cloning service');
    console.log('4. National anthem samples will be generated for each voice');
    console.log('5. Voices will be available in the voice bank');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVoiceProcessing();
