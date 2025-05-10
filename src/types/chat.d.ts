// Placeholder for chat types

export interface Chatroom {
  id: string;
  name: string;
  created_at: string;
  user_id: string; // User who created the chatroom
}

export interface Message {
  id: string;
  chatroom_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Optional: for displaying user info alongside the message
  user?: {
    username?: string;
    avatar_url?: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
}
