import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import styled from 'styled-components';
import { AquaButton } from './StyledComponents';

const EditorContainer = styled.div`
  font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  color: var(--text);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  backdrop-filter: blur(5px);
  margin-bottom: 15px;
  border: 1px solid var(--highlight);
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  resize: vertical;
  background: transparent;
  font-size: 16px;
  line-height: 1.4;
  color: var(--text);
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }
`;

const Toolbar = styled.div`
  padding: 8px;
  border-bottom: 1px solid var(--highlight);
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  background: linear-gradient(to bottom, #F0F7FF, #E0ECF9);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

const ToolbarButton = styled.button`
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--highlight);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }
  
  &:active {
    background: var(--accent);
    color: white;
  }
`;

const ImageUploadContainer = styled.div`
  margin-top: 10px;
  padding: 10px;
  border-top: 1px solid var(--highlight);
`;

const FileInput = styled.input`
  display: none;
`;

const ImagePreview = styled.div`
  margin-top: 15px;
  width: 100%;
  
  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    box-shadow: 0 2px 8px var(--shadow);
  }
`;

const RemoveButton = styled(AquaButton)`
  margin-top: 10px;
  font-size: 14px;
  padding: 5px 10px;
  background: linear-gradient(to bottom, #FF9999, #FF5555);
  border-color: #FF3333;
  
  &:hover {
    background: linear-gradient(to bottom, #FF5555, #FF9999);
  }
`;

const UploadStatus = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: var(--accent);
`;

export interface SimpleEditorHandle {
  getContent: () => { html: string; raw: any };
  getImage: () => File | null;
  reset: () => void;
}

interface SimpleEditorProps {
  placeholder?: string;
}

const SimpleEditor = forwardRef<SimpleEditorHandle, SimpleEditorProps>(
  ({ placeholder }, ref) => {
    const [content, setContent] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useImperativeHandle(ref, () => ({
      getContent: () => {
        return { 
          html: content.replace(/\n/g, '<br />'), 
          raw: content 
        };
      },
      getImage: () => selectedImage,
      reset: () => {
        setContent('');
        setSelectedImage(null);
        setImagePreview(null);
        setUploadStatus(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }), [content, selectedImage]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('Error: Image too large (max 10MB)');
        return;
      }

      try {
        setUploadStatus('Processing image...');
        setSelectedImage(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setUploadStatus(null);
        };
        reader.onerror = () => {
          setUploadStatus('Error loading image. Please try again.');
          setSelectedImage(null);
          setImagePreview(null);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error handling image upload:', error);
        setUploadStatus('Error uploading image. Please try another.');
        setSelectedImage(null);
        setImagePreview(null);
      }
    };

    const handleOpenFileDialog = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    return (
      <EditorContainer>
        <Toolbar>
          <ToolbarButton type="button" onClick={handleOpenFileDialog}>
            Add Image
          </ToolbarButton>
        </Toolbar>
        
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || "What's on your mind?"}
        />
        
        <FileInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        
        {uploadStatus && (
          <UploadStatus>{uploadStatus}</UploadStatus>
        )}
        
        {imagePreview && (
          <ImageUploadContainer>
            <ImagePreview>
              <img src={imagePreview} alt="Preview" />
            </ImagePreview>
            <RemoveButton onClick={() => { 
              setSelectedImage(null); 
              setImagePreview(null);
              setUploadStatus(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}>
              Remove Image
            </RemoveButton>
          </ImageUploadContainer>
        )}
      </EditorContainer>
    );
  }
);

export default SimpleEditor; 