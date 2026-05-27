import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  FileText,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  IndianRupee as Rupee,
  Loader2,
  Receipt,
  History,
  ChevronDown,
  Eye,
  Download,
  UserCheck,
  Info,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';
import { generateBillPdf } from '../utils/generateBillPdf';

interface BillItem {
  id?: string;
  item_type: string;
  name: string;
  description: string;
  number_of_units: number;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  amount: number;
  length?: number;
  breadth?: number;
}

interface OfflineBill {
  id: string;
  bill_number: string;
  bill_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  project_description: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes: string;
  current_version?: number;
  created_at: string;
  updated_at: string;
}

interface BillVersion {
  id: string;
  bill_id: string;
  version_number: number;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes: string;
  items_snapshot: BillItem[];
  created_at: string;
}

const ITEM_TYPES = ['material', 'labor', 'service', 'component', 'other'];
const UNITS = ['sq.ft', 'sq.m', 'per meter', 'hours', 'piece', 'lump sum', 'kg', 'litre', 'nos'];

const OfflineBillEditor = () => {
  const navigate = useNavigate();
  const { billId } = useParams<{ billId: string }>();
  const isEditMode = Boolean(billId);
  const { user } = useAuth();
  const { designer } = useDesignerProfile();

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  // Bill state
  const [bill, setBill] = useState<OfflineBill | null>(null);
  const [items, setItems] = useState<BillItem[]>([{
    item_type: 'material',
    name: '',
    description: '',
    number_of_units: 1,
    quantity: 0,
    unit: 'sq.ft',
    unit_price: 0,
    discount_percent: 0,
    amount: 0,
  }]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Version state
  const [versions, setVersions] = useState<BillVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BillVersion | null>(null);
  const [viewingVersion, setViewingVersion] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  useEffect(() => {
    if (isEditMode && user && designer && billId) {
      fetchBillData(billId);
    }
  }, [isEditMode, user, designer, billId]);

  const fetchBillData = async (id: string) => {
    try {
      setLoading(true);
      const { data: billData, error: billError } = await supabase
        .from('project_bills')
        .select('*')
        .eq('id', id)
        .eq('bill_type', 'offline')
        .maybeSingle();

      if (billError) throw billError;
      if (!billData) {
        setError('Bill not found');
        return;
      }

      setBill(billData);
      setCustomerName(billData.customer_name || '');
      setCustomerEmail(billData.customer_email || '');
      setCustomerPhone(billData.customer_phone || '');
      setCustomerAddress(billData.customer_address || '');
      setProjectDescription(billData.project_description || '');
      setDiscountAmount(billData.discount_amount || 0);
      setTaxRate(billData.tax_rate || 18);
      setNotes(billData.notes || '');

      const { data: itemsData } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', id)
        .order('created_at', { ascending: true });

      setItems(itemsData?.length ? itemsData : [{
        item_type: 'material',
        name: '',
        description: '',
        number_of_units: 1,
        quantity: 0,
        unit: 'sq.ft',
        unit_price: 0,
        discount_percent: 0,
        amount: 0,
      }]);

      const { data: versionsData } = await supabase
        .from('bill_versions')
        .select('*')
        .eq('bill_id', id)
        .order('version_number', { ascending: false });

      if (versionsData) setVersions(versionsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const calculateItemAmount = (item: BillItem): number => {
    const qty = item.quantity || 0;
    const price = item.unit_price || 0;
    const discount = item.discount_percent || 0;
    return qty * price * (1 - discount / 100);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const totalAmount = subtotal - discountAmount + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    if ((field === 'length' || field === 'breadth') && ['sq.ft', 'sq.m', 'per meter'].includes(updated[index].unit)) {
      const l = updated[index].length || 0;
      const b = updated[index].breadth || 0;
      if (l > 0 && b > 0) {
        updated[index].quantity = l * b;
      }
    }

    if (field === 'number_of_units' || field === 'quantity' || field === 'unit_price' || field === 'discount_percent') {
      updated[index].amount = calculateItemAmount(updated[index]);
    } else if (field === 'length' || field === 'breadth') {
      updated[index].amount = calculateItemAmount(updated[index]);
    }

    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, {
      item_type: 'material',
      name: '',
      description: '',
      number_of_units: 1,
      quantity: 0,
      unit: 'sq.ft',
      unit_price: 0,
      discount_percent: 0,
      amount: 0,
    }]);
  };

  const removeItem = async (index: number) => {
    const item = items[index];
    if (item.id && bill) {
      const { error: delErr } = await supabase.from('bill_items').delete().eq('id', item.id);
      if (delErr) { setError('Failed to delete item'); return; }
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!customerName.trim()) return 'Customer name is required';
    if (!customerPhone.trim()) return 'Customer phone is required';
    if (items.every(i => !i.name.trim())) return 'Add at least one item with a name';
    return null;
  };

  const generateBillNumber = () =>
    'BILL-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const saveBill = async (sendToCustomer = false) => {
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    try {
      setSaving(true);
      setError(null);
      const { subtotal, taxAmount, totalAmount } = calculateTotals();
      const status = sendToCustomer ? 'sent' : 'draft';

      if (isEditMode && bill) {
        // Update existing
        const { error: deleteError } = await supabase.from('bill_items').delete().eq('bill_id', bill.id);
        if (deleteError) throw deleteError;

        const validItems = items.filter(i => i.name.trim());
        if (validItems.length > 0) {
          const { error: insertError } = await supabase.from('bill_items').insert(
            validItems.map(item => ({
              bill_id: bill.id,
              item_type: item.item_type,
              name: item.name,
              description: item.description,
              number_of_units: item.number_of_units,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent,
              amount: item.amount,
              length: item.length || null,
              breadth: item.breadth || null,
            }))
          );
          if (insertError) throw insertError;
        }

        const { data: updatedBill, error: updateError } = await supabase
          .from('project_bills')
          .update({
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            project_description: projectDescription,
            subtotal,
            discount_amount: discountAmount,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status,
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bill.id)
          .select()
          .maybeSingle();

        if (updateError) throw updateError;
        if (updatedBill) setBill(updatedBill);

        const { data: freshItems } = await supabase.from('bill_items').select('*').eq('bill_id', bill.id).order('created_at', { ascending: true });
        if (freshItems) setItems(freshItems);

        const { data: versionsData } = await supabase.from('bill_versions').select('*').eq('bill_id', bill.id).order('version_number', { ascending: false });
        if (versionsData) setVersions(versionsData);

        setSuccess(sendToCustomer ? 'Bill finalized!' : 'Bill saved!');
      } else {
        // Create new
        if (!designer) return;
        const billNumber = generateBillNumber();
        const { data: newBill, error: createError } = await supabase
          .from('project_bills')
          .insert({
            designer_id: designer.id,
            bill_number: billNumber,
            bill_type: 'offline',
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            project_description: projectDescription,
            subtotal,
            discount_amount: discountAmount,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status,
            notes,
          })
          .select()
          .maybeSingle();

        if (createError) throw createError;

        const validItems = items.filter(i => i.name.trim());
        if (validItems.length > 0 && newBill) {
          const { error: itemsError } = await supabase.from('bill_items').insert(
            validItems.map(item => ({
              bill_id: newBill.id,
              item_type: item.item_type,
              name: item.name,
              description: item.description,
              number_of_units: item.number_of_units,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent,
              amount: item.amount,
              length: item.length || null,
              breadth: item.breadth || null,
            }))
          );
          if (itemsError) throw itemsError;
        }

        setSuccess('Bill created successfully!');
        setTimeout(() => navigate(`/offline-bill/${newBill?.id}`, { replace: true }), 1200);
        return;
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    const pdfItems = viewingVersion && selectedVersion ? selectedVersion.items_snapshot : items;
    const pdfSubtotal = viewingVersion && selectedVersion ? selectedVersion.subtotal : subtotal;
    const pdfDiscount = viewingVersion && selectedVersion ? selectedVersion.discount_amount : discountAmount;
    const pdfTaxRate = viewingVersion && selectedVersion ? selectedVersion.tax_rate : taxRate;
    const pdfTaxAmount = viewingVersion && selectedVersion ? selectedVersion.tax_amount : taxAmount;
    const pdfTotal = viewingVersion && selectedVersion ? selectedVersion.total_amount : totalAmount;
    const pdfNotes = viewingVersion && selectedVersion ? selectedVersion.notes : notes;

    generateBillPdf({
      billNumber: bill?.bill_number || 'DRAFT',
      status: viewingVersion && selectedVersion ? selectedVersion.status : (bill?.status || 'draft'),
      createdAt: bill?.created_at || new Date().toISOString(),
      projectName: projectDescription || 'Offline Bill',
      customerName,
      customerEmail,
      customerPhone,
      customerLocation: customerAddress,
      designerName: designer?.name,
      designerSpecialization: (designer as any)?.specialization,
      items: pdfItems,
      subtotal: pdfSubtotal,
      discountAmount: pdfDiscount,
      taxRate: pdfTaxRate,
      taxAmount: pdfTaxAmount,
      totalAmount: pdfTotal,
      notes: pdfNotes,
      versionNumber: viewingVersion && selectedVersion ? selectedVersion.version_number : undefined,
    });
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();
  const displayItems = viewingVersion && selectedVersion ? selectedVersion.items_snapshot : items;
  const displaySubtotal = viewingVersion && selectedVersion ? selectedVersion.subtotal : subtotal;
  const displayDiscount = viewingVersion && selectedVersion ? selectedVersion.discount_amount : discountAmount;
  const displayTaxRate = viewingVersion && selectedVersion ? selectedVersion.tax_rate : taxRate;
  const displayTaxAmount = viewingVersion && selectedVersion ? selectedVersion.tax_amount : taxAmount;
  const displayTotal = viewingVersion && selectedVersion ? selectedVersion.total_amount : totalAmount;
  const displayNotes = viewingVersion && selectedVersion ? selectedVersion.notes : notes;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/bills')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-orange-500" />
                {isEditMode ? 'Edit Offline Bill' : 'New Offline Bill'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isEditMode && bill ? `${bill.bill_number} · ${bill.status}` : 'Create a bill for offline/walk-in customers'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Version dropdown (edit mode only) */}
            {isEditMode && versions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Versions</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showVersionDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border z-50 max-h-72 overflow-y-auto">
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-500 px-2 py-1 uppercase tracking-wide">Bill Versions</p>
                      {viewingVersion && (
                        <button
                          onClick={() => { setSelectedVersion(null); setViewingVersion(false); setShowVersionDropdown(false); }}
                          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 mb-1 transition-colors"
                        >
                          Back to Current Bill
                        </button>
                      )}
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => { setSelectedVersion(version); setViewingVersion(true); setShowVersionDropdown(false); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${selectedVersion?.id === version.id ? 'bg-gray-100 font-medium' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">Version {version.version_number}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{version.status}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-gray-500">
                              {new Date(version.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {version.total_amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isEditMode && (
              <button
                onClick={handleDownloadPdf}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}

            {!viewingVersion && (
              <>
                <button
                  onClick={() => saveBill(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Draft
                </button>
                <button
                  onClick={() => saveBill(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Finalize
                </button>
              </>
            )}
          </div>
        </div>

        {/* Version banner */}
        {viewingVersion && selectedVersion && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Viewing Version {selectedVersion.version_number}</span>
              <span className="text-amber-600">
                &middot; {new Date(selectedVersion.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button
              onClick={() => { setSelectedVersion(null); setViewingVersion(false); }}
              className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm font-medium hover:bg-amber-200 transition-colors"
            >
              Back to Current
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-orange-500" />
            Customer Information
          </h3>
          {viewingVersion ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{customerName || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{customerPhone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{customerEmail || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{customerAddress || '—'}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="City, Area"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Project / Work Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="e.g. Living room interior design, false ceiling work..."
                    rows={2}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bill Items Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              Bill Items ({displayItems.length})
            </h3>
            {!viewingVersion && (
              <button
                onClick={addItem}
                className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium w-8">#</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium min-w-[180px]">Name / Description</th>
                  <th className="text-left px-4 py-3 font-medium">Units</th>
                  <th className="text-left px-4 py-3 font-medium">L</th>
                  <th className="text-left px-4 py-3 font-medium">B</th>
                  <th className="text-left px-4 py-3 font-medium">Qty</th>
                  <th className="text-left px-4 py-3 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 font-medium">Rate</th>
                  <th className="text-left px-4 py-3 font-medium">Disc%</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  {!viewingVersion && <th className="w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-gray-400">{index + 1}</td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 capitalize">{item.item_type}</span>
                      ) : (
                        <select
                          value={item.item_type}
                          onChange={(e) => handleItemChange(index, 'item_type', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        >
                          {ITEM_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <div>
                          <p className="text-sm text-gray-800 font-medium">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            placeholder="Item name"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full px-2 py-1 border border-gray-100 rounded text-xs text-gray-500 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-700">{item.number_of_units}</span>
                      ) : (
                        <input
                          type="number"
                          value={item.number_of_units || ''}
                          onChange={(e) => handleItemChange(index, 'number_of_units', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-700">{item.length || '—'}</span>
                      ) : (
                        <input
                          type="number"
                          value={item.length || ''}
                          onChange={(e) => handleItemChange(index, 'length', parseFloat(e.target.value) || 0)}
                          placeholder="—"
                          className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-700">{item.breadth || '—'}</span>
                      ) : (
                        <input
                          type="number"
                          value={item.breadth || ''}
                          onChange={(e) => handleItemChange(index, 'breadth', parseFloat(e.target.value) || 0)}
                          placeholder="—"
                          className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-700">{item.quantity}</span>
                      ) : (
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-xs text-gray-600">{item.unit}</span>
                      ) : (
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        >
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-700">{item.unit_price}</span>
                      ) : (
                        <input
                          type="number"
                          value={item.unit_price || ''}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-700">{item.discount_percent || 0}</span>
                      ) : (
                        <input
                          type="number"
                          value={item.discount_percent || ''}
                          onChange={(e) => handleItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-800">
                      {(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    {!viewingVersion && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {displayItems.length === 0 && (
                  <tr>
                    <td colSpan={viewingVersion ? 11 : 12} className="px-4 py-8 text-center text-gray-400">
                      No items. Click "Add Item" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!viewingVersion && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5" />
                For area items, enter Length × Breadth to auto-calculate Quantity
              </div>
            </div>
          )}
        </div>

        {/* Totals and Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
            {viewingVersion ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayNotes || 'No notes'}</p>
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes, payment terms, or special instructions..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              />
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Bill Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-800 flex items-center gap-0.5">
                  <Rupee className="w-3.5 h-3.5" />
                  {displaySubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Discount</span>
                {viewingVersion ? (
                  <span className="text-gray-800 flex items-center gap-0.5">
                    - <Rupee className="w-3.5 h-3.5" />
                    {displayDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">-</span>
                    <Rupee className="w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Tax Rate</span>
                {viewingVersion ? (
                  <span className="text-gray-800">{displayTaxRate}%</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={taxRate || ''}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="text-gray-400 text-xs">%</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax Amount</span>
                <span className="text-gray-800 flex items-center gap-0.5">
                  <Rupee className="w-3.5 h-3.5" />
                  {displayTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-teal-700 flex items-center gap-0.5">
                  <Rupee className="w-4 h-4" />
                  {displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {!viewingVersion && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <button
                  onClick={() => saveBill(false)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save as Draft
                </button>
                <button
                  onClick={() => saveBill(true)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Finalize Bill
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineBillEditor;
