-- Create beats table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS beats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE beats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own beats
CREATE POLICY "Users can read their own beats"
  ON beats FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own beats
CREATE POLICY "Users can insert their own beats"
  ON beats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own beats
CREATE POLICY "Users can update their own beats"
  ON beats FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own beats
CREATE POLICY "Users can delete their own beats"
  ON beats FOR DELETE
  USING (auth.uid() = user_id);

