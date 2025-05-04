import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import { uploadImage } from '../../utils/cloudinaryUtils';
import SimpleEditor, { SimpleEditorHandle } from '../common/SimpleEditor';
// Import Deezer related utilities and types
import { searchDeezerTracks, DeezerTrack } from '../../utils/deezerClient';
// Import common styled components (assuming they exist and are styled similarly to Profile.tsx)
import {
  AquaButton,
  GlassInput,
} from '../common/StyledComponents';
import { extractYoutubeUrl, formatYoutubeLinks } from '../../utils/youtubeUtils';

// Reuse or adapt styled components from Profile.tsx or create new ones
// Define Modal and Search components locally
const SearchModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const SearchContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 480px) {
    width: 95%;
    padding: 16px;
    max-height: 80vh;
  }
`;

const SearchInput = styled(GlassInput)`
  width: 100%;
  margin-bottom: 20px;
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 5px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    max-height: 50vh;
    gap: 8px;
  }
`;

const SongResult = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    gap: 8px;
  }
`;

const AlbumCover = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 5px;
  object-fit: cover;
`;

const SongInfo = styled.div`
  flex: 1;
  min-width: 0; /* Prevent flex item from overflowing */
`;

const SongTitle = styled.h4`
  margin: 0 0 3px 0;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95em;
`;

const ArtistName = styled.p`
  margin: 0;
  font-size: 0.85em;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Component for displaying selected track preview
const SelectedTrackPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  margin-top: 10px;
`;

const RemoveTrackButton = styled.button`
  background: none;
  border: none;
  color: #ff4757;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px;
`;

const CreatePostContainer = styled.div`
  background: white;
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

const ButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 0.9rem;
    margin-right: 0;
  }
`;

// Aqua-inspired colors
const CARD_BACKGROUNDS = [
  'linear-gradient(135deg, #F5F9FF, #E4EFF7)',
  'linear-gradient(135deg, #F0F7FF, #E0ECF9)',
  'linear-gradient(135deg, #F5FFFA, #E4F9EE)',
  'linear-gradient(135deg, #FFF5F5, #F9E4E4)',
  'linear-gradient(135deg, #F5F0FF, #EEE4F9)',
];

const BackgroundOptions = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
`;

