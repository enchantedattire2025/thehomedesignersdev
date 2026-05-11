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
  Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';

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

interface Bill {
  id: string;
  project_id: string;
  quote_id: string;
  designer_id: string;
  bill_number: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes: string;
  current_version: number;
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

interface ProjectInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  project_name: string;
  property_type: string;
  project_area: string | null;
}

const DesignerBilling = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { designer } = useDesignerProfile();

  const [bill, setBill] = useState<Bill | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');

  // Version state
  const [versions, setVersions] = useState<BillVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BillVersion | null>(null);
  const [viewingVersion, setViewingVersion] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  useEffect(() => {
    if (user && designer && projectId) {
      fetchBillData();
    }
  }, [user, designer, projectId]);

  const fetchBillData = async () => {
    if (!designer || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: projectData, error: projectError } = await supabase
        .from('customers')
        .select('id, name, email, phone, location, project_name, property_type, project_area')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        setError('Project not found');
        return;
      }
      setProject(projectData);

      const { data: billData, error: billError } = await supabase
        .from('project_bills')
        .select('*')
        .eq('project_id', projectId)
        .eq('designer_id', designer.id)
        .maybeSingle();

      if (billError) throw billError;

      if (billData) {
        setBill(billData);
        setDiscountAmount(billData.discount_amount || 0);
        setTaxRate(billData.tax_rate || 18);
        setNotes(billData.notes || '');

        const { data: itemsData, error: itemsError } = await supabase
          .from('bill_items')
          .select('*')
          .eq('bill_id', billData.id)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;
        setItems(itemsData || []);

        // Fetch versions
        const { data: versionsData } = await supabase
          .from('bill_versions')
          .select('*')
          .eq('bill_id', billData.id)
          .order('version_number', { ascending: false });

        if (versionsData) setVersions(versionsData);
      } else {
        setError('No bill found for this project. A bill is automatically created when the quotation is accepted.');
      }
    } catch (err: any) {
      console.error('Error fetching bill data:', err);
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const loadVersion = (version: BillVersion) => {
    setSelectedVersion(version);
    setViewingVersion(true);
    setShowVersionDropdown(false);
  };

  const exitVersionView = () => {
    setSelectedVersion(null);
    setViewingVersion(false);
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

    updated[index].amount = calculateItemAmount(updated[index]);
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
      const { error } = await supabase
        .from('bill_items')
        .delete()
        .eq('id', item.id);

      if (error) {
        setError('Failed to delete item: ' + error.message);
        return;
      }
    }
    setItems(items.filter((_, i) => i !== index));
    setSuccess('Item removed');
    setTimeout(() => setSuccess(null), 2000);
  };

  const saveBill = async (sendToCustomer = false) => {
    if (!bill) return;

    try {
      setSaving(true);
      setError(null);

      const { subtotal, taxAmount, totalAmount } = calculateTotals();
      const newStatus = sendToCustomer ? 'sent' : 'draft';

      // Upsert items first so the version trigger captures them
      const { error: deleteError } = await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', bill.id);

      if (deleteError) throw deleteError;

      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
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
        }));

        const { error: insertError } = await supabase
          .from('bill_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // Now update the bill (this triggers version creation)
      const { data: updatedBill, error: billUpdateError } = await supabase
        .from('project_bills')
        .update({
          subtotal,
          discount_amount: discountAmount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: newStatus,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bill.id)
        .select()
        .maybeSingle();

      if (billUpdateError) throw billUpdateError;

      if (updatedBill) {
        setBill(updatedBill);
      }

      setSuccess(sendToCustomer ? 'Bill sent to customer!' : 'Bill saved successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Re-fetch items and versions
      const { data: freshItems } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', bill.id)
        .order('created_at', { ascending: true });

      if (freshItems) setItems(freshItems);

      const { data: versionsData } = await supabase
        .from('bill_versions')
        .select('*')
        .eq('bill_id', bill.id)
        .order('version_number', { ascending: false });

      if (versionsData) setVersions(versionsData);
    } catch (err: any) {
      console.error('Error saving bill:', err);
      setError(err.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error && !bill) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Bill Available</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Version view items
  const displayItems = viewingVersion && selectedVersion ? selectedVersion.items_snapshot : items;
  const displaySubtotal = viewingVersion && selectedVersion ? selectedVersion.subtotal : subtotal;
  const displayDiscount = viewingVersion && selectedVersion ? selectedVersion.discount_amount : discountAmount;
  const displayTaxRate = viewingVersion && selectedVersion ? selectedVersion.tax_rate : taxRate;
  const displayTaxAmount = viewingVersion && selectedVersion ? selectedVersion.tax_amount : taxAmount;
  const displayTotal = viewingVersion && selectedVersion ? selectedVersion.total_amount : totalAmount;
  const displayNotes = viewingVersion && selectedVersion ? selectedVersion.notes : notes;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-teal-600" />
                Project Bill
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {bill?.bill_number} &middot; {bill?.status === 'sent' ? 'Sent to Customer' : 'Draft'}
                {bill?.current_version ? ` &middot; v${bill.current_version}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Version Dropdown */}
            {versions.length > 0 && (
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
                          onClick={exitVersionView}
                          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 mb-1 transition-colors"
                        >
                          Back to Current Bill
                        </button>
                      )}
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => loadVersion(version)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                            selectedVersion?.id === version.id ? 'bg-gray-100 font-medium' : ''
                          }`}
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

            {!viewingVersion && (
              <>
                <button
                  onClick={() => saveBill(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => saveBill(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Send to Customer
                </button>
              </>
            )}
          </div>
        </div>

        {/* Version Banner */}
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
              onClick={exitVersionView}
              className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm font-medium hover:bg-amber-200 transition-colors"
            >
              Back to Current
            </button>
          </div>
        )}

        {/* Notifications */}
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

        {/* Project Info */}
        {project && (
          <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{project.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{project.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{project.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{project.location}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{project.project_name}</span> &middot; {project.property_type}
                {project.project_area && ` &middot; ${project.project_area}`}
              </p>
            </div>
          </div>
        )}

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
                  <th className="text-left px-4 py-3 font-medium min-w-[180px]">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Units</th>
                  <th className="text-left px-4 py-3 font-medium">L</th>
                  <th className="text-left px-4 py-3 font-medium">B</th>
                  <th className="text-left px-4 py-3 font-medium">Qty</th>
                  <th className="text-left px-4 py-3 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 font-medium">Rate</th>
                  <th className="text-left px-4 py-3 font-medium">Disc%</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  {!viewingVersion && <th className="text-center px-4 py-3 font-medium w-10"></th>}
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
                          <option value="material">Material</option>
                          <option value="labor">Labor</option>
                          <option value="service">Service</option>
                          <option value="component">Component</option>
                          <option value="other">Other</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-800">{item.name}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-700 text-center">{item.number_of_units}</span>
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
                        <span className="text-sm text-gray-700">{item.length || '-'}</span>
                      ) : (
                        <input
                          type="number"
                          value={item.length || ''}
                          onChange={(e) => handleItemChange(index, 'length', parseFloat(e.target.value) || 0)}
                          placeholder="-"
                          className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {viewingVersion ? (
                        <span className="text-sm text-gray-700">{item.breadth || '-'}</span>
                      ) : (
                        <input
                          type="number"
                          value={item.breadth || ''}
                          onChange={(e) => handleItemChange(index, 'breadth', parseFloat(e.target.value) || 0)}
                          placeholder="-"
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
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="per meter">per meter</option>
                          <option value="hours">hours</option>
                          <option value="piece">piece</option>
                          <option value="lump sum">lump sum</option>
                          <option value="kg">kg</option>
                          <option value="litre">litre</option>
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
                      No items in the bill.{!viewingVersion && ' Click "Add Item" to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
            {viewingVersion ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayNotes || 'No notes'}</p>
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for the customer..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none"
              />
            )}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Bill Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-800">
                  <Rupee className="w-3.5 h-3.5 inline -mt-0.5" />
                  {displaySubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Discount</span>
                {viewingVersion ? (
                  <span className="text-gray-800">
                    - <Rupee className="w-3.5 h-3.5 inline -mt-0.5" />
                    {displayDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
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
                <span className="text-gray-800">
                  <Rupee className="w-3.5 h-3.5 inline -mt-0.5" />
                  {displayTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-teal-700">
                  <Rupee className="w-4 h-4 inline -mt-0.5" />
                  {displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions (mobile) */}
        {!viewingVersion && (
          <div className="mt-6 flex justify-end gap-3 lg:hidden">
            <button
              onClick={() => saveBill(false)}
              disabled={saving}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={() => saveBill(true)}
              disabled={saving}
              className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send to Customer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerBilling;
