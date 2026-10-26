# HELYRA AI — Fullstack Project

An AI-powered adaptive health companion with dedicated Frontend and Backend architecture.

```
PROJECT HELYRA/
├── frontend/               # React 19 + Vite + Tailwind CSS + PWA
│   ├── src/
│   │   ├── components/     # UI components (SOSModal, TopBar, BottomNav...)
│   │   ├── screens/        # App screens (Home, Fitness, Food, Meds...)
│   │   ├── context/        # HealthContext state management
│   │   ├── services/       # API & step counter services
│   │   ├── types/          # TypeScript interface definitions
│   │   ├── utils/          # Client utilities
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # React entrypoint
│   ├── public/             # PWA manifest, service worker, icons
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts      # Proxies /api -> http://localhost:5000
│   └── tsconfig.json
│
├── backend/                # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── server/         # API routes, auth, middleware, database
│   │   ├── services/       # Nutrition calculations, food database
│   │   └── types/          # Shared types
│   ├── .data/              # Local JSON database storage
│   ├── server.ts           # Express API server (Port 5000)
│   ├── package.json
│   └── tsconfig.json
│
├── .vscode/                # VS Code launch & debug settings
│   ├── launch.json         # F5 Debugger configuration
│   └── tasks.json          # VS Code build tasks
│
├── START-ALL.bat           # 1-Click launcher (starts both & opens app)
├── START-FRONTEND.bat      # Starts only frontend (port 3000)
├── START-BACKEND.bat       # Starts only backend (port 5000)
├── STOP-ALL.bat            # Stops all running servers
├── package.json            # Root workspace scripts
└── run-dev.js              # Fullstack runner script
```

---

## 🚀 How to Run in VS Code

### Method 1: Single Command in Root (Recommended)
1. Open the folder `PROJECT HELYRA` in **VS Code**.
2. Open terminal (`Ctrl` + `~`).
3. Run:
   ```bash
   npm run dev
   ```
4. This starts **both Backend (Port 5000)** and **Frontend (Port 3000)** simultaneously!
5. Open your browser to: **http://localhost:3000**

---

### Method 2: Run Separately in Two Terminals
If you want to view frontend and backend logs in separate terminal tabs:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

### Method 3: 1-Click Launchers (No VS Code needed)
- Double-click **`START-ALL.bat`** in File Explorer.
- To stop the servers, double-click **`STOP-ALL.bat`**.
