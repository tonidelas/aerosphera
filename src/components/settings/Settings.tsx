import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  FormContainer,
  FormTitle,
  GlassPanel,
  FormLabel,
  GlassInput,
  AquaButton
} from '../common/StyledComponents';

const FEED_BG_KEY = 'feedBackgroundImage';

const Settings: React.FC = () => {
  const [feedBg, setFeedBg] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const savedBg = localStorage.getItem(FEED_BG_KEY);
    if (savedBg) setFeedBg(savedBg);
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (preview) {
      localStorage.setItem(FEED_BG_KEY, preview);
      setFeedBg(preview);
      setPreview(null);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem(FEED_BG_KEY);
    setFeedBg(null);
    setPreview(null);
    // Dispatch a storage event to notify Feed
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <FormContainer style={{ width: '100%', maxWidth: 500 }}>
      <FormTitle>Settings</FormTitle>
      <GlassPanel>
        <FormTitle as="h3" style={{ fontSize: '1.2rem', marginBottom: 10 }}>Feed Background</FormTitle>
        <p style={{ marginBottom: 18, color: 'var(--text)' }}>Change the background of your feed by uploading a photo.</p>
        <FormLabel htmlFor="feed-bg-upload">Upload Photo</FormLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <input
            id="feed-bg-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <AquaButton type="button" onClick={() => document.getElementById('feed-bg-upload')?.click()}>
            Choose File
          </AquaButton>
          <span style={{ color: '#888', fontSize: '0.95em' }}>
            {preview ? 'Selected' : feedBg ? 'Current' : 'No file chosen'}
          </span>
        </div>
        {(preview || feedBg) && (
          <div style={{ margin: '15px 0', textAlign: 'center' }}>
            <img
              src={preview || feedBg || ''}
              alt="Feed Background Preview"
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', boxShadow: '0 2px 8px #0002' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          {preview && (
            <AquaButton onClick={handleSave} style={{ minWidth: 120 }}>Save Background</AquaButton>
          )}
          {(feedBg || preview) && (
            <AquaButton onClick={handleRemove} style={{ color: 'red', background: '#fff', border: '1px solid #f44', minWidth: 120 }}>Remove Background</AquaButton>
          )}
        </div>
      </GlassPanel>
      {/* Add more settings here */}
    </FormContainer>
  );
};

export default Settings; 