# BlackSmith
Base de datos DnD
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data;
  var result = [];

  // Empezamos desde la fila 2 (índice 1) para saltar los encabezados
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      // Convertir inventario de string a array si tiene comas
      if (headers[j] === 'inventario' && row[j]) {
        record[headers[j]] = row[j].split(',');
      } else {
        record[headers[j]] = row[j];
      }
    }
    result.push(record);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
