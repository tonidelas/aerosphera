import { supabase } from './supabaseClient';
import { Board, CreateBoardInput, UpdateBoardInput, BoardSubscription } from '../types/board';

// Helper function to generate slug from name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

// Create a new board
export const createBoard = async (input: CreateBoardInput): Promise<Board> => {
  const slug = generateSlug(input.name);
  
  const { data, error } = await supabase
    .from('boards')
    .insert({
      name: input.name,
      slug,
      description: input.description,
      banner_image_url: input.banner_image_url,
      icon_image_url: input.icon_image_url,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all boards (for discovery/listing)
export const getBoards = async (): Promise<Board[]> => {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get a specific board by slug
export const getBoardBySlug = async (slug: string): Promise<Board | null> => {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

// Get boards created by a specific user
export const getBoardsByUser = async (userId: string): Promise<Board[]> => {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('creator_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update a board (only by creator)
export const updateBoard = async (boardId: string, input: UpdateBoardInput): Promise<Board> => {
  const updateData: any = { ...input };
  
  // Generate new slug if name is being updated
  if (input.name) {
    updateData.slug = generateSlug(input.name);
  }

  const { data, error } = await supabase
    .from('boards')
    .update(updateData)
    .eq('id', boardId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a board (only by creator)
export const deleteBoard = async (boardId: string): Promise<void> => {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId);

  if (error) throw error;
};

// Subscribe to a board
export const subscribeToBoard = async (boardId: string): Promise<BoardSubscription> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('board_subscriptions')
    .insert({
      board_id: boardId,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Unsubscribe from a board
export const unsubscribeFromBoard = async (boardId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('board_subscriptions')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', user.id);

  if (error) throw error;
};

// Get user's subscribed boards
export const getUserSubscriptions = async (userId: string): Promise<Board[]> => {
  const { data, error } = await supabase
    .from('board_subscriptions')
    .select(`
      board_id,
      boards (*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data?.flatMap((sub: any) => sub.boards || []) || [];
};

// Check if user is subscribed to a board
export const isUserSubscribed = async (boardId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('board_subscriptions')
    .select('board_id')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

// Get posts from a specific board
export const getBoardPosts = async (boardId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        id,
        username,
        full_name,
        avatar_url
      ),
      boards (
        id,
        name,
        slug
      )
    `)
    .eq('board_id', boardId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get board member count
export const getBoardMemberCount = async (boardId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('board_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', boardId);

  if (error) throw error;
  return count || 0;
}; 