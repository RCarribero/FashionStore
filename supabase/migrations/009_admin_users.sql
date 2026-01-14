-- Admin Users and Roles
-- Creates admin user management for the admin panel

-- Add is_admin column to user_profiles if not exists
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin users
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON user_profiles(is_admin) WHERE is_admin = true;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT is_admin INTO admin_status
    FROM user_profiles
    WHERE id = user_id;
    
    RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant admin access to specific user (run this manually with actual user ID)
-- UPDATE user_profiles SET is_admin = true WHERE id = 'YOUR-USER-UUID';

COMMENT ON COLUMN user_profiles.is_admin IS 'Whether the user has admin access to the dashboard';
