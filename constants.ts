

import React from 'react';
import { AppSection } from './types.ts';

export const APP_NAME = "Cuaderno de Campo Agrícola";

// FIX: Changed icon type from a function returning JSX.Element to React.ComponentType
// to avoid JSX syntax issues in a standard .ts file.
export const NAVIGATION_ITEMS: { name: string; section: AppSection; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  // Icons will be defined later or use placeholders
];

export const CATEGORIAS_GASTO: string[] = [
  "Semillas y Plantones",
  "Fertilizantes y Abonos",
  "Fitosanitarios",
  "Combustible y Energía",
  "Maquinaria (Alquiler/Reparación)",
  "Mano de Obra",
  "Riego",
  "Administrativos",
  "Impuestos y Tasas",
  "Otros Gastos"
];

export const CATEGORIAS_INGRESO: string[] = [
  "Venta de Cosecha",
  "Subvenciones",
  "Alquiler de Maquinaria",
  "Servicios Agrícolas",
  "Otros Ingresos"
];

export const INITIAL_DATA_KEY_PREFIX = 'agriculturalNotebook_';
export const DATOS_FISCALES_KEY = 'datosFiscales';