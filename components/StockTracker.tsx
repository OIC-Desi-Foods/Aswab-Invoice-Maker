import React, { useState, useMemo, useEffect } from 'react';
import { Product, InventoryTransaction } from '../types';
import FormField from './FormField';
import ActionButton from './ActionButton';
import { useAuth } from '../contexts/AuthContext';
import { listenForInventoryTransactions } from '../firebase/firestore';
import PartnerPaymentsModal from "./PartnerPaymentsModal";

type AdjustmentType = 'sold_to_partner' | 'sold_to_customer' | 'received_new_stock';

interface StockTrackerProps {
  products: Product[];
  currency: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onAddItem: (item: Omit<Product, 'id' | 'name'>) => Promise<string>;
  onUpdateItem: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onAdjustStock: (productId: string, type: AdjustmentType, qty: number, price?: number, isPaid?: boolean) => Promise<void>;
  onRecordPartnerPayment: (productId: string, amount: number) => Promise<void>;
}

const isUrdu = (str: any): boolean => typeof str === 'string' && /[\u0600-\u06FF]/.test(str);

const AnalyticsDashboard: React.FC<{products: Product[], currency: string}> = ({ products, currency }) => {
    const data = useMemo(() => {
        const activeProducts = products.filter(p => !p.archived);
        
        const totalValue = activeProducts.reduce((acc, item) => {
            const myStockValue = (item.myStock || 0) * (item.salePrice || 0);
            const partnerStockValue = (item.partnerStock || 0) * (item.partnerPrice || 0);
            return acc + myStockValue + partnerStockValue;
        }, 0);

        const myStockPurchaseValue = activeProducts.reduce((acc, item) => acc + ((item.myStock || 0) * (item.purchasePrice || 0)), 0);

        const partnerDues = activeProducts
            .filter(item => (item.partnerPrice || 0) && (item.amountReceivedFromPartner !== undefined))
            .reduce((acc, item) => {
                const totalCost = (item.partnerStock || 0) * (item.partnerPrice || 0);
                const due = totalCost - (item.amountReceivedFromPartner || 0);
                return acc + (due > 0 ? due : 0);
            }, 0);

        return { totalValue, partnerDues, myStockPurchaseValue };
    }, [products]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[var(--color-card-bg)] p-6 rounded-lg shadow-md text-center">
                <h3 className="text-sm font-medium uppercase text-[var(--color-light-text)]">Total Stock Value</h3>
                <p className="text-3xl font-bold text-[var(--color-primary)] mt-2">{currency}{data.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 <p className="text-xs text-[var(--color-light-text)] mt-1">(My Stock @ Sale Price + Partner Stock @ Partner Price)</p>
            </div>
             <div className="bg-[var(--color-card-bg)] p-6 rounded-lg shadow-md text-center">
                <h3 className="text-sm font-medium uppercase text-[var(--color-light-text)]">Total My Stock (Purchase Value)</h3>
                <p className="text-3xl font-bold text-[var(--color-main-text)] mt-2">{currency}{data.myStockPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 <p className="text-xs text-[var(--color-light-text)] mt-1">(My Stock @ Purchase Price)</p>
            </div>
            <div className="bg-[var(--color-card-bg)] p-6 rounded-lg shadow-md text-center">
                <h3 className="text-sm font-medium uppercase text-[var(--color-light-text)]">Total Partner Dues</h3>
                <p className="text-3xl font-bold text-red-500 mt-2">{currency}{data.partnerDues.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 <p className="text-xs text-[var(--color-light-text)] mt-1">(Outstanding amount from partners)</p>
            </div>
        </div>
    );
};

const ProductFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Product, 'id' | 'name'>) => Promise<void>;
    editingItem: Product | null;
    isSubmitting: boolean;
    currency: string;
}> = ({ isOpen, onClose, onSubmit, editingItem, isSubmitting, currency }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id' | 'name'>>({
        name_en: '', name_ur: '', unit: 'pcs', purchasePrice: 0, salePrice: 0, partnerPrice: 0, 
        myStock: 0, partnerStock: 0, amountReceivedFromPartner: 0,
    });
    
    useEffect(() => {
        if (editingItem) {
            setFormData({
                name_en: (editingItem as any).name_en || (editingItem as any).name || '',
                name_ur: editingItem.name_ur || '',
                unit: editingItem.unit || 'pcs',
                purchasePrice: editingItem.purchasePrice || 0,
                salePrice: editingItem.salePrice || 0,
                partnerPrice: editingItem.partnerPrice || 0,
                myStock: editingItem.myStock || 0,
                partnerStock: editingItem.partnerStock || 0,
                amountReceivedFromPartner: editingItem.amountReceivedFromPartner || 0,
            });
        } else {
             setFormData({
                name_en: '', name_ur: '', unit: 'pcs', purchasePrice: 0, salePrice: 0, partnerPrice: 0, 
                myStock: 0, partnerStock: 0, amountReceivedFromPartner: 0,
            });
        }
    }, [editingItem, isOpen]);

    const handleInputChange = (field: keyof typeof formData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name_en?.trim() && !formData.name_ur?.trim()) {
            alert("At least one product name (English or Urdu) is required.");
            return;
        }
        onSubmit(formData);
    };

    const partnerStockValue = (formData.partnerStock || 0) * (formData.partnerPrice || 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <h3 className="text-2xl font-bold text-center mb-4">{editingItem ? 'Edit Product' : 'Add New Product'}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Product Name (English)" value={formData.name_en} onChange={e => handleInputChange('name_en', e.target.value)} placeholder="e.g., Basmati Rice"/>
                        <FormField label="Product Name (Urdu)" value={formData.name_ur} onChange={e => handleInputChange('name_ur', e.target.value)} placeholder="مثال کے طور پر، باسمتی چاول" className="urdu-text"/>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="Purchase Price / unit" type="number" value={formData.purchasePrice} onChange={e => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)} />
                        <FormField label="Sale Price / unit" type="number" value={formData.salePrice} onChange={e => handleInputChange('salePrice', parseFloat(e.target.value) || 0)} required/>
                        <FormField label="Unit (e.g., kg, pcs)" value={formData.unit} onChange={e => handleInputChange('unit', e.target.value)} required/>
                    </div>
                    <div className="border-t pt-4 dark:border-gray-700">
                        <h4 className="font-semibold mb-2">Initial Stock</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="My Stock" type="number" value={formData.myStock} onChange={e => handleInputChange('myStock', parseFloat(e.target.value) || 0)} />
                            <FormField label="Partner Stock (Quantity)" type="number" value={formData.partnerStock} onChange={e => handleInputChange('partnerStock', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                     <div className="border-t pt-4 dark:border-gray-700">
                        <h4 className="font-semibold mb-2">Partner Details (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <FormField label="Partner Price / unit" type="number" value={formData.partnerPrice} onChange={e => handleInputChange('partnerPrice', parseFloat(e.target.value) || 0)} />
                             <FormField label="Partner's Initial Payment" type="number" value={formData.amountReceivedFromPartner} onChange={e => handleInputChange('amountReceivedFromPartner', parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className="mt-2 text-right text-sm text-[var(--color-light-text)]">
                            Partner Stock Value: <span className="font-semibold text-[var(--color-main-text)]">{currency}{partnerStockValue.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
                        <ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingItem ? 'Update Product' : 'Add Product')}</ActionButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StockAdjustmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onSubmit: (productId: string, type: AdjustmentType, qty: number, price?: number, isPaid?: boolean) => Promise<void>;
}> = ({ isOpen, onClose, products, onSubmit }) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('sold_to_customer');
    const [quantity, setQuantity] = useState(1);
    const [salePrice, setSalePrice] = useState(0);
    const [isPaid, setIsPaid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const adjustableProducts = useMemo(() => products.filter(p => !p.archived), [products]);

    useEffect(() => {
        if (adjustableProducts.length > 0 && !selectedProductId) {
            setSelectedProductId(adjustableProducts[0].id);
        }
    }, [adjustableProducts, isOpen]);
    
    useEffect(() => {
        const product = adjustableProducts.find(p => p.id === selectedProductId);
        if (product) {
            if (adjustmentType === 'sold_to_partner') {
                setSalePrice(product.partnerPrice || 0);
            } else if (adjustmentType === 'sold_to_customer') {
                setSalePrice(product.salePrice || 0);
            }
        }
        // Reset paid status when type changes
        setIsPaid(false);
    }, [selectedProductId, adjustmentType, adjustableProducts]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedProductId || quantity <= 0) {
            setError('Please select a product and enter a valid quantity.');
            return;
        }
        setIsSubmitting(true);
        try {
            const price = adjustmentType !== 'received_new_stock' ? salePrice : undefined;
            await onSubmit(selectedProductId, adjustmentType, quantity, price, isPaid);
            onClose();
            // Reset form
            setQuantity(1);
            setSalePrice(0);
            setAdjustmentType('sold_to_customer');
            setIsPaid(false);
        } catch (err: any) {
            setError(err.message || 'Failed to adjust stock.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <h3 className="text-2xl font-bold text-center">Stock Adjustment</h3>
                    {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
                    <div>
                        <label htmlFor="product-select-adj" className="block text-sm font-medium mb-1">Product</label>
                        <select id="product-select-adj" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                            {adjustableProducts.map(p => <option key={p.id} value={p.id}>{(p.name_en || p.name_ur || p.name)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="adj-type" className="block text-sm font-medium mb-1">Action Type</label>
                        <select id="adj-type" value={adjustmentType} onChange={e => setAdjustmentType(e.target.value as AdjustmentType)} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                            <option value="sold_to_customer">Sold to Customer (- My Stock)</option>
                            <option value="sold_to_partner">Sold to Partner (- My, + Partner)</option>
                            <option value="received_new_stock">Received New Stock (+ My Stock)</option>
                        </select>
                    </div>
                    <FormField label="Quantity" type="number" min="0.01" step="any" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} required/>
                    {adjustmentType !== 'received_new_stock' && (
                         <FormField label="Sale Price / unit" type="number" min="0" step="any" value={salePrice} onChange={e => setSalePrice(parseFloat(e.target.value) || 0)} required/>
                    )}
                    {adjustmentType === 'sold_to_partner' && (
                        <div className="flex items-center justify-end">
                            <input type="checkbox" id="is-paid-checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary-btn-bg)] focus:ring-[var(--color-primary-btn-bg)]" />
                            <label htmlFor="is-paid-checkbox" className="ml-2 text-sm font-medium">PAID (Don't add to dues)</label>
                        </div>
                    )}
                    <div className="flex justify-end space-x-2 pt-4">
                        <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
                        <ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Adjustment'}</ActionButton>
                    </div>
                </form>
            </div>
        </div>
    );
};
// Main StockTracker component (with Delete modal integrated)
const StockTracker: React.FC<StockTrackerProps> = ({ products, currency, showToast, onAddItem, onUpdateItem, onDeleteItem, onAdjustStock, onRecordPartnerPayment }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [soldData, setSoldData] = useState<Record<string, number>>({});
  const { currentUser } = useAuth();
  
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = listenForInventoryTransactions(currentUser.uid, (transactions: InventoryTransaction[]) => {
        const aggregatedSold: Record<string, number> = {};
        transactions.forEach(t => {
            // Correctly count only stock sold to customers from My Stock
            if ((t.reason === 'invoice_paid' || t.reason === 'sold_to_customer') && (t.changeMyStock ?? 0) < 0) {
                 aggregatedSold[t.productId] = (aggregatedSold[t.productId] || 0) + Math.abs(t.changeMyStock ?? 0);
            }
        });
        setSoldData(aggregatedSold);
    });
    return () => unsubscribe();
  }, [currentUser]);
  
  const handleFormToggle = (item: Product | null = null) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };
  
  const handleSubmit = async (formData: Omit<Product, 'id' | 'name'>) => {
    setIsSubmitting(true);
    try {
        if (editingItem) {
            await onUpdateItem(editingItem.id, formData);
            showToast('Product updated!', 'success');
        } else {
            await onAddItem(formData);
            showToast('Product added!', 'success');
        }
        setIsFormOpen(false);
    } catch (error: any) {
        showToast(error.message || "Failed to save product.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  // New centralized delete flow using modal + onDeleteItem prop
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDeleteItem(deleteTarget.id);
      showToast('Product deleted successfully!', 'success');
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Delete error', err);
      showToast(err?.message || 'Failed to delete product.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStockAdjustment = async (productId: string, type: AdjustmentType, qty: number, price?: number, isPaid?: boolean) => {
      await onAdjustStock(productId, type, qty, price, isPaid);
      showToast('Stock adjusted successfully!', 'success');
  };

  const handlePartnerPayment = async (productId: string, amount: number) => {
      await onRecordPartnerPayment(productId, amount);
      showToast('Partner payment recorded!', 'success');
  };

  const visibleProducts = useMemo(() => {
      return products.filter(p => showArchived ? p.archived : !p.archived);
  }, [products, showArchived]);

  const SidebarButton: React.FC<{label: string; icon: React.ReactNode; active?: boolean; onClick?: () => void}> = ({label, icon, active, onClick}) => (
      <button onClick={onClick} className={`flex flex-col sm:flex-row items-center justify-center flex-1 text-center sm:text-left px-2 sm:px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${active ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)]' : 'hover:bg-black/5 text-[var(--color-main-text)]'}`}>
          {icon}
          <span className="mt-1 sm:mt-0 sm:ml-3 text-xs sm:text-sm">{label}</span>
      </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-[var(--color-card-bg)] p-2 md:p-4 rounded-lg shadow-md flex flex-row md:flex-col gap-2">
                 <SidebarButton label="Products" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2-2H4a2 2 0 01-2-2v-4z" /></svg>} active />
                 <SidebarButton label="Stock Adjustment" onClick={() => setIsAdjustmentModalOpen(true)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>} />
                 <SidebarButton label="Partner Payments" onClick={() => setIsPaymentsModalOpen(true)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.134 0V7.418zM12.5 10a2.5 2.5 0 01-2.5 2.5V10.5a2.5 2.5 0 012.5-2.5V10zM11.567 7.151c.221.07.412.164.567.267V6.5a2.5 2.5 0 00-1.134 0v.651z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM3 10a7 7 0 1114 0 7 7 0 01-14 0z" clipRule="evenodd" /></svg>} />
            </div>
        </aside>
        <main className="flex-1 space-y-8">
            <AnalyticsDashboard products={products} currency={currency} />
            
            <div className="bg-[var(--color-card-bg)] p-6 rounded-lg shadow-md">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold">Products</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center">
                        <input type="checkbox" id="show-archived" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary-btn-bg)] focus:ring-[var(--color-primary-btn-bg)]" />
                        <label htmlFor="show-archived" className="ml-2 text-sm">Show Archived</label>
                    </div>
                    <ActionButton onClick={() => handleFormToggle()}>+ Add Product</ActionButton>
                </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {visibleProducts.map(item => {
                        const partnerDue = Math.max(0, ((item.partnerPrice || 0) * (item.partnerStock || 0)) - (item.amountReceivedFromPartner || 0));
                        const soldQty = soldData[item.id] || 0;
                        
                        const myStockValue = item.purchasePrice ? item.myStock * item.purchasePrice : null;
                        const partnerStockValue = item.partnerPrice ? item.partnerStock * item.partnerPrice : null;
                        const soldStockValue = item.salePrice ? soldQty * item.salePrice : null;

                        return (
                            <div key={item.id} className="bg-[var(--color-app-bg)] rounded-lg shadow-md p-4 flex flex-col space-y-3 border border-black/5">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-2">
                                        <h3 className={`text-xl font-bold ${isUrdu((item as any).name || (item as any).name_ur) ? 'urdu-text text-right w-full' : ''}`}>{(item as any).name || (item as any).name_en || (item as any).name_ur}</h3>
                                    </div>
                                    <span className="text-xs bg-gray-500/10 text-[var(--color-light-text)] px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 whitespace-nowrap">History</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center border-t border-b py-3 border-black/10">
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-light-text)]">My Stock</p>
                                        <p className="text-3xl font-bold text-[var(--color-main-text)] mt-1">{item.myStock}<span className="text-base font-normal"> {item.unit}</span></p>
                                        <p className="text-xs text-gray-400">{myStockValue !== null ? `${currency}${myStockValue.toLocaleString()}` : `${currency} --`}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-light-text)]">Partner</p>
                                        <p className="text-3xl font-bold text-[var(--color-main-text)] mt-1">{item.partnerStock}<span className="text-base font-normal"> {item.unit}</span></p>
                                        <p className="text-xs text-gray-400">{partnerStockValue !== null ? `${currency}${partnerStockValue.toLocaleString()}` : `${currency} --`}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-light-text)]">Sold</p>
                                        <p className="text-3xl font-bold text-[var(--color-main-text)] mt-1">{soldQty}<span className="text-base font-normal"> {item.unit}</span></p>
                                        <p className="text-xs text-gray-400">{soldStockValue !== null ? `${currency}${soldStockValue.toLocaleString()}` : `${currency} --`}</p>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-auto pt-2">
                                    {partnerDue > 0 ? (
                                        <div className="text-xs bg-red-100 text-red-700 p-2 rounded-md dark:bg-red-900/50 dark:text-red-300">
                                            <strong>Due:</strong> {currency}{partnerDue.toFixed(2)}
                                        </div>
                                    ) : <div />}
                                    <div className={`flex items-center space-x-2`}>
                                        <button onClick={() => handleFormToggle(item)} className="text-[var(--color-light-text)] hover:text-[var(--color-primary-btn-bg)] transition-colors p-1 rounded-full" aria-label="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                        {!item.archived && <button onClick={() => setDeleteTarget({ id: item.id, name: (item as any).name || (item as any).name_en || (item as any).name_ur || 'this product' })} className="text-[var(--color-light-text)] hover:text-red-600 transition-colors p-1 rounded-full" aria-label="Delete"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {visibleProducts.length === 0 && <p className="text-center py-8 text-[var(--color-light-text)]">{showArchived ? 'No archived products found.' : 'No products found. Add one to get started!'}</p>}
            </div>
            
            <ProductFormModal 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleSubmit}
                editingItem={editingItem}
                isSubmitting={isSubmitting}
                currency={currency}
            />
            <StockAdjustmentModal 
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                products={products}
                onSubmit={handleStockAdjustment}
            />
            <PartnerPaymentsModal
                isOpen={isPaymentsModalOpen}
                onClose={() => setIsPaymentsModalOpen(false)}
                products={products}
                currency={currency}
                onSubmit={handlePartnerPayment}
            />

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-[var(--color-card-bg)] rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
                        <p className="text-sm text-[var(--color-light-text)] mb-4">Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will remove the product and adjust related stock totals and partner dues.</p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
                            <button onClick={confirmDelete} disabled={deleting} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
                                {deleting ? 'Deleting...' : 'Yes, delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};

export default StockTracker;