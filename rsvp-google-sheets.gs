/**
 * Confirmaciones (RSVP) de la boda de Annie & Rafa → Google Sheets
 *
 * Cómo instalarlo:
 * 1. Crea una hoja de cálculo nueva en Google Sheets (por ejemplo "Confirmaciones boda").
 * 2. Menú Extensiones → Apps Script. Borra lo que aparezca y pega este archivo completo. Guarda.
 * 3. Botón "Implementar" → "Nueva implementación" → tipo "Aplicación web".
 *      Ejecutar como: Yo
 *      Quién tiene acceso: Cualquier persona
 *    Autoriza los permisos que pida Google.
 * 4. Copia la "URL de la aplicación web" (termina en /exec) y pásasela a quien mantiene la página.
 *
 * Si después cambias este código, usa "Administrar implementaciones" → editar → "Nueva versión"
 * para que la misma URL siga funcionando.
 */

// ID de la hoja (de su link: docs.google.com/spreadsheets/d/<ID>/edit)
const HOJA_ID = '17Hck8pnse2081ZIAVFAvMJyNpnCwQpSnbs-FNEPFMSs';

const ENCABEZADOS = ['Fecha', 'Nombre', 'Asistencia', 'Personas', 'Contacto', 'Mensaje'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hoja = SpreadsheetApp.openById(HOJA_ID).getSheets()[0];
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(ENCABEZADOS);
      hoja.setFrozenRows(1);
      hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold');
    }
    const p = (e && e.parameter) || {};
    const limpia = (v) => String(v || '').trim().replace(/^[=+\-@]/, "'$&").slice(0, 1000);
    hoja.appendRow([
      new Date(),
      limpia(p.nombre),
      p.asistencia === 'si' ? 'Sí asiste' : p.asistencia === 'no' ? 'No asiste' : limpia(p.asistencia),
      p.asistencia === 'no' ? 0 : Number(p.personas) || 1,
      limpia(p.contacto),
      limpia(p.mensaje),
    ]);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('RSVP activo');
}
