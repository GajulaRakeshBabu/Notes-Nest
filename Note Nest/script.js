// App State
const state = {
  currentUser: null, // Now stores email instead of username
  notes: [],
  categories: [],
  tags: [],
  editingNoteId: null,
  darkMode: localStorage.getItem('darkMode') === 'true'
};

// DOM Elements
const elements = {
  authSection: document.getElementById("authSection"),
  appSection: document.getElementById("appSection"),
  notesList: document.getElementById("notesList"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  loginBtn: document.getElementById("loginBtn"),
  noteTitle: document.getElementById("noteTitle"),
  noteContent: document.getElementById("noteContent"),
  noteFile: document.getElementById("noteFile"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  tagFilter: document.getElementById("tagFilter"),
  noteCategory: document.getElementById("noteCategory"),
  noteTags: document.getElementById("noteTags"),
  addNoteBtn: document.getElementById("addNoteBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  authError: document.getElementById("authError"),
  darkToggle: document.getElementById("darkToggle"),
  shareModal: document.getElementById("shareModal"),
  shareLink: document.getElementById("shareLink")
};

// Initialize the app
function init() {
  // Set dark mode if enabled
  if (state.darkMode) {
      document.body.classList.add('dark');
      elements.darkToggle.checked = true;
  }

  // Check if user is already logged in
  const loggedInUser = localStorage.getItem('currentUser');
  if (loggedInUser) {
      state.currentUser = loggedInUser;
      loadUserData();
      elements.authSection.style.display = "none";
      elements.appSection.style.display = "block";
  }
}

// Load all user data
function loadUserData() {
  loadNotes();
  loadCategories();
  loadTags();
  renderNotes();
  updateCategoryDropdowns();
  updateTagDropdown();
}

// Note CRUD Operations
function loadNotes() {
  const notesData = localStorage.getItem(`notes_${state.currentUser}`);
  state.notes = notesData ? JSON.parse(notesData) : [];

  // Initialize IDs if not present (for backward compatibility)
  state.notes.forEach((note, index) => {
      if (!note.id) note.id = Date.now() + index;
  });
}

function saveNotes() {
  localStorage.setItem(`notes_${state.currentUser}`, JSON.stringify(state.notes));
}

function loadCategories() {
  const categoriesData = localStorage.getItem(`categories_${state.currentUser}`);
  state.categories = categoriesData ? JSON.parse(categoriesData) : [];
}

function saveCategories() {
  localStorage.setItem(`categories_${state.currentUser}`, JSON.stringify(state.categories));
}

function loadTags() {
  const tagsData = localStorage.getItem(`tags_${state.currentUser}`);
  state.tags = tagsData ? JSON.parse(tagsData) : [];
}

function saveTags() {
  localStorage.setItem(`tags_${state.currentUser}`, JSON.stringify(state.tags));
}

// Render functions
function renderNotes(filteredNotes = null) {
  elements.notesList.innerHTML = "";
  const notesToRender = filteredNotes || state.notes;

  if (notesToRender.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = 'No notes found. Add your first note!';
      elements.notesList.appendChild(emptyMsg);
      return;
  }

  notesToRender.forEach(note => {
      const noteEl = document.createElement("div");
      noteEl.classList.add("note");
      noteEl.dataset.id = note.id;

      // Title
      const title = document.createElement("h3");
      title.textContent = note.title || 'Untitled Note';
      noteEl.appendChild(title);

      // Content
      if (note.content) {
          const content = document.createElement("p");
          content.textContent = note.content;
          noteEl.appendChild(content);
      }

      // Category
      if (note.category) {
          const category = document.createElement('div');
          category.className = 'tag';
          category.textContent = note.category;
          noteEl.appendChild(category);
      }

      // Tags
      if (note.tags && note.tags.length > 0) {
          const tagsContainer = document.createElement('div');
          note.tags.forEach(tag => {
              const tagEl = document.createElement('span');
              tagEl.className = 'tag';
              tagEl.textContent = tag;
              tagsContainer.appendChild(tagEl);
          });
          noteEl.appendChild(tagsContainer);
      }

      // Date
      const date = document.createElement("small");
      date.textContent = note.date || new Date().toLocaleString();
      noteEl.appendChild(date);

      // Attachments
      if (note.files && note.files.length > 0) {
          const attachments = document.createElement("div");
          attachments.className = "attachments";
          
          note.files.forEach(file => {
              if (file.type.startsWith("image/")) {
                  const img = document.createElement("img");
                  img.src = file.data;
                  img.alt = file.name;
                  attachments.appendChild(img);
              } else {
                  const link = document.createElement("a");
                  link.href = file.data;
                  if (file.type === "application/pdf") {
                      link.textContent = `View PDF: ${file.name}`;
                      link.target = "_blank";
                  } else {
                      link.textContent = `Download: ${file.name}`;
                      link.download = file.name;
                  }
                  attachments.appendChild(link);
              }
          });
          
          noteEl.appendChild(attachments);
      }

      // Actions
      const actions = document.createElement("div");
      actions.className = "actions";
      
      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => editNote(note.id);
      actions.appendChild(editBtn);
      
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => deleteNote(note.id);
      actions.appendChild(deleteBtn);
      
      const shareBtn = document.createElement("button");
      shareBtn.textContent = "Share";
      shareBtn.onclick = () => shareNote(note.id);
      actions.appendChild(shareBtn);
      
      noteEl.appendChild(actions);
      elements.notesList.appendChild(noteEl);
  });
}

function updateCategoryDropdowns() {
  // Update note form category dropdown
  elements.noteCategory.innerHTML = '<option value="">Select Category</option>';
  state.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      elements.noteCategory.appendChild(option);
  });

  // Update filter category dropdown
  elements.categoryFilter.innerHTML = '<option value="">All Categories</option>';
  state.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      elements.categoryFilter.appendChild(option);
  });
}

function updateTagDropdown() {
  elements.tagFilter.innerHTML = '<option value="">All Tags</option>';
  state.tags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      elements.tagFilter.appendChild(option);
  });
}

// Note actions
async function addNote() {
  const title = elements.noteTitle.value.trim();
  const content = elements.noteContent.value.trim();
  const category = elements.noteCategory.value.trim();
  const tags = elements.noteTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const files = elements.noteFile.files;

  if (!title && !content && files.length === 0) {
      showError("Please add content or upload a file.");
      return;
  }

  // Show loading state
  const originalText = elements.addNoteBtn.textContent;
  elements.addNoteBtn.innerHTML = '<span class="loading"></span> Processing...';

  try {
      const newNote = {
          id: Date.now(),
          title,
          content,
          category,
          tags,
          date: new Date().toLocaleString(),
          files: []
      };

      // Process files if any
      if (files.length > 0) {
          newNote.files = await processFiles(files);
      }

      // Add to state
      if (state.editingNoteId) {
          // Update existing note
          const index = state.notes.findIndex(n => n.id === state.editingNoteId);
          if (index !== -1) {
              state.notes[index] = newNote;
          }
          state.editingNoteId = null;
          elements.cancelEditBtn.style.display = 'none';
          elements.addNoteBtn.textContent = 'Add Note';
      } else {
          // Add new note
          state.notes.unshift(newNote);
      }

      // Update categories and tags if new ones were added
      updateCategoriesAndTags(category, tags);

      // Save and render
      saveNotes();
      renderNotes();
      resetNoteForm();
  } catch (error) {
      showError("Error processing files: " + error.message);
  } finally {
      elements.addNoteBtn.textContent = originalText;
  }
}

async function processFiles(files) {
  const filePromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => {
              resolve({
                  name: file.name,
                  type: file.type,
                  data: e.target.result
              });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  });
  return Promise.all(filePromises);
}

function updateCategoriesAndTags(category, tags) {
  let needsUpdate = false;
  
  // Add new category if not exists
  if (category && !state.categories.includes(category)) {
      state.categories.push(category);
      needsUpdate = true;
  }
  
  // Add new tags if not exists
  tags.forEach(tag => {
      if (!state.tags.includes(tag)) {
          state.tags.push(tag);
          needsUpdate = true;
      }
  });
  
  if (needsUpdate) {
      saveCategories();
      saveTags();
      updateCategoryDropdowns();
      updateTagDropdown();
  }
}

function editNote(noteId) {
  const note = state.notes.find(n => n.id === noteId);
  if (!note) return;

  state.editingNoteId = noteId;
  elements.noteTitle.value = note.title || '';
  elements.noteContent.value = note.content || '';
  elements.noteCategory.value = note.category || '';
  elements.noteTags.value = note.tags ? note.tags.join(', ') : '';
  elements.addNoteBtn.textContent = 'Update Note';
  elements.cancelEditBtn.style.display = 'inline-block';
}

function cancelEdit() {
  state.editingNoteId = null;
  resetNoteForm();
  elements.cancelEditBtn.style.display = 'none';
  elements.addNoteBtn.textContent = 'Add Note';
}

function resetNoteForm() {
  elements.noteTitle.value = '';
  elements.noteContent.value = '';
  elements.noteCategory.value = '';
  elements.noteTags.value = '';
  elements.noteFile.value = '';
}

function deleteNote(noteId) {
  if (confirm("Are you sure you want to delete this note?")) {
      state.notes = state.notes.filter(note => note.id !== noteId);
      saveNotes();
      renderNotes();
  }
}

function shareNote(noteId) {
  const note = state.notes.find(n => n.id === noteId);
  if (!note) return;

  // In a real app, this would generate a shareable link (server-side)
  // For this demo, we'll just show a mock share link
  const shareUrl = `${window.location.origin}${window.location.pathname}?sharedNote=${noteId}`;
  elements.shareLink.value = shareUrl;
  openModal('shareModal');
}

function copyShareLink() {
  elements.shareLink.select();
  document.execCommand('copy');
  alert('Link copied to clipboard!');
}

// Filtering and searching
function filterNotes() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const categoryFilter = elements.categoryFilter.value;
  const tagFilter = elements.tagFilter.value;

  const filtered = state.notes.filter(note => {
      const matchesSearch = !searchTerm || 
          (note.title && note.title.toLowerCase().includes(searchTerm)) || 
          (note.content && note.content.toLowerCase().includes(searchTerm));
      
      const matchesCategory = !categoryFilter || note.category === categoryFilter;
      
      const matchesTag = !tagFilter || 
          (note.tags && note.tags.includes(tagFilter));
      
      return matchesSearch && matchesCategory && matchesTag;
  });

  renderNotes(filtered);
}

// Auth functions
async function login() {
  const email = elements.authEmail.value.trim();
  const pass = elements.authPassword.value.trim();
  
  if (!email || !pass) {
      showError("Please enter both email and password.");
      return;
  }

  // Show loading state
  const originalText = elements.loginBtn.textContent;
  elements.loginBtn.innerHTML = '<span class="loading"></span> Logging in...';

  try {
      const userData = JSON.parse(localStorage.getItem(`user_${email}`));
      
      // Verify password (in a real app, this would be a server-side check with hashed passwords)
      if (!userData || !(await verifyPassword(pass, userData.password))) {
          showError("Invalid email or password.");
          return;
      }

      // Login successful
      state.currentUser = email;
      localStorage.setItem('currentUser', email);
      elements.authSection.style.display = "none";
      elements.appSection.style.display = "block";
      loadUserData();
  } catch (error) {
      showError("An error occurred during login.");
  } finally {
      elements.loginBtn.textContent = originalText;
  }
}

async function signup() {
  const email = elements.authEmail.value.trim();
  const pass = elements.authPassword.value.trim();
  
  if (!email || !pass) {
      showError("Please enter both email and password.");
      return;
  }
  
  if (localStorage.getItem(`user_${email}`)) {
      showError("Email already exists.");
      return;
  }

  // Hash password before storing
  const hashedPassword = await hashPassword(pass);
  
  localStorage.setItem(`user_${email}`, JSON.stringify({ 
      password: hashedPassword 
  }));
  
  alert("Signup successful! Please login.");
  elements.authEmail.value = '';
  elements.authPassword.value = '';
}

function logout() {
  state.currentUser = null;
  localStorage.removeItem('currentUser');
  elements.authSection.style.display = "block";
  elements.appSection.style.display = "none";
  resetNoteForm();
}

// Security functions
async function hashPassword(password) {
  // Use Web Crypto API for basic hashing (in a real app, use proper password hashing)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(inputPassword, storedHash) {
  const inputHash = await hashPassword(inputPassword);
  return inputHash === storedHash;
}

// Backup functions
function exportNotes() {
  const data = JSON.stringify(state.notes, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `notesnest_export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importNotes(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
      try {
          const importedNotes = JSON.parse(e.target.result);
          
          if (!Array.isArray(importedNotes)) {
              throw new Error('Invalid notes format');
          }
          
          // Merge imported notes with existing ones
          const existingIds = new Set(state.notes.map(n => n.id));
          const newNotes = importedNotes.filter(note => !existingIds.has(note.id));
          
          if (newNotes.length === 0) {
              alert('No new notes found in the import file.');
              return;
          }
          
          if (confirm(`Import ${newNotes.length} notes?`)) {
              state.notes = [...newNotes, ...state.notes];
              
              // Update categories and tags from imported notes
              newNotes.forEach(note => {
                  if (note.category && !state.categories.includes(note.category)) {
                      state.categories.push(note.category);
                  }
                  if (note.tags) {
                      note.tags.forEach(tag => {
                          if (!state.tags.includes(tag)) {
                              state.tags.push(tag);
                          }
                      });
                  }
              });
              
              saveNotes();
              saveCategories();
              saveTags();
              renderNotes();
              updateCategoryDropdowns();
              updateTagDropdown();
              alert('Notes imported successfully!');
          }
      } catch (error) {
          alert('Error importing notes: ' + error.message);
      }
  };
  reader.readAsText(file);
  input.value = ''; // Reset file input
}

// UI Helpers
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function showError(message) {
  elements.authError.textContent = message;
  setTimeout(() => {
      elements.authError.textContent = '';
  }, 5000);
}

// Event Listeners
elements.darkToggle.addEventListener('change', (e) => {
  state.darkMode = e.target.checked;
  document.body.classList.toggle('dark', state.darkMode);
  localStorage.setItem('darkMode', state.darkMode);
});

// Initialize the app
init();