# BlackSmith
Base de datos DnD

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet(); // Lee la hoja activa (donde están los personajes)
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = allData; 
  var dataRows = allData.slice(1); 

  var result = [];

  for (var i = 0; i < dataRows.length; i++) {
    var row = dataRows[i];
    if (!Array.isArray(row)) continue;

    var record = {};
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j]).toLowerCase().trim();
      var val = row[j];
      
      // Manejo de listas (inventarios, hechizos)
      if ((key === 'inventario' || key === 'hechizos') && typeof val === 'string' && val.includes(',')) {
        record[key] = val.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
      } else {
        record[key] = val;
      }
    }
    result.push(record);
  }

  // Opcional: Si quieres leer también la hoja de objetos, descomenta esto:
  // var objSheet = ss.getSheetByName("objetos");
  // if (objSheet) {
  //   var objData = objSheet.getDataRange().getValues();
  //   var objHeaders = objData;
  //   var objRows = objData.slice(1);
  //   // ... lógica similar para objetos ...
  // }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
