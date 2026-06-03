# BlackSmith
Base de datos DnD
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Saltamos la fila 1 (encabezados) y leemos desde la 2
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
  
  var result = [];
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j]).toLowerCase().trim(); // Convierte a minúsculas y quita espacios
      var val = row[j];
      
      // Si es la columna inventario y es texto, lo dividimos en array
      if (key === 'inventario' && typeof val === 'string' && val.includes(',')) {
        record[key] = val.split(',').map(function(s) { return s.trim(); });
      } else {
        record[key] = val;
      }
    }
    result.push(record);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
