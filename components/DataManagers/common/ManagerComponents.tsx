
import React from 'react';
import { Button } from '../../ui/Button.tsx';
import { PlusIcon, EditIcon, TrashIcon, HomeIcon } from '../../icons/IconComponents.tsx';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export const DataTable: React.FC<TableProps> = ({ headers, children }) => (
  <div className="overflow-x-auto bg-white shadow-md rounded-lg">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          ))}
          <th scope="col" className="relative px-6 py-3">
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {children}
      </tbody>
    </table>
  </div>
);

interface ManagerLayoutProps {
  title: string;
  onAddItem: () => void;
  addItemLabel: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  onGoToDashboard?: () => void;
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ title, onAddItem, addItemLabel, children, headerActions, onGoToDashboard }) => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
            {onGoToDashboard && (
            <button onClick={onGoToDashboard} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Volver al Inicio">
                <HomeIcon className="h-6 w-6 text-gray-700" />
            </button>
            )}
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        </div>
      <div className="flex items-center space-x-2">
        {headerActions}
        <Button onClick={onAddItem} variant="primary" leftIcon={<PlusIcon className="h-5 w-5" />}>
          {addItemLabel}
        </Button>
      </div>
    </div>
    {children}
  </div>
);

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const ItemActionButtons: React.FC<ActionButtonsProps> = ({ onEdit, onDelete }) => (
  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
    <Button onClick={onEdit} variant="ghost" size="sm" title="Editar">
      <EditIcon className="h-4 w-4 text-blue-600 hover:text-blue-800" />
    </Button>
    <Button onClick={onDelete} variant="ghost" size="sm" title="Eliminar">
      <TrashIcon className="h-4 w-4 text-red-600 hover:text-red-800" />
    </Button>
  </td>
);