# BlackSmith
Base de datos DnD

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  // Si no hay filas de datos (solo encabezados o vacío)
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  // Leer TODOS los datos incluyendo encabezados
  var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = allData; // La primera fila son los encabezados
  var dataRows = allData.slice(1); // El resto son datos

  var result = [];

  for (var i = 0; i < dataRows.length; i++) {
    var row = dataRows[i];
    var record = {};
    
    for (var j = 0; j < headers.length; j++) {
      // Limpiar el nombre de la columna: minúsculas, sin espacios, sin tildes
      var key = String(headers[j]).toLowerCase().trim();
      var val = row[j];
      
      // Manejo especial para inventario
      if (key === 'inventario' && typeof val === 'string' && val.includes(',')) {
        record[key] = val.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
      } else {
        record[key] = val;
      }
    }
    result.push(record);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
