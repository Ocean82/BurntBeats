import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'operational', 
    timestamp: new Date().toISOString(),
    service: 'Burnt Beats',
    version: '1.0.0'
  });
});

// Demo song creation endpoint
app.post('/api/demo/create-song', (req, res) => {
  const { title, lyrics, genre } = req.body;
  
  // Simulate song creation process
  const songResult = {
    id: Math.random().toString(36).substr(2, 9),
    title: title || 'Demo Song',
    lyrics: lyrics || 'Sample lyrics for demonstration',
    genre: genre || 'pop',
    status: 'completed',
    duration: 45,
    audioPath: '/demo/audio/sample.mp3',
    createdAt: new Date().toISOString(),
    downloadOptions: {
      bonus: { price: 2.99, format: 'MP3 with watermark' },
      base: { price: 4.99, format: 'Clean MP3 320kbps' },
      top: { price: 9.99, format: 'Studio WAV with stems' }
    }
  };
  
  res.json({
    success: true,
    message: 'Song created successfully',
    song: songResult
  });
});

// Demo audio endpoint
app.get('/demo/audio/sample.mp3', (req, res) => {
  // Return a placeholder response for demo audio
  res.json({ message: 'Demo audio file - would be actual MP3 in production' });
});

// Catch all handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Burnt Beats server running on http://0.0.0.0:${port}`);
  console.log('Frontend accessible at the root URL');
  console.log('API endpoints ready for song creation');
});