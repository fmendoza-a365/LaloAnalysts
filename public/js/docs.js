// JavaScript para la página de documentación

// Toggle sidebar móvil
document.getElementById('mobile-sidebar-btn')?.addEventListener('click', function() {
  const sidebar = document.getElementById('mobile-sidebar');
  sidebar.classList.toggle('hidden');
});

// Smooth scroll y active state en sidebar
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', function(e) {
    // Remover active de todos
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    // Agregar active al clickeado
    this.classList.add('active');
    
    // Cerrar sidebar móvil si está abierto
    const mobileSidebar = document.getElementById('mobile-sidebar');
    if (mobileSidebar && !mobileSidebar.classList.contains('hidden')) {
      mobileSidebar.classList.add('hidden');
    }
  });
});

// Copiar código al clipboard
function copyCode(button) {
  const codeBlock = button.nextElementSibling || button.parentElement.querySelector('code');
  const code = codeBlock.textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.textContent;
    button.textContent = '✅ Copiado';
    button.style.background = 'rgba(16, 185, 129, 0.2)';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  });
}

// Destacar sección activa al hacer scroll
let sections = document.querySelectorAll('.content-section');
let sidebarLinks = document.querySelectorAll('.sidebar-link');

function highlightActiveSection() {
  let currentSection = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= sectionTop - 100) {
      currentSection = section.getAttribute('id');
    }
  });
  
  sidebarLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSection}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', highlightActiveSection);
highlightActiveSection(); // Ejecutar al cargar

// Búsqueda en documentación (opcional)
let searchTimeout;
function searchDocs(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const lowerQuery = query.toLowerCase();
    sections.forEach(section => {
      const content = section.textContent.toLowerCase();
      if (content.includes(lowerQuery) || query === '') {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
  }, 300);
}
