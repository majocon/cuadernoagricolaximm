import React from 'react';
import { AppSection } from '../types.ts';
import { APP_NAME } from '../constants.ts';
import { DashboardIcon, LandPlotIcon, CropIcon, FinanceIcon, InvoiceIcon, TaskIcon, SettingsIcon, SparklesIcon, DatabaseIcon } from './icons/IconComponents.tsx';

interface SidebarProps {
  currentSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  isOpen: boolean;
  onClose: () => void;
  isDbConnected: boolean;
}

const sidebarNavigationItems = [
  { name: 'Dashboard', section: AppSection.DASHBOARD, icon: DashboardIcon },
  { name: 'Parcelas', section: AppSection.PARCELAS, icon: LandPlotIcon },
  { name: 'Cultivos', section: AppSection.CULTIVOS, icon: CropIcon },
  { name: 'Finanzas', section: AppSection.FINANZAS, icon: FinanceIcon },
  { name: 'Facturas', section: AppSection.FACTURAS, icon: InvoiceIcon },
  { name: 'Trabajos', section: AppSection.TRABAJOS, icon: TaskIcon },
  { name: 'Asistente IA', section: AppSection.AI_ASSISTANT, icon: SparklesIcon },
  { name: 'Ajustes', section: AppSection.AJUSTES, icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelectSection, isOpen, onClose, isDbConnected }) => {
  return (
    <>
      {/* Overlay for mobile view */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} aria-hidden="true"></div>
      
      <div className={`fixed top-0 left-0 w-64 bg-green-800 text-white h-screen p-4 flex flex-col shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="text-2xl font-bold mb-8 text-center border-b border-green-700 pb-4">{APP_NAME}</div>
        <nav className="flex-grow">
          <ul>
            {sidebarNavigationItems.map((item) => (
              <li key={item.section} className="mb-2">
                <button
                  onClick={() => { onSelectSection(item.section); onClose(); }}
                  className={`w-full flex items-center p-3 rounded-md transition-colors duration-150 ${currentSection === item.section ? 'bg-green-700 text-white shadow-md' : 'hover:bg-green-700 hover:text-white'}`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-4 border-t border-green-700">
           <div className="flex items-center p-2 rounded-md" title={`Estado de la base de datos: ${isDbConnected ? 'Conectado' : 'Sin Conexión'}`}>
                <DatabaseIcon className={`h-5 w-5 mr-3 ${isDbConnected ? 'text-green-300' : 'text-red-400'}`} />
                <span className={`text-sm font-medium ${isDbConnected ? 'text-green-200' : 'text-red-300'}`}>
                  {isDbConnected ? 'Conectado' : 'Sin Conexión'}
                </span>
            </div>
            <div className="text-center mt-2">
                <a href="https://cuadernoagricolaximm.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-xs text-green-300 hover:text-white underline">
                    Página del Proyecto
                </a>
            </div>
          <div className="text-xs text-green-300 text-center mt-2">
            © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
};