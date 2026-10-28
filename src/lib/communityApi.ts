import { supabase } from './supabase';

export interface CommunityListing {
  community_project_id: string;
  project_name: string | null;
  township: string | null;
  property_type: string | null;
  project_area: string | null;
  budget_range: string | null;
  timeline: string | null;
  designer_id: string;
  designer_name: string | null;
  project_value: number | null;
  max_participants: number;
  participant_count: number;
  my_status: string | null;
}

export interface DesignerCommunityProject {
  customer_id: string;
  project_name: string | null;
  township: string | null;
  community_project_id: string | null;
  is_open: boolean;
  max_participants: number;
  participant_count: number;
}

export interface DesignerJoinRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'accepted';
  requested_at: string;
  decided_at: string | null;
  rejection_reason: string | null;
  source_project_name: string | null;
  requester_name: string | null;
  requester_project_name: string | null;
  township: string | null;
  property_type: string | null;
  project_area: string | null;
  budget_range: string | null;
  requirements: string | null;
}

export interface DesignerCommunityOverview {
  projects: DesignerCommunityProject[];
  requests: DesignerJoinRequest[];
}

export interface MyJoinRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'accepted';
  requested_at: string;
  source_project_name: string | null;
  designer_name: string | null;
  my_project_name: string | null;
  new_customer_id: string | null;
  cloned_quote_id: string | null;
  rejection_reason: string | null;
}

export interface MyReferralReward {
  id: string;
  reward_percent: number;
  base_amount: number;
  reward_amount: number;
  status: 'earned' | 'applied' | 'reversed';
  created_at: string;
}

export interface MyCommunityActivity {
  requests: MyJoinRequest[];
  rewards: MyReferralReward[];
}

export interface OwnProjectOption {
  id: string;
  project_name: string;
  location: string | null;
}

const isArray = <T,>(value: unknown): value is T[] => Array.isArray(value);

export async function fetchCommunityListings(): Promise<CommunityListing[]> {
  const { data, error } = await supabase.rpc('get_community_listings');
  if (error) throw new Error(error.message);
  if (!isArray<CommunityListing>(data)) throw new Error('Unexpected response while loading community projects.');
  return data;
}

export async function fetchDesignerCommunityOverview(): Promise<DesignerCommunityOverview> {
  const { data, error } = await supabase.rpc('get_designer_community_overview');
  if (error) throw new Error(error.message);
  const payload = data as Partial<DesignerCommunityOverview> | null;
  if (!payload || !isArray<DesignerCommunityProject>(payload.projects) || !isArray<DesignerJoinRequest>(payload.requests)) {
    throw new Error('Unexpected response while loading community requests.');
  }
  return { projects: payload.projects, requests: payload.requests };
}

export async function fetchMyCommunityActivity(): Promise<MyCommunityActivity> {
  const { data, error } = await supabase.rpc('get_my_community_activity');
  if (error) throw new Error(error.message);
  const payload = data as Partial<MyCommunityActivity> | null;
  if (!payload || !isArray<MyJoinRequest>(payload.requests) || !isArray<MyReferralReward>(payload.rewards)) {
    throw new Error('Unexpected response while loading your community activity.');
  }
  return { requests: payload.requests, rewards: payload.rewards };
}

export async function fetchOwnProjects(userId: string): Promise<OwnProjectOption[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, project_name, location')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OwnProjectOption[];
}

export async function requestCommunityJoin(communityProjectId: string, requesterCustomerId: string): Promise<string> {
  const { data, error } = await supabase.rpc('request_community_join', {
    p_community_project_id: communityProjectId,
    p_requester_customer_id: requesterCustomerId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function setCommunityListing(customerId: string, isOpen: boolean, maxParticipants: number): Promise<void> {
  const { error } = await supabase.rpc('set_community_listing', {
    p_customer_id: customerId,
    p_is_open: isOpen,
    p_max_participants: maxParticipants,
  });
  if (error) throw new Error(error.message);
}

export async function decideCommunityJoinRequest(requestId: string, decision: 'approve' | 'reject', reason?: string): Promise<void> {
  const { error } = await supabase.rpc('decide_community_join_request', {
    p_request_id: requestId,
    p_decision: decision,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
}
