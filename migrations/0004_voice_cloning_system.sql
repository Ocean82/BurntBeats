
-- Voice cloning system tables
CREATE TABLE IF NOT EXISTS voice_clones (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  audio_path VARCHAR(255) NOT NULL,
  anthem_path VARCHAR(255),
  sample_path VARCHAR(255),
  characteristics JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_samples (
  id VARCHAR(36) PRIMARY KEY,
  voice_clone_id VARCHAR(36) REFERENCES voice_clones(id) ON DELETE CASCADE,
  sample_type VARCHAR(50) NOT NULL, -- 'original', 'anthem', 'demo'
  file_path VARCHAR(255) NOT NULL,
  duration FLOAT,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_voice_clones_user_id ON voice_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_clones_public ON voice_clones(is_public);
CREATE INDEX IF NOT EXISTS idx_voice_samples_clone_id ON voice_samples(voice_clone_id);
