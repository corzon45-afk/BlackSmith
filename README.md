# BlackSmith
Base de datos DnD

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  // Si no hay datos
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  var result = [];
  
  // Leer encabezados primero
  var headers = [];
  for (var j = 1; j <= lastCol; j++) {
    headers.push(sheet.getRange(1, j).getValue());
  }
  
  // Leer filas de datos
  for (var i = 2; i <= lastRow; i++) {
    var record = {};
    for (var j = 1; j <= lastCol; j++) {
      var key = String(headers[j-1]).toLowerCase().trim();
      var val = sheet.getRange(i, j).getValue();
      
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
