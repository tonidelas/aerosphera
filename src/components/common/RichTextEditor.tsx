import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/quill-custom.css';
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
  
  .quill {
    background: transparent;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .ql-toolbar {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background: linear-gradient(to bottom, #F0F7FF, #E0ECF9);
    border: 1px solid var(--highlight);
    border-bottom: 1px solid rgba(200, 200, 200, 0.5);
  }
  
  .ql-container {
    font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: rgba(255, 255, 255, 0.7);
    min-height: 150px;
    border: 1px solid var(--highlight);
    border-top: none;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
  
  .ql-editor {
    min-height: 150px;
    line-height: 1.4;
    
    &::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }
  }
  
  .ql-editor.ql-blank::before {
    font-style: normal;
    color: rgba(0, 0, 0, 0.4);
  }
`;

const ImageUploadContainer = styled.div`
  margin-top: 5px;
  padding-top: 5px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled(AquaButton)`
  margin-right: 10px;
  font-size: 14px;
  padding: 5px 10px;
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

const UploadLabel = styled.span`
  color: #666;
  font-size: 14px;
  margin-top: 8px;
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

const EditorLoading = styled.div`
  min-height: 200px;
  border: 1px solid var(--highlight);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  color: var(--primary);
  font-size: 16px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 2px;
    background: linear-gradient(to right, transparent, var(--accent), transparent);
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

interface RichTextEditorProps {
  value?: string;
  placeholder?: string;
  onImageChange?: (image: string | null) => void;
}

export interface RichTextEditorHandle {
  getContent: () => { html: string; raw: any };
  getImage: () => string | null;
  reset: () => void;
}

// Quill modules and formats configuration
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'link'
];

const RichTextEditor = forwardRef<RichTextEditorHandle, Omit<RichTextEditorProps, 'onChange'>>(
  ({ value, placeholder, onImageChange }, ref) => {
    const [content, setContent] = useState(value || '');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
      setIsMounted(true);
      
      // Simulate loading to ensure editor loads properly
      const timer = setTimeout(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
        setIsMounted(false);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return { 
          html: content, 
          raw: content 
        };
      },
      getImage: () => selectedImage,
      reset: () => {
        if (isMounted) {
          setContent('');
          setSelectedImage(null);
        }
      }
    }), [content, selectedImage, isMounted]);

    const handleChange = (value: string) => {
      if (isMounted) {
        setContent(value);
      }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isMounted) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) {
            setSelectedImage(reader.result as string);
            if (onImageChange) onImageChange(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const handleOpenFileDialog = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    return (
      <>
        {isLoading ? (
          <EditorLoading>
            Preparing your post-it editor...
          </EditorLoading>
        ) : (
          <EditorContainer>
            <ReactQuill 
              theme="snow"
              value={content}
              onChange={handleChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder || "What's on your mind?"}
            />
          </EditorContainer>
        )}
        
        {!isLoading && (
          <ImageUploadContainer>
            <UploadButton onClick={handleOpenFileDialog}>
              Upload Photo
            </UploadButton>
            <UploadLabel>Add a photo to your post-it note</UploadLabel>
            <FileInput 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload}
              accept="image/*"
            />
            
            {selectedImage && (
              <ImagePreview>
                <img src={selectedImage} alt="Preview" />
                <RemoveButton onClick={() => { 
                  if (isMounted) {
                    setSelectedImage(null); 
                    if (onImageChange) onImageChange(null);
                  }
                }}>
                  Remove Image
                </RemoveButton>
              </ImagePreview>
            )}
          </ImageUploadContainer>
        )}
      </>
    );
  }
);

export default RichTextEditor; 