import { Invoice, DiscountType, Template, ThemeSettings } from './types';

export const CURRENCIES = [
  { value: 'Rs', label: 'PKR (Rs)' },
  { value: '$', label: 'USD ($)' },
  { value: '€', label: 'EUR (€)' },
  { value: '£', label: 'GBP (£)' },
  { value: '¥', label: 'JPY (¥)' },
  { value: '₹', label: 'INR (₹)' },
];

export const FONT_OPTIONS = [
    "'Inter', sans-serif",
    "'Helvetica', 'Arial', sans-serif",
    "'Times New Roman', Times, serif",
    "'Georgia', serif",
    "'Courier New', Courier, monospace",
    "'Jameel Noori Nastaleeq', 'Inter', sans-serif",
];

export const THEMES: Record<string, ThemeSettings> = {
    light: {
        name: 'light',
        colors: {
            appBg: '#f3f4f6',
            cardBg: '#ffffff',
            mainText: '#1f2937',
            lightText: '#6b7280',
            headerBg: '#ffffff',
            headerText: '#1f2937',
            primaryBtnBg: '#16a34a',
            primaryBtnText: '#ffffff',
            secondaryBtnBg: '#e5e7eb',
            secondaryBtnText: '#374151',
            navActiveBg: '#16a34a',
            navActiveText: '#ffffff',
        },
        fontFamily: FONT_OPTIONS[0],
        backgroundStyle: 'solid',
    },
    dark: {
        name: 'dark',
        colors: {
            appBg: '#111827',
            cardBg: '#1f2937',
            mainText: '#d1d5db',
            lightText: '#9ca3af',
            headerBg: '#1f2937',
            headerText: '#d1d5db',
            primaryBtnBg: '#22c55e',
            primaryBtnText: '#ffffff',
            secondaryBtnBg: '#374151',
            secondaryBtnText: '#d1d5db',
            navActiveBg: '#22c55e',
            navActiveText: '#ffffff',
        },
        fontFamily: FONT_OPTIONS[0],
        backgroundStyle: 'solid',
    },
    gradient: {
        name: 'gradient',
        colors: {
            appBg: '#1e293b',
            cardBg: '#334155',
            mainText: '#e2e8f0',
            lightText: '#94a3b8',
            headerBg: '#334155',
            headerText: '#e2e8f0',
            primaryBtnBg: '#c084fc',
            primaryBtnText: '#1e293b',
            secondaryBtnBg: '#475569',
            secondaryBtnText: '#e2e8f0',
            navActiveBg: '#c084fc',
            navActiveText: '#1e293b',
        },
        fontFamily: FONT_OPTIONS[0],
        backgroundStyle: 'gradient',
    },
    elegant: {
        name: 'elegant',
        colors: {
            appBg: '#f1f5f9',
            cardBg: '#ffffff',
            mainText: '#3a3a3a',
            lightText: '#525252',
            headerBg: '#ffffff',
            headerText: '#3a3a3a',
            primaryBtnBg: '#7c3aed',
            primaryBtnText: '#ffffff',
            secondaryBtnBg: '#e2e8f0',
            secondaryBtnText: '#3a3a3a',
            navActiveBg: '#7c3aed',
            navActiveText: '#ffffff',
        },
        fontFamily: FONT_OPTIONS[3],
        backgroundStyle: 'solid',
    },
    minimal: {
        name: 'minimal',
        colors: {
            appBg: '#ffffff',
            cardBg: '#f9fafb',
            mainText: '#4b5563',
            lightText: '#6b7280',
            headerBg: '#ffffff',
            headerText: '#4b5563',
            primaryBtnBg: '#374151',
            primaryBtnText: '#ffffff',
            secondaryBtnBg: '#f3f4f6',
            secondaryBtnText: '#4b5563',
            navActiveBg: '#374151',
            navActiveText: '#ffffff',
        },
        fontFamily: FONT_OPTIONS[1],
        backgroundStyle: 'solid',
    },
};


