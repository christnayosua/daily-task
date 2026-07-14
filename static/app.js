// FLOWTASK SYSTEM-MONITOR WIDGET LOGIC

let allTasks = [];
let currentFilter = 'all';
let searchQuery = '';
let taskToDeleteId = null; // Variabel penampung id tugas yang akan dihapus
let addDatepicker, editDatepicker; // Instance Flatpickr

// DOM Elements Cache
const tasksScrollList = document.getElementById('tasks-scroll-list');
const gaugeFillCircle = document.getElementById('gauge-fill-circle');
const gaugeValueText = document.getElementById('gauge-value-text');
const metricActiveCount = document.getElementById('metric-active-count');
const metricCompletedCount = document.getElementById('metric-completed-count');
const searchBarContainer = document.getElementById('search-bar-container');
const quickAddContainer = document.getElementById('quick-add-container');
const taskForm = document.getElementById('task-form');

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-task-form');
const deleteModal = document.getElementById('delete-modal');

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    
    // Setup Autostart via Tauri
    async function setupAutostart() {
        try {
            if (window.__TAURI__ && window.__TAURI__.core) {
                const { invoke } = window.__TAURI__.core;
                const isAutostartEnabled = await invoke('plugin:autostart|is_enabled');
                if (!isAutostartEnabled) {
                    await invoke('plugin:autostart|enable');
                    console.log('Autostart berhasil diaktifkan secara otomatis!');
                }
            }
        } catch (e) {
            console.error('Gagal mengatur autostart:', e);
        }
    }
    setupAutostart();

    // Inisialisasi Flatpickr
    try {
        addDatepicker = flatpickr("#task-deadline", {
            enableTime: true,
            dateFormat: "Y-m-d\\TH:i",
            altInput: true,
            altFormat: "d F Y, H:i",
            time_24hr: true,
            minDate: "today",
            locale: "id",
            disableMobile: true
        });

        editDatepicker = flatpickr("#edit-task-deadline", {
            enableTime: true,
            dateFormat: "Y-m-d\\TH:i",
            altInput: true,
            altFormat: "d F Y, H:i",
            time_24hr: true,
            locale: "id",
            disableMobile: true
        });
    } catch (e) {
        console.error("Flatpickr gagal dimuat:", e);
    }

    // Window dragging native untuk Tauri
    const header = document.querySelector('.widget-header');
    if (header) {
        header.addEventListener('mousedown', (e) => {
            // Jangan drag jika mengklik tombol/ikon di header
            if (!e.target.closest('button')) {
                try {
                    if (window.__TAURI__) {
                        if (window.__TAURI__.webviewWindow && window.__TAURI__.webviewWindow.getCurrentWebviewWindow) {
                            window.__TAURI__.webviewWindow.getCurrentWebviewWindow().startDragging();
                        } else if (window.__TAURI__.window && window.__TAURI__.window.getCurrentWindow) {
                            window.__TAURI__.window.getCurrentWindow().startDragging();
                        }
                    }
                } catch (err) {
                    console.error("Failed to start dragging window:", err);
                }
            }
        });
    }

    // Event listener konfirmasi hapus kustom
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', executeDeleteTask);
    }
});

// Fetch semua tugas dari API Backend
async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Gagal mengambil data tugas');
        allTasks = await response.json();
        renderApp();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showNotification('Gagal memuat daftar tugas.', 'error');
    }
}

// Render UI Utama
function renderApp() {
    renderStats();
    renderTaskList();
}

// Menghitung & Menggambar Statistik (Progress Gauge & Metric Cards)
function renderStats() {
    const total = allTasks.length;
    const done = allTasks.filter(t => t.is_completed).length;
    const active = total - done;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    
    // Update Teks Metrik
    metricActiveCount.textContent = active;
    metricCompletedCount.textContent = done;
    gaugeValueText.textContent = `${percent}%`;
    
    // Animasi Progress Circle SVG
    // Keliling lingkaran = 2 * PI * R (2 * 3.14159 * 50 = 314.159)
    const circumference = 314.159;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    
    // Update style stroke
    gaugeFillCircle.style.strokeDashoffset = strokeDashoffset;
}

// Mengatur Filter Aktif
function setFilter(filter) {
    currentFilter = filter;
    
    // Ganti class active pada tombol tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${filter}`).classList.add('active');
    
    renderTaskList();
}

// Mengontrol Pencarian
function handleSearch(query) {
    searchQuery = query.toLowerCase().trim();
    renderTaskList();
}

