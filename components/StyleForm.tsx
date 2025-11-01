

import React, { useState, useEffect } from 'react';
import { Invoice, Template, TemplateStyle, LayoutSettings, ColumnVisibility, InvoiceStyleProfile } from '../types';
import { FONT_OPTIONS, CURRENCIES } from '../constants';
import FormField from './FormField';
import ActionButton from './ActionButton';

interface TemplateSelectorProps {
  templates: Template[];
  activeTemplateId: string;
  onTemplateChange: (id: string) => void;
  customStyle: TemplateStyle;
  onCustomStyleChange: (style: TemplateStyle) => void;
}

const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <label className="text-sm opacity-90">{label}</label>
    <div className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 relative overflow-hidden" style={{ backgroundColor: value }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title={`Select ${label.toLowerCase()}`} />
    </div>
  </div>
);

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, activeTemplateId, onTemplateChange, customStyle, onCustomStyleChange }) => {
  const isCustomActive = activeTemplateId === 'custom';
  const handleStyleChange = (field: keyof TemplateStyle, value: string | number) => onCustomStyleChange({ ...customStyle, [field]: value });

  return (
    <div className="border-t pt-6 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Invoice Appearance</h3>
      <div>
        <label htmlFor="template-select" className="block text-sm font-medium mb-1">Select Invoice Template</label>
        <select id="template-select" value={activeTemplateId} onChange={e => onTemplateChange(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600">
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {isCustomActive && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md space-y-3 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold">Customize Your Template</h4>
          <ColorInput label="Primary Color" value={customStyle.primaryColor} onChange={v => handleStyleChange('primaryColor', v)} />
          <ColorInput label="Background Color" value={customStyle.backgroundColor} onChange={v => handleStyleChange('backgroundColor', v)} />
          <ColorInput label="Text Color" value={customStyle.textColor} onChange={v => handleStyleChange('textColor', v)} />
          <ColorInput label="Header Background" value={customStyle.headerBackgroundColor} onChange={v => handleStyleChange('headerBackgroundColor', v)} />
          <ColorInput label="Border Color" value={customStyle.borderColor} onChange={v => handleStyleChange('borderColor', v)} />
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <label htmlFor="border-width" className="flex justify-between text-sm font-medium"><span>Border Width</span><span>{customStyle.borderWidth}px</span></label>
            <input type="range" id="border-width" min="0" max="10" value={customStyle.borderWidth} onChange={e => handleStyleChange('borderWidth', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="border-style" className="text-sm">Border Style</label>
            <select id="border-style" value={customStyle.borderStyle} onChange={e => handleStyleChange('borderStyle', e.target.value)} className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                {(['none', 'solid', 'dashed', 'dotted', 'double'] as const).map(style => <option key={style} value={style} className="capitalize">{style}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <label htmlFor="font-family" className="text-sm">Font Family</label>
            <select id="font-family" value={customStyle.fontFamily} onChange={e => handleStyleChange('fontFamily', e.target.value)} className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                {FONT_OPTIONS.map(font => <option key={font} value={font}>{font.split(',')[0].replace(/'/g, '')}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

interface StyleFormProps {
  invoice: Invoice;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice>>;
  columnVisibility: ColumnVisibility;
  setColumnVisibility: React.Dispatch<React.SetStateAction<ColumnVisibility>>;
  templates: Template[];
  activeTemplateId: string;
  onTemplateChange: (id: string) => void;
  customTemplateStyle: TemplateStyle;
  onCustomTemplateStyleChange: (style: TemplateStyle) => void;
  layoutSettings: LayoutSettings;
  onLayoutSettingsChange: (settings: Partial<LayoutSettings>) => void;
  showLogoWatermark: boolean;
  setShowLogoWatermark: React.Dispatch<React.SetStateAction<boolean>>;
  savedProfiles: InvoiceStyleProfile[];
  activeProfileId: string | null;
  onLoadProfile: (profileId: string) => void;
  onSaveProfile: (name: string) => void;
  onRequestDeleteProfile: (profileId: string, name: string) => void;
}

const StyleForm: React.FC<StyleFormProps> = ({
  invoice, setInvoice, columnVisibility, setColumnVisibility, templates, activeTemplateId, onTemplateChange, customTemplateStyle, onCustomTemplateStyleChange,
  layoutSettings, onLayoutSettingsChange, showLogoWatermark, setShowLogoWatermark, savedProfiles, activeProfileId, onLoadProfile, onSaveProfile, onRequestDeleteProfile
}) => {
  const [profileName, setProfileName] = useState('');
  useEffect(() => { setProfileName(activeProfileId ? savedProfiles.find(p => p.id === activeProfileId)?.name || '' : ''); }, [activeProfileId, savedProfiles]);
  const handleColumnVisibilityChange = (column: keyof ColumnVisibility) => setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  const handleLayoutChange = (field: keyof LayoutSettings, value: string | number) => onLayoutSettingsChange({ [field]: value });

  return (
    <div className="space-y-6 bg-[var(--color-card-bg)] p-6 rounded-lg shadow-md">
        <div className="space-y-4">
             <h3 className="text-lg font-semibold">General Invoice Settings</h3>
             <div className="flex items-center justify-between">
              <label htmlFor="currency" className="text-sm font-medium">Currency</label>
              <select id="currency" value={invoice.currency} onChange={(e) => setInvoice(prev => ({...prev, currency: e.target.value}))} className="h-9 rounded-md border-gray-300 sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="enable-tax" className="text-sm font-medium whitespace-nowrap">Enable Tax</label>
                <input type="checkbox" id="enable-tax" checked={invoice.isTaxEnabled} onChange={(e) => setInvoice(prev => ({ ...prev, isTaxEnabled: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="logoWatermark" className="text-sm font-medium whitespace-nowrap">Logo Watermark</label>
                <input type="checkbox" id="logoWatermark" checked={showLogoWatermark} onChange={(e) => setShowLogoWatermark(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" disabled={!invoice.logo} />
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="watermark" className="text-sm font-medium whitespace-nowrap">'PAID' Watermark</label>
                <input type="checkbox" id="watermark" checked={invoice.isPaid || false} onChange={(e) => setInvoice(prev => ({ ...prev, isPaid: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
            </div>
        </div>

      <TemplateSelector templates={templates} activeTemplateId={activeTemplateId} onTemplateChange={onTemplateChange} customStyle={customTemplateStyle} onCustomStyleChange={onCustomTemplateStyleChange} />

      <div className="border-t pt-6 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Invoice Layout & Sizing</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="logo-size" className="flex justify-between text-sm font-medium"><span>Logo Size</span><span>{layoutSettings.logoSize}px</span></label>
            <input type="range" id="logo-size" min="20" max="200" value={layoutSettings.logoSize} onChange={e => handleLayoutChange('logoSize', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 dark:bg-gray-700" disabled={!invoice.logo} />
          </div>
          <div>
            <label htmlFor="company-name-size" className="flex justify-between text-sm font-medium"><span>Company Name Size</span><span>{layoutSettings.companyNameSize.toFixed(2)}rem</span></label>
            <input type="range" id="company-name-size" min="1.5" max="3.75" step="0.05" value={layoutSettings.companyNameSize} onChange={e => handleLayoutChange('companyNameSize', parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="signature-size" className="flex justify-between text-sm font-medium"><span>Signature Size</span><span>{layoutSettings.signatureSize}px</span></label>
            <input type="range" id="signature-size" min="20" max="150" value={layoutSettings.signatureSize} onChange={e => handleLayoutChange('signatureSize', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 dark:bg-gray-700" disabled={!invoice.signature} />
          </div>
           <div>
            <label htmlFor="watermark-size" className="flex justify-between text-sm font-medium"><span>'PAID' Stamp Size</span><span>{layoutSettings.watermarkSize.toFixed(2)}rem</span></label>
            <input type="range" id="watermark-size" min="1" max="4" step="0.1" value={layoutSettings.watermarkSize} onChange={e => handleLayoutChange('watermarkSize', parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Header Alignment</label>
            <div className="flex space-x-2 rounded-md bg-gray-100 dark:bg-gray-800 p-1">
              {(['left', 'center', 'right'] as const).map(align => <button key={align} onClick={() => handleLayoutChange('logoAlignment', align)} className={`w-full px-3 py-1 text-sm rounded-md capitalize transition-colors ${layoutSettings.logoAlignment === align ? 'bg-[var(--color-card-bg)] shadow-sm font-semibold' : 'bg-transparent'}`}>{align}</button>)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Signature Alignment</label>
            <div className="flex space-x-2 rounded-md bg-gray-100 dark:bg-gray-800 p-1">
              {(['left', 'center', 'right'] as const).map(align => <button key={align} onClick={() => handleLayoutChange('signatureAlignment', align)} className={`w-full px-3 py-1 text-sm rounded-md capitalize transition-colors ${layoutSettings.signatureAlignment === align ? 'bg-[var(--color-card-bg)] shadow-sm font-semibold' : 'bg-transparent'}`}>{align}</button>)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-6 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Customize Columns</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.keys(columnVisibility).map((col) => (
            <div key={col} className="flex items-center">
              <input type="checkbox" id={`vis-${col}`} checked={columnVisibility[col as keyof ColumnVisibility]} onChange={() => handleColumnVisibilityChange(col as keyof ColumnVisibility)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
              <label htmlFor={`vis-${col}`} className="ml-2 capitalize">{col.replace(/([A-Z])/g, ' $1').replace('line Item', 'Line')}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6 dark:border-gray-700">
        <h3 className="text-xl font-bold">Invoice Style Profiles</h3>
        <p className="text-sm opacity-70 mt-1">Save and load collections of styles for your invoices.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mt-4">
          <div>
            <label htmlFor="select-profile-style" className="block text-sm font-medium mb-1">Load Invoice Style</label>
            <select id="select-profile-style" value={activeProfileId || ''} onChange={(e) => onLoadProfile(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600">
              <option value="">-- Default Style --</option>
              {savedProfiles.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </div>
          {activeProfileId && ( <ActionButton onClick={() => { 
                if (activeProfileId) {
                    const profileName = savedProfiles.find(p => p.id === activeProfileId)?.name || 'this profile';
                    onRequestDeleteProfile(activeProfileId, profileName);
                }
            }} variant="secondary" className="!bg-red-50 !text-red-700 hover:!bg-red-100 dark:!bg-red-900/50 dark:!text-red-300 dark:hover:!bg-red-900 w-full sm:w-auto">Delete Profile</ActionButton> )}
        </div>
        <div className="flex items-end space-x-2 mt-2">
          <div className="flex-grow">
            <FormField label="Style Profile Name" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g., Modern Blue Theme" />
          </div>
          <ActionButton onClick={() => onSaveProfile(profileName.trim())} title="Save current styles">
            {savedProfiles.some(p => p.id === activeProfileId) ? 'Update Style' : 'Save as New Style'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};
export default StyleForm;