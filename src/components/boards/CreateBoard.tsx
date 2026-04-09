import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createBoard, generateSlug } from '../../utils/boardApi';
import { uploadFile } from '../../utils/fileUpload';
import FileUpload from '../common/FileUpload';
import { CreateBoardInput } from '../../types/board';

const FormContainer = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 20px;
  
  @media (max-width: 768px) {
    padding: 24px 16px;
  }
  
  @media (max-width: 480px) {
    padding: 20px 12px;
  }
`;

const FormTitle = styled.h1`
  color: var(--text);
  text-align: center;
  margin-bottom: 16px;
  font-size: 3rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    font-size: 2.4rem;
    margin-bottom: 14px;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
    margin-bottom: 12px;
  }
`;

const FormSubtitle = styled.p`
  color: #666;
  text-align: center;
  margin-bottom: 3rem;
  font-size: 1.2rem;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 2rem;
    padding: 0 10px;
  }
`;

const Form = styled.form`
  background: rgba(245, 245, 247, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(29, 107, 167, 0.15);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 32px;
    border-radius: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 24px;
    border-radius: 16px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #52A5D8, #1D6BA7);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 28px;
  
  @media (max-width: 768px) {
    margin-bottom: 24px;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 20px;
  }
`;

const Label = styled.label`
  display: block;
  color: var(--text);
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 10px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.95rem;
    margin-bottom: 8px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid rgba(52, 165, 216, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: var(--text);
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 14px 18px;
    font-size: 15px;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 12px 16px;
    font-size: 16px;
    border-radius: 8px;
  }

  &:focus {
    outline: none;
    border-color: #52A5D8;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 0 3px rgba(52, 165, 216, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid rgba(52, 165, 216, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: var(--text);
  font-size: 16px;
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
  box-sizing: border-box;
  font-family: inherit;

  @media (max-width: 768px) {
    padding: 14px 18px;
    font-size: 15px;
    min-height: 100px;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 12px 16px;
    font-size: 16px;
    min-height: 90px;
    border-radius: 8px;
  }

  &:focus {
    outline: none;
    border-color: #52A5D8;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 0 3px rgba(52, 165, 216, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`;

const SlugPreview = styled.div`
  margin-top: 12px;
  font-size: 0.95rem;
  color: #1D6BA7;
  background: rgba(52, 165, 216, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(52, 165, 216, 0.3);
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 6px 14px;
    margin-top: 10px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 6px 12px;
    margin-top: 8px;
    border-radius: 6px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 40px;
  
  @media (max-width: 768px) {
    gap: 12px;
    margin-top: 32px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column-reverse;
    gap: 12px;
    margin-top: 24px;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 16px 32px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  min-height: 52px;

  @media (max-width: 768px) {
    padding: 14px 28px;
    font-size: 1rem;
    border-radius: 40px;
    min-height: 48px;
  }
  
  @media (max-width: 480px) {
    padding: 16px 24px;
    font-size: 0.95rem;
    border-radius: 26px;
    width: 100%;
    min-height: 52px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  ${props => props.variant === 'primary' ? `
    background: rgba(52, 165, 216, 0.2);
    border-color: #52A5D8;
    color: #1D6BA7;
    box-shadow: 0 4px 15px rgba(52, 165, 216, 0.2);

    &:hover:not(:disabled) {
      background: rgba(52, 165, 216, 0.3);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(52, 165, 216, 0.3);
      
      @media (max-width: 480px) {
        transform: translateY(-2px);
      }
    }
  ` : `
    background: rgba(255, 255, 255, 0.6);
    border-color: rgba(52, 165, 216, 0.3);
    color: #666;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.8);
      transform: translateY(-2px);
      
      @media (max-width: 480px) {
        transform: translateY(-1px);
      }
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(220, 0, 78, 0.1);
  border: 2px solid #dc004e;
  color: #dc004e;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  text-align: center;
  font-weight: 500;
  
  @media (max-width: 768px) {
    padding: 14px 18px;
    margin-bottom: 20px;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 8px;
    font-size: 0.95rem;
  }
`;

const HelperText = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 8px;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    margin-top: 6px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    margin-top: 6px;
  }
`;

const FileUploadSection = styled.div`
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(52, 165, 216, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 14px;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 14px;
    margin-bottom: 12px;
    border-radius: 8px;
  }
`;

const FileUploadLabel = styled.div`
  color: var(--text);
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 1rem;
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-bottom: 10px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
`;

const CreateBoard: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateBoardInput>({
    name: '',
    description: '',
    banner_image_url: '',
    icon_image_url: '',
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Board name is required');
      return;
    }

    setLoading(true);

    try {
      let bannerUrl = formData.banner_image_url;
      let iconUrl = formData.icon_image_url;

      // Upload banner image if file selected
      if (bannerFile) {
        const boardSlug = generateSlug(formData.name);
        bannerUrl = await uploadFile(bannerFile, 'board-images', `${boardSlug}/banner`);
      }

      // Upload icon image if file selected
      if (iconFile) {
        const boardSlug = generateSlug(formData.name);
        iconUrl = await uploadFile(iconFile, 'board-images', `${boardSlug}/icon`);
      }

      const board = await createBoard({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        banner_image_url: bannerUrl?.trim() || undefined,
        icon_image_url: iconUrl?.trim() || undefined,
      });

      // Navigate to the newly created board
      navigate(`/b/${board.slug}`);
    } catch (err: any) {
      console.error('Error creating board:', err);
      
      if (err.code === '23505') {
        // Unique constraint violation
        setError('A board with this name already exists. Please choose a different name.');
      } else {
        setError('Failed to create board. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/boards');
  };

  const slug = formData.name ? generateSlug(formData.name) : '';

  return (
    <FormContainer>
      <FormTitle>Create New Sphera</FormTitle>
      <FormSubtitle>
        Build a community around your interests and start meaningful conversations
      </FormSubtitle>
      
      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <FormGroup>
          <Label htmlFor="name">Sphera Name *</Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. Existential Philosophy, Modern Art Discussion"
            maxLength={100}
            required
          />
          {slug && (
            <SlugPreview>
              URL: /b/{slug}
            </SlugPreview>
          )}
          <HelperText>
            Choose a clear, descriptive name for your Sphera. This will be used in the URL.
          </HelperText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what this Sphera is about, its purpose, and what kind of discussions are welcome..."
          />
          <HelperText>
            Help users understand what your Sphera is about and what kind of content is appropriate.
          </HelperText>
        </FormGroup>

        <FormGroup>
          <Label>Banner Image (Optional)</Label>
          <FileUploadSection>
            <FileUploadLabel>Upload Banner Image</FileUploadLabel>
            <FileUpload
              onFileSelect={setBannerFile}
              currentUrl={formData.banner_image_url}
              label="Banner Image"
              helperText="A banner image that will be displayed at the top of your Sphera (recommended: 1200x300px)"
              maxSizeMB={10}
            />
          </FileUploadSection>
          <HelperText>
            Or provide a URL:
          </HelperText>
          <Input
            type="url"
            name="banner_image_url"
            value={formData.banner_image_url}
            onChange={handleInputChange}
            placeholder="https://example.com/banner.jpg"
          />
        </FormGroup>

        <FormGroup>
          <Label>Icon Image (Optional)</Label>
          <FileUploadSection>
            <FileUploadLabel>Upload Icon Image</FileUploadLabel>
            <FileUpload
              onFileSelect={setIconFile}
              currentUrl={formData.icon_image_url}
              label="Icon Image"
              helperText="A small icon that represents your Sphera (recommended: square, 256x256px)"
              maxSizeMB={5}
            />
          </FileUploadSection>
          <HelperText>
            Or provide a URL:
          </HelperText>
          <Input
            type="url"
            name="icon_image_url"
            value={formData.icon_image_url}
            onChange={handleInputChange}
            placeholder="https://example.com/icon.jpg"
          />
        </FormGroup>

        <ButtonGroup>
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating...' : '✨ Create Sphera'}
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};

export default CreateBoard;
 