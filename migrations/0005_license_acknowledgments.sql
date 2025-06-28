
-- Create license acknowledgments table
CREATE TABLE IF NOT EXISTS license_acknowledgments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  track_id VARCHAR(255) NOT NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  purchase_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_license_ack_user_id ON license_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_license_ack_track_id ON license_acknowledgments(track_id);
CREATE INDEX IF NOT EXISTS idx_license_ack_purchase_id ON license_acknowledgments(purchase_id);
