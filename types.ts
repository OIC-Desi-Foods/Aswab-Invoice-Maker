export interface Address {
  id?: string;
  name: string;
  street: string;
  cityStateZip: string;
  phone: string;
  email: string;
}

export interface SavedClient extends Address {
  id: string;
}

export interface SavedProduct {
    id:string;
    description: string;
    price: number;
}

export interface Product {
  id: string;
  name: string;
  name_en?: string; // For backward compatibility
  name_ur?: string; // For backward compatibility
  unit: string;
  purchasePrice: number;
  salePrice: number;
  partnerPrice?: number;
  myStock: number;
  partnerStock: number;
  amountReceivedFromPartner?: number;
  archived?: boolean;
}

export interface InventoryTransaction {
    id: string;
    productId: string;
    productName: string;
    changeMyStock: number;
    changePartnerStock: number;
    reason: 'initial_stock' | 'invoice_paid' | 'manual_update' | 'stock_added' | 'order_fulfilled' | 'return' | 'sold_to_partner' | 'sold_to_customer' | 'received_new_stock';
    referenceId?: string; // e.g., invoiceId
    salePrice?: number; // Price at which item was sold
    isPaid?: boolean; // For partner sales, was it paid immediately?
    timestamp: any; // serverTimestamp
}

export interface LineItem {
  id:string;
  description: string;
  quantity: number;
  unit?: string;
  price: number;
  discount: number; // Percentage
  productId?: string; // Link to product
}

export type DiscountType = 'percentage' | 'fixed';

export interface Invoice {
  logo?: string;
  signature?: string;
  company: Address;
  client: Address;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  notes: string;
  taxRate: number;
  isTaxEnabled: boolean;
  currency: string;
  discountType: DiscountType;
  discountAmount: number;
  isPaid?: boolean;
}

export interface SavedInvoice extends Invoice {
  id: string;
  uid: string;
  name: string;
  createdAt?: string;
}

export interface TemplateStyle {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerBackgroundColor: string;
  fontFamily: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
}

export interface Template {
  id: string;
  name: string;
  style: TemplateStyle;
}

export interface LayoutSettings {
  logoSize: number;
  companyNameSize: number;
  signatureSize: number;
  logoAlignment: 'left' | 'center' | 'right';
  signatureAlignment: 'left' | 'center' | 'right';
  watermarkSize: number;
}

export interface ColumnVisibility {
  quantity: boolean;
  unitPrice: boolean;
  lineItemDiscount: boolean;
  lineItemTotal: boolean;
}

export interface InvoiceStyleProfile {
  id: string;
  name: string;
  activeTemplateId: string;
  customTemplateStyle: TemplateStyle;
  layoutSettings: LayoutSettings;
  columnVisibility: ColumnVisibility;
  currency: string;
}

export interface ThemeColors {
    // General
    appBg: string;
    cardBg: string;
    mainText: string;
    lightText: string;
    // Header
    headerBg: string;
    headerText: string;
    // Buttons
    primaryBtnBg: string;
    primaryBtnText: string;
    secondaryBtnBg: string;
    secondaryBtnText: string;
    // Navigation
    navActiveBg: string;
    navActiveText: string;
}

export interface ThemeSettings {
    name: string; 
    colors: ThemeColors;
    fontFamily: string;
    backgroundStyle?: 'solid' | 'gradient';
}

export interface User {
  uid: string;
  email: string | null;
  name: string;
}

export interface UserData {
    accountData?: {
        company: Address;
        logo?: string;
        signature?: string;
        currency: string;
    };
    savedInvoiceProfiles: InvoiceStyleProfile[];
    activeInvoiceProfileId: string | null;
    themeSettings?: ThemeSettings;
}