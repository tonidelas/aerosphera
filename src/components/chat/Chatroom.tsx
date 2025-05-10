import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Message, UserProfile, Chatroom as ChatroomType } from '../../types/chat';
import MessageItem from './Message'; // Renamed to avoid conflict with the Message type
import styles from './Chatroom.module.css';

const Chatroom = () => {
  const { id: chatroomId } = useParams<{ id: string }>();
  const [chatroom, setChatroom] = useState<ChatroomType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchUserAndChatroom = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('You must be logged in to view this chatroom.');
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
        setUser(null);
      } else {
        setUser(profile as UserProfile);
      }

      if (!chatroomId) {
        setError('Chatroom ID is missing.');
        setLoading(false);
        return;
      }

      // Fetch chatroom details
      const { data: chatroomData, error: chatroomError } = await supabase
        .from('chatrooms')
        .select('*')
        .eq('id', chatroomId)
        .single();

      if (chatroomError || !chatroomData) {
        setError('Could not load chatroom details. It might not exist or you may not have access.');
        setChatroom(null);
        setLoading(false);
        return;
      }
      setChatroom(chatroomData as ChatroomType);

      // Fetch initial messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          user:profiles!user_id(id, username, avatar_url)
        `)
        .eq('chatroom_id', chatroomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setError('Failed to load messages.');
        setMessages([]);
      } else {
        setMessages(messagesData || []);
      }
      setLoading(false);
    };

    fetchUserAndChatroom();
  }, [chatroomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chatroomId) return;

    const channel = supabase
      .channel(`public:messages:chatroom_id=eq.${chatroomId}`)
      .on<
        Message & { user: UserProfile } // Define the payload type for clarity
      >(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chatroom_id=eq.${chatroomId}`
        },
        async (payload) => {
          console.log('New message payload received (Chatroom.tsx):', payload);
          let fullMessage = payload.new as Message;

          // Check if user details are embedded or need fetching
          if (payload.new.user) { // Supabase might sometimes include joined data based on how insert is done or if using views
            console.log('User data found in message payload:', payload.new.user);
            fullMessage.user = payload.new.user as UserProfile;
          } else if (payload.new.user_id) {
            console.log('User data not in payload, fetching profile for user_id:', payload.new.user_id);
            const { data: userProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', payload.new.user_id)
              .single();
            if (profileError) {
              console.error('Error fetching profile for new message (Chatroom.tsx):', profileError);
            } else {
              console.log('Successfully fetched profile for new message (Chatroom.tsx):', userProfile);
              fullMessage.user = userProfile as UserProfile;
            }
          } else {
            console.warn('New message received without user_id or embedded user object (Chatroom.tsx):', payload.new);
          }
          setMessages((prevMessages) => [...prevMessages, fullMessage]);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to messages in chatroom ${chatroomId} (Chatroom.tsx)`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Messages channel subscription error (Chatroom.tsx):', err);
          setError('Realtime connection error for messages.');
        } else {
          console.log('Messages channel status (Chatroom.tsx):', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatroomId]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatroomId) {
      setError('Message cannot be empty, or user/chatroom not identified.');
      return;
    }

    const messageToSend = {
      chatroom_id: chatroomId,
      user_id: user.id,
      content: newMessage.trim(),
    };

    const { error: insertError } = await supabase
      .from('messages')
      .insert(messageToSend);

    if (insertError) {
      console.error('Error sending message:', insertError);
      setError('Failed to send message. ' + insertError.message);
    } else {
      setNewMessage(''); // Clear input after sending
      setError(null);
      // Realtime subscription should add the message to the list
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading chatroom...</div>;
  }

  if (error && !user && !chatroom) { // If error is critical (no user, no chatroom access)
     return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <Link to="/chatrooms" className={styles.backLink}>Back to Chatrooms</Link>
        {!user && <p>Please ensure you are <Link to="/login">logged in</Link>.</p>}
      </div>
    );
  }
  
  if (!chatroom) {
    return (
      <div className={styles.errorContainer}>
        <p>Chatroom not found or access denied.</p>
        <Link to="/chatrooms" className={styles.backLink}>Back to Chatrooms</Link>
      </div>
    );
  }

  if (!user) {
    return (
        <div className={styles.errorContainer}>
            <p>Could not load your user profile. Please <Link to="/login">login</Link> and try again.</p>
            <Link to="/chatrooms" className={styles.backLink}>Back to Chatrooms</Link>
        </div>
    );
  }

  return (
    <div className={styles.chatroomPage}>
      <div className={styles.header}>
        <h2>{chatroom.name}</h2>
        <Link to="/chatrooms" className={styles.backLink}>Back to List</Link>
      </div>
      
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.messagesContainer}>
        {messages.length === 0 && <p className={styles.noMessages}>No messages yet. Be the first to say something!</p>}
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} currentUser={user} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className={styles.messageInput}
          rows={3}
        />
        <button type="submit" className={styles.sendButton} disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatroom;
