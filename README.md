# 🌟 FlowTask — Premium Task Dashboard

![FlowTask Icon](src-tauri/icons/128x128.png)

*(English version below)*

FlowTask adalah aplikasi manajemen tugas (To-Do List) desktop modern dengan arsitektur **FastAPI** di backend, **SQLite** sebagai database lokal, dan **Tauri v2** yang membalut antarmuka web statis (**HTML5 / Vanilla CSS / Vanilla JS**) ke dalam aplikasi desktop yang sangat ringan dan cepat. Aplikasi ini memiliki gaya desain *Glassmorphism* dan *Dark Mode* premium.

### 📥 Cara Mengunduh & Menginstal (How to Install)
Terima kasih atas ketertarikan Anda! Anda dapat menginstal aplikasi ini secara langsung dengan mengunduh file *installer* (seperti `.exe` atau `.msi`) di halaman **[Releases](../../releases)** pada repositori GitHub ini jika sudah tersedia.

Atau, Anda dapat melakukan kompilasi (*build*) sendiri:
1. Pastikan Anda memiliki **Node.js** dan **Rust** terpasang di sistem operasi Anda.
2. *Clone* repositori ini melalui terminal: `git clone https://github.com/christnayosua/daily-task.git`
3. Masuk ke direktori proyek: `cd daily-task`
4. Jalankan perintah *build* Tauri: `npm run tauri build`
5. Aplikasi final (`.exe`) Anda akan tersedia di `src-tauri/target/release/app.exe`.

---

*(English Version)*
FlowTask is a modern, premium desktop Daily Task Manager (To-Do List). It utilizes a decoupled architecture with **FastAPI** and **SQLite** for the backend, and **Tauri v2** to wrap a beautiful **Vanilla JS / CSS** frontend into a blazing-fast desktop application. It features a stunning *Glassmorphism* and *Dark Mode* aesthetic.

### 📥 Download & Installation
Thank you for your interest! You can easily install this application by downloading the installer (e.g., `.exe` or `.msi`) from the **[Releases](../../releases)** page of this GitHub repository, if available.

Alternatively, you can build it yourself from the source code:
1. Make sure you have **Node.js** and **Rust** installed on your system.
2. Clone this repository via terminal: `git clone https://github.com/christnayosua/daily-task.git`
3. Navigate to the project directory: `cd daily-task`
4. Run the Tauri build command: `npm run tauri build`
5. The compiled executable will be located in `src-tauri/target/release/app.exe`.
