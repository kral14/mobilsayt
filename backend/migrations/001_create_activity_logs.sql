-- Activity Logs table migration
-- Add this to create_all_tables.sql or run separately

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  log_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER,
  timestamp TIMESTAMP(6) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('window', 'invoice', 'user', 'system', 'data')),
  action TEXT NOT NULL,
  details TEXT,
  metadata JSONB,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for activity_logs user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'activity_logs_user_id_fkey'
  ) THEN
    ALTER TABLE activity_logs 
      ADD CONSTRAINT activity_logs_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_user_timestamp ON activity_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_category ON activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_logs_level ON activity_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_log_id ON activity_logs(log_id);

-- Success message
SELECT 'Activity logs table created successfully!' AS message;
