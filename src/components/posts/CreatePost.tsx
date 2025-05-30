import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for createPortal
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
import { getBoards } from '../../utils/boardApi';
import { Board } from '../../types/board';
import { useSearchParams } from 'react-router-dom';

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
  padding: 20px;
  box-sizing: border-box;
  
  @media (max-width: 480px) {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
`;

const SearchContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow: hidden;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 95%;
    padding: 20px;
    max-height: 80vh;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    padding: 16px;
    max-height: 90vh;
    border-radius: 8px;
    margin: 0;
    min-height: auto;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 20px;
  
  @media (max-width: 480px) {
    margin-bottom: 15px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 15px 20px;
  border-radius: 30px;
  border: 2px solid #52A5D8;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 15px rgba(52, 165, 216, 0.2);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #1D6BA7;
    box-shadow: 0 4px 20px rgba(29, 107, 167, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 12px 18px;
    font-size: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 10px 16px;
    font-size: 0.95rem;
    border-radius: 25px;
  }
`;

const SearchResults = styled.div`
  position: relative;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 100;
  margin-top: 10px;
  
  @media (max-width: 480px) {
    max-height: 250px;
    border-radius: 12px;
  }
`;

const ResultItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f7;
  }
  
  @media (max-width: 480px) {
    padding: 12px 15px;
  }
`;

const TrackInfo = styled.div`
  margin-left: 15px;
  
  @media (max-width: 480px) {
    margin-left: 12px;
  }
`;

const TrackName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const ArtistName = styled.div`
  color: #666;
  font-size: 0.95rem;
  margin-top: 3px;
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
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
  
  @media (max-width: 768px) {
    padding: 8px;
    gap: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 8px 6px;
    gap: 8px;
    border-radius: 6px;
  }
`;

const AlbumCover = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 5px;
  object-fit: cover;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    border-radius: 4px;
  }
`;

const SongInfo = styled.div`
  flex: 1;
  min-width: 0; /* Prevent flex item from overflowing */
  
  @media (max-width: 480px) {
    min-width: 0;
  }
`;

const SongTitle = styled.h4`
  margin: 0 0 3px 0;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95em;
  
  @media (max-width: 480px) {
    font-size: 0.9em;
    margin-bottom: 2px;
  }
`;

// Component for displaying selected track preview
const SelectedTrackPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(52, 165, 216, 0.1);
  border: 1px solid rgba(52, 165, 216, 0.3);
  border-radius: 8px;
  margin: 12px 0;
  
  @media (max-width: 768px) {
    padding: 10px;
    gap: 8px;
    margin: 10px 0;
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    gap: 8px;
    margin: 8px 0;
    border-radius: 6px;
  }
`;

const RemoveTrackButton = styled.button`
  background: none;
  border: none;
  color: #ff4757;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px;
  border-radius: 50%;
  transition: background 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 71, 87, 0.1);
  }
  
  @media (max-width: 480px) {
    font-size: 1.1em;
    padding: 4px;
  }
`;

const BoardSelectContainer = styled.div`
  margin: 12px 0;
`;

const BoardSelectLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
`;

const BoardSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  option {
    padding: 8px;
  }
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
  
  @media (max-width: 480px) {
    gap: 6px;
    flex-wrap: wrap;
  }
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
  flex-shrink: 0;
  
  &:hover {
    transform: scale(1.1);
  }
  
  @media (max-width: 480px) {
    width: 25px;
    height: 25px;
    border-radius: 4px;
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

const ControlsContainer = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const BackgroundSelector = styled.div`
  flex: 1;
  min-width: 200px;
  
  @media (max-width: 480px) {
    min-width: auto;
    width: 100%;
  }
`;

const BackgroundLabel = styled.small`
  color: #666;
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const AddSongButton = styled(AquaButton)`
  padding: 6px 12px;
  font-size: 0.9em;
  height: auto;
  margin-top: 10px;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    width: 100%;
    margin-top: 0;
    padding: 10px 16px;
    font-size: 0.9rem;
  }
`;

const SearchModalHeader = styled.h3`
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  color: #333;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
    margin-bottom: 12px;
    text-align: center;
  }
`;

const SearchButton = styled(AquaButton)`
  min-width: 80px;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    width: 100%;
    min-width: auto;
  }
`;

const SearchModalFooter = styled.div`
  text-align: right;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    text-align: center;
    margin-top: 12px;
    padding-top: 12px;
  }
`;

const CancelButton = styled(AquaButton)`
  background: #eee;
  color: #333;
  padding: 8px 16px;
  
  @media (max-width: 480px) {
    width: 100%;
    padding: 10px 16px;
  }
`;

interface CreatePostProps {
  onPostCreated: () => void;
  defaultBoardId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, defaultBoardId }) => {
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
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [searchParams] = useSearchParams();

  // Fetch boards on component mount
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const boardsData = await getBoards();
        setBoards(boardsData);
        
        // Check if there's a defaultBoardId prop
        if (defaultBoardId) {
          setSelectedBoardId(defaultBoardId);
        } else {
          // Check if there's a board parameter in the URL
          const boardSlug = searchParams.get('board');
          if (boardSlug) {
            const board = boardsData.find(b => b.slug === boardSlug);
            if (board) {
              setSelectedBoardId(board.id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching boards:', error);
      }
    };

    fetchBoards();
  }, [searchParams, defaultBoardId]);

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
            board_id: selectedBoardId || null,
            music_track_id: selectedTrack ? selectedTrack.id : null,
            music_track_info: selectedTrack ? selectedTrack : null,
            youtube_video_url: detectedYoutubeUrl
          }
        ]);

      if (error) throw error;

      editorRef.current.reset();
      setSelectedTrack(null);
      setSelectedBackground(CARD_BACKGROUNDS[0]);
      setSelectedBoardId('');
      
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

        {/* Board Selection */}
        <BoardSelectContainer>
          <BoardSelectLabel htmlFor="board-select">
            Post to Sphera (Optional)
          </BoardSelectLabel>
          <BoardSelect
            id="board-select"
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
          >
            <option value="">General Feed</option>
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </BoardSelect>
        </BoardSelectContainer>

        <ControlsContainer>
          <BackgroundSelector>
            <BackgroundLabel>Choose background:</BackgroundLabel>
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
          </BackgroundSelector>
          {/* Button to add song */}
          <AddSongButton
            type="button" // Important: Prevent form submission
            onClick={() => setShowSongSearch(true)}
            disabled={isSubmitting || !!selectedTrack} // Disable if already selected
          >
             {selectedTrack ? 'Song Added' : 'Add Song Snippet'}
          </AddSongButton>
        </ControlsContainer>

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
      {showSongSearch && ReactDOM.createPortal((
        <SearchModal>
          <SearchContent>
            <SearchModalHeader>Add a song to your post</SearchModalHeader>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="Search Deezer (artist or title)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMusic(searchQuery)}
              />
              <SearchButton
                onClick={() => searchMusic(searchQuery)}
                disabled={isSearching}
              >
                {isSearching ? '...' : 'Search'}
              </SearchButton>
            </SearchContainer>
            <SearchResults>
              {renderSearchResults()}
            </SearchResults>
            <SearchModalFooter>
              <CancelButton
                onClick={() => { setShowSongSearch(false); setSearchQuery(''); setSearchResults([]); }}
              >
                Cancel
              </CancelButton>
            </SearchModalFooter>
          </SearchContent>
        </SearchModal>
      ), document.body)}
    </CreatePostContainer>
  );
};

export default CreatePost; 