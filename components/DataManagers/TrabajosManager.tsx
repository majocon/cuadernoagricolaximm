import React, { useState, useCallback } from 'react';
import { Trabajo, Parcela, Cultivo, EstadoTrabajo } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { Input, TextArea, Select } from '../ui/Input.tsx';
import { Modal } from '../ui/Modal.tsx';
import { DataTable, ManagerLayout, ItemActionButtons } from './common/ManagerComponents.tsx';
import { PrinterIcon } from '../icons/IconComponents.tsx';
import { printDataTable } from '../../services/printService.ts';

interface TrabajosManagerProps {
  trabajos: Trabajo[];
  parcelas: Parcela[];
  cultivos: Cultivo[];
  onAddTrabajo: (trabajo: Omit<Trabajo, 'id'>) => void;
  onUpdateTrabajo: (trabajo: Trabajo) => void;
  onDeleteTrabajo: (id: string) => void;
  onGoToDashboard: () => void;
}

const initialTrabajoFormState: Omit<Trabajo, 'id'> = {
  parcela_id: '', cultivo_id: '', fechaProgramada: new Date().toISOString().split('T')[0], fechaRealizacion: '',
  descripcionTarea: '', responsable: '', estado: EstadoTrabajo.PENDIENTE,
  costeMateriales: 0, horasTrabajo: 0, notas: '',
};

export const TrabajosManager: React.FC<TrabajosManagerProps> = ({ trabajos, parcelas, cultivos, onAddTrabajo, onUpdateTrabajo, onDeleteTrabajo, onGoToDashboard }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrabajo, setEditingTrabajo] = useState<Trabajo | null>(null);
  const [formData, setFormData] = useState<Omit<Trabajo, 'id'>>(initialTrabajoFormState);
  const [isPrinting, setIsPrinting] = useState(false);

  const getParcelaName = (id?: string) => parcelas.find(p => p.id === id)?.nombre || 'General';
  const getCultivoName = (id?: string) => cultivos.find(c => c.id === id)?.nombreCultivo || 'N/A';
  const getEstadoLabel = (e: EstadoTrabajo) => e.charAt(0).toUpperCase() + e.slice(1).replace('_', ' ');

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    try {
        const sorted = [...trabajos].sort((a, b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime());
        printDataTable('Informe de Trabajos', ["Tarea", "Parcela", "Cultivo", "F. Prog.", "F. Real.", "Estado"], sorted,
            (t: Trabajo) => [ t.descripcionTarea, getParcelaName(t.parcela_id), t.cultivo_id ? getCultivoName(t.cultivo_id) : 'N/A', new Date(t.fechaProgramada).toLocaleDateString('es-ES'), t.fechaRealizacion ? new Date(t.fechaRealizacion).toLocaleDateString('es-ES') : '-', getEstadoLabel(t.estado) ]);
    } catch (error) { console.error("Error printing:", error); } 
    finally { setTimeout(() => setIsPrinting(false), 1000); }
  }, [trabajos, parcelas, cultivos]);

  const parcelaOptions = [{ value: '', label: 'Ninguna / General' }, ...parcelas.map(p => ({ value: p.id, label: p.nombre }))];
  const cultivoOptions = [{ value: '', label: 'Ninguno / General' }, ...cultivos.filter(c => !formData.parcela_id || c.parcela_id === formData.parcela_id).map(c => ({ value: c.id, label: `${c.nombreCultivo} (${getParcelaName(c.parcela_id)})` }))];
  const estadoOptions = Object.values(EstadoTrabajo).map(e => ({ value: e, label: getEstadoLabel(e) }));

  const handleOpenModal = useCallback((trabajo?: Trabajo) => {
    setEditingTrabajo(trabajo || null);
    setFormData(trabajo ? trabajo : initialTrabajoFormState);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => { setIsModalOpen(false); }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrabajo) {
      onUpdateTrabajo({ ...editingTrabajo, ...formData });
    } else {
      onAddTrabajo(formData);
    }
    handleCloseModal();
  }, [formData, editingTrabajo, onAddTrabajo, onUpdateTrabajo, handleCloseModal]);

  const handleDelete = useCallback((id: string) => { onDeleteTrabajo(id); }, [onDeleteTrabajo]);
  
  const tableHeaders = ["Tarea", "Parcela", "Cultivo", "Fecha Prog.", "Estado"];

  return (
    <ManagerLayout title="Gestión de Trabajos" onAddItem={() => handleOpenModal()} addItemLabel="Añadir Trabajo" onGoToDashboard={onGoToDashboard}
      headerActions={trabajos.length > 0 ? (<Button onClick={handlePrint} variant="secondary" leftIcon={<PrinterIcon className="h-5 w-5" />} disabled={isPrinting}>{isPrinting ? 'Imprimiendo...' : 'Imprimir'}</Button>) : null}>
      {trabajos.length === 0 ? (<p className="text-gray-600 text-center py-4">No hay trabajos registrados.</p>) : (
      <DataTable headers={tableHeaders}>
        {trabajos.map((trabajo) => (
          <tr key={trabajo.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trabajo.descripcionTarea}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getParcelaName(trabajo.parcela_id)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trabajo.cultivo_id ? getCultivoName(trabajo.cultivo_id) : 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(trabajo.fechaProgramada).toLocaleDateString('es-ES')}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trabajo.estado === 'completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{getEstadoLabel(trabajo.estado)}</span></td>
            <ItemActionButtons onEdit={() => handleOpenModal(trabajo)} onDelete={() => handleDelete(trabajo.id)} />
          </tr>
        ))}
      </DataTable>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTrabajo ? 'Editar Trabajo' : 'Añadir Trabajo'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Descripción de la Tarea" name="descripcionTarea" value={formData.descripcionTarea} onChange={handleChange} required />
          <Select label="Parcela (Opcional)" name="parcela_id" value={formData.parcela_id || ''} onChange={handleChange} options={parcelaOptions} />
          <Select label="Cultivo (Opcional)" name="cultivo_id" value={formData.cultivo_id || ''} onChange={handleChange} options={cultivoOptions} />
          <Input label="Fecha Programada" name="fechaProgramada" type="date" value={formData.fechaProgramada} onChange={handleChange} required />
          <Input label="Fecha Realización (Opcional)" name="fechaRealizacion" type="date" value={formData.fechaRealizacion || ''} onChange={handleChange} />
          <Input label="Responsable (Opcional)" name="responsable" value={formData.responsable || ''} onChange={handleChange} />
          <Select label="Estado" name="estado" value={formData.estado} onChange={handleChange} options={estadoOptions} required />
          <div className="grid grid-cols-2 gap-4"><Input label="Coste Materiales (€)" name="costeMateriales" type="number" step="0.01" value={formData.costeMateriales || 0} onChange={handleChange} /><Input label="Horas de Trabajo" name="horasTrabajo" type="number" step="0.1" value={formData.horasTrabajo || 0} onChange={handleChange} /></div>
          <TextArea label="Notas (Opcional)" name="notas" value={formData.notas || ''} onChange={handleChange} />
          <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button><Button type="submit" variant="primary">Guardar</Button></div>
        </form>
      </Modal>
    </ManagerLayout>
  );
};