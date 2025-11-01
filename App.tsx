import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Invoice, SavedClient, SavedProduct, LineItem, Template, TemplateStyle, LayoutSettings, ColumnVisibility, InvoiceStyleProfile, Address, SavedInvoice, UserData, Product, ThemeSettings } from './types';
// FIX: Corrected typo from INITIAL_INVOOICE to INITIAL_INVOICE.
import { INITIAL_INVOICE, SAMPLE_INVOICE, TEMPLATES, THEMES } from './constants';
import DataForm from './components/SetupForm';
import StyleForm from './components/StyleForm';
import InvoicePreview from './components/InvoicePreview';
import ActionButton from './components/ActionButton';
import MyAccount from './components/MyAccount';
import Toast from './components/Toast';
import StockTracker from './components/StockTracker';
import Login from "./components/Login";
import { useAuth } from './contexts/AuthContext';
import { 
    getUserData, 
    updateUserData, 
    initializeUserData, 
    listenForInvoices, 
    addInvoice, 
    updateInvoice, 
    deleteInvoiceFromDb, 
    listenForClients,
    addClient,
    updateClient,
    deleteClient,
    listenForProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    listenForInventoryTransactions,
    adjustStock,
    recordPartnerPayment,
} from './firebase/firestore';
import ConfirmationModal from './components/ConfirmationModal';


declare var jspdf: any;
declare var html2canvas: any;

const initialLayoutSettings: LayoutSettings = {
    logoSize: 80,
    companyNameSize: 2.25,
    signatureSize: 64,
    logoAlignment: 'left',
    signatureAlignment: 'right',
    watermarkSize: 2,
};

const initialColumnVisibility: ColumnVisibility = {
    quantity: true,
    unitPrice: true,
    lineItemDiscount: true,
    lineItemTotal: true,
};

const initialTemplateId = 'modern';
const initialCustomTemplateStyle = TEMPLATES.find(t => t.id === 'custom')?.style || TEMPLATES[0].style;

const App: React.FC = () => {
  const { currentUser, logout } = useAuth();

  // FIX: Corrected typo from INITIAL_INVOOICE to INITIAL_INVOICE.
  const [invoice, setInvoice] = useState<Invoice>(INITIAL_INVOICE);
  const [isPdfSaving, setIsPdfSaving] = useState(false);
  const [isPngSaving, setIsPngSaving] = useState(false);
  const [isInvoiceSaving, setIsInvoiceSaving] = useState(false);
  
  const [showLogoWatermark, setShowLogoWatermark] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [savedInvoiceProfiles, setSavedInvoiceProfiles] = useState<InvoiceStyleProfile[]>([]);
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  
  const [activeInvoiceProfileId, setActiveInvoiceProfileId] = useState<string | null>(null);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(initialColumnVisibility);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(initialTemplateId);
  const [customTemplateStyle, setCustomTemplateStyle] = useState<TemplateStyle>(initialCustomTemplateStyle);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(initialLayoutSettings);
  
  const [activeModule, setActiveModule] = useState<'invoicing' | 'stock'>('invoicing');
  const [activeView, setActiveView] = useState<'account' | 'data' | 'style'>('account');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(THEMES.light);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'invoice' | 'client' | 'profile';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const applyTheme = (theme: ThemeSettings) => {
    const root = document.documentElement;
    const { colors, fontFamily, backgroundStyle } = theme;
    
    if (backgroundStyle === 'gradient') {
        root.style.setProperty('--color-app-bg', 'transparent');
        document.body.style.background = `linear-gradient(145deg, ${colors.primaryBtnBg} 0%, ${colors.appBg} 50%)`;
    } else {
        root.style.setProperty('--color-app-bg', colors.appBg);
        document.body.style.background = '';
    }

    root.style.setProperty('--color-card-bg', colors.cardBg);
    root.style.setProperty('--color-main-text', colors.mainText);
    root.style.setProperty('--color-light-text', colors.lightText);
    root.style.setProperty('--color-header-bg', colors.headerBg);
    root.style.setProperty('--color-header-text', colors.headerText);
    root.style.setProperty('--color-primary-btn-bg', colors.primaryBtnBg);
    root.style.setProperty('--color-primary-btn-text', colors.primaryBtnText);
    root.style.setProperty('--color-secondary-btn-bg', colors.secondaryBtnBg);
    root.style.setProperty('--color-secondary-btn-text', colors.secondaryBtnText);
    root.style.setProperty('--color-nav-active-bg', colors.navActiveBg);
    root.style.setProperty('--color-nav-active-text', colors.navActiveText);
    root.style.setProperty('--font-family', fontFamily);
  };
  
  useEffect(() => {
    applyTheme(themeSettings);
  }, [themeSettings]);


  useEffect(() => {
    if (!currentUser) {
        // FIX: Corrected typo from INITIAL_INVOOICE to INITIAL_INVOICE.
        setInvoice(INITIAL_INVOICE);
        setSavedClients([]);
        setSavedInvoices([]);
        setProducts([]);
        setSavedInvoiceProfiles([]);
        setCurrentInvoiceId(null);
        setActiveInvoiceProfileId(null);
        setActiveTemplateId(initialTemplateId);
        setCustomTemplateStyle(initialCustomTemplateStyle);
        setLayoutSettings(initialLayoutSettings);
        setColumnVisibility(initialColumnVisibility);
        setActiveView('account');
        setThemeSettings(THEMES.light);
        return;
    }
    
    const unsubscribeInvoices = listenForInvoices(currentUser.uid, setSavedInvoices);
    const unsubscribeClients = listenForClients(currentUser.uid, setSavedClients);
    const unsubscribeProducts = listenForProducts(currentUser.uid, setProducts);

    const loadData = async () => {
      try {
        let userData = await getUserData(currentUser.uid);

        if (!userData) {
          userData = await initializeUserData(currentUser);
        }
        
        if (userData.accountData) {
            // FIX: Corrected typo from INITIAL_INVOOICE to INITIAL_INVOICE.
            const mergedCompany = { ...INITIAL_INVOICE.company, ...userData.accountData.company };
            setInvoice(prev => ({
                ...prev,
                company: mergedCompany,
                logo: userData.accountData.logo || undefined,
                signature: userData.accountData.signature || undefined,
                currency: userData.accountData.currency || 'Rs',
            }));
        }

        const localLogo = localStorage.getItem(`logo_${currentUser.uid}`);
        const localSignature = localStorage.getItem(`signature_${currentUser.uid}`);
        if (localLogo || localSignature) {
            setInvoice(prev => ({
                ...prev,
                ...(localLogo && { logo: localLogo }),
                ...(localSignature && { signature: localSignature }),
            }));
        }

        setSavedInvoiceProfiles(userData.savedInvoiceProfiles || []);
        
        if (userData.activeInvoiceProfileId && userData.savedInvoiceProfiles?.some(p => p.id === userData.activeInvoiceProfileId)) {
            handleLoadProfile(userData.activeInvoiceProfileId, userData.savedInvoiceProfiles, true);
        } else {
            setActiveInvoiceProfileId(null);
        }

        if (userData.themeSettings) {
            setThemeSettings(userData.themeSettings);
        }

      } catch (error) {
        console.error("Failed to load user data from Firestore:", error);
        showToast("Error: Could not load your data.", 'error');
      }
    };
    
    loadData();

    return () => {
      unsubscribeInvoices();
      unsubscribeClients();
      unsubscribeProducts();
    };
  }, [currentUser]);


  const handleReset = async () => {
    if (!currentUser) return;
    const freshInvoice = {
      // FIX: Corrected typo from INITIAL_INVOOICE to INITIAL_INVOICE.
      ...INITIAL_INVOICE,
      company: invoice.company,
      logo: invoice.logo,
      signature: invoice.signature,
      currency: invoice.currency,
      isPaid: false,
    };
    setInvoice(freshInvoice);
    setShowLogoWatermark(false);
    setCurrentInvoiceId(null);
    
    setActiveInvoiceProfileId(null);
    setActiveTemplateId(initialTemplateId);
    setCustomTemplateStyle(initialCustomTemplateStyle);
    setLayoutSettings(initialLayoutSettings);
    setColumnVisibility(initialColumnVisibility);

    try {
        await updateUserData(currentUser.uid, { activeInvoiceProfileId: null });
    } catch(e) {
        showToast("Error resetting view.", "error");
    }
  };

    const handleImageChange = async (file: File | null, type: 'logo' | 'signature') => {
        if (!currentUser) return;
        const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
        const key = `${type}_${currentUser.uid}`;
        if (file) {
          try {
            const base64 = await toBase64(file);
            localStorage.setItem(key, base64);
            setInvoice(prev => ({ ...prev, [type]: base64 }));
          } catch (error) { showToast("Could not process image.", "error"); }
        } else {
          localStorage.removeItem(key);
          setInvoice(prev => ({ ...prev, [type]: undefined }));
        }
    };

    const handleAccountDetailsChange = (updates: Partial<Pick<Invoice, 'company'>>) => {
        setInvoice(prev => ({ ...prev, company: {...prev.company, ...updates.company} }));
    };

    const handleSaveAccountDetails = async () => {
        if (!currentUser) return;
        try {
            const accountDataToSave = {
                company: invoice.company,
                currency: invoice.currency,
            };
            await updateUserData(currentUser.uid, { accountData: accountDataToSave });
            showToast("Account details saved!", "success");
        } catch (e) {
            showToast("Failed to save account details.", "error");
        }
    };

    const handleThemeChange = async (theme: ThemeSettings, save: boolean = true) => {
      setThemeSettings(theme);
      if (save && currentUser) {
        try {
          await updateUserData(currentUser.uid, { themeSettings: theme });
          showToast("Theme updated!", "success");
        } catch (e) {
          showToast("Failed to update theme.", "error");
        }
      }
    };

  const handleTemplateChange = (id: string) => setActiveTemplateId(id);
  const handleCustomTemplateStyleChange = (style: TemplateStyle) => setCustomTemplateStyle(style);
  const handleLayoutSettingsChange = (settings: Partial<LayoutSettings>) => setLayoutSettings(prev => ({ ...prev, ...settings }));
  
  const activeTemplate = useMemo(() => {
    if (activeTemplateId === 'custom') {
      return { id: 'custom', name: 'Custom', style: customTemplateStyle };
    }
    return TEMPLATES.find(t => t.id === activeTemplateId) || TEMPLATES[0];
  }, [activeTemplateId, customTemplateStyle]);

  const subtotal = useMemo(() => invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.price * (1 - item.discount / 100)), 0), [invoice.lineItems]);
  const discountValue = useMemo(() => invoice.discountType === 'percentage' ? subtotal * (invoice.discountAmount / 100) : invoice.discountAmount, [subtotal, invoice.discountType, invoice.discountAmount]);
  const subtotalAfterDiscount = useMemo(() => subtotal - discountValue, [subtotal, discountValue]);
  const taxAmount = useMemo(() => subtotalAfterDiscount * (invoice.taxRate / 100), [subtotalAfterDiscount, invoice.taxRate]);
  const total = useMemo(() => subtotalAfterDiscount + (invoice.isTaxEnabled ? taxAmount : 0), [subtotalAfterDiscount, taxAmount, invoice.isTaxEnabled]);

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    setIsPdfSaving(true);
    const originalScale = zoomLevel; setZoomLevel(100); await new Promise(r => setTimeout(r, 100));
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: activeTemplate.style.backgroundColor });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = jspdf;
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast("Could not generate PDF.", "error");
    } finally {
      setZoomLevel(originalScale);
      setIsPdfSaving(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!previewRef.current) return;
    setIsPngSaving(true);
    const originalScale = zoomLevel; setZoomLevel(100); await new Promise(r => setTimeout(r, 100));
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: activeTemplate.style.backgroundColor });
      const link = document.createElement('a');
      link.download = `${invoice.invoiceNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Error generating PNG:", error);
      showToast("Could not generate PNG.", "error");
    } finally {
      setZoomLevel(originalScale);
      setIsPngSaving(false);
    }
  };

  const handleSaveInvoice = async (name: string) => {
    if (!currentUser) return;

    setIsInvoiceSaving(true);
    try {
        const invoiceToSave: Omit<SavedInvoice, 'id' | 'uid' | 'createdAt'> = {
            ...invoice,
            name: name,
        };
        if (currentInvoiceId) {
            const oldInvoice = savedInvoices.find(inv => inv.id === currentInvoiceId);
            await updateInvoice(currentUser.uid, currentInvoiceId, invoiceToSave, oldInvoice, products);
            showToast("Invoice updated successfully!");
        } else {
            const newId = await addInvoice(currentUser.uid, invoiceToSave, products);
            setCurrentInvoiceId(newId);
            showToast("New invoice saved successfully!");
        }
    } catch (e: any) {
        showToast(`Error saving invoice: ${e.message}`, "error");
    } finally {
        setIsInvoiceSaving(false);
    }
  };

  const handleLoadInvoice = (id: string) => {
    const loadedInvoice = savedInvoices.find(inv => inv.id === id);
    if (loadedInvoice) {
        setInvoice(loadedInvoice);
        setCurrentInvoiceId(id);
        showToast(`Loaded invoice: ${loadedInvoice.name}`);
    } else {
        handleReset();
    }
  };

  const requestInvoiceDeletion = (id: string, name: string) => {
    setDeleteConfirmation({ type: 'invoice', id, name });
  };

  const handleSelectClient = (clientId: string) => {
    const selected = savedClients.find(c => c.id === clientId);
    if (selected) {
        setInvoice(prev => ({ ...prev, client: selected }));
    } else {
        // FIX: Corrected typo from INITIAL_INVOOICE to INITIAL_INVOICE.
        setInvoice(prev => ({ ...prev, client: { ...INITIAL_INVOICE.client, id: undefined } }));
    }
  };
  const handleSaveClient = async () => {
    if (!currentUser) return;
    const clientToSave = { ...invoice.client };
    if (!clientToSave.name.trim()) { showToast("Client name is required.", "error"); return; }
    try {
        if (clientToSave.id) {
            await updateClient(currentUser.uid, clientToSave.id, clientToSave);
            showToast("Client updated!");
        } else {
            const newId = await addClient(currentUser.uid, clientToSave);
            setInvoice(prev => ({ ...prev, client: { ...prev.client, id: newId } }));
            showToast("New client saved!");
        }
    } catch (e) {
        showToast("Error saving client.", "error");
    }
  };
  
  const requestClientDeletion = (id: string, name: string) => {
    if (!invoice.client.id) return;
    setDeleteConfirmation({ type: 'client', id, name });
  };

  const handleAddProductToInvoice = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        const newItem: LineItem = {
            id: crypto.randomUUID(),
            description: product.name,
            quantity: 1,
            unit: product.unit,
            price: product.salePrice,
            discount: 0,
            productId: product.id,
        };
        setInvoice(prev => ({ ...prev, lineItems: [...prev.lineItems, newItem] }));
    }
  };

  const handleSaveProfile = async (name: string) => {
    if (!currentUser) return;
    if (!name) { showToast("Profile name cannot be empty.", "error"); return; }
    
    const profile: InvoiceStyleProfile = {
        id: activeInvoiceProfileId || crypto.randomUUID(), name, activeTemplateId, customTemplateStyle,
        layoutSettings, columnVisibility, currency: invoice.currency
    };

    const newProfiles = savedInvoiceProfiles.filter(p => p.id !== profile.id);
    newProfiles.push(profile);

    try {
        await updateUserData(currentUser.uid, { savedInvoiceProfiles: newProfiles, activeInvoiceProfileId: profile.id });
        setSavedInvoiceProfiles(newProfiles);
        setActiveInvoiceProfileId(profile.id);
        showToast("Style profile saved!");
    } catch(e) {
        showToast("Error saving profile.", "error");
    }
  };

  const handleLoadProfile = (profileId: string, profiles = savedInvoiceProfiles, silent = false) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
        setActiveTemplateId(profile.activeTemplateId);
        setCustomTemplateStyle(profile.customTemplateStyle);
        setLayoutSettings(profile.layoutSettings);
        setColumnVisibility(profile.columnVisibility);
        setInvoice(prev => ({ ...prev, currency: profile.currency }));
        setActiveInvoiceProfileId(profileId);
        if (!silent) showToast(`Loaded profile: ${profile.name}`);
    } else {
        setActiveTemplateId(initialTemplateId);
        setCustomTemplateStyle(initialCustomTemplateStyle);
        setLayoutSettings(initialLayoutSettings);
        setColumnVisibility(initialColumnVisibility);
        setActiveInvoiceProfileId(null);
    }
  };

  const requestProfileDeletion = (id: string, name: string) => {
    setDeleteConfirmation({ type: 'profile', id, name });
  };
  
  const handleConfirmDelete = async () => {
    if (!currentUser || !deleteConfirmation) return;

    setIsDeleting(true);
    try {
      switch (deleteConfirmation.type) {
        case 'invoice':
          await deleteInvoiceFromDb(currentUser.uid, deleteConfirmation.id);
          showToast("Invoice deleted.");
          if (currentInvoiceId === deleteConfirmation.id) {
            handleReset();
          }
          break;
        case 'client':
          await deleteClient(currentUser.uid, deleteConfirmation.id);
          if (invoice.client.id === deleteConfirmation.id) {
              // FIX: Corrected typo from INITIAL_INVOOICE to INITIAL_INVOICE.
              setInvoice(prev => ({ ...prev, client: { ...INITIAL_INVOICE.client, id: undefined } }));
          }
          showToast("Client deleted.");
          break;
        case 'profile':
          const newProfiles = savedInvoiceProfiles.filter(p => p.id !== deleteConfirmation.id);
          await updateUserData(currentUser.uid, { savedInvoiceProfiles: newProfiles, activeInvoiceProfileId: null });
          setSavedInvoiceProfiles(newProfiles);
          handleLoadProfile('');
          showToast("Profile deleted.");
          break;
      }
    } catch (e) {
      showToast(`Failed to delete ${deleteConfirmation.type}.`, "error");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  const handleAddProduct = async (item: Omit<Product, 'id' | 'name'>) => {
      if(!currentUser) throw new Error("Not logged in");
      return addProduct(currentUser.uid, item);
  }
  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
      if(!currentUser) throw new Error("Not logged in");
      return updateProduct(currentUser.uid, id, updates);
  }
  const handleDeleteProduct = async (id: string) => {
      if(!currentUser) throw new Error("Not logged in");
      return deleteProduct(currentUser.uid, id);
  }

  const handleSaveLineItemAsProduct = async (lineItem: LineItem) => {
    if (!currentUser) return;

    const description = lineItem.description.trim();
    if (!description) {
      showToast("Product description cannot be empty.", "error");
      return;
    }

    if (lineItem.productId) {
      showToast(`This item is already linked to a product.`, "error");
      return;
    }

    const existingProduct = products.find(p => 
      p.name.toLowerCase() === description.toLowerCase() || 
      p.name_en?.toLowerCase() === description.toLowerCase() ||
      p.name_ur?.toLowerCase() === description.toLowerCase()
    );

    if (existingProduct) {
      showToast(`Product "${description}" already exists.`, "error");
      return;
    }

    const newProductData: Omit<Product, 'id' | 'name'> = {
      name_en: description,
      name_ur: '',
      unit: lineItem.unit || 'pcs',
      salePrice: lineItem.price,
      purchasePrice: 0,
      myStock: 0,
      partnerStock: 0,
      partnerPrice: 0,
      amountReceivedFromPartner: 0,
      archived: false,
    };

    try {
      const newProductId = await handleAddProduct(newProductData);
      
      setInvoice(prev => ({
        ...prev,
        lineItems: prev.lineItems.map(item => 
          item.id === lineItem.id ? { ...item, productId: newProductId } : item
        ),
      }));
      showToast("New product saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save product:", error);
      showToast("Error saving product.", "error");
    }
  };
  
  if (!currentUser) {
    return <Login />;
  }

  const renderInvoicingModule = () => (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-68px)] md:overflow-hidden">
        <aside className="w-full md:w-[450px] lg:w-[500px] flex-shrink-0 bg-[var(--color-header-bg)] flex flex-col shadow-lg z-10">
            <header className="p-4 border-b dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                 <h1 className="text-xl font-bold text-[var(--color-header-text)]">{activeView === 'account' ? 'My Account' : `Invoice ${activeView.charAt(0).toUpperCase() + activeView.slice(1)}`}</h1>
                 <nav className="flex items-center space-x-1 p-1 bg-[var(--color-app-bg)] rounded-full">
                    <button onClick={() => setActiveView('account')} className={`px-3 py-1 text-sm rounded-full transition-colors ${activeView === 'account' ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)]' : ''}`}>Account</button>
                    <button onClick={() => setActiveView('data')} className={`px-3 py-1 text-sm rounded-full transition-colors ${activeView === 'data' ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)]' : ''}`}>Data</button>
                    <button onClick={() => setActiveView('style')} className={`px-3 py-1 text-sm rounded-full transition-colors ${activeView === 'style' ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)]' : ''}`}>Style</button>
                 </nav>
            </header>
            <div className="overflow-y-auto flex-grow">
                {activeView === 'account' && <MyAccount invoice={invoice} onSaveAccountDetails={handleSaveAccountDetails} onAccountDetailsChange={handleAccountDetailsChange} onImageChange={handleImageChange} themeSettings={themeSettings} onThemeChange={handleThemeChange} />}
                {activeView === 'data' && <DataForm invoice={invoice} setInvoice={setInvoice} subtotal={subtotal} discountValue={discountValue} taxAmount={taxAmount} total={total} savedClients={savedClients} onSelectClient={handleSelectClient} onSaveClient={handleSaveClient} onRequestDeleteClient={requestClientDeletion} products={products} onAddProductToInvoice={handleAddProductToInvoice} columnVisibility={columnVisibility} onSaveInvoice={handleSaveInvoice} currentInvoiceId={currentInvoiceId} isSaving={isInvoiceSaving} savedInvoices={savedInvoices} onLoadInvoice={handleLoadInvoice} onRequestDeleteInvoice={requestInvoiceDeletion} onSaveLineItemAsProduct={handleSaveLineItemAsProduct} />}
                {activeView === 'style' && <StyleForm invoice={invoice} setInvoice={setInvoice} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} templates={TEMPLATES} activeTemplateId={activeTemplateId} onTemplateChange={handleTemplateChange} customTemplateStyle={customTemplateStyle} onCustomTemplateStyleChange={handleCustomTemplateStyleChange} layoutSettings={layoutSettings} onLayoutSettingsChange={handleLayoutSettingsChange} showLogoWatermark={showLogoWatermark} setShowLogoWatermark={setShowLogoWatermark} savedProfiles={savedInvoiceProfiles} activeProfileId={activeInvoiceProfileId} onLoadProfile={(id) => handleLoadProfile(id)} onSaveProfile={handleSaveProfile} onRequestDeleteProfile={requestProfileDeletion} />}
            </div>
        </aside>

        <main className="flex-1 bg-[var(--color-app-bg)] overflow-auto p-4 md:p-8">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <ActionButton onClick={handleDownloadPdf} disabled={isPdfSaving}>{isPdfSaving ? 'Saving...' : 'Download PDF'}</ActionButton>
                    <ActionButton onClick={handleDownloadPng} variant="secondary" disabled={isPngSaving}>{isPngSaving ? 'Saving...' : 'Download PNG'}</ActionButton>
                    <ActionButton onClick={handleReset} variant="secondary">New Invoice</ActionButton>
                </div>
                 <div className="flex items-center space-x-2">
                    <label htmlFor="zoom" className="text-sm font-medium">Zoom:</label>
                    <input type="range" id="zoom" min="50" max="150" value={zoomLevel} onChange={e => setZoomLevel(parseInt(e.target.value))} className="w-32" />
                    <span className="text-sm w-12 text-right">{zoomLevel}%</span>
                </div>
            </div>
            <div className="mx-auto" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                <div className="shadow-2xl max-w-[840px] mx-auto">
                    <InvoicePreview ref={previewRef} invoice={invoice} subtotal={subtotal} discountValue={discountValue} taxAmount={taxAmount} total={total} showLogoWatermark={showLogoWatermark} columnVisibility={columnVisibility} templateStyle={activeTemplate.style} layoutSettings={layoutSettings} isTaxEnabled={invoice.isTaxEnabled} onNotesChange={(notes) => setInvoice(prev => ({...prev, notes}))} />
                </div>
            </div>
        </main>
    </div>
  );

  const renderStockModule = () => (
    <div className="p-4 md:p-8">
        <StockTracker 
            products={products}
            currency={invoice.currency}
            showToast={showToast}
            onAddItem={handleAddProduct}
            onUpdateItem={handleUpdateProduct}
            onDeleteItem={handleDeleteProduct}
            // FIX: A spread argument must either have a tuple type or be passed to a rest parameter. Explicitly pass arguments.
            onAdjustStock={(productId, type, qty, price, isPaid) => currentUser && adjustStock(currentUser.uid, productId, type, qty, price, isPaid)}
            // FIX: A spread argument must either have a tuple type or be passed to a rest parameter. Explicitly pass arguments.
            onRecordPartnerPayment={(productId, amount) => currentUser && recordPartnerPayment(currentUser.uid, productId, amount)}
        />
    </div>
  );

  return (
    <div className="antialiased text-[var(--color-main-text)]">
        <header className="bg-[var(--color-header-bg)] shadow-md sticky top-0 z-20 flex items-center justify-between p-3 px-6">
             <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-[var(--color-primary-btn-bg)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7V4H20V7L12 15L4 7Z" fill="currentColor"></path><path d="M4 9V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V9L12 17L4 9Z" fill="currentColor"></path></svg>
                <h1 className="text-lg font-bold">Aswab Invoice & Stock Manager</h1>
             </div>
             <nav className="flex items-center space-x-1 p-1 bg-[var(--color-app-bg)] rounded-full">
                <button onClick={() => setActiveModule('invoicing')} className={`px-4 py-1.5 text-sm rounded-full transition-colors ${activeModule === 'invoicing' ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)] font-semibold' : ''}`}>Invoicing</button>
                <button onClick={() => setActiveModule('stock')} className={`px-4 py-1.5 text-sm rounded-full transition-colors ${activeModule === 'stock' ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)] font-semibold' : ''}`}>Stock</button>
             </nav>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{currentUser.name}</span>
                <button onClick={logout} className="text-sm text-[var(--color-light-text)] hover:text-[var(--color-main-text)]">Logout</button>
              </div>
        </header>

        <div className="relative">
            {activeModule === 'invoicing' ? renderInvoicingModule() : renderStockModule()}
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <ConfirmationModal
            isOpen={!!deleteConfirmation}
            onClose={() => setDeleteConfirmation(null)}
            onConfirm={handleConfirmDelete}
            title={`Delete ${deleteConfirmation?.type}`}
            message={
                <>
                    <p>Are you sure you want to delete <strong>{deleteConfirmation?.name}</strong>?</p>
                    <p className="mt-2 text-sm">This action cannot be undone.</p>
                </>
            }
            confirmText="Yes, delete"
            isConfirming={isDeleting}
        />
    </div>
  );
};

export default App;