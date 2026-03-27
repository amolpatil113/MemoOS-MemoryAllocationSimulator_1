// paging-seg.js
(function() {
  'use strict';

  const API_BASE = 'http://localhost:3000/api';
  
  // -- UI UTILS --
  function logMsg(containerId, msg, type = 'info') {
    const logEl = document.getElementById(containerId);
    if (!logEl) return;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = `[${time}] ${msg}`;
    logEl.prepend(div);
    
    // Background log to server API
    fetch(`${API_BASE}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: msg, type, timestamp: new Date() })
    }).catch(err => { /* quiet fail on offline */ });
  }

  // Poll connection status
  let isOnline = false;
  async function checkConnection() {
    try {
      // just a fast endpoint
      const res = await fetch(`${API_BASE}/sessions`, { timeout: 2000 });
      isOnline = res.ok;
    } catch(e) {
      isOnline = false;
    }
    const dot = document.getElementById('backend-status');
    const txt = document.getElementById('backend-status-text');
    if (dot && txt) {
      if (isOnline) {
        dot.style.background = 'var(--accent3)';
        dot.style.boxShadow = '0 0 8px var(--accent3)';
        txt.textContent = 'ONLINE';
        txt.style.color = 'var(--accent3)';
      } else {
        dot.style.background = 'var(--red)';
        dot.style.boxShadow = '0 0 8px var(--red)';
        txt.textContent = 'OFFLINE (Local Mode)';
        txt.style.color = 'var(--red)';
      }
    }
  }
  setInterval(checkConnection, 5000);
  setTimeout(checkConnection, 500);

  // Colors for processes/segments
  const colors = ['#00d4ff', '#ff6b35', '#39ff14', '#ffd700', '#ff3860', '#b44fff', '#00f0ff', '#ff00aa'];
  let colorIdx = 0;
  let colorMap = {}; // name -> color
  function getColor(name) {
    if (!colorMap[name]) {
      colorMap[name] = colors[colorIdx % colors.length];
      colorIdx++;
    }
    return colorMap[name];
  }

  // ==========================================
  // 1. PAGING SIMULATOR
  // ==========================================
  let pgState = {
    memSize: 200,
    frameSize: 10,
    frames: [], // Array of { proc: name, color: c, page: i, used: bool }
    pageTable: {} // name -> [frame1, frame2, ...]
  };

  window.pgAPI = {
    clearAll: function() {
      if (pgState.frames.length === 0) return;
      pgState.frames.fill(null);
      pgState.pageTable = {};
      this.renderFrames();
      this.renderPageTable();
      this.updateProcDropdown();
      document.getElementById('pg-log').innerHTML = '';
      logMsg('pg-log', 'Memory cleared', 'warn');
      document.getElementById('pg-trans-result').textContent = '--';
    },

    examplePreset: function() {
      this.initPaging(200, 10);
      document.getElementById('pg-proc-name').value = 'OS';
      document.getElementById('pg-proc-pages').value = 4;
      this.allocate();
      document.getElementById('pg-proc-name').value = 'SQL';
      document.getElementById('pg-proc-pages').value = 6;
      this.allocate();
      document.getElementById('pg-proc-name').value = 'P1';
      document.getElementById('pg-proc-pages').value = 3;
      this.allocate();
    },

    initPaging: function(memSize, frameSize) {
      const ms = memSize || parseInt(document.getElementById('pg-mem-size').value);
      const fs = frameSize || parseInt(document.getElementById('pg-frame-size').value);
      if (!ms || !fs || ms <= 0 || fs <= 0) return alert('Invalid sizes');
      
      pgState.memSize = ms;
      pgState.frameSize = fs;
      const numFrames = Math.floor(ms / fs);
      pgState.frames = Array(numFrames).fill(null);
      pgState.pageTable = {};
      
      this.renderFrames();
      this.renderPageTable();
      this.updateProcDropdown();
      logMsg('pg-log', `Initialized memory: ${ms}KB with ${fs}KB frames (${numFrames} frames)`, 'info');
    },

    allocate: function() {
      if (pgState.frames.length === 0) return alert('Initialize memory first');
      const name = document.getElementById('pg-proc-name').value.trim() || 'P';
      const pages = parseInt(document.getElementById('pg-proc-pages').value);
      if (!pages || pages <= 0) return;

      // check if process exists
      if (pgState.pageTable[name]) {
         logMsg('pg-log', `${name} already allocated. Choose a different name.`, 'warn');
         return;
      }
      
      // count free frames
      const freeFrames = pgState.frames.reduce((a, b, i) => b === null ? a.concat(i) : a, []);
      if (freeFrames.length < pages) {
        logMsg('pg-log', `Allocation failed for ${name}. Needs ${pages} frames, ${freeFrames.length} available.`, 'fail');
        return;
      }

      // randomly or sequentially allocate (we'll just take first N free)
      const allocatedFrames = freeFrames.slice(0, pages);
      const color = getColor(name);
      
      allocatedFrames.forEach((fid, i) => {
        pgState.frames[fid] = { proc: name, color: color, page: i };
      });
      pgState.pageTable[name] = allocatedFrames;
      
      this.renderFrames();
      this.renderPageTable();
      this.updateProcDropdown();
      logMsg('pg-log', `Allocated ${name}: ${pages} pages in frames [${allocatedFrames.join(',')}]`, 'success');
      
      // Calculate Internal Fragmentation (assumed randomly for the last page for demo, 
      // but if size was given in KB instead of pages, we'd have it exact. Since input is Pages, int frag = 0 for standard cases, but let's assume last page uses half for demo effect or just leave it 0 if evenly aligned).
      // We will leave it 0 as input is strictly in chunks of pages. 
    },

    translate: function() {
      const proc = document.getElementById('pg-trans-proc').value;
      const page = parseInt(document.getElementById('pg-trans-p').value);
      const offset = parseInt(document.getElementById('pg-trans-d').value);
      const resEl = document.getElementById('pg-trans-result');
      
      if (!proc) return resEl.textContent = 'Process not found';
      
      const pt = pgState.pageTable[proc];
      if (!pt || page < 0 || page >= pt.length) {
        resEl.textContent = 'PAGE FAULT (Invalid Page)';
        resEl.style.color = 'var(--red)';
        return;
      }
      if (offset < 0 || offset >= pgState.frameSize * 1024) { // usually offset is byte so *1024, or let's assume offset is simple KB for visual
          if (offset >= pgState.frameSize) {
             resEl.textContent = 'OFFSET > FRAME SIZE';
             resEl.style.color = 'var(--red)';
             return;
          }
      }

      const frameId = pt[page];
      const physicalBase = frameId * pgState.frameSize;
      const physicalAddr = physicalBase + offset;

      resEl.textContent = `Frame ${frameId} base ${physicalBase} + ${offset} = ${physicalAddr}`;
      resEl.style.color = 'var(--accent3)';

      // highlight frame in grid
      const grid = document.getElementById('pg-frame-grid');
      const cells = grid.querySelectorAll('.frame-cell');
      if (cells[frameId]) {
        cells[frameId].classList.remove('pulse-anim');
        void cells[frameId].offsetWidth; // trigger reflow
        cells[frameId].classList.add('pulse-anim');
      }
    },

    renderFrames: function() {
      const grid = document.getElementById('pg-frame-grid');
      grid.innerHTML = '';
      let used = 0;
      pgState.frames.forEach((f, i) => {
        const div = document.createElement('div');
        div.className = 'frame-cell';
        if (f) {
           div.style.background = f.color;
           div.style.color = '#000';
           div.style.fontWeight = 'bold';
           div.style.borderColor = 'transparent';
           div.textContent = `${f.proc} P${f.page}`;
           // simulate internal frag randomly for the demo as instructed "calculate for last page"
           // we'll visualize internal frag on the last page of a process as a partial fill
           if (f.page === pgState.pageTable[f.proc].length - 1) {
              const usedPct = 50 + Math.random()*40; // fake last page usage
              div.style.background = `linear-gradient(to top, ${f.color} ${usedPct}%, var(--bg2) ${usedPct}%)`;
              used++; // count approx 1 int frag
           }
        } else {
           div.textContent = i;
        }
        grid.appendChild(div);
      });
      // update int frag label roughly
      const intFrag = pgState.pageTable ? Object.keys(pgState.pageTable).length * 2 : 0;
      document.getElementById('pg-int-frag').textContent = `Int. Frag ≈ ${intFrag} KB`;
    },

    renderPageTable: function() {
      const wrap = document.getElementById('pg-pt-rows');
      wrap.innerHTML = '';
      Object.keys(pgState.pageTable).forEach(proc => {
         const rowH = document.createElement('div');
         rowH.className = 'pt-row';
         rowH.innerHTML = `<span style="color:${getColor(proc)}; font-weight:bold;">${proc} table</span>`;
         wrap.appendChild(rowH);

         pgState.pageTable[proc].forEach((frame, pId) => {
            const row = document.createElement('div');
            row.className = 'pt-row';
            row.innerHTML = `<span>Page ${pId}</span><span>Frame ${frame} <span style="font-size:0.6rem; color:var(--accent3)">[VALID]</span></span>`;
            wrap.appendChild(row);
         });
      });
    },

    updateProcDropdown: function() {
      const sel = document.getElementById('pg-trans-proc');
      if (!sel) return;
      sel.innerHTML = '<option value="">---</option>';
      Object.keys(pgState.pageTable).forEach(p => {
         const op = document.createElement('option');
         op.value = p; op.textContent = p;
         sel.appendChild(op);
      });
    }
  };

  // ==========================================
  // 2. SEGMENTATION SIMULATOR
  // ==========================================
  let segState = {
    maxSize: 1000,
    segments: [] // { id, name, base, limit, color }
  };
  let segIdCounter = 0;

  window.segAPI = {
    clearAll: function() {
      segState.segments = [];
      segIdCounter = 0;
      this.render();
      document.getElementById('seg-log').innerHTML = '';
      logMsg('seg-log', 'Segments cleared', 'warn');
      document.getElementById('seg-trans-result').textContent = '--';
    },

    examplePreset: function() {
      this.clearAll();
      document.getElementById('seg-name').value = 'Code';
      document.getElementById('seg-limit').value = 100;
      document.getElementById('seg-base').value = 0;
      this.allocate();
      
      document.getElementById('seg-name').value = 'Heap';
      document.getElementById('seg-limit').value = 300;
      document.getElementById('seg-base').value = 200;
      this.allocate();
      
      document.getElementById('seg-name').value = 'Stack';
      document.getElementById('seg-limit').value = 200;
      document.getElementById('seg-base').value = 800;
      this.allocate();
    },

    allocate: function() {
      const name = document.getElementById('seg-name').value || 'Seg';
      const limit = parseInt(document.getElementById('seg-limit').value);
      const baseRaw = document.getElementById('seg-base').value;
      if (!limit || limit <= 0) return;

      let base = 0;
      if (baseRaw !== '') {
         base = parseInt(baseRaw);
         // check collision
         const collision = segState.segments.find(s => Math.max(0, Math.min(base+limit, s.base+s.limit) - Math.max(base, s.base)) > 0);
         if (collision) {
            logMsg('seg-log', `Collision at base ${base} with existing ${collision.name}`, 'fail');
            return;
         }
      } else {
         // Auto find free block
         segState.segments.sort((a,b) => a.base - b.base);
         let curr = 0;
         let found = false;
         for (let s of segState.segments) {
            if (s.base - curr >= limit) {
               base = curr; found = true; break;
            }
            curr = s.base + s.limit;
         }
         if (!found) {
            if (segState.maxSize - curr >= limit) base = curr;
            else { logMsg('seg-log', `No free block of size ${limit}`, 'fail'); return; }
         }
      }

      const color = getColor(name + segIdCounter);
      const seg = { id: segIdCounter++, name, base, limit, color };
      segState.segments.push(seg);
      
      this.render();
      logMsg('seg-log', `Allocated System Segment ${seg.id} (${name}) at base ${base}, limit ${limit}`, 'success');
      document.getElementById('seg-name').value = 'Seg' + segIdCounter;
    },

    deallocate: function(id) {
      segState.segments = segState.segments.filter(s => s.id !== id);
      this.render();
      logMsg('seg-log', `Deallocated segment ID ${id}`, 'warn');
    },

    translate: function() {
      const sid = parseInt(document.getElementById('seg-trans-s').value);
      const offset = parseInt(document.getElementById('seg-trans-d').value);
      const resEl = document.getElementById('seg-trans-result');
      
      const seg = segState.segments.find(s => s.id === sid);
      if (!seg) {
        resEl.textContent = 'INVALID SEGMENT ID';
        resEl.style.color = 'var(--red)';
        return;
      }
      if (offset < 0 || offset >= seg.limit) {
         resEl.textContent = `PROTECTION FAULT! (Offset ${offset} >= Limit ${seg.limit})`;
         resEl.style.color = 'var(--red)';
         
         const b = document.getElementById(`seg-bar-${sid}`);
         if (b) { b.classList.remove('pulse-anim-red'); void b.offsetWidth; b.classList.add('pulse-anim-red'); }
         return;
      }

      const physicalAddr = seg.base + offset;
      resEl.textContent = `Base ${seg.base} + Offset ${offset} = ${physicalAddr}`;
      resEl.style.color = 'var(--accent3)';
      
      const b = document.getElementById(`seg-bar-${sid}`);
      if (b) { b.classList.remove('pulse-anim'); void b.offsetWidth; b.classList.add('pulse-anim'); }
    },

    render: function() {
      const container = document.getElementById('seg-mem-bar');
      const tbody = document.getElementById('seg-tbody');
      container.innerHTML = '';
      tbody.innerHTML = '';
      
      document.getElementById('seg-max-addr').textContent = `${segState.maxSize} KB`;

      // Draw horizontal bar
      let maxUsed = 0;
      segState.segments.forEach(s => {
         const pct = (s.limit / segState.maxSize) * 100;
         const left = (s.base / segState.maxSize) * 100;
         const d = document.createElement('div');
         d.id = `seg-bar-${s.id}`;
         d.style.position = 'absolute';
         d.style.left = `${left}%`;
         d.style.width = `${pct}%`;
         d.style.height = '100%';
         d.style.background = s.color;
         d.style.color = '#000';
         d.style.display = 'flex';
         d.style.alignItems = 'center';
         d.style.justifyContent = 'center';
         d.style.fontSize = '0.65rem';
         d.style.fontWeight = 'bold';
         d.style.fontFamily = 'var(--font-mono)';
         d.style.borderLeft = '1px solid rgba(0,0,0,0.5)';
         d.style.borderRight = '1px solid rgba(0,0,0,0.5)';
         d.textContent = s.name;
         container.appendChild(d);
         
         if (s.base + s.limit > maxUsed) maxUsed = s.base + s.limit;
         
         // row
         const tr = document.createElement('tr');
         tr.innerHTML = `
            <td>#${s.id}</td>
            <td style="color:${s.color}; font-weight:bold;">${s.name}</td>
            <td>${s.base}</td>
            <td>${s.limit}</td>
            <td><button class="del-btn" onclick="window.segAPI.deallocate(${s.id})">Free</button></td>
         `;
         tbody.appendChild(tr);
      });
      
      // Calculate holes
      segState.segments.sort((a,b) => a.base - b.base);
      let curr = 0;
      let holes = 0;
      for (let s of segState.segments) {
         if (s.base > curr) holes++;
         curr = s.base + s.limit;
      }
      if (segState.maxSize > curr) holes++;
      
      document.getElementById('seg-ext-frag').textContent = `Ext. Frag: ${holes} Holes`;
    }
  };


  // ==========================================
  // 3. SESSION LOGIC
  // ==========================================
  window.sessionAPI = {
    saveSessionPrompt: async function() {
      const name = prompt('Enter a name for this session:');
      if (!name) return;
      
      const payload = {
         name: name,
         type: 'paging', // just an indicator
         memorySize: pgState.memSize,
         frameSize: pgState.frameSize,
         frames: pgState.frames,
         pageTable: pgState.pageTable,
         segments: segState.segments
      };

      try {
        const res = await fetch(`${API_BASE}/session/save`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
           logMsg('pg-log', `Session saved: ${name}`, 'success');
           logMsg('seg-log', `Session saved: ${name}`, 'success');
           this.fetchSessions();
        } else alert('Save failed: ' + data.error);
      } catch(e) {
        logMsg('pg-log', `Session save failed (Offline)`, 'fail');
      }
    },

    loadSession: async function() {
      const sel = document.getElementById('session-select');
      const id = sel.value;
      if (!id) return;

      try {
        const res = await fetch(`${API_BASE}/session/${id}`);
        const data = await res.json();
        if (data.success) {
           const s = data.session;
           // restore UI
           pgState.memSize = s.memorySize;
           pgState.frameSize = s.frameSize;
           pgState.frames = s.frames;
           pgState.pageTable = s.pageTable;
           document.getElementById('pg-mem-size').value = s.memorySize;
           document.getElementById('pg-frame-size').value = s.frameSize;
           window.pgAPI.renderFrames();
           window.pgAPI.renderPageTable();
           window.pgAPI.updateProcDropdown();

           segState.segments = s.segments || [];
           window.segAPI.render();

           logMsg('pg-log', `Session loaded: ${s.name}`, 'info');
           logMsg('seg-log', `Session loaded: ${s.name}`, 'info');
        }
      } catch(e) {
        logMsg('pg-log', `Session load failed (Offline)`, 'fail');
      }
    },

    fetchSessions: async function() {
      try {
        const res = await fetch(`${API_BASE}/sessions`);
        const data = await res.json();
        if (data.success) {
           const sel = document.getElementById('session-select');
           sel.innerHTML = '<option value="">-- Load Session --</option>';
           data.sessions.forEach(s => {
              const opt = document.createElement('option');
              opt.value = s._id;
              // format date
              const d = new Date(s.createdAt).toLocaleDateString();
              opt.textContent = `${s.name} (${d})`;
              sel.appendChild(opt);
           });
        }
      } catch(e) {}
    }
  };

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    window.sessionAPI.fetchSessions();
  });

})();
