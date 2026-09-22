import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2, Info, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';

interface ProjectStatusUpdateProps {
  projectId: string;
  currentStatus: string;
  onStatusUpdate: () => void;
}

interface CompletionDetails {
  challenges_solutions: string;
  project_timeline_details: string;
  materials_cost_breakdown: string;
}

const ProjectStatusUpdate: React.FC<ProjectStatusUpdateProps> = ({
  projectId,
  currentStatus,
  onStatusUpdate
}) => {
  const { user } = useAuth();
  const { designer, isDesigner } = useDesignerProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionDetails, setCompletionDetails] = useState<CompletionDetails>({
    challenges_solutions: '',
    project_timeline_details: '',
    materials_cost_breakdown: ''
  });

  // Define status progression logic
  const isStatusDisabled = (status: string) => {
    // Once completed, no status changes allowed
    if (currentStatus === 'completed') {
      return true;
    }

    // Once a project is finalized, it cannot go back to assigned or pending
    if (['finalized', 'in_progress'].includes(currentStatus)) {
      return ['assigned', 'pending'].includes(status);
    }
    return false;
  };

  const statusOptions = [
    { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'finalized', label: 'Finalized', color: 'bg-purple-100 text-purple-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' }
  ];

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !isDesigner || !designer) {
      setError('You must be logged in as a designer to update project status');
      return;
    }

    if (newStatus === currentStatus) {
      return; // No change needed
    }

    // If marking as completed, show modal to collect completion details
    if (newStatus === 'completed') {
      setShowCompletionModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update the project status
      const { error } = await supabase
        .from('customers')
        .update({
          assignment_status: newStatus,
          last_modified_by: user.id
        })
        .eq('id', projectId)
        .eq('assigned_designer_id', designer.id);

      if (error) throw error;

      setSuccess(`Project status updated to ${newStatus}`);
      onStatusUpdate();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating project status:', error);
      setError(error.message || 'Failed to update project status');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProject = async () => {
    if (!user || !isDesigner || !designer) {
      setError('You must be logged in as a designer to complete projects');
      return;
    }

    // Validate that all fields are filled
    if (!completionDetails.challenges_solutions.trim()) {
      setError('Please provide challenges and solutions details');
      return;
    }

    if (!completionDetails.project_timeline_details.trim()) {
      setError('Please provide project timeline details');
      return;
    }

    if (!completionDetails.materials_cost_breakdown.trim()) {
      setError('Please provide materials and cost breakdown');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update the project status along with completion details
      const { error } = await supabase
        .from('customers')
        .update({
          assignment_status: 'completed',
          last_modified_by: user.id,
          challenges_solutions: completionDetails.challenges_solutions,
          project_timeline_details: completionDetails.project_timeline_details,
          materials_cost_breakdown: completionDetails.materials_cost_breakdown
        })
        .eq('id', projectId)
        .eq('assigned_designer_id', designer.id);

      if (error) throw error;

      setSuccess('Project marked as completed successfully!');
      setShowCompletionModal(false);
      onStatusUpdate();

      // Clear form
      setCompletionDetails({
        challenges_solutions: '',
        project_timeline_details: '',
        materials_cost_breakdown: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error completing project:', error);
      setError(error.message || 'Failed to complete project');
    } finally {
      setLoading(false);
    }
  };

  // Only show for designers
  if (!isDesigner) return null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary-600" />
          Project Status
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              disabled={loading || status.value === currentStatus || isStatusDisabled(status.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                status.value === currentStatus
                  ? `${status.color} border border-current`
                  : isStatusDisabled(status.value)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {status.value === currentStatus && loading ? (
                <Loader2 className="w-4 h-4 mr-1 inline animate-spin" />
              ) : null}
              {status.label}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-500 space-y-2">
          <p>Current status: <span className="font-medium">{currentStatus || 'Not set'}</span></p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>

          {currentStatus === 'completed' && (
            <div className="flex items-start space-x-2 text-green-600 bg-green-50 p-3 rounded-lg mt-3">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                This project is marked as completed. No further status changes or edits are allowed.
                All project details and updates are now locked.
              </p>
            </div>
          )}

          {['finalized', 'in_progress'].includes(currentStatus) && (
            <div className="flex items-start space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg mt-3">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Once a project is finalized, it cannot be moved back to assigned or pending status.
                This ensures project continuity and maintains the integrity of the workflow.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Details Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-secondary-800">Complete Project</h2>
                <p className="text-gray-600 mt-1">
                  Please provide details about the completed project. This information will be visible to all users.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Challenges & Solutions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenges & Solutions <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completionDetails.challenges_solutions}
                  onChange={(e) => setCompletionDetails({
                    ...completionDetails,
                    challenges_solutions: e.target.value
                  })}
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe the challenges you faced during the project and how you solved them. This helps customers understand your problem-solving approach."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Example: "The main challenge was maximizing space in a small living room. We solved it by using multifunctional furniture and strategic mirror placement to create an illusion of space."
                </p>
              </div>

              {/* Project Timeline Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Timeline Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completionDetails.project_timeline_details}
                  onChange={(e) => setCompletionDetails({
                    ...completionDetails,
                    project_timeline_details: e.target.value
                  })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Provide a detailed timeline of the project execution, including key milestones and completion dates."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Example: "Week 1-2: Planning and design finalization. Week 3-4: Demolition and structural work. Week 5-6: Electrical and plumbing. Week 7-8: Finishing touches and handover."
                </p>
              </div>

              {/* Materials & Cost Breakdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materials & Cost Breakdown <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completionDetails.materials_cost_breakdown}
                  onChange={(e) => setCompletionDetails({
                    ...completionDetails,
                    materials_cost_breakdown: e.target.value
                  })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="List the materials used and their approximate costs. This helps customers understand budget allocation."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Example: "Flooring (Laminate): Rs. 50,000 | Paint & Primer: Rs. 15,000 | Furniture: Rs. 1,20,000 | Lighting Fixtures: Rs. 25,000 | Decorative Items: Rs. 20,000 | Labor: Rs. 70,000"
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important Note</p>
                    <p>
                      Once you mark this project as completed, it will become visible to all users on the platform.
                      The details you provide here will help potential customers understand your work process and quality.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    setError(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteProject}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Mark as Completed</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectStatusUpdate;