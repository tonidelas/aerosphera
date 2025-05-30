import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createBoard, generateSlug } from '../../utils/boardApi';
import { uploadFile } from '../../utils/fileUpload';
import FileUpload from '../common/FileUpload';
import { CreateBoardInput } from '../../types/board';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const FormTitle = styled.h1`
  color: #fff;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const Form = styled.form`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: #fff;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #64ffda;
    background: rgba(255, 255, 255, 0.15);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #64ffda;
    background: rgba(255, 255, 255, 0.15);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SlugPreview = styled.div`
  margin-top: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 30px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid;

  ${props => props.variant === 'primary' ? `
    background: rgba(100, 255, 218, 0.2);
    border-color: #64ffda;
    color: #64ffda;

    &:hover:not(:disabled) {
      background: rgba(100, 255, 218, 0.3);
      transform: translateY(-1px);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 82, 82, 0.2);
  border: 1px solid #ff5252;
  color: #ff5252;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

const HelperText = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
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
      <FormTitle>Create New Board</FormTitle>
      
      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <FormGroup>
          <Label htmlFor="name">Board Name *</Label>
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
            Choose a clear, descriptive name for your board. This will be used in the URL.
          </HelperText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what this board is about, its purpose, and what kind of discussions are welcome..."
          />
          <HelperText>
            Help users understand what your board is about and what kind of content is appropriate.
          </HelperText>
        </FormGroup>

        <FormGroup>
          <Label>Banner Image (Optional)</Label>
          <FileUpload
            onFileSelect={setBannerFile}
            currentUrl={formData.banner_image_url}
            label="Banner Image"
            helperText="A banner image that will be displayed at the top of your board (recommended: 1200x300px)"
            maxSizeMB={10}
          />
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
          <FileUpload
            onFileSelect={setIconFile}
            currentUrl={formData.icon_image_url}
            label="Icon Image"
            helperText="A small icon that represents your board (recommended: square, 256x256px)"
            maxSizeMB={5}
          />
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
            {loading ? 'Creating...' : 'Create Board'}
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};

export default CreateBoard; 