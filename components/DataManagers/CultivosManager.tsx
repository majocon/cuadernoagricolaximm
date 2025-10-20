import React, { useState, useCallback } from 'react';
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

const initialCultivoFormState: Omit<Cultivo, 'id'> = {
  parcela_id: '', nombreCultivo: '', variedad: '', superficieCultivada: 0, notas: '',
};

export const CultivosManager: React.FC<CultivosManagerProps> = ({ cultivos, parcelas, onAddCultivo, onUpdateCultivo, onDeleteCultivo, onGoToDashboard }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCultivo, setEditingCultivo] = useState<Cultivo | null>(null);
  const [formData, setFormData] = useState<Omit<Cultivo, 'id'>>(initialCultivoFormState);
  const [isPrinting, setIsPrinting] = useState(false);

  const parcelaOptions = parcelas.map(p => ({ value: p.id, label: p.nombre }));
  const getParcelaName = (parcela_id: string) => parcelas.find(p => p.id === parcela_id)?.nombre || 'N/A';
  const formatHectares = (num: number) => parseFloat(num.toFixed(3));

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    try {
        const headers = ["Cultivo", "Variedad", "Parcela", "Sup. Cultivada (ha)", "Notas"];
        printDataTable('Informe de Cultivos', headers, cultivos, (c: Cultivo) => [c.nombreCultivo, c.variedad || '-', getParcelaName(c.parcela_id), formatHectares(c.superficieCultivada), c.notas || '']);
    } catch (error) {
        console.error("Error printing:", error);
    } finally {
        setTimeout(() => setIsPrinting(false), 1000);
    }
  }, [cultivos, parcelas]);

  const handleOpenModal = useCallback((cultivo?: Cultivo) => {
    setEditingCultivo(cultivo || null);
    setFormData(cultivo ? cultivo : {...initialCultivoFormState, parcela_id: parcelas[0]?.id || ''});
    setIsModalOpen(true);
  }, [parcelas]);

  const handleCloseModal = useCallback(() => { setIsModalOpen(false); }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parcela_id) { alert("Por favor, seleccione una parcela."); return; }
    if (editingCultivo) {
      onUpdateCultivo({ ...editingCultivo, ...formData });
    } else {
      onAddCultivo(formData);
    }
    handleCloseModal();
  }, [formData, editingCultivo, onAddCultivo, onUpdateCultivo, handleCloseModal]);

  const handleDelete = useCallback((id: string) => {
      onDeleteCultivo(id);
  }, [onDeleteCultivo]);
  
  const tableHeaders = ["Cultivo", "Variedad", "Parcela", "Sup. Cultivada (ha)"];

  return (
    <ManagerLayout title="Gestión de Cultivos" onAddItem={() => handleOpenModal()} addItemLabel="Añadir Cultivo" onGoToDashboard={onGoToDashboard}
      headerActions={cultivos.length > 0 ? (<Button onClick={handlePrint} variant="secondary" leftIcon={<PrinterIcon className="h-5 w-5" />} disabled={isPrinting}>{isPrinting ? 'Imprimiendo...' : 'Imprimir'}</Button>) : null}>
      {cultivos.length === 0 ? (<p className="text-gray-600 text-center py-4">No hay cultivos. {parcelas.length === 0 && "Primero debe añadir parcelas."}</p>) : (
      <DataTable headers={tableHeaders}>
        {cultivos.map((cultivo) => (
          <tr key={cultivo.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cultivo.nombreCultivo}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cultivo.variedad || '-'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getParcelaName(cultivo.parcela_id)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatHectares(cultivo.superficieCultivada)}</td>
            <ItemActionButtons onEdit={() => handleOpenModal(cultivo)} onDelete={() => handleDelete(cultivo.id)} />
          </tr>
        ))}
      </DataTable>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCultivo ? 'Editar Cultivo' : 'Añadir Cultivo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Parcela" name="parcela_id" value={formData.parcela_id} onChange={handleChange} options={parcelaOptions} required disabled={parcelaOptions.length === 0} placeholder="Seleccione una parcela"/>
          <Input label="Nombre del Cultivo" name="nombreCultivo" value={formData.nombreCultivo} onChange={handleChange} required />
          <Input label="Variedad (Opcional)" name="variedad" value={formData.variedad || ''} onChange={handleChange} />
          <Input label="Superficie Cultivada (ha)" name="superficieCultivada" type="number" step="0.001" value={formData.superficieCultivada} onChange={handleChange} required min="0"/>
          <TextArea label="Notas (Opcional)" name="notas" value={formData.notas || ''} onChange={handleChange} />
          <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button><Button type="submit" variant="primary" disabled={parcelaOptions.length === 0}>Guardar</Button></div>
        </form>
      </Modal>
    </ManagerLayout>
  );
};