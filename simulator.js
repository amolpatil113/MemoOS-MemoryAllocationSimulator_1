/* simulator.js — Memory Allocation Algorithms + UI */

(function () {
  'use strict';

  let MEMORY_SIZE = 200; // KB

  // Process color palette (hex CSS)
  const PROC_COLORS = [
    '#00d4ff', '#ff6b35', '#39ff14', '#ffd700',
    '#b44fff', '#ff3860', '#00ffcc', '#ff9f43',
    '#48dbfb', '#ff6348', '#7bed9f', '#eccc68',
  ];

  let colorIndex = 0;

  // Memory represented as sorted list of segments
  // Each segment: { start, size, free: bool, name?, color? }
  let memory = [{ start: 0, size: MEMORY_SIZE, free: true }];
  let nextFitPointer = 0; // for Next Fit

  // ── Allocation Algorithms ──────────────────────────────────────

  function getAlgoSteps(algo, size) {
    const steps = [];
    let idx = -1;

    if (algo === 'first-fit' || algo === 'first') {
      for (let i = 0; i < memory.length; i++) {
        steps.push({ idx: i, success: memory[i].free && memory[i].size >= size });
        if (memory[i].free && memory[i].size >= size) { idx = i; break; }
      }
    } else if (algo === 'best-fit' || algo === 'best') {
      let bestIdx = -1;
      let bestSize = Infinity;
      for (let i = 0; i < memory.length; i++) {
        steps.push({ idx: i, success: false, checking: true });
        if (memory[i].free && memory[i].size >= size) {
          if (memory[i].size < bestSize) {
            bestSize = memory[i].size;
            bestIdx = i;
          }
        }
      }
      if (bestIdx !== -1) {
        steps.push({ idx: bestIdx, success: true });
        idx = bestIdx;
      }
    } else if (algo === 'worst-fit' || algo === 'worst') {
      let worstIdx = -1;
      let worstSize = -1;
      for (let i = 0; i < memory.length; i++) {
        steps.push({ idx: i, success: false, checking: true });
        if (memory[i].free && memory[i].size >= size) {
          if (memory[i].size > worstSize) {
            worstSize = memory[i].size;
            worstIdx = i;
          }
        }
      }
      if (worstIdx !== -1) {
        steps.push({ idx: worstIdx, success: true });
        idx = worstIdx;
      }
    } else if (algo === 'next-fit' || algo === 'next') {
      const n = memory.length;
      for (let offset = 0; offset < n; offset++) {
        const i = (nextFitPointer + offset) % n;
        steps.push({ idx: i, success: memory[i].free && memory[i].size >= size });
        if (memory[i].free && memory[i].size >= size) {
          nextFitPointer = i;
          idx = i;
          break;
        }
      }
    }
    return { idx, steps };
  }

  // ── Core Allocate ──────────────────────────────────────────────

  let animQueue = [];
  let currentAnimStep = 0;
  let isPlaying = false;
  let isPaused = false;
  let animContext = null;

  function allocate() {
    if (animContext) return; // Wait until current anim is done

    const name = document.getElementById('proc-name').value.trim() || 'P?';
    const size = parseInt(document.getElementById('proc-size').value);
    const algo = document.getElementById('algo-select').value;

    if (!size || size <= 0 || size >= MEMORY_SIZE) {
      addLog(`✗ Invalid size: ${size} KB`, 'fail');
      animateOverflow();
      return;
    }

    if (memory.some(s => !s.free && s.name === name)) {
      addLog(`✗ Process "${name}" already exists.`, 'fail');
      return;
    }

    const { idx, steps } = getAlgoSteps(algo, size);

    // Save allocation context to apply after animation
    animContext = { idx, size, name, algo };
    animQueue = steps;
    currentAnimStep = 0;

    isPlaying = true;
    isPaused = false;
    document.getElementById('play-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    document.getElementById('step-btn').disabled = true;
    
    runAnimQueue();
  }

  function runAnimQueue() {
    if (!animQueue || isPaused) return;

    if (currentAnimStep >= animQueue.length) {
      finishAllocation();
      return;
    }

    executeStep(animQueue[currentAnimStep], () => {
      currentAnimStep++;
      if (isPlaying && !isPaused) {
        runAnimQueue();
      }
    });
  }

  function executeStep(step, onComplete) {
    const blocks = document.querySelectorAll('#mem-bar .mem-seg');
    if (step.idx >= blocks.length) return onComplete();

    const target = blocks[step.idx];
    const speed = parseInt(document.getElementById('anim-speed').value) || 5;
    const duration = Math.max(0.1, 1.2 - (speed * 0.1));

    let flashColor = step.success ? '#39ff14' : (step.checking ? '#ffd700' : '#ff3860');

    gsap.to(target, {
      backgroundColor: flashColor,
      color: '#000',
      scale: 1.05,
      duration: duration / 2,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Reset styles removed by gsap
        gsap.set(target, { clearProps: "all" });
        onComplete();
      }
    });
  }

  function finishAllocation() {
    if (!animContext) return;
    const { idx, size, name, algo } = animContext;
    animContext = null;
    animQueue = [];
    currentAnimStep = 0;
    isPlaying = false;
    isPaused = false;
    document.getElementById('play-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('step-btn').disabled = false;

    if (idx === -1) {
      addLog(`✗ [${algo}] Cannot allocate ${size} KB for "${name}" — not enough contiguous space.`, 'fail');
      animateOverflow();
      return;
    }

    const seg = memory[idx];
    const color = PROC_COLORS[colorIndex % PROC_COLORS.length];
    colorIndex++;

    const newSeg = { start: seg.start, size, free: false, name, color };
    const remainder = seg.size - size;

    if (remainder > 0) {
      const freeSeg = { start: seg.start + size, size: remainder, free: true };
      memory.splice(idx, 1, newSeg, freeSeg);
    } else {
      memory.splice(idx, 1, newSeg);
    }

    addLog(`✓ [${algo}] "${name}" → ${size} KB @ ${newSeg.start}–${newSeg.start + size} KB`, 'success');

    const match = name.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      document.getElementById('proc-name').value = match[1] + (parseInt(match[2]) + 1);
    }

    renderAll();
  }

  function animateOverflow() {
    const bar = document.getElementById('mem-bar');
    gsap.to(bar, {
      x: 10,
      duration: 0.1,
      yoyo: true,
      repeat: 5,
      borderColor: '#ff3860',
      onComplete: () => {
        gsap.set(bar, { clearProps: "all" });
      }
    });
  }

  function deallocate(name) {
    const idx = memory.findIndex(s => !s.free && s.name === name);
    if (idx === -1) return;
    const seg = memory[idx];
    memory[idx] = { start: seg.start, size: seg.size, free: true };
    addLog(`↩ Deallocated "${name}" (${seg.size} KB freed @ ${seg.start} KB)`, 'warn');
    mergeFree();
    renderAll();
  }

  function mergeFree() {
    for (let i = 0; i < memory.length - 1; ) {
      if (memory[i].free && memory[i + 1].free) {
        memory[i].size += memory[i + 1].size;
        memory.splice(i + 1, 1);
      } else {
        i++;
      }
    }
  }

  function compact() {
    const procs = memory.filter(s => !s.free);
    let cursor = 0;
    const compacted = procs.map(s => {
      const ns = { ...s, start: cursor };
      cursor += s.size;
      return ns;
    });
    const totalFree = MEMORY_SIZE - cursor;
    if (totalFree > 0) compacted.push({ start: cursor, size: totalFree, free: true });
    memory = compacted;
    addLog(`⚡ Compaction complete. Free space consolidated: ${totalFree} KB @ ${cursor} KB`, 'info');
    renderAll();
  }

  function resetSim() {
    memory = [{ start: 0, size: MEMORY_SIZE, free: true }];
    nextFitPointer = 0;
    colorIndex = 0;
    document.getElementById('proc-name').value = 'P1';
    document.getElementById('proc-size').value = '30';
    document.getElementById('sim-log').innerHTML = '';
    addLog('System reset. 200 KB available.', 'info');
    renderAll();
  }

  // ── Render ─────────────────────────────────────────────────────

  function renderAll() {
    renderMemBar();
    renderTable();
    renderStats();
  }

  function renderMemBar() {
    const bar = document.getElementById('mem-bar');
    const legend = document.getElementById('mem-bar-legend');
    bar.innerHTML = '';
    legend.innerHTML = '';

    memory.forEach(seg => {
      const pct = (seg.size / MEMORY_SIZE * 100).toFixed(2);
      const div = document.createElement('div');
      div.className = 'mem-seg' + (seg.free ? ' free' : '');
      div.style.width = pct + '%';
      div.style.minWidth = '2px';

      if (!seg.free) {
        div.style.background = seg.color;
        div.style.color = '#000';
        div.textContent = seg.size >= 8 ? `${seg.name}\n${seg.size}K` : '';
        div.title = `${seg.name}: ${seg.start}–${seg.start + seg.size} KB (${seg.size} KB)`;

        // Legend
        const li = document.createElement('div');
        li.className = 'legend-item';
        li.innerHTML = `<div class="legend-dot" style="background:${seg.color}"></div>${seg.name} (${seg.size} KB)`;
        legend.appendChild(li);
      } else {
        div.textContent = seg.size >= 10 ? `free\n${seg.size}K` : '';
        div.title = `Free: ${seg.start}–${seg.start + seg.size} KB (${seg.size} KB)`;
      }

      bar.appendChild(div);
    });
  }

  function renderTable() {
    const tbody = document.getElementById('proc-tbody');
    const procs = memory.filter(s => !s.free);
    tbody.innerHTML = '';

    if (procs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No processes allocated.</td></tr>`;
      return;
    }

    procs.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span style="display:inline-block;width:10px;height:10px;background:${s.color};border-radius:2px;margin-right:8px"></span>${s.name}</td>
        <td>${s.start}</td>
        <td>${s.size}</td>
        <td>${s.start + s.size}</td>
        <td><button class="del-btn" onclick="window.simAPI.deallocate('${s.name}')">Free</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderStats() {
    const used = memory.filter(s => !s.free).reduce((a, s) => a + s.size, 0);
    const free = MEMORY_SIZE - used;
    const freeSegs = memory.filter(s => s.free);
    const holes = freeSegs.length;
    const maxFreeBlock = freeSegs.length ? Math.max(...freeSegs.map(s => s.size)) : 0;
    const extFrag = free > 0 ? Math.round((1 - maxFreeBlock / free) * 100) : 0;
    const procs = memory.filter(s => !s.free).length;

    document.getElementById('s-used').textContent = used + ' KB';
    document.getElementById('s-free').textContent = free + ' KB';
    document.getElementById('s-frag').textContent = extFrag + '%';
    document.getElementById('s-holes').textContent = holes;
    document.getElementById('s-procs').textContent = procs;
  }

  // ── Log ────────────────────────────────────────────────────────

  function addLog(msg, type = 'info') {
    const log = document.getElementById('sim-log');
    const ts = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = `[${ts}] ${msg}`;
    log.insertBefore(div, log.firstChild);
    if (log.children.length > 50) log.removeChild(log.lastChild);
  }

  // ── GSAP UI & Dynamic Memory Handlers ────────────────────────────

  function updateMemorySize(val) {
    const newSize = parseInt(val);
    document.getElementById('mem-size-val').textContent = newSize;
    
    // Quick reallocation logic for slider change
    const used = memory.filter(s => !s.free).reduce((a, s) => a + s.size, 0);
    if (newSize < used) {
      addLog(`✗ Cannot shrink memory below ${used} KB (currently occupied).`, 'fail');
      document.getElementById('mem-size-slider').value = MEMORY_SIZE;
      document.getElementById('mem-size-val').textContent = MEMORY_SIZE;
      animateOverflow();
      return;
    }
    
    // Overwrite total free segment bounds
    MEMORY_SIZE = newSize;
    compact(); // This will consolidate everything and recalculate the single trailing free block
    addLog(`⟷ Memory resized to ${MEMORY_SIZE} KB.`, 'info');
  }

  function playAnim() {
    isPlaying = true;
    isPaused = false;
    document.getElementById('play-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    document.getElementById('step-btn').disabled = true;
    runAnimQueue();
  }

  function pauseAnim() {
    isPaused = true;
    document.getElementById('play-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('step-btn').disabled = false;
  }

  function stepAnim() {
    if (!animContext) return;
    if (currentAnimStep >= animQueue.length) {
      finishAllocation();
      return;
    }
    document.getElementById('play-btn').disabled = false;
    executeStep(animQueue[currentAnimStep], () => {
      currentAnimStep++;
    });
  }

  // ── Expose globally ────────────────────────────────────────────

  window.allocate = allocate;
  window.compact = compact;
  window.resetSim = resetSim;
  window.simAPI = { deallocate, addLog, updateMemorySize, play: playAnim, pause: pauseAnim, step: stepAnim };

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    addLog('Memory initialized. 200 KB available. Choose an algorithm and allocate.', 'info');
  });

})();
