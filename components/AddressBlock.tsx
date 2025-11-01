import React from 'react';
import { Address } from '../types';
import FormField from './FormField';

interface AddressBlockProps {
  title: string;
  address: Address;
  // Fix: Changed `keyof Address` to `keyof Omit<Address, 'id'>` to match the handler in InvoiceForm, which does not expect to handle the 'id' field.
  onChange: (field: keyof Omit<Address, 'id'>, value: string) => void;
}

const AddressBlock: React.FC<AddressBlockProps> = ({ title, address, onChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <FormField label="Name" value={address.name} onChange={e => onChange('name', e.target.value)} />
      <FormField label="Street Address" value={address.street} onChange={e => onChange('street', e.target.value)} />
      <FormField label="City, State, Zip" value={address.cityStateZip} onChange={e => onChange('cityStateZip', e.target.value)} />
      <FormField label="Phone" type="tel" value={address.phone} onChange={e => onChange('phone', e.target.value)} />
      <FormField label="Email" type="email" value={address.email} onChange={e => onChange('email', e.target.value)} />
    </div>
  );
};

export default AddressBlock;