const BackgroundOption = styled.div<{ $bg: string; $selected: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 5px;
  background: ${props => props.$bg};
  cursor: pointer;
  border: ${props => props.$selected ? '2px solid #007bff' : '1px solid #ddd'};
  box-shadow: ${props => props.$selected ? '0 0 5px #007bff' : 'none'};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const StatusMessage = styled.div<{ $isError?: boolean }>`
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  background: ${props => props.$isError ? '#ffeeee' : '#eeffee'};
  color: ${props => props.$isError ? '#cc0000' : '#007700'};
  font-size: 14px;
`;

const ProgressBar = styled.div`
  margin-top: 10px;
  height: 8px;
  border-radius: 4px;
  background-color: #e0e0e0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  transition: width 0.3s ease;
`;

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(CARD_BACKGROUNDS[0]);
  const [statusMessage, setStatusMessage] = useState<{ message: string; isError: boolean } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const editorRef = useRef<SimpleEditorHandle>(null);
  const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null);
  const [showSongSearch, setShowSongSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DeezerTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchMusic = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchDeezerTracks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching Deezer:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = (track: DeezerTrack) => {
    setSelectedTrack(track);
    setShowSongSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return <p style={{ textAlign: 'center', color: '#666' }}>Searching...</p>;
    }
    if (searchResults.length === 0 && searchQuery && !isSearching) {
      return <p style={{ textAlign: 'center', color: '#666' }}>No tracks found.</p>;
    }
    return searchResults.map(track => (
      <SongResult
        key={track.id}
        onClick={() => handleSelectTrack(track)}
      >
        <AlbumCover
          src={track.album.cover || '/default-album.png'}
          alt="Album Cover"
        />
        <SongInfo>
          <SongTitle>{track.title}</SongTitle>
          <ArtistName>{track.artist.name}</ArtistName>
        </SongInfo>
      </SongResult>
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;

    const { html, raw } = editorRef.current.getContent();
    const imageUrl = editorRef.current.getImage();
    
    // Format YouTube links in post content
    const formattedHtml = formatYoutubeLinks(html);
    
    // Detect if content contains a YouTube URL
    const detectedYoutubeUrl = extractYoutubeUrl(formattedHtml);
    
    console.log('Post content debug:', { 
      originalHtml: html,
      formattedHtml, 
      rawBlocks: raw?.blocks, 
      imageUrl, 
      hasTrack: !!selectedTrack,
      youtubeUrl: detectedYoutubeUrl 
    });

    // Improved check for empty post content
    // Check for text content in html or raw blocks
    const hasText = formattedHtml && formattedHtml.trim() !== '' && formattedHtml !== '<p></p>' && formattedHtml !== '<p><br></p>';
    const hasImage = !!imageUrl;
    const hasTrack = !!selectedTrack;
    
    console.log('Content validation:', { hasText, hasImage, hasTrack });

    if (!hasText && !hasImage && !hasTrack) {
      console.log('Attempted to create an empty post.');
      return; // Prevent submission
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setUploadProgress(null);
    
    try {
      const userResult = await supabase.auth.getUser(); // Changed to await
      if (!userResult.data.user) throw new Error('Not authenticated');
      const userId = userResult.data.user.id;

      let imageUrlResult = null;
      if (imageUrl) {
        try {
          // Handle File objects (which is what SimpleEditor.getImage() returns)
          if (imageUrl instanceof File) {
            setStatusMessage({ message: 'Uploading image...', isError: false });
            // Use the progress callback
            imageUrlResult = await uploadImage(
              imageUrl, 
              (progress) => {
                setUploadProgress(progress);
              }
            );
            setUploadProgress(100); // Ensure we show 100% when done
          } else {
            console.error('Invalid image format:', typeof imageUrl);
            setStatusMessage({ 
              message: 'Invalid image format. Your post will be created without the image.', 
              isError: true 
            });
          }
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          setStatusMessage({ 
            message: 'Failed to upload image. Your post will be created without the image.', 
            isError: true 
          });
          // Continue with the post creation without the image
          imageUrlResult = null;
        } finally {
          // Clear progress after a short delay
          setTimeout(() => setUploadProgress(null), 1000);
        }
      }

      setStatusMessage({ message: 'Creating post...', isError: false });
      const { error } = await supabase
        .from('posts')
        .insert([
          {
            content: formattedHtml, // Use the formatted HTML with highlighted YouTube links
            image_url: imageUrlResult,
            background: selectedBackground,
            user_id: userId,
            music_track_id: selectedTrack ? selectedTrack.id : null,
            music_track_info: selectedTrack ? selectedTrack : null,
            youtube_video_url: detectedYoutubeUrl
          }
        ]);

      if (error) throw error;

      editorRef.current.reset();
      setSelectedTrack(null);
      setSelectedBackground(CARD_BACKGROUNDS[0]);
      
      setStatusMessage({ message: 'Post created successfully!', isError: false });
      setTimeout(() => setStatusMessage(null), 3000);
      onPostCreated();
    } catch (error: any) {
      console.error('Error creating post:', error);
      setStatusMessage({ message: error.message || 'Failed to create post. Please try again.', isError: true });
      setUploadProgress(null);
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreatePostContainer>
      <form onSubmit={handleSubmit}>
        <SimpleEditor ref={editorRef} placeholder="What's on your mind? Paste a YouTube link to embed it!" />
        
        {/* Selected Track Preview */}
        {selectedTrack && (
          <SelectedTrackPreview>
            <AlbumCover src={selectedTrack.album.cover || '/default-album.png'} alt="Album Cover" />
            <SongInfo>
              <SongTitle>{selectedTrack.title}</SongTitle>
              <ArtistName>{selectedTrack.artist.name}</ArtistName>
            </SongInfo>
            <RemoveTrackButton type="button" onClick={() => setSelectedTrack(null)} title="Remove song">
              ❌
            </RemoveTrackButton>
          </SelectedTrackPreview>
        )}

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <small style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Choose background:</small>
            <BackgroundOptions>
              {CARD_BACKGROUNDS.map((bg, index) => (
                <BackgroundOption
                  key={index}
                  $bg={bg}
                  $selected={selectedBackground === bg}
                  onClick={() => setSelectedBackground(bg)}
                />
              ))}
            </BackgroundOptions>
          </div>
          {/* Button to add song */}
          <AquaButton
            type="button" // Important: Prevent form submission
            onClick={() => setShowSongSearch(true)}
            disabled={isSubmitting || !!selectedTrack} // Disable if already selected
            style={{ padding: '6px 12px', fontSize: '0.9em', height: 'auto', marginTop: '10px' }}
          >
             {selectedTrack ? 'Song Added' : 'Add Song Snippet'}
          </AquaButton>
        </div>

        {uploadProgress !== null && (
          <ProgressBar>
            <ProgressFill $progress={uploadProgress} />
          </ProgressBar>
        )}

        <ButtonContainer style={{ marginTop: '15px', justifyContent: 'flex-end' }}> {/* Align post button to right */}
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </ButtonContainer>

        {statusMessage && (
          <StatusMessage $isError={statusMessage.isError}>
            {statusMessage.message}
          </StatusMessage>
        )}
      </form>

      {/* Song Search Modal */}
      {showSongSearch && (
        <SearchModal>
          <SearchContent>
            <h3>Add a song to your post</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <SearchInput
                type="text"
                placeholder="Search Deezer (artist or title)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMusic(searchQuery)}
              />
              <AquaButton
                onClick={() => searchMusic(searchQuery)}
                disabled={isSearching}
                style={{ minWidth: '80px' }}
              >
                {isSearching ? '...' : 'Search'}
              </AquaButton>
            </div>
            <SearchResults>
              {renderSearchResults()}
            </SearchResults>
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <AquaButton
                onClick={() => { setShowSongSearch(false); setSearchQuery(''); setSearchResults([]); }}
                style={{ background: '#eee', color: '#333' }}
              >
                Cancel
              </AquaButton>
            </div>
          </SearchContent>
        </SearchModal>
      )}
    </CreatePostContainer>
  );
};

export default CreatePost; 