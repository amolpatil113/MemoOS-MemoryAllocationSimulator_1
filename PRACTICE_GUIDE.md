# Memory Allocation Practice Section - Usage Guide

## Overview

The enhanced Memory Allocation Simulator now includes a powerful **Custom Problem Loader** that allows you to:
- Load custom memory partitions and process sizes
- Compare allocation algorithms (First Fit, Best Fit, Worst Fit, Next Fit)
- Step through allocations interactively
- Preview exam problems with pre-loaded examples
- Get real-time statistics and algorithm explanations

## Features

### 1. Custom Problem Loader Panel

Located at the top of the simulator section, this panel includes:

#### Input Fields:
- **Memory Blocks (KB)**: Comma-separated memory partition sizes
  - Example: `200,400,600,500,300,250`
  - Creates 6 memory blocks of 200, 400, 600, 500, 300, and 250 KB

- **Process Sizes (KB)**: Comma-separated process sizes to allocate
  - Example: `357,210,468,491`
  - Four processes of 357, 210, 468, and 491 KB

- **Select Algorithm**: Choose from:
  - **First Fit**: Allocates to the first block large enough
  - **Best Fit**: Allocates to the smallest suitable block
  - **Worst Fit**: Allocates to the largest available block
  - **Next Fit**: Continues from the last allocation point

#### Quick Load Options:
- **Sample Problems dropdown**: Pre-configured exam problems
  - Exam Problem 1: Classic exam question
  - Exam Problem 2: Complex fragmentation scenario
  - Fragmentation Demo: Demonstrates external fragmentation
  - Simple Example: Basic 3-block scenario

#### Buttons:
- **Load Problem**: Parses your input and initializes the simulator
- **Reset to Default**: Restores the original 200 KB single-block configuration

### 2. Problem Statistics

When you load a problem, the panel displays:
- **Total Memory**: Sum of all memory blocks (KB)
- **Total Processes**: Sum of all process sizes (KB)
- **Utilization**: Percentage of memory that processes occupy
- **Blocks / Processes**: Count of memory blocks and processes

### 3. Algorithm Explanation

After loading a problem, an explanation appears below the statistics:

```
FIRST FIT: Scans memory from the beginning and allocates the first free 
block that is large enough. Fast but may cause fragmentation early in memory.
```

Each algorithm has a unique explanation to help you understand:
- **How it works**
- **When it's best**
- **Performance characteristics**
- **Fragmentation impact**

### 4. Input Validation

The loader validates your inputs and shows helpful error messages:

| Error | Fix |
|-------|-----|
| "Memory blocks list is empty" | Enter at least one block size |
| "Processes list is empty" | Enter at least one process size |
| "Invalid memory blocks format" | Use comma-separated numbers (e.g., 100,200,300) |
| "Invalid processes format" | Use comma-separated numbers (e.g., 50,75,100) |
| "Process X exceeds total memory" | Reduce process sizes or add more memory |

### 5. Manual Allocation Controls

After loading a problem:

1. **Process Name**: Auto-increments (P1, P2, P3...)
2. **Size (KB)**: Auto-populates with the next process size
3. **Algorithm**: Matches your selected algorithm
4. **Allocate**: Allocates one process at a time with animation
5. **Compact Memory**: Consolidates free space
6. **Reset**: Clears all allocations

### 6. Step-by-Step Visualization

As you allocate processes:
- **Memory Bar** updates in real-time showing used vs free space
- **Color-coded blocks** represent different processes
- **Animation highlights** which memory block is being checked/allocated
- **Process Table** shows allocation details:
  - Process name and size
  - Starting address and ending address
  - Free button to deallocate

### 7. Statistics Panel

Real-time stats show:
- **Used**: Total memory used by processes (KB)
- **Free**: Remaining unallocated memory (KB)
- **Ext. Frag**: External fragmentation percentage
- **Holes**: Number of free memory gaps
- **Processes**: Count of allocated processes

### 8. Allocation Log

All operations are logged with timestamps:
```
[12:34:56] 📋 Loaded custom problem: 6 blocks (2250 KB total), 4 processes
[12:34:56] Memory: [200, 400, 600, 500, 300, 250] KB
[12:34:56] Processes: [357, 210, 468, 491] KB
[12:34:57] ✓ [first-fit] "P1" → 357 KB @ 400–757 KB
[12:34:58] ✓ [first-fit] "P2" → 210 KB @ 200–410 KB
```

