
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { upsertUserBillingProfile, getUserBillingProfile } from '../services/api/user';

const UploadConstanciaScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [existingPdfName, setExistingPdfName] = useState<string | null>(null);
  const [existingPdfDate, setExistingPdfDate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

  // Ocultar descripción después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDescription(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadBillingProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const billingProfile = await getUserBillingProfile();
        
        const hasCertificateField = billingProfile?.data ? 'certificate_pdf_url' in billingProfile.data : false;
        
        if (billingProfile?.success && billingProfile.data) {
          const pdfUrl = billingProfile.data.certificate_pdf_url;
          
          // Verificar si el campo existe en el objeto
          if (hasCertificateField) {
            if (pdfUrl && pdfUrl.trim()) {
              setExistingPdfUrl(pdfUrl);
              
              // Extraer el nombre del archivo de la URL
              // Formato: .../fiscal-documents/{user_id}/{timestamp}-{filename}
              const urlParts = pdfUrl.split('/fiscal-documents/');
              if (urlParts.length > 1) {
                const filePath = urlParts[1];
                const fileNameWithTimestamp = filePath.split('/').pop() || '';
                // Remover el timestamp del inicio (formato: timestamp-filename)
                const timestampMatch = fileNameWithTimestamp.match(/^\d+-(.+)$/);
                const fileName = timestampMatch ? timestampMatch[1] : fileNameWithTimestamp;
                setExistingPdfName(fileName);
              }
              
              // Obtener la fecha de actualización
              if (billingProfile.data.updated_at) {
                const uploadDate = new Date(billingProfile.data.updated_at);
                const formattedDate = uploadDate.toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                setExistingPdfDate(formattedDate);
              }
            } else {
              setExistingPdfUrl(null);
      setExistingPdfName(null);
      setExistingPdfDate(null);
              setExistingPdfName(null);
              setExistingPdfDate(null);
            }
          } else {
            console.warn('[UploadConstancia] certificate_pdf_url field does not exist in table.');
            console.warn('[UploadConstancia] Please run: supabase/add-certificate-pdf-field.sql');
            setExistingPdfUrl(null);
      setExistingPdfName(null);
      setExistingPdfDate(null);
            setExistingPdfName(null);
            setExistingPdfDate(null);
          }
        } else {
          setExistingPdfUrl(null);
      setExistingPdfName(null);
      setExistingPdfDate(null);
          setExistingPdfName(null);
          setExistingPdfDate(null);
        }
      } catch (error) {
        console.error('[UploadConstancia] Error loading billing profile:', error);
        setExistingPdfUrl(null);
      setExistingPdfName(null);
      setExistingPdfDate(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadBillingProfile();
  }, [user?.id]);

  const validateFile = (file: File): boolean => {
    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return false;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      setError('El archivo es demasiado grande. Máximo 5MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadPDFToStorage = async (file: File, replaceExisting: boolean = false): Promise<string | null> => {
    if (!isSupabaseConfigured() || !user?.id) {
      console.error('Supabase no está configurado o el usuario no está autenticado');
      return null;
    }

    try {
      // Si hay un PDF existente y se está reemplazando, eliminarlo primero
      if (replaceExisting && existingPdfUrl) {
        // Extraer el path del URL existente
        const urlParts = existingPdfUrl.split('/fiscal-documents/');
        if (urlParts.length > 1) {
          const existingPath = urlParts[1];
          await supabase.storage
            .from('fiscal-documents')
            .remove([existingPath]);
        }
      }

      // Crear un nombre único para el archivo: {user_id}/{timestamp}-{filename}
      const timestamp = Date.now();
      const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitizar nombre
      const filePath = `${user.id}/${timestamp}-${fileName}`;

      // Subir el archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('fiscal-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error al subir el PDF:', error);
        throw error;
      }

      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('fiscal-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error al subir el PDF a storage:', error);
      return null;
    }
  };

  const handleDeleteExistingPdf = async () => {
    if (!existingPdfUrl || !user?.id) return;

    setIsDeleting(true);
    try {
      // Extraer el path del URL
      const urlParts = existingPdfUrl.split('/fiscal-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        const { error } = await supabase.storage
          .from('fiscal-documents')
          .remove([filePath]);

        if (error) {
          console.error('Error al eliminar el PDF de storage:', error);
          // Continuar de todas formas para actualizar la base de datos
        }
      }

      // Cargar el perfil de facturación desde la DB o localStorage
      let fiscalData: any = {};
      const savedFiscalData = localStorage.getItem('fiscalData');
      
      if (savedFiscalData) {
        try {
          fiscalData = JSON.parse(savedFiscalData);
        } catch (err) {
          console.error('Error parsing fiscal data from localStorage:', err);
        }
      }

      // Si no hay datos en localStorage, intentar cargar desde la DB
      if (!fiscalData.rfc) {
        try {
          const billingProfile = await getUserBillingProfile();
          if (billingProfile?.success && billingProfile.data) {
            fiscalData = {
              rfc: billingProfile.data.tax_id || '',
              businessName: billingProfile.data.business_name || '',
              taxRegime: billingProfile.data.regimen_fiscal || '',
              cfdiUsage: billingProfile.data.uso_cfdi || ''
            };
          }
        } catch (err) {
          console.error('Error loading fiscal data from DB:', err);
        }
      }

      // Actualizar el perfil de facturación para eliminar la URL del PDF
      try {
        // Primero obtener el perfil existente
        const billingProfile = await getUserBillingProfile();
        
        if (billingProfile?.success && billingProfile.data) {
          // Actualizar directamente con Supabase para establecer certificate_pdf_url a null
          const { error: updateError } = await supabase
            .from('user_billing_profiles')
            .update({ certificate_pdf_url: null })
            .eq('id', billingProfile.data.id);

          if (updateError) {
            console.error('Error al actualizar el perfil en Supabase:', updateError);
            // Intentar con upsertUserBillingProfile como fallback
            await upsertUserBillingProfile({
              tax_id: fiscalData.rfc || billingProfile.data.tax_id || '',
              business_name: fiscalData.businessName || billingProfile.data.business_name || '',
              email: user.email || billingProfile.data.email || undefined,
              regimen_fiscal: fiscalData.taxRegime || billingProfile.data.regimen_fiscal || undefined,
              uso_cfdi: fiscalData.cfdiUsage || billingProfile.data.uso_cfdi || undefined,
              certificate_pdf_url: null as any,
              is_default: true
            });
          }
        } else {
          // Si no hay perfil, intentar crear/actualizar con upsert
          await upsertUserBillingProfile({
            tax_id: fiscalData.rfc || '',
            business_name: fiscalData.businessName || '',
            email: user.email || undefined,
            regimen_fiscal: fiscalData.taxRegime || undefined,
            uso_cfdi: fiscalData.cfdiUsage || undefined,
            certificate_pdf_url: null as any,
            is_default: true
          });
        }
      } catch (err) {
        console.error('Error al actualizar el perfil:', err);
        // Continuar de todas formas para limpiar el estado local
      }

      // Limpiar el estado local
      setExistingPdfUrl(null);
      setExistingPdfName(null);
      setExistingPdfDate(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error al eliminar el PDF:', error);
      setError('Error al eliminar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContinue = async () => {
    // Si ya hay un PDF y no se seleccionó uno nuevo, continuar con el existente
    if (existingPdfUrl && !selectedFile) {
      navigate('/billing-step-3');
      return;
    }

    // Si no hay PDF ni archivo seleccionado, permitir continuar de todas formas
    if (!selectedFile) {
      navigate('/billing-step-3');
      return;
    }

    // Si se seleccionó un archivo nuevo, subirlo
    setIsUploading(true);
    setError(null);

    try {
      // Subir el PDF a Supabase Storage (reemplazar si ya existe uno)
      const pdfUrl = await uploadPDFToStorage(selectedFile, !!existingPdfUrl);
      
      if (!pdfUrl) {
        setError('No se pudo subir el archivo. Por favor, intenta nuevamente.');
        setIsUploading(false);
        return;
      }

      // Actualizar el perfil de facturación con la URL del PDF
      if (user?.id) {
        // Cargar el perfil existente desde la DB para asegurar que actualizamos el correcto
        let billingProfile = await getUserBillingProfile();
        let fiscalData: any = {};
        
        // Si hay un perfil en la DB, usar esos datos
        if (billingProfile?.success && billingProfile.data) {
          fiscalData = {
            rfc: billingProfile.data.tax_id,
            businessName: billingProfile.data.business_name,
            taxRegime: billingProfile.data.regimen_fiscal,
            cfdiUsage: billingProfile.data.uso_cfdi
          };
        } else {
          // Si no hay perfil en DB, intentar cargar desde localStorage
          const savedFiscalData = localStorage.getItem('fiscalData');
          if (savedFiscalData) {
            try {
              fiscalData = JSON.parse(savedFiscalData);
            } catch (err) {
              console.error('Error parsing fiscal data from localStorage:', err);
            }
          }
        }
        
        try {
          const result = await upsertUserBillingProfile({
            tax_id: fiscalData.rfc || '',
            business_name: fiscalData.businessName || '',
            email: user.email || undefined,
            regimen_fiscal: fiscalData.taxRegime || undefined,
            uso_cfdi: fiscalData.cfdiUsage || undefined,
            certificate_pdf_url: pdfUrl,
            is_default: true
          });
          
          // Verificar que se guardó correctamente
          if (result?.success && result.data) {
            if (result.data.certificate_pdf_url) {
              setExistingPdfUrl(result.data.certificate_pdf_url);
              
              // Actualizar nombre del archivo
              const fileName = selectedFile.name;
              setExistingPdfName(fileName);
              
              // Actualizar fecha de subida
              if (result.data.updated_at) {
                const uploadDate = new Date(result.data.updated_at);
                const formattedDate = uploadDate.toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                setExistingPdfDate(formattedDate);
              }
            } else {
              // El campo existe pero no se guardó - puede ser que el campo no exista en la tabla
              console.warn('[UploadConstancia] PDF URL was not saved. The certificate_pdf_url field may not exist in the table.');
              console.warn('[UploadConstancia] Please run: supabase/add-certificate-pdf-field.sql');
              // Aún así establecer la URL localmente para que el usuario pueda continuar
              setExistingPdfUrl(pdfUrl);
              setExistingPdfName(selectedFile.name);
              setExistingPdfDate(new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }));
            }
          } else {
            console.error('[UploadConstancia] Error saving PDF URL:', result?.error);
            // Aún así establecer la URL localmente
            setExistingPdfUrl(pdfUrl);
            setExistingPdfName(selectedFile.name);
            setExistingPdfDate(new Date().toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }));
          }
          
          setSelectedFile(null);
        } catch (err) {
          console.error('[UploadConstancia] Error al actualizar el perfil de facturación:', err);
          // Continuar de todas formas, el PDF ya está subido
          setExistingPdfUrl(pdfUrl);
        }
      }

      // Navegar a la siguiente pantalla
      navigate('/billing-step-3');
    } catch (err) {
      console.error('Error al procesar el archivo:', err);
      setError('Ocurrió un error al procesar el archivo. Por favor, intenta nuevamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen pb-40">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 safe-top">
        <div className="flex items-center p-4 justify-between">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">{t('billing.step2')}</h2>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6">
        <div className="flex gap-1 w-full h-1">
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <p className="text-xs font-semibold text-primary mt-2 uppercase">{t('billing.step2of4')}</p>

        <section className="pt-4">
          <h3 className="text-3xl font-extrabold">{t('billing.uploadCertificate')}</h3>
          {showDescription && (
            <p className="text-gray-600 dark:text-gray-400 text-base mt-2 transition-opacity duration-300">
              {t('billing.uploadCertificateDesc')}
            </p>
          )}
        </section>

        <div className="mt-8 space-y-6">
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800/40 p-10 flex flex-col items-center justify-center text-center rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">hourglass_empty</span>
              </div>
              <h4 className="font-bold text-lg">Cargando información...</h4>
              <p className="text-gray-500 text-sm mt-1">Verificando si hay un PDF guardado</p>
            </div>
          ) : (
            <>
              {/* Mostrar si ya hay un PDF guardado */}
              {existingPdfUrl && !selectedFile && (
            <div className="bg-white dark:bg-[#2d2516] rounded-xl border border-[#e6e0db] dark:border-[#3d3321] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg text-[#181411] dark:text-white mb-2">PDF ya cargado</h4>
                  
                  {existingPdfName && (
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-[#181411] dark:text-white mb-1">Archivo:</p>
                      <p className="text-sm text-[#897C61] dark:text-[#A8937D] truncate" title={existingPdfName}>
                        {existingPdfName}
                      </p>
                    </div>
                  )}
                  
                  {existingPdfDate && (
                    <div className="mb-4">
                      <p className="text-xs text-[#897C61] dark:text-[#A8937D] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Subido el {existingPdfDate}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-sm text-[#897C61] dark:text-[#A8937D] mb-4">
                    Puedes continuar con este archivo o reemplazarlo por uno nuevo.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 active:scale-95"
                    >
                      Eliminar PDF
                    </button>
                    <button
                      onClick={handleClick}
                      className="px-4 py-2 text-sm font-semibold text-primary bg-primary/10 dark:bg-primary/20 rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors active:scale-95"
                    >
                      Reemplazar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mostrar solo si no hay PDF existente o si se está reemplazando */}
          {(!existingPdfUrl || selectedFile) && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`dotted-border bg-white dark:bg-gray-800/40 p-10 flex flex-col items-center justify-center text-center group cursor-pointer transition-all ${
                  isDragging ? 'border-primary border-2 bg-primary/5' : ''
                } ${selectedFile ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                {selectedFile ? (
                  <>
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <h4 className="font-bold text-lg text-primary">{selectedFile.name}</h4>
                    <p className="text-gray-500 text-sm mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    {existingPdfUrl && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-semibold">
                        Este archivo reemplazará el PDF actual
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="mt-4 text-sm text-red-500 hover:text-red-600 font-semibold"
                    >
                      Eliminar archivo
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                    </div>
                    <h4 className="font-bold text-lg">{t('billing.selectPDF')}</h4>
                    <p className="text-gray-500 text-sm mt-1">{t('billing.dragFile')}</p>
                    <p className="text-xs text-gray-400 mt-4">{t('billing.supportedFormat')}</p>
                  </>
                )}
              </div>
            </div>
          )}

              {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white dark:bg-[#2d2516] rounded-2xl p-6 max-w-sm w-full shadow-xl border border-[#e6e0db] dark:border-[#3d3321]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold text-center text-[#181411] dark:text-white mb-2">
              ¿Eliminar PDF?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-6">
              ¿Estás seguro de que deseas eliminar el PDF actual? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#322a1a] text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteExistingPdf}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">hourglass_empty</span>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">delete</span>
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed left-0 right-0 bg-white/90 dark:bg-background-dark/90 ios-blur border-t border-gray-100 dark:border-gray-800 p-4 pb-4 z-50" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <button 
          onClick={handleContinue} 
          disabled={isLoading || isUploading || isDeleting}
          className="w-full bg-primary hover:bg-[#e07d1d] text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Subiendo...' : isDeleting ? 'Eliminando...' : isLoading ? 'Cargando...' : t('common.continue')}
        </button>
      </div>
    </div>
  );
};

export default UploadConstanciaScreen;
