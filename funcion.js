// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxWI9_CeLkxqqpRxfvZWkj9jlzkdJQXYuOMJwnAoSzROwKBC1pJ0nSKfWyqRssqR5qEGg/exec";
const SHEET_ITEMS_URL = "https://script.google.com/macros/s/AKfycbyaq2P-hPtB5ZalVIzKImJUNJEO6VinVSxX3pCKc-4m0AvMpP33oWJ5dANy-7jJzi2tCw/exec"; 

let data = { pc: [], mob: [], items: [] };
let isLoading = true;

const DICE = [4, 6, 8, 10, 12, 20, 100];
const SYM = { 4: '▲', 6: '⬡', 8: '◆', 10: '⬟', 12: '⬠', 20: '⬢', 100: '○' };
let selDie = 20;
let rolling = false;

// ==========================================
// GESTIÓN DE IMÁGENES (LOCALSTORAGE)
// ==========================================
function getStoredImages() {
  try { 
    return JSON.parse(localStorage.getItem('dnd_images') || '{}'); 
  } catch { 
    return {}; 
  }
}

function saveImage(nombre, dataURL) {
  const imgs = getStoredImages();
  imgs[nombre] = dataURL;
  localStorage.setItem('dnd_images', JSON.stringify(imgs));
}

function removeImage(nombre) {
  const imgs = getStoredImages();
  delete imgs[nombre];
  localStorage.setItem('dnd_images', JSON.stringify(imgs));
}

