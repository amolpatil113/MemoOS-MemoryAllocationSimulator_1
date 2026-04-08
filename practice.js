/* practice.js — Custom Problem Loader for Memory Allocation Simulator */

(function () {
  'use strict';

  // ── Default Configuration ──────────────────────────────────────
  const DEFAULT_CONFIG = {
    memory: [200],
    processes: []
  };

  const SAMPLE_PROBLEMS = {
    exam1: {
      name: 'Exam Problem 1',
      memory: [200, 400, 600, 500, 300, 250],
      processes: [357, 210, 468, 491]
    },
    exam2: {
      name: 'Exam Problem 2',
      memory: [100, 500, 200, 300, 600],
      processes: [212, 417, 112, 426]
    },
    exam3: {
      name: 'Fragmentation Demo',
      memory: [150, 250, 100, 200],
      processes: [80, 120, 60, 90, 75]
    },
    simple: {
      name: 'Simple Example',
      memory: [300, 400, 500],
      processes: [100, 200, 150, 250]
    }
  };

  // Algorithm explanations
  const ALGO_EXPLANATIONS = {
    'first-fit': 'Scans memory from the beginning and allocates to the <strong>first free block</strong> that is large enough. Fast but may cause fragmentation early in memory.',
    'best-fit': 'Scans <strong>all</strong> free blocks and allocates to the block that wastes the <strong>least space</strong>. Slower but minimizes wasted memory.',
    'worst-fit': 'Scans all free blocks and allocates to the <strong>largest</strong> available block. Theory: leaves large remainders. Practice: wastes memory.',
    'next-fit': 'Like First Fit, but continues searching from where the last allocation ended instead of starting from the beginning. Moderate performance.'
  };

  // ── Parse and Validate Input ───────────────────────────────────

  function parseInput(inputStr) {
    if (!inputStr || typeof inputStr !== 'string') return null;
    
    const parts = inputStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseInt(s, 10));

    // Validate: all must be positive integers
    if (parts.some(p => !Number.isInteger(p) || p <= 0)) {
      return null;
    }

    return parts;
  }

  function validateConfig(memory, processes) {
    if (!memory || memory.length === 0) {
      return { valid: false, error: 'Memory blocks list is empty.' };
    }

    if (!processes || processes.length === 0) {
      return { valid: false, error: 'Processes list is empty.' };
    }

    const totalMemory = memory.reduce((a, b) => a + b, 0);
    const processesTooLarge = processes.filter(p => p > totalMemory);
    
    if (processesTooLarge.length > 0) {
      return { 
        valid: false, 
        error: `Processes ${processesTooLarge.join(', ')} KB exceed total memory (${totalMemory} KB).` 
      };
    }

    return { valid: true };
  }

  // ── Load Configuration into Simulator ──────────────────────────

  function loadCustomProblem(memory, processes, algorithm) {
    // Validate inputs
    const validation = validateConfig(memory, processes);
    if (!validation.valid) {
      showError(validation.error);
      return false;
    }

    // Reset simulator with new configuration using the exposed API
    if (window.simAPI && window.simAPI.resetSimulatorState) {
      const result = window.simAPI.resetSimulatorState(memory, processes, algorithm);
      if (!result) {
        showError('Failed to load configuration into simulator');
        return false;
      }
    } else {
      console.error('Simulator API not available');
      showError('Simulator not ready. Please refresh the page.');
      return false;
    }

    // Set selected algorithm
    const algoSelect = document.getElementById('algo-select');
    if (algoSelect) {
      algoSelect.value = algorithm;
    }

    // Show success message and algorithm explanation
    showSuccess(`Loaded custom problem: ${memory.length} blocks, ${processes.length} processes`);
    showAlgorithmExplanation(algorithm);

    return true;
  }

  // ── UI Interactions ───────────────────────────────────────────

  function loadFromUI() {
    const memoryInput = document.getElementById('custom-memory-input');
    const processesInput = document.getElementById('custom-processes-input');
    const algoSelect = document.getElementById('custom-algo-select');

    if (!memoryInput || !processesInput || !algoSelect) {
      console.error('Input elements not found');
      return;
    }

    const memoryStr = memoryInput.value.trim();
    const processesStr = processesInput.value.trim();
    const algorithm = algoSelect.value;

    if (!memoryStr || !processesStr) {
      showError('Please enter values for both memory blocks and processes.');
      return;
    }

    const memory = parseInput(memoryStr);
    const processes = parseInput(processesStr);

    if (!memory) {
      showError('Invalid memory blocks format. Use comma-separated numbers.');
      memoryInput.classList.add('input-error');
      return;
    }

    if (!processes) {
      showError('Invalid processes format. Use comma-separated numbers.');
      processesInput.classList.add('input-error');
      return;
    }

    memoryInput.classList.remove('input-error');
    processesInput.classList.remove('input-error');

    loadCustomProblem(memory, processes, algorithm);
  }

  function loadSampleProblem(key) {
    const problem = SAMPLE_PROBLEMS[key];
    if (!problem) {
      console.error('Sample problem not found:', key);
      return;
    }

    const memoryInput = document.getElementById('custom-memory-input');
    const processesInput = document.getElementById('custom-processes-input');

    if (memoryInput) memoryInput.value = problem.memory.join(', ');
    if (processesInput) processesInput.value = problem.processes.join(', ');

    loadCustomProblem(problem.memory, problem.processes, 'first-fit');
  }

  function resetToDefault() {
    const memoryInput = document.getElementById('custom-memory-input');
    const processesInput = document.getElementById('custom-processes-input');
    const algoSelect = document.getElementById('custom-algo-select');

    if (memoryInput) memoryInput.value = DEFAULT_CONFIG.memory.join(', ');
    if (processesInput) processesInput.value = DEFAULT_CONFIG.processes.join(', ');
    if (algoSelect) algoSelect.value = 'first-fit';

    // Reset simulator
    if (window.practiceAPI && window.practiceAPI.resetSimulatorState) {
      window.practiceAPI.resetSimulatorState(DEFAULT_CONFIG.memory, DEFAULT_CONFIG.processes, 'first-fit');
    }

    showSuccess('Reset to default configuration: 200 KB total memory.');
  }

  // ── UI Utilities ───────────────────────────────────────────────

  function showError(message) {
    const container = document.getElementById('practice-message');
    if (!container) return;

    container.className = 'practice-message error';
    container.textContent = '✗ ' + message;
    container.style.display = 'block';

    setTimeout(() => {
      container.style.display = 'none';
    }, 5000);
  }

  function showSuccess(message) {
    const container = document.getElementById('practice-message');
    if (!container) return;

    container.className = 'practice-message success';
    container.textContent = '✓ ' + message;
    container.style.display = 'block';

    setTimeout(() => {
      container.style.display = 'none';
    }, 4000);
  }

  function showAlgorithmExplanation(algo) {
    const explanation = ALGO_EXPLANATIONS[algo] || '';
    const container = document.getElementById('algo-explanation');
    
    if (container) {
      if (explanation) {
        container.innerHTML = `<strong>${algo.replace('-', ' ').toUpperCase()}:</strong> ${explanation}`;
        container.style.display = 'block';
      } else {
        container.style.display = 'none';
      }
    }
  }

  // ── Statistics & Analysis ──────────────────────────────────────

  function analyzeProblem(memory, processes) {
    const totalMemory = memory.reduce((a, b) => a + b, 0);
    const totalProcess = processes.reduce((a, b) => a + b, 0);
    const utilizationRatio = (totalProcess / totalMemory * 100).toFixed(1);

    return {
      totalMemory,
      totalProcess,
      utilizationRatio,
      memoryBlocks: memory.length,
      processCount: processes.length,
      avgBlockSize: (totalMemory / memory.length).toFixed(1),
      avgProcessSize: (totalProcess / processes.length).toFixed(1)
    };
  }

  function displayProblemAnalysis(memory, processes) {
    const stats = analyzeProblem(memory, processes);
    const statsPanel = document.getElementById('practice-problem-stats');

    if (!statsPanel) return;

    const html = `
      <div class="stat-item">
        <span class="stat-label">Total Memory</span>
        <span class="stat-value">${stats.totalMemory} KB</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Processes</span>
        <span class="stat-value">${stats.totalProcess} KB</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Utilization</span>
        <span class="stat-value">${stats.utilizationRatio}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Blocks / Processes</span>
        <span class="stat-value">${stats.memoryBlocks} / ${stats.processCount}</span>
      </div>
    `;

    statsPanel.innerHTML = html;
  }

  // ── Initialize UI ──────────────────────────────────────────────

  function initUI() {
    // Event listeners for input fields
    const memoryInput = document.getElementById('custom-memory-input');
    const processesInput = document.getElementById('custom-processes-input');
    const loadBtn = document.getElementById('load-custom-problem-btn');
    const resetBtn = document.getElementById('reset-to-default-btn');
    const sampleSelect = document.getElementById('sample-problem-select');

    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        loadFromUI();
        const memoryInput = document.getElementById('custom-memory-input');
        const processesInput = document.getElementById('custom-processes-input');
        if (memoryInput && processesInput) {
          const memory = parseInput(memoryInput.value);
          const processes = parseInput(processesInput.value);
          if (memory && processes) {
            displayProblemAnalysis(memory, processes);
          }
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetToDefault);
    }

    if (sampleSelect) {
      sampleSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          loadSampleProblem(e.target.value);
          e.target.value = ''; // Reset dropdown
          const memoryInput = document.getElementById('custom-memory-input');
          const processesInput = document.getElementById('custom-processes-input');
          if (memoryInput && processesInput) {
            const memory = parseInput(memoryInput.value);
            const processes = parseInput(processesInput.value);
            if (memory && processes) {
              displayProblemAnalysis(memory, processes);
            }
          }
        }
      });
    }

    // Input error removal
    if (memoryInput) {
      memoryInput.addEventListener('input', function() {
        this.classList.remove('input-error');
      });
    }

    if (processesInput) {
      processesInput.addEventListener('input', function() {
        this.classList.remove('input-error');
      });
    }
  }

  // ── Expose API ─────────────────────────────────────────────────

  window.practiceAPI = {
    loadCustomProblem,
    loadFromUI,
    loadSampleProblem,
    resetToDefault,
    parseInput,
    validateConfig,
    analyzeProblem,
    displayProblemAnalysis,
    showAlgorithmExplanation,
    SAMPLE_PROBLEMS,
    ALGO_EXPLANATIONS
  };

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    try {
      console.log('Practice UI module loaded');
      initUI();
    } catch (err) {
      console.error('Error initializing practice UI:', err);
    }
  });

})();
