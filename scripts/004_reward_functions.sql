-- Function to award points to users
CREATE OR REPLACE FUNCTION award_points(
  user_id UUID,
  points_to_add INTEGER,
  description TEXT DEFAULT 'Points awarded'
)
RETURNS VOID AS $$
BEGIN
  -- Update user's total points
  UPDATE profiles 
  SET points = points + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Record the transaction
  INSERT INTO point_transactions (
    user_id,
    type,
    points,
    description,
    created_at
  ) VALUES (
    user_id,
    'upvote',
    points_to_add,
    description,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to deduct points (for redemptions)
CREATE OR REPLACE FUNCTION deduct_points(
  user_id UUID,
  points_to_deduct INTEGER,
  description TEXT DEFAULT 'Points redeemed'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_points INTEGER;
BEGIN
  -- Get current points
  SELECT points INTO current_points
  FROM profiles
  WHERE id = user_id;
  
  -- Check if user has enough points
  IF current_points < points_to_deduct THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct points
  UPDATE profiles 
  SET points = points - points_to_deduct,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Record the transaction
  INSERT INTO point_transactions (
    user_id,
    type,
    points,
    description,
    created_at
  ) VALUES (
    user_id,
    'redemption',
    -points_to_deduct,
    description,
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's point balance
CREATE OR REPLACE FUNCTION get_user_points(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_points INTEGER;
BEGIN
  SELECT points INTO user_points
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_points, 0);
END;
$$ LANGUAGE plpgsql;
