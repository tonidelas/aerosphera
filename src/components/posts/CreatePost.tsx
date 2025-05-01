import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import { uploadImage } from '../../utils/cloudinaryUtils';
import SimpleEditor, { SimpleEditorHandle } from '../common/SimpleEditor';

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

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(CARD_BACKGROUNDS[0]);
  const editorRef = useRef<SimpleEditorHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;
    const { html, raw } = editorRef.current.getContent();
    const image = editorRef.current.getImage();
    if (!raw.trim() && !image) return;

    setIsSubmitting(true);
    try {
      const user = supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const { error } = await supabase
        .from('posts')
        .insert([
          {
            content: html,
            image_url: imageUrl,
            background: selectedBackground,
            user_id: (await user).data.user?.id
          }
        ]);

      if (error) throw error;

      editorRef.current.reset();
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreatePostContainer>
      <form onSubmit={handleSubmit}>
        <SimpleEditor ref={editorRef} placeholder="What's on your mind?" />
        <div style={{ marginTop: '10px' }}>
          <small style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Choose background color:</small>
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
        <ButtonContainer>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </ButtonContainer>
      </form>
    </CreatePostContainer>
  );
};

export default CreatePost; 