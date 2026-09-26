import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  CreditCard as Edit,
  Trash2,
  Search,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  TrendingDown,
  Tag,
  Video,
  Settings,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AdminStats {
  totalDesigners: number;
  verifiedDesigners: number;
  totalCustomers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingVerifications: number;
  monthlyGrowth: number;
  totalEarnings: number;
  platformCommission: number;
}

interface Designer {
  id: string;
  name: string;
  email: string;
  specialization: string;
  location: string;
  experience: number;
  is_verified: boolean;
  is_active: boolean;
  total_projects: number;
  rating: number;
  created_at: string;
  verification_status: string;
  rejected_reason?: string;
  verified_at?: string;
}

interface Customer {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  project_name: string;
  budget_range: string;
  status: string;
  created_at: string;
}

interface DesignerEarning {
  id: string;
  designer_id: string;
  project_name: string;
  project_type: string;
  project_value: number;
  designer_earnings: number;
  platform_commission: number;
  commission_percentage: number;
  payment_status: string;
  completed_at: string;
  designers?: { name: string };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'designers' | 'customers' | 'projects' | 'earnings'
  >('overview');

  const [isAdmin, setIsAdmin] = useState(false);

  const [stats, setStats] = useState<AdminStats>({
    totalDesigners: 0,
    verifiedDesigners: 0,
    totalCustomers: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingVerifications: 0,
    monthlyGrowth: 0,
    totalEarnings: 0,
    platformCommission: 0
  });

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [earnings, setEarnings] = useState<DesignerEarning[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingDesigner, setEditingDesigner] =
    useState<Designer | null>(null);

  const [savingDesigner, setSavingDesigner] = useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [savingCustomer, setSavingCustomer] = useState(false);

  const [subscriptionManagementEnabled, setSubscriptionManagementEnabled] =
    useState(false);

