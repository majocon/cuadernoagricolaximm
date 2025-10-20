import React, { useState, useCallback } from 'react';
import { Parcela } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { Input, TextArea } from '../ui/Input.tsx';
import { Modal } from '../ui/Modal.tsx';
import { DataTable, ManagerLayout } from './common/ManagerComponents.tsx';
import { EditIcon, TrashIcon, MapPinIcon, PrinterIcon } from '../icons/IconComponents.tsx';
import { printDataTable } from '../../services/printService.ts';

interface ParcelasManagerProps {
  parcelas: Parcela[];
  onAddParcela: (parcela: Omit<Parcela, 'id'>) => void;
  onUpdateParcela: (parcela: Parcela) => void;
  onDeleteParcela: (id: string) => void;
  onGoToDashboard: () => void;
}

const initialParcelaFormState: Omit<Parcela, 'id'> = {
  nombre: '',
  ubicacion: '',
  superficie: 0,
  referenciaCatastral: '',
  coordenadas: '',
  notas: '',
};

const MapViewer: React.FC<{ parcela: Parcela }> = ({ parcela }) => {
    const refCat = parcela.referenciaCatastral?.trim().replace(/\s+/g, '').toUpperCase();
    const coords = parcela.coordenadas?.trim();
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

    if (coords && coordRegex.test(coords)) {
        const url = `https://maps.google.com/maps?q=${coords}&t=k&z=18&output=embed`;
        return <iframe title="Google Maps" width="100%" height="600" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} src={url} className="rounded-md border border-gray-200"></iframe>;
    }
    if (refCat) {
        const url = `https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?refcat=${refCat}&escala=5000`;
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">No se puede previsualizar el mapa del Catastro</h3>
                <p className="text-gray-600 mb-6">Por restricciones de seguridad de la web oficial del Catastro, no es posible mostrar su mapa directamente en esta aplicación.</p>
                <Button variant="primary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>Abrir Mapa del Catastro en una Nueva Pestaña</Button>
            </div>
        );
    }
    return <div className="text-center p-8"><p className="text-gray-600">No hay datos de ubicación para mostrar un mapa.</p></div>;
};

export const ParcelasManager: React.FC<ParcelasManagerProps> = ({ parcelas, onAddParcela, onUpdateParcela, onDeleteParcela, onGoToDashboard }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParcela, setEditingParcela] = useState<Parcela | null>(null);
  const [formData, setFormData] = useState<Omit<Parcela, 'id'>>(initialParcelaFormState);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [viewingParcela, setViewingParcela] = useState<Parcela | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const formatHectares = (num: number) => num.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    try {
        const headers = ["Nombre", "Ubicación", "Superficie (ha)", "Ref. Catastral", "Notas"];
        printDataTable('Informe de Parcelas', headers, parcelas, (p: Parcela) => [p.nombre, p.ubicacion, formatHectares(p.superficie), p.referenciaCatastral || '-', p.notas || '']);
    } catch (error) {
        console.error("Error printing:", error);
    } finally {
        setTimeout(() => setIsPrinting(false), 1000);
    }
  }, [parcelas]);

  const handleOpenModal = useCallback((parcela?: Parcela) => {
    setEditingParcela(parcela || null);
    setFormData(parcela ? parcela : initialParcelaFormState);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleOpenMapModal = useCallback((parcela: Parcela) => {
    setViewingParcela(parcela);
    setIsMapModalOpen(true);
  }, []);
  
  const handleCloseMapModal = useCallback(() => {
    setIsMapModalOpen(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingParcela) {
      onUpdateParcela({ ...editingParcela, ...formData });
    } else {
      onAddParcela(formData);
    }
    handleCloseModal();
  }, [formData, editingParcela, onAddParcela, onUpdateParcela, handleCloseModal]);

  const handleDelete = useCallback((id: string) => {
      onDeleteParcela(id);
  }, [onDeleteParcela]);
  
  const tableHeaders = ["Nombre", "Ubicación", "Superficie (ha)", "Ref. Catastral"];

  return (
    <ManagerLayout title="Gestión de Parcelas" onAddItem={() => handleOpenModal()} addItemLabel="Añadir Parcela" onGoToDashboard={onGoToDashboard}
      headerActions={parcelas.length > 0 ? (<Button onClick={handlePrint} variant="secondary" leftIcon={<PrinterIcon className="h-5 w-5" />} disabled={isPrinting}>{isPrinting ? 'Imprimiendo...' : 'Imprimir'}</Button>) : null}>
      {parcelas.length === 0 ? (<p className="text-gray-600 text-center py-4">No hay parcelas registradas.</p>) : (
      <DataTable headers={tableHeaders}>
        {parcelas.map((parcela) => (
          <tr key={parcela.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{parcela.nombre}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parcela.ubicacion}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatHectares(parcela.superficie)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parcela.referenciaCatastral || '-'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                <Button onClick={() => handleOpenMapModal(parcela)} variant="ghost" size="sm" title="Ver en mapa" disabled={!parcela.coordenadas && !parcela.referenciaCatastral}><MapPinIcon className="h-4 w-4 text-green-600 hover:text-green-800" /></Button>
                <Button onClick={() => handleOpenModal(parcela)} variant="ghost" size="sm" title="Editar"><EditIcon className="h-4 w-4 text-blue-600 hover:text-blue-800" /></Button>
                <Button onClick={() => handleDelete(parcela.id)} variant="ghost" size="sm" title="Eliminar"><TrashIcon className="h-4 w-4 text-red-600 hover:text-red-800" /></Button>
            </td>
          </tr>
        ))}
      </DataTable>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingParcela ? 'Editar Parcela' : 'Añadir Parcela'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre de la Parcela" name="nombre" value={formData.nombre} onChange={handleChange} required />
          <Input label="Ubicación (Municipio, polígono, etc.)" name="ubicacion" value={formData.ubicacion} onChange={handleChange} required />
          <Input label="Superficie (hectáreas)" name="superficie" type="number" step="0.001" value={formData.superficie} onChange={handleChange} required min="0"/>
          <Input label="Referencia Catastral (Opcional)" name="referenciaCatastral" value={formData.referenciaCatastral || ''} onChange={handleChange} />
          <Input label="Coordenadas (Lat,Lon) (Opcional)" name="coordenadas" value={formData.coordenadas || ''} onChange={handleChange} />
          <TextArea label="Notas (Opcional)" name="notas" value={formData.notas || ''} onChange={handleChange} />
          <div className="flex justify-end space-x-2 pt-4 border-t mt-4"><Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button><Button type="submit" variant="primary">Guardar</Button></div>
        </form>
      </Modal>
      
      {viewingParcela && (
        <Modal isOpen={isMapModalOpen} onClose={handleCloseMapModal} title={`Mapa: ${viewingParcela.nombre}`} size="2xl">
            <MapViewer parcela={viewingParcela} />
            <div className="flex justify-end pt-4 mt-4 border-t"><Button variant="secondary" onClick={handleCloseMapModal}>Cerrar</Button></div>
        </Modal>
      )}
    </ManagerLayout>
  );
};