// Toggle Search Bar
function toggleSearch() {
    searchBarContainer.classList.toggle('active');
    if (searchBarContainer.classList.contains('active')) {
        document.getElementById('search-input').focus();
    } else {
        document.getElementById('search-input').value = '';
        searchQuery = '';
        renderTaskList();
    }
}

// Toggle Quick Add Form
function toggleAddForm() {
    quickAddContainer.classList.toggle('active');
    if (quickAddContainer.classList.contains('active')) {
        document.getElementById('task-title').focus();
    }
}

// Render List Tugas
function renderTaskList() {
    tasksScrollList.innerHTML = '';
    
    // Filter berdasarkan tab status
    let filtered = allTasks.filter(task => {
        if (currentFilter === 'active') return !task.is_completed;
        if (currentFilter === 'completed') return task.is_completed;
        return true;
    });
    
    // Filter berdasarkan query pencarian
    if (searchQuery) {
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(searchQuery) || 
            (task.description && task.description.toLowerCase().includes(searchQuery))
        );
    }
    
    if (filtered.length === 0) {
        tasksScrollList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <span>Tidak ada tugas ditemukan</span>
            </div>
        `;
        return;
    }
    
    // Sorting: tugas aktif di atas, lalu berdasarkan tenggat waktu terdekat
    filtered.sort((a, b) => {
        if (a.is_completed !== b.is_completed) {
            return a.is_completed ? 1 : -1;
        }
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    });
    
    // Render item ke list
    filtered.forEach(task => {
        const item = createTaskItem(task);
        tasksScrollList.appendChild(item);
    });
}

// Membuat DOM Element baris tugas (seperti baris top processes di gambar)
function createTaskItem(task) {
    const item = document.createElement('div');
    item.className = `task-item ${task.is_completed ? 'completed' : ''}`;
    
    // Checkbox di sebelah kiri
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'task-checkbox-wrapper';
    checkboxWrapper.innerHTML = `
        <div class="custom-checkbox" onclick="toggleTaskStatus(${task.id}, ${task.is_completed})" title="Tandai Selesai/Aktif">
            <i class="fa-solid fa-check"></i>
        </div>
    `;
    
    // Konten tengah: Nama & Sub Info
    const content = document.createElement('div');
    content.className = 'task-content';
    
    const title = document.createElement('span');
    title.className = 'task-title-text';
    title.textContent = task.title;
    content.appendChild(title);
    
    const meta = document.createElement('span');
    meta.className = 'task-meta-info';
    
    const descSpan = document.createElement('span');
    descSpan.className = 'task-desc-text';
    descSpan.textContent = task.description || 'Tanpa deskripsi';
    meta.appendChild(descSpan);
    
    if (task.deadline) {
        const countdownSpan = document.createElement('span');
        countdownSpan.className = 'task-countdown';
        countdownSpan.setAttribute('data-deadline', task.deadline);
        countdownSpan.setAttribute('data-completed', task.is_completed);
        const initialText = task.is_completed ? 'Selesai' : getCountdownStr(task.deadline);
        countdownSpan.textContent = initialText;
        if (!task.is_completed && initialText.includes('detik')) {
            countdownSpan.classList.add('urgent');
        }
        meta.appendChild(countdownSpan);
    }
    content.appendChild(meta);
    
    // Status Badge di sebelah kanan (seperti badge persentase CPU di gambar)
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'badge-container';
    
    const badge = document.createElement('span');
    if (task.is_completed) {
        badge.className = 'status-badge completed-badge';
        badge.textContent = 'DONE';
    } else if (task.deadline) {
        const timeInfo = getDeadlineUrgency(task.deadline);
        badge.className = `status-badge ${timeInfo.class}`;
        badge.textContent = timeInfo.text;
    } else {
        badge.className = 'status-badge';
        badge.textContent = 'AKTIF';
    }
    badgeContainer.appendChild(badge);
    
    // Tombol Aksi di paling kanan (Done, Edit & Hapus)
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'action-wrapper';
    
    // Tombol Shortcut Selesai (Done Shortcut)
    const btnDone = document.createElement('button');
    btnDone.className = `btn-kill-action done-btn ${task.is_completed ? 'completed-shortcut' : ''}`;
    btnDone.innerHTML = task.is_completed ? '<i class="fa-solid fa-rotate-left"></i>' : '<i class="fa-solid fa-check"></i>';
    btnDone.title = task.is_completed ? 'Tandai Belum Selesai' : 'Tandai Selesai (Done)';
    btnDone.onclick = (e) => {
        e.stopPropagation();
        toggleTaskStatus(task.id, task.is_completed);
    };
    
    // Tombol Edit
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-kill-action';
    btnEdit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    btnEdit.title = 'Edit Tugas';
    btnEdit.onclick = (e) => {
        e.stopPropagation();
        openEditModal(task.id);
    };
    
    // Tombol Hapus (Kill) - Menggunakan ikon tempat sampah merah menyala universal
    const btnKill = document.createElement('button');
    btnKill.className = 'btn-kill-action kill-btn';
    btnKill.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    btnKill.title = 'Hapus Tugas (Kill)';
    btnKill.onclick = (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    };
    
    actionWrapper.appendChild(btnDone);
    actionWrapper.appendChild(btnEdit);
    actionWrapper.appendChild(btnKill);
    
    // Assemble
    item.appendChild(checkboxWrapper);
    item.appendChild(content);
    item.appendChild(badgeContainer);
    item.appendChild(actionWrapper);
    
    return item;
}

// Helper: Format Tanggal Cantik
function formatDeadlineStr(deadlineStr) {
    const deadline = new Date(deadlineStr);
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return deadline.toLocaleDateString('id-ID', options);
}

// Helper: Urgensi Tenggat Waktu
function getDeadlineUrgency(deadlineStr) {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffMs < 0) {
        return { class: 'overdue', text: 'LATE' };
    } else if (diffHours <= 24) {
        return { class: 'today', text: 'TODAY' };
    } else {
        return { class: 'upcoming', text: 'SOON' };
    }
}

// CRUD: Create (Tambah Tugas)
async function handleTaskSubmit(event) {
    event.preventDefault();
    
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');
    const deadlineInput = document.getElementById('task-deadline');
    
    const payload = {
        title: titleInput.value.trim(),
        description: descInput.value.trim() || null,
        deadline: deadlineInput.value || null,
        is_completed: false
    };
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Gagal membuat tugas');
        
        const newTask = await response.json();
        allTasks.push(newTask);
        
        // Reset & Tutup Form
        taskForm.reset();
        quickAddContainer.classList.remove('active');
        
        renderApp();
        showNotification('Tugas baru berhasil ditambahkan.');
    } catch (error) {
        console.error('Error creating task:', error);
        showNotification('Gagal menyimpan tugas baru.', 'error');
    }
}

// CRUD: Update Status (Toggle)
async function toggleTaskStatus(id, currentStatus) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: !currentStatus })
        });
        
        if (!response.ok) throw new Error('Gagal memperbarui status');
        
        const updatedTask = await response.json();
        
        const index = allTasks.findIndex(t => t.id === id);
        if (index !== -1) {
            allTasks[index] = updatedTask;
        }
        
        renderApp();
    } catch (error) {
        console.error('Error toggling task:', error);
        showNotification('Gagal memperbarui status.', 'error');
    }
}

// CRUD: Delete (Kill Process) - Membuka Modal Kustom
function deleteTask(id) {
    taskToDeleteId = id;
    if (deleteModal) {
        deleteModal.classList.add('active');
    }
}

// Menutup Modal Hapus Kustom
function closeDeleteModal() {
    if (deleteModal) {
        deleteModal.classList.remove('active');
    }
    taskToDeleteId = null;
}

// Eksekusi Hapus Tugas Sebenarnya dari API
async function executeDeleteTask() {
    if (!taskToDeleteId) return;
    
    try {
        const response = await fetch(`/api/tasks/${taskToDeleteId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Gagal menghapus tugas');
        
        allTasks = allTasks.filter(t => t.id !== taskToDeleteId);
        closeDeleteModal();
        renderApp();
        showNotification('Tugas berhasil dihapus (dieliminasi).');
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Gagal menghapus tugas.', 'error');
        closeDeleteModal();
    }
}