export const TEMPLATES: Template[] = [
    {
        id: 'modern',
        name: 'Modern',
        style: {
            primaryColor: '#16A34A', // green-600
            backgroundColor: '#FFFFFF', // white
            textColor: '#374151', // gray-700
            headerBackgroundColor: '#F0FDF4', // green-50
            borderColor: '#BBF7D0', // green-200
            fontFamily: FONT_OPTIONS[0],
            borderWidth: 1,
            borderStyle: 'solid',
        },
    },
    {
        id: 'classic',
        name: 'Classic',
        style: {
            primaryColor: '#111827', // gray-900
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937', // gray-800
            headerBackgroundColor: '#FFFFFF',
            borderColor: '#D1D5DB', // gray-300
            fontFamily: FONT_OPTIONS[2],
            borderWidth: 2,
            borderStyle: 'solid',
        },
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        style: {
            primaryColor: '#6B7280', // gray-500
            backgroundColor: '#FFFFFF',
            textColor: '#4B5563', // gray-600
            headerBackgroundColor: '#F9FAFB', // gray-50
            borderColor: '#F3F4F6', // gray-100
            fontFamily: FONT_OPTIONS[1],
            borderWidth: 1,
            borderStyle: 'dashed',
        },
    },
     {
        id: 'custom',
        name: 'Custom',
        style: {
            primaryColor: '#16A34A', // green-600
            backgroundColor: '#FFFFFF',
            textColor: '#374151',
            headerBackgroundColor: '#F0FDF4', // green-50
            borderColor: '#BBF7D0', // green-200
            fontFamily: FONT_OPTIONS[0],
            borderWidth: 1,
            borderStyle: 'solid',
        },
    },
];

export const INITIAL_INVOICE: Invoice = {
  logo: undefined,
  signature: undefined,
  company: {
    name: "OIC Desi Foods",
    street: "",
    cityStateZip: "Karachi",
    phone: "0310-4573744",
    email: "theoicacademy@gmail.com",
  },
  client: {
    name: "Client's Company",
    street: "456 Oak Ave",
    cityStateZip: "Clientville, USA 67890",
    phone: "(555) 555-1234",
    email: "contact@clientcompany.com",
  },
  invoiceNumber: "INV-001",
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
  lineItems: [
    {
      id: crypto.randomUUID(),
      description: "Service or Product Description",
      quantity: 1,
      unit: "pcs",
      price: 100.00,
      discount: 0,
    },
  ],
  notes: "Thank you for shopping from us. Please review us on Facebook!",
  taxRate: 0,
  isTaxEnabled: true,
  currency: 'Rs',
  discountType: 'percentage' as DiscountType,
  discountAmount: 0,
  isPaid: false,
};

export const SAMPLE_INVOICE: Invoice = {
  logo: undefined,
  signature: undefined,
  company: {
    name: "Innovate Solutions Inc.",
    street: "789 Tech Park",
    cityStateZip: "Silicon Valley, CA 94043",
    phone: "(650) 555-1212",
    email: "billing@innovatesolutions.io",
  },
  client: {
    name: "Quantum Dynamics Ltd.",
    street: "321 Research Blvd",
    cityStateZip: "Boston, MA 02110",
    phone: "(617) 555-8888",
    email: "accounts@quantumdynamics.com",
  },
  invoiceNumber: "INV-2024-42",
  issueDate: "2024-07-15",
  dueDate: "2024-08-14",
  lineItems: [
    {
      id: crypto.randomUUID(),
      description: "Enterprise Software Development (Q3)",
      quantity: 120,
      unit: 'hrs',
      price: 150.00,
      discount: 0,
    },
    {
      id: crypto.randomUUID(),
      description: "Cloud Infrastructure Setup & Migration",
      quantity: 1,
      unit: 'project',
      price: 5000.00,
      discount: 15,
    },
    {
      id: crypto.randomUUID(),
      description: "Priority Support & Maintenance (Monthly)",
      quantity: 3,
      unit: 'months',
      price: 750.00,
      discount: 0,
    },
     {
      id: crypto.randomUUID(),
      description: "UI/UX Design Mockups",
      quantity: 35,
      unit: 'mockups',
      price: 90.00,
      discount: 5,
    },
  ],
  notes: "Project deliverables are outlined in the SOW dated 06/01/2024. Please include the invoice number with your payment.",
  taxRate: 8.5,
  isTaxEnabled: true,
  currency: '$',
  discountType: 'percentage' as DiscountType,
  discountAmount: 10,
  isPaid: false,
};
