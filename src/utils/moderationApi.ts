import { supabase } from './supabaseClient';
import {
  BoardRole,
  BoardBan,
  BoardRule,
  ModLogEntry,
  PostReport,
  BoardRoleType,
  ModAction,
  BoardMember,
} from '../types/moderation';

// ─── Role Helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the current user's role in a board: 'owner' | 'moderator' | 'member' | 'banned' | null
 */
export const getUserRoleInBoard = async (
  boardId: string,
  userId: string
): Promise<BoardRoleType | null> => {
  // Check if owner
  const { data: board } = await supabase
    .from('boards')
    .select('creator_user_id')
    .eq('id', boardId)
    .single();

  if (board?.creator_user_id === userId) return 'owner';

  // Check if banned
  const { data: ban } = await supabase
    .from('board_bans')
    .select('id, expires_at')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (ban) {
    // Check if ban has expired
    if (ban.expires_at && new Date(ban.expires_at) < new Date()) {
      // Auto-unban — clean up expired ban silently
      await supabase.from('board_bans').delete().eq('id', ban.id);
    } else {
      return 'banned';
    }
  }

  // Check if moderator
  const { data: role } = await supabase
    .from('board_roles')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (role) return 'moderator';

  // Check if member
  const { data: sub } = await supabase
    .from('board_subscriptions')
    .select('board_id')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (sub) return 'member';

  return null;
};

// ─── Mod Log ───────────────────────────────────────────────────────────────────

const logModAction = async (
  boardId: string,
  action: ModAction,
  options: {
    targetUserId?: string;
    targetPostId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  } = {}
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('board_mod_log').insert({
    board_id: boardId,
    mod_user_id: user.id,
    action,
    target_user_id: options.targetUserId || null,
    target_post_id: options.targetPostId || null,
    reason: options.reason || null,
    metadata: options.metadata || {},
  });
};

export const getModLog = async (boardId: string): Promise<ModLogEntry[]> => {
  const { data, error } = await supabase
    .from('board_mod_log')
    .select(`
      *,
      mod_profile:profiles!board_mod_log_mod_user_id_fkey (id, username, avatar_url),
      target_profile:profiles!board_mod_log_target_user_id_fkey (id, username, avatar_url)
    `)
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching mod log:', error);
    throw error;
  }
  return data || [];
};

// ─── Moderators ────────────────────────────────────────────────────────────────

export const getModerators = async (boardId: string): Promise<BoardRole[]> => {
  const { data, error } = await supabase
    .from('board_roles')
    .select('*, profiles:profiles!board_roles_user_id_fkey (id, username, avatar_url)')
    .eq('board_id', boardId);

  if (error) {
    console.error('Error fetching moderators:', error);
    throw error;
  }
  return data || [];
};

export const appointModerator = async (boardId: string, userId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('board_roles').insert({
    board_id: boardId,
    user_id: userId,
    role: 'moderator',
    granted_by: user.id,
  });

  if (error) throw error;
  await logModAction(boardId, 'appoint_mod', { targetUserId: userId });
};

export const removeModerator = async (boardId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('board_roles')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId);

  if (error) throw error;
  await logModAction(boardId, 'remove_mod', { targetUserId: userId });
};

// ─── Members ───────────────────────────────────────────────────────────────────

export const getMembers = async (boardId: string): Promise<BoardMember[]> => {
  // 1. Fetch Board for owner info
  const { data: board } = await supabase
    .from('boards')
    .select('creator_user_id')
    .eq('id', boardId)
    .single();

  // 2. Fetch Board Roles (moderators)
  const { data: mods, error: modsError } = await supabase
    .from('board_roles')
    .select('user_id, profiles:profiles!board_roles_user_id_fkey (id, username, avatar_url)')
    .eq('board_id', boardId);

  if (modsError) {
    console.error('Error fetching moderators for member list:', modsError);
  }

  // 3. Fetch Subscriptions (regular members)
  const { data: subscribers, error: subError } = await supabase
    .from('board_subscriptions')
    .select('user_id, board_id, created_at, profiles:profiles!board_subscriptions_user_id_fkey (id, username, avatar_url)')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });

  if (subError) throw subError;

  // 4. Merge all unique users into a single map to calculate roles
  const membersMap = new Map<string, BoardMember>();

  // Use a set of moderator user IDs for quick lookup
  const moderatorIds = new Set((mods || []).map((m: any) => m.user_id));

  // Add all subscribers first
  (subscribers || []).forEach((sub: any) => {
    membersMap.set(sub.user_id, {
      user_id: sub.user_id,
      board_id: sub.board_id,
      created_at: sub.created_at,
      profiles: sub.profiles,
      role: sub.user_id === board?.creator_user_id
        ? 'owner'
        : moderatorIds.has(sub.user_id)
        ? 'moderator'
        : 'member',
    });
  });

  // Ensure owner is present even if they unsubscribed
  if (board?.creator_user_id && !membersMap.has(board.creator_user_id)) {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', board.creator_user_id)
      .maybeSingle();

    if (ownerProfile) {
      membersMap.set(board.creator_user_id, {
        user_id: board.creator_user_id,
        board_id: boardId,
        created_at: new Date().toISOString(), // Fallback
        profiles: ownerProfile,
        role: 'owner',
      });
    }
  }

  // Ensure all moderators are present even if they haven't subscribed
  (mods || []).forEach((mod: any) => {
    if (!membersMap.has(mod.user_id)) {
      membersMap.set(mod.user_id, {
        user_id: mod.user_id,
        board_id: boardId,
        created_at: new Date().toISOString(), // Fallback
        profiles: mod.profiles,
        role: 'moderator',
      });
    }
  });

  // Convert map to array and sort by role priority and username
  const membersList = Array.from(membersMap.values());
  const roleOrder: Record<string, number> = { owner: 0, moderator: 1, member: 2, banned: 3 };

  return membersList.sort((a, b) => {
    const roleDiff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
    if (roleDiff !== 0) return roleDiff;
    return (a.profiles?.username || '').localeCompare(b.profiles?.username || '');
  });
};

