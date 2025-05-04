import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import { Heart, HeartFill, ThreeDots } from 'react-bootstrap-icons';
import { AquaButton } from '../common/StyledComponents';
import SimpleEditor, { SimpleEditorHandle } from '../common/SimpleEditor';
import { DeezerTrack, searchDeezerTracks } from '../../utils/deezerClient';
import { getYoutubeVideoId, extractYoutubeUrl } from '../../utils/youtubeUtils';

const PostContainer = styled.div<{ $background?: string }>`
  background: ${ (props: { $background?: string }) => props.$background || 'white'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
  }
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
  
  @media (max-width: 480px) {
    width: 35px;
    height: 35px;
    margin-right: 10px;
  }
`;

const Username = styled.span`
  font-weight: bold;
`;

const PostContent = styled.div`
  margin-bottom: 12px;
  word-break: break-word;
  * {
    word-break: break-word;
  }
  p {
    margin: 0 0 10px 0;
  }

  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;

const PostImage = styled.img`
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
  
  @media (max-width: 768px) {
    max-height: 400px;
  }
  
  @media (max-width: 480px) {
    max-height: 300px;
    margin-bottom: 10px;
  }
`;

const PostMusicContainer = styled.div`
  margin-top: 15px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 12px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const MusicPlayer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AlbumCover = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
`;

const SongInfo = styled.div`
  flex: 1;
  min-width: 0; 
`;

const SongTitle = styled.h4`
  margin: 0 0 4px 0;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9em;
`;

const ArtistName = styled.p`
  margin: 0;
  font-size: 0.8em;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AudioPlayerStyled = styled.audio`
  width: 100%;
  height: 35px; 
  margin-top: 8px;
  &::-webkit-media-controls-panel {
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
  }
  &::-webkit-media-controls-play-button,
  &::-webkit-media-controls-timeline,
  &::-webkit-media-controls-current-time-display,
  &::-webkit-media-controls-time-remaining-display,
  &::-webkit-media-controls-mute-button,
  &::-webkit-media-controls-volume-slider {
    color: #333;
  }
`;

const PostFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  color: ${ (props: LikeButtonProps) => props.$liked ? '#ff4757' : '#333'};
  padding: 5px 10px;
  border-radius: 20px;
  transition: background 0.2s ease;
  
  &:hover {
    color: #ff4757;
    background: rgba(255, 71, 87, 0.1);
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  margin-left: auto;
  padding: 4px 8px;
  font-size: 20px;
  color: #888;
  border-radius: 4px;
  transition: background 0.2s;
  &:hover {
    background: #f0f0f0;
  }
`;

const MenuDropdown = styled.div`
  position: absolute;
  right: 0;
  top: 40px;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 10;
  min-width: 120px;
  padding: 6px 0;
`;

const MenuItem = styled.button`
  width: 100%;
  background: none;
  border: none;
  padding: 10px 16px;
  text-align: left;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  &:hover {
    background: #f5f5f5;
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
  currentUserId: string | null;
  onDelete: () => void;
  onEdit?: (postId: string, newContent: string, newImage: string | null) => void;
  created_at: string;
  background?: string;
  music_track_id?: string;
  music_track_info?: DeezerTrack;
  youtube_video_url?: string | null;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const Post: React.FC<PostProps> = ({
  id,
  content,
  image_url,
  username,
  avatar_url,
  likes_count,
  is_liked,
  onLike,
  user_id,
  currentUserId,
  onDelete,
  onEdit,
  created_at,
  background,
  music_track_id,
  music_track_info,
  youtube_video_url
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [edited, setEdited] = React.useState(false);
  const [editContent, setEditContent] = React.useState(content);
  const [editImage, setEditImage] = React.useState<string | null>(image_url);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const editorRef = React.useRef<any>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [localTrackInfo, setLocalTrackInfo] = React.useState(music_track_info);
  const postAudioRef = React.useRef<HTMLAudioElement>(null);
  const [isPostPlaying, setIsPostPlaying] = React.useState(false);

  const [isLikedState, setIsLikedState] = React.useState(is_liked);
  const [likesCountState, setLikesCountState] = React.useState(likes_count);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(content);
  const [editedImage, setEditedImage] = React.useState<string | null>(image_url);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const editEditorRef = React.useRef<SimpleEditorHandle>(null);

  const isOwner = currentUserId === user_id;
  const defaultAvatar = '/default-avatar.png';

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (localTrackInfo && !localTrackInfo.preview) {
      const refresh = async () => {
        const query = `${localTrackInfo.title} ${localTrackInfo.artist.name}`;
        const results = await searchDeezerTracks(query);
        if (results.length > 0) {
          const match = results.find(track =>
            track.title.toLowerCase() === localTrackInfo.title.toLowerCase() &&
            track.artist.name.toLowerCase() === localTrackInfo.artist.name.toLowerCase()
          ) || results[0];
          setLocalTrackInfo(match);
        }
      };
      refresh();
    }
  }, [localTrackInfo]);

  React.useEffect(() => {
    const handleGlobalAudioPlay = (event: Event) => {
      const customEvent = event as CustomEvent<{ source: string, id?: string }>;
      if (customEvent.detail.source !== 'post' || customEvent.detail.id !== id) {
        postAudioRef.current?.pause();
        setIsPostPlaying(false);
      }
    };

    document.addEventListener('aerofy-audio-play', handleGlobalAudioPlay);

    return () => {
      document.removeEventListener('aerofy-audio-play', handleGlobalAudioPlay);
    };
  }, [id]);

  const handleAudioError = React.useCallback(async () => {
    if (!localTrackInfo) return;
    const query = `${localTrackInfo.title} ${localTrackInfo.artist.name}`;
    const results = await searchDeezerTracks(query);
    if (results.length > 0) {
      const match = results.find(track =>
        track.title.toLowerCase() === localTrackInfo.title.toLowerCase() &&
        track.artist.name.toLowerCase() === localTrackInfo.artist.name.toLowerCase()
      ) || results[0];
      setLocalTrackInfo(match);
    }
  }, [localTrackInfo]);

  const handleEdit = () => {
    setMenuOpen(false);
    setEditing(true);
    setEditContent(content);
    setEditImage(image_url);
  };

  const handleEditCancel = () => {
    setEditing(false);
  };

  const handleEditSave = async () => {
    const newContent = editorRef.current ? editorRef.current.getContent().html : editContent;
    const newImage = editorRef.current ? editorRef.current.getImage() : editImage;
    try {
      // Extract YouTube URL from content if it exists
      const newYoutubeUrl = extractYoutubeUrl(newContent);
      
      const { error } = await supabase
        .from('posts')
        .update({ 
          content: newContent, 
          image_url: newImage, 
          youtube_video_url: newYoutubeUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setEditing(false);
      setEdited(true);
      
      if (onEdit) {
        onEdit(id, newContent, newImage);
      } else {
        onDelete();
      }
    } catch (error) {
      alert('Failed to update post.');
      console.error('Error updating post:', error);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      onDelete();
    } catch (error) {
      alert('Failed to delete post.');
      console.error('Error deleting post:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Use the imported utility, prioritize youtube_video_url field but also check content
  const videoId = youtube_video_url ? getYoutubeVideoId(youtube_video_url) : getYoutubeVideoId(content);

  return (
    <PostContainer $background={background}>
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '32px 24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            minWidth: '300px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '18px' }}>Are you sure you want to delete this post?</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <AquaButton onClick={confirmDelete} style={{ minWidth: '80px' }}>Yes</AquaButton>
              <AquaButton onClick={cancelDelete} style={{ minWidth: '80px', background: '#eee', color: '#333' }}>Cancel</AquaButton>
            </div>
          </div>
        </div>
      )}
      <PostHeader style={{ position: 'relative' }}>
        <Avatar 
          src={avatar_url || 'https://via.placeholder.com/40'} 
          alt={username}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Username>{username}</Username>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#888', fontSize: 13 }}>{formatDate(created_at)}</span>
            {edited && <span style={{ color: '#888', fontSize: 13 }}>(Edited)</span>}
          </div>
        </div>
        {currentUserId && currentUserId === user_id && (
          <div ref={menuRef} style={{ position: 'relative', marginLeft: 'auto' }}>
            <MenuButton onClick={() => setMenuOpen(m => !m)} title="Post options">
              <ThreeDots />
            </MenuButton>
            {menuOpen && (
              <MenuDropdown>
                <MenuItem onClick={handleEdit}>Edit</MenuItem>
                <MenuItem onClick={handleDelete}>Delete</MenuItem>
              </MenuDropdown>
            )}
          </div>
        )}
      </PostHeader>
      
      <PostContent dangerouslySetInnerHTML={{ __html: content }} />
      
      {image_url && !videoId && (
        <PostImage src={image_url} alt="Post image" />
      )}
      
      {/* YouTube Video Embed */}
      {videoId && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', marginBottom: '12px' }}>
          <iframe
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}
      
      {localTrackInfo && (
        <PostMusicContainer>
          <MusicPlayer>
            <AlbumCover
              src={localTrackInfo.album?.cover || '/default-album.png'}
              alt="Album Cover"
            />
            <SongInfo>
              <SongTitle>{localTrackInfo.title}</SongTitle>
              <ArtistName>{localTrackInfo.artist?.name || 'Unknown Artist'}</ArtistName>
              {localTrackInfo.preview ? (
                <AudioPlayerStyled
                  ref={postAudioRef}
                  controls
                  src={localTrackInfo.preview}
                  onError={handleAudioError}
                  onPlay={() => {
                    setIsPostPlaying(true);
                    document.dispatchEvent(new CustomEvent('aerofy-audio-play', { 
                      detail: { source: 'post', id: id } 
                    }));
                  }}
                  onPause={() => setIsPostPlaying(false)}
                  onEnded={() => setIsPostPlaying(false)}
                >
                  Your browser does not support the audio element.
                </AudioPlayerStyled>
              ) : (
                <small style={{ color: '#888', fontSize: '0.75em', display: 'block', marginTop: '5px' }}>
                  Preview not available
                </small>
              )}
            </SongInfo>
          </MusicPlayer>
        </PostMusicContainer>
      )}
      
      {editing && (
        <div style={{ marginTop: 12 }}>
          <SimpleEditor
            ref={editorRef}
            placeholder="Edit your post..."
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <AquaButton onClick={handleEditSave}>Save</AquaButton>
            <AquaButton style={{ background: '#eee', color: '#333' }} onClick={handleEditCancel}>Cancel</AquaButton>
          </div>
        </div>
      )}
      
      <PostFooter>
        <LikeButton 
          $liked={is_liked}
          onClick={() => onLike(id)}
        >
          {is_liked ? <HeartFill /> : <Heart />}
          <span>{likes_count}</span>
        </LikeButton>
      </PostFooter>
    </PostContainer>
  );
};

export default Post; 