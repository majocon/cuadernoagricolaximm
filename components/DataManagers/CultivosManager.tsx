import React, { useState, useCallback, useMemo } from 'react';
import { Cultivo, Parcela } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { Input, TextArea, Select } from '../ui/Input.tsx';
import { Modal } from '../ui/Modal.tsx';
import { DataTable, ManagerLayout, ItemActionButtons } from './common/ManagerComponents.tsx';
import { PrinterIcon } from '../icons/IconComponents.tsx';
import { printDataTable } from '../../services/printService.ts';

interface CultivosManagerProps {
  cultivos: Cultivo[];
  parcelas: Parcela[];
  onAddCultivo: (cultivo: Omit<Cultivo, 'id'>) => void;
  onUpdateCultivo: (cultivo: Cultivo) => void;
  onDeleteCultivo: (id: string) => void;
  onGoToDashboard: () => void;
}

// Estado inicial para el formulario, usado al crear un nuevo cultivo.
const initialCultivoFormState: Omit<Cultivo, 'id'> = {
  parcelaId: '',
  nombreCultivo: '',
  variedad: '',
  superficieCultivada: 0,
  notas: '',
};

export const CultivosManager: React.FC<CultivosManagerProps> = ({ 
  cultivos, 
  parcelas, 
  onAddCultivo, 
  onUpdateCultivo, 
  onDeleteCultivo, 
  onGoToDashboard 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCultivo, setEditingCultivo] = useState<Cultivo | null>(null);
  const [formData, setFormData] = useState<Omit<Cultivo, 'id'>>(initialCultivoFormState);
  const [isPrinting, setIsPrinting] = useState(false);

  // --- Helpers y Datos Memoizados ---
  const parcelaOptions = useMemo(() => parcelas.map(p => ({ value: p.id, label: p.nombre })), [parcelas]);
  const getParcelaName = useCallback((parcelaId: string) => parcelas.find(p => p.id === parcelaId)?.nombre || 'N/A', [parcelas]);
  const formatHectares = (num: number) => (num || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

  // --- Manejadores de Eventos (Callbacks) ---
  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    try {
        printDataTable(
            'Informe de Cultivos', 
            ["Cultivo", "Variedad", "Parcela", "Sup. Cultivada (ha)", "Notas"], 
            cultivos, 
            (c: Cultivo) => [
                c.nombreCultivo, 
                c.variedad || '-', 
                getParcelaName(c.parcelaId), 
                formatHectares(c.superficieCultivada), 
                c.notas || ''
            ]
        );
    } catch (error) {
        console.error("Error al imprimir:", error);
    } finally {
        setTimeout(() => setIsPrinting(false), 1000);
    }
  }, [cultivos, getParcelaName]);

  const handleOpenModal = useCallback((cultivo?: Cultivo) => {
    if (cultivo) {
      // Editando: Cargar datos existentes. Se guarda el cultivo completo para tener el ID.
      setEditingCultivo(cultivo);
      // Se puebla el formulario con los datos del cultivo, excluyendo el ID.
      const { id, ...cultivoData } = cultivo;
      setFormData(cultivoData);
    } else {
      // Creando: Usar estado inicial, pre-seleccionando la primera parcela si existe.
      setEditingCultivo(null);
      setFormData({ ...initialCultivoFormState, parcelaId: parcelas[0]?.id || '' });
    }
    setIsModalOpen(true);
  }, [parcelas]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Retrasar el reseteo para evitar parpadeos en la UI mientras se cierra el modal
    setTimeout(() => {
        setEditingCultivo(null);
        setFormData(initialCultivoFormState);
    }, 300);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    // Usamos parseFloat para campos numéricos, si no es un número válido, será 0.
    setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: Una parcela es obligatoria.
    if (!formData.parcelaId) {
      alert("Por favor, seleccione una parcela para el cultivo.");
      return;
    }

    // Limpieza de datos: convertir strings vacíos de campos opcionales a null.
    const payload = {
        ...formData,
        superficieCultivada: Number(formData.superficieCultivada) || 0,
        variedad: formData.variedad?.trim() || null,
        notas: formData.notas?.trim() || null,
    };

    if (editingCultivo) {
      // Actualizar: Se necesita el `id` original del cultivo que se está editando.
      onUpdateCultivo({ ...payload, id: editingCultivo.id });
    } else {
      // Añadir: El `id` se genera en el componente padre (App.tsx).
      onAddCultivo(payload);
    }
    handleCloseModal();
  }, [formData, editingCultivo, onAddCultivo, onUpdateCultivo, handleCloseModal]);

  const handleDelete = useCallback((id: string) => {
      if (window.confirm('¿Está seguro de que desea eliminar este cultivo? Esta acción es irreversible y eliminará los trabajos asociados.')) {
        onDeleteCultivo(id);
      }
  }, [onDeleteCultivo]);
  
  const tableHeaders = ["Cultivo", "Variedad", "Parcela", "Sup. Cultivada (ha)"];

  return (
    <ManagerLayout 
      title="Gestión de Cultivos" 
      onAddItem={() => handleOpenModal()} 
      addItemLabel="Añadir Cultivo" 
      onGoToDashboard={onGoToDashboard}
      headerActions={cultivos.length > 0 ? (
        <Button onClick={handlePrint} variant="secondary" leftIcon={<PrinterIcon className="h-5 w-5" />} disabled={isPrinting}>
          {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
        </Button>
      ) : null}
    >
      {cultivos.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">No hay cultivos registrados.</p>
            {parcelas.length === 0 && (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md mt-4">
                  <strong>Atención:</strong> Para añadir un cultivo, primero debe registrar al menos una parcela en la sección 'Parcelas'.
                </p>
            )}
        </div>
      ) : (
        <DataTable headers={tableHeaders}>
          {cultivos.map((cultivo) => (
            <tr key={cultivo.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cultivo.nombreCultivo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cultivo.variedad || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getParcelaName(cultivo.parcelaId)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatHectares(cultivo.superficieCultivada)}</td>
              <ItemActionButtons onEdit={() => handleOpenModal(cultivo)} onDelete={() => handleDelete(cultivo.id)} />
            </tr>
          ))}
        </DataTable>
      )}

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCultivo ? 'Editar Cultivo' : 'Añadir Cultivo'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select 
              label="Parcela *" 
              name="parcelaId" 
              value={formData.parcelaId} 
              onChange={handleChange} 
              options={parcelaOptions} 
              required 
              disabled={parcelaOptions.length === 0}
              placeholder="Seleccione una parcela"
            />
            <Input 
              label="Nombre del Cultivo *" 
              name="nombreCultivo" 
              value={formData.nombreCultivo} 
              onChange={handleChange} 
              required 
            />
            <Input 
              label="Variedad (Opcional)" 
              name="variedad" 
              value={formData.variedad || ''} 
              onChange={handleChange} 
            />
            <Input 
              label="Superficie Cultivada (ha) *" 
              name="superficieCultivada" 
              type="number" 
              step="0.001" 
              value={formData.superficieCultivada} 
              onChange={handleChange} 
              required 
              min="0"
            />
            <TextArea 
              label="Notas (Opcional)" 
              name="notas" 
              value={formData.notas || ''} 
              onChange={handleChange} 
            />
            <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={parcelaOptions.length === 0 && !editingCultivo}>
                {parcelaOptions.length === 0 && !editingCultivo ? 'Añada una parcela primero' : (editingCultivo ? 'Guardar Cambios' : 'Crear Cultivo')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </ManagerLayout>
  );
};
