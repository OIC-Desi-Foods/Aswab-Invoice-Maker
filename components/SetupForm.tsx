



import React, { useState } from 'react';
import { Invoice, LineItem, DiscountType, SavedClient, SavedProduct, Address, ColumnVisibility, SavedInvoice, Product } from '../types';
import AddressBlock from './AddressBlock';
import FormField from './FormField';
import LineItemRow from './LineItemRow';
import ActionButton from './ActionButton';

interface DataFormProps {
  invoice: Invoice;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice>>;
  subtotal: number;
  discountValue: number;
  taxAmount: number;
  total: number;
  savedClients: SavedClient[];
  onSelectClient: (clientId: string) => void;
  onSaveClient: () => void;
  onRequestDeleteClient: (id: string, name: string) => void;
  products: Product[];
  onAddProductToInvoice: (productId: string) => void;
  columnVisibility: ColumnVisibility;
  onSaveInvoice: (name: string) => void;
  currentInvoiceId: string | null;
  isSaving: boolean;
  savedInvoices: SavedInvoice[];
  onLoadInvoice: (id: string) => void;
  onRequestDeleteInvoice: (id: string, name: string) => void;
  onSaveLineItemAsProduct: (item: LineItem) => void | Promise<void>;
}

const isUrdu = (str: string): boolean => str && /[\u0600-\u06FF]/.test(str);

