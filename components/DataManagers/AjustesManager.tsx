import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DatosFiscales } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { Input, TextArea } from '../ui/Input.tsx';
import { HomeIcon, ArrowDownTrayIcon } from '../icons/IconComponents.tsx';

interface AjustesManagerProps {
  datosFiscales: DatosFiscales | null;
  onSaveDatosFiscales: (data: DatosFiscales) => Promise<void>;
  onGoToDashboard: () => void;
  onExportData: () => void;
  onImportData: (data: any) => Promise<void>;
  onVerifyConnection: () => Promise<{ success: boolean; message: string; }>;
}

const initialFormState: DatosFiscales = {
  nombreORazonSocial: '', nifCif: '', direccion: '', codigoPostal: '',
  localidad: '', provincia: '', pais: 'España', email: '', telefono: '',
};

export const AjustesManager: React.FC<AjustesManagerProps> = ({ datosFiscales, onSaveDatosFiscales, onGoToDashboard, onExportData, onImportData, onVerifyConnection }) => {
  const [formData, setFormData] = useState<DatosFiscales>(initialFormState);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    state: 'idle' | 'verifying' | 'success' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (datosFiscales) { setFormData(datosFiscales); }
  }, [datosFiscales]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveDatosFiscales(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }, [formData, onSaveDatosFiscales]);

  const handleVerifyClick = useCallback(async () => {
    setVerificationStatus({ state: 'verifying', message: 'Verificando...' });
    const result = await onVerifyConnection();
    if (result.success) {
        setVerificationStatus({ state: 'success', message: result.message });
    } else {
        setVerificationStatus({ state: 'error', message: result.message });
    }
    setTimeout(() => setVerificationStatus({ state: 'idle', message: '' }), 5000);
  }, [onVerifyConnection]);
  
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("¿Está seguro? Importar un archivo reemplazará TODOS los datos actuales en la nube. Se recomienda exportar los datos actuales primero.")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const importedJson = JSON.parse(text);

        if (importedJson && importedJson.data && typeof importedJson.data === 'object') {
          await onImportData(importedJson.data);
        } else {
          throw new Error('El formato del archivo no es válido.');
        }
      } catch (error: any) {
        alert(`Error al importar: ${error.message}`);
      } finally {
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => { alert('No se pudo leer el archivo.'); };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <button onClick={onGoToDashboard} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Volver al Inicio">
                <HomeIcon className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-xl md:text-3xl font-bold text-gray-800">Ajustes</h1>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Mis Datos Fiscales</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">Estos datos se utilizarán para generar facturas y otros documentos.</p>
          <Input label="Nombre o Razón Social" name="nombreORazonSocial" value={formData.nombreORazonSocial} onChange={handleChange} required />
          <Input label="NIF/CIF" name="nifCif" value={formData.nifCif} onChange={handleChange} required />
          <TextArea label="Dirección Fiscal Completa" name="direccion" value={formData.direccion} onChange={handleChange} required />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Código Postal" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} required />
              <Input label="Localidad" name="localidad" value={formData.localidad} onChange={handleChange} required />
              <Input label="Provincia" name="provincia" value={formData.provincia} onChange={handleChange} required />
          </div>
          <Input label="País" name="pais" value={formData.pais} onChange={handleChange} required />
          <Input label="Email de Contacto (Opcional)" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
          <Input label="Teléfono de Contacto (Opcional)" name="telefono" value={formData.telefono || ''} onChange={handleChange} />
          <div className="flex justify-end pt-4"> <Button type="submit" variant="primary">Guardar Cambios</Button> </div>
          {showSuccess && <p className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">¡Datos fiscales guardados correctamente!</p>}
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Conexión a la Base de Datos</h2>
        <p className="text-sm text-gray-600 mb-4">Comprueba si la aplicación se puede comunicar correctamente con Supabase.</p>
        <div className="flex items-center gap-4">
          <Button onClick={handleVerifyClick} variant="secondary" disabled={verificationStatus.state === 'verifying'}>
            {verificationStatus.state === 'verifying' ? 'Verificando...' : 'Verificar Conexión'}
          </Button>
          {verificationStatus.state !== 'idle' && (
            <p className={`text-sm font-medium ${
                verificationStatus.state === 'success' ? 'text-green-600' :
                verificationStatus.state === 'error' ? 'text-red-600' :
                'text-gray-600'
            }`}>
              {verificationStatus.message}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Gestión de Datos y Aplicación</h2>
        <p className="text-sm text-gray-600 mb-4">Realiza copias de seguridad de tus datos o instala la aplicación en tu dispositivo.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={onExportData} variant="secondary">Exportar Datos (.json)</Button>
          <Button onClick={handleImportClick} variant="ghost">Importar Datos (.json)</Button>
          <div title={!installPrompt ? "La instalación no está disponible o la app ya está instalada." : ""}>
            <Button onClick={handleInstallClick} variant="primary" leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />} disabled={!installPrompt}>Instalar Aplicación</Button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json,.json" />
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-md mt-4"><strong>Atención:</strong> Al importar, se sobreescribirán todos los datos existentes. Asegúrese de tener una copia de seguridad.</p>
      </div>
    </div>
  );
};