// CRUD: Edit Modal Open
function openEditModal(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-desc').value = task.description || '';
    
    if (task.deadline) {
        if (editDatepicker) {
            editDatepicker.setDate(task.deadline.slice(0, 16));
        } else {
            document.getElementById('edit-task-deadline').value = task.deadline.slice(0, 16);
        }
    } else {
        if (editDatepicker) {
            editDatepicker.clear();
        } else {
            document.getElementById('edit-task-deadline').value = '';
        }
    }
    
    document.getElementById('edit-task-completed').checked = task.is_completed;
    
    editModal.classList.add('active');
}

function closeEditModal() {
    editModal.classList.remove('active');
}

async function handleTaskUpdateSubmit(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('edit-task-id').value);
    const title = document.getElementById('edit-task-title').value.trim();
    const description = document.getElementById('edit-task-desc').value.trim() || null;
    const deadline = document.getElementById('edit-task-deadline').value || null;
    const is_completed = document.getElementById('edit-task-completed').checked;
    
    const payload = { title, description, deadline, is_completed };
    
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Gagal menyimpan perubahan');
        
        const updatedTask = await response.json();
        
        const index = allTasks.findIndex(t => t.id === id);
        if (index !== -1) {
            allTasks[index] = updatedTask;
        }
        
        closeEditModal();
        renderApp();
        showNotification('Perubahan tugas berhasil disimpan.');
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('Gagal memperbarui detail tugas.', 'error');
    }
}

