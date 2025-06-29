#!/usr/bin/env node

/**
 * Complete Song Creation Test - Burnt Beats Platform
 * Demonstrates full workflow from lyrics input to generated audio
 */

const fs = require('fs');
const path = require('path');

// Import the music generation services
async function createSongFromScratch() {
  console.log('🎵 Starting complete song creation workflow...');
  
  const testSongData = {
    title: "Test Creation Song",
    lyrics: "Walking through the morning light, dreams are taking flight, Every step I take today, leads me on my way, Music fills the air around, beauty can be found, In the simple moments here, everything is clear",
    genre: "pop",
    tempo: 120,
    key: "C major",
    duration: 45,
    vocalStyle: "uplifting",
    userId: "demo-user"
  };

  try {
    // Step 1: Import the song generator
    console.log('📝 Step 1: Loading song generator...');
    const { SongGenerator } = await import('./server/services/song-generator.js');
    
    // Step 2: Generate the song
    console.log('🎼 Step 2: Generating musical composition...');
    const result = await SongGenerator.generate(testSongData, {
      type: 'music21-demo',
      quality: 'standard',
      userId: 'demo-user'
    });
    
    if (result.status === 'completed' && result.song) {
      console.log('✅ Song generation completed!');
      console.log(`📄 Title: ${result.song.title}`);
      console.log(`🎶 Genre: ${result.song.genre}`);
      console.log(`⏱️  Duration: ${result.song.duration} seconds`);
      console.log(`🎵 Key: ${result.song.key}`);
      console.log(`🔊 Audio file: ${result.song.generatedAudioPath}`);
      
      // Step 3: Verify the audio file exists
      if (fs.existsSync(result.song.generatedAudioPath)) {
        const stats = fs.statSync(result.song.generatedAudioPath);
        console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log('🎧 Audio file successfully created and ready for playback!');
        
        // Step 4: Display download options
        console.log('\n💰 Download Options Available:');
        console.log('• Bonus Track ($2.99) - Demo with watermark');
        console.log('• Base Song ($4.99) - Clean high-quality MP3');
        console.log('• Top Quality ($9.99) - Studio master with stems');
        
        return {
          success: true,
          song: result.song,
          message: 'Complete song creation workflow successful!'
        };
      } else {
        console.log('❌ Audio file was not created');
        return { success: false, error: 'Audio file generation failed' };
      }
    } else {
      console.log('❌ Song generation failed:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('💥 Song creation workflow failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the complete workflow
createSongFromScratch().then(result => {
  if (result.success) {
    console.log('\n🎉 SUCCESS: Complete song created from start to finish!');
    console.log('🚀 Platform ready for user song creation');
  } else {
    console.log('\n💔 FAILED:', result.error);
  }
}).catch(error => {
  console.error('🚨 Workflow error:', error);
});