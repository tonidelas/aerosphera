-- Create a function to get like counts for multiple posts at once
CREATE OR REPLACE FUNCTION get_like_counts(post_ids UUID[])
RETURNS TABLE (post_id UUID, like_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.post_id,
    COUNT(l.id)::BIGINT AS like_count
  FROM 
    likes l
  WHERE 
    l.post_id = ANY(post_ids)
  GROUP BY 
    l.post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_like_counts(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_like_counts(UUID[]) TO anon; 