

import { Factura, TipoFactura } from '../types.ts';

type RowData = (string | number)[];

export const printDataTable = <T,>(
  title: string,
  headers: string[],
  items: T[],
  rowMapper: (item: T) => RowData,
  options?: {
    summaryContent?: string;
  }
): void => {
  // Defer this to allow UI to update (e.g., "Imprimiendo...")
  setTimeout(() => {
    const tableRows = items.map(item => {
      const rowData = rowMapper(item);
      return `<tr>${rowData.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');

    const tableHeaders = `<tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>`;

    const content = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 20px;
            }
            @page {
              size: A4;
              margin: 1.5cm;
            }
            h1 {
              font-size: 24px;
              font-weight: bold;
              border-bottom: 2px solid #eeeeee;
              padding-bottom: 8px;
              margin-bottom: 16px;
            }
            p {
              margin-bottom: 24px;
              color: #555555;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            th, td {
              border: 1px solid #cccccc;
              padding: 6px;
              text-align: left;
              word-break: break-word;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
          ${options?.summaryContent || ''}
          <table>
            <thead>
              ${tableHeaders}
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      // Use a small timeout to ensure the content is loaded before printing
      setTimeout(() => {
          printWindow.print();
          printWindow.close();
      }, 250);
    } else {
      alert('Por favor, permita las ventanas emergentes para imprimir el informe.');
    }
  }, 0);
};