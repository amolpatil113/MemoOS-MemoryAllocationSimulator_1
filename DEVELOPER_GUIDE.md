# 👨‍💻 Developer's Guide - Custom Problem Loader

## Architecture Overview

```
┌─────────────────────────────────────────┐
│        practice.js (Frontend Logic)     │
│  - Input parsing & validation           │
│  - UI event handling                    │
│  - Statistics calculation               │
└──────────────────┬──────────────────────┘
                   │
         Calls simAPI.resetSimulatorState()
                   │
                   ↓
┌─────────────────────────────────────────┐
│    simulator.js (Core Simulator)        │
│  - Memory state management              │
│  - Algorithm implementation             │
│  - Rendering & visualization            │
└──────────────────┬──────────────────────┘
                   │
         Updates DOM & CSS
                   │
                   ↓
┌─────────────────────────────────────────┐
│         index.html (Markup)            │
│    style.css (Representation)           │
└─────────────────────────────────────────┘
```

## File Dependencies

```
index.html
  ├── simulator.js (required)
  │   └── Uses: MEMORY_SIZE, memory[], algorithm functions
  ├── practice.js (optional, enhances simulator)
  │   └── Depends on: window.simAPI.resetSimulatorState()
  ├── style.css (required)
  │   └── Classes: .practice-panel, .practice-input-col, etc.
  └── main.js, paging-seg.js (other modules)
```

## Key API Endpoints

### In simulator.js

#### `window.simAPI.resetSimulatorState(memoryBlocks, processesArray, algorithm)`

**Purpose**: Initialize simulator with custom memory configuration

**Parameters**:
```javascript
memoryBlocks:   Array<number>  // [200, 400, 600] or [2250]
processesArray: Array<number>  // [357, 210, 468, 491]
algorithm:      String         // 'first-fit'|'best-fit'|'worst-fit'|'next-fit'
```

**Returns**: `boolean` - Success or failure