## Usage Examples

### Example 1: Classic Exam Problem

1. Enter Memory Blocks: `200,400,600,500,300,250`
2. Enter Processes: `357,210,468,491`
3. Select Algorithm: **First Fit**
4. Click **Load Problem**
5. Click **Allocate** to execute step-by-step

**Expected Results:**
- P1 (357 KB): Allocated to Block 2 (400 KB)
- P2 (210 KB): Allocated to Block 1 (200 KB) with 10 KB waste
- P3 (468 KB): Allocated to Block 3 (600 KB)
- P4 (491 KB): Allocated to Block 4 (500 KB)

### Example 2: Fragmentation Demo

1. Click **Sample Problems** dropdown
2. Select **Fragmentation Demo**
3. Select **Best Fit** algorithm
4. Click **Load Problem**
5. Allocate all processes
6. Click **Compact Memory** to see the difference

### Example 3: Algorithm Comparison

To compare algorithms on the same problem:

1. Load Problem: `500,300,200` with processes `250,150,100`
2. Try **First Fit**, note results
3. Click **Reset**
4. Reload same problem
5. Try **Best Fit**, compare results
6. Repeat for **Worst Fit** and **Next Fit**

## Advanced Features

### Speed Control

The animation speed slider (1-10) controls how fast allocations are highlighted:
- **Low (1-3)**: Slow, good for learning
- **Medium (5-6)**: Balanced
- **High (8-10)**: Fast playback

### Playback Controls

- **Play**: Resume animated allocation (auto-plays by default)
- **Pause**: Pause animation to examine current state
- **Step**: Execute one check at a time for detailed learning

### Memory Size Slider

Adjust total available memory dynamically (50-2000 KB):
- Useful for testing different scenarios
- Can't shrink below currently used memory
- Automatically recalculates fragmentation

## JavaScript API

For developers integrating this into other projects:

```javascript
// Load custom problem
window.simAPI.resetSimulatorState(memoryBlocks, processes, algorithm);

// Allocate next process in queue
window.allocateNextProcess();

// Show allocation summary
window.showProcessAllocationSummary();

// Practice API - Parse and validate
window.practiceAPI.validateConfig(memory, processes);
window.practiceAPI.analyzeProblem(memory, processes);
```

### Available Practice API Functions

```javascript
// Parsing
practiceAPI.parseInput(inputStr) // "100,200,300" → [100, 200, 300]

// Validation
practiceAPI.validateConfig(memory, processes) // Returns {valid, error}

// Analysis
practiceAPI.analyzeProblem(memory, processes) 
// Returns {totalMemory, totalProcess, utilizationRatio, ...}

// UI Updates
practiceAPI.displayProblemAnalysis(memory, processes)
practiceAPI.showAlgorithmExplanation(algorithm)

// Sample Problems
practiceAPI.SAMPLE_PROBLEMS // Access all pre-loaded problems
practiceAPI.ALGO_EXPLANATIONS // Access explanations
```

## Keyboard Shortcuts

- **Enter** in input fields: Load problem
- **Ctrl+R**: Reset to default
- **Space**: Play/Pause animation

## Tips & Best Practices

1. **Start Simple**: Use the sample problems first
2. **Step Through**: Use Step button for educational purposes
3. **Compare Algorithms**: Load same problem with different algorithms
4. **Check Statistics**: Watch fragmentation increase over time
5. **Use Compact**: See how compaction affects fragmentation

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Simulator not ready" | Refresh the page, wait for scripts to load |
| Input fields don't respond | Ensure JavaScript is enabled |
| Memory not updating | Check browser console for errors |
| Allocations fail | Verify process sizes don't exceed total memory |
| Animations too fast/slow | Adjust animation speed slider |

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: GSAP 3.12+ for animations
- **Algorithms**: Pure JavaScript implementations
- **Memory Model**: Contiguous memory with first-fit, best-fit, worst-fit, next-fit

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

To add new sample problems, edit `practice.js`:

```javascript
const SAMPLE_PROBLEMS = {
  myProblem: {
    name: 'My Problem Name',
    memory: [100, 200, 300],
    processes: [50, 150, 75]
  }
};
```

Then it appears in the Sample Problems dropdown.

---

**Version**: 1.0  
**Last Updated**: 2025  
**Status**: Production Ready
