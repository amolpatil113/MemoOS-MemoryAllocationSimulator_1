/* main.js — Scroll observers, scene content, tabs, algo visuals */

(function () {
  'use strict';

  // ── Intersection Observer for scene fade-in ───────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.scene-content').forEach(el => observer.observe(el));

  // ── Build algo visuals ────────────────────────────────────────

  function buildAlgoVisual(containerId, pattern) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    pattern.forEach(seg => {
      const div = document.createElement('div');
      div.className = 'algo-block';
      div.style.width = seg.width + '%';
      div.style.background = seg.color;
      div.style.color = seg.free ? 'transparent' : '#000';
      div.textContent = seg.label || '';
      container.appendChild(div);
    });
  }

  // First Fit visual — sequential fill from left
  buildAlgoVisual('ff-visual', [
    { width: 15, color: '#00d4ff', label: 'P1·30K' },
    { width: 10, color: '#39ff14', label: 'P2·20K' },
    { width: 20, color: '#ff6b35', label: 'P3·40K' },
    { width: 8,  color: '#ffd700', label: 'P4' },
    { width: 47, color: '#0d1520', label: '── free ──', free: true },
  ]);

  // Best Fit visual — tight fitting
  buildAlgoVisual('bf-visual', [
    { width: 15, color: '#00d4ff', label: 'P1·30K' },
    { width: 5,  color: '#0d1520', label: '', free: true },
    { width: 8,  color: '#ffd700', label: 'P4' },
    { width: 20, color: '#ff6b35', label: 'P3·40K' },
    { width: 2,  color: '#0d1520', label: '', free: true },
    { width: 10, color: '#39ff14', label: 'P2·20K' },
    { width: 40, color: '#0d1520', label: '── free ──', free: true },
  ]);

  // Worst Fit visual — big block taken
  buildAlgoVisual('wf-visual', [
    { width: 50, color: '#ff6b35', label: 'P1 — largest block taken (100KB)' },
    { width: 10, color: '#0d1520', label: '', free: true },
    { width: 15, color: '#39ff14', label: 'P2' },
    { width: 25, color: '#0d1520', label: '── free ──', free: true },
  ]);

  // Fragmentation demo — swiss cheese
  function buildFragDemo() {
    const container = document.getElementById('frag-demo');
    if (!container) return;
    container.innerHTML = '';
    const pattern = [
      { w: 8, c: '#00d4ff' }, { w: 3, c: null }, { w: 6, c: '#ff6b35' },
      { w: 4, c: null }, { w: 10, c: '#39ff14' }, { w: 2, c: null },
      { w: 5, c: '#ffd700' }, { w: 3, c: null }, { w: 8, c: '#b44fff' },
      { w: 5, c: null }, { w: 7, c: '#00d4ff' }, { w: 2, c: null },
      { w: 9, c: '#ff3860' }, { w: 3, c: null }, { w: 5, c: '#39ff14' },
      { w: 2, c: null }, { w: 8, c: '#ffd700' }, { w: 4, c: null },
      { w: 5, c: '#ff6b35' },
    ];
    pattern.forEach(seg => {
      const div = document.createElement('div');
      div.className = 'algo-block';
      div.style.width = seg.w + '%';
      div.style.background = seg.c || '#050a10';
      if (!seg.c) {
        div.style.border = '1px dashed #1a3a4a';
        div.style.boxSizing = 'border-box';
      }
      container.appendChild(div);
    });
  }

  buildFragDemo();

  // ── Tab system & Dynamic Fetch ────────────────────────────────

  let algorithms = [];

  async function fetchAlgorithms() {
    try {
      const res = await fetch('http://localhost:3000/api/algorithms');
      algorithms = await res.json();
      renderTheoryTabs();
    } catch (err) {
      console.error('Failed to fetch algorithms:', err);
      document.getElementById('theory-tabs-container').innerHTML = 
        '<div style="padding:20px;color:var(--red);">Failed to connect to backend API.</div>';
    }
  }

  function renderTheoryTabs() {
    const tabsContainer = document.getElementById('theory-tabs-container');
    const contentContainer = document.getElementById('theory-content-container');
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    algorithms.forEach((algo, i) => {
      // Tab
      const btn = document.createElement('button');
      btn.className = `t-tab ${i === 0 ? 'active' : ''}`;
      btn.textContent = algo.name;
      btn.onclick = () => showTab(algo.slug);
      tabsContainer.appendChild(btn);

      // Panel
      const panel = document.createElement('div');
      panel.className = `t-panel ${i === 0 ? 'active' : ''}`;
      panel.id = `tab-${algo.slug}`;
      
      let stepsHtml = algo.steps.map((s, idx) => 
        `<div class="step">${idx + 1}. ${s.title}: ${s.description}</div>`
      ).join('');

      panel.innerHTML = `
        <h3>${algo.name}</h3>
        <p>${algo.description}</p>
        <div class="algo-steps">${stepsHtml}</div>
        <div class="complexity-box">
          <span>Time: ${algo.timeComplexity}</span>
          <span>Space: ${algo.spaceComplexity}</span>
          <span>Best for: ${algo.bestFor}</span>
        </div>
      `;
      contentContainer.appendChild(panel);
    });
  }

  window.showTab = function (id) {
    document.querySelectorAll('.t-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.t-panel').forEach(p => p.classList.remove('active'));

    const panel = document.getElementById('tab-' + id);
    if (panel) panel.classList.add('active');

    const idx = algorithms.findIndex(a => a.slug === id);
    if (idx !== -1) {
      document.querySelectorAll('.t-tab')[idx].classList.add('active');
    }
  };

  document.addEventListener('DOMContentLoaded', fetchAlgorithms);

  // ── Navbar active link on scroll ─────────────────────────────

  const sections = ['hero', 'scene-firstfit', 'simulator', 'theory'];
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 120) {
        current = '#' + id;
      }
    });
    navLinks.forEach(a => {
      a.style.color = a.getAttribute('href') === current
        ? 'var(--accent)'
        : 'var(--muted)';
    });
  });

  // ── Keyboard shortcut: Enter to allocate ─────────────────────

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement.closest('#simulator')) {
      window.allocate && window.allocate();
    }
  });

  // ── Random fill demo on load (populates algo visuals with animation)
  function animateAlgoVisuals() {
    const visuals = ['ff-visual', 'bf-visual', 'wf-visual'];
    visuals.forEach((id, vi) => {
      const container = document.getElementById(id);
      if (!container) return;
      const blocks = container.querySelectorAll('.algo-block');
      blocks.forEach((b, i) => {
        b.style.transform = 'scaleY(0)';
        b.style.transformOrigin = 'bottom';
        b.style.transition = `transform 0.4s ease ${vi * 0.2 + i * 0.05}s`;
        setTimeout(() => { b.style.transform = 'scaleY(1)'; }, 100);
      });
    });
  }

  // Trigger when algo sections enter viewport
  const algoSections = ['scene-firstfit', 'scene-bestfit', 'scene-worstfit'];
  const algoObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) animateAlgoVisuals();
    });
  }, { threshold: 0.3 });

  algoSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) algoObserver.observe(el);
  });

  // ── Frag stats counter animation ─────────────────────────────

  const fragObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter('ext-frag', 0, 42, '%', 1200);
        animateCounter('int-frag', 0, 8, ' KB', 1000);
        animateCounter('holes-count', 0, 18, '', 900);
      }
    });
  }, { threshold: 0.5 });

  const fragSection = document.getElementById('scene-frag');
  if (fragSection) fragObserver.observe(fragSection);

  function animateCounter(id, from, to, suffix, duration) {
    const el = document.getElementById(id);
    if (!el) return;
    const startTime = performance.now();
    function update(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (t < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ── Typing effect for hero title ─────────────────────────────

  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const lines = heroTitle.querySelectorAll('.line');
    lines.forEach((line, i) => {
      line.style.opacity = '0';
      line.style.transform = 'translateX(-30px)';
      line.style.transition = `opacity 0.6s ease ${i * 0.2}s, transform 0.6s ease ${i * 0.2}s`;
      setTimeout(() => {
        line.style.opacity = '1';
        line.style.transform = 'translateX(0)';
      }, 200 + i * 200);
    });
  }

  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    heroSub.style.opacity = '0';
    heroSub.style.transition = 'opacity 0.8s ease 0.8s';
    setTimeout(() => { heroSub.style.opacity = '1'; }, 100);
  }

})();
