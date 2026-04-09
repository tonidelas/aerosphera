import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Board, UpdateBoardInput } from '../../types/board';
import { BoardBan, BoardMember, BoardRole, BoardRule, ModLogEntry, PostReport } from '../../types/moderation';
import { getBoardBySlug, updateBoard } from '../../utils/boardApi';
import {
  getUserRoleInBoard,
  getModerators,
  getMembers,
  getBannedMembers,
  getBoardRules,
  getModLog,
  getReports,
  appointModerator,
  removeModerator,
  banMember,
  unbanMember,
  removeMember,
  createRule,
  updateRule,
  deleteRule,
  resolveReport,
  pinPost,
  transferOwnership,
  updateBoardSettings,
} from '../../utils/moderationApi';
import { supabase } from '../../utils/supabaseClient';
import { uploadFile } from '../../utils/fileUpload';
import { generateSlug } from '../../utils/boardApi';

// ─── Styled Components ─────────────────────────────────────────────────────────

const PageContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 20px;
  @media (max-width: 768px) { padding: 16px; }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const BackLink = styled(Link)`
  color: #1D6BA7;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  background: rgba(52, 165, 216, 0.1);
  border: 1px solid rgba(52, 165, 216, 0.3);
  transition: all 0.2s ease;
  &:hover { background: rgba(52, 165, 216, 0.2); }
`;