function triggerUpload(nombre) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    // CORRECCIÓN: Acceder al primer archivo 
const file = e.target.files; // Acceder al primer archivo explícitamente
if (!file) return;
    
    const reader = new FileReader();
    reader.onload = ev => {
      saveImage(nombre, ev.target.result);
      render();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function handleRemoveImage(nombre) {
  removeImage(nombre);
  render();
}

// ==========================================
// CARGA DE DATOS (API GOOGLE SHEETS)
// ==========================================
async function loadData() {
  try {
    // Cargamos ambas hojas en paralelo
    const [resMain, resItems] = await Promise.all([
      fetch(SHEET_URL),
      fetch(SHEET_ITEMS_URL)
    ]);

    if (!resMain.ok) throw new Error(`HTTP ${resMain.status} (Datos)`);
    if (!resItems.ok) throw new Error(`HTTP ${resItems.status} (Items)`);
    
    // Procesar Datos Principales (PC/Mob)
    let raw = await resMain.json();
    if (!Array.isArray(raw)) raw = Object.values(raw || {});
    
    const cleanMain = raw.map(row => {
      if (!row || typeof row !== 'object') return null;
      const r = {};
      Object.keys(row).forEach(k => {
        const ck = String(k).toLowerCase().trim().replace(/\s+/g, '');
        r[ck] = row[k];
      });
      return r;
    }).filter(Boolean);

    data.pc = cleanMain.filter(i => String(i.tipo).toLowerCase().trim() === 'pc');
    data.mob = cleanMain.filter(i => String(i.tipo).toLowerCase().trim() === 'mob');

    // Procesar Datos de Items
    let rawItems = await resItems.json();
    if (!Array.isArray(rawItems)) rawItems = Object.values(rawItems || {});

    const cleanItems = rawItems.map(row => {
      if (!row || typeof row !== 'object') return null;
      const r = {};
      Object.keys(row).forEach(k => {
        const ck = String(k).toLowerCase().trim().replace(/\s+/g, '');
        r[ck] = row[k];
      });
      return r;
    }).filter(Boolean);

    // Filtrar solo los que sean 'item' o 'objeto'
    data.items = cleanItems.filter(i => 
      String(i.tipo).toLowerCase().trim() === 'item' || 
      String(i.tipo).toLowerCase().trim() === 'objeto'
    );
    
    isLoading = false;
    render();
  } catch (e) {
    isLoading = false;
    console.error("Error cargando las APIs:", e);
    const grid = document.getElementById('grid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-msg" style="color:#ef5350;">
          Aviso: No se pudieron sincronizar los datos. <br>
          <small>${e.message}</small>
        </div>`;
    }
  }
}

// ==========================================
// UTILS Y LÓGICA DE JUEGO
// ==========================================
function avgDmg(d) {
  if (!d) return 0;
  const m = String(d).match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!m) return parseInt(d) || 0;
  
// CORRECCIÓN: Usar los índices 1, 2 y 3 del array de coincidencia
const count = parseInt(m); 
const sides = parseInt(m); 
const modifier = parseInt(m) || 0; 
  
  // Fórmula: Cantidad * (Caras + 1) / 2 + Modificador
  return Math.round(count * (sides + 1) / 2 + modifier);
}

function hpColor(p) { 
  return p > 0.6 ? '#4caf50' : p > 0.3 ? '#ff9800' : '#ef5350'; 
}

function addLogEntry(targetId, htmlContent) {
  const log = document.getElementById(targetId);
  if (!log) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = htmlContent;
  log.prepend(entry);
  if (log.children.length > 20) log.removeChild(log.lastChild);
}

// ==========================================
// RENDERIZADO DE INTERFAZ UI
// ==========================================
function buildCard(i) {
  const isMob = String(i.tipo).toLowerCase().trim() === 'mob' || i.t === 'Mob';
  const isItem = String(i.tipo).toLowerCase().trim() === 'item' || i.t === 'Item' || String(i.tipo).toLowerCase().trim() === 'objeto';
  
  const pv = parseInt(i.pv) || 0;
  const maxpv = parseInt(i.maxpv) || 1;
  const pct = Math.max(0, Math.min(1, pv / maxpv));
  
  const nombre = i.nombre || 'Sin nombre';
  const imgs = getStoredImages();
  const imgSrc = imgs[nombre];
  const escapedName = nombre.replace(/'/g, "\\'");

  // Lógica de imagen
  let imgHtml = imgSrc 
    ? `<div class="card-img-wrap"><img class="card-img" src="${imgSrc}"><div class="img-overlay"><button class="img-btn change" onclick="triggerUpload('${escapedName}')">🖼 Cambiar</button><button class="img-btn remove" onclick="handleRemoveImage('${escapedName}')">✕</button></div></div>`
    : `<div class="img-placeholder" onclick="triggerUpload('${escapedName}')"><span style="font-size:2rem;">📷</span><span>Click para agregar imagen</span></div>`;

  // Badge de tipo
  let badgeClass = 'pc';
  let badgeText = 'Personaje';
  if (isMob) { badgeClass = 'mob'; badgeText = 'Monstruo'; }
  if (isItem) { badgeClass = 'item'; badgeText = 'Objeto'; }
  
  const badge = `<span class="badge ${badgeClass}">${badgeText}</span>`;

  // --- LÓGICA ESPECÍFICA PARA ITEMS ---
  if (isItem) {
    const naturaleza = i.naturaleza || '—';
    const efecto = i.efecto || '—';
    const descripcion = i.descripcion || 'Sin descripción';
    const precio = i.precio || '—';
    const rareza = i.rareza || 'Común';

    let rarityColor = '#ffffff';
    if (rareza.toLowerCase().includes('rara')) rarityColor = '#00b0ff';
    if (rareza.toLowerCase().includes('épica')) rarityColor = '#9c27b0';
    if (rareza.toLowerCase().includes('legendaria')) rarityColor = '#ff9800';

    return `
      ${imgHtml}${badge}
      <h3>${nombre}</h3>
      
      <div class="card-detail">
        <div class="detail-row"><strong>Rareza:</strong> <span style="color:${rarityColor};">${rareza}</span></div>
        <div class="detail-row"><strong>Naturaleza:</strong> ${naturaleza}</div>
        <div class="detail-row"><strong>Precio:</strong> ${precio}</div>
      </div>

      <div class="section-mini">⚡ Efecto</div>
      <div class="tag-list" style="margin-bottom:8px;">${efecto}</div>

      <div class="section-mini">📜 Descripción</div>
      <div class="extras-note" style="white-space: pre-wrap; font-size: 0.9em;">${descripcion}</div>
    `;
  }

  // --- LÓGICA ORIGINAL PARA PC/Monstruo ---
  const hpBar = `<div class="hp-wrap"><div class="hp-label"><span>HP</span><span>${pv} / ${maxpv}</span></div><div class="hp-bar-bg"><div class="hp-bar-fill" style="width:${Math.round(pct * 100)}%;background:${hpColor(pct)};"></div></div></div>`;

  let stats = `
    <div class="stat-row"><span>Nivel / CR</span><span>${i.nivel || i.cr || '—'}</span></div>
    <div class="stat-row"><span>CA</span><span>${i.ca || 10}</span></div>
    <div class="stat-row"><span>Ataque</span><span>+${i.atk || 0}</span></div>
    <div class="stat-row"><span>Daño (prom.)</span><span>${avgDmg(i.dmg)} (${i.dmg || '1d6'})</span></div>
    ${isMob && i.xp ? `<div class="stat-row"><span>XP</span><span>${i.xp}</span></div>` : ''}`;

  let attrs = '';
  if (!isMob) {
    attrs = `
      <div class="section-mini">Atributos</div>
      <div class="stat-row"><span>FUE / DES / CON</span><span>${i.fuerza || 10} / ${i.destreza || 10} / ${i.constitucion || 10}</span></div>
      <div class="stat-row"><span>INT / SAB / CAR</span><span>${i.inteligencia || 10} / ${i.sabiduria || 10} / ${i.carisma || 10}</span></div>
      <div class="stat-row"><span>Iniciativa</span><span>${i.iniciativa || '+0'}</span></div>`;
  }

  const hechizos = typeof i.hechizos === 'string' ? i.hechizos : Array.isArray(i.hechizos) ? i.hechizos.join(', ') : '';
  const inv = typeof i.inventario === 'string' ? i.inventario : Array.isArray(i.inventario) ? i.inventario.join(', ') : '';
  
  let extras = '';
  if (hechizos) extras += `<div class="section-mini">✨ Hechizos</div><div class="tag-list">${hechizos}</div>`;
  if (inv) extras += `<div class="section-mini">🎒 Inventario</div><div class="tag-list">${inv}</div>`;
  if (i.extras) extras += `<div class="extras-note">📝 ${i.extras}</div>`;

  return `${imgHtml}${badge}<h3>${nombre}${i.raza ? ` <small style="color:#888;">(${i.raza})</small>` : ''}</h3>${hpBar}${stats}${attrs}${extras}`;
}

function render() {
  if (isLoading) return;
  const txt = (document.getElementById('search')?.value || '').toLowerCase();
  const type = document.getElementById('type')?.value || 'all';
  const grid = document.getElementById('grid');
  if (!grid) return;

  let list = [];
  
  if (type === 'all' || type === 'pc') list = list.concat(data.pc.map(i => ({ ...i, t: 'PC' })));
  if (type === 'all' || type === 'mob') list = list.concat(data.mob.map(i => ({ ...i, t: 'Mob' })));
  if (type === 'all' || type === 'item') list = list.concat(data.items.map(i => ({ ...i, t: 'Item' })));

  const filtered = list.filter(i =>
    !txt ||
    (i.nombre && i.nombre.toLowerCase().includes(txt)) ||
    (i.clase && i.clase.toLowerCase().includes(txt)) ||
    (i.raza && i.raza.toLowerCase().includes(txt)) ||
    (i.descripcion && i.descripcion.toLowerCase().includes(txt)) ||
    (i.efecto && i.efecto.toLowerCase().includes(txt)) ||
    (i.naturaleza && i.naturaleza.toLowerCase().includes(txt))
  );

  // Lógica: Si no hay texto de búsqueda, NO mostrar items (solo si el filtro es 'all')
  let finalList = filtered;
  if (!txt && type === 'all') {
      finalList = finalList.filter(i => i.t !== 'Item');
  }

  if (!finalList.length) {
    grid.innerHTML = `<div class="empty-msg">No se encontraron resultados.</div>`;
  } else {
    grid.innerHTML = '';
    finalList.forEach(i => {
      const card = document.createElement('div');
      card.className = `card ${i.t === 'Mob' || i.t === 'Item' ? i.t.toLowerCase() : ''}`;
      card.innerHTML = buildCard(i);
      grid.appendChild(card);
    });
  }

  // Actualizar selector de combatientes (Solo PC y Mob)
  const sel = document.getElementById('attacker');
  if (sel) {
    const prev = sel.value;
    sel.innerHTML = '<option value="">— Atacante —</option>';
    [...data.pc.map(i => ({ ...i, t: 'PC' })), ...data.mob.map(i => ({ ...i, t: 'Mob' }))].forEach(i => {
      const opt = document.createElement('option');
      opt.value = `${i.atk || 0}|${i.dmg || '1d6'}|${i.nombre || '?'}`;
      opt.textContent = `${i.nombre || '?'} (+${i.atk || 0}) [${i.t}]`;
      if (opt.value === prev) opt.selected = true;
      sel.appendChild(opt);
    });
  }
  calcCombat();
}

// ==========================================
// SECCIÓN DE SISTEMA DE COMBATE
// ==========================================
function calcCombat() {
  const attackerEl = document.getElementById('attacker');
  const out = document.getElementById('combatResult');
  if (!attackerEl || !out) return;
  
  const val = attackerEl.value;
  const ac = parseInt(document.getElementById('ac').value) || 10;
  
  if (!val || val.indexOf('|') === -1) { 
    out.textContent = 'Selecciona un atacante'; 
    out.style.color = '#666'; 
    return; 
  }
  
  const [atk, , name] = val.split('|');
  const minRoll = ac - parseInt(atk);
  let prob, msg;

  if (minRoll <= 1) { 
    prob = 100; 
    msg = '¡Impacto automático!'; 
  } else if (minRoll > 20) { 
    prob = 5;   
    msg = 'Solo nat 20 (5%)'; 
  } else { 
    prob = Math.round((21 - minRoll) / 20 * 100); 
    msg = `${prob}% de probabilidad de impacto`; 
  }
  
  out.innerHTML = `<strong>${name}</strong> vs CA ${ac} — ${msg}`;
  out.style.color = prob > 50 ? '#4caf50' : prob > 20 ? '#ff9800' : '#ef5350';
}

function rollAttack() {
  const val = document.getElementById('attacker').value;
  const ac = parseInt(document.getElementById('ac').value) || 10;
  
  if (!val || val.indexOf('|') === -1) { 
    alert('Seleccioná un atacante válido primero.'); 
    return; 
  }
  
  const [atk, dmg, name] = val.split('|');
  const d20 = Math.ceil(Math.random() * 20);
  const total = d20 + parseInt(atk);
  const crit = d20 === 20;
  const pifia = d20 === 1;
  const hit = crit || (!pifia && total >= ac);
  let dmgRoll = 0;

  if (hit) {
    const m = String(dmg).match(/(\d+)d(\d+)([+-]\d+)?/);
    if (m) {
      const dice = parseInt(m) * (crit ? 2 : 1);
      for (let i = 0; i < dice; i++) dmgRoll += Math.ceil(Math.random() * parseInt(m));
      dmgRoll += parseInt(m) || 0;
    } else {
      dmgRoll = parseInt(dmg) || 0;
    }
  }

  let logHtml = '';
  if (crit) {
    logHtml = `<span class="crit">🎯 ¡CRÍTICO! ${name} — d20: ${d20} (+${atk}) = ${total} vs CA ${ac} — ${dmgRoll} daño (dado doble)</span>`;
  } else if (hit) {
    logHtml = `<span class="hit">✅ ${name} — d20: ${d20} (+${atk}) = ${total} vs CA ${ac} — ${dmgRoll} daño</span>`;
  } else {
    logHtml = `<span class="miss">❌ ${name} — d20: ${d20} (+${atk}) = ${total} vs CA ${ac} — Falla${pifia ? ' (pifia)' : ''}</span>`;
  }
  
  addLogEntry('combatLog', logHtml);
}

// ==========================================
// SISTEMA DE DADOS 3D Y ARENA (SVG)
// ==========================================
function buildDiceGrid() {
  const g = document.getElementById('diceGrid'); 
  if (!g) return;
  g.innerHTML = '';
  DICE.forEach(d => {
    const b = document.createElement('button');
    b.className = 'die-btn' + (d === selDie ? ' active' : '');
    b.onclick = () => { 
      if (!rolling) { selDie = d; buildDiceGrid(); buildArena(); } 
    };
    b.innerHTML = `<span class="dsymbol" style="color:${d === selDie ? '#c3073f' : '#aaa'};">${SYM[d]}</span><span class="dlabel">d${d}</span>`;
    g.appendChild(b);
  });
}

function polyShape(d, label) {
  const L = label != null ? label : '';
  const fs = String(L).length > 2 ? 14 : String(L).length > 1 ? 18 : 22;
  const f = '#c3073f', s = '#8a0029';
  
  const shapes = {
    4: `<polygon points="50,5 95,90 5,90" fill="${f}" stroke="${s}" stroke-width="3"/><text x="50" y="78" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff">${L}</text>`,
    8: `<polygon points="50,5 95,50 50,95 5,50" fill="${f}" stroke="${s}" stroke-width="3"/><text x="50" y="57" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff">${L}</text>`,
    10: `<polygon points="50,5 90,35 78,80 22,80 10,35" fill="${f}" stroke="${s}" stroke-width="3"/><text x="50" y="60" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff">${L}</text>`,
    12: `<polygon points="50,5 82,18 95,50 82,82 50,95 18,82 5,50 18,18" fill="${f}" stroke="${s}" stroke-width="3"/><text x="50" y="57" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff">${L}</text>`,
    20: `<polygon points="50,3 97,27 97,73 50,97 3,73 3,27" fill="${f}" stroke="${s}" stroke-width="3"/><text x="50" y="57" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff">${L}</text>`,
    100: `<circle cx="50" cy="50" r="44" fill="${f}" stroke="${s}" stroke-width="3"/><text x="50" y="57" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff">${L}</text>`
  };

  return `<svg viewBox="0 0 100 100">${shapes[d] || shapes}</svg>`;
}

function getFaceRot(v) {
  const m = { 
    1: { rx: 0, ry: 0 }, 2: { rx: 0, ry: 90 }, 3: { rx: -90, ry: 0 }, 
    4: { rx: 90, ry: 0 }, 5: { rx: 0, ry: -90 }, 6: { rx: 180, ry: 0 } 
  };
  return m[v] || { rx: 0, ry: 0 };
}

function buildArena(result) {
  const arena = document.getElementById('arena'); 
  if (!arena) return;
  
  if (selDie === 6) {
    const f = result != null ? getFaceRot(result) : { rx: 0, ry: 0 };
    arena.innerHTML = `
      <div class="d6-wrap" id="d6" style="--rx:${f.rx}deg;--ry:${f.ry}deg;transform:rotateX(${f.rx}deg) rotateY(${f.ry}deg);">
        <div class="d6-face f1">1</div><div class="d6-face f2">6</div>
        <div class="d6-face f3">2</div><div class="d6-face f4">5</div>
        <div class="d6-face f5">3</div><div class="d6-face f6">4</div>
      </div>`;
  } else {
    arena.innerHTML = `<div class="poly-die" id="polyDie">${polyShape(selDie, result != null ? result : '')}</div>`;
  }
}

function rollDice() {
  if (rolling) return; 
  rolling = true;
  
  const qty = Math.max(1, Math.min(20, parseInt(document.getElementById('diceQty').value) || 1));
  const mod = parseInt(document.getElementById('diceMod').value) || 0;
  const rolls = Array.from({ length: qty }, () => Math.ceil(Math.random() * selDie));
  const first = rolls;
  
  buildArena();
  
  if (selDie === 6) {
    const el = document.getElementById('d6');
    if (el) {
      const f = getFaceRot(first);
      el.style.setProperty('--rx', f.rx + 'deg');
      el.style.setProperty('--ry', f.ry + 'deg');
      el.classList.add('spinning');
    }
  } else {
    const el = document.getElementById('polyDie');
    if (el) el.classList.add('poly-spinning');
  }
  
  setTimeout(() => { 
    buildArena(first); 
    showDiceResult(rolls, mod); 
    rolling = false; 
  }, 1050);
}

function showDiceResult(rolls, mod) {
  const qty = rolls.length;
  const sum = rolls.reduce((a, b) => a + b, 0);
  const total = sum + mod;
  
  const pills = rolls.map(r => `<span class="roll-pill ${r === selDie ? 'crit' : r === 1 ? 'fail' : ''}">${r}</span>`).join('');
  const modStr = mod !== 0 ? ` ${mod > 0 ? '+' : ''}${mod}` : '';
  const isCrit = qty === 1 && rolls === selDie;
  const isFail = qty === 1 && rolls === 1;
  const col = isCrit ? '#ff9800' : isFail ? '#ef5350' : '#ffffff';
  
  const resEl = document.getElementById('diceResult');
  if (resEl) {
    resEl.innerHTML = `<div class="dice-total" style="color:${col};">${total}</div><div class="dice-breakdown">${qty}d${selDie}${modStr} → ${pills}${mod !== 0 ? ` + ${mod}` : ''}</div>`;
  }
  
  const divertido = isCrit ? ' 😤UN NATURAL HDP!!! Tanta suerte...' : isFail ? ' 🤣JAJAJA UN 1 JAJAJA' : '';
  const logHtml = `<strong style="color:#e0e0e0;">${total}</strong> — ${qty}d${selDie}${modStr} [${rolls.join(', ')}]${divertido}`;
  
  addLogEntry('diceLog', logHtml);
}

function clearDice() {
  const resEl = document.getElementById('diceResult');
  if (resEl) resEl.innerHTML = '<div style="color:#555;font-size:14px;">Elegí un dado y tirá.</div>';
  const logEl = document.getElementById('diceLog');
  if (logEl) logEl.innerHTML = ''; 
  buildArena();
}

// ==========================================
// INICIALIZADOR DE EVENTOS (DOM)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  buildDiceGrid(); 
  buildArena(); 
  loadData();
  
  document.getElementById('search')?.addEventListener('input', render);
  document.getElementById('type')?.addEventListener('change', render);
  document.getElementById('btnAttack')?.addEventListener('click', rollAttack);
  document.getElementById('btnRollDice')?.addEventListener('click', rollDice);
  document.getElementById('btnClearDice')?.addEventListener('click', clearDice);
  document.getElementById('attacker')?.addEventListener('change', calcCombat);
  document.getElementById('ac')?.addEventListener('change', calcCombat);
  
  document.addEventListener('keydown', e => { 
    if (e.key === 'Enter') rollDice(); 
  });
});
