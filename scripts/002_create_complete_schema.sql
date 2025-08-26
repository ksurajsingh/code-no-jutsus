-- Create comprehensive database schema for DoubtSolve

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  branch TEXT,
  year TEXT,
  semester TEXT,
  cgpa DECIMAL(3,2),
  current_status TEXT DEFAULT 'student',
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work_experience table
CREATE TABLE IF NOT EXISTS work_experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coding_platforms table
CREATE TABLE IF NOT EXISTS coding_platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL CHECK (platform_name IN ('leetcode', 'github', 'codechef', 'hackerrank')),
  username TEXT NOT NULL,
  profile_url TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform_name)
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doubt_threads table
CREATE TABLE IF NOT EXISTS doubt_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  tags TEXT[],
  subtags TEXT[],
  reward_points INTEGER DEFAULT 10,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doubt_upvotes table
CREATE TABLE IF NOT EXISTS doubt_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID REFERENCES doubt_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doubt_id, user_id)
);

-- Create help_sessions table
CREATE TABLE IF NOT EXISTS help_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID REFERENCES doubt_threads(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_type TEXT CHECK (session_type IN ('text', 'video')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create point_transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('earned', 'spent')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default subjects
INSERT INTO subjects (name, description) VALUES
  ('Data Structures', 'Arrays, Linked Lists, Trees, Graphs, etc.'),
  ('Algorithms', 'Sorting, Searching, Dynamic Programming, etc.'),
  ('Operating Systems', 'Process Management, Memory Management, etc.'),
  ('Database Management', 'SQL, Normalization, Transactions, etc.'),
  ('Computer Networks', 'TCP/IP, HTTP, Network Security, etc.'),
  ('Machine Learning', 'Supervised Learning, Neural Networks, etc.'),
  ('Web Development', 'HTML, CSS, JavaScript, Frameworks, etc.'),
  ('Mobile Development', 'Android, iOS, React Native, etc.')
ON CONFLICT (name) DO NOTHING;

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Work experience policies
CREATE POLICY "Users can view all work experience" ON work_experience FOR SELECT USING (true);
CREATE POLICY "Users can manage own work experience" ON work_experience FOR ALL USING (auth.uid() = user_id);

-- Coding platforms policies
CREATE POLICY "Users can view all coding platforms" ON coding_platforms FOR SELECT USING (true);
CREATE POLICY "Users can manage own coding platforms" ON coding_platforms FOR ALL USING (auth.uid() = user_id);

-- Skills policies
CREATE POLICY "Users can view all skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON skills FOR ALL USING (auth.uid() = user_id);

-- Doubt threads policies
CREATE POLICY "Users can view all doubt threads" ON doubt_threads FOR SELECT USING (true);
CREATE POLICY "Users can create doubt threads" ON doubt_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own doubt threads" ON doubt_threads FOR UPDATE USING (auth.uid() = author_id);

-- Doubt upvotes policies
CREATE POLICY "Users can view all upvotes" ON doubt_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can create upvotes" ON doubt_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own upvotes" ON doubt_upvotes FOR DELETE USING (auth.uid() = user_id);

-- Help sessions policies
CREATE POLICY "Users can view all help sessions" ON help_sessions FOR SELECT USING (true);
CREATE POLICY "Users can create help sessions" ON help_sessions FOR INSERT WITH CHECK (auth.uid() = helper_id);
CREATE POLICY "Users can update sessions they're involved in" ON help_sessions FOR UPDATE USING (auth.uid() = helper_id OR auth.uid() = student_id);

-- Point transactions policies
CREATE POLICY "Users can view all point transactions" ON point_transactions FOR SELECT USING (true);
CREATE POLICY "System can insert point transactions" ON point_transactions FOR INSERT WITH CHECK (true);

-- Create function to award points
CREATE OR REPLACE FUNCTION award_points(user_id UUID, points_to_add INTEGER, description TEXT)
RETURNS void AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (user_id, points_to_add, 'earned', description);
  
  -- Update user's total points
  UPDATE profiles 
  SET total_points = COALESCE(total_points, 0) + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, total_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doubt_threads_updated_at BEFORE UPDATE ON doubt_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
