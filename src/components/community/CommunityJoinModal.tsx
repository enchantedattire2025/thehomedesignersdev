import React, { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CommunityListing, OwnProjectOption } from '../../lib/communityApi';
import { fetchOwnProjects, requestCommunityJoin } from '../../lib/communityApi';

interface CommunityJoinModalProps {
  listing: CommunityListing;
  userId: string;
  onClose: () => void;
  onRequested: () => void;
}

const CommunityJoinModal: React.FC<CommunityJoinModalProps> = ({ listing, userId, onClose, onRequested }) => {
  const [projects, setProjects] = useState<OwnProjectOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    fetchOwnProjects(userId)
      .then((rows) => {
        if (!active) return;
        setProjects(rows);
        if (rows.length === 1) setSelectedId(rows[0].id);
      })
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestCommunityJoin(listing.community_project_id, selectedId);
      setDone(true);
      onRequested();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-semibold text-secondary-900">Join this project</h2>
            <p className="mt-1 text-sm text-gray-600">{listing.project_name || 'Community project'}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-4 text-lg font-semibold text-secondary-900">Request sent</h3>
            <p className="mt-2 text-sm text-gray-600">
              The designer has been notified and will review your request against their capacity. You will be notified when it is decided.
            </p>
            <button onClick={onClose} className="mt-6 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-sm text-gray-600">
              Choose the project whose requirements should be used for your join. Your own quotation will be prepared by the designer after approval, with a 3% community discount.
            </p>

            {loading ? (
              <div className="mt-6 flex items-center justify-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                You need a project of your own before you can join one. Create your project first, then come back here.
              </div>
            ) : (
              <fieldset className="mt-6 space-y-3">
                <legend className="mb-2 text-sm font-medium text-gray-700">Your project</legend>
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                      selectedId === project.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span>
                      <span className="block font-medium text-secondary-900">{project.project_name}</span>
                      {project.location && <span className="block text-sm text-gray-600">{project.location}</span>}
                    </span>
                    <input
                      type="radio"
                      name="own-project"
                      value={project.id}
                      checked={selectedId === project.id}
                      onChange={() => setSelectedId(project.id)}
                      className="h-4 w-4 text-primary-600"
                    />
                  </label>
                ))}
              </fieldset>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="rounded-lg px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedId || submitting}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send join request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityJoinModal;