**Side Effects**:
- Updates `MEMORY_SIZE` global variable
- Resets `memory[]` array
- Resets `nextFitPointer`
- Resets `colorIndex`
- Updates UI elements (#mem-size-val, #proc-name, #algo-select)
- Clears log
- Triggers `renderAll()`

**Example Usage**:
```javascript
window.simAPI.resetSimulatorState([200, 400, 600], [100, 200, 150], 'best-fit');
```

### In practice.js

#### `window.practiceAPI.parseInput(inputStr)`

**Purpose**: Parse comma-separated input string into array of numbers

**Parameters**:
```javascript
inputStr:  String  // "100, 200, 300"
```

**Returns**: `Array<number>` or `null` if invalid

**Logic**:
1. Split by comma
2. Trim whitespace
3. Parse as integers
4. Validate all are positive integers
5. Return array or null

#### `window.practiceAPI.validateConfig(memory, processes)`

**Purpose**: Validate memory blocks and process configuration

**Parameters**:
```javascript
memory:    Array<number>  // [200, 400, 600]
processes: Array<number>  // [100, 200, 150]
```

**Returns**: `Object` - `{valid: boolean, error?: string}`

**Validation Rules**:
- ✓ Memory array must not be empty
- ✓ Processes array must not be empty
- ✓ No process > total memory
- ✗ Returns error object if fails

#### `window.practiceAPI.analyzeProblem(memory, processes)`

**Purpose**: Calculate statistics about the problem

**Parameters**:
```javascript
memory:    Array<number>
processes: Array<number>
```

**Returns**: `Object`:
```javascript
{
  totalMemory: 2250,
  totalProcess: 1526,
  utilizationRatio: "67.8",  // percentage as string
  memoryBlocks: 6,
  processCount: 4,
  avgBlockSize: "375.0",
  avgProcessSize: "381.5"
}
```

## Global State Variables

### In simulator.js

```javascript
let MEMORY_SIZE = 200;           // Total available memory in KB
let memory = [];                 // Array of memory segments
let nextFitPointer = 0;          // For Next Fit algorithm
let colorIndex = 0;              // For process colors
let animContext = null;          // Current animation context
let processQueue = [];           // NEW: Queue for batch allocation
let processQueueIndex = 0;       // NEW: Current position in queue
```

### State Structure: memory[]

Each segment:
```javascript
{
  start: number,        // Starting address in KB
  size: number,         // Size in KB
  free: boolean,        // true = free, false = allocated
  name?: string,        // Process name (e.g., "P1")
  color?: string        // Hex color (e.g., "#00d4ff")
}
```

## Algorithm Implementations

All algorithms iterate through `memory[]` and find a block:

### First Fit
```javascript
for (let i = 0; i < memory.length; i++) {
  if (memory[i].free && memory[i].size >= size) {
    return i;  // First match
  }
}
```

### Best Fit
```javascript
let best = -1, bestSize = Infinity;
for (let i = 0; i < memory.length; i++) {
  if (memory[i].free && memory[i].size >= size) {
    if (memory[i].size < bestSize) {
      best = i;
      bestSize = memory[i].size;
    }
  }
}
return best;  // Smallest match
```

### Worst Fit
```javascript
let worst = -1, worstSize = -1;
for (let i = 0; i < memory.length; i++) {
  if (memory[i].free && memory[i].size >= size) {
    if (memory[i].size > worstSize) {
      worst = i;
      worstSize = memory[i].size;
    }
  }
}
return worst;  // Largest match
```

### Next Fit
```javascript
const n = memory.length;
for (let offset = 0; offset < n; offset++) {
  const i = (nextFitPointer + offset) % n;
  if (memory[i].free && memory[i].size >= size) {
    nextFitPointer = i;
    return i;  // First match after pointer
  }
}
```

## DOM Elements Referenced

| ID | Element | Purpose |
|----|---------|---------|
| `custom-memory-input` | Input | Memory blocks entry |
| `custom-processes-input` | Input | Process sizes entry |
| `custom-algo-select` | Select | Algorithm selection |
| `sample-problem-select` | Select | Sample problem loader |
| `load-custom-problem-btn` | Button | Load problem |
| `reset-to-default-btn` | Button | Reset to default |
| `practice-message` | Div | Status messages |
| `practice-problem-stats` | Div | Statistics display |
| `algo-explanation` | Div | Algorithm explanation |
| `mem-bar` | Div | Memory visualization |
| `mem-size-val` | Span | Total memory display |
| `algo-select` | Select | Core simulator algorithm |
| `proc-name` | Input | Process name |
| `proc-size` | Input | Process size |
| `sim-log` | Div | Operation log |

## Event Flow

### User Enters Custom Problem

```
1. User enters: Memory="100,200", Processes="50,75"
2. User clicks "Load Problem"
           ↓
3. loadFromUI() called
           ↓
4. parseInput() validates both inputs
           ↓
5. validateConfig() checks feasibility
           ↓
6. loadCustomProblem() called
           ↓
7. window.simAPI.resetSimulatorState() called
           ↓
8. Simulator state reset
           ↓
9. renderAll() called
           ↓
10. showSuccess() shows confirmation
           ↓
11. showAlgorithmExplanation() displays info
           ↓
12. displayProblemAnalysis() shows statistics
```

## Error Handling Flow

```
User Input
    ↓
[parseInput] Invalid format?
    ↓ YES: return null
showError("Invalid format...")
    ↓
[validateConfig] Invalid config?
    ↓ YES: return {valid: false, error}
showError(error message)
    ↓
[resetSimulatorState] Try to reset?
    ↓ FAIL: console.error + showError
    ↓ SUCCESS: render and show success
```

## Customization Guide

### Adding a New Sample Problem

1. Open `practice.js`
2. Find `SAMPLE_PROBLEMS` object
3. Add new entry:
```javascript
const SAMPLE_PROBLEMS = {
  // ... existing problems
  myProblem: {
    name: 'My Custom Problem',
    memory: [100, 200, 300],
    processes: [150, 200]
  }
};
```
4. Dropdown automatically includes it

### Adding New Algorithm Explanation

1. Open `practice.js`
2. Find `ALGO_EXPLANATIONS` object
3. Add explanation:
```javascript
'my-algorithm': 'Do this... then that... Result: ...'
```

### Modifying Input Validation

1. Open `practice.js`
2. Edit `validateConfig()` function
3. Add validation rules:
```javascript
if (someCondition) {
  return { valid: false, error: 'Your error message' };
}
```

## Performance Optimization

### Current Performance
- Parse 100 numbers: < 5ms
- Validate: < 2ms
- Reset state: < 10ms
- Render: < 50ms (depends on GSAP)

### Potential Bottlenecks
- GSAP animations (if many memory segments)
- DOM rendering (if many elements)
- Algorithm execution (O(n) worst case)

### Optimization Tips
1. Limit memory blocks to < 20
2. Limit processes to < 100
3. Cache DOM elements if repeated access
4. Use requestAnimationFrame for smooth animations
5. Debounce input validation

## Testing Checklist

- [ ] Parse valid input
- [ ] Parse invalid input (catch errors)
- [ ] Validate feasible configuration
- [ ] Validate infeasible config (too large process)
- [ ] Load problem successfully
- [ ] Load sample problem
- [ ] Reset to default
- [ ] Display statistics correctly
- [ ] Show algorithm explanation
- [ ] Allocate processes from loaded problem
- [ ] Test all 4 algorithms
- [ ] Check memory visualization updates
- [ ] Verify log entries appear
- [ ] Test error recovery
- [ ] Test on mobile viewport

## Browser DevTools Debugging

### Console Access
```javascript
// Check current state
window.MEMORY_SIZE
window.memory
window.processQueue

// Load problem programmatically
window.simAPI.resetSimulatorState([200, 400], [100, 200], 'first-fit');

// Parse input
window.practiceAPI.parseInput('100, 200, 300');

// Validate
window.practiceAPI.validateConfig([100, 200], [50, 75]);

// Analyze
window.practiceAPI.analyzeProblem([100, 200], [50, 75]);
```

### Network Debugging
- No network calls for practice functionality
- All processing client-side
- Optional backend for session persistence

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Apr 2025 | Initial release |

## Contributing Guidelines

1. Follow existing code style
2. Use descriptive function names
3. Add comments for complex logic
4. Test thoroughly before committing
5. Update documentation
6. Keep functions under 50 lines

---

**Happy coding!** 🚀
