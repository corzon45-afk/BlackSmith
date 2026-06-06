# BlackSmith
Base de datos DnD

<script>
    const SHEET_URL = "PEGAR_TU_URL_AQUI"; // <--- ASEGÚRATE DE QUE ESTE CORRECTA
    let data = { pc: [], mob: [], objetos: [] };
    let isLoading = true;

    async function loadData() {
        const statusDiv = document.getElementById('grid');
        statusDiv.innerHTML = '<h3 style="text-align:center">Cargando datos...</h3>';

        try {
            console.log("Intentando conectar con:", SHEET_URL);
            const response = await fetch(SHEET_URL);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            let rawData = await response.json();
            console.log("Datos crudos recibidos:", rawData);

            if (!Array.isArray(rawData)) {
                if (typeof rawData === 'object' && rawData !== null) {
                    rawData = Object.values(rawData);
                } else {
                    rawData = [];
                }
            }

            // Limpieza estricta
            const cleanData = rawData.map(row => {
                if (!row || typeof row !== 'object') return null;
                const cleanRow = {};
                Object.keys(row).forEach(key => {
                    const cleanKey = String(key).toLowerCase().trim().replace(/\s+/g, '');
                    let val = row[key];
                    // Normalizar 'tipo'
                    if (cleanKey === 'tipo' && val) {
                        val = String(val).toLowerCase().trim();
                    }
                    cleanRow[cleanKey] = val;
                });
                return cleanRow;
            }).filter(r => r !== null);

            console.log("Datos limpios:", cleanData);

            // Filtrado
            data.pc = cleanData.filter(item => item.tipo === 'pc');
            data.mob = cleanData.filter(item => item.tipo === 'mob');
            
            console.log(`PCs encontrados: ${data.pc.length}`);
            console.log(`Mobs encontrados: ${data.mob.length}`);

            if (data.pc.length === 0 && data.mob.length === 0) {
                console.warn("ADVERTENCIA: No se encontraron PCs ni Mobs. Revisa la columna 'tipo' en Sheets.");
            }

            isLoading = false;
            render();
            calc();

        } catch (error) {
            console.error("Fallo total:", error);
            statusDiv.innerHTML = `<h2 style="color:red; text-align:center">Error al cargar datos.<br><small>${error.message}</small><br><br>Revisa la consola (F12) y la URL.</h2>`;
            isLoading = false;
        }
    }

    // ... (El resto de funciones avg, render, calc se mantienen igual que en el paso anterior) ...
    // Asegúrate de que la función render() tenga el mensaje "No encontrado" si la lista está vacía.
    
    function render() {
        if (isLoading) return;
        const txt = document.getElementById('search').value.toLowerCase();
        const type = document.getElementById('type').value;
        const grid = document.getElementById('grid');
        grid.innerHTML = '';
        
        let list = [];
        if(type === 'all' || type === 'pc') list = list.concat(data.pc.map(i => ({...i, t: 'PC'})));
        if(type === 'all' || type === 'mob') list = list.concat(data.mob.map(i => ({...i, t: 'Mob'})));
        
        const filtered = list.filter(i => 
            (i.nombre && i.nombre.toLowerCase().includes(txt)) || 
            (i.clase && i.clase.toLowerCase().includes(txt)) ||
            (i.raza && i.raza.toLowerCase().includes(txt))
        );
        
        if(filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888; padding:20px;">No se encontraron personajes/mobs.<br>Verifica que la columna "tipo" tenga "pc" o "mob" en minúsculas.</div>';
            return;
        }

        // ... (El resto del código de renderizado de tarjetas igual que antes) ...
        // (Copiar aquí el código largo de render() del paso anterior, pero asegúrate de que el bloque if(filtered.length === 0) esté antes)
        
        filtered.forEach(i => {
            const card = document.createElement('div');
            const uniqueId = i.id || Math.random().toString(36).substr(2, 9);
            card.className = `card ${i.t === 'PC' ? 'pc' : 'mob'}`;
            
            let headerHtml = `<h3>${i.nombre || 'Sin Nombre'}`;
            if(i.t === 'PC' && i.raza) headerHtml += ` <small style="color:#aaa">(${i.raza})</small>`;
            if(i.t === 'Mob') headerHtml += `<div class="xp-badge">XP: ${i.xp || 0}</div>`;
            headerHtml += `</h3>`;

            let statsHtml = `
                <div class="stat-row"><span>Nivel:</span> <span>${i.nivel || 0}</span></div>
                <div class="stat-row"><span>CA:</span> <span>${i.ca || 10}</span></div>
                <div class="stat-row"><span>PV:</span> <span class="${(i.pv || 0) < ((i.maxpv || 0)/2) ? 'danger' : ''}">${i.pv || 0} / ${i.maxpv || 0}</span></div>
                <div class="stat-row"><span>Atq:</span> <span>+${i.atk || 0}</span></div>
                <div class="stat-row"><span>Daño:</span> <span>${(function(d){if(!d)return 0;const m=d.toString().match(/(\d+)d(\d+)([+-]\d+)?/);if(!m)return 0;return (parseInt(m)*(parseInt(m)+1)/2)+(parseInt(m)||0);})(i.dmg)}</span></div>
            `;

            if(i.t === 'PC') {
                statsHtml += `
                    <div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem;">
                        <div style="font-weight:bold; color:#c3073f; margin-bottom:5px;">📊 Atributos</div>
                        <div class="stat-row"><span>Fuerza:</span> <span>${i.fuerza || 10}</span></div>
                        <div class="stat-row"><span>Destreza:</span> <span>${i.destreza || 10}</span></div>
                        <div class="stat-row"><span>Constitución:</span> <span>${i.constitucion || 10}</span></div>
                        <div class="stat-row"><span>Inteligencia:</span> <span>${i.inteligencia || 10}</span></div>
                        <div class="stat-row"><span>Sabiduría:</span> <span>${i.sabiduria || 10}</span></div>
                        <div class="stat-row"><span>Carisma:</span> <span>${i.carisma || 10}</span></div>
                        <div class="stat-row"><span>Init:</span> <span>${i.iniciativa || '+0'}</span></div>
                    </div>
                `;
            }

            let hechizosHtml = '';
            if(i.t === 'PC' && i.hechizos && Array.isArray(i.hechizos) && i.hechizos.length > 0) {
                hechizosHtml = `<div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem;"><div style="font-weight:bold; color:#c3073f; margin-bottom:5px;">✨ Hechizos</div><div style="color:#aaa;">${i.hechizos.join(', ')}</div></div>`;
            } else if (i.t === 'PC' && i.hechizos && typeof i.hechizos === 'string' && i.hechizos.includes(',')) {
                 // Fallback si viene como string separado por comas
                 let arr = i.hechizos.split(',').map(s=>s.trim());
                 hechizosHtml = `<div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem;"><div style="font-weight:bold; color:#c3073f; margin-bottom:5px;">✨ Hechizos</div><div style="color:#aaa;">${arr.join(', ')}</div></div>`;
            }

            let invHtml = '';
            if(i.t === 'PC' && i.inventario && Array.isArray(i.inventario) && i.inventario.length > 0) {
                invHtml = `<div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem;"><div style="font-weight:bold; color:#f1c40f; margin-bottom:5px;">🎒 Inventario</div><div style="color:#aaa;">${i.inventario.join(', ')}</div></div>`;
            } else if (i.t === 'PC' && i.inventario && typeof i.inventario === 'string' && i.inventario.includes(',')) {
                 let arr = i.inventario.split(',').map(s=>s.trim());
                 invHtml = `<div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem;"><div style="font-weight:bold; color:#f1c40f; margin-bottom:5px;">🎒 Inventario</div><div style="color:#aaa;">${arr.join(', ')}</div></div>`;
            }

            let extrasHtml = '';
            if(i.extras) {
                extrasHtml = `<div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem; font-style:italic; color:#aaa;">📝 ${i.extras}</div>`;
            }

            let editBtn = i.t === 'PC' ? `<button class="secondary" style="width:100%; margin-top:15px;" onclick="alert('Edita en Google Sheets: Raza, Atributos, Hechizos, Extras.')">✏️ Editar</button>` : '';

            card.innerHTML = `${headerHtml}${statsHtml}${hechizosHtml}${invHtml}${extrasHtml}${editBtn}`;
            grid.appendChild(card);
        });
        
        const sel = document.getElementById('attacker');
        sel.innerHTML = '<option value="">-- Elige --</option>';
        list.forEach(i => {
            sel.innerHTML += `<option value="${i.atk || 0}|${i.dmg || '1d6'}">${i.nombre || 'Desconocido'} (+${i.atk || 0})</option>`;
        });
    }

    function calc() {
        const val = document.getElementById('attacker').value;
        const ac = parseInt(document.getElementById('ac').value) || 10;
        const out = document.getElementById('res');
        if(!val) { out.innerText = "Selecciona atacante"; out.style.color = "#4caf50"; return; }
        const [atk, dmg] = val.split('|');
        const min = ac - parseInt(atk);
        let prob = 0, msg = "";
        if(min <= 1) { prob = 100; msg = "¡Impacto Automático!"; }
        else if(min > 20) { prob = 5; msg = "Solo Nat 20 (5%)"; }
        else { prob = ((21-min)/20)*100; msg = `${prob.toFixed(1)}% de acierto`; }
        out.innerHTML = `${msg}<br><small>Daño: ~${(function(d){if(!d)return 0;const m=d.toString().match(/(\d+)d(\d+)([+-]\d+)?/);if(!m)return 0;return (parseInt(m)*(parseInt(m)+1)/2)+(parseInt(m)||0);})(dmg)}</small>`;
        out.style.color = prob > 50 ? "#4caf50" : "#ff5252";
    }

    window.onload = loadData;
</script>