const PageTitle = styled.h1`
  color: var(--text);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  @media (max-width: 480px) { font-size: 1.4rem; }
`;

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 28px;
  border-bottom: 2px solid rgba(52, 165, 216, 0.2);
  overflow-x: auto;
  padding-bottom: 0;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${p => p.$active ? '700' : '500'};
  color: ${p => p.$active ? '#1D6BA7' : '#666'};
  border-bottom: 2px solid ${p => p.$active ? '#1D6BA7' : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.2s ease;
  white-space: nowrap;
  &:hover { color: #1D6BA7; }
`;

const Card = styled.div`
  background: rgba(245, 245, 247, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(29, 107, 167, 0.08);
  @media (max-width: 480px) { padding: 20px; border-radius: 16px; }
`;

const CardTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(52, 165, 216, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(52, 165, 216, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--text);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #52A5D8; box-shadow: 0 0 0 3px rgba(52, 165, 216, 0.1); }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(52, 165, 216, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--text);
  font-size: 0.95rem;
  min-height: 100px;
  resize: vertical;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
  &:focus { outline: none; border-color: #52A5D8; box-shadow: 0 0 0 3px rgba(52, 165, 216, 0.1); }
`;

const Select = styled.select`
  padding: 10px 14px;
  border: 2px solid rgba(52, 165, 216, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--text);
  font-size: 0.9rem;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  background: rgba(52, 165, 216, 0.2);
  border: 2px solid #52A5D8;
  color: #1D6BA7;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover:not(:disabled) { background: rgba(52, 165, 216, 0.35); transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const DangerButton = styled.button`
  background: rgba(220, 0, 78, 0.1);
  border: 2px solid #dc004e;
  color: #dc004e;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover:not(:disabled) { background: rgba(220, 0, 78, 0.2); transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(52, 165, 216, 0.3);
  color: #666;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { background: rgba(255, 255, 255, 0.9); }
`;

const SuccessButton = styled.button`
  background: rgba(46, 125, 50, 0.1);
  border: 2px solid #2e7d32;
  color: #2e7d32;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover:not(:disabled) { background: rgba(46, 125, 50, 0.2); transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(52, 165, 216, 0.1);
  &:last-child { border-bottom: none; }
  flex-wrap: wrap;
`;

const Avatar = styled.img`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #eee;
`;

const MemberName = styled.div`
  font-weight: 600;
  color: var(--text);
  font-size: 0.95rem;
  flex: 1;
  min-width: 100px;
`;

const RoleBadge = styled.span<{ $role: string }>`
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  ${p => p.$role === 'owner' && 'background: linear-gradient(90deg, #FF8C00, #FF5500); color: white;'}
  ${p => p.$role === 'moderator' && 'background: linear-gradient(90deg, #1D6BA7, #52A5D8); color: white;'}
  ${p => p.$role === 'member' && 'background: rgba(52, 165, 216, 0.1); color: #1D6BA7; border: 1px solid rgba(52, 165, 216, 0.3);'}
  ${p => p.$role === 'banned' && 'background: rgba(220, 0, 78, 0.15); color: #dc004e; border: 1px solid rgba(220, 0, 78, 0.3);'}
`;

const BtnGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const LogEntry = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid rgba(52, 165, 216, 0.1);
  &:last-child { border-bottom: none; }
`;

const LogMeta = styled.div`
  font-size: 0.8rem;
  color: #999;
  margin-top: 4px;
`;

const ActionBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(52, 165, 216, 0.1);
  color: #1D6BA7;
  border: 1px solid rgba(52, 165, 216, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  ${p => p.$status === 'pending' && 'background: rgba(255, 152, 0, 0.15); color: #e65100; border: 1px solid rgba(255, 152, 0, 0.4);'}
  ${p => p.$status === 'resolved' && 'background: rgba(46, 125, 50, 0.1); color: #2e7d32; border: 1px solid rgba(46, 125, 50, 0.3);'}
  ${p => p.$status === 'dismissed' && 'background: rgba(150, 150, 150, 0.1); color: #666; border: 1px solid rgba(150, 150, 150, 0.3);'}
`;

const RuleCard = styled.div`
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(52, 165, 216, 0.2);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const RuleNum = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #52A5D8, #1D6BA7);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const RuleBody = styled.div`
  flex: 1;
`;

const ErrorMsg = styled.div`
  padding: 14px 18px;
  background: rgba(220, 0, 78, 0.1);
  border: 1px solid rgba(220, 0, 78, 0.4);
  border-radius: 10px;
  color: #dc004e;
  font-size: 0.9rem;
  margin-bottom: 16px;
`;

const SuccessMsg = styled.div`
  padding: 14px 18px;
  background: rgba(46, 125, 50, 0.1);
  border: 1px solid rgba(46, 125, 50, 0.4);
  border-radius: 10px;
  color: #2e7d32;
  font-size: 0.9rem;
  margin-bottom: 16px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 60px;
  color: #666;
  font-size: 1.1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 0.95rem;
`;

const DangerZone = styled.div`
  background: rgba(220, 0, 78, 0.05);
  border: 2px solid rgba(220, 0, 78, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-top: 20px;
`;

const DangerZoneTitle = styled.h3`
  color: #dc004e;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// ─── Main Component ────────────────────────────────────────────────────────────

type TabId = 'settings' | 'members' | 'moderators' | 'bans' | 'rules' | 'reports' | 'modlog';

const ManageSpheraPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [board, setBoard] = useState<Board | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('settings');

  // Data for each tab
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [moderators, setModerators] = useState<BoardRole[]>([]);
  const [banned, setBanned] = useState<BoardBan[]>([]);
  const [rules, setRules] = useState<BoardRule[]>([]);
  const [modLog, setModLog] = useState<ModLogEntry[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    banner_image_url: '',
    icon_image_url: '',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ban dialog state
  const [banTarget, setBanTarget] = useState<{ userId: string; username: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banExpiry, setBanExpiry] = useState('');

  // New rule form
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [editingRule, setEditingRule] = useState<BoardRule | null>(null);

  // Transfer ownership dialog
  const [transferUsername, setTransferUsername] = useState('');
  const [transferMsg, setTransferMsg] = useState<string | null>(null);

  // Appoint mod dialog
  const [appointUsername, setAppointUsername] = useState('');
  const [appointMsg, setAppointMsg] = useState<string | null>(null);

  const [tabLoaded, setTabLoaded] = useState<Set<TabId>>(new Set<TabId>(['settings']));

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      if (!slug) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }
        setCurrentUserId(user.id);

        const boardData = await getBoardBySlug(slug);
        if (!boardData) { navigate('/boards'); return; }
        setBoard(boardData);

        const role = await getUserRoleInBoard(boardData.id, user.id);
        if (role !== 'owner' && role !== 'moderator') {
          navigate(`/b/${slug}`);
          return;
        }
        setUserRole(role);

        setSettingsForm({
          name: boardData.name,
          description: boardData.description || '',
          banner_image_url: boardData.banner_image_url || '',
          icon_image_url: boardData.icon_image_url || '',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [slug, navigate]);

  // ── Tab Data Loading ─────────────────────────────────────────────────────────

  const loadTab = useCallback(async (tab: TabId) => {
    if (!board || tabLoaded.has(tab)) return;
    setTabLoaded(prev => new Set(prev).add(tab));

    try {
      switch (tab) {
        case 'members':   setMembers(await getMembers(board.id)); break;
        case 'moderators':setModerators(await getModerators(board.id)); break;
        case 'bans':      setBanned(await getBannedMembers(board.id)); break;
        case 'rules':     setRules(await getBoardRules(board.id)); break;
        case 'modlog':    setModLog(await getModLog(board.id)); break;
        case 'reports':   setReports(await getReports(board.id)); break;
        default: break;
      }
    } catch (err) {
      console.error(`Error loading tab ${tab}:`, err);
    }
  }, [board, tabLoaded]);

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    loadTab(tab);
  };

  // ── Settings ─────────────────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    if (!board) return;
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      await updateBoardSettings(board.id, {
        name: settingsForm.name.trim(),
        description: settingsForm.description.trim(),
        banner_image_url: settingsForm.banner_image_url.trim() || undefined,
        icon_image_url: settingsForm.icon_image_url.trim() || undefined,
      });
      setSettingsMsg({ type: 'success', text: 'Settings saved successfully!' });
      setBoard(prev => prev ? { ...prev, ...settingsForm } : prev);
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Moderators ───────────────────────────────────────────────────────────────

  const handleAppointMod = async () => {
    if (!board || !appointUsername.trim()) return;
    setAppointMsg(null);
    try {
      // Look up user by username
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', appointUsername.trim())
        .maybeSingle();

      if (error || !profile) {
        setAppointMsg('User not found. Make sure they are a member of this Sphera first.');
        return;
      }

      await appointModerator(board.id, profile.id);
      setAppointUsername('');
      setAppointMsg('✅ Moderator appointed successfully!');
      setModerators(await getModerators(board.id));
      // Invalidate members tab
      setTabLoaded(prev => { const s = new Set(prev); s.delete('members'); return s; });
    } catch (err: any) {
      setAppointMsg(err.message || 'Failed to appoint moderator.');
    }
  };

  const handleRemoveMod = async (userId: string) => {
    if (!board || !window.confirm('Remove this moderator?')) return;
    try {
      await removeModerator(board.id, userId);
      setModerators(prev => prev.filter(m => m.user_id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Members ──────────────────────────────────────────────────────────────────

  const handleKickMember = async (userId: string, username: string) => {
    if (!board || !window.confirm(`Kick @${username} from this Sphera? They can rejoin.`)) return;
    try {
      await removeMember(board.id, userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  const openBanDialog = (userId: string, username: string) => {
    setBanTarget({ userId, username });
    setBanReason('');
    setBanExpiry('');
  };

  const handleBan = async () => {
    if (!board || !banTarget) return;
    try {
      await banMember(board.id, banTarget.userId, banReason, banExpiry || null);
      setBanTarget(null);
      setMembers(prev => prev.filter(m => m.user_id !== banTarget.userId));
      setBanned(await getBannedMembers(board.id));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Bans ─────────────────────────────────────────────────────────────────────

  const handleUnban = async (userId: string) => {
    if (!board) return;
    await unbanMember(board.id, userId);
    setBanned(prev => prev.filter(b => b.user_id !== userId));
  };

  // ── Rules ─────────────────────────────────────────────────────────────────────

  const handleCreateRule = async () => {
    if (!board || !newRuleTitle.trim()) return;
    try {
      const rule = await createRule(board.id, newRuleTitle.trim(), newRuleDesc.trim());
      setRules(prev => [...prev, rule]);
      setNewRuleTitle('');
      setNewRuleDesc('');
    } catch (err) { console.error(err); }
  };

  const handleUpdateRule = async () => {
    if (!board || !editingRule || !editingRule.title.trim()) return;
    try {
      const updated = await updateRule(editingRule.id, board.id, editingRule.title, editingRule.description || '');
      setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditingRule(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!board || !window.confirm('Delete this rule?')) return;
    await deleteRule(board.id, ruleId);
    setRules(prev => prev.filter(r => r.id !== ruleId));
  };

  // ── Reports ──────────────────────────────────────────────────────────────────

  const handleResolveReport = async (reportId: string, resolution: 'resolved' | 'dismissed') => {
    if (!board) return;
    await resolveReport(reportId, board.id, resolution);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: resolution } : r));
  };

  // ── Transfer Ownership ───────────────────────────────────────────────────────

  const handleTransferOwnership = async () => {
    if (!board || !transferUsername.trim()) return;
    if (!window.confirm(`Transfer ownership to @${transferUsername}? You will lose owner privileges.`)) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', transferUsername.trim())
        .maybeSingle();

      if (!profile) { setTransferMsg('User not found.'); return; }
      await transferOwnership(board.id, profile.id);
      setTransferMsg('Ownership transferred. Redirecting...');
      setTimeout(() => navigate(`/b/${slug}`), 2000);
    } catch (err: any) {
      setTransferMsg(err.message || 'Failed to transfer ownership.');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <LoadingText>Loading management panel...</LoadingText>;
  if (!board) return <LoadingText>Sphera not found.</LoadingText>;

  const isOwner = userRole === 'owner';

  const tabs = ([
    { id: 'settings', label: '⚙️ Settings', ownerOnly: true },
    { id: 'members', label: '👥 Members' },
    { id: 'moderators', label: '🛡️ Moderators' },
    { id: 'bans', label: '🚫 Bans' },
    { id: 'rules', label: '📋 Rules' },
    { id: 'reports', label: '🚩 Reports' },
    { id: 'modlog', label: '📜 Mod Log' },
  ] as { id: TabId; label: string; ownerOnly?: boolean }[]).filter(t => !t.ownerOnly || isOwner);

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader>
        <BackLink to={`/b/${board.slug}`}>← Back to {board.name}</BackLink>
        <PageTitle>Manage Sphera</PageTitle>
        <RoleBadge $role={userRole || 'member'}>{userRole === 'owner' ? '👑 Owner' : '🛡️ Moderator'}</RoleBadge>
      </PageHeader>

      {/* Tab Bar */}
      <TabBar>
        {tabs.map(t => (
          <Tab key={t.id} $active={activeTab === t.id} onClick={() => switchTab(t.id)}>
            {t.label}
          </Tab>
        ))}
      </TabBar>

      {/* ─── SETTINGS TAB ─── */}
      {activeTab === 'settings' && isOwner && (
        <div>
          <Card>
            <CardTitle>✏️ Sphera Info</CardTitle>
            {settingsMsg && (
              settingsMsg.type === 'success'
                ? <SuccessMsg>{settingsMsg.text}</SuccessMsg>
                : <ErrorMsg>{settingsMsg.text}</ErrorMsg>
            )}
            <FormGroup>
              <Label>Sphera Name</Label>
              <Input
                value={settingsForm.name}
                onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))}
                maxLength={100}
              />
            </FormGroup>
            <FormGroup>
              <Label>Description</Label>
              <Textarea
                value={settingsForm.description}
                onChange={e => setSettingsForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What is this Sphera about?"
              />
            </FormGroup>
            <FormGroup>
              <Label>Banner Image URL</Label>
              <Input
                value={settingsForm.banner_image_url}
                onChange={e => setSettingsForm(p => ({ ...p, banner_image_url: e.target.value }))}
                placeholder="https://..."
                type="url"
              />
            </FormGroup>
            <FormGroup>
              <Label>Icon Image URL</Label>
              <Input
                value={settingsForm.icon_image_url}
                onChange={e => setSettingsForm(p => ({ ...p, icon_image_url: e.target.value }))}
                placeholder="https://..."
                type="url"
              />
            </FormGroup>
            <PrimaryButton onClick={handleSaveSettings} disabled={settingsSaving}>
              {settingsSaving ? 'Saving...' : '💾 Save Settings'}
            </PrimaryButton>
          </Card>

          {/* Transfer Ownership */}
          <DangerZone>
            <DangerZoneTitle>⚠️ Danger Zone</DangerZoneTitle>
            <FormGroup>
              <Label>Transfer Ownership</Label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Input
                  value={transferUsername}
                  onChange={e => setTransferUsername(e.target.value)}
                  placeholder="Enter username of new owner"
                  style={{ maxWidth: 280 }}
                />
                <DangerButton onClick={handleTransferOwnership}>Transfer</DangerButton>
              </div>
              {transferMsg && <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#dc004e' }}>{transferMsg}</div>}
              <div style={{ fontSize: '0.8rem', color: '#999', marginTop: 6 }}>
                This cannot be undone. The new owner must be a member of this Sphera.
              </div>
            </FormGroup>
          </DangerZone>
        </div>
      )}

      {/* ─── MEMBERS TAB ─── */}
      {activeTab === 'members' && (
        <Card>
          <CardTitle>👥 Members ({members.length})</CardTitle>
          {members.length === 0 ? (
            <EmptyState>No members yet.</EmptyState>
          ) : (
            members.map(m => (
              <MemberRow key={m.user_id}>
                <Avatar src={m.profiles?.avatar_url || 'https://via.placeholder.com/38'} alt={m.profiles?.username} />
                <MemberName>@{m.profiles?.username || 'Unknown'}</MemberName>
                <RoleBadge $role={m.role}>{m.role}</RoleBadge>
                <BtnGroup>
                  {m.role !== 'owner' && m.user_id !== currentUserId && (
                    <>
                      <SecondaryButton onClick={() => handleKickMember(m.user_id, m.profiles?.username || '')}>
                        Kick
                      </SecondaryButton>
                      <DangerButton onClick={() => openBanDialog(m.user_id, m.profiles?.username || '')}>
                        Ban
                      </DangerButton>
                    </>
                  )}
                </BtnGroup>
              </MemberRow>
            ))
          )}
        </Card>
      )}

      {/* ─── MODERATORS TAB ─── */}
      {activeTab === 'moderators' && (
        <div>
          {isOwner && (
            <Card>
              <CardTitle>➕ Appoint Moderator</CardTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Input
                  value={appointUsername}
                  onChange={e => setAppointUsername(e.target.value)}
                  placeholder="Enter username"
                  style={{ maxWidth: 260 }}
                />
                <PrimaryButton onClick={handleAppointMod}>Appoint</PrimaryButton>
              </div>
              {appointMsg && <div style={{ marginTop: 8, fontSize: '0.85rem', color: appointMsg.startsWith('✅') ? '#2e7d32' : '#dc004e' }}>{appointMsg}</div>}
            </Card>
          )}
          <Card>
            <CardTitle>🛡️ Current Moderators ({moderators.length})</CardTitle>
            {moderators.length === 0 ? (
              <EmptyState>No moderators yet. Appoint someone above.</EmptyState>
            ) : (
              moderators.map(mod => (
                <MemberRow key={mod.user_id}>
                  <Avatar src={mod.profiles?.avatar_url || 'https://via.placeholder.com/38'} alt={mod.profiles?.username} />
                  <MemberName>@{mod.profiles?.username || 'Unknown'}</MemberName>
                  <RoleBadge $role="moderator">Moderator</RoleBadge>
                  {isOwner && mod.user_id !== currentUserId && (
                    <DangerButton onClick={() => handleRemoveMod(mod.user_id)}>Remove</DangerButton>
                  )}
                </MemberRow>
              ))
            )}
          </Card>
        </div>
      )}

      {/* ─── BANS TAB ─── */}
      {activeTab === 'bans' && (
        <Card>
          <CardTitle>🚫 Banned Users ({banned.length})</CardTitle>
          {banned.length === 0 ? (
            <EmptyState>No banned users.</EmptyState>
          ) : (
            banned.map(ban => (
              <MemberRow key={ban.user_id}>
                <Avatar src={ban.profiles?.avatar_url || 'https://via.placeholder.com/38'} alt={ban.profiles?.username} />
                <MemberName>@{ban.profiles?.username || 'Unknown'}</MemberName>
                <div style={{ fontSize: '0.8rem', color: '#666', flex: 1 }}>
                  {ban.reason && <div><strong>Reason:</strong> {ban.reason}</div>}
                  {ban.expires_at ? (
                    <div><strong>Expires:</strong> {new Date(ban.expires_at).toLocaleDateString()}</div>
                  ) : (
                    <div style={{ color: '#dc004e' }}>Permanent</div>
                  )}
                </div>
                <SuccessButton onClick={() => handleUnban(ban.user_id)}>Unban</SuccessButton>
              </MemberRow>
            ))
          )}
        </Card>
      )}

      {/* ─── RULES TAB ─── */}
      {activeTab === 'rules' && (
        <div>
          <Card>
            <CardTitle>➕ {editingRule ? 'Edit Rule' : 'Add New Rule'}</CardTitle>
            <FormGroup>
              <Label>Rule Title *</Label>
              <Input
                value={editingRule ? editingRule.title : newRuleTitle}
                onChange={e => editingRule
                  ? setEditingRule({ ...editingRule, title: e.target.value })
                  : setNewRuleTitle(e.target.value)
                }
                placeholder="e.g. Be respectful"
                maxLength={100}
              />
            </FormGroup>
            <FormGroup>
              <Label>Description (optional)</Label>
              <Textarea
                value={editingRule ? (editingRule.description || '') : newRuleDesc}
                onChange={e => editingRule
                  ? setEditingRule({ ...editingRule, description: e.target.value })
                  : setNewRuleDesc(e.target.value)
                }
                placeholder="Elaborate on the rule..."
                style={{ minHeight: 70 }}
              />
            </FormGroup>
            <BtnGroup>
              {editingRule ? (
                <>
                  <PrimaryButton onClick={handleUpdateRule}>Save Changes</PrimaryButton>
                  <SecondaryButton onClick={() => setEditingRule(null)}>Cancel</SecondaryButton>
                </>
              ) : (
                <PrimaryButton onClick={handleCreateRule} disabled={!newRuleTitle.trim()}>Add Rule</PrimaryButton>
              )}
            </BtnGroup>
          </Card>

          <Card>
            <CardTitle>📋 Rules ({rules.length})</CardTitle>
            {rules.length === 0 ? (
              <EmptyState>No rules yet. Add your first rule above.</EmptyState>
            ) : (
              rules.map((rule, i) => (
                <RuleCard key={rule.id}>
                  <RuleNum>{i + 1}</RuleNum>
                  <RuleBody>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{rule.title}</div>
                    {rule.description && <div style={{ fontSize: '0.85rem', color: '#666' }}>{rule.description}</div>}
                  </RuleBody>
                  <BtnGroup>
                    <SecondaryButton onClick={() => setEditingRule(rule)}>Edit</SecondaryButton>
                    <DangerButton onClick={() => handleDeleteRule(rule.id)}>Delete</DangerButton>
                  </BtnGroup>
                </RuleCard>
              ))
            )}
          </Card>
        </div>
      )}

      {/* ─── REPORTS TAB ─── */}
      {activeTab === 'reports' && (
        <Card>
          <CardTitle>🚩 Post Reports ({reports.filter(r => r.status === 'pending').length} pending)</CardTitle>
          {reports.length === 0 ? (
            <EmptyState>No reports yet. 🎉</EmptyState>
          ) : (
            reports.map(report => (
              <div key={report.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(52, 165, 216, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <StatusBadge $status={report.status}>{report.status}</StatusBadge>
                    <div style={{ marginTop: 8, fontWeight: 600, fontSize: '0.9rem' }}>
                      Reason: {report.reason}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>
                      Reported by @{report.reporter_profile?.username || 'Unknown'} • {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    {(report.posts as any)?.content && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, fontSize: '0.85rem', color: '#555', maxWidth: 400 }}>
                        <strong>Post by @{(report.posts as any).profiles?.username}:</strong>{' '}
                        <span dangerouslySetInnerHTML={{ __html: ((report.posts as any).content || '').substring(0, 120) + '...' }} />
                      </div>
                    )}
                  </div>
                  {report.status === 'pending' && (
                    <BtnGroup>
                      <DangerButton onClick={() => handleResolveReport(report.id, 'resolved')}>
                        Remove Post
                      </DangerButton>
                      <SecondaryButton onClick={() => handleResolveReport(report.id, 'dismissed')}>
                        Dismiss
                      </SecondaryButton>
                    </BtnGroup>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* ─── MOD LOG TAB ─── */}
      {activeTab === 'modlog' && (
        <Card>
          <CardTitle>📜 Mod Log ({modLog.length} entries)</CardTitle>
          {modLog.length === 0 ? (
            <EmptyState>No actions logged yet.</EmptyState>
          ) : (
            modLog.map(entry => (
              <LogEntry key={entry.id}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <ActionBadge>{entry.action.replace(/_/g, ' ')}</ActionBadge>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    by @{(entry as any).mod_profile?.username || 'System'}
                  </span>
                  {(entry as any).target_profile && (
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      → @{(entry as any).target_profile.username}
                    </span>
                  )}
                </div>
                {entry.reason && (
                  <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 4 }}>
                    Reason: {entry.reason}
                  </div>
                )}
                <LogMeta>{new Date(entry.created_at).toLocaleString()}</LogMeta>
              </LogEntry>
            ))
          )}
        </Card>
      )}

      {/* ─── BAN DIALOG MODAL ─── */}
      {banTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20,
        }}>
          <Card style={{ maxWidth: 440, width: '100%', margin: 0 }}>
            <CardTitle>🚫 Ban @{banTarget.username}</CardTitle>
            <FormGroup>
              <Label>Reason (optional)</Label>
              <Textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="Why is this user being banned?"
                style={{ minHeight: 70 }}
              />
            </FormGroup>
            <FormGroup>
              <Label>Ban Expiry (optional, leave blank for permanent)</Label>
              <Input
                type="datetime-local"
                value={banExpiry}
                onChange={e => setBanExpiry(e.target.value)}
              />
            </FormGroup>
            <BtnGroup>
              <DangerButton onClick={handleBan}>Confirm Ban</DangerButton>
              <SecondaryButton onClick={() => setBanTarget(null)}>Cancel</SecondaryButton>
            </BtnGroup>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default ManageSpheraPage;
