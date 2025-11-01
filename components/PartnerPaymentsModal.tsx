import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import ActionButton from './ActionButton';
import FormField from './FormField';

interface PartnerPaymentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    currency: string;
    onSubmit: (productId: string, amount: number) => Promise<void>;
}

const PartnerPaymentsModal: React.FC<PartnerPaymentsModalProps> = ({ isOpen, onClose, products, currency, onSubmit }) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [amount, setAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const partnerProducts = useMemo(() => {
        return products.filter(p => !p.archived && (p.partnerStock > 0 || (p.partnerPrice && p.amountReceivedFromPartner !== undefined)));
    }, [products]);

    useEffect(() => {
        if (isOpen) {
            setError('');
            setAmount(0);
            if (partnerProducts.length > 0) {
                setSelectedProductId(partnerProducts[0].id);
            } else {
                setSelectedProductId('');
            }
        }
    }, [isOpen, partnerProducts]);
    
    const selectedProduct = useMemo(() => {
        return partnerProducts.find(p => p.id === selectedProductId);
    }, [selectedProductId, partnerProducts]);

    const partnerDue = useMemo(() => {
        if (!selectedProduct) return 0;
        const totalCost = (selectedProduct.partnerPrice || 0) * (selectedProduct.partnerStock || 0);
        const due = totalCost - (selectedProduct.amountReceivedFromPartner || 0);
        return Math.max(0, due);
    }, [selectedProduct]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedProductId || amount <= 0) {
            setError('Please select a product and enter a valid payment amount.');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(selectedProductId, amount);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to record payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <h3 className="text-2xl font-bold text-center">Record Partner Payment</h3>
                    {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
                    
                    {partnerProducts.length > 0 ? (
                        <>
                            <div>
                                <label htmlFor="product-select-payment" className="block text-sm font-medium mb-1">Product</label>
                                <select id="product-select-payment" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                                    {partnerProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {selectedProduct && (
                                <div className="text-sm text-center bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                                    <p>Current Partner Due for this item: <strong className="text-red-500">{currency}{partnerDue.toFixed(2)}</strong></p>
                                </div>
                            )}

                            <FormField label={`Payment Amount (${currency})`} type="number" min="0.01" step="any" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} required/>

                            <div className="flex justify-end space-x-2 pt-4">
                                <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
                                <ActionButton type="submit" disabled={isSubmitting || !selectedProductId}>{isSubmitting ? 'Saving...' : 'Record Payment'}</ActionButton>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <p className="text-[var(--color-light-text)]">No products with partner stock found.</p>
                            <div className="mt-4">
                                <ActionButton type="button" variant="secondary" onClick={onClose}>Close</ActionButton>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default PartnerPaymentsModal;
