export type BoardRoleType = 'owner' | 'moderator' | 'member' | 'banned';

export interface BoardRole {
  id: string;
  board_id: string;
  user_id: string;
  role: 'moderator';
  granted_by: string | null;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface BoardBan {
  id: string;
  board_id: string;
  user_id: string;
  banned_by: string | null;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface BoardRule {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
}

export type ModAction =
  | 'ban'
  | 'unban'
  | 'remove_post'
  | 'pin_post'
  | 'unpin_post'
  | 'remove_member'
  | 'appoint_mod'
  | 'remove_mod'
  | 'edit_settings'
  | 'create_rule'
  | 'delete_rule'
  | 'resolve_report'
  | 'dismiss_report'
  | 'transfer_ownership';

export interface ModLogEntry {
  id: string;
  board_id: string;
  mod_user_id: string | null;
  action: ModAction;
  target_user_id: string | null;
  target_post_id: string | null;
  reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  mod_profile?: { id: string; username: string; avatar_url: string | null };
  target_profile?: { id: string; username: string; avatar_url: string | null };
}

export interface PostReport {
  id: string;
  post_id: string;
  board_id: string;
  reporter_user_id: string | null;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  created_at: string;
  reporter_profile?: { id: string; username: string; avatar_url: string | null };
  posts?: {
    content: string;
    user_id: string;
    profiles?: { username: string };
  };
}

export interface BoardMember {
  user_id: string;
  board_id: string;
  created_at: string;
  role: BoardRoleType;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}