const DataForm: React.FC<DataFormProps> = ({
  invoice, setInvoice,
  subtotal, discountValue, taxAmount, total,
  savedClients, onSelectClient, onSaveClient, onRequestDeleteClient,
  products, onAddProductToInvoice,
  columnVisibility, onSaveInvoice, currentInvoiceId, isSaving,
  savedInvoices, onLoadInvoice, onRequestDeleteInvoice, onSaveLineItemAsProduct
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isNamingInvoice, setIsNamingInvoice] = useState(false);
  const [invoiceName, setInvoiceName] = useState('');

  const handleClientAddressChange = (field: keyof Omit<Address, 'id'>, value: string) => {
    setInvoice(prev => ({ ...prev, client: { ...prev.client, [field]: value } }));
  };

  const handleInvoiceDetailChange = (field: string, value: string | number | DiscountType) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };
  
  const handleLineItemChange = (id: string, field: string, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddLineItem = () => {
    const newItem: LineItem = { id: crypto.randomUUID(), description: '', quantity: 1, unit: '', price: 0, discount: 0 };
    setInvoice(prev => ({ ...prev, lineItems: [...prev.lineItems, newItem] }));
  };

  const handleRemoveLineItem = (id: string) => {
    setInvoice(prev => ({ ...prev, lineItems: prev.lineItems.filter(item => item.id !== id) }));
  };
  
  const handleAddFromProducts = () => {
      if (selectedProductId) {
          onAddProductToInvoice(selectedProductId);
          setSelectedProductId('');
      }
  }

  return (
    <div className="space-y-6 bg-[var(--color-card-bg)] p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold">Invoice Data</h2>

      <div className="border-b pb-6 dark:border-gray-700">
        <label htmlFor="select-invoice" className="block text-sm font-medium mb-1">Load Saved Invoice</label>
        <div className="flex items-center gap-2">
          <select
            id="select-invoice"
            value={currentInvoiceId || ''}
            onChange={(e) => onLoadInvoice(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">-- New Invoice --</option>
            {savedInvoices.map(inv => (
              <option key={inv.id} value={inv.id} className={isUrdu(inv.name) ? 'urdu-text' : ''}>{inv.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
                if (currentInvoiceId) {
                    const invoiceName = savedInvoices.find(inv => inv.id === currentInvoiceId)?.name || `Invoice #${invoice.invoiceNumber}`;
                    onRequestDeleteInvoice(currentInvoiceId, invoiceName);
                }
            }}
            disabled={!currentInvoiceId}
            className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
            title="Delete Selected Invoice"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>

      <div>
         <div className="mb-4">
          <label htmlFor="select-client" className="block text-sm font-medium mb-1">Select Saved Client</label>
          <select
            id="select-client"
            value={invoice.client.id || ''}
            onChange={(e) => onSelectClient(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">-- New/Custom Client --</option>
            {savedClients.map(client => (
              <option key={client.id} value={client.id} className={isUrdu(client.name) ? 'urdu-text' : ''}>{client.name}</option>
            ))}
          </select>
        </div>
        <AddressBlock title="Bill To (Client)" address={invoice.client} onChange={handleClientAddressChange} />
        <div className="flex items-center gap-2 mt-4">
             <ActionButton onClick={onSaveClient} variant="secondary" className="w-full">
                {invoice.client.id ? 'Update Saved Client' : 'Save as New Client'}
            </ActionButton>
            {invoice.client.id && (
                <button
                    onClick={() => onRequestDeleteClient(invoice.client.id!, invoice.client.name)}
                    className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                    title="Delete Selected Client"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
            )}
        </div>
      </div>

      <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 dark:border-gray-700">
        <FormField label="Invoice Number" value={invoice.invoiceNumber} onChange={e => handleInvoiceDetailChange('invoiceNumber', e.target.value)} />
        <FormField label="Issue Date" type="date" value={invoice.issueDate} onChange={e => handleInvoiceDetailChange('issueDate', e.target.value)} />
        <FormField label="Due Date" type="date" value={invoice.dueDate} onChange={e => handleInvoiceDetailChange('dueDate', e.target.value)} />
      </div>

      <div className="border-t pt-6 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Line Items</h3>
         <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm font-medium opacity-70 mb-2 px-1">
          <div className="col-span-4">Description</div>
          {columnVisibility.quantity && <><div className="col-span-1 text-right">Qty</div><div className="col-span-1 text-left">Unit</div></>}
          {columnVisibility.unitPrice && <div className="col-span-2 text-right">Price</div>}
          {columnVisibility.lineItemDiscount && <div className="col-span-1 text-right">Disc(%)</div>}
          {columnVisibility.lineItemTotal && <div className="col-span-2 text-right">Total</div>}
          <div className="col-span-1"></div>
        </div>
        <div className="space-y-3">
          {invoice.lineItems.map(item => (
            <LineItemRow key={item.id} item={item} currency={invoice.currency} onChange={handleLineItemChange} onRemove={handleRemoveLineItem} onSave={onSaveLineItemAsProduct} columnVisibility={columnVisibility} />
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
          <ActionButton onClick={handleAddLineItem} variant="secondary">Add Custom Item</ActionButton>
           <div className="flex items-center space-x-2 w-full md:w-auto">
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                <option value="" disabled>-- Add from products --</option>
                {products.map(p => <option key={p.id} value={p.id} className={isUrdu(p.name) ? 'urdu-text' : ''}>{p.name} ({p.myStock + p.partnerStock} left)</option>)}
              </select>
              <ActionButton onClick={handleAddFromProducts} disabled={!selectedProductId}>Add</ActionButton>
           </div>
        </div>
      </div>

       <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold">Notes</h3>
          <textarea value={invoice.notes} onChange={e => handleInvoiceDetailChange('notes', e.target.value)} rows={4} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 ${isUrdu(invoice.notes) ? 'urdu-text' : ''}`} placeholder="Thank you for your business!"></textarea>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between"><label className="text-sm font-medium">Subtotal</label><span className="text-sm">{invoice.currency}{subtotal.toFixed(2)}</span></div>
          <div className="flex items-center space-x-2">
            <label htmlFor="discountType" className="text-sm font-medium">Global Discount</label>
            <select id="discountType" value={invoice.discountType} onChange={e => handleInvoiceDetailChange('discountType', e.target.value as DiscountType)} className="block w-24 rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                <option value="percentage">%</option>
                <option value="fixed">{invoice.currency}</option>
            </select>
            <input type="number" value={invoice.discountAmount} onChange={e => handleInvoiceDetailChange('discountAmount', parseFloat(e.target.value) || 0)} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-right dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="flex items-center justify-between"><label className="text-sm font-medium">Discount Value</label><span className="text-sm">-{invoice.currency}{discountValue.toFixed(2)}</span></div>
          <div className="flex items-center space-x-2">
            <label htmlFor="taxRate" className="text-sm font-medium flex-grow">Tax Rate (%)</label>
            <input id="taxRate" type="number" value={invoice.taxRate} onChange={e => handleInvoiceDetailChange('taxRate', parseFloat(e.target.value) || 0)} className="block w-24 rounded-md border-gray-300 shadow-sm sm:text-sm text-right dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="flex items-center justify-between"><label className="text-sm font-medium">Tax Amount</label><span className="text-sm">{invoice.currency}{taxAmount.toFixed(2)}</span></div>
          <div className="border-t pt-4 flex items-center justify-between dark:border-gray-700">
            <label className="text-lg font-bold">Total</label>
            <span className="text-lg font-bold">{invoice.currency}{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="border-t pt-6 dark:border-gray-700">
        {!isNamingInvoice ? (
          <ActionButton
            onClick={() => {
              const defaultName = invoice.client.name || `Invoice ${invoice.invoiceNumber}`;
              const existingName = currentInvoiceId ? savedInvoices.find(i => i.id === currentInvoiceId)?.name : null;
              setInvoiceName(existingName || defaultName);
              setIsNamingInvoice(true);
            }}
            disabled={isSaving}
            className="w-full text-lg py-3"
          >
            {isSaving ? 'Saving...' : (currentInvoiceId ? 'Update Invoice' : 'Save Invoice')}
          </ActionButton>
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
            <FormField
              label={currentInvoiceId ? "Update invoice name" : "Enter a name for this invoice"}
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              placeholder="e.g., Q3 Project Invoice"
            />
            <div className="flex justify-end space-x-2">
              <ActionButton variant="secondary" onClick={() => setIsNamingInvoice(false)} disabled={isSaving}>
                Cancel
              </ActionButton>
              <ActionButton
                onClick={() => {
                  const defaultName = invoice.client.name || `Invoice ${invoice.invoiceNumber}`;
                  const finalName = invoiceName.trim() === '' ? defaultName : invoiceName.trim();
                  onSaveInvoice(finalName);
                  setIsNamingInvoice(false);
                }}
                disabled={isSaving}
              >
                Confirm Save
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataForm;