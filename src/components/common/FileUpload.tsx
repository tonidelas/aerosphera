import React, { useState, useRef } from 'react';
import styled from 'styled-components';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  currentUrl?: string;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label: string;
  helperText?: string;
}

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UploadArea = styled.div<{ isDragOver: boolean }>`
  border: 2px dashed ${props => props.isDragOver ? '#64ffda' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background: ${props => props.isDragOver ? 'rgba(100, 255, 218, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #64ffda;
    background: rgba(100, 255, 218, 0.1);
  }
`;

const UploadText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
`;

const HiddenInput = styled.input`
  display: none;
`;

const PreviewContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const PreviewImage = styled.img`
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const RemoveButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff5252;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: #d32f2f;
  }
`;

const ErrorText = styled.div`
  color: #ff5252;
  font-size: 0.85rem;
`;

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  currentUrl,
  acceptedTypes = "image/*",
  maxSizeMB = 5,
  label,
  helperText
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    
    return null;
  };

  const handleFileSelect = (file: File | null) => {
    setError(null);
    
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(currentUrl || null);
      onFileSelect(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <UploadContainer>
      <UploadArea
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <UploadText>
          {selectedFile ? selectedFile.name : `Click to upload ${label.toLowerCase()} or drag and drop`}
        </UploadText>
        <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          {helperText || `Supports: ${acceptedTypes} (max ${maxSizeMB}MB)`}
        </div>
        
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleInputChange}
        />
      </UploadArea>

      {error && <ErrorText>{error}</ErrorText>}

      {previewUrl && (
        <PreviewContainer>
          <PreviewImage src={previewUrl} alt="Preview" />
          <RemoveButton onClick={handleRemove} type="button">
            ✕
          </RemoveButton>
        </PreviewContainer>
      )}
    </UploadContainer>
  );
};

export default FileUpload; 