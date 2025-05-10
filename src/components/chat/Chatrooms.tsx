import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { supabase } from '../../utils/supabaseClient';
import { Chatroom, UserProfile } from '../../types/chat';
import styles from './Chatrooms.module.css';

const Chatrooms = () => {
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [newChatroomName, setNewChatroomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('You must be logged in to view chatrooms.');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        setError('Could not fetch user profile.');
        console.error('Profile fetch error:', profileError);
        setUser(null);
      } else {
        setUser(profile as UserProfile);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return; // Don't fetch chatrooms if user is not loaded or identified

    const fetchChatrooms = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('chatrooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching chatrooms:', fetchError);
        setError('Failed to load chatrooms.');
        setChatrooms([]);
      } else {
        setChatrooms(data || []);
        setError(null);
      }
      setLoading(false);
    };

    fetchChatrooms();

    // Listen for new chatrooms
    const channel = supabase
      .channel('public:chatrooms')
      .on<Chatroom>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chatrooms' },
        (payload) => {
          console.log('New chatroom received (Chatrooms.tsx):', payload);
          setChatrooms((prevChatrooms) => [payload.new as Chatroom, ...prevChatrooms]);
        }
      )
      .on<Chatroom>(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chatrooms' },
        (payload) => {
          console.log('Chatroom deleted (Chatrooms.tsx):', payload);
          setChatrooms((prevChatrooms) => prevChatrooms.filter(room => room.id !== payload.old.id));
        }
      )
      .subscribe((status, err) => { // Added status and error logging for the subscription itself
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to chatrooms channel! (Chatrooms.tsx)');
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Chatrooms channel subscription error (Chatrooms.tsx):', err);
          setError('Realtime connection error for chatrooms.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCreateChatroom = async (e: FormEvent) => {
    e.preventDefault();
    console.log('handleCreateChatroom called.');
    console.log('Current newChatroomName:', newChatroomName);
    console.log('Current user state:', user);

    if (!user) {
      setError('User not loaded. Please wait or try logging in again.');
      console.error('User object is null. Cannot create chatroom.');
      return;
    }

    if (!newChatroomName.trim()) {
      setError('Chatroom name cannot be empty.');
      console.warn('Chatroom name is empty.');
      return;
    }

    console.log('Proceeding to create chatroom with name:', newChatroomName, 'by user ID:', user.id);

    const { data, error: insertError } = await supabase
      .from('chatrooms')
      .insert([{ name: newChatroomName, user_id: user.id }])
      .select();

    if (insertError) {
      console.error('Error creating chatroom:', insertError);
      setError('Failed to create chatroom. ' + insertError.message);
    } else {
      console.log('Chatroom created successfully, response data:', data);
      // The realtime subscription should pick this up.
      setNewChatroomName(''); // Clear the input field
      setError(null); // Clear any previous errors
    }
  };

  const handleDeleteChatroom = async (chatroomId: string, createdByUserId?: string) => {
    if (!user || user.id !== createdByUserId) {
      setError("You can only delete chatrooms you created.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this chatroom? This action cannot be undone.")) {
      return;
    }

    setLoading(true); // Indicate loading state for deletion
    const { error: deleteError } = await supabase
      .from('chatrooms')
      .delete()
      .eq('id', chatroomId);

    if (deleteError) {
      console.error('Error deleting chatroom:', deleteError);
      setError('Failed to delete chatroom. ' + deleteError.message);
    } else {
      setError(null);
      // Realtime subscription should remove it from the list.
      // Optionally, navigate away if the current chatroom was deleted, though this component is the list view.
      console.log(`Chatroom ${chatroomId} deleted successfully.`);
    }
    setLoading(false);
  };

  if (loading && !chatrooms.length && !error) { // Added !error to prevent showing loading when an error is present
    return <div className={styles.loading}>Loading chatrooms...</div>;
  }

  if (error && !user && !loading) { // If error is due to not being logged in
    return <div className={styles.error}>{error} Please <Link to="/login">login</Link>.</div>;
  }
  
  if (!user && !loading) { // If user is null after attempting to fetch
    return <div className={styles.error}>Could not load user profile. Please ensure you are logged in and try again. <Link to="/login">Login</Link></div>;
  }


  return (
    <div className={styles.chatroomsPage}>
      <h2>Chatrooms</h2>
      {error && <p className={styles.error}>{error}</p>}
      {user && (
        <form onSubmit={handleCreateChatroom} className={styles.createForm}>
          <input
            type="text"
            value={newChatroomName}
            onChange={(e) => setNewChatroomName(e.target.value)}
            placeholder="Enter new chatroom name"
            className={styles.input}
          />
          <button type="submit" className={styles.button} disabled={!newChatroomName.trim()}>
            Create Chatroom
          </button>
        </form>
      )}
      {chatrooms.length === 0 && !loading && <p>No chatrooms available. Create one to get started!</p>}
      <ul className={styles.list}>
        {chatrooms.map((room) => (
          <li key={room.id} className={styles.listItem}>
            <Link to={`/chatrooms/${room.id}`} className={styles.link}>
              {room.name}
            </Link>
            <div className={styles.roomActions}> {/* Container for date and button */}
              <span className={styles.createdAt}>
                Created: {new Date(room.created_at).toLocaleDateString()}
              </span>
              {user && room.user_id === user.id && (
                <button 
                  onClick={() => handleDeleteChatroom(room.id, room.user_id)}
                  className={styles.deleteButton}
                  disabled={loading} // Disable button while any loading operation is in progress
                  title="Delete Chatroom"
                >
                  🗑️
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Chatrooms;
