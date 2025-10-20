
export interface Parcela {
  id: string;
  nombre: string;
  ubicacion: string;
  superficie: number; // en hectáreas
  referenciaCatastral?: string;
  coordenadas?: string; // Formato "latitud,longitud"
  notas?: string;
}

export interface Cultivo {
  id: string;
  parcelaId: string;
  nombreCultivo: string;
  variedad?: string;
  superficieCultivada: number; // en hectáreas
  notas?: string;
}

export enum TipoRegistroFinanciero {
  INGRESO = 'ingreso',
  GASTO = 'gasto',
}

export interface RegistroFinanciero {
  id: string;
  tipo: TipoRegistroFinanciero;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  cantidad: number;
  categoria?: string;
  notas?: string;
}

export enum TipoFactura {
  EMITIDA = 'emitida', // Sales invoice
  RECIBIDA = 'recibida', // Purchase invoice
}

export interface Factura {
  id: string;
  numeroFactura: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoFactura;
  clienteProveedor: string; // Nombre de la entidad externa
  clienteProveedorNif?: string; // NIF/CIF de la entidad externa (opcional)
  clienteProveedorDireccion?: string; // Dirección de la entidad externa (opcional)
  descripcion: string;
  baseImponible: number;
  ivaPorcentaje: number;
  totalFactura: number;
  pagada: boolean;
  notas?: string;
}

export enum EstadoTrabajo {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
}

export interface Trabajo {
  id: string;
  parcelaId?: string; // Optional: task might not be specific to one plot
  cultivoId?: string; // Optional: task might be general or plot-specific
  fechaProgramada: string; // YYYY-MM-DD
  fechaRealizacion?: string; // YYYY-MM-DD
  descripcionTarea: string;
  responsable?: string;
  estado: EstadoTrabajo;
  costeMateriales?: number;
  horasTrabajo?: number;
  notas?: string;
}

export interface DatosFiscales {
  nombreORazonSocial: string;
  nifCif: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  pais: string;
  email?: string;
  telefono?: string;
}

export enum AppSection {
  DASHBOARD = 'DASHBOARD',
  PARCELAS = 'PARCELAS',
  CULTIVOS = 'CULTIVOS',
  FINANZAS = 'FINANZAS',
  FACTURAS = 'FACTURAS',
  TRABAJOS = 'TRABAJOS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  AJUSTES = 'AJUSTES',
}

export type Identifiable = { id: string };