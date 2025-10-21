import React, { useState, useCallback, useEffect } from 'react';
import { Factura, TipoFactura, DatosFiscales } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { Input, TextArea, Select } from '../ui/Input.tsx';
import { Modal } from '../ui/Modal.tsx';
import { DataTable, ManagerLayout } from './common/ManagerComponents.tsx';
import { EyeIcon, PrinterIcon, EditIcon, TrashIcon } from '../icons/IconComponents.tsx';
import { printDataTable } from '../../services/printService.ts';

interface FacturasManagerProps {
  facturas: Factura[];
  datosFiscales: DatosFiscales | null;
  onAddFactura: (factura: Omit<Factura, 'id'>) => void;
  onUpdateFactura: (factura: Factura) => void;
  onDeleteFactura: (id: string) => void;
  onGoToDashboard: () => void;
}

const initialFacturaFormState: Omit<Factura, 'id' | 'total_factura'> = {
  numero_factura: '', fecha: new Date().toISOString().split('T')[0], tipo: TipoFactura.EMITIDA,
  cliente_proveedor: '', cliente_proveedor_nif: '', cliente_proveedor_direccion: '',
  descripcion: '', base_imponible: 0, iva_porcentaje: 21, pagada: false, notas: '',
};

const createAndPrintInvoice = (factura: Factura, datosFiscales: DatosFiscales | null) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Por favor, permita las ventanas emergentes."); return; }
  const styles = `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 20px; font-size: 10pt; } .page { width: 21cm; min-height: 29.7cm; padding: 2cm; } .header, .parties, table, .totals { margin-bottom: 2rem; } .header h1 { font-size: 2rem; } table { width: 100%; border-collapse: collapse; } th, td { padding: 0.8rem; text-align: left; border-bottom: 1px solid #eee; } thead { background-color: #f9fafb; } .align-right { text-align: right; } .totals-table { width: 40%; margin-left: auto; } .grand-total { font-weight: bold; font-size: 1.2rem; border-top: 2px solid #333; }`;
  const emisorHtml = datosFiscales ? `<p><strong>${datosFiscales.nombreORazonSocial}</strong></p><p>${datosFiscales.nifCif}</p><p>${datosFiscales.direccion}</p>` : '<p>Datos del emisor no configurados.</p>';
  const receptorHtml = `<p><strong>${factura.cliente_proveedor}</strong></p><p>${factura.cliente_proveedor_nif || ''}</p><p>${factura.cliente_proveedor_direccion || ''}</p>`;
  const invoiceHtml = `<html><head><title>Factura ${factura.numero_factura}</title><style>${styles}</style></head><body><div class="page"><div class="header"><h1>FACTURA</h1><div><p>Nº: <strong>${factura.numero_factura}</strong></p><p>Fecha: <strong>${new Date(factura.fecha).toLocaleDateString('es-ES')}</strong></p></div></div><div class="parties"><div><h3>Emisor</h3>${emisorHtml}</div><div><h3>Cliente</h3>${receptorHtml}</div></div><table><thead><tr><th>Descripción</th><th class="align-right">Base</th><th class="align-right">IVA</th><th class="align-right">Total</th></tr></thead><tbody><tr><td>${factura.descripcion}</td><td class="align-right">${factura.base_imponible.toFixed(2)} €</td><td class="align-right">${factura.iva_porcentaje}%</td><td class="align-right">${factura.total_factura.toFixed(2)} €</td></tr></tbody></table><div class="totals"><table class="totals-table"><tbody><tr><td>Base Imponible:</td><td class="align-right">${factura.base_imponible.toFixed(2)} €</td></tr><tr><td>Cuota IVA (${factura.iva_porcentaje}%):</td><td class="align-right">${(factura.total_factura - factura.base_imponible).toFixed(2)} €</td></tr><tr class="grand-total"><td>TOTAL:</td><td class="align-right">${factura.total_factura.toFixed(2)} €</td></tr></tbody></table></div><p><strong>${factura.pagada ? 'PAGADA' : 'PENDIENTE'}</strong></p></div></body></html>`;
  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
};

