import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  FileText,
  User,
  Phone,
  Mail,
  IndianRupee as Rupee,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Building2,
  UserCheck,
  TrendingUp,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Tag,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';
import { generateBillPdf } from '../utils/generateBillPdf';

interface BillSummary {
  id: string;
  bill_number: string;
  bill_type: 'project' | 'offline';
  status: 'draft' | 'sent' | 'paid' | 'partially_paid';
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  tax_rate: number;
  notes: string;
  project_description: string;
  created_at: string;
  updated_at: string;
  // Offline customer info
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  // Project info (nullable)
  project_id: string | null;
  quote_id: string | null;
  project?: {
    name: string;
    email: string;
    phone: string;
    location: string;
    project_name: string;
    property_type: string;
  } | null;
}

interface BillItem {
  id: string;
  item_type: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-600',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-700',
    icon: <ArrowUpRight className="w-3.5 h-3.5" />,
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  partially_paid: {
    label: 'Partial',
    color: 'bg-amber-100 text-amber-700',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
};

const BillDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { designer } = useDesignerProfile();

  const [bills, setBills] = useState<BillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [billItemsCache, setBillItemsCache] = useState<Record<string, BillItem[]>>({});

  useEffect(() => {
    if (user && designer) {
      fetchBills();
    }
  }, [user, designer]);

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchBills = async () => {
    if (!designer) return;
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('project_bills')
        .select(`
          *,
          project:customers(name, email, phone, location, project_name, property_type)
        `)
        .eq('designer_id', designer.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setBills((data as BillSummary[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillItems = async (billId: string): Promise<BillItem[]> => {
    if (billItemsCache[billId]) return billItemsCache[billId];
    const { data } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', billId)
      .order('created_at', { ascending: true });
    const items = (data as BillItem[]) || [];
    setBillItemsCache(prev => ({ ...prev, [billId]: items }));
    return items;
  };

  const handleDownloadPdf = async (bill: BillSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    const items = await fetchBillItems(bill.id);
    const customerName = bill.bill_type === 'offline' ? bill.customer_name : (bill.project?.name || '');
    const customerEmail = bill.bill_type === 'offline' ? bill.customer_email : (bill.project?.email || '');
    const customerPhone = bill.bill_type === 'offline' ? bill.customer_phone : (bill.project?.phone || '');
    const customerLocation = bill.bill_type === 'offline' ? bill.customer_address : (bill.project?.location || '');
    const projectName = bill.bill_type === 'offline' ? (bill.project_description || 'Offline Bill') : (bill.project?.project_name || '');

    generateBillPdf({
      billNumber: bill.bill_number,
      status: bill.status,
      createdAt: bill.created_at,
      projectName,
      customerName,
      customerEmail,
      customerPhone,
      customerLocation,
      designerName: designer?.name,
      designerSpecialization: (designer as any)?.specialization,
      items,
      subtotal: bill.subtotal,
      discountAmount: bill.discount_amount,
      taxRate: bill.tax_rate,
      taxAmount: bill.tax_amount,
      totalAmount: bill.total_amount,
      notes: bill.notes,
    });
    setOpenMenuId(null);
  };

  const handleDelete = async (billId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this bill? This action cannot be undone.')) return;
    try {
      setDeletingId(billId);
      const { error: deleteError } = await supabase
        .from('project_bills')
        .delete()
        .eq('id', billId);
      if (deleteError) throw deleteError;
      setBills(prev => prev.filter(b => b.id !== billId));
    } catch (err: any) {
      setError('Failed to delete bill: ' + err.message);
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  };

  const handleMarkStatus = async (billId: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error: updateError } = await supabase
        .from('project_bills')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', billId);
      if (updateError) throw updateError;
      setBills(prev => prev.map(b => b.id === billId ? { ...b, status: status as any } : b));
    } catch (err: any) {
      setError('Failed to update status: ' + err.message);
    } finally {
      setOpenMenuId(null);
    }
  };

  const filteredBills = bills.filter(bill => {
    const customerName = bill.bill_type === 'offline' ? bill.customer_name : (bill.project?.name || '');
    const projectName = bill.bill_type === 'offline' ? bill.project_description : (bill.project?.project_name || '');
    const matchesSearch =
      !searchQuery ||
      bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesType = typeFilter === 'all' || bill.bill_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const stats = {
    total: bills.length,
    draft: bills.filter(b => b.status === 'draft').length,
    sent: bills.filter(b => b.status === 'sent').length,
    paid: bills.filter(b => b.status === 'paid').length,
    totalRevenue: bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.total_amount, 0),
    pendingRevenue: bills.filter(b => b.status === 'sent' || b.status === 'partially_paid').reduce((s, b) => s + b.total_amount, 0),
    projectBills: bills.filter(b => b.bill_type === 'project').length,
    offlineBills: bills.filter(b => b.bill_type === 'offline').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-gray-600">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-teal-600" />
              Bills Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage all project bills and offline customer bills</p>
          </div>
          <button
            onClick={() => navigate('/create-offline-bill')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Offline Bill
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Bills</span>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-gray-500">{stats.projectBills} project</span>
              <span className="text-xs text-gray-400">&middot;</span>
              <span className="text-xs text-gray-500">{stats.offlineBills} offline</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Collected</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700">
              {stats.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stats.paid} paid bills</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outstanding</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {stats.pendingRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stats.sent} sent bills</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Drafts</span>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-700">{stats.draft}</p>
            <p className="text-xs text-gray-500 mt-1">Unpublished</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by bill number, customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-8 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partial</option>
                </select>
              </div>
              <div className="relative">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="pl-8 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="project">Project Bills</option>
                  <option value="offline">Offline Bills</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {bills.length === 0 ? 'No bills yet' : 'No bills match filters'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {bills.length === 0
                ? 'Bills are created automatically when customers accept quotes, or you can create offline bills manually.'
                : 'Try adjusting your search or filters.'}
            </p>
            {bills.length === 0 && (
              <button
                onClick={() => navigate('/create-offline-bill')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Offline Bill
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBills.map((bill) => {
              const statusCfg = STATUS_CONFIG[bill.status] || STATUS_CONFIG.draft;
              const customerName = bill.bill_type === 'offline' ? bill.customer_name : (bill.project?.name || 'Unknown');
              const customerPhone = bill.bill_type === 'offline' ? bill.customer_phone : (bill.project?.phone || '');
              const customerEmail = bill.bill_type === 'offline' ? bill.customer_email : (bill.project?.email || '');
              const projectLabel = bill.bill_type === 'offline'
                ? (bill.project_description || 'Offline Bill')
                : (bill.project?.project_name || 'Project');

              return (
                <div
                  key={bill.id}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  <div className="flex items-stretch">
                    {/* Left accent bar */}
                    <div className={`w-1 flex-shrink-0 ${bill.bill_type === 'offline' ? 'bg-orange-400' : 'bg-teal-500'}`} />

                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-gray-900">{bill.bill_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              bill.bill_type === 'offline'
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}>
                              {bill.bill_type === 'offline' ? <UserCheck className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                              {bill.bill_type === 'offline' ? 'Offline' : 'Project'}
                            </span>
                          </div>

                          <p className="text-sm font-medium text-gray-700 truncate">{projectLabel}</p>

                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            {customerName && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                {customerName}
                              </span>
                            )}
                            {customerPhone && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                {customerPhone}
                              </span>
                            )}
                            {customerEmail && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 hidden sm:flex">
                                <Mail className="w-3 h-3" />
                                {customerEmail}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side: amount + actions */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 flex items-center gap-0.5">
                              <Rupee className="w-4 h-4" />
                              {bill.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownloadPdf(bill, e); }}
                              title="Download PDF"
                              className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (bill.bill_type === 'offline') {
                                  navigate(`/offline-bill/${bill.id}`);
                                } else {
                                  navigate(`/project-bill/${bill.project_id}`);
                                }
                              }}
                              title="Edit bill"
                              className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Context menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === bill.id ? null : bill.id); }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === bill.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Mark as</p>
                                    {(['draft', 'sent', 'paid', 'partially_paid'] as const).map((s) => (
                                      <button
                                        key={s}
                                        onClick={(e) => handleMarkStatus(bill.id, s, e)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${bill.status === s ? 'font-semibold text-teal-700' : 'text-gray-700'}`}
                                      >
                                        {STATUS_CONFIG[s]?.label}
                                        {bill.status === s && <span className="ml-1 text-teal-500">✓</span>}
                                      </button>
                                    ))}
                                    <div className="border-t my-1" />
                                    <button
                                      onClick={(e) => handleDelete(bill.id, e)}
                                      disabled={deletingId === bill.id}
                                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                      {deletingId === bill.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                      Delete Bill
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredBills.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Showing {filteredBills.length} of {bills.length} bills
          </p>
        )}
      </div>
    </div>
  );
};

export default BillDashboard;
