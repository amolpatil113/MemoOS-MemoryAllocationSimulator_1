/* three-scene.js — Scroll-driven 3D memory grid using Three.js r128 */

(function () {
  'use strict';

  // ── Setup ────────────────────────────────────────────────────────
  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4, 18);
  camera.lookAt(0, 0, 0);

  // ── Resize ───────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // ── Lights ───────────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0x0a1520, 1.5);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0x00d4ff, 1.2);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);
  const pointLight = new THREE.PointLight(0xff6b35, 2, 30);
  pointLight.position.set(-5, 3, 0);
  scene.add(pointLight);

  // ── Memory Block Grid ────────────────────────────────────────────
  const COLS = 20;
  const ROWS = 5;
  const TOTAL = COLS * ROWS;
  const blockSize = 0.8;
  const gap = 0.15;
  const step = blockSize + gap;

  const blocks = [];
  const blockStates = new Array(TOTAL).fill(0); // 0=free, 1-5=process colors

  const PROCESS_COLORS = [
    0x00d4ff, // cyan
    0xff6b35, // orange
    0x39ff14, // green
    0xffd700, // gold
    0xff3860, // red
    0xb44fff, // purple
  ];

  const FREE_COLOR = 0x0d1520;
  const FREE_EMISSIVE = 0x001822;

  const blockGeo = new THREE.BoxGeometry(blockSize, blockSize * 0.5, blockSize);

  for (let i = 0; i < TOTAL; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: FREE_COLOR,
      emissive: FREE_EMISSIVE,
      emissiveIntensity: 0.3,
      metalness: 0.6,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(blockGeo, mat);
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = (col - COLS / 2) * step + step / 2;
    const y = (ROWS / 2 - row) * step;
    mesh.position.set(x, y, 0);
    mesh.userData = { originalY: y, index: i };
    scene.add(mesh);
    blocks.push(mesh);
  }

  // Wireframe overlay for grid look
  const wireGeo = new THREE.BoxGeometry(blockSize + 0.02, blockSize * 0.5 + 0.02, blockSize + 0.02);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x1a3a4a, wireframe: true });
  blocks.forEach(b => {
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.copy(b.position);
    scene.add(wire);
  });

  // ── Particle Field (background stars) ───────────────────────────
  const partCount = 600;
  const partGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const partMat = new THREE.PointsMaterial({ color: 0x1a3a5a, size: 0.08 });
  scene.add(new THREE.Points(partGeo, partMat));

  // ── Scroll State ─────────────────────────────────────────────────
  let scrollProgress = 0; // 0 to 1

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const maxScroll = document.getElementById('scroll-container').offsetHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
    document.getElementById('scroll-pct').textContent = Math.round(scrollProgress * 100) + '%';
  }

  window.addEventListener('scroll', updateScrollProgress);

  // ── Scene keyframes ───────────────────────────────────────────────
  // p = 0.0 → 0.2: hero — grid dormant, camera far
  // p = 0.2 → 0.4: first fit fills left to right
  // p = 0.4 → 0.5: best fit — colored blocks scattered
  // p = 0.5 → 0.65: worst fit — big block highlighted
  // p = 0.65 → 0.8: fragmentation — random holes
  // p = 0.8 → 0.9: paging — uniform grid coloring
  // p = 0.9 → 1.0: CTA — camera pull back + pulse

  function lerp(a, b, t) { return a + (b - a) * Math.clamp(t, 0, 1); }
  Math.clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);

  function invlerp(a, b, v) { return Math.clamp((v - a) / (b - a), 0, 1); }
  function rangelerp(a, b, c, d, v) { return lerp(c, d, invlerp(a, b, v)); }

  let animatedBlocks = new Set();

  function setBlockColor(idx, color, emissive, emissiveIntensity = 0.6) {
    if (idx < 0 || idx >= blocks.length) return;
    const mat = blocks[idx].material;
    mat.color.setHex(color);
    mat.emissive.setHex(emissive);
    mat.emissiveIntensity = emissiveIntensity;
  }

  function resetAllBlocks() {
    blocks.forEach((b, i) => {
      setBlockColor(i, FREE_COLOR, FREE_EMISSIVE, 0.3);
      blockStates[i] = 0;
      b.scale.y = 1;
    });
  }

  let lastScene = -1;

  function applySceneState(p) {
    // ─ HERO (0 → 0.18) ─
    if (p < 0.18) {
      if (lastScene !== 0) {
        resetAllBlocks();
        lastScene = 0;
        // Subtle pulse on a few blocks
        [0, 5, 12, 19, 25, 31, 37, 42, 48, 55, 62, 71, 78, 85, 92].forEach(i => {
          setBlockColor(i, 0x001a2a, 0x003040, 0.4);
        });
      }
    }
    // ─ FIRST FIT (0.18 → 0.36) ─
    else if (p < 0.36) {
      if (lastScene !== 1) {
        resetAllBlocks();
        lastScene = 1;
      }
      const t = invlerp(0.18, 0.36, p);
      const filled = Math.floor(t * 50);
      for (let i = 0; i < TOTAL; i++) {
        if (i < 10) { setBlockColor(i, 0x00d4ff, 0x002a44, 0.7); blockStates[i] = 1; }
        else if (i < 10 + filled && i < 50) {
          const c = [0x39ff14, 0xff6b35, 0xffd700, 0xb44fff][i % 4];
          setBlockColor(i, c, 0x001510, 0.6);
          blockStates[i] = 2;
        } else {
          setBlockColor(i, FREE_COLOR, FREE_EMISSIVE, 0.2);
        }
      }
    }
    // ─ BEST FIT (0.36 → 0.52) ─
    else if (p < 0.52) {
      if (lastScene !== 2) {
        resetAllBlocks();
        lastScene = 2;
        const bestFitPattern = [0,1,5,6,7,12,13,20,25,26,30,31,32,40,41,42,50,51,60,61,70,75,80,85,90,91,92,93,95,96];
        bestFitPattern.forEach((i, idx) => {
          const c = PROCESS_COLORS[idx % PROCESS_COLORS.length];
          setBlockColor(i, c, 0x001010, 0.7);
          blockStates[i] = idx % 5 + 1;
        });
      }
    }
    // ─ WORST FIT (0.52 → 0.64) ─
    else if (p < 0.64) {
      if (lastScene !== 3) {
        resetAllBlocks();
        lastScene = 3;
        // Large contiguous block highlighted
        for (let i = 0; i < 30; i++) {
          setBlockColor(i, 0xff6b35, 0x2a1000, 0.9);
          blockStates[i] = 3;
        }
        for (let i = 40; i < 55; i++) {
          setBlockColor(i, 0xffd700, 0x2a2000, 0.7);
          blockStates[i] = 4;
        }
        for (let i = 70; i < 80; i++) {
          setBlockColor(i, 0xff3860, 0x2a0010, 0.6);
          blockStates[i] = 5;
        }
      }
    }
    // ─ FRAGMENTATION (0.64 → 0.78) ─
    else if (p < 0.78) {
      if (lastScene !== 4) {
        resetAllBlocks();
        lastScene = 4;
        // Swiss cheese pattern
        const allocated = [0,1,3,4,6,8,10,11,14,16,17,19,21,23,24,27,29,31,33,35,36,38,40,42,43,46,48,50,52,54,55,58,60,62,63,66,68,70,71,74,76,78,80,82,83,86,88,90,91,94,96,98];
        allocated.forEach((i, idx) => {
          const c = PROCESS_COLORS[idx % PROCESS_COLORS.length];
          setBlockColor(i, c, 0x001010, 0.5);
          blockStates[i] = (idx % 5) + 1;
        });
        // Free holes between allocated
        for (let i = 0; i < TOTAL; i++) {
          if (!allocated.includes(i)) {
            setBlockColor(i, 0x0d0d0d, 0x0a0a0a, 0.1);
          }
        }
        // Update frag stats
        const efEl = document.getElementById('ext-frag');
        const ifEl = document.getElementById('int-frag');
        const hcEl = document.getElementById('holes-count');
        if (efEl) efEl.textContent = '42%';
        if (ifEl) ifEl.textContent = '8 KB';
        if (hcEl) hcEl.textContent = '18';
      }
    }
    // ─ PAGING (0.78 → 0.92) ─
    else if (p < 0.92) {
      if (lastScene !== 5) {
        resetAllBlocks();
        lastScene = 5;
        const frameColors = [0x00d4ff, 0x39ff14, 0xff6b35, 0xffd700, 0xb44fff];
        blocks.forEach((b, i) => {
          const frameOwner = Math.floor(i / 4) % 5;
          const c = frameColors[frameOwner];
          setBlockColor(i, c, 0x001010, 0.5);
          blockStates[i] = frameOwner + 1;
        });
        // Build paging grid UI
        buildPagingGrid();
      }
    }
    // ─ CTA (0.92 → 1.0) ─
    else {
      if (lastScene !== 6) {
        resetAllBlocks();
        lastScene = 6;
        blocks.forEach((b, i) => {
          const c = PROCESS_COLORS[i % PROCESS_COLORS.length];
          setBlockColor(i, c, 0x001010, 0.6);
        });
      }
    }
  }

  function buildPagingGrid() {
    const grid = document.getElementById('paging-grid');
    const rows = document.getElementById('page-table-rows');
    if (!grid || !rows) return;
    grid.innerHTML = '';
    rows.innerHTML = '';
    const processes = ['P0','P1','P2','P3','P4'];
    const frameColors2 = ['#00d4ff','#39ff14','#ff6b35','#ffd700','#b44fff'];
    const frameCount = 20;
    for (let f = 0; f < frameCount; f++) {
      const owner = f % 5;
      const div = document.createElement('div');
      div.className = 'frame-cell occupied';
      div.style.background = frameColors2[owner];
      div.textContent = `F${f}`;
      grid.appendChild(div);
    }
    for (let p = 0; p < 5; p++) {
      for (let pg = 0; pg < 2; pg++) {
        const row = document.createElement('div');
        row.className = 'pt-row';
        row.innerHTML = `<span>${processes[p]}/Pg${pg}</span><span>Frame ${p * 2 + pg}</span>`;
        rows.appendChild(row);
      }
    }
  }

  // ── Camera animation based on scroll ─────────────────────────────
  function updateCamera(p) {
    // p: 0 → 1
    let cx, cy, cz, lx, ly;

    if (p < 0.18) {
      // Hero: camera far, slightly above
      const t = invlerp(0, 0.18, p);
      cx = lerp(0, 0, t);
      cy = lerp(6, 4, t);
      cz = lerp(22, 18, t);
      lx = 0; ly = 0;
    } else if (p < 0.36) {
      // First fit: sweep left to right
      const t = invlerp(0.18, 0.36, p);
      cx = lerp(-8, 6, t);
      cy = lerp(4, 3, t);
      cz = lerp(14, 14, t);
      lx = lerp(-8, 6, t); ly = 1;
    } else if (p < 0.52) {
      // Best fit: rise above, look down
      const t = invlerp(0.36, 0.52, p);
      cx = lerp(6, 0, t);
      cy = lerp(3, 10, t);
      cz = lerp(14, 16, t);
      lx = 0; ly = 0;
    } else if (p < 0.64) {
      // Worst fit: side angle
      const t = invlerp(0.52, 0.64, p);
      cx = lerp(0, -10, t);
      cy = lerp(10, 4, t);
      cz = lerp(16, 14, t);
      lx = lerp(0, 2, t); ly = 1;
    } else if (p < 0.78) {
      // Fragmentation: close up, scan
      const t = invlerp(0.64, 0.78, p);
      cx = lerp(-10, 0, t);
      cy = lerp(4, 2, t);
      cz = lerp(14, 12, t);
      lx = 0; ly = 0;
    } else if (p < 0.92) {
      // Paging: pull back, isometric-ish
      const t = invlerp(0.78, 0.92, p);
      cx = lerp(0, 0, t);
      cy = lerp(2, 8, t);
      cz = lerp(12, 20, t);
      lx = 0; ly = 0;
    } else {
      // CTA: dramatic pull back
      const t = invlerp(0.92, 1.0, p);
      cx = lerp(0, 0, t);
      cy = lerp(8, 5, t);
      cz = lerp(20, 26, t);
      lx = 0; ly = 0;
    }

    camera.position.x += (cx - camera.position.x) * 0.06;
    camera.position.y += (cy - camera.position.y) * 0.06;
    camera.position.z += (cz - camera.position.z) * 0.06;
    camera.lookAt(lx, ly, 0);
  }

  // ── Block animation — float + pulse ──────────────────────────────
  let clock = 0;

  function animateBlocks(dt) {
    clock += dt;
    blocks.forEach((b, i) => {
      const baseY = b.userData.originalY;
      const state = blockStates[i];
      if (state > 0) {
        // Occupied: gentle float
        b.position.y = baseY + Math.sin(clock * 0.8 + i * 0.3) * 0.04;
        b.material.emissiveIntensity = 0.5 + Math.sin(clock * 1.2 + i * 0.5) * 0.15;
      } else {
        // Free: subtle breathe
        b.position.y = baseY + Math.sin(clock * 0.4 + i * 0.2) * 0.02;
        b.material.emissiveIntensity = 0.15 + Math.sin(clock * 0.6 + i * 0.3) * 0.05;
      }
    });
    // Rotate point light slowly
    pointLight.position.x = Math.sin(clock * 0.3) * 10;
    pointLight.position.z = Math.cos(clock * 0.3) * 5;
  }

  // ── Render loop ───────────────────────────────────────────────────
  let last = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    applySceneState(scrollProgress);
    updateCamera(scrollProgress);
    animateBlocks(dt);

    renderer.render(scene, camera);
  }

  animate();

  // ── Expose for simulator to drive block colors ────────────────────
  window.threeScene = {
    setBlockColor,
    resetAllBlocks,
    blocks,
    blockStates,
    PROCESS_COLORS,
    FREE_COLOR,
    FREE_EMISSIVE,
  };

})();
