# BlackSmith
Base de datos DnD

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  // Leer datos: Fila 1 (encabezados) y Fila 2 en adelante (datos)
  var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = allData; 
  var dataRows = allData.slice(1); 

  var result = [];

  for (var i = 0; i < dataRows.length; i++) {
    var row = dataRows[i];
    var record = {};
    
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j]).toLowerCase().trim();
      var val = row[j];
      
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
