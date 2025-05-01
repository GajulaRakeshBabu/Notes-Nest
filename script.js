// App State
const state = {
    currentUser: null,
    notes: [],
    tags: [],
    editingNoteId: null,
    filePreviews: []
  };
  
  // DOM Elements
  const elements = {
    authSection: document.getElementById("authSection"),
    appSection: document.getElementById("appSection"),
    notesList: document.getElementById("notesList"),
    authEmail: document.getElementById("authEmail"),
    authPassword: document.getElementById("authPassword"),
    loginBtn: document.getElementById("loginBtn"),
    signupBtn: document.getElementById("signupBtn"),
    noteTitle: document.getElementById("noteTitle"),
    noteContent: document.getElementById("noteContent"),
    noteFile: document.getElementById("noteFile"),
    searchInput: document.getElementById("searchInput"),
    noteTags: document.getElementById("noteTags"),
    addNoteBtn: document.getElementById("addNoteBtn"),
    cancelEditBtn: document.getElementById("cancelEditBtn"),
    authError: document.getElementById("authError"),
    shareModal: document.getElementById("shareModal"),
    shareLink: document.getElementById("shareLink"),
    filePreview: document.getElementById("filePreview"),
    logoutBtn: document.getElementById("logoutBtn"),
    exportBtn: document.getElementById("exportBtn"),
    importBtn: document.getElementById("importBtn"),
    importFile: document.getElementById("importFile"),
    closeShareModal: document.getElementById("closeShareModal"),
    closeShareModalBtn: document.getElementById("closeShareModalBtn"),
    copyShareLinkBtn: document.getElementById("copyShareLinkBtn")
  };
  
  // Initialize the app
  function init() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      state.currentUser = loggedInUser;
      loadUserData();
      elements.authSection.style.display = "none";
      elements.appSection.style.display = "block";
    }
  
    elements.loginBtn.addEventListener('click', login);
    elements.signupBtn.addEventListener('click', signup);
    elements.logoutBtn.addEventListener('click', logout);
    elements.exportBtn.addEventListener('click', exportNotes);
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', importNotes);
    elements.noteFile.addEventListener('change', handleFileSelect);
    elements.closeShareModal.addEventListener('click', () => closeModal('shareModal'));
    elements.closeShareModalBtn.addEventListener('click', () => closeModal('shareModal'));
    elements.copyShareLinkBtn.addEventListener('click', copyShareLink);
    elements.addNoteBtn.addEventListener('click', addNote);
    elements.cancelEditBtn.addEventListener('click', cancelEdit);
    elements.searchInput.addEventListener('input', filterNotes);
  }
  
  // Authentication Functions
  function login() {
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value.trim();
  
    if (!email || !password) {
      showAuthError('Please enter both email and password');
      return;
    }
  
    if (!validateEmail(email)) {
      showAuthError('Please enter a valid email address');
      return;
    }
  
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
  
    if (user) {
      state.currentUser = email;
      localStorage.setItem('currentUser', email);
      elements.authSection.style.display = "none";
      elements.appSection.style.display = "block";
      loadUserData();
      showAuthError('');
    } else {
      showAuthError('Invalid email or password');
    }
  }
  
  function signup() {
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value.trim();
  
    if (!email || !password) {
      showAuthError('Please enter both email and password');
      return;
    }
  
    if (!validateEmail(email)) {
      showAuthError('Please enter a valid email address');
      return;
    }
  
    if (password.length < 6) {
      showAuthError('Password must be at least 6 characters');
      return;
    }
  
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(u => u.email === email);
  
    if (userExists) {
      showAuthError('Email already registered');
      return;
    }
  
    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    // Create user-specific data storage
    localStorage.setItem(`notes_${email}`, JSON.stringify([]));
    localStorage.setItem(`tags_${email}`, JSON.stringify([]));
  
    state.currentUser = email;
    localStorage.setItem('currentUser', email);
    elements.authSection.style.display = "none";
    elements.appSection.style.display = "block";
    loadUserData();
    showAuthError('');
  }
  
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  function logout() {
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    elements.authSection.style.display = "block";
    elements.appSection.style.display = "none";
    elements.authEmail.value = '';
    elements.authPassword.value = '';
  }
  
  function showAuthError(message) {
    elements.authError.textContent = message;
  }
  
  // --- File handling ---
  function handleFileSelect(event) {
    const files = event.target.files;
    state.filePreviews = [];
    elements.filePreview.innerHTML = '';
  
    if (files.length === 0) return;
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
  
      reader.onload = function (e) {
        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item';
  
        if (file.type.startsWith('image/')) {
          previewItem.innerHTML = `
            <img src="${e.target.result}" alt="${file.name}" />
            <div class="remove-file" onclick="removeFilePreview(${i})">
              <i class="fas fa-times"></i>
            </div>`;
        } else {
          const fileIcon = getFileIcon(file);
          previewItem.innerHTML = `
            <div class="file-icon">${fileIcon}</div>
            <div class="file-name">${file.name}</div>
            <div class="remove-file" onclick="removeFilePreview(${i})">
              <i class="fas fa-times"></i>
            </div>`;
        }
  
        elements.filePreview.appendChild(previewItem);
        state.filePreviews.push({
          name: file.name,
          type: file.type,
          data: e.target.result
        });
      };
  
      reader.readAsDataURL(file);
    }
  }
  
  function getFileIcon(file) {
    if (file.type === 'application/pdf') return '<i class="fas fa-file-pdf"></i>';
    if (file.type.startsWith('text/')) return '<i class="fas fa-file-alt"></i>';
    if (file.type.startsWith('audio/')) return '<i class="fas fa-file-audio"></i>';
    if (file.type.startsWith('video/')) return '<i class="fas fa-file-video"></i>';
    if (file.type.startsWith('image/')) return '<i class="fas fa-file-image"></i>';
    return '<i class="fas fa-file"></i>';
  }
  
  function removeFilePreview(index) {
    state.filePreviews.splice(index, 1);
    renderFilePreviews();
  
    const dataTransfer = new DataTransfer();
    state.filePreviews.forEach(file => {
      const blob = dataURLtoBlob(file.data);
      const newFile = new File([blob], file.name, { type: file.type });
      dataTransfer.items.add(newFile);
    });
  
    elements.noteFile.files = dataTransfer.files;
  }
  
  function renderFilePreviews() {
    elements.filePreview.innerHTML = '';
  
    state.filePreviews.forEach((file, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'file-preview-item';
  
      if (file.type.startsWith('image/')) {
        previewItem.innerHTML = `
          <img src="${file.data}" alt="${file.name}" />
          <div class="remove-file" onclick="removeFilePreview(${index})">
            <i class="fas fa-times"></i>
          </div>`;
      } else {
        const fileIcon = getFileIcon(file);
        previewItem.innerHTML = `
          <div class="file-icon">${fileIcon}</div>
          <div class="file-name">${file.name}</div>
          <div class="remove-file" onclick="removeFilePreview(${index})">
            <i class="fas fa-times"></i>
          </div>`;
      }
  
      elements.filePreview.appendChild(previewItem);
    });
  }
  
  function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }
  
  // --- Notes ---
  function loadUserData() {
    loadNotes();
    loadTags();
    renderNotes();
  }
  
  function loadNotes() {
    const notesData = localStorage.getItem(`notes_${state.currentUser}`);
    state.notes = notesData ? JSON.parse(notesData) : [];
    state.notes.forEach((note, index) => {
      if (!note.id) note.id = Date.now() + index;
    });
  }
  
  function saveNotes() {
    localStorage.setItem(`notes_${state.currentUser}`, JSON.stringify(state.notes));
  }
  
  function loadTags() {
    const tagsData = localStorage.getItem(`tags_${state.currentUser}`);
    state.tags = tagsData ? JSON.parse(tagsData) : [];
  }
  
  function saveTags() {
    localStorage.setItem(`tags_${state.currentUser}`, JSON.stringify(state.tags));
  }
  
  // --- Render Notes ---
  function renderNotes(filteredNotes = null) {
    elements.notesList.innerHTML = "";
    const notesToRender = filteredNotes || state.notes;
  
    if (notesToRender.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-state';
      emptyMsg.innerHTML = `<i class="fas fa-sticky-note"></i><h3>No Notes Found</h3><p>Add your first note to get started!</p>`;
      elements.notesList.appendChild(emptyMsg);
      return;
    }
  
    notesToRender.forEach(note => {
      const noteEl = document.createElement("div");
      noteEl.className = "note-card";
      noteEl.dataset.id = note.id;
  
      let noteContent = `
        <div class="note-content">
          <h3 class="note-title">${note.title || 'Untitled Note'}</h3>
          <div class="note-meta">
            <small>${note.date || new Date().toLocaleString()}</small>
          </div>
          ${note.content ? `<p class="note-text">${note.content}</p>` : ''}`;
  
      if (note.tags && note.tags.length > 0) {
        noteContent += `<div class="note-tags">`;
        note.tags.forEach(tag => {
          noteContent += `<span class="note-tag">${tag}</span>`;
        });
        noteContent += `</div>`;
      }
  
      if (note.files && note.files.length > 0) {
        noteContent += `<div class="note-attachments"><small><strong>Attachments:</strong></small><div class="attachment-grid">`;
        note.files.forEach(file => {
          if (file.type.startsWith("image/")) {
            noteContent += `<div class="attachment-item"><img src="${file.data}" alt="${file.name}" /><div class="file-name">${file.name}</div></div>`;
          } else {
            noteContent += `<div class="attachment-item"><div class="file-icon">${getFileIcon(file)}</div><div class="file-name">${file.name}</div></div>`;
          }
        });
        noteContent += `</div></div>`;
      }
  
      noteContent += `</div><div class="note-actions">
        <button class="btn btn-sm btn-info" onclick="editNote('${note.id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteNote('${note.id}')"><i class="fas fa-trash"></i> Delete</button>
      </div>`;
  
      noteEl.innerHTML = noteContent;
      elements.notesList.appendChild(noteEl);
    });
  }
  
  // --- CRUD ---
  function addNote() {
    const title = elements.noteTitle.value.trim();
    const content = elements.noteContent.value.trim();
    const tags = elements.noteTags.value.split(',').map(t => t.trim()).filter(Boolean);
  
    if (!title && !content) return;
  
    const note = {
      id: state.editingNoteId || Date.now(),
      title,
      content,
      tags,
      files: state.filePreviews,
      date: new Date().toLocaleString()
    };
  
    if (state.editingNoteId) {
      const index = state.notes.findIndex(n => n.id === state.editingNoteId);
      if (index !== -1) state.notes[index] = note;
      state.editingNoteId = null;
      elements.addNoteBtn.innerHTML = `<i class="fas fa-save"></i> Add Note`;
      elements.cancelEditBtn.style.display = "none";
    } else {
      state.notes.push(note);
    }
  
    // Update tags
    tags.forEach(tag => {
      if (!state.tags.includes(tag)) {
        state.tags.push(tag);
      }
    });
    saveTags();
  
    saveNotes();
    renderNotes();
    resetNoteForm();
  }
  
  function editNote(id) {
    const note = state.notes.find(n => n.id == id);
    if (!note) return;
  
    elements.noteTitle.value = note.title;
    elements.noteContent.value = note.content;
    elements.noteTags.value = note.tags ? note.tags.join(', ') : '';
  
    state.editingNoteId = id;
    elements.addNoteBtn.innerHTML = `<i class="fas fa-save"></i> Save Changes`;
    elements.cancelEditBtn.style.display = "inline-block";
    state.filePreviews = note.files || [];
    renderFilePreviews();
  }
  
  function cancelEdit() {
    state.editingNoteId = null;
    resetNoteForm();
    elements.addNoteBtn.innerHTML = `<i class="fas fa-save"></i> Add Note`;
    elements.cancelEditBtn.style.display = "none";
  }
  
  function resetNoteForm() {
    elements.noteTitle.value = '';
    elements.noteContent.value = '';
    elements.noteTags.value = '';
    state.filePreviews = [];
    renderFilePreviews();
  }
  
  function deleteNote(id) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    state.notes = state.notes.filter(n => n.id != id);
    saveNotes();
    renderNotes();
  }
  
  // --- Filtering ---
  function filterNotes() {
    const searchTerm = elements.searchInput.value.toLowerCase();
  
    const filteredNotes = state.notes.filter(note => {
      const matchesSearch = 
        (!searchTerm || 
        (note.title && note.title.toLowerCase().includes(searchTerm)) || 
        (note.content && note.content.toLowerCase().includes(searchTerm)));
      
      return matchesSearch;
    });
  
    renderNotes(filteredNotes);
  }
  
  // --- Export/Import ---
  function exportNotes() {
    const data = {
      notes: state.notes,
      tags: state.tags
    };
  
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NotesNest_${state.currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.notes && Array.isArray(data.notes)) {
          state.notes = data.notes;
          saveNotes();
        }
        
        if (data.tags && Array.isArray(data.tags)) {
          state.tags = data.tags;
          saveTags();
        }
        
        renderNotes();
        event.target.value = ''; // Reset file input
      } catch (error) {
        alert('Error importing notes: Invalid file format');
      }
    };
    reader.readAsText(file);
  }
  
  // --- Modal Functions ---
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
  }
  
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
  }
  
  function copyShareLink() {
    elements.shareLink.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
  }
  
  // Make functions available globally
  window.removeFilePreview = removeFilePreview;
  window.editNote = editNote;
  window.deleteNote = deleteNote;
  
  // Start App
  window.addEventListener('DOMContentLoaded', init);