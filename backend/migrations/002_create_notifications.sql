-- Notifications table migration
-- Create notifications table for storing user notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('success', 'error', 'warning', 'info')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for notifications user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE notifications 
      ADD CONSTRAINT notifications_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_timestamp ON notifications(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Success message
SELECT 'Notifications table created successfully!' AS message;
