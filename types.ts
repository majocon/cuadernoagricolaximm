

export interface Parcela {
  id: string;
  nombre: string;
  ubicacion: string;
  superficie: number; // en hectáreas
  referencia_catastral?: string;
  coordenadas?: string; // Formato "latitud,longitud"
  notas?: string;
}

export interface Cultivo {
  id: string;
  parcela_id: string;
  nombre_cultivo: string;
  variedad?: string;
  superficie_cultivada: number; // en hectáreas
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
  numero_factura: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoFactura;
  cliente_proveedor: string; // Nombre de la entidad externa
  cliente_proveedor_nif?: string; // NIF/CIF de la entidad externa (opcional)
  cliente_proveedor_direccion?: string; // Dirección de la entidad externa (opcional)
  descripcion: string;
  base_imponible: number;
  iva_porcentaje: number;
  total_factura: number;
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
  parcela_id?: string; // Optional: task might not be specific to one plot
  cultivo_id?: string; // Optional: task might be general or plot-specific
  fecha_programada: string; // YYYY-MM-DD
  fecha_realizacion?: string; // YYYY-MM-DD
  descripcion_tarea: string;
  responsable?: string;
  estado: EstadoTrabajo;
  coste_materiales?: number;
  horas_trabajo?: number;
  notas?: string;
}

export interface DatosFiscales {
  id?: string;
  nombreORazonSocial: string;
  nifCif: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  pais: string;
  email?: string | null;
  telefono?: string | null;
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