  const [updatingSettings, setUpdatingSettings] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user) {
      checkAdminStatus();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
      fetchPlatformSettings();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch designers
      const {
        data: designersData,
        error: designersError
      } = await supabase
        .from('designers')
        .select('*')
        .order('created_at', { ascending: false });

      if (designersError) throw designersError;

      // Fetch customers
      const {
        data: customersData,
        error: customersError
      } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Fetch earnings
      const {
        data: earningsData,
        error: earningsError
      } = await supabase
        .from('designer_projects_earnings')
        .select(`
          *,
          designers (name)
        `)
        .order('completed_at', { ascending: false });

      if (earningsError) throw earningsError;

      setDesigners(designersData || []);
      setCustomers(customersData || []);
      setEarnings(earningsData || []);

      // Calculate stats
      const totalDesigners = designersData?.length || 0;

      const verifiedDesigners =
        designersData?.filter(
          d => d.verification_status === 'verified'
        ).length || 0;

      const totalCustomers = customersData?.length || 0;

      const totalProjects = customersData?.length || 0;

      const activeProjects =
        customersData?.filter(
          c =>
            c.status === 'assigned' ||
            c.status === 'in_progress'
        ).length || 0;

      const completedProjects =
        customersData?.filter(
          c => c.status === 'completed'
        ).length || 0;

      const pendingVerifications =
        designersData?.filter(
          d => d.verification_status === 'pending'
        ).length || 0;

      // Calculate earnings
      const totalEarnings =
        earningsData?.reduce(
          (sum, e) => sum + Number(e.project_value),
          0
        ) || 0;

      const platformCommission =
        earningsData?.reduce(
          (sum, e) => sum + Number(e.platform_commission),
          0
        ) || 0;

      setStats({
        totalDesigners,
        verifiedDesigners,
        totalCustomers,
        totalProjects,
        activeProjects,
        completedProjects,
        pendingVerifications,
        monthlyGrowth: 12.5,
        totalEarnings,
        platformCommission
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('is_active')
        .eq(
          'setting_key',
          'subscription_management_enabled'
        )
        .maybeSingle();

      if (error) throw error;

      setSubscriptionManagementEnabled(
        data?.is_active || false
      );
    } catch (error) {
      console.error(
        'Error fetching platform settings:',
        error
      );
    }
  };

  const handleToggleSubscriptionManagement = async () => {
    try {
      setUpdatingSettings(true);

      const newValue =
        !subscriptionManagementEnabled;

      const { error } = await supabase
        .from('site_settings')
        .update({
          is_active: newValue,
          updated_at: new Date().toISOString()
        })
        .eq(
          'setting_key',
          'subscription_management_enabled'
        );

      if (error) throw error;

      setSubscriptionManagementEnabled(newValue);
    } catch (error) {
      console.error(
        'Error updating subscription management setting:',
        error
      );

      alert(
        'Failed to update setting. Please try again.'
      );
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleVerifyDesigner = async (
    designerId: string,
    newStatus: string,
    rejectionReason?: string
  ) => {
    try {
      const updateData: any = {
        verification_status: newStatus,
        is_verified: newStatus === 'verified'
      };

      if (newStatus === 'verified') {
        updateData.verified_at =
          new Date().toISOString();

        updateData.rejected_reason = null;
      } else if (
        newStatus === 'rejected' &&
        rejectionReason
      ) {
        updateData.rejected_reason =
          rejectionReason;

        updateData.verified_at = null;
      }

      const { error } = await supabase
        .from('designers')
        .update(updateData)
        .eq('id', designerId);

      if (error) throw error;

      setDesigners(prev =>
        prev.map(d =>
          d.id === designerId
            ? {
                ...d,
                verification_status: newStatus,
                is_verified:
                  newStatus === 'verified',
                verified_at:
                  updateData.verified_at,
                rejected_reason:
                  updateData.rejected_reason
              }
            : d
        )
      );

      fetchAdminData();

      alert(
        `Designer ${
          newStatus === 'verified'
            ? 'approved'
            : newStatus
        } successfully!`
      );
    } catch (error) {
      console.error(
        'Error updating designer verification:',
        error
      );

      alert(
        'Failed to update designer verification status. Please try again.'
      );
    }
  };

  const handleApproveDesigner = (
    designerId: string
  ) => {
    if (
      confirm(
        'Are you sure you want to approve this designer?'
      )
    ) {
      handleVerifyDesigner(
        designerId,
        'verified'
      );
    }
  };

  const handleRejectDesigner = (
    designerId: string
  ) => {
    const reason = prompt(
      'Please enter the reason for rejection:'
    );

    if (reason && reason.trim()) {
      handleVerifyDesigner(
        designerId,
        'rejected',
        reason.trim()
      );
    } else if (reason !== null) {
      alert(
        'Rejection reason is required.'
      );
    }
  };

  const handleToggleDesignerStatus = async (
    designerId: string,
    active: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('designers')
        .update({
          is_active: active
        })
        .eq('id', designerId);

      if (error) throw error;

      setDesigners(prev =>
        prev.map(d =>
          d.id === designerId
            ? {
                ...d,
                is_active: active
              }
            : d
        )
      );
    } catch (error) {
      console.error(
        'Error updating designer status:',
        error
      );
    }
  };

  const handleSaveDesigner = async () => {
    if (!editingDesigner) return;

    try {
      setSavingDesigner(true);

      const { error } = await supabase
        .from('designers')
        .update({
          name: editingDesigner.name,
          email: editingDesigner.email,
          specialization:
            editingDesigner.specialization,
          location: editingDesigner.location,
          experience: editingDesigner.experience
        })
        .eq('id', editingDesigner.id);

      if (error) throw error;

      setDesigners(prev =>
        prev.map(d =>
          d.id === editingDesigner.id
            ? editingDesigner
            : d
        )
      );

      setEditingDesigner(null);

      alert(
        'Designer updated successfully!'
      );
    } catch (error) {
      console.error(
        'Error updating designer:',
        error
      );

      alert(
        'Failed to update designer. Please try again.'
      );
    } finally {
      setSavingDesigner(false);
    }
  };

  // =========================
  // CUSTOMER FUNCTIONS
  // =========================

  const handleViewCustomer = (
    customer: Customer
  ) => {
    setSelectedCustomer(customer);
  };

  const handleEditCustomer = (
    customer: Customer
  ) => {
    setEditingCustomer({
      ...customer
    });
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer) return;

    try {
      setSavingCustomer(true);

      const { error } = await supabase
        .from('customers')
        .update({
          name: editingCustomer.name,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          location: editingCustomer.location,
          project_name:
            editingCustomer.project_name,
          budget_range:
            editingCustomer.budget_range,
          status: editingCustomer.status
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;

      setCustomers(prev =>
        prev.map(customer =>
          customer.id === editingCustomer.id
            ? editingCustomer
            : customer
        )
      );

      setEditingCustomer(null);

      alert(
        'Customer updated successfully!'
      );
    } catch (error) {
      console.error(
        'Error updating customer:',
        error
      );

      alert(
        'Failed to update customer. Please try again.'
      );
    } finally {
      setSavingCustomer(false);
    }
  };

  const filteredDesigners =
    designers.filter(designer =>
      designer.name
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        ) ||
      designer.email
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        ) ||
      designer.specialization
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
    );

  const filteredCustomers =
    customers.filter(customer =>
      customer.name
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        ) ||
      customer.email
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        ) ||
      customer.project_name
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
    );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>

          <p className="text-gray-600">
            {authLoading
              ? 'Checking authorization...'
              : 'Loading admin dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>

          <p className="text-gray-600 mb-6">
            Please log in to access the admin dashboard.
          </p>

          <button
            onClick={() => navigate('/')}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors"
          >
            Go to Home
          </button>

        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>

          <p className="text-gray-600 mb-2">
            You do not have permission to access this page.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            This area is restricted to administrators only.
          </p>

          <button
            onClick={() => navigate('/')}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors"
          >
            Go to Home
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =========================
          HEADER
      ========================= */}

      <div className="bg-white shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-3xl font-bold text-secondary-800">
                Admin Dashboard
              </h1>

              <p className="text-gray-600 mt-2">
                Manage your platform and monitor performance
              </p>
            </div>

            <div className="flex space-x-4">

              <button
                onClick={() =>
                  navigate('/admin/deals')
                }
                className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 flex items-center space-x-2 transition-colors"
              >
                <Tag className="w-4 h-4" />
                <span>Manage Deals</span>
              </button>

              <button
                onClick={() =>
                  navigate('/admin/video')
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Video className="w-4 h-4" />
                <span>Video Settings</span>
              </button>

              <button
                onClick={() =>
                  navigate('/admin/whatsapp')
                }
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Settings</span>
              </button>

              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>

              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center space-x-2 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* =========================
            TAB NAVIGATION
        ========================= */}

        <div className="bg-white rounded-xl shadow-sm mb-8">

          <div className="border-b border-gray-200">

            <nav className="flex space-x-8 px-6">

              {[
                {
                  id: 'overview',
                  label: 'Overview',
                  icon: BarChart3
                },
                {
                  id: 'designers',
                  label: 'Designers',
                  icon: Users
                },
                {
                  id: 'customers',
                  label: 'Customers',
                  icon: UserCheck
                },
                {
                  id: 'projects',
                  label: 'Projects',
                  icon: Briefcase
                },
                {
                  id: 'earnings',
                  label: 'Earnings',
                  icon: DollarSign
                }
              ].map(tab => {

                const IconComponent =
                  tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(
                        tab.id as any
                      )
                    }
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

            </nav>
          </div>
        </div>

        {/* =========================
            OVERVIEW TAB
        ========================= */}

        {activeTab === 'overview' && (
          <div className="space-y-8">

            {/* Stats Grid */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Designers
                    </p>

                    <p className="text-3xl font-bold text-secondary-800">
                      {stats.totalDesigners}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>

                </div>

                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-600">
                    {stats.verifiedDesigners} verified
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Customers
                    </p>

                    <p className="text-3xl font-bold text-secondary-800">
                      {stats.totalCustomers}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>

                </div>

                <div className="mt-4 flex items-center text-sm">

                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />

                  <span className="text-green-600">
                    +{stats.monthlyGrowth}% this month
                  </span>

                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Projects
                    </p>

                    <p className="text-3xl font-bold text-secondary-800">
                      {stats.activeProjects}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-orange-600" />
                  </div>

                </div>

                <div className="mt-4 flex items-center text-sm">

                  <span className="text-gray-600">
                    {stats.completedProjects} completed
                  </span>

                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Verifications
                    </p>

                    <p className="text-3xl font-bold text-secondary-800">
                      {stats.pendingVerifications}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>

                </div>

                <div className="mt-4 flex items-center text-sm">

                  <span className="text-gray-600">
                    Requires attention
                  </span>

                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>

                    <p className="text-3xl font-bold text-secondary-800">
                      ₹{stats.totalEarnings.toLocaleString()}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>

                </div>

                <div className="mt-4 flex items-center text-sm">

                  <span className="text-gray-600">
                    From completed projects
                  </span>

                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Platform Commission
                    </p>

                    <p className="text-3xl font-bold text-secondary-800">
                      ₹{stats.platformCommission.toLocaleString()}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-sky-600" />
                  </div>

                </div>

                <div className="mt-4 flex items-center text-sm">

                  <span className="text-gray-600">
                    Platform earnings
                  </span>

                </div>
              </div>

            </div>

            {/* Platform Settings */}

            <div className="bg-white rounded-xl shadow-lg p-6">

              <div className="flex items-center space-x-3 mb-6">

                <Settings className="w-6 h-6 text-primary-600" />

                <h3 className="text-lg font-bold text-secondary-800">
                  Platform Settings
                </h3>

              </div>

              <div className="space-y-4">

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">

                  <div className="flex-1">

                    <h4 className="font-medium text-gray-900 mb-1">
                      Subscription Management
                    </h4>

                    <p className="text-sm text-gray-600">
                      Enable or disable the "Manage Subscription"
                      button for all designers
                    </p>

                  </div>

                  <button
                    onClick={
                      handleToggleSubscriptionManagement
                    }
                    disabled={updatingSettings}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      subscriptionManagementEnabled
                        ? 'bg-primary-600'
                        : 'bg-gray-300'
                    } ${
                      updatingSettings
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >

                    <span className="sr-only">
                      Toggle subscription management
                    </span>

                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        subscriptionManagementEnabled
                          ? 'translate-x-6'
                          : 'translate-x-0'
                      }`}
                    />

                  </button>

                </div>

                <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">

                  <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                  <div className="text-sm text-blue-800">

                    <p className="font-medium mb-1">
                      Current Status:{' '}
                      {subscriptionManagementEnabled
                        ? 'Enabled'
                        : 'Disabled'}
                    </p>

                    <p className="text-blue-700">

                      {subscriptionManagementEnabled
                        ? 'Designers can access subscription management features from their dashboard.'
                        : 'The subscription management button is hidden from all designers.'}

                    </p>

                  </div>

                </div>

              </div>
            </div>

            {/* Charts and Recent Activity */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              <div className="bg-white rounded-xl shadow-lg p-6">

                <h3 className="text-lg font-bold text-secondary-800 mb-4">
                  Platform Growth
                </h3>

                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">

                  <div className="text-center">

                    <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />

                    <p className="text-gray-500">
                      Chart visualization would go here
                    </p>

                  </div>

                </div>

              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <h3 className="text-lg font-bold text-secondary-800 mb-4">
                  Recent Registrations
                </h3>

                <div className="space-y-4">

                  {designers
                    .slice(0, 5)
                    .map(designer => (

                    <div
                      key={designer.id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg"
                    >

                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">

                        <Users className="w-5 h-5 text-white" />

                      </div>

                      <div className="flex-1">

                        <p className="font-medium text-secondary-800">
                          {designer.name}
                        </p>

                        <p className="text-sm text-gray-600">
                          {designer.specialization} •{' '}
                          {designer.location}
                        </p>

                      </div>

                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          designer.verification_status ===
                          'verified'
                            ? 'bg-green-100 text-green-800'
                            : designer.verification_status ===
                              'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {designer.verification_status ===
                        'verified'
                          ? 'Verified'
                          : designer.verification_status ===
                            'rejected'
                          ? 'Rejected'
                          : 'Pending'}
                      </span>

                    </div>

                  ))}

                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================
            DESIGNERS TAB
        ========================= */}

        {activeTab === 'designers' && (
          <div className="space-y-6">

            <div className="bg-white rounded-xl shadow-sm p-6">

              <div className="flex items-center space-x-4">

                <div className="flex-1 relative">

                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type="text"
                    placeholder="Search designers..."
                    value={searchTerm}
                    onChange={e =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />

                </div>

                <button className="btn-secondary flex items-center space-x-2">

                  <Filter className="w-4 h-4" />

                  <span>Filter</span>

                </button>

              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Designer
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Specialization
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Location
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Experience
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Rating
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Status
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredDesigners.map(
                      designer => (

                      <tr
                        key={designer.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >

                        <td className="py-4 px-6">

                          <div>

                            <p className="font-medium text-secondary-800">
                              {designer.name}
                            </p>

                            <p className="text-sm text-gray-600">
                              {designer.email}
                            </p>

                          </div>

                        </td>

                        <td className="py-4 px-6 text-gray-600">
                          {designer.specialization}
                        </td>

                        <td className="py-4 px-6 text-gray-600">
                          {designer.location}
                        </td>

                        <td className="py-4 px-6 text-gray-600">
                          {designer.experience} years
                        </td>

                        <td className="py-4 px-6">

                          <div className="flex items-center space-x-1">

                            <span className="font-medium">
                              {designer.rating.toFixed(1)}
                            </span>

                            <span className="text-gray-400">
                              ({designer.total_projects})
                            </span>

                          </div>

                        </td>

                        <td className="py-4 px-6">

                          <div className="flex flex-col space-y-1">

                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                designer.verification_status ===
                                'verified'
                                  ? 'bg-green-100 text-green-800'
                                  : designer.verification_status ===
                                    'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >

                              {designer.verification_status ===
                              'verified'
                                ? 'Verified'
                                : designer.verification_status ===
                                  'rejected'
                                ? 'Rejected'
                                : 'Pending'}

                            </span>

                            {designer.verification_status ===
                              'rejected' &&
                              designer.rejected_reason && (

                              <span
                                className="text-xs text-gray-500 truncate max-w-[150px]"
                                title={
                                  designer.rejected_reason
                                }
                              >
                                {designer.rejected_reason}
                              </span>

                            )}

                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                designer.is_active
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >

                              {designer.is_active
                                ? 'Active'
                                : 'Inactive'}

                            </span>

                          </div>

                        </td>

                        <td className="py-4 px-6">

                          <div className="flex items-center space-x-2">

                            {designer.verification_status ===
                              'pending' && (
                              <>

                                <button
                                  onClick={() =>
                                    handleApproveDesigner(
                                      designer.id
                                    )
                                  }
                                  className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                                  title="Approve Designer"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() =>
                                    handleRejectDesigner(
                                      designer.id
                                    )
                                  }
                                  className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                  title="Reject Designer"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>

                              </>
                            )}

                            {designer.verification_status ===
                              'verified' && (

                              <button
                                onClick={() =>
                                  handleRejectDesigner(
                                    designer.id
                                  )
                                }
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                title="Revoke Verification"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>

                            )}

                            {designer.verification_status ===
                              'rejected' && (

                              <button
                                onClick={() =>
                                  handleApproveDesigner(
                                    designer.id
                                  )
                                }
                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                                title="Approve Designer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>

                            )}

                            <button
                              onClick={() =>
                                handleToggleDesignerStatus(
                                  designer.id,
                                  !designer.is_active
                                )
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                designer.is_active
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                              title={
                                designer.is_active
                                  ? 'Deactivate'
                                  : 'Activate'
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                setEditingDesigner({
                                  ...designer
                                })
                              }
                              className="p-2 bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            </div>
          </div>
        )}

        {/* =========================
            CUSTOMERS TAB
        ========================= */}

        {activeTab === 'customers' && (
          <div className="space-y-6">

            <div className="bg-white rounded-xl shadow-sm p-6">

              <div className="flex items-center space-x-4">

                <div className="flex-1 relative">

                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={e =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />

                </div>

              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Customer
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Project
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Location
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Budget
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Status
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Created
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredCustomers.map(
                      customer => (

                      <tr
                        key={customer.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >

                        <td className="py-4 px-6">

                          <div>

                            <p className="font-medium text-secondary-800">
                              {customer.name}
                            </p>

                            <p className="text-sm text-gray-600">
                              {customer.email}
                            </p>

                          </div>

                        </td>

                        <td className="py-4 px-6">

                          <p className="font-medium text-secondary-800">
                            {customer.project_name}
                          </p>

                        </td>

                        <td className="py-4 px-6 text-gray-600">
                          {customer.location}
                        </td>

                        <td className="py-4 px-6 text-gray-600">
                          {customer.budget_range}
                        </td>

                        <td className="py-4 px-6">

                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customer.status ===
                              'completed'
                                ? 'bg-green-100 text-green-800'
                                : customer.status ===
                                  'assigned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {customer.status ||
                              'Pending'}
                          </span>

                        </td>

                        <td className="py-4 px-6 text-gray-600">

                          {new Date(
                            customer.created_at
                          ).toLocaleDateString()}

                        </td>

                        <td className="py-4 px-6">

                          <div className="flex items-center space-x-2">

                            {/* VIEW CUSTOMER */}

                            <button
                              onClick={() =>
                                handleViewCustomer(
                                  customer
                                )
                              }
                              className="p-2 bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* EDIT CUSTOMER */}

                            <button
                              onClick={() =>
                                handleEditCustomer(
                                  customer
                                )
                              }
                              className="p-2 bg-secondary-100 text-secondary-600 hover:bg-secondary-200 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            </div>
          </div>
        )}

        {/* =========================
            PROJECTS TAB
        ========================= */}

        {activeTab === 'projects' && (
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-600">
                    Total Projects
                  </h3>

                  <Briefcase className="w-5 h-5 text-blue-600" />

                </div>

                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalProjects}
                </p>

              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-600">
                    Active Projects
                  </h3>

                  <TrendingUp className="w-5 h-5 text-green-600" />

                </div>

                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeProjects}
                </p>

              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-600">
                    Completed Projects
                  </h3>

                  <CheckCircle className="w-5 h-5 text-emerald-600" />

                </div>

                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedProjects}
                </p>

              </div>

            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">

              <div className="p-6 border-b border-gray-200">

                <h3 className="text-lg font-bold text-secondary-800">
                  Recent Projects
                </h3>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Customer
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Project
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Location
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Budget
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Status
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Created
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {customers.map(customer => (

                      <tr
                        key={customer.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >

                        <td className="py-4 px-6">

                          <div>

                            <p className="font-medium text-secondary-800">
                              {customer.name}
                            </p>

                            <p className="text-sm text-gray-600">
                              {customer.email}
                            </p>

                          </div>

                        </td>

                        <td className="py-4 px-6">

                          <p className="font-medium text-secondary-800">
                            {customer.project_name}
                          </p>

                        </td>

                        <td className="py-4 px-6 text-gray-600">
                          {customer.location}
                        </td>

                        <td className="py-4 px-6 text-gray-600">
                          {customer.budget_range}
                        </td>

                        <td className="py-4 px-6">

                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customer.status ===
                              'completed'
                                ? 'bg-green-100 text-green-800'
                                : customer.status ===
                                  'assigned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {customer.status ||
                              'Pending'}
                          </span>

                        </td>

                        <td className="py-4 px-6 text-gray-600">

                          {new Date(
                            customer.created_at
                          ).toLocaleDateString()}

                        </td>

                      </tr>

                    ))}

                    {customers.length === 0 && (

                      <tr>

                        <td
                          colSpan={6}
                          className="py-12 text-center text-gray-500"
                        >
                          No projects available yet.
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>
            </div>
          </div>
        )}

        {/* =========================
            EARNINGS TAB
        ========================= */}

        {activeTab === 'earnings' && (
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </h3>

                  <DollarSign className="w-5 h-5 text-emerald-600" />

                </div>

                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.totalEarnings.toLocaleString()}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  {earnings.length} completed projects
                </p>

              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-600">
                    Platform Earnings
                  </h3>

                  <TrendingUp className="w-5 h-5 text-sky-600" />

                </div>

                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.platformCommission.toLocaleString()}
                </p>

                <p className="text-sm text-gray-500 mt-2">

                  {stats.totalEarnings > 0
                    ? (
                        (stats.platformCommission /
                          stats.totalEarnings) *
                        100
                      ).toFixed(1)
                    : 0}
                  % commission rate

                </p>

              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-600">
                    Designer Earnings
                  </h3>

                  <Users className="w-5 h-5 text-blue-600" />

                </div>

                <p className="text-2xl font-bold text-gray-900">

                  ₹
                  {(
                    stats.totalEarnings -
                    stats.platformCommission
                  ).toLocaleString()}

                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Paid to designers
                </p>

              </div>

            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">

              <div className="p-6 border-b border-gray-200">

                <h3 className="text-lg font-bold text-secondary-800">
                  Designer Projects & Earnings
                </h3>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Designer
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Project
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Type
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Project Value
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Designer Earnings
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Commission
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Payment Status
                      </th>

                      <th className="text-left py-3 px-6 font-semibold text-secondary-800">
                        Completed
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {earnings.map(earning => (

                      <tr
                        key={earning.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >

                        <td className="py-4 px-6">

                          <p className="font-medium text-secondary-800">
                            {earning.designers?.name ||
                              'N/A'}
                          </p>

                        </td>

                        <td className="py-4 px-6">

                          <p className="text-gray-900">
                            {earning.project_name}
                          </p>

                        </td>

                        <td className="py-4 px-6">

                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            {earning.project_type}
                          </span>

                        </td>

                        <td className="py-4 px-6">

                          <p className="font-medium text-gray-900">
                            ₹
                            {Number(
                              earning.project_value
                            ).toLocaleString()}
                          </p>

                        </td>

                        <td className="py-4 px-6">

                          <p className="font-medium text-emerald-600">
                            ₹
                            {Number(
                              earning.designer_earnings
                            ).toLocaleString()}
                          </p>

                        </td>

                        <td className="py-4 px-6">

                          <p className="text-gray-900">
                            ₹
                            {Number(
                              earning.platform_commission
                            ).toLocaleString()}
                          </p>

                          <p className="text-xs text-gray-500">
                            {earning.commission_percentage}%
                          </p>

                        </td>

                        <td className="py-4 px-6">

                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              earning.payment_status ===
                              'paid'
                                ? 'bg-green-100 text-green-800'
                                : earning.payment_status ===
                                  'processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {earning.payment_status}
                          </span>

                        </td>

                        <td className="py-4 px-6 text-gray-600">

                          {new Date(
                            earning.completed_at
                          ).toLocaleDateString()}

                        </td>

                      </tr>

                    ))}

                    {earnings.length === 0 && (

                      <tr>

                        <td
                          colSpan={8}
                          className="py-12 text-center text-gray-500"
                        >
                          No earnings data available yet.
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>
            </div>

            {/* Top Earning Designers */}

            <div className="bg-white rounded-xl shadow-lg p-6">

              <h3 className="text-lg font-bold text-secondary-800 mb-4">
                Top Earning Designers
              </h3>

              <div className="space-y-4">

                {(() => {

                  const designerTotals =
                    earnings.reduce(
                      (acc, earning) => {

                        const designerId =
                          earning.designer_id;

                        const designerName =
                          earning.designers?.name ||
                          'Unknown';

                        if (!acc[designerId]) {

                          acc[designerId] = {
                            name: designerName,
                            total: 0,
                            projects: 0
                          };

                        }

                        acc[designerId].total +=
                          Number(
                            earning.designer_earnings
                          );

                        acc[designerId].projects +=
                          1;

                        return acc;

                      },
                      {} as Record<
                        string,
                        {
                          name: string;
                          total: number;
                          projects: number;
                        }
                      >
                    );

                  const topDesigners =
                    Object.values(
                      designerTotals
                    )
                      .sort(
                        (a, b) =>
                          b.total - a.total
                      )
                      .slice(0, 5);

                  return topDesigners.length >
                    0 ? (

                    topDesigners.map(
                      (designer, index) => (

                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">

                              <span className="text-emerald-600 font-bold">
                                {index + 1}
                              </span>

                            </div>

                            <div>

                              <p className="font-medium text-gray-900">
                                {designer.name}
                              </p>

                              <p className="text-sm text-gray-500">
                                {designer.projects}{' '}
                                completed projects
                              </p>

                            </div>

                          </div>

                          <p className="text-lg font-bold text-emerald-600">
                            ₹
                            {designer.total.toLocaleString()}
                          </p>

                        </div>

                      )
                    )

                  ) : (

                    <p className="text-center text-gray-500 py-8">
                      No designer earnings yet.
                    </p>

                  );

                })()}

              </div>
            </div>

          </div>
        )}

        {/* =====================================================
            CUSTOMER VIEW MODAL
        ===================================================== */}

        {selectedCustomer && (

          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

              {/* Modal Header */}

              <div className="flex items-center justify-between p-6 border-b border-gray-200">

                <div>

                  <h2 className="text-xl font-bold text-secondary-800">
                    Customer Details
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    View customer information
                  </p>

                </div>

                <button
                  onClick={() =>
                    setSelectedCustomer(null)
                  }
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>

              </div>

              {/* Customer Details */}

              <div className="p-6 space-y-5">

                <div>
                  <p className="text-sm text-gray-500">
                    Name
                  </p>

                  <p className="font-medium text-gray-900">
                    {selectedCustomer.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Email
                  </p>

                  <p className="font-medium text-gray-900">
                    {selectedCustomer.email}
                  </p>
                </div>

                {selectedCustomer.phone && (

                  <div>

                    <p className="text-sm text-gray-500">
                      Phone
                    </p>

                    <p className="font-medium text-gray-900">
                      {selectedCustomer.phone}
                    </p>

                  </div>

                )}

                <div>

                  <p className="text-sm text-gray-500">
                    Project
                  </p>

                  <p className="font-medium text-gray-900">
                    {selectedCustomer.project_name}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Location
                  </p>

                  <p className="font-medium text-gray-900">
                    {selectedCustomer.location}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Budget
                  </p>

                  <p className="font-medium text-gray-900">
                    {selectedCustomer.budget_range}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Status
                  </p>

                  <p className="font-medium text-gray-900">
                    {selectedCustomer.status ||
                      'Pending'}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Created
                  </p>

                  <p className="font-medium text-gray-900">
                    {new Date(
                      selectedCustomer.created_at
                    ).toLocaleString()}
                  </p>

                </div>

              </div>

              {/* Footer */}

              <div className="flex justify-end p-6 border-t border-gray-200">

                <button
                  onClick={() =>
                    setSelectedCustomer(null)
                  }
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

        {/* =====================================================
            CUSTOMER EDIT MODAL
        ===================================================== */}

        {editingCustomer && (

          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

              {/* Modal Header */}

              <div className="flex items-center justify-between p-6 border-b border-gray-200">

                <div>

                  <h2 className="text-xl font-bold text-secondary-800">
                    Edit Customer
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Update customer information
                  </p>

                </div>

                <button
                  onClick={() =>
                    setEditingCustomer(null)
                  }
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>

              </div>

              {/* Form */}

              <div className="p-6 space-y-5">

                {/* Name */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>

                  <input
                    type="text"
                    value={editingCustomer.name}
                    onChange={e =>
                      setEditingCustomer({
                        ...editingCustomer,
                        name: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

                {/* Email */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={e =>
                      setEditingCustomer({
                        ...editingCustomer,
                        email: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

                {/* Phone */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={
                      editingCustomer.phone || ''
                    }
                    onChange={e =>
                      setEditingCustomer({
                        ...editingCustomer,
                        phone: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

                {/* Project Name */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>

                  <input
                    type="text"
                    value={
                      editingCustomer.project_name
                    }
                    onChange={e =>
                      setEditingCustomer({
                        ...editingCustomer,
                        project_name:
                          e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

                {/* Location */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>

                  <input
                    type="text"
                    value={
                      editingCustomer.location
                    }
                    onChange={e =>
                      setEditingCustomer({
                        ...editingCustomer,
                        location: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

                {/* Budget */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget
                  </label>

                  <input
                    type="text"
                    value={
                      editingCustomer.budget_range
                    }
                    onChange={e =>
                      setEditingCustomer({
                        ...editingCustomer,
                        budget_range:
                          e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

                {/* Status */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>

                  <select
                    value={
                      editingCustomer.status ||
                      'pending'
                    }
                    onChange={e =>
                      setEditingCustomer({
                        ...editingCustomer,
                        status: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >

                    <option value="pending">
                      Pending
                    </option>

                    <option value="assigned">
                      Assigned
                    </option>

                    <option value="in_progress">
                      In Progress
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                  </select>

                </div>

              </div>

              {/* Footer */}

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">

                <button
                  onClick={() =>
                    setEditingCustomer(null)
                  }
                  disabled={savingCustomer}
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveCustomer}
                  disabled={savingCustomer}
                  className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingCustomer
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

              </div>

            </div>

          </div>

        )}

        {/* =====================================================
            DESIGNER EDIT MODAL
        ===================================================== */}

        {editingDesigner && (

          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

              {/* Modal Header */}

              <div className="flex items-center justify-between p-6 border-b border-gray-200">

                <div>

                  <h2 className="text-xl font-bold text-secondary-800">
                    Edit Designer
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Update designer information
                  </p>

                </div>

                <button
                  onClick={() =>
                    setEditingDesigner(null)
                  }
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>

              </div>

              {/* Form */}

              <div className="p-6 space-y-5">

                {/* Name */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designer Name
                  </label>

                  <input
                    type="text"
                    value={
                      editingDesigner.name
                    }
                    onChange={e =>
                      setEditingDesigner({
                        ...editingDesigner,
                        name: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />

                </div>

                {/* Email */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      editingDesigner.email
                    }
                    onChange={e =>
                      setEditingDesigner({
                        ...editingDesigner,
                        email: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />

                </div>

                {/* Specialization */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>

                  <input
                    type="text"
                    value={
                      editingDesigner.specialization
                    }
                    onChange={e =>
                      setEditingDesigner({
                        ...editingDesigner,
                        specialization:
                          e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />

                </div>

                {/* Location */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>

                  <input
                    type="text"
                    value={
                      editingDesigner.location
                    }
                    onChange={e =>
                      setEditingDesigner({
                        ...editingDesigner,
                        location: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />

                </div>

                {/* Experience */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience (Years)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      editingDesigner.experience
                    }
                    onChange={e =>
                      setEditingDesigner({
                        ...editingDesigner,
                        experience: Number(
                          e.target.value
                        )
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />

                </div>

              </div>

              {/* Footer */}

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">

                <button
                  onClick={() =>
                    setEditingDesigner(null)
                  }
                  disabled={savingDesigner}
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveDesigner}
                  disabled={savingDesigner}
                  className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {savingDesigner
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

              </div>

            </div>

          </div>

        )}

      </div>
    </div>
  );
};

export default AdminDashboard;