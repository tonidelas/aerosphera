import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect, Suspense, lazy } from 'react';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
// Import only the types, not the actual component
import type { Editor as EditorType } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import '../../styles/rich-editor.css';
import styled from 'styled-components';
import { AquaButton } from './StyledComponents';

// Lazy load the Editor component to fix setState on unmounted component warnings
const Editor = lazy(() => import('react-draft-wysiwyg').then(module => ({ 
  default: module.Editor 
})));

const EditorContainer = styled.div`
  font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--highlight);
  border-radius: 8px;
  color: var(--text);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  backdrop-filter: blur(5px);
  
  .rdw-editor-main {
    padding: 10px;
    min-height: 150px;
    line-height: 1.4;
    background: transparent;
  }
  
  .rdw-editor-toolbar {
    border-bottom: 1px solid rgba(200, 200, 200, 0.5);
    background: linear-gradient(to bottom, #F0F7FF, #E0ECF9);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    margin-bottom: 0;
    padding: 5px;
    display: flex;
    flex-wrap: wrap;
    
    .rdw-option-wrapper {
      background: linear-gradient(to bottom, #FFFFFF, #F0F0F0);
      border: 1px solid #CCCCCC;
      border-radius: 4px;
      
      &:hover {
        box-shadow: 0 1px 3px var(--shadow);
        background: linear-gradient(to bottom, #F0F0F0, #FFFFFF);
      }
      
      &.rdw-option-active {
        background: linear-gradient(to bottom, #D8E8FF, #B8D8FF);
        border-color: #90C8FF;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    }
    
    .rdw-dropdown-wrapper {
      background: linear-gradient(to bottom, #FFFFFF, #F0F0F0);
      border: 1px solid #CCCCCC;
      border-radius: 4px;
      
      &:hover {
        box-shadow: 0 1px 3px var(--shadow);
      }
      
      .rdw-dropdown-optionwrapper {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #CCCCCC;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(5px);
      }
      
      .rdw-dropdownoption-active {
        background: var(--accent);
        color: white;
      }
    }
  }
`;

const ImageUploadContainer = styled.div`
  margin-top: 15px;
  border-top: 1px solid rgba(200, 200, 200, 0.5);
  padding-top: 15px;
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

interface RichTextEditorProps {
  value?: string;
  placeholder?: string;
  onImageChange?: (image: string | null) => void;
}

export interface RichTextEditorHandle {
  getContent: () => { html: string; raw: any };
  getImage: () => string | null;
}

// Loading placeholder component for the editor
const EditorLoading = () => (
  <div style={{ 
    minHeight: '200px', 
    border: '1px solid #ccc', 
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
  }}>
    Loading editor...
  </div>
);

const RichTextEditor = forwardRef<RichTextEditorHandle, Omit<RichTextEditorProps, 'onChange'>>(
  ({ value, placeholder, onImageChange }, ref) => {
    // Use state to track if component is mounted to prevent setState on unmounted component
    const [isMounted, setIsMounted] = useState(false);
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [editorReady, setEditorReady] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Set mounted state when component mounts and set a delay for editor loading
    useEffect(() => {
      setIsMounted(true);
      
      // Delay the editor initialization to prevent warnings
      const timer = setTimeout(() => {
        if (isMounted) {
          setEditorReady(true);
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
        setIsMounted(false);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        const rawContent = convertToRaw(editorState.getCurrentContent());
        const html = stateToHTML(editorState.getCurrentContent());
        return { html, raw: rawContent };
      },
      getImage: () => selectedImage,
    }), [editorState, selectedImage]);

    const handleEditorChange = (state: EditorState) => {
      if (isMounted) {
        setEditorState(state);
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

    const uploadImageCallback = (file: File): Promise<{ data: { link: string } }> => {
      return new Promise((resolve, reject) => {
        if (!isMounted) {
          reject(new Error('Component not mounted'));
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          if (isMounted) {
            resolve({ data: { link: reader.result as string } });
          } else {
            reject(new Error('Component not mounted'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    // If the component isn't mounted yet, return a loading state
    if (!isMounted) {
      return <EditorLoading />;
    }

    return (
      <>
        <EditorContainer>
          {editorReady ? (
            <Suspense fallback={<EditorLoading />}>
              <Editor
                editorState={editorState}
                onEditorStateChange={handleEditorChange}
                wrapperClassName="aqua-editor-wrapper"
                editorClassName="aqua-editor"
                toolbarClassName="aqua-editor-toolbar"
                placeholder={placeholder || "What's on your mind?"}
                toolbar={{
                  options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'image', 'emoji', 'history'],
                  inline: {
                    options: ['bold', 'italic', 'underline', 'strikethrough'],
                  },
                  blockType: {
                    options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                  },
                  list: {
                    options: ['unordered', 'ordered'],
                  },
                  image: {
                    uploadCallback: uploadImageCallback,
                    alt: { present: true, mandatory: false },
                    previewImage: true,
                  },
                }}
              />
            </Suspense>
          ) : (
            <EditorLoading />
          )}
        </EditorContainer>
        
        <ImageUploadContainer>
          <UploadButton onClick={handleOpenFileDialog}>
            Upload Photo
          </UploadButton>
          <UploadLabel>or drag and drop images into the editor</UploadLabel>
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
      </>
    );
  }
);

export default RichTextEditor; 