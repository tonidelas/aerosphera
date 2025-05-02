import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  FormContainer,
  FormTitle,
  GlassPanel,
  FormLabel,
  AquaButton
} from '../common/StyledComponents';
import { supabase } from '../../utils/supabaseClient'; // Import Supabase client
import { Session } from '@supabase/supabase-js'; // Import Session type

// Removed UserProfile interface, will fetch directly

const Settings: React.FC = () => {
  const [feedBgUrl, setFeedBgUrl] = useState<string | null>(null); // Store the public URL
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store the selected file object
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Store temporary object URL for preview
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null); // Store user session

  // Get session and load initial profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile data when session is available
  useEffect(() => {
    if (!session?.user) {
        setIsLoading(false); // Not logged in, stop loading
        return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('feed_background_image_url')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (data?.feed_background_image_url) {
          setFeedBgUrl(data.feed_background_image_url);
        } else {
          setFeedBgUrl(null); // Ensure it's null if not set
        }
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        setError(`Failed to load settings: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [session]); // Re-run when session changes

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create a temporary URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      // Clean up previous object URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } else {
        // Clear selection if no file is chosen
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    }
  };

  // Clean up object URL on component unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);


  const handleSave = async () => {
    if (!selectedFile || !session?.user) return;

    setIsLoading(true);
    setError(null);

    const fileExt = selectedFile.name.split('.').pop();
    const uniqueFileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `public/${uniqueFileName}`; // Path within the bucket

    try {
      // 1. Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('feed-backgrounds') // Ensure this bucket exists in your Supabase project
        .upload(filePath, selectedFile, {
          cacheControl: '3600', // Optional: cache control
          upsert: true, // Overwrite if file with same name exists (optional, adjust as needed)
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('feed-backgrounds') // Ensure this bucket exists in your Supabase project
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
          throw new Error("Could not get public URL for the uploaded file.");
      }
      const publicUrl = urlData.publicUrl;

       // 3. (Optional but recommended) Remove old file if exists
      if (feedBgUrl) {
          const oldFileName = feedBgUrl.split('/').pop();
          if (oldFileName && oldFileName !== uniqueFileName) {
              const oldFilePath = `public/${oldFileName}`;
              await supabase.storage.from('feed-backgrounds').remove([oldFilePath]);
              console.log(`Removed old background: ${oldFilePath}`);
          }
      }


      // 4. Update profile table with the new URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ feed_background_image_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // 5. Update state
      setFeedBgUrl(publicUrl);
      setSelectedFile(null); // Clear selected file
      if (previewUrl) URL.revokeObjectURL(previewUrl); // Clean up preview URL
      setPreviewUrl(null);

    } catch (err: any) {
      console.error("Failed to save background:", err);
      setError(`Failed to save background: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!session?.user || !feedBgUrl) return; // Check if there is a background to remove

    setIsLoading(true);
    setError(null);

    try {
        // 1. Extract filename from the URL to delete from Storage
        const fileName = feedBgUrl.split('/').pop();
        const filePath = fileName ? `public/${fileName}` : null;


      // 2. Update profile table, setting URL to null
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ feed_background_image_url: null })
        .eq('id', session.user.id);

      if (updateError) throw updateError;


      // 3. (Optional but recommended) Remove file from Supabase Storage
       if (filePath) {
           const { error: removeError } = await supabase.storage
               .from('feed-backgrounds') // Ensure this bucket exists in your Supabase project
               .remove([filePath]); // remove expects an array of paths

           if (removeError) {
               // Log error but proceed, profile update is more critical
               console.error("Failed to remove file from storage:", removeError);
               setError("Background removed from profile, but failed to delete file from storage.");
           } else {
               console.log(`Removed background file from storage: ${filePath}`);
           }
       }


      // 4. Update state
      setFeedBgUrl(null);
      setSelectedFile(null); // Also clear selection if any
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

    } catch (err: any) {
      console.error("Failed to remove background:", err);
      setError(`Failed to remove background: ${err.message || 'Unknown error'}`);
      // Potentially revert UI state or add specific error handling if profile update failed
    } finally {
      setIsLoading(false);
    }
  };

  // Display loading or error states
  if (isLoading && !feedBgUrl && !previewUrl) return <FormContainer><p>Loading settings...</p></FormContainer>;
  // Don't show main error if not logged in, maybe show a login prompt instead
  if (!session?.user && !isLoading) return <FormContainer><p>Please log in to manage settings.</p></FormContainer>;


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
            disabled={isLoading}
          />
          <AquaButton
            type="button"
            onClick={() => document.getElementById('feed-bg-upload')?.click()}
            disabled={isLoading}
          >
            Choose File
          </AquaButton>
          <span style={{ color: '#888', fontSize: '0.95em' }}>
            {previewUrl ? 'New file selected' : feedBgUrl ? 'Current background set' : 'No background set'}
          </span>
        </div>
        {(previewUrl || feedBgUrl) && (
          <div style={{ margin: '15px 0', textAlign: 'center' }}>
            <img
              src={previewUrl || feedBgUrl || ''} // Show preview if available, otherwise the saved background
              alt="Feed Background Preview"
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', boxShadow: '0 2px 8px #0002' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          {previewUrl && ( // Only show Save button if there's a new file selected/preview
            <AquaButton onClick={handleSave} style={{ minWidth: 120 }} disabled={isLoading || !selectedFile}>
              {isLoading ? 'Saving...' : 'Save Background'}
            </AquaButton>
          )}
          {feedBgUrl && !previewUrl && ( // Only show Remove button if there's a saved background AND no new file selected
            <AquaButton
              onClick={handleRemove}
              style={{ color: 'red', background: '#fff', border: '1px solid #f44', minWidth: 120 }}
              disabled={isLoading}
            >
              {isLoading ? 'Removing...' : 'Remove Background'}
            </AquaButton>
          )}
        </div>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </GlassPanel>
      {/* Add more settings here */}
    </FormContainer>
  );
};

export default Settings; 