require('dotenv').config();
const mongoose = require('mongoose');
const Algorithm = require('./models/Algorithm');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/memsim';

const seedData = [
  {
    name: 'First Fit',
    slug: 'first-fit',
    description: 'Scans from the beginning. Places the process in the first hole large enough to fit. Fast — but causes early fragmentation.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    bestFor: 'Speed-critical systems',
    advantages: ['Fastest search'],
    disadvantages: ['High external fragmentation'],
    steps: [
      { title: 'Init', description: 'Start from address 0.' },
      { title: 'Scan', description: 'Find first free block where size ≥ request.' },
      { title: 'Allocate', description: 'Allocate. Split block if larger. Done.' },
      { title: 'Fail', description: 'If none found → allocation fails.' }
    ]
  },
  {
    name: 'Best Fit',
    slug: 'best-fit',
    description: 'Searches the entire list and picks the smallest hole that fits. Minimizes wasted space — but leaves tiny unusable fragments.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    bestFor: 'Memory-constrained systems',
    advantages: ['Least wasted space'],
    disadvantages: ['Slowest — full scan every time'],
    steps: [
      { title: 'Scan', description: 'Scan all free blocks.' },
      { title: 'Track', description: 'Track the smallest block ≥ request size.' },
      { title: 'Allocate', description: 'Allocate that block. Split remainder.' },
      { title: 'Fragment', description: 'Remainder may be too small to reuse → tiny fragments.' }
    ]
  },
  {
    name: 'Worst Fit',
    slug: 'worst-fit',
    description: 'Picks the largest available hole. Theory: leftover fragments are big enough to be useful. Reality: rarely works well.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    bestFor: 'Theoretical comparison only',
    advantages: ['Large remainders'],
    disadvantages: ['Wastes large free blocks'],
    steps: [
      { title: 'Scan', description: 'Scan all free blocks.' },
      { title: 'Track', description: 'Find the largest block.' },
      { title: 'Allocate', description: 'Allocate. Large remainder stays in free list.' },
      { title: 'Degrade', description: 'Degrades quickly — large blocks get eaten up.' }
    ]
  },
  {
    name: 'Next Fit',
    slug: 'next-fit',
    description: 'Like First Fit, but starts searching from where the last allocation ended — not from address 0. More uniform distribution of allocations.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    bestFor: 'Uniform allocation patterns',
    advantages: ['Uniform distribution'],
    disadvantages: ['Requires tracking last ptr'],
    steps: [
      { title: 'Track', description: 'Remember last allocation pointer.' },
      { title: 'Scan', description: 'Start scanning from that point (circular).' },
      { title: 'Allocate', description: 'Allocate first fit from current position.' },
      { title: 'Balance', description: 'Spreads load across memory more evenly.' }
    ]
  },
  {
    name: 'Paging',
    slug: 'paging',
    description: 'Physical memory is divided into fixed-size frames. Logical memory is divided into pages of the same size. The OS maintains a page table mapping each page to a frame.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(n)',
    bestFor: 'Virtual memory systems',
    advantages: ['No external fragmentation'],
    disadvantages: ['Internal frag ≤ frame size - 1'],
    steps: [
      { title: 'Frames', description: 'Eliminates external fragmentation entirely.' },
      { title: 'Pages', description: 'Internal fragmentation: last page may not fill its frame.' },
      { title: 'Map', description: 'Page Table Entry: [Valid bit | Frame Number]' },
      { title: 'Translate', description: 'Physical Address = Frame × Frame Size + Offset' }
    ]
  },
  {
    name: 'Segmentation',
    slug: 'segmentation',
    description: 'Memory divided into variable-sized segments corresponding to logical units (code, stack, heap, data). Each segment has a base and limit.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(n)',
    bestFor: 'Logical grouping algorithms',
    advantages: ['No internal fragmentation', 'Logical grouping'],
    disadvantages: ['External frag possible'],
    steps: [
      { title: 'Segments', description: 'Logical Address: [Segment number | Offset]' },
      { title: 'Table', description: 'Segment Table: [Base | Limit] per segment' },
      { title: 'Translate', description: 'Physical Address = Base[s] + Offset' },
      { title: 'Frag', description: 'External fragmentation exists. No internal fragmentation.' }
    ]
  }
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB for seeding');
    await Algorithm.deleteMany({});
    console.log('Cleared existing algorithms');
    await Algorithm.insertMany(seedData);
    console.log('Seeded successfully!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Seed error:', err);
    mongoose.disconnect();
  });
