# MemOS — Memory Allocation Simulator

![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Enabled-47A248.svg)
![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)

MemOS is a full-stack web application designed to simulate operating system memory management concepts through an engaging, interactive experience. Built as an OS Mini Project for Vidyalankar Institute of Technology (AY 2025-26), it bridges the gap between theoretical OS concepts and practical understanding. What makes MemOS unique is its blend of an immersive, scroll-driven 3D educational journey with a fully functional, interactive simulator backed by real-time persistence. It is engineered for computer science students and educators who want a hands-on approach to visualizing contiguous allocation, paging, and segmentation.

## ✨ Features

- **Scroll-Driven 3D Memory Grid**: Powered by Three.js featuring 6 animated educational scenes.
- **Contiguous Allocation Simulator**: Interactive implementation of First Fit, Best Fit, Worst Fit, and Next Fit algorithms.
- **Interactive Paging Simulator**: Real-time address translation and visual page table management.
- **Interactive Segmentation Simulator**: Segment table configuration with protection fault detection.
- **Real-Time Analytics**: Live memory bar, fragmentation statistics, and step-by-step allocation logging.
- **Session Persistence**: MongoDB integration to digitally save and load simulation states.
- **Offline Mode**: Graceful fallback to local operation without a backend.
- **Theory Reference Module**: Comprehensive guide detailing all 6 algorithms covered.

## 📂 Project Structure

```text
memory-sim/
├── server/
│   ├── controllers/
│   ├── models/
│   │   ├── Algorithm.js
│   │   └── Session.js
│   ├── routes/
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── index.html
├── style.css
├── append_animations.css
├── three-scene.js
├── simulator.js
├── paging-seg.js
├── main.js
└── README.md
```

## ⚙️ Prerequisites

- **Node.js**: v18 or higher
- **MongoDB**: Local instance or MongoDB Atlas cluster
- **Modern Web Browser**: Chrome recommended for optimal Three.js performance

## 🚀 Installation

Follow these steps to get the project running locally:

1. **Clone the repo**
```bash
git clone https://github.com/your-username/memory-sim.git
```

2. **Navigate to the project directory**
```bash
cd memory-sim
```

3. **Navigate to the server directory**
```bash
cd server
```

4. **Install backend dependencies**
```bash
npm install
```

5. **Configure environment variables**
Copy `.env.example` to `.env` and set your MongoDB URI:
```bash
cp .env.example .env
```
*Note: Your MongoDB Atlas URI format should look like:* `MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/memos?retryWrites=true&w=majority`

6. **Start the backend server**
```bash
node server.js
```

7. **Launch the frontend**
Open `index.html` (in the root `memory-sim` folder) directly in your browser, or use the Live Server extension in VS Code.

## 📖 Usage

### 3D Scroll Experience
Simply scroll down the initial landing page to navigate through the 3D educational scenes. The Three.js visuals will automatically transition to match the current memory concept being explained.

### Memory Simulator
- **Allocate**: Enter a process size and click "Allocate" to place it in memory using the selected algorithm.
- **Free**: Select a block and free it up to reclaim contiguous segments.
- **Compact**: Use the compaction feature to shift contiguous memory blocks and merge adjoining free space.

### Session Management
Use the UI buttons in the simulator control panel to save your current session layout to the database, or load a previously saved configuration layout to resume testing.

### Address Translation (Paging & Segmentation)
Switch to the Paging or Segmentation specific interfaces. Configure the respective table bounds, enter a Logical Address, and click Translate to visualize the physical memory address calculation. Protection fault detections will trigger if offset boundaries are violated.

## 🔌 API Reference

The REST API backend handles all persistence and logging logic.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sessions/save` | Create and save a new simulator session state |
| `GET` | `/api/sessions/:id` | Load a specific session by its ID |
| `GET` | `/api/sessions/` | List all saved simulator sessions |
| `DELETE`| `/api/sessions/:id` | Delete a specific session by its ID |
| `POST` | `/api/logs/add` | Append a new simulation action log to a session |
| `GET` | `/api/logs/:sessionId`| Retrieve all event logs for a given session |

## 🧠 Algorithms Covered

- **First Fit**: Allocates the first free memory block that is large enough for the process.
- **Best Fit**: Scans all free blocks and allocates the smallest block that fits the process.
- **Worst Fit**: Allocates the largest available free block to leave the maximum possible remainder.
- **Next Fit**: Functions like First Fit but begins its search from the location of the last successful allocation.
- **Paging**: Manages non-contiguous memory by dividing logical memory into same-sized pages and physical memory into frames.
- **Segmentation**: Allocates varying-sized segments based on logical divisions of a program (e.g., stack, heap, code).

## 📸 Screenshots

### 🖼️ 3D Scroll Experience
*(Placeholder: Insert screenshot of the 3D grid and hero canvas here)*

### 🎛️ Interactive Simulator
*(Placeholder: Insert screenshot of the visual memory bar and UI here)*

### 📄 Paging Visualizer
*(Placeholder: Insert screenshot of the Paging address translation simulation here)*

### 🕒 Session History
*(Placeholder: Insert screenshot of the backend session load panel here)*

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Form structure** | Pure HTML5 |
| **Styling** | Vanilla CSS3 |
| **Logic & Interactivity** | Pure JavaScript (ES6+) |
| **3D Rendering Engine** | Three.js (r128) |
| **Backend Server** | Node.js with Express.js |
| **Database Architecture** | MongoDB via Mongoose ORM |

## 🤝 Contributing

Contributions to MemOS are welcome!

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

## 📄 License

Distributed under the MIT License.

## 🙏 Acknowledgments

- Supervised by **Dr. Rasika Ransing**, Vidyalankar Institute of Technology (VIT Mumbai)
- 3D graphics powered by **Three.js r128**
- Core algorithmic concepts referenced from the **Silberschatz Operating System Concepts** textbook
