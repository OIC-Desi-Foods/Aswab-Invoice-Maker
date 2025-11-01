import React, { forwardRef } from 'react';
import { Invoice, TemplateStyle, LayoutSettings, ColumnVisibility } from '../types';

interface InvoicePreviewProps {
  invoice: Invoice;
  subtotal: number;
  discountValue: number;
  taxAmount: number;
  total: number;
  showLogoWatermark: boolean;
  columnVisibility: ColumnVisibility;
  templateStyle: TemplateStyle;
  layoutSettings: LayoutSettings;
  isTaxEnabled: boolean;
  onNotesChange: (notes: string) => void;
}

const isUrdu = (str: string): boolean => str && /[\u0600-\u06FF]/.test(str);

const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({ invoice, subtotal, discountValue, taxAmount, total, showLogoWatermark, columnVisibility, templateStyle, layoutSettings, isTaxEnabled, onNotesChange }, ref) => {
  const { 
    primaryColor, 
    backgroundColor, 
    textColor, 
    headerBackgroundColor, 
    fontFamily, 
    borderColor,
    borderWidth,
    borderStyle,
  } = templateStyle;
  
  const mainBorderString = `${borderWidth}px ${borderStyle} ${borderColor}`;
  const thinBorderString = `1px ${borderStyle === 'double' ? 'solid' : borderStyle} ${borderColor}`;

  const secondaryTextColor = { color: textColor, opacity: 0.7 };
  const headingColor = { color: primaryColor };
  const subtleHeadingColor = { color: primaryColor, opacity: 0.8 };
  
  const signatureAlignmentClasses = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right'
  };

  const CompanyBlock = () => (
    <div className={`flex items-start gap-6`}>
        {invoice.logo && (
            <img src={invoice.logo} alt="Company Logo" className="w-auto max-w-40 object-contain" style={{ height: `${layoutSettings.logoSize}px` }}/>
        )}
        <div className={layoutSettings.logoAlignment === 'right' ? 'text-right' : ''}>
            <h1 className={`font-bold ${isUrdu(invoice.company.name) ? 'urdu-text' : ''}`} style={{...headingColor, fontSize: `${layoutSettings.companyNameSize}rem`, lineHeight: 1.2 }}>{invoice.company.name}</h1>
            <p className={isUrdu(invoice.company.street) ? 'urdu-text' : ''} style={secondaryTextColor}>{invoice.company.street}</p>
            <p className={isUrdu(invoice.company.cityStateZip) ? 'urdu-text' : ''} style={secondaryTextColor}>{invoice.company.cityStateZip}</p>
            <p style={secondaryTextColor}>{invoice.company.phone}</p>
            <p style={secondaryTextColor}>{invoice.company.email}</p>
        </div>
    </div>
  );

  const InvoiceMetaBlock = () => (
    <div className={`flex-shrink-0 ${layoutSettings.logoAlignment === 'left' ? 'text-right' : 'text-left'}`}>
        <h2 className="text-3xl font-light uppercase tracking-widest" style={headingColor}>Invoice</h2>
        <p className="mt-2" style={secondaryTextColor}># {invoice.invoiceNumber}</p>
    </div>
  );

  return (
    <div 
      ref={ref} 
      className="p-10 relative overflow-hidden min-w-[840px]"
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        fontFamily: fontFamily,
      }}
    >
      {showLogoWatermark && invoice.logo && (
        <div 
            className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0"
            aria-hidden="true"
        >
            <img 
                src={invoice.logo} 
                alt="Company Watermark" 
                className="w-2/3 h-auto object-contain opacity-10"
            />
        </div>
      )}

      <div className="relative z-20">
        <header 
          className="pb-8"
          style={{ borderBottom: mainBorderString }}
        >
           {layoutSettings.logoAlignment === 'center' ? (
            <div className="flex flex-col items-center text-center">
                {invoice.logo && (
                    <img src={invoice.logo} alt="Company Logo" className="w-auto max-w-40 object-contain mb-4" style={{ height: `${layoutSettings.logoSize}px` }}/>
                )}
                <div>
                    <h1 className={`font-bold ${isUrdu(invoice.company.name) ? 'urdu-text' : ''}`} style={{...headingColor, fontSize: `${layoutSettings.companyNameSize}rem`, lineHeight: 1.2 }}>{invoice.company.name}</h1>
                    <p className={isUrdu(invoice.company.street) ? 'urdu-text' : ''} style={secondaryTextColor}>{invoice.company.street}</p>
                    <p className={isUrdu(invoice.company.cityStateZip) ? 'urdu-text' : ''} style={secondaryTextColor}>{invoice.company.cityStateZip}</p>
                    <p style={secondaryTextColor}>{invoice.company.phone}</p>
                    <p style={secondaryTextColor}>{invoice.company.email}</p>
                </div>
                <div className="mt-6">
                    <h2 className="text-3xl font-light uppercase tracking-widest" style={headingColor}>Invoice</h2>
                    <p className="mt-2" style={secondaryTextColor}># {invoice.invoiceNumber}</p>
                </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              {layoutSettings.logoAlignment === 'left' && <><CompanyBlock /><InvoiceMetaBlock /></>}
              {layoutSettings.logoAlignment === 'right' && <><InvoiceMetaBlock /><CompanyBlock /></>}
            </div>
          )}
        </header>

        <section className="grid grid-cols-2 gap-8 my-8">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={subtleHeadingColor}>Bill To</h3>
            <p className={`font-bold ${isUrdu(invoice.client.name) ? 'urdu-text' : ''}`}>{invoice.client.name}</p>
            <p className={isUrdu(invoice.client.street) ? 'urdu-text' : ''} style={{...secondaryTextColor, opacity: 0.9}}>{invoice.client.street}</p>
            <p className={isUrdu(invoice.client.cityStateZip) ? 'urdu-text' : ''} style={{...secondaryTextColor, opacity: 0.9}}>{invoice.client.cityStateZip}</p>
            <p style={{...secondaryTextColor, opacity: 0.9}}>{invoice.client.phone}</p>
            <p style={{...secondaryTextColor, opacity: 0.9}}>{invoice.client.email}</p>
          </div>
          <div className="text-right">
            <div className="mb-2">
                <span className="text-sm font-semibold uppercase tracking-wider" style={subtleHeadingColor}>Issue Date: </span>
                <span>{invoice.issueDate}</span>
            </div>
            {!invoice.isPaid && (
              <div>
                  <span className="text-sm font-semibold uppercase tracking-wider" style={subtleHeadingColor}>Due Date: </span>
                  <span>{invoice.dueDate}</span>
              </div>
            )}
          </div>
        </section>

        <section>
          <table className="w-full text-left">
            <thead style={{ backgroundColor: headerBackgroundColor }}>
              <tr>
                <th className="p-3 text-sm font-semibold uppercase tracking-wider" style={headingColor}>Description</th>
                {columnVisibility.quantity && <th className="p-3 text-sm font-semibold uppercase tracking-wider text-right" style={headingColor}>Qty</th>}
                {columnVisibility.unitPrice && <th className="p-3 text-sm font-semibold uppercase tracking-wider text-right" style={headingColor}>Price</th>}
                {columnVisibility.lineItemDiscount && <th className="p-3 text-sm font-semibold uppercase tracking-wider text-right" style={headingColor}>Discount</th>}
                {columnVisibility.lineItemTotal && <th className="p-3 text-sm font-semibold uppercase tracking-wider text-right" style={headingColor}>Total</th>}
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => {
                const itemSubtotal = item.quantity * item.price;
                const itemDiscount = itemSubtotal * (item.discount / 100);
                const itemTotal = itemSubtotal - itemDiscount;

                return (
                    <tr key={item.id} style={{ borderBottom: thinBorderString }}>
                    <td className={`p-3 font-medium ${isUrdu(item.description) ? 'urdu-text' : ''}`}>{item.description}</td>
                    {columnVisibility.quantity && <td className="p-3 text-right">{item.quantity} {item.unit}</td>}
                    {columnVisibility.unitPrice && <td className="p-3 text-right">{invoice.currency}{item.price.toFixed(2)}</td>}
                    {columnVisibility.lineItemDiscount && <td className="p-3 text-right">{item.discount > 0 ? `${item.discount}%` : '-'}</td>}
                    {columnVisibility.lineItemTotal && <td className="p-3 text-right font-medium">{invoice.currency}{itemTotal.toFixed(2)}</td>}
                    </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end my-8">
            <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between"><span className="font-semibold" style={secondaryTextColor}>Subtotal:</span> <span>{invoice.currency}{subtotal.toFixed(2)}</span></div>
                {discountValue > 0 && <div className="flex justify-between"><span className="font-semibold" style={secondaryTextColor}>Global Discount:</span> <span>-{invoice.currency}{discountValue.toFixed(2)}</span></div>}
                {isTaxEnabled && invoice.taxRate > 0 && <div className="flex justify-between"><span className="font-semibold" style={secondaryTextColor}>Tax ({invoice.taxRate}%):</span> <span>{invoice.currency}{taxAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between pt-2 mt-2" style={{ borderTop: thinBorderString }}>
                    <span className="font-bold text-lg" style={headingColor}>Total:</span> 
                    <span className="font-bold text-lg" style={headingColor}>{invoice.currency}{total.toFixed(2)}</span>
                </div>

                {invoice.isPaid && (
                    <div className="flex justify-end pt-4">
                        <div
                            className="select-none text-center"
                            style={{
                                border: '2px solid green',
                                color: 'green',
                                backgroundColor: 'rgba(0, 128, 0, 0.1)',
                                padding: '0.25rem 1rem',
                                borderRadius: '0.375rem',
                                fontWeight: 'bold',
                                fontSize: `${layoutSettings.watermarkSize}rem`,
                                lineHeight: '1.2',
                            }}
                        >
                            PAID
                        </div>
                    </div>
                )}
            </div>
        </section>

        <footer className="pt-8" style={{ borderTop: mainBorderString }}>
          {invoice.signature && (
            <div className={`mb-8 flex flex-col ${signatureAlignmentClasses[layoutSettings.signatureAlignment]}`}>
              <img src={invoice.signature} alt="Signature" className="w-auto object-contain" style={{ height: `${layoutSettings.signatureSize}px` }} />
              <div className="mt-2 pt-1 w-48" style={{ borderTop: thinBorderString }}>
                <p className="text-sm" style={secondaryTextColor}>Signature</p>
              </div>
            </div>
          )}

          {invoice.notes && (
            <div>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={e => onNotesChange(e.currentTarget.innerText)}
                className={`text-sm whitespace-pre-wrap p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 ${isUrdu(invoice.notes) ? 'urdu-text' : ''}`}
                style={{ ...secondaryTextColor, opacity: 0.9, '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                {invoice.notes}
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
});

export default InvoicePreview;