const FacturaVisualizacionContent: React.FC<{ factura: Factura; datosFiscales: DatosFiscales | null; }> = ({ factura, datosFiscales }) => (
    <div className="p-4 sm:p-8 bg-white font-sans text-sm text-gray-700">
      <header className="flex justify-between items-start mb-8 pb-6 border-b"><h1 className="text-3xl font-bold text-gray-800">FACTURA</h1><div className="text-right"><p>Nº: <strong>{factura.numero_factura}</strong></p><p>Fecha: <strong>{new Date(factura.fecha).toLocaleDateString('es-ES')}</strong></p></div></header>
      <section className="flex justify-between mb-8 pb-6 border-b"><div><h3>Emisor:</h3><p><strong>{datosFiscales?.nombreORazonSocial}</strong></p></div><div className="text-right"><h3>Cliente:</h3><p><strong>{factura.cliente_proveedor}</strong></p></div></section>
      <table className="w-full text-left mb-8"><thead><tr className="border-b"><th className="p-2">Descripción</th><th className="p-2 text-right">Total</th></tr></thead><tbody><tr><td className="p-2 align-top">{factura.descripcion}</td><td className="p-2 text-right align-top">{factura.total_factura.toFixed(2)} €</td></tr></tbody></table>
      <footer className="pt-8 border-t"><div className="flex justify-end"><div className="w-1/3"><div className="flex justify-between"><span>Base:</span> <strong>{factura.base_imponible.toFixed(2)} €</strong></div><div className="flex justify-between"><span>IVA ({factura.iva_porcentaje}%):</span> <strong>{(factura.total_factura - factura.base_imponible).toFixed(2)} €</strong></div><hr className="my-2"/><div className="flex justify-between text-xl font-bold"><span>TOTAL:</span> <span>{factura.total_factura.toFixed(2)} €</span></div></div></div></footer>
    </div>
);

export const FacturasManager: React.FC<FacturasManagerProps> = ({ facturas, datosFiscales, onAddFactura, onUpdateFactura, onDeleteFactura, onGoToDashboard }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [viewingFactura, setViewingFactura] = useState<Factura | null>(null);
  const [formData, setFormData] = useState<Omit<Factura, 'id' | 'total_factura'>>(initialFacturaFormState);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isPrintingList, setIsPrintingList] = useState(false);

  useEffect(() => {
    const base = Number(formData.base_imponible) || 0;
    const iva = Number(formData.iva_porcentaje) || 0;
    setCalculatedTotal(base + (base * iva / 100));
  }, [formData.base_imponible, formData.iva_porcentaje]);

  const handleOpenModal = useCallback((factura?: Factura) => {
    setEditingFactura(factura || null);
    if (factura) { const { total_factura, ...rest } = factura; setFormData(rest); } 
    else { setFormData(initialFacturaFormState); }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
  const handleOpenViewModal = useCallback((factura: Factura) => { setViewingFactura(factura); setIsViewModalOpen(true); }, []);
  const handleCloseViewModal = useCallback(() => setIsViewModalOpen(false), []);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const isCheckbox = e.target.type === 'checkbox' ? e.target.checked : undefined;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : (isCheckbox !== undefined ? isCheckbox : value) }));
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData, total_factura: calculatedTotal };
    if (editingFactura) {
      onUpdateFactura({ ...editingFactura, ...finalData });
    } else {
      onAddFactura(finalData);
    }
    handleCloseModal();
  }, [formData, calculatedTotal, editingFactura, onAddFactura, onUpdateFactura, handleCloseModal]);

  const handleDelete = useCallback((id: string) => { onDeleteFactura(id); }, [onDeleteFactura]);
  
  const handlePrintList = useCallback(() => {
    setIsPrintingList(true);
    try {
        const sorted = [...facturas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        printDataTable('Informe de Facturas', ["Nº", "Fecha", "Tipo", "Cliente", "Total (€)", "Pagada"], sorted, (f: Factura) => [f.numero_factura, new Date(f.fecha).toLocaleDateString('es-ES'), f.tipo === 'emitida' ? 'Emitida' : 'Recibida', f.cliente_proveedor, f.total_factura.toFixed(2), f.pagada ? 'Sí' : 'No']);
    } catch (error) { console.error("Error printing:", error); } 
    finally { setTimeout(() => setIsPrintingList(false), 1000); }
  }, [facturas]);
  
  const tableHeaders = ["Nº Factura", "Fecha", "Tipo", "Cliente", "Total (€)", "Pagada"];

  return (
    <ManagerLayout title="Gestión de Facturas" onAddItem={() => handleOpenModal()} addItemLabel="Crear Factura" onGoToDashboard={onGoToDashboard}
      headerActions={facturas.length > 0 ? (<Button onClick={handlePrintList} variant="secondary" leftIcon={<PrinterIcon className="h-5 w-5" />} disabled={isPrintingList}>{isPrintingList ? 'Imprimiendo...' : 'Imprimir Lista'}</Button>) : null}>
      {!datosFiscales?.nombreORazonSocial && (<div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700"><p>Por favor, complete sus datos fiscales en <b>Ajustes</b> para generar facturas.</p></div>)}
      {facturas.length === 0 ? (<p className="text-gray-600 text-center py-4">No hay facturas.</p>) : (
      <DataTable headers={tableHeaders}>
        {facturas.map((factura) => (
          <tr key={factura.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{factura.numero_factura}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(factura.fecha).toLocaleDateString('es-ES')}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{factura.tipo}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{factura.cliente_proveedor}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">{factura.total_factura.toFixed(2)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${factura.pagada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{factura.pagada ? 'Sí' : 'No'}</span></td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
              <Button onClick={() => handleOpenViewModal(factura)} variant="ghost" size="sm" title="Ver"><EyeIcon className="h-4 w-4" /></Button>
              <Button onClick={() => handleOpenModal(factura)} variant="ghost" size="sm" title="Editar"><EditIcon className="h-4 w-4" /></Button>
              <Button onClick={() => handleDelete(factura.id)} variant="ghost" size="sm" title="Eliminar"><TrashIcon className="h-4 w-4" /></Button>
            </td>
          </tr>
        ))}
      </DataTable>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingFactura ? 'Editar Factura' : 'Crear Factura'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Número de Factura" name="numero_factura" value={formData.numero_factura} onChange={handleChange} required />
            <Input label="Fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
          </div>
          <Select label="Tipo de Factura" name="tipo" value={formData.tipo} onChange={handleChange} options={[{ value: TipoFactura.EMITIDA, label: 'Emitida' }, { value: TipoFactura.RECIBIDA, label: 'Recibida' }]} required />
          <Input label="Nombre del Cliente/Proveedor" name="cliente_proveedor" value={formData.cliente_proveedor} onChange={handleChange} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="NIF/CIF Cliente/Proveedor" name="cliente_proveedor_nif" value={formData.cliente_proveedor_nif || ''} onChange={handleChange} />
            <Input label="Dirección Cliente/Proveedor" name="cliente_proveedor_direccion" value={formData.cliente_proveedor_direccion || ''} onChange={handleChange} />
          </div>
          <TextArea label="Descripción" name="descripcion" value={formData.descripcion} onChange={handleChange} required rows={3}/>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input label="Base Imponible (€)" name="base_imponible" type="number" step="0.01" value={formData.base_imponible} onChange={handleChange} required />
            <Input label="IVA (%)" name="iva_porcentaje" type="number" step="0.01" value={formData.iva_porcentaje} onChange={handleChange} required />
            <div className="pt-5 text-right font-semibold">Total: {calculatedTotal.toFixed(2)} €</div>
          </div>
          <div className="flex items-center pt-2"><input id="pagada" name="pagada" type="checkbox" checked={formData.pagada} onChange={handleChange} className="h-4 w-4 text-green-600" /><label htmlFor="pagada" className="ml-2">Marcar como Pagada</label></div>
          <TextArea label="Notas" name="notas" value={formData.notas || ''} onChange={handleChange} />
          <div className="flex justify-end space-x-2 pt-4 border-t mt-4"><Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button><Button type="submit" variant="primary">Guardar</Button></div>
        </form>
      </Modal>

      {viewingFactura && (
        <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title={`Factura Nº: ${viewingFactura.numero_factura}`} size="xl">
            <FacturaVisualizacionContent factura={viewingFactura} datosFiscales={datosFiscales} />
            <div className="flex justify-end space-x-3 pt-6 pb-2 pr-2"><Button variant="secondary" onClick={handleCloseViewModal}>Cerrar</Button><Button variant="primary" onClick={() => createAndPrintInvoice(viewingFactura, datosFiscales)} leftIcon={<PrinterIcon className="h-5 w-5" />}>Imprimir</Button></div>
        </Modal>
      )}
    </ManagerLayout>
  );
};