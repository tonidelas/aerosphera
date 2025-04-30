import React from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import { Heart, HeartFill } from 'react-bootstrap-icons';

const PostContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
`;

const Username = styled.span`
  font-weight: bold;
`;

const PostContent = styled.div`
  margin-bottom: 12px;
`;

const PostImage = styled.img`
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
`;

interface LikeButtonProps {
  $liked: boolean;
}

const LikeButton = styled.button<LikeButtonProps>`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.$liked ? '#ff4757' : '#333'};
  
  &:hover {
    color: #ff4757;
  }
`;

interface PostProps {
  id: string;
  content: string;
  image_url: string | null;
  user_id: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  is_liked: boolean;
  onLike: (postId: string) => void;
}

const Post: React.FC<PostProps> = ({
  id,
  content,
  image_url,
  username,
  avatar_url,
  likes_count,
  is_liked,
  onLike
}) => {
  return (
    <PostContainer>
      <PostHeader>
        <Avatar 
          src={avatar_url || 'https://via.placeholder.com/40'} 
          alt={username}
        />
        <Username>{username}</Username>
      </PostHeader>
      
      <PostContent>{content}</PostContent>
      
      {image_url && <PostImage src={image_url} alt="Post content" />}
      
      <LikeButton 
        $liked={is_liked}
        onClick={() => onLike(id)}
      >
        {is_liked ? <HeartFill /> : <Heart />}
        <span>{likes_count}</span>
      </LikeButton>
    </PostContainer>
  );
};

export default Post; 