// Custom Notification Utility (Toast)
function showNotification(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(244, 63, 94, 0.9)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 18px';
    toast.style.borderRadius = '12px';
    toast.style.fontSize = '0.78rem';
    toast.style.fontWeight = '600';
    toast.style.letterSpacing = '0.5px';
    toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
    toast.innerHTML = `${icon} <span>${message.toUpperCase()}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2500);
}

// Helper: Menghitung mundur sisa waktu ke deadline (Real-time countdown)
function getCountdownStr(deadlineStr) {
    if (!deadlineStr) return '';
    
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline - now;
    
    if (diffMs <= 0) {
        return 'Tenggat waktu lewat';
    }
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours >= 24) {
        // Format jika sisa waktu > 24 jam: X hari, Y jam, Z menit
        const hours = diffHours % 24;
        const mins = diffMins % 60;
        return `${diffDays} hari ${hours} jam ${mins} menit sisa`;
    } else {
        // Format jika di hari H: X jam, Y menit, Z detik
        const mins = diffMins % 60;
        const secs = diffSecs % 60;
        return `${diffHours} jam ${mins} menit ${secs} detik sisa`;
    }
}

// Timer global untuk memperbarui seluruh teks countdown setiap 1 detik
setInterval(() => {
    document.querySelectorAll('.task-countdown').forEach(el => {
        const deadline = el.getAttribute('data-deadline');
        const isCompleted = el.getAttribute('data-completed') === 'true';
        
        if (isCompleted) {
            el.textContent = 'Selesai';
            el.classList.remove('urgent');
            return;
        }
        
        if (deadline) {
            const text = getCountdownStr(deadline);
            el.textContent = text;
            
            // Tambahkan visual urgent (merah pink neon) jika masuk ke countdown detik (hari H)
            if (text.includes('detik')) {
                el.classList.add('urgent');
            } else {
                el.classList.remove('urgent');
            }
        }
    });
}, 1000);

// Memasukkan waktu preset secara otomatis ke input datetime-local
function applyPreset(inputId, presetType) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const now = new Date();
    let targetDate = new Date();
    
    switch (presetType) {
        case '1h':
            // +1 jam dari sekarang
            targetDate.setHours(now.getHours() + 1);
            break;
        case 'today':
            // Hari ini pada pukul 23:59
            targetDate.setHours(23, 59, 0, 0);
            break;
        case 'tomorrow':
            // Besok pada pukul 12:00 siang
            targetDate.setDate(now.getDate() + 1);
            targetDate.setHours(12, 0, 0, 0);
            break;
        case '3d':
            // +3 hari dari sekarang
            targetDate.setDate(now.getDate() + 3);
            break;
    }
    
    // Format targetDate ke YYYY-MM-DDTHH:MM local timezone
    const tzoffset = targetDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(targetDate - tzoffset)).toISOString().slice(0, 16);
    
    if (inputId === 'task-deadline' && addDatepicker) {
        addDatepicker.setDate(targetDate);
    } else if (inputId === 'edit-task-deadline' && editDatepicker) {
        editDatepicker.setDate(targetDate);
    } else {
        input.value = localISOTime;
    }
    
    // Berikan feedback visual ke tombol preset yang aktif
    const container = input.closest('form, .form-group-modal').querySelector('.deadline-presets');
    if (container) {
        container.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        // Cari tombol yang memiliki argumen presetType yang sama
        const activeBtn = Array.from(container.querySelectorAll('.preset-btn')).find(btn => btn.getAttribute('onclick').includes(`'${presetType}'`));
        if (activeBtn) activeBtn.classList.add('active');
    }
    
    showNotification(`Preset ${presetType.toUpperCase()} terpilih.`);
}

function clearPreset(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (inputId === 'task-deadline' && addDatepicker) {
        addDatepicker.clear();
    } else if (inputId === 'edit-task-deadline' && editDatepicker) {
        editDatepicker.clear();
    } else {
        input.value = '';
    }
    
    const container = input.closest('form, .form-group-modal').querySelector('.deadline-presets');
    if (container) {
        container.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    }
    showNotification('Tenggat waktu dibersihkan.');
}
