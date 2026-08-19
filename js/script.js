const LIBROS_PARA_COMPRAR_UNO = 3;

let myBooks = JSON.parse(localStorage.getItem('my_library')) || [];
let myTags = JSON.parse(localStorage.getItem('my_tags')) || [];
let creditsAvailable = parseInt(localStorage.getItem('my_credits')) || 0;

let currentFilter = 'todos';
let currentTagFilter = 'todas';
let showHidden = false;

function saveAndRender() {
  localStorage.setItem('my_library', JSON.stringify(myBooks));
  localStorage.setItem('my_tags', JSON.stringify(myTags));
  localStorage.setItem('my_credits', creditsAvailable.toString());
  
  updateTagDropdown();
  renderGrid();
  updateCounter();
}

function updateCounter() {
  const leidosCount = myBooks.filter(b => b.status === 'leido').length;
  const progresoActual = leidosCount % LIBROS_PARA_COMPRAR_UNO;
  const faltantes = LIBROS_PARA_COMPRAR_UNO - progresoActual;

  const el = document.getElementById('rewardCounter');
  const btnRedeem = document.getElementById('btnRedeem');

  el.innerHTML = `📖 Progreso: <strong>${progresoActual}/${LIBROS_PARA_COMPRAR_UNO}</strong> leídos (faltan ${faltantes}) | Créditos: <strong>${creditsAvailable}</strong>`;

  if (creditsAvailable > 0) {
    btnRedeem.style.display = 'block';
  } else {
    btnRedeem.style.display = 'none';
  }
}

function redeemCredit() {
  if (creditsAvailable > 0) {
    if (confirm('¿Quieres gastar 1 crédito para comprar un nuevo libro?')) {
      creditsAvailable--;
      saveAndRender();
    }
  }
}

function updateTagDropdown() {
  const tagSelect = document.getElementById('tagFilter');
  tagSelect.innerHTML = `<option value="todas">🏷️ Todas las etiquetas</option>`;
  
  myTags.sort().forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = `🏷️ ${tag}`;
    if (tag === currentTagFilter) opt.selected = true;
    tagSelect.appendChild(opt);
  });
}

function toggleShowHidden() {
  showHidden = !showHidden;
  const btn = document.getElementById('btnToggleHidden');
  if (showHidden) {
    btn.classList.add('active');
    btn.textContent = 'Ocultar contenido oculto';
  } else {
    btn.classList.remove('active');
    btn.textContent = 'Mostrar contenido oculto';
  }
  renderGrid();
}

function toggleHideBook(id) {
  const book = myBooks.find(b => b.id === id);
  if (book) {
    book.hidden = !book.hidden;
    saveAndRender();
  }
}

function renderGrid() {
  const grid = document.getElementById('bookGrid');
  const searchQuery = document.getElementById('localSearch').value.toLowerCase().trim();
  grid.innerHTML = '';
  
  // 1. Filtrar por estado oculto
  let filtered = showHidden ? myBooks : myBooks.filter(b => !b.hidden);
  
  // 2. Filtrar por estado (pestañas)
  if (currentFilter !== 'todos') {
    filtered = filtered.filter(b => b.status === currentFilter);
  }
  
  // 3. Filtrar por etiqueta
  if (currentTagFilter !== 'todas') {
    filtered = filtered.filter(b => b.tag === currentTagFilter);
  }

  // 4. Filtrar por búsqueda de texto
  if (searchQuery !== '') {
    filtered = filtered.filter(b => b.title.toLowerCase().includes(searchQuery));
  }

  filtered.sort((a, b) => a.title.localeCompare(b.title));

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">No se encontraron libros.</p>`;
    return;
  }

  filtered.forEach(book => {
    const card = document.createElement('div');
    card.className = `book-card ${book.hidden ? 'is-hidden' : ''}`;
    card.innerHTML = `
      <img src="${book.coverUrl}" class="book-cover" alt="Portada de ${book.title}">
      <div class="book-info">
        <div>
          <div class="badges-wrapper">
            <span class="badge badge-${book.status}">${book.status.replace('_', ' ')}</span>
            ${book.tag ? `<span class="badge badge-custom-tag">🏷️ ${book.tag}</span>` : ''}
            ${book.hidden ? `<span class="badge badge-hidden-tag">Oculto</span>` : ''}
          </div>
          <h3 class="book-title">${book.title}</h3>
          ${book.rating ? `<div class="rating-stars">${'★'.repeat(book.rating)}${'☆'.repeat(5-book.rating)}</div>` : ''}
          ${book.finishDate ? `<div class="date-text">Finalizado: ${book.finishDate}</div>` : ''}
        </div>
        <div>
          <select class="status-select" onchange="changeStatus('${book.id}', this.value)">
            <option value="sin_leer" ${book.status==='sin_leer'?'selected':''}>Sin leer</option>
            <option value="en_progreso" ${book.status==='en_progreso'?'selected':''}>En progreso</option>
            <option value="leido" ${book.status==='leido'?'selected':''}>Leído</option>
          </select>

          <div class="card-actions">
            <button class="btn-action btn-edit" onclick="editBook('${book.id}')">✏️ Editar</button>
            <button class="btn-action btn-hide-toggle" onclick="toggleHideBook('${book.id}')">
              ${book.hidden ? 'Desocultar' : 'Ocultar'}
            </button>
            <button class="btn-action btn-delete" onclick="deleteBook('${book.id}')">🗑️ Borrar</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterStatus(status, btn) {
  currentFilter = status;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}

function filterTag(tag) {
  currentTagFilter = tag;
  renderGrid();
}

function getOrPromptTag(currentTag = '') {
  let tagMessage = 'Etiqueta/Categoría (opcional):\nEscribe una nueva o elige una existente:\n';
  if (myTags.length > 0) {
    tagMessage += 'Existentes: ' + myTags.join(', ') + '\n';
  }
  
  const selectedTag = prompt(tagMessage, currentTag);
  if (!selectedTag) return '';

  const cleanTag = selectedTag.trim();
  if (cleanTag && !myTags.includes(cleanTag)) {
    myTags.push(cleanTag);
  }
  return cleanTag;
}

function addManualBook() {
  const title = prompt('Título del libro:');
  if (!title || !title.trim()) return;

  const coverUrl = prompt('URL de la imagen de portada (opcional):', '') || 'https://via.placeholder.com/150x220?text=Sin+Portada';
  const tag = getOrPromptTag();

  myBooks.push({
    id: Date.now().toString(),
    title: title.trim(),
    coverUrl: coverUrl.trim(),
    tag: tag,
    status: 'sin_leer',
    hidden: false,
    rating: 0,
    finishDate: null
  });

  saveAndRender();
}

function editBook(id) {
  const book = myBooks.find(b => b.id === id);
  if (!book) return;

  const newTitle = prompt('Editar título del libro:', book.title);
  if (newTitle === null) return;

  const newCover = prompt('Editar URL de la portada:', book.coverUrl);
  const newTag = getOrPromptTag(book.tag || '');

  if (newTitle.trim() !== '') book.title = newTitle.trim();
  if (newCover !== null && newCover.trim() !== '') book.coverUrl = newCover.trim();
  book.tag = newTag;

  saveAndRender();
}

function deleteBook(id) {
  const book = myBooks.find(b => b.id === id);
  if (!book) return;

  if (confirm(`¿Estás seguro de que quieres eliminar "${book.title}"?`)) {
    const wasRead = book.status === 'leido';
    myBooks = myBooks.filter(b => b.id !== id);

    if (wasRead && creditsAvailable > 0 && (myBooks.filter(b => b.status === 'leido').length % LIBROS_PARA_COMPRAR_UNO === 2)) {
      creditsAvailable--;
    }

    saveAndRender();
  }
}

function changeStatus(id, newStatus) {
  const book = myBooks.find(b => b.id === id);
  if (book) {
    const oldStatus = book.status;
    book.status = newStatus;

    if (newStatus === 'leido') {
      const stars = prompt('Valoración (1 al 5 estrellas):', '5');
      book.rating = Math.min(5, Math.max(1, parseInt(stars) || 5));
      book.finishDate = new Date().toISOString().split('T')[0];

      const totalLeidos = myBooks.filter(b => b.status === 'leido').length;
      if (oldStatus !== 'leido' && totalLeidos % LIBROS_PARA_COMPRAR_UNO === 0) {
        creditsAvailable++;
      }
    } else {
      const totalLeidos = myBooks.filter(b => b.status === 'leido').length;
      if (oldStatus === 'leido' && creditsAvailable > 0 && (totalLeidos + 1) % LIBROS_PARA_COMPRAR_UNO === 0) {
        creditsAvailable--;
      }
      book.rating = 0;
      book.finishDate = null;
    }

    saveAndRender();
  }
}

// Carga inicial
updateTagDropdown();
renderGrid();
updateCounter();