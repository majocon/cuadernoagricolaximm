import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

import { Sidebar } from './components/Sidebar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ParcelasManager } from './components/DataManagers/ParcelasManager.tsx';
import { CultivosManager } from './components/DataManagers/CultivosManager.tsx';
import { FinanzasManager } from './components/DataManagers/FinanzasManager.tsx';
import { FacturasManager } from './components/DataManagers/FacturasManager.tsx';
import { TrabajosManager } from './components/DataManagers/TrabajosManager.tsx';
import { AjustesManager } from './components/DataManagers/AjustesManager.tsx';
import { AI_AssistantManager } from './components/AI_AssistantManager.tsx';
import { AppSection, Parcela, Cultivo, RegistroFinanciero, Factura, Trabajo, DatosFiscales, Identifiable } from './types.ts';

// --- Supabase Client Setup ---
// Credenciales de Supabase. Reemplázalas con las de tu propio proyecto.
const supabaseUrl = 'https://lbovferknvuidphjaipf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxib3ZmZXJrbnZ1aWRwaGphaXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzU1MjgsImV4cCI6MjA3NTY1MTUyOH0.hgEwCC3QqkRaCIj5Xyyy1JQwCQEZpNHVyw04JmzyDNg';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
// A fixed, special UUID for the single row of fiscal data.
const DATOS_FISCALES_FIXED_ID = '00000000-0000-0000-0000-000000000001';

/*
  SUGGESTED SUPABASE TABLE SCHEMAS (using snake_case):
  
  - parcelas: id (uuid, pk), nombre (text), ubicacion (text), superficie (float8), referencia_catastral (text, nullable), coordenadas (text, nullable), notas (text, nullable)
  - cultivos: id (uuid, pk), parcela_id (uuid, fk -> parcelas.id), nombre_cultivo (text), variedad (text, nullable), superficie_cultivada (float8), notas (text, nullable)
  - registros_financieros: id (uuid, pk), tipo (text), fecha (date), concepto (text), cantidad (float8), categoria (text, nullable), notas (text, nullable)
  - facturas: id (uuid, pk), numero_factura (text), fecha (date), tipo (text), cliente_proveedor (text), cliente_proveedor_nif (text, nullable), cliente_proveedor_direccion (text, nullable), descripcion (text), base_imponible (float8), iva_porcentaje (float8), total_factura (float8), pagada (bool), notas (text, nullable)
  - trabajos: id (uuid, pk), parcela_id (uuid, fk -> parcelas.id, nullable), cultivo_id (uuid, fk -> cultivos.id, nullable), fecha_programada (date), fecha_realizacion (date, nullable), descripcion_tarea (text), responsable (text, nullable), estado (text), coste_materiales (float8, nullable), horas_trabajo (float8, nullable), notas (text, nullable)
  - datos_fiscales: id (uuid, pk), nombre_o_razon_social (text), nif_cif (text), direccion (text), codigo_postal (text), localidad (text), provincia (text), pais (text), email (text, nullable), telefono (text, nullable) (Note: This app uses a fixed UUID for this single-row table)
  
  RECOMMENDATION: Set up ON DELETE CASCADE for foreign keys (e.g., when a parcela is deleted, its cultivos and trabajos are also deleted) directly in your Supabase table definitions for better data integrity.
*/