export const removeMember = async (boardId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('board_subscriptions')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId);

  if (error) throw error;
  await logModAction(boardId, 'remove_member', { targetUserId: userId });
};

// ─── Bans ──────────────────────────────────────────────────────────────────────

export const getBannedMembers = async (boardId: string): Promise<BoardBan[]> => {
  const { data, error } = await supabase
    .from('board_bans')
    .select('*, profiles:profiles!board_bans_user_id_fkey (id, username, avatar_url)')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const banMember = async (
  boardId: string,
  userId: string,
  reason?: string,
  expiresAt?: string | null
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Insert ban record (upsert in case re-banning)
  const { error } = await supabase
    .from('board_bans')
    .upsert({
      board_id: boardId,
      user_id: userId,
      banned_by: user.id,
      reason: reason || null,
      expires_at: expiresAt || null,
    }, { onConflict: 'board_id,user_id' });

  if (error) throw error;

  // Also remove from subscriptions
  await supabase
    .from('board_subscriptions')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId);

  // Also remove any mod role
  await supabase
    .from('board_roles')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId);

  await logModAction(boardId, 'ban', {
    targetUserId: userId,
    reason,
    metadata: { expires_at: expiresAt },
  });
};

export const unbanMember = async (boardId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('board_bans')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId);

  if (error) throw error;
  await logModAction(boardId, 'unban', { targetUserId: userId });
};

export const isMemberBanned = async (boardId: string, userId: string): Promise<BoardBan | null> => {
  const { data, error } = await supabase
    .from('board_bans')
    .select('*')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Auto-clean expired ban
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await supabase.from('board_bans').delete().eq('id', data.id);
    return null;
  }

  return data;
};

// ─── Posts ─────────────────────────────────────────────────────────────────────

export const pinPost = async (boardId: string, postId: string, pin: boolean): Promise<void> => {
  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: pin })
    .eq('id', postId);

  if (error) throw error;
  await logModAction(boardId, pin ? 'pin_post' : 'unpin_post', { targetPostId: postId });
};

export const modRemovePost = async (
  boardId: string,
  postId: string,
  reason: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('posts')
    .update({
      removed_by: user.id,
      removed_at: new Date().toISOString(),
      removal_reason: reason,
    })
    .eq('id', postId);

  if (error) throw error;
  await logModAction(boardId, 'remove_post', { targetPostId: postId, reason });
};

export const modRestorePost = async (boardId: string, postId: string): Promise<void> => {
  const { error } = await supabase
    .from('posts')
    .update({ removed_by: null, removed_at: null, removal_reason: null })
    .eq('id', postId);

  if (error) throw error;
};

// ─── Rules ─────────────────────────────────────────────────────────────────────

export const getBoardRules = async (boardId: string): Promise<BoardRule[]> => {
  const { data, error } = await supabase
    .from('board_rules')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createRule = async (
  boardId: string,
  title: string,
  description?: string
): Promise<BoardRule> => {
  // Get max position
  const { data: existing } = await supabase
    .from('board_rules')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('board_rules')
    .insert({ board_id: boardId, title, description: description || null, position: nextPosition })
    .select()
    .single();

  if (error) throw error;
  await logModAction(boardId, 'create_rule', { metadata: { title } });
  return data;
};

export const updateRule = async (
  ruleId: string,
  boardId: string,
  title: string,
  description?: string
): Promise<BoardRule> => {
  const { data, error } = await supabase
    .from('board_rules')
    .update({ title, description: description || null })
    .eq('id', ruleId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRule = async (boardId: string, ruleId: string): Promise<void> => {
  const { error } = await supabase.from('board_rules').delete().eq('id', ruleId);
  if (error) throw error;
  await logModAction(boardId, 'delete_rule');
};

// ─── Reports ───────────────────────────────────────────────────────────────────

export const reportPost = async (
  postId: string,
  boardId: string,
  reason: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('post_reports').insert({
    post_id: postId,
    board_id: boardId,
    reporter_user_id: user.id,
    reason,
  });

  if (error) throw error;
};

export const getReports = async (boardId: string): Promise<PostReport[]> => {
  const { data, error } = await supabase
    .from('post_reports')
    .select(`
      *,
      reporter_profile:profiles!post_reports_reporter_user_id_fkey (id, username, avatar_url),
      posts (content, user_id, profiles:profiles!posts_user_id_fkey_to_profiles (username))
    `)
    .eq('board_id', boardId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const resolveReport = async (
  reportId: string,
  boardId: string,
  resolution: 'resolved' | 'dismissed'
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('post_reports')
    .update({ status: resolution, resolved_by: user.id })
    .eq('id', reportId);

  if (error) throw error;
  await logModAction(boardId, resolution === 'resolved' ? 'resolve_report' : 'dismiss_report');
};

// ─── Board Settings (Owner) ────────────────────────────────────────────────────

export const updateBoardSettings = async (
  boardId: string,
  input: {
    name?: string;
    description?: string;
    banner_image_url?: string;
    icon_image_url?: string;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('boards')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', boardId);

  if (error) throw error;
  await logModAction(boardId, 'edit_settings');
};

export const transferOwnership = async (boardId: string, newOwnerId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('boards')
    .update({ creator_user_id: newOwnerId })
    .eq('id', boardId);

  if (error) throw error;
  await logModAction(boardId, 'transfer_ownership', {
    targetUserId: newOwnerId,
    metadata: { previous_owner: user.id },
  });
};
