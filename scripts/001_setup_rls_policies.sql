-- Enable RLS on all tables and create policies

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Work experience table policies
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_experience_select_own" ON work_experience
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "work_experience_insert_own" ON work_experience
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "work_experience_update_own" ON work_experience
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "work_experience_delete_own" ON work_experience
  FOR DELETE USING (auth.uid() = user_id);

-- Coding platforms table policies
ALTER TABLE coding_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coding_platforms_select_own" ON coding_platforms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "coding_platforms_insert_own" ON coding_platforms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coding_platforms_update_own" ON coding_platforms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "coding_platforms_delete_own" ON coding_platforms
  FOR DELETE USING (auth.uid() = user_id);

-- Skills table policies
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_select_own" ON skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "skills_insert_own" ON skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "skills_update_own" ON skills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "skills_delete_own" ON skills
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, branch, year, semester, total_points, total_upvotes)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'branch', ''),
    COALESCE((new.raw_user_meta_data ->> 'year')::integer, 1),
    COALESCE((new.raw_user_meta_data ->> 'semester')::integer, 1),
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
