# BlackSmith
Base de datos DnD

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Asegúrate de que la hoja activa sea la que tiene los datos
  var sheet = ss.getActiveSheet(); 
  
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  // Si no hay datos (solo encabezados), devolver vacío
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = allData; 
  var dataRows = allData.slice(1); 

  var result = [];
  
  // DEBUG: Imprimir en Logs de Apps Script para ver qué se lee
  console.log("Total filas leídas: " + dataRows.length);

  for (var i = 0; i < dataRows.length; i++) {
    var row = dataRows[i];
    
    // Si la fila es null o no es array, saltar
    if (!row || !Array.isArray(row)) continue;

    var record = {};
    for (var j = 0; j < headers.length; j++) {
      // Normalizar clave: lowercase y sin espacios
      var key = String(headers[j]).toLowerCase().trim().replace(/\s+/g, '');
      var val = row[j];
      
      // Si la clave es 'tipo', normalizar el valor también
      if (key === 'tipo' && val) {
        val = String(val).toLowerCase().trim();
      }
      
      record[key] = val;
    }
    result.push(record);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
