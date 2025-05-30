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
  border: 3px dashed ${props => props.isDragOver ? '#52A5D8' : '#52A5D8'};
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  background: ${props => props.isDragOver 
    ? 'linear-gradient(135deg, rgba(52, 165, 216, 0.15), rgba(29, 107, 167, 0.1))' 
    : 'linear-gradient(135deg, rgba(52, 165, 216, 0.08), rgba(29, 107, 167, 0.05))'
  };
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 12px rgba(52, 165, 216, 0.15);
  
  @media (max-width: 768px) {
    padding: 24px 16px;
    border-radius: 10px;
    border-width: 2px;
  }
  
  @media (max-width: 480px) {
    padding: 20px 12px;
    border-radius: 8px;
  }
  
  &:hover {
    border-color: #1D6BA7;
    background: linear-gradient(135deg, rgba(52, 165, 216, 0.15), rgba(29, 107, 167, 0.1));
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 165, 216, 0.2);
    
    @media (max-width: 480px) {
      transform: translateY(-1px);
    }
  }
  
  &::before {
    content: '📁';
    display: block;
    font-size: 2.5rem;
    margin-bottom: 12px;
    opacity: 0.7;
    
    @media (max-width: 768px) {
      font-size: 2rem;
      margin-bottom: 10px;
    }
    
    @media (max-width: 480px) {
      font-size: 1.8rem;
      margin-bottom: 8px;
    }
  }
`;

const UploadText = styled.div`
  color: #1D6BA7;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.95rem;
    margin-bottom: 6px;
  }
`;

const UploadSubtext = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-top: 8px;
  opacity: 0.8;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    margin-top: 6px;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const PreviewContainer = styled.div`
  position: relative;
  display: inline-block;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(52, 165, 216, 0.3);
`;

const PreviewImage = styled.img`
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
  width: 100%;
  height: auto;
  
  @media (max-width: 768px) {
    max-width: 180px;
    max-height: 135px;
  }
  
  @media (max-width: 480px) {
    max-width: 150px;
    max-height: 110px;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #ff5252, #d32f2f);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #d32f2f, #b71c1c);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const ErrorText = styled.div`
  color: #d32f2f;
  font-size: 0.9rem;
  background: rgba(211, 47, 47, 0.1);
  border: 1px solid rgba(211, 47, 47, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  text-align: center;
  font-weight: 500;
`;

const SelectedFileIndicator = styled.div`
  background: linear-gradient(135deg, #4caf50, #388e3c);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 6px 14px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    padding: 6px 12px;
    border-radius: 16px;
  }
  
  &::before {
    content: '✓';
  }
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
        <UploadSubtext>
          {helperText || `Supports: ${acceptedTypes} (max ${maxSizeMB}MB)`}
        </UploadSubtext>
        
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleInputChange}
        />
      </UploadArea>

      {selectedFile && !error && (
        <SelectedFileIndicator>
          File selected: {selectedFile.name}
        </SelectedFileIndicator>
      )}

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