# BlackSmith
Base de datos DnD

<!-- ... (El resto del HTML anterior se mantiene igual hasta el script) ... -->

<script>
    // --- 1. CONFIGURACIÓN ---
    const SHEET_URL = "PEGAR_TU_URL_AQUI"; // <--- PEGA AQUÍ LA NUEVA URL
    
    let data = { pc: [], mob: [], objetos: [] };
    let isLoading = true;

    // --- 2. CARGAR DATOS ---
    async function loadData() {
        try {
            const response = await fetch(SHEET_URL);
            if (!response.ok) throw new Error("Error al conectar");
            let rawData = await response.json();
            
            // Sanitizar datos
            if (!Array.isArray(rawData)) {
                if (typeof rawData === 'object') rawData = Object.values(rawData);
                else rawData = [];
            }

            const cleanData = rawData.map(row => {
                if (typeof row === 'string') return null;
                const cleanRow = {};
                Object.keys(row).forEach(key => {
                    const cleanKey = String(key).toLowerCase().trim().replace(/\s+/g, '');
                    cleanRow[cleanKey] = row[key];
                });
                return cleanRow;
            }).filter(r => r !== null);

            // Filtrar por tipo
            data.pc = cleanData.filter(item => (item.tipo && item.tipo.toLowerCase() === 'pc'));
            data.mob = cleanData.filter(item => (item.tipo && item.tipo.toLowerCase() === 'mob'));
            // (Si agregas la hoja de objetos, aquí la filtrarías)

            console.log("PCs:", data.pc.length, "Mobs:", data.mob.length);
            isLoading = false;
            render();
            calc();
        } catch (error) {
            console.error("Error:", error);
            document.body.innerHTML = `<h1 style="color:red">Error: ${error.message}</h1>`;
        }
    }

    // --- 3. RENDERIZADO MEJORADO ---
    function avg(d) {
        if (!d) return 0;
        const m = d.toString().match(/(\d+)d(\d+)([+-]\d+)?/);
        if(!m) return 0;
        return (parseInt(m) * (parseInt(m)+1)/2) + (parseInt(m)||0);
    }

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
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888;">No encontrado</div>';
            return;
        }

        filtered.forEach(i => {
            const card = document.createElement('div');
            const uniqueId = i.id || Math.random().toString(36).substr(2, 9);
            card.className = `card ${i.t === 'PC' ? 'pc' : 'mob'}`;
            
            // Cabecera con Raza si es PC
            let headerHtml = `<h3>${i.nombre || 'Sin Nombre'}`;
            if(i.t === 'PC' && i.raza) headerHtml += ` <small style="color:#aaa">(${i.raza})</small>`;
            if(i.t === 'Mob') headerHtml += `<div class="xp-badge">XP: ${i.xp || 0}</div>`;
            headerHtml += `</h3>`;

            // Estadísticas Principales
            let statsHtml = `
                <div class="stat-row"><span>Nivel:</span> <span>${i.nivel || 0}</span></div>
                <div class="stat-row"><span>CA:</span> <span>${i.ca || 10}</span></div>
                <div class="stat-row"><span>PV:</span> <span class="${(i.pv || 0) < ((i.maxpv || 0)/2) ? 'danger' : ''}">${i.pv || 0} / ${i.maxpv || 0}</span></div>
                <div class="stat-row"><span>Atq:</span> <span>+${i.atk || 0}</span></div>
                <div class="stat-row"><span>Daño:</span> <span>${avg(i.dmg)}</span></div>
            `;

            // Atributos (Solo PCs)
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

            // Hechizos (Solo PCs)
            let hechizosHtml = '';
            if(i.t === 'PC' && i.hechizos && i.hechizos.length > 0) {
                hechizosHtml = `
                    <div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem;">
                        <div style="font-weight:bold; color:#c3073f; margin-bottom:5px;">✨ Hechizos</div>
                        <div style="color:#aaa;">${i.hechizos.join(', ')}</div>
                    </div>
                `;
            }

            // Inventario
            let invHtml = '';
            if(i.t === 'PC' && i.inventario && i.inventario.length > 0) {
                invHtml = `
                    <div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem;">
                        <div style="font-weight:bold; color:#f1c40f; margin-bottom:5px;">🎒 Inventario</div>
                        <div style="color:#aaa;">${i.inventario.join(', ')}</div>
                    </div>
                `;
            }

            // Extras/Notas
            let extrasHtml = '';
            if(i.extras) {
                extrasHtml = `
                    <div style="margin-top:10px; border-top:1px solid #444; padding-top:5px; font-size:0.85rem; font-style:italic; color:#aaa;">
                        📝 ${i.extras}
                    </div>
                `;
            }

            // Botón de editar (Simple, solo alerta por ahora)
            let editBtn = i.t === 'PC' ? `<button class="secondary" style="width:100%; margin-top:15px;" onclick="alert('Edita los datos en Google Sheets. Las columnas nuevas son: Raza, Atributos, Hechizos, Extras.')">✏️ Editar en Sheets</button>` : '';

            card.innerHTML = `
                ${headerHtml}
                ${statsHtml}
                ${hechizosHtml}
                ${invHtml}
                ${extrasHtml}
                ${editBtn}
            `;
            grid.appendChild(card);
        });
        
        // Actualizar calculadora
        const sel = document.getElementById('attacker');
        sel.innerHTML = '<option value="">-- Elige --</option>';
        list.forEach(i => {
            sel.innerHTML += `<option value="${i.atk || 0}|${i.dmg || '1d6'}">${i.nombre || 'Desconocido'} (+${i.atk || 0})</option>`;
        });
    }

    // --- 4. CALCULADORA (Igual que antes) ---
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
        out.innerHTML = `${msg}<br><small>Daño: ~${avg(dmg)}</small>`;
        out.style.color = prob > 50 ? "#4caf50" : "#ff5252";
    }

    window.onload = loadData;
</script>
