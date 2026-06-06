BlackSmith
Base de datos D&D

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet(); 
  
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  // Si no hay datos
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  // LEER COLUMNA POR COLUMNA PARA EVITAR PROBLEMAS DE FUSIÓN
  // En lugar de getRange(...).getValues() que puede fallar con celdas fusionadas,
  // usaremos un bucle explícito.
  
  var result = [];
  var headers = [];
  
  // 1. Leer encabezados (Fila 1)
  for (var c = 1; c <= lastCol; c++) {
    var val = sheet.getRange(1, c).getValue();
    if (val !== "") {
      headers.push(String(val).toLowerCase().trim().replace(/\s+/g, ''));
    }
  }
  
  // 2. Leer fila por fila
  for (var r = 2; r <= lastRow; r++) {
    var record = {};
    var rowValid = false;
    
    for (var c = 1; c <= lastCol; c++) {
      var val = sheet.getRange(r, c).getValue();
      
      // Si la celda tiene contenido, es una fila válida
      if (val !== null && val !== "") {
        rowValid = true;
      }
      
      // Mapear valor al encabezado correspondiente
      if (c <= headers.length) {
        var key = headers[c - 1];
        var valToStore = val;
        
        // Normalizar 'tipo'
        if (key === 'tipo' && valToStore) {
          valToStore = String(valToStore).toLowerCase().trim();
        }
        
        // Manejo de listas (si ya es array, déjalo; si es string con comas, divídelo)
        if ((key === 'inventario' || key === 'hechizos') && typeof valToStore === 'string' && valToStore.includes(',')) {
          valToStore = valToStore.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
        }
        
        record[key] = valToStore;
      }
    }
    
    // Solo agregar si la fila tiene al menos un dato
    if (rowValid) {
      result.push(record);
    }
  }

  console.log("Filas procesadas: " + result.length);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
