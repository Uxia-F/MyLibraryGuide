
    // Configuración general
    const LIBROS_PARA_COMPRAR_UNO = 3; // Modifica este número si prefieres leer 2, 4 o 5 libros para comprar 1 nuevo
    let myBooks = JSON.parse(localStorage.getItem('my_library')) || [];
    let currentFilter = 'todos';

    function saveAndRender() {
      localStorage.setItem('my_library', JSON.stringify(myBooks));
      renderGrid();
      updateCounter();
    }

    function updateCounter() {
      const leidosCount = myBooks.filter(b => b.status === 'leido').length;
      const creditos = Math.floor(leidosCount / LIBROS_PARA_COMPRAR_UNO);
      const faltantes = LIBROS_PARA_COMPRAR_UNO - (leidosCount % LIBROS_PARA_COMPRAR_UNO);
      
      const el = document.getElementById('rewardCounter');
      if (faltantes === LIBROS_PARA_COMPRAR_UNO) {
        el.innerHTML = `🎁 ¡Tienes <strong>${creditos}</strong> crédito(s) de compra disponible(s)!`;
      } else {
        el.innerHTML = `📖 Lee <strong>${faltantes}</strong> libro(s) más para poder comprar otro (Créditos acumulados: ${creditos})`;
      }
    }

    function renderGrid() {
      const grid = document.getElementById('bookGrid');
      grid.innerHTML = '';
      
      let filtered = currentFilter === 'todos' ? myBooks : myBooks.filter(b => b.status === currentFilter);
      
      // Ordenamiento alfabético A-Z por título
      filtered.sort((a, b) => a.title.localeCompare(b.title));

      if (filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">No hay libros en esta categoría.</p>`;
        return;
      }

      filtered.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
          <img src="${book.coverUrl}" class="book-cover" alt="Portada de ${book.title}">
          <div class="book-info">
            <div>
              <span class="badge badge-${book.status}">${book.status.replace('_', ' ')}</span>
              <h3 class="book-title">${book.title}</h3>
              ${book.rating ? `<div class="rating-stars">${'★'.repeat(book.rating)}${'☆'.repeat(5-book.rating)}</div>` : ''}
              ${book.finishDate ? `<div class="date-text">Finalizado: ${book.finishDate}</div>` : ''}
            </div>
            <select class="status-select" onchange="changeStatus('${book.id}', this.value)">
              <option value="sin_leer" ${book.status==='sin_leer'?'selected':''}>Sin leer</option>
              <option value="en_progreso" ${book.status==='en_progreso'?'selected':''}>En progreso</option>
              <option value="leido" ${book.status==='leido'?'selected':''}>Leído</option>
            </select>
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

    async function searchGoogleBooks() {
      const query = document.getElementById('apiSearch').value;
      if (!query) return alert('Ingresa el nombre de un libro.');
      
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.items && data.items.length > 0) {
          const item = data.items[0].volumeInfo;
          
          // Reemplaza HTTP por HTTPS para evitar imágenes bloqueadas
          let cover = item.imageLinks?.thumbnail || 'https://via.placeholder.com/150x220?text=Sin+Portada';
          cover = cover.replace('http://', 'https://');

          const newBook = {
            id: Date.now().toString(),
            title: item.title || 'Sin título',
            coverUrl: cover,
            status: 'sin_leer',
            rating: 0,
            finishDate: null
          };
          
          myBooks.push(newBook);
          saveAndRender();
          document.getElementById('apiSearch').value = '';
        } else {
          alert('No se encontraron libros con ese título.');
        }
      } catch (err) {
        alert('Error al conectar con la API de Google Books.');
      }
    }

    function changeStatus(id, newStatus) {
      const book = myBooks.find(b => b.id === id);
      if (book) {
        book.status = newStatus;
        if (newStatus === 'leido') {
          const stars = prompt('Valoración (1 al 5 estrellas):', '5');
          book.rating = Math.min(5, Math.max(1, parseInt(stars) || 5));
          book.finishDate = new Date().toISOString().split('T')[0];
        } else {
          book.rating = 0;
          book.finishDate = null;
        }
        saveAndRender();
      }
    }

    // Inicialización al cargar la página
    renderGrid();
    updateCounter();
  