// --- Data Normalization Utility ---
// Supabase client converts snake_case columns to camelCase. This utility converts them back.
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const keysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToSnakeCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[toSnakeCase(key)] = keysToSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const getImprovedSupabaseError = (error: any): string => {
    let userMessage = error.message;
    if (typeof userMessage === 'string' && userMessage.includes("Could not find the") && userMessage.includes("column")) {
        const matches = userMessage.match(/column '(.+?)' of '(.+?)'/);
        if (matches && matches.length === 3) {
            const columnName = matches[1];
            const tableName = matches[2];
            return `Error de Base de Datos: No se encontró la columna '${columnName}' en la tabla '${tableName}'.\n\n` +
                   `Por favor, vaya a su panel de Supabase, abra la tabla '${tableName}' y asegúrese de que existe una columna con ese nombre exacto (en minúsculas y con guiones bajos, ej: '${columnName}').`;
        }
    }
    return userMessage;
};

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.DASHBOARD);
  
  // Data states
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [registros, setRegistros] = useState<RegistroFinanciero[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [datosFiscales, setDatosFiscales] = useState<DatosFiscales | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Initial data fetching from Supabase
  useEffect(() => {
      if (!supabase) {
          setError("La configuración de Supabase no está disponible. Por favor, configure las variables de entorno SUPABASE_URL y SUPABASE_KEY.");
          setIsLoading(false);
          setIsDbConnected(false);
          return;
      }

      const fetchAllData = async () => {
          try {
              const [
                  parcelasRes, cultivosRes, registrosRes, facturasRes, trabajosRes, datosFiscalesRes
              ] = await Promise.all([
                  supabase.from('parcelas').select('*'),
                  supabase.from('cultivos').select('*'),
                  supabase.from('registros_financieros').select('*'),
                  supabase.from('facturas').select('*'),
                  supabase.from('trabajos').select('*'),
                  supabase.from('datos_fiscales').select('*').limit(1).single()
              ]);

              const responses = [parcelasRes, cultivosRes, registrosRes, facturasRes, trabajosRes];
              for (const res of responses) { if (res.error) throw res.error; }
              if (datosFiscalesRes.error && datosFiscalesRes.error.code !== 'PGRST116') { throw datosFiscalesRes.error; }

              setIsDbConnected(true);
              setParcelas((parcelasRes.data || []).filter(Boolean));
              setCultivos((cultivosRes.data || []).filter(Boolean));
              setRegistros((registrosRes.data || []).filter(Boolean));
              setFacturas((facturasRes.data || []).filter(Boolean));
              setTrabajos((trabajosRes.data || []).filter(Boolean));
              setDatosFiscales(datosFiscalesRes.data || null);

          } catch (err: any) {
              console.error("Error fetching data from Supabase:", err);
              setError(`No se pudieron cargar los datos: ${err.message}. Revise la conexión y la configuración de las tablas en Supabase.`);
              setIsDbConnected(false);
          } finally {
              setIsLoading(false);
          }
      };

      fetchAllData();
  }, []);

  const handleGoToDashboard = useCallback(() => setCurrentSection(AppSection.DASHBOARD), []);
  
  const verifySupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!supabase) {
        const msg = "Cliente de Supabase no inicializado.";
        setIsDbConnected(false);
        return { success: false, message: msg };
    }
    try {
        const { error } = await supabase.from('parcelas').select('id', { count: 'exact', head: true });
        if (error) throw error;
        setIsDbConnected(true);
        return { success: true, message: '¡Conexión exitosa con la base de datos!' };
    } catch (err: any) {
        setIsDbConnected(false);
        console.error("Supabase connection check failed:", err);
        return { success: false, message: `Error de conexión: ${err.message}` };
    }
  };

  // Generic CRUD Handlers
  const handleAddItem = useCallback(async <T extends Omit<Identifiable, 'id'>>(
    setter: React.Dispatch<React.SetStateAction<any[]>>,
    tableName: string,
    item: T
  ) => {
    if (!supabase) return;
    const newItemWithId = { ...item, id: uuidv4() };

    const { data, error } = await supabase
        .from(tableName)
        .insert([keysToSnakeCase(newItemWithId)])
        .select();

    if (error) {
        alert(`Error al añadir: ${getImprovedSupabaseError(error)}`);
        return;
    }

    if (!data || data.length === 0) {
        alert("Error: El elemento se guardó, pero no se pudo recuperar. Revise los permisos (RLS) en Supabase para la operación de LECTURA (SELECT).");
        setter(prev => [...prev, newItemWithId]);
        return;
    }
    
    setter(prev => [...prev, data[0]]);
  }, []);

  const handleUpdateItem = useCallback(async <T extends Identifiable>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    tableName: string,
    updatedItem: T
  ) => {
    if (!supabase) return;
    
    const { data, error } = await supabase
        .from(tableName)
        .update(keysToSnakeCase(updatedItem))
        .eq('id', updatedItem.id)
        .select();

    if (error) {
        alert(`Error al actualizar: ${getImprovedSupabaseError(error)}`);
        return;
    }
    
    if (!data || data.length === 0) {
        alert("Error: El elemento se actualizó, pero no se pudo recuperar. Revise los permisos (RLS) en Supabase para la operación de LECTURA (SELECT).");
        setter(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        return;
    }

    setter(prev => prev.map(item => item.id === updatedItem.id ? data[0] : item));
  }, []);

  const handleDeleteItem = useCallback(async <T extends Identifiable,>(setter: React.Dispatch<React.SetStateAction<T[]>>, tableName: string, id: string) => {
      if (!supabase) return;
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) { alert(`Error al eliminar: ${getImprovedSupabaseError(error)}`); } 
      else { setter(prev => prev.filter(item => item.id !== id)); }
  }, []);

  // Specific CRUD operations
  const handleDeleteParcela = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm('¿Está seguro? Se eliminarán también los cultivos y trabajos asociados a esta parcela.')) return;
    const { data: relatedCultivos } = await supabase.from('cultivos').select('id').eq('parcela_id', id);
    const cultivoIds = relatedCultivos?.map(c => c.id) || [];
    if (cultivoIds.length > 0) await supabase.from('trabajos').delete().in('cultivo_id', cultivoIds);
    await supabase.from('trabajos').delete().eq('parcela_id', id);
    await supabase.from('cultivos').delete().eq('parcela_id', id);
    await handleDeleteItem(setParcelas, 'parcelas', id);
    setTrabajos(prev => prev.filter(t => t.parcelaId !== id && !cultivoIds.includes(t.cultivoId || '')));
    setCultivos(prev => prev.filter(c => c.parcelaId !== id));
  };
  
  const handleDeleteCultivo = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm('¿Está seguro? Se eliminarán también los trabajos asociados a este cultivo.')) return;
    await supabase.from('trabajos').delete().eq('cultivo_id', id);
    await handleDeleteItem(setCultivos, 'cultivos', id);
    setTrabajos(prev => prev.filter(t => t.cultivoId !== id));
  };

  const handleSaveDatosFiscales = async (data: DatosFiscales): Promise<boolean> => {
    if (!supabase) {
      alert("Error: Cliente de Supabase no inicializado.");
      return false;
    }
    const payload = keysToSnakeCase({
      ...data,
      id: DATOS_FISCALES_FIXED_ID,
      email: data.email || null,
      telefono: data.telefono || null,
    });

    const { data: savedData, error } = await supabase
      .from('datos_fiscales')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error saving fiscal data:", error);
      alert(`Error al guardar datos fiscales: ${getImprovedSupabaseError(error)}`);
      return false;
    }

    if (!savedData) {
      alert("Error: Los datos se guardaron, pero no se pudieron recuperar. Revise los permisos (RLS) en Supabase para la operación de LECTURA (SELECT).");
      setDatosFiscales({ ...data, id: DATOS_FISCALES_FIXED_ID });
      return true;
    }

    setDatosFiscales(savedData);
    return true;
  };

  const handleExportData = useCallback(() => {
    const allData = { parcelas, cultivos, registrosFinancieros: registros, facturas, trabajos, datosFiscales };
    const dataToExport = { appName: "Cuaderno de Campo Agrícola", version: "1.1-supabase", exportedAt: new Date().toISOString(), data: allData };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuaderno-campo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [parcelas, cultivos, registros, facturas, trabajos, datosFiscales]);

  const handleImportData = useCallback(async (data: any) => {
    if (!supabase) return;
    try {
        const tableNames = ['trabajos', 'facturas', 'registros_financieros', 'cultivos', 'parcelas', 'datos_fiscales'];
        for (const tableName of tableNames) {
            const { data: ids } = await supabase.from(tableName).select('id');
            if (ids && ids.length > 0) {
                const { error } = await supabase.from(tableName).delete().in('id', ids.map((i: any) => i.id));
                if (error) throw error;
            }
        }
        if (data.datosFiscales) {
            const { id, ...fiscalData } = data.datosFiscales; // Safely remove any existing id
            await supabase.from('datos_fiscales').insert({ ...keysToSnakeCase(fiscalData), id: DATOS_FISCALES_FIXED_ID });
        }
        if (data.parcelas?.length) await supabase.from('parcelas').insert(keysToSnakeCase(data.parcelas));
        if (data.cultivos?.length) await supabase.from('cultivos').insert(keysToSnakeCase(data.cultivos));
        if (data.registrosFinancieros?.length) await supabase.from('registros_financieros').insert(keysToSnakeCase(data.registrosFinancieros));
        if (data.facturas?.length) await supabase.from('facturas').insert(keysToSnakeCase(data.facturas));
        if (data.trabajos?.length) await supabase.from('trabajos').insert(keysToSnakeCase(data.trabajos));
        
        alert('¡Datos importados con éxito! La aplicación se recargará.');
        window.location.reload();
    } catch (error: any) {
        alert(`Hubo un error al importar los datos: ${error.message}.`);
    }
  }, [supabase]);


  const renderSection = () => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div></div>;
    }
    if (error) {
        return <div className="p-8"><div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><p className="font-bold">Error de Conexión</p><p>{error}</p></div></div>;
    }
    
    switch (currentSection) {
      case AppSection.DASHBOARD: return <Dashboard parcelas={parcelas} cultivos={cultivos} registros={registros} facturas={facturas} trabajos={trabajos} onNavigate={setCurrentSection} onExportData={handleExportData} />;
      case AppSection.PARCELAS: return <ParcelasManager parcelas={parcelas} onAddParcela={(item) => handleAddItem(setParcelas, 'parcelas', item)} onUpdateParcela={(item) => handleUpdateItem(setParcelas, 'parcelas', item)} onDeleteParcela={handleDeleteParcela} onGoToDashboard={handleGoToDashboard} />;
      case AppSection.CULTIVOS: return <CultivosManager cultivos={cultivos} parcelas={parcelas} onAddCultivo={(item) => handleAddItem(setCultivos, 'cultivos', item)} onUpdateCultivo={(item) => handleUpdateItem(setCultivos, 'cultivos', item)} onDeleteCultivo={handleDeleteCultivo} onGoToDashboard={handleGoToDashboard} />;
      case AppSection.FINANZAS: return <FinanzasManager registros={registros} onAddRegistro={(item) => handleAddItem(setRegistros, 'registros_financieros', item)} onUpdateRegistro={(item) => handleUpdateItem(setRegistros, 'registros_financieros', item)} onDeleteRegistro={(id) => handleDeleteItem(setRegistros, 'registros_financieros', id)} onGoToDashboard={handleGoToDashboard} />;
      case AppSection.FACTURAS: return <FacturasManager facturas={facturas} datosFiscales={datosFiscales} onAddFactura={(item) => handleAddItem(setFacturas, 'facturas', item)} onUpdateFactura={(item) => handleUpdateItem(setFacturas, 'facturas', item)} onDeleteFactura={(id) => handleDeleteItem(setFacturas, 'facturas', id)} onGoToDashboard={handleGoToDashboard} />;
      case AppSection.TRABAJOS: return <TrabajosManager trabajos={trabajos} parcelas={parcelas} cultivos={cultivos} onAddTrabajo={(item) => handleAddItem(setTrabajos, 'trabajos', item)} onUpdateTrabajo={(item) => handleUpdateItem(setTrabajos, 'trabajos', item)} onDeleteTrabajo={(id) => handleDeleteItem(setTrabajos, 'trabajos', id)} onGoToDashboard={handleGoToDashboard} />;
      case AppSection.AI_ASSISTANT: return <AI_AssistantManager onGoToDashboard={handleGoToDashboard} />;
      case AppSection.AJUSTES: return <AjustesManager datosFiscales={datosFiscales} onSaveDatosFiscales={handleSaveDatosFiscales} onExportData={handleExportData} onImportData={handleImportData} onVerifyConnection={verifySupabaseConnection} onGoToDashboard={handleGoToDashboard} />;
      default: return <Dashboard parcelas={parcelas} cultivos={cultivos} registros={registros} facturas={facturas} trabajos={trabajos} onNavigate={setCurrentSection} onExportData={handleExportData} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentSection={currentSection} 
        onSelectSection={setCurrentSection} 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isDbConnected={isDbConnected}
      />
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-20 p-2 bg-green-800 text-white rounded-md hover:bg-green-700"
          aria-label="Abrir menú"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        {renderSection()}
      </main>
    </div>
  );
};

// --- Helper Icon Component ---
const Bars3Icon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg> );

export default App;