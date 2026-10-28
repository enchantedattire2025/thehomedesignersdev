import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Clock, CheckCircle2, XCircle, Gift } from 'lucide-react';
import { fetchMyCommunityActivity } from '../../lib/communityApi';
import type { MyCommunityActivity } from '../../lib/communityApi';

const statusStyles: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  pending: { label: 'Pending designer approval', className: 'bg-amber-50 text-amber-800', Icon: Clock },
  approved: { label: 'Approved - review your quotation', className: 'bg-sky-50 text-sky-800', Icon: CheckCircle2 },
  accepted: { label: 'Joined', className: 'bg-green-50 text-green-800', Icon: CheckCircle2 },
  rejected: { label: 'Not approved', className: 'bg-red-50 text-red-700', Icon: XCircle },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const CommunityActivityPanel: React.FC = () => {
  const [activity, setActivity] = useState<MyCommunityActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchMyCommunityActivity()
      .then((data) => active && setActivity(data))
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>We could not load your community activity. {error}</span>
      </div>
    );
  }

  if (!activity || (activity.requests.length === 0 && activity.rewards.length === 0)) {
    return <p className="text-sm text-gray-600">You have no community join requests or referral rewards yet.</p>;
  }

  const totalReward = activity.rewards.reduce((sum, reward) => sum + Number(reward.reward_amount), 0);

  return (
    <div className="space-y-8">
      {activity.rewards.length > 0 && (
        <div className="rounded-2xl border border-green-100 bg-green-50/60 p-6">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-green-700" />
            <h3 className="font-semibold text-secondary-900">Referral rewards</h3>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Total recorded: <span className="font-semibold text-secondary-900">{formatCurrency(totalReward)}</span>. Your own quotation is unchanged.
          </p>
          <ul className="mt-4 divide-y divide-green-100">
            {activity.rewards.map((reward) => (
              <li key={reward.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-gray-700">
                  {reward.reward_percent}% of {formatCurrency(Number(reward.base_amount))}
                </span>
                <span className="font-semibold text-secondary-900">{formatCurrency(Number(reward.reward_amount))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activity.requests.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {activity.requests.map((request) => {
            const style = statusStyles[request.status] ?? statusStyles.pending;
            const StatusIcon = style.Icon;
            return (
              <li key={request.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-secondary-900">{request.source_project_name || 'Community project'}</p>
                    <p className="mt-1 text-sm text-gray-600">Designer: {request.designer_name || 'Designer'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${style.className}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {style.label}
                  </span>
                </div>
                {request.status === 'rejected' && request.rejection_reason && (
                  <p className="mt-3 text-sm text-gray-600">Reason: {request.rejection_reason}</p>
                )}
                {request.status === 'approved' && (
                  <p className="mt-3 text-sm text-gray-600">
                    Your project &ldquo;{request.my_project_name}&rdquo; now has its own quotation. Find it under My Projects to review and accept.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CommunityActivityPanel;
