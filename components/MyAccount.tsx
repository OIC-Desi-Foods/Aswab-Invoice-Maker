import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Invoice, Address, ThemeSettings, ThemeColors } from '../types';
import { THEMES, FONT_OPTIONS } from '../constants';
import FormField from './FormField';
import ActionButton from './ActionButton';
import AddressBlock from './AddressBlock';

interface MyAccountProps {
  invoice: Invoice;
  onSaveAccountDetails: () => Promise<void>;
  onAccountDetailsChange: (updates: Partial<Pick<Invoice, 'company'>>) => void;
  onImageChange: (file: File | null, type: 'logo' | 'signature') => void;
  themeSettings: ThemeSettings;
  onThemeChange: (theme: ThemeSettings, save?: boolean) => void;
}

const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-2 hover:bg-black/5 rounded-md">
    <label className="text-sm font-medium text-[var(--color-main-text)]">{label}</label>
    <div className="w-8 h-8 rounded-full border border-black/10 relative overflow-hidden" style={{ backgroundColor: value }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title={`Select ${label.toLowerCase()}`} />
    </div>
  </div>
);

const ThemeCustomizer: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    theme: ThemeSettings;
    onThemeChange: (theme: ThemeSettings, save?: boolean) => void;
}> = ({ isOpen, onClose, theme, onThemeChange }) => {
    const [customTheme, setCustomTheme] = useState(theme);

    useEffect(() => {
        setCustomTheme(theme);
    }, [theme, isOpen]);
    
    const handleColorChange = (field: keyof ThemeColors, value: string) => {
        const newTheme = {
            ...customTheme,
            name: 'custom',
            colors: { ...customTheme.colors, [field]: value }
        };
        setCustomTheme(newTheme);
        onThemeChange(newTheme, false); // Live preview without saving
    };

    const handleReset = () => {
      const defaultTheme = THEMES.light;
      setCustomTheme(defaultTheme);
      onThemeChange(defaultTheme, true); // Reset and save
    }

    const handleSave = () => {
        onThemeChange(customTheme, true);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-center">Customize Theme</h3>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <h4 className="font-semibold mb-2 text-sm uppercase text-[var(--color-light-text)]">General</h4>
                        <ColorInput label="App Background" value={customTheme.colors.appBg} onChange={v => handleColorChange('appBg', v)} />
                        <ColorInput label="Card Background" value={customTheme.colors.cardBg} onChange={v => handleColorChange('cardBg', v)} />
                        <ColorInput label="Main Text" value={customTheme.colors.mainText} onChange={v => handleColorChange('mainText', v)} />
                        <ColorInput label="Light Text" value={customTheme.colors.lightText} onChange={v => handleColorChange('lightText', v)} />
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 text-sm uppercase text-[var(--color-light-text)]">Header</h4>
                        <ColorInput label="Background" value={customTheme.colors.headerBg} onChange={v => handleColorChange('headerBg', v)} />
                        <ColorInput label="Text" value={customTheme.colors.headerText} onChange={v => handleColorChange('headerText', v)} />
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 text-sm uppercase text-[var(--color-light-text)]">Buttons</h4>
                        <ColorInput label="Primary BG" value={customTheme.colors.primaryBtnBg} onChange={v => handleColorChange('primaryBtnBg', v)} />
                        <ColorInput label="Primary Text" value={customTheme.colors.primaryBtnText} onChange={v => handleColorChange('primaryBtnText', v)} />
                        <ColorInput label="Secondary BG" value={customTheme.colors.secondaryBtnBg} onChange={v => handleColorChange('secondaryBtnBg', v)} />
                        <ColorInput label="Secondary Text" value={customTheme.colors.secondaryBtnText} onChange={v => handleColorChange('secondaryBtnText', v)} />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-sm uppercase text-[var(--color-light-text)]">Navigation</h4>
                        <ColorInput label="Active BG" value={customTheme.colors.navActiveBg} onChange={v => handleColorChange('navActiveBg', v)} />
                        <ColorInput label="Active Text" value={customTheme.colors.navActiveText} onChange={v => handleColorChange('navActiveText', v)} />
                    </div>
                </div>
                <div className="p-4 mt-auto border-t bg-[var(--color-app-bg)] flex justify-between items-center">
                    <ActionButton type="button" variant="secondary" onClick={handleReset}>Reset to Default</ActionButton>
                    <div className="space-x-2">
                        <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
                        <ActionButton type="button" onClick={handleSave}>Save Theme</ActionButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyAccount: React.FC<MyAccountProps> = ({
  invoice, onSaveAccountDetails, onAccountDetailsChange, onImageChange, themeSettings, onThemeChange
}) => {
  const { currentUser, updateUserAccount, logout } = useAuth();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isCustomizingTheme, setIsCustomizingTheme] = useState(false);

  const { company, logo, signature } = invoice;

  const handleCompanyChange = (field: keyof Omit<Address, 'id'>, value: string) => {
    onAccountDetailsChange({ company: { ...company, [field]: value } });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    onImageChange(file || null, type);
    e.target.value = '';
  };
  
  const handleRemoveImage = (type: 'logo' | 'signature') => onImageChange(null, type);

  const handleSaveDetails = async () => {
      setIsSavingDetails(true);
      await onSaveAccountDetails();
      setIsSavingDetails(false);
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password && password !== confirmPassword) { setError('New passwords do not match.'); return; }
    if (password && !currentPassword) { setError('Please enter your current password to set a new one.'); return; }
    if (!currentUser) return;
    setIsUpdatingAccount(true);
    try {
      await updateUserAccount(name, password || undefined, currentPassword || undefined);
      setSuccess('Account updated successfully!');
      setPassword(''); setConfirmPassword(''); setCurrentPassword('');
    } catch (err: any) {
        setError(err.code === 'auth/wrong-password' ? 'Incorrect current password.' : `Failed to update: ${err.message}`);
    } finally { setIsUpdatingAccount(false); }
  };

  return (
    <>
      <div className="space-y-6 bg-[var(--color-card-bg)] p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold">Company & Account</h2>
        
        <div className="border-t pt-4 dark:border-gray-700">
           <AddressBlock title="Your Company Details" address={company} onChange={handleCompanyChange} />
        </div>

        <div className="border-t pt-4 space-y-2 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Branding</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <h4 className="text-sm font-medium opacity-80 mb-2">Company Logo</h4>
                  {logo ? (
                  <div className="flex items-center space-x-4">
                      <img src={logo} alt="Logo" className="h-16 w-auto object-contain rounded-md border p-1 bg-gray-50 dark:bg-gray-800 dark:border-gray-600" />
                      <button onClick={() => handleRemoveImage('logo')} className="text-sm font-medium text-red-600 hover:text-red-800">Remove</button>
                  </div>
                  ) : (
                  <input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="text-sm" />
                  )}
              </div>
               <div>
                  <h4 className="text-sm font-medium opacity-80 mb-2">Signature</h4>
                  {signature ? (
                  <div className="flex items-center space-x-4">
                      <img src={signature} alt="Signature" className="h-16 w-auto object-contain rounded-md border p-1 bg-gray-50 dark:bg-gray-800 dark:border-gray-600" />
                      <button onClick={() => handleRemoveImage('signature')} className="text-sm font-medium text-red-600 hover:text-red-800">Remove</button>
                  </div>
                  ) : (
                   <input id="signature-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} className="text-sm" />
                  )}
              </div>
            </div>
            <ActionButton onClick={handleSaveDetails} disabled={isSavingDetails} className="w-full mt-4">
                {isSavingDetails ? 'Saving...' : 'Save Company Info'}
            </ActionButton>
        </div>
        
        <div className="border-t pt-4 space-y-2 dark:border-gray-700">
          <h3 className="text-lg font-semibold">App Theme</h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(THEMES).map(theme => (
              <ActionButton key={theme.name} onClick={() => onThemeChange(theme)} variant="secondary" className="capitalize">{theme.name}</ActionButton>
            ))}
            <ActionButton onClick={() => setIsCustomizingTheme(true)} variant="secondary">Customize Theme</ActionButton>
          </div>
        </div>

        <form onSubmit={handleAccountUpdate} className="space-y-4 border-t pt-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Login Credentials</h3>
          {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
          {success && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">{success}</div>}
          <FormField label="Full Name" id="name-update" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          <FormField label="Current Password" id="current-password-update" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Required to change password" />
          <FormField label="New Password (optional)" id="password-update" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
          <FormField label="Confirm New Password" id="confirm-password-update" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={!password} />

          <ActionButton type="submit" disabled={isUpdatingAccount} className="w-full">{isUpdatingAccount ? 'Updating...' : 'Update Account'}</ActionButton>
        </form>
        <ActionButton onClick={logout} variant="secondary" className="w-full">Logout</ActionButton>
      </div>
      <ThemeCustomizer 
        isOpen={isCustomizingTheme}
        onClose={() => setIsCustomizingTheme(false)}
        theme={themeSettings}
        onThemeChange={onThemeChange}
      />
    </>
  );
};

export default MyAccount;
