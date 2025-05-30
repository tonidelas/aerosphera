export interface Board {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  creator_user_id: string | null;
  created_at: string;
  updated_at: string;
  banner_image_url: string | null;
  icon_image_url: string | null;
}

export interface BoardSubscription {
  user_id: string;
  board_id: string;
  created_at: string;
}

export interface CreateBoardInput {
  name: string;
  description?: string;
  banner_image_url?: string;
  icon_image_url?: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
  banner_image_url?: string;
  icon_image_url?: string;
}

// Enhanced Post type that includes board information
export interface PostWithBoard {
  id: string;
  content: string;
  user_id: string;
  board_id: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  background?: string;
  board?: Board;
  // Add other existing post fields as needed
} 