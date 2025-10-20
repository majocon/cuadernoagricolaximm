import React, { useState, useCallback } from 'react';
import { RegistroFinanciero, TipoRegistroFinanciero } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { Input, TextArea, Select } from '../ui/Input.tsx';
import { Modal } from '../ui/Modal.tsx';
import { DataTable, ManagerLayout, ItemActionButtons } from './common/ManagerComponents.tsx';
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from '../../constants.ts';
import { PrinterIcon } from '../icons/IconComponents.tsx';
import { printDataTable } from '../../services/printService.ts';

interface FinanzasManagerProps {
  registros: RegistroFinanciero[];
  onAddRegistro: (registro: Omit<RegistroFinanciero, 'id'>) => void;
  onUpdateRegistro: (registro: RegistroFinanciero) => void;
  onDeleteRegistro: (id: string) => void;
  onGoToDashboard: () => void;
}

const initialRegistroFormState: Omit<RegistroFinanciero, 'id'> = {
  tipo: TipoRegistroFinanciero.GASTO, fecha: new Date().toISOString().split('T')[0],
  concepto: '', cantidad: 0, categoria: '', notas: '',
};

export const FinanzasManager: React.FC<FinanzasManagerProps> = ({ registros, onAddRegistro, onUpdateRegistro, onDeleteRegistro, onGoToDashboard }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroFinanciero | null>(null);
  const [formData, setFormData] = useState<Omit<RegistroFinanciero, 'id'>>(initialRegistroFormState);
  const [isPrinting, setIsPrinting] = useState(false);

  const categoriaOptions = (formData.tipo === TipoRegistroFinanciero.INGRESO ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO).map(c => ({ value: c, label: c }));

    const handlePrint = useCallback(() => {
        setIsPrinting(true);
        try {
            const sortedRegistros = [...registros].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
            const totalIngresos = registros.filter(r => r.tipo === TipoRegistroFinanciero.INGRESO).reduce((sum, r) => sum + r.cantidad, 0);
            const totalGastos = registros.filter(r => r.tipo === TipoRegistroFinanciero.GASTO).reduce((sum, r) => sum + r.cantidad, 0);
            const balance = totalIngresos - totalGastos;
            const summaryContent = `<div style="display: flex; justify-content: space-around; margin-bottom: 2rem; padding: 1rem; background-color: #f9fafb; border-radius: 8px;"><div style="text-align: center;"><h3 style="color: #16a34a;">Ingresos Totales</h3><p style="font-size: 1.25rem;">${totalIngresos.toFixed(2)} €</p></div><div style="text-align: center;"><h3 style="color: #dc2626;">Gastos Totales</h3><p style="font-size: 1.25rem;">${totalGastos.toFixed(2)} €</p></div><div style="text-align: center;"><h3>Balance</h3><p style="font-size: 1.25rem; color: ${balance >= 0 ? 'green' : 'red'};">${balance.toFixed(2)} €</p></div></div>`;
            printDataTable('Informe Financiero', ["Fecha", "Tipo", "Concepto", "Categoría", "Cantidad (€)"], sortedRegistros, (r: RegistroFinanciero) => [new Date(r.fecha).toLocaleDateString('es-ES'), r.tipo === 'ingreso' ? 'Ingreso' : 'Gasto', r.concepto, r.categoria || '-', r.cantidad.toFixed(2)], { summaryContent });
        } catch (error) { console.error("Error printing:", error); } 
        finally { setTimeout(() => setIsPrinting(false), 1000); }
      }, [registros]);

  const handleOpenModal = useCallback((registro?: RegistroFinanciero) => {
    setEditingRegistro(registro || null);
    setFormData(registro ? registro : initialRegistroFormState);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => { setIsModalOpen(false); }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
        const newState = {...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value };
        if (name === 'tipo') newState.categoria = '';
        return newState;
    });
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingRegistro) {
      onUpdateRegistro({ ...editingRegistro, ...formData });
    } else {
      onAddRegistro(formData);
    }
    handleCloseModal();
  }, [formData, editingRegistro, onAddRegistro, onUpdateRegistro, handleCloseModal]);

  const handleDelete = useCallback((id: string) => { onDeleteRegistro(id); }, [onDeleteRegistro]);
  
  const tableHeaders = ["Fecha", "Tipo", "Concepto", "Categoría", "Cantidad (€)"];

  return (
    <ManagerLayout title="Gestión Financiera" onAddItem={() => handleOpenModal()} addItemLabel="Añadir Registro" onGoToDashboard={onGoToDashboard}
        headerActions={registros.length > 0 ? (<Button onClick={handlePrint} variant="secondary" leftIcon={<PrinterIcon className="h-5 w-5" />} disabled={isPrinting}>{isPrinting ? 'Imprimiendo...' : 'Imprimir'}</Button>) : null}>
      {registros.length === 0 ? (<p className="text-gray-600 text-center py-4">No hay registros financieros.</p>) : (
      <DataTable headers={tableHeaders}>
        {registros.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((registro) => (
          <tr key={registro.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(registro.fecha).toLocaleDateString('es-ES')}</td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${registro.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>{registro.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{registro.concepto}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.categoria || '-'}</td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${registro.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>{registro.cantidad.toFixed(2)}</td>
            <ItemActionButtons onEdit={() => handleOpenModal(registro)} onDelete={() => handleDelete(registro.id)} />
          </tr>
        ))}
      </DataTable>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingRegistro ? 'Editar Registro' : 'Añadir Registro'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Tipo de Registro" name="tipo" value={formData.tipo} onChange={handleChange} options={[{ value: 'ingreso', label: 'Ingreso' }, { value: 'gasto', label: 'Gasto' }]} required />
          <Input label="Fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
          <Input label="Concepto" name="concepto" value={formData.concepto} onChange={handleChange} required />
          <Select label="Categoría" name="categoria" value={formData.categoria || ''} onChange={handleChange} options={categoriaOptions} placeholder="Seleccione una categoría" />
          <Input label="Cantidad (€)" name="cantidad" type="number" step="0.01" value={formData.cantidad} onChange={handleChange} required />
          <TextArea label="Notas (Opcional)" name="notas" value={formData.notas || ''} onChange={handleChange} />
          <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button><Button type="submit" variant="primary">Guardar</Button></div>
        </form>
      </Modal>
    </ManagerLayout>
  );
};
