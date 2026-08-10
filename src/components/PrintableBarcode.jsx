import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';

// ==========================================
// 🖨️ 58mm THERMAL BARCODE STICKER GENERATOR
// For Posiflow PSF58H portable printer
// ==========================================
const PrintableBarcode = forwardRef(({ item }, ref) => {
  if (!item || !item.sku) return null;

  return (
    <div ref={ref} className="barcode-print-container">
      <style type="text/css" media="print">
        {`
          @page { size: 58mm auto; margin: 0mm; }
          body { margin: 0; padding: 0; background: white; }
          .barcode-print-container { 
            width: 58mm !important; 
            padding: 0mm 2mm !important; 
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white !important;
          }
        `}
      </style>

      {/* Screen Preview Styles */}
      <style type="text/css">
        {`
          .barcode-print-container {
            width: 58mm;
            padding: 4mm 2mm;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px solid #eee;
            margin: auto;
          }
        `}
      </style>

      
      
      <Barcode 
        value={item.sku} 
        width={1.8} 
        height={30} 
        fontSize={12} 
        margin={0} 
        displayValue={true} 
      />
      
      
    </div>
  );
});

export default PrintableBarcode;
