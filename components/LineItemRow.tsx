import React from 'react';
// FIX: ColumnVisibility is exported from types.ts, not App.tsx.
import { LineItem, ColumnVisibility } from '../types';
// FIX: Removed incorrect import of `ColumnVisibility` from `../App`. `App.tsx` does not export this type.
// The type is correctly imported from `../types` and the aliased import `AppColumnVisibility` was unused.

interface LineItemRowProps {
  item: LineItem;
  currency: string;
  onChange: (id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => void;
  onRemove: (id: string) => void;
  onSave: (item: LineItem) => void | Promise<void>;
  columnVisibility: ColumnVisibility;
}

const isUrdu = (str: string): boolean => str && /[\u0600-\u06FF]/.test(str);

const LineItemRow: React.FC<LineItemRowProps> = ({ item, currency, onChange, onRemove, onSave, columnVisibility }) => {
  const itemSubtotal = item.quantity * item.price;
  const itemDiscount = itemSubtotal * (item.discount / 100);
  const itemTotal = itemSubtotal - itemDiscount;

  return (
    <div className="grid grid-cols-2 md:grid-cols-12 gap-x-2 gap-y-4 items-start p-4 border rounded-lg md:p-0 md:border-none">
      <div className="col-span-2 md:col-span-4">
        <label className="text-sm font-medium text-gray-700 mb-1 md:hidden">Description</label>
        <input
          type="text"
          placeholder="Description"
          value={item.description}
          onChange={e => onChange(item.id, 'description', e.target.value)}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${isUrdu(item.description) ? 'urdu-text' : ''}`}
        />
      </div>
      {columnVisibility.quantity && (
        <>
          <div className="col-span-1 md:col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1 md:hidden">Qty</label>
              <input
              type="number"
              step="any"
              placeholder="Qty"
              value={item.quantity}
              onChange={e => onChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-right"
              />
          </div>
          <div className="col-span-1 md:col-span-1">
             <label className="text-sm font-medium text-gray-700 mb-1 md:hidden">Unit</label>
             <input
              type="text"
              placeholder="Unit"
              value={item.unit || ''}
              onChange={e => onChange(item.id, 'unit', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
          </div>
        </>
      )}
      {columnVisibility.unitPrice && (
         <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 md:hidden">Price</label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">{currency}</span>
                </div>
                <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={e => onChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-right pl-7"
                />
            </div>
        </div>
      )}
      {columnVisibility.lineItemDiscount && (
        <div className="col-span-1 md:col-span-1">
             <label className="text-sm font-medium text-gray-700 mb-1 md:hidden">Discount (%)</label>
             <div className="relative">
                <input
                    type="number"
                    placeholder="Discount"
                    value={item.discount}
                    onChange={e => onChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-right pr-7"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">%</span>
                </div>
            </div>
        </div>
      )}
      {columnVisibility.lineItemTotal && (
        <div className="col-span-1 md:col-span-2 flex flex-col items-end justify-center h-full">
            <label className="text-sm font-medium text-gray-700 mb-1 md:hidden self-start">Total</label>
            <span className="font-medium text-gray-800 md:text-sm md:text-gray-500">{currency}{itemTotal.toFixed(2)}</span>
        </div>
      )}
      <div className="col-span-2 md:col-span-1 flex justify-end items-center h-full space-x-2">
         <button
          onClick={() => onSave(item)}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Save item"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002 2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-600 transition-colors"
          aria-label="Remove item"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LineItemRow;