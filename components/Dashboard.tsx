import React, { useState, useRef, useEffect } from 'react';
import { Parcela, Cultivo, RegistroFinanciero, Factura, Trabajo, TipoRegistroFinanciero, EstadoTrabajo, AppSection } from '../types.ts';
import { EllipsisVerticalIcon, ArrowDownTrayIcon } from './icons/IconComponents.tsx';

interface DashboardProps {
  parcelas: Parcela[];
  cultivos: Cultivo[];
  registros: RegistroFinanciero[];
  facturas: Factura[];
  trabajos: Trabajo[];
  onNavigate: (section: AppSection) => void;
  onExportData: () => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`w-full bg-white p-6 rounded-lg shadow-lg border-l-4 ${color} text-left transition-all duration-200 ease-in-out ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500' : 'cursor-default'}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-semibold text-gray-800">{value}</p>
      </div>
      <div className="text-gray-400">{icon}</div>
    </div>
  </button>
);

export const Dashboard: React.FC<DashboardProps> = ({ parcelas, cultivos, registros, facturas, trabajos, onNavigate, onExportData }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalSuperficieParcelas = parcelas.reduce((sum, p) => sum + p.superficie, 0);
  // FIX: Corrected property name from superficie_cultivada to superficieCultivada.
  const totalSuperficieCultivada = cultivos.reduce((sum, c) => sum + c.superficieCultivada, 0);
  
  const totalIngresos = registros.filter(r => r.tipo === TipoRegistroFinanciero.INGRESO).reduce((sum, r) => sum + r.cantidad, 0);
  const totalGastos = registros.filter(r => r.tipo === TipoRegistroFinanciero.GASTO).reduce((sum, r) => sum + r.cantidad, 0);
  const balance = totalIngresos - totalGastos;

  const trabajosPendientes = trabajos.filter(t => t.estado === EstadoTrabajo.PENDIENTE).length;
  const facturasPendientesPago = facturas.filter(f => !f.pagada).length;
  
  const formatHectares = (num: number) => parseFloat(num.toFixed(3));
  
  const handleExportClick = () => {
    onExportData();
    setIsMenuOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="p-4 md:p-6 space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800">Dashboard Agrícola</h1>
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Opciones del dashboard" aria-haspopup="true" aria-expanded={isMenuOpen}>
                <EllipsisVerticalIcon className="h-6 w-6 text-gray-700" />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                    <button onClick={handleExportClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-3" />
                        Exportar todos los datos (.json)
                    </button>
                </div>
            )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Parcelas Totales" value={parcelas.length} icon={<span className="text-3xl">🏞️</span>} color="border-blue-500" onClick={() => onNavigate(AppSection.PARCELAS)} />
        <StatCard title="Superficie Total (ha)" value={formatHectares(totalSuperficieParcelas)} icon={<span className="text-3xl">🗺️</span>} color="border-indigo-500" onClick={() => onNavigate(AppSection.PARCELAS)}/>
        <StatCard title="Cultivos Activos" value={cultivos.length} icon={<span className="text-3xl">🌿</span>} color="border-green-500" onClick={() => onNavigate(AppSection.CULTIVOS)} />
        <StatCard title="Sup. Cultivada (ha)" value={formatHectares(totalSuperficieCultivada)} icon={<span className="text-3xl">🌾</span>} color="border-lime-500" onClick={() => onNavigate(AppSection.CULTIVOS)} />
        <StatCard title="Ingresos Totales (€)" value={totalIngresos.toFixed(2)} icon={<span className="text-3xl">💰</span>} color="border-emerald-500" onClick={() => onNavigate(AppSection.FINANZAS)} />
        <StatCard title="Gastos Totales (€)" value={totalGastos.toFixed(2)} icon={<span className="text-3xl">💸</span>} color="border-red-500" onClick={() => onNavigate(AppSection.FINANZAS)} />
        <StatCard title="Balance (€)" value={balance.toFixed(2)} icon={<span className="text-3xl">📊</span>} color={balance >= 0 ? "border-teal-500" : "border-rose-500"} onClick={() => onNavigate(AppSection.FINANZAS)} />
        <StatCard title="Trabajos Pendientes" value={trabajosPendientes} icon={<span className="text-3xl">🛠️</span>} color="border-amber-500" onClick={() => onNavigate(AppSection.TRABAJOS)} />
        <StatCard title="Facturas Pendientes" value={facturasPendientesPago} icon={<span className="text-3xl">🧾</span>} color="border-orange-500" onClick={() => onNavigate(AppSection.FACTURAS)} />
      </div>
    </div>
  );
};