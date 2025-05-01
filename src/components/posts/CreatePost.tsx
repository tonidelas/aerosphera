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

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 12px;
  resize: vertical;
  font-family: inherit;
  
  @media (max-width: 480px) {
    min-height: 80px;
    padding: 10px;
    font-size: 0.95rem;
  }
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 300px;
  margin-bottom: 12px;
  border-radius: 4px;
  
  @media (max-width: 480px) {
    max-height: 200px;
    margin-bottom: 10px;
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

const FileInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  
  &:hover {
    background: #5a6268;
  }
  
  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 0.9rem;
    margin-right: 0;
  }
`;

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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