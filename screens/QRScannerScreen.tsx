import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from '../contexts/LanguageContext';

interface QRScannerScreenProps {
  onScanSuccess?: (result: string) => void;
  onClose?: () => void;
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ onScanSuccess, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [qrboxSize, setQrboxSize] = useState({ width: 256, height: 256 });
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Agregar estilos para ocultar el overlay predeterminado de html5-qrcode
    const style = document.createElement('style');
    style.id = 'qr-scanner-custom-styles';
    style.textContent = `
      #qr-reader__dashboard_section {
        display: none !important;
      }
      #qr-reader__camera_selection {
        display: none !important;
      }
      #qr-reader__scan_region {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
      #qr-reader__scan_region video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      #qr-reader__dashboard {
        display: none !important;
      }
      #qr-reader__scan_region_csr {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
      #qr-reader__scan_region_csr > div {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
      /* Ocultar cualquier borde o marco generado por html5-qrcode */
      #qr-reader div[style*="border"] {
        border: none !important;
      }
      #qr-reader div[style*="outline"] {
        outline: none !important;
      }
    `;
    // Verificar si el estilo ya existe antes de agregarlo
    const existingStyle = document.getElementById('qr-scanner-custom-styles');
    if (!existingStyle) {
      document.head.appendChild(style);
    }

    startScanning();

    return () => {
      stopScanning();
      // Limpiar estilos al desmontar
      const styleToRemove = document.getElementById('qr-scanner-custom-styles');
      if (styleToRemove && document.head.contains(styleToRemove)) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      
      // Esperar un momento para que el DOM esté listo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const scannerId = 'qr-reader';
      const scannerElement = document.getElementById(scannerId);
      
      if (!scannerElement || !scannerContainerRef.current) {
        setError(t('qrScanner.containerError'));
        return;
      }

      // Calcular el tamaño del qrbox basado en el tamaño del contenedor
      const containerRect = scannerContainerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // Usar 70% del ancho o alto más pequeño para el qrbox
      const maxDimension = Math.min(containerWidth, containerHeight);
      const qrboxDimension = Math.floor(maxDimension * 0.7);
      
      // Asegurarse de que sea un número par para mejor renderizado
      const finalSize = qrboxDimension - (qrboxDimension % 2);
      
      setQrboxSize({ width: finalSize, height: finalSize });

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      // Configuración para el escaneo - usar el tamaño calculado
      const config = {
        fps: 10,
        qrbox: { width: finalSize, height: finalSize },
        aspectRatio: 1.0,
        supportedScanTypes: [] as any[],
        videoConstraints: {
          facingMode: 'environment' // Cámara trasera
        }
      };

      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // QR escaneado exitosamente
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Error durante el escaneo (normalmente porque no encuentra QR)
            // No hacer nada, solo continuar escaneando
          }
        );
        setIsScanning(true);
        setHasPermission(true);
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(t('qrScanner.permissionDenied'));
          setHasPermission(false);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError(t('qrScanner.noCamera'));
          setHasPermission(false);
        } else {
          setError(t('qrScanner.error') + ': ' + err.message);
          setHasPermission(false);
        }
        setIsScanning(false);
      }
    } catch (err: any) {
      setError(t('qrScanner.error') + ': ' + (err.message || 'Unknown error'));
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
      setIsScanning(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    stopScanning();
    
    if (onScanSuccess) {
      onScanSuccess(decodedText);
    } else {
      // Si no hay callback, navegar a join-table con el código
      navigate('/join-table', { state: { scannedCode: decodedText } });
    }
  };

  const handleClose = () => {
    stopScanning();
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleRetry = () => {
    setError(null);
    startScanning();
  };

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-black/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-50 safe-top">
        <button 
          onClick={handleClose} 
          className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          {t('qrScanner.title')}
        </h2>
        <div className="size-10"></div>
      </div>

      {/* Scanner Container */}
      <div className="flex-1 relative flex items-center justify-center">
        {hasPermission === false && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-6 z-50">
            <span className="material-symbols-outlined text-white text-6xl mb-4">
              qr_code_scanner
            </span>
            <p className="text-white text-center mb-6 px-4">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('qrScanner.retry')}
            </button>
          </div>
        )}

        {!error && (
          <div className="w-full h-full relative" ref={scannerContainerRef}>
            <div id="qr-reader" className="w-full h-full"></div>
            
            {/* Overlay con marco - tamaño dinámico para coincidir con qrbox */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative" style={{ width: `${qrboxSize.width}px`, height: `${qrboxSize.height}px` }}>
                {/* Marco de escaneo */}
                <div 
                  className="border-2 border-white rounded-lg relative"
                  style={{ 
                    width: `${qrboxSize.width}px`, 
                    height: `${qrboxSize.height}px` 
                  }}
                >
                  {/* Esquinas decorativas */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8 pointer-events-none">
              <p className="text-white text-center text-sm font-medium">
                {t('qrScanner.instruction')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScannerScreen;
