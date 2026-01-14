import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AddCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Máximo 16 dígitos + 3 espacios
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
      setExpiryMonth(value);
    }
  };

  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setExpiryYear(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(value);
  };

  const handleSubmit = () => {
    // Validación básica
    if (cardNumber.replace(/\s/g, '').length < 16) {
      alert('Por favor ingresa un número de tarjeta válido');
      return;
    }
    if (!cardName.trim()) {
      alert('Por favor ingresa el nombre del titular');
      return;
    }
    if (expiryMonth.length !== 2 || expiryYear.length !== 2) {
      alert('Por favor ingresa una fecha de expiración válida');
      return;
    }
    if (cvv.length < 3) {
      alert('Por favor ingresa un CVV válido');
      return;
    }

    // Aquí se guardaría la tarjeta en el backend
    // Por ahora solo navegamos de vuelta
    alert('Tarjeta agregada exitosamente');
    navigate('/payments');
  };

  const detectCardBrand = () => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'VISA';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'AMEX';
    return '';
  };

  const cardBrand = detectCardBrand();

  // Inicializar cámara
  useEffect(() => {
    if (showCamera && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.error('Error accediendo a la cámara:', err);
          alert('No se pudo acceder a la cámara. Por favor, ingresa los datos manualmente.');
          setShowCamera(false);
        });
    }

    return () => {
      // Limpiar stream al cerrar
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [showCamera]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsScanning(false);
  };

  const captureCard = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    setIsScanning(true);

    // Simular procesamiento OCR (en producción usarías una biblioteca real como Tesseract.js o un servicio de API)
    setTimeout(() => {
      // Simulación de datos extraídos de la tarjeta
      // En producción, aquí procesarías la imagen con OCR
      const simulatedCardData = {
        number: '4242 4242 4242 4242',
        name: 'ALEX GONZALEZ',
        expiryMonth: '12',
        expiryYear: '26'
      };

      setCardNumber(formatCardNumber(simulatedCardData.number));
      setCardName(simulatedCardData.name);
      setExpiryMonth(simulatedCardData.expiryMonth);
      setExpiryYear(simulatedCardData.expiryYear);
      
      setIsScanning(false);
      stopCamera();
      alert('Datos de la tarjeta capturados. Por favor, ingresa el CVV manualmente.');
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen pb-40 bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100">
        <div className="flex items-center p-4 justify-between">
          <span className="material-symbols-outlined text-xl cursor-pointer" onClick={() => navigate(-1)}>arrow_back_ios</span>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">Agregar Tarjeta</h2>
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-[#181411] dark:text-white mb-2">Nueva Tarjeta</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa los datos de tu tarjeta de crédito o débito</p>
        </div>

        {/* Vista previa de la tarjeta */}
        <div className="mb-8">
          <div className={`min-w-full aspect-[1.6/1] rounded-xl flex flex-col justify-between p-6 bg-gradient-to-br ${
            cardBrand === 'Mastercard' 
              ? 'from-[#ffedd5] to-[#fed7aa] text-[#9a3412]' 
              : 'from-[#e0f2fe] to-[#bae6fd] text-[#0369a1]'
          } relative shadow-lg`}>
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-3xl">contactless</span>
              {cardBrand === 'Mastercard' ? (
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-red-500/80"></div>
                  <div className="w-6 h-6 rounded-full bg-yellow-500/80"></div>
                </div>
              ) : cardBrand ? (
                <span className="font-bold italic text-lg">{cardBrand}</span>
              ) : (
                <span className="font-bold italic text-lg opacity-50">Tarjeta</span>
              )}
            </div>
            <div>
              <p className="text-lg font-mono tracking-widest mb-4">
                {cardNumber || '**** **** **** ****'}
              </p>
              <div className="flex gap-4">
                <div>
                  <p className="text-[10px] uppercase opacity-70">Expira</p>
                  <p className="text-sm font-medium">
                    {expiryMonth || 'MM'}/{expiryYear || 'YY'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-70">Titular</p>
                  <p className="text-sm font-medium">
                    {cardName.toUpperCase() || 'NOMBRE DEL TITULAR'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de escanear tarjeta */}
        <div className="mb-6">
          <button
            onClick={() => setShowCamera(true)}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 dark:bg-primary/10 text-primary font-semibold hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">camera</span>
            <span>Escanear tarjeta con cámara</span>
          </button>
        </div>

        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
          <span className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">O ingresa manualmente</span>
          <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
              Número de tarjeta
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full h-14 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
              Nombre del titular
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              placeholder="ALEX GONZALEZ"
              className="w-full h-14 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                Fecha de expiración
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={expiryMonth}
                  onChange={handleExpiryMonthChange}
                  placeholder="MM"
                  maxLength={2}
                  className="w-full h-14 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center"
                />
                <span className="self-end pb-3 text-gray-400">/</span>
                <input
                  type="text"
                  value={expiryYear}
                  onChange={handleExpiryYearChange}
                  placeholder="YY"
                  maxLength={2}
                  className="w-full h-14 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">lock</span>
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Tus datos están protegidos con encriptación de extremo a extremo. No almacenamos tu CVV.
          </p>
        </div>
      </main>

      {/* Modal de cámara */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={stopCamera}
              className="text-white p-2"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <h3 className="text-white text-lg font-bold">Escanea tu tarjeta</h3>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 relative flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ maxHeight: '70vh' }}
            />
            
            {/* Overlay con guía para la tarjeta */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/50 rounded-xl w-[85%] max-w-[340px] aspect-[1.6/1] shadow-lg">
                <div className="absolute top-2 left-2 right-2 h-1 bg-white/30 rounded"></div>
                <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/30 rounded"></div>
              </div>
            </div>

            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-xl p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-800 font-semibold">Procesando tarjeta...</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-black/50">
            <div className="mb-4 text-center">
              <p className="text-white text-sm mb-2">Coloca la tarjeta dentro del marco</p>
              <p className="text-white/70 text-xs">Asegúrate de que la tarjeta esté bien iluminada y enfocada</p>
            </div>
            <button
              onClick={captureCard}
              disabled={isScanning}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">camera</span>
              {isScanning ? 'Procesando...' : 'Capturar tarjeta'}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/90 p-4 pb-12 z-50">
        <button 
          onClick={handleSubmit}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          Agregar Tarjeta
          <span className="material-symbols-outlined">check_circle</span>
        </button>
      </div>
    </div>
  );
};

export default AddCardScreen;
