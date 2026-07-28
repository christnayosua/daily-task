# FlowTask Daily Task Manager

FlowTask is a premium, lightweight desktop task management application engineered for productivity and focus. It combines a **FastAPI** REST backend backed by **SQLite** database storage with a **Tauri v2** desktop framework. The user interface features a frameless dark-mode glassmorphism aesthetic inspired by system monitoring dashboards.

## Key Features

- **Circular Telemetry Gauge**: Displays real-time task completion percentage with dynamic progress animation.
- **Window Management Controls**: Dedicated close and minimize screen controls built into the frameless widget header.
- **Task Lifecycle Management**: Create, edit, search, filter (All, Active, Completed), and delete tasks with custom modal popups.
- **Smart Deadline Presets**: Quick deadline options (+1 hour, Today 23:59, Tomorrow 12:00, +3 days) with flatpickr date-time picker integration.
- **Real-Time Countdown Timers**: Dynamic urgency badges and live remaining-time countdowns for pending tasks.
- **Keyboard Shortcuts**: Escape key support for instantly closing active modal popups and search overlays.
- **Frameless Overlay Widget**: Compact floating container with drag support, transparent background, and always-on-top window placement.

## Technology Stack

- **Desktop Framework**: Tauri v2
- **Backend API**: Python FastAPI, SQLAlchemy, SQLite
- **Frontend Architecture**: HTML5, Vanilla JavaScript (ES6+), CSS3 Glassmorphism
- **UI Components**: FontAwesome Icons, Flatpickr Datepicker
- **Fonts**: Google Fonts (Outfit, Plus Jakarta Sans)

## Architecture

FlowTask utilizes a hybrid desktop architecture:
1. **Python API Backend**: FastAPI server (`main.py`) handles CRUD operations on the local SQLite database (`tasks.db`).
2. **Rust Application Wrapper**: Tauri v2 compiles native desktop bindings, window management commands (`minimize_window`, `close_window`), and autostart capabilities.
3. **Web Frontend**: Webview container serving responsive UI assets from the `/static` directory.

## API Specification

- `GET /api/tasks` — Fetch list of all tasks.
- `GET /api/tasks/{task_id}` — Retrieve details of a specific task.
- `POST /api/tasks` — Create a new task item.
- `PUT /api/tasks/{task_id}` — Update an existing task.
- `DELETE /api/tasks/{task_id}` — Remove a task.

## Getting Started

### Prerequisites

- **Python**: v3.9 or higher
- **Node.js**: v18.0.0 or higher
- **Rust Toolchain**: Cargo v1.75.0 or higher

### Installation & Execution

1. Clone the repository:
   ```bash
   git clone https://github.com/christnayosua/daily-task.git
   cd daily-task
   ```

2. Set up Python virtual environment and dependencies:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run FastAPI backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. Launch Tauri application in development mode:
   ```bash
   npm run tauri dev
   ```

5. Build standalone binary:
   ```bash
   npm run tauri build
   ```

The compiled binary will be located in `src-tauri/target/release/`.

## License

This project is licensed under the MIT License.
