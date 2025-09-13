import React from 'react';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';

interface BarcodeDisplayProps {
  value: string;
  type?: 'barcode' | 'qrcode';
  width?: number;
  height?: number;
  format?: string;
  className?: string;
}

const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  type = 'barcode',
  width = 200,
  height = 50,
  format = 'CODE128',
  className = ''
}) => {
  if (type === 'qrcode') {
    return (
      <div className={`barcode-display qr-code ${className}`}>
        <QRCode
          value={value}
          size={width}
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
        />
      </div>
    );
  }

  return (
    <div className={`barcode-display barcode ${className}`}>
      <Barcode
        value={value}
        format={format}
        width={width / value.length}
        height={height}
        displayValue={true}
        fontSize={12}
        margin={10}
      />
    </div>
  );
};

export default BarcodeDisplay;
