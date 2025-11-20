// Archivo JavaScript principal para A365 Analyst

document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('mobile-menu');
    const modal = document.getElementById('mobile-menu-modal');
    const overlay = document.getElementById('mobile-menu-overlay');
    const closeBtn = document.getElementById('mobile-menu-close');

    function openMenu() {
        if (!modal) return;
        modal.classList.remove('hidden');
        if (btn) btn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('overflow-hidden');
    }

    function closeMenu() {
        if (!modal) return;
        modal.classList.add('hidden');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('overflow-hidden');
    }

    if (btn && modal) {
        btn.addEventListener('click', openMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }
    document.addEventListener('keydown', function(e){
        if (e.key === 'Escape') closeMenu();
    });

    // Flash message auto-dismiss
    const flashMessages = document.querySelectorAll('[data-dismissible]');
    flashMessages.forEach(message => {
        const dismissButton = message.querySelector('[data-dismiss]');
        if (dismissButton) {
            dismissButton.addEventListener('click', () => {
                message.style.opacity = '0';
                setTimeout(() => {
                    message.remove();
                }, 300);
            });
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (message) {
                message.style.opacity = '0';
                setTimeout(() => {
                    message.remove();
                }, 300);
            }
        }, 5000);
    });

    // Form validation
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('border-red-500');
                    
                    // Add error message if not already present
                    if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('text-red-600')) {
                        const error = document.createElement('p');
                        error.className = 'mt-1 text-sm text-red-600';
                        error.textContent = field.getAttribute('data-error-message') || 'This field is required';
                        field.parentNode.insertBefore(error, field.nextSibling);
                    }
                } else {
                    field.classList.remove('border-red-500');
                    const errorMessage = field.nextElementSibling;
                    if (errorMessage && errorMessage.classList.contains('text-red-600')) {
                        errorMessage.remove();
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                
                // Scroll to first error
                const firstError = form.querySelector('.border-red-500');
                if (firstError) {
                    firstError.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        });
    });

    // Password confirmation validation
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(passwordField => {
        if (passwordField.id === 'password2') {
            const password1 = document.getElementById('password');
            if (password1) {
                const validatePasswordMatch = () => {
                    if (passwordField.value !== password1.value) {
                        passwordField.setCustomValidity('Passwords do not match');
                    } else {
                        passwordField.setCustomValidity('');
                    }
                };
                
                passwordField.addEventListener('input', validatePasswordMatch);
                if (password1) {
                    password1.addEventListener('input', validatePasswordMatch);
                }
            }
        }
    });

    // Initialize tooltips
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    tooltipTriggers.forEach(trigger => {
        // Add event listeners for tooltips if needed
    });

    // Handle modals
    const modalButtons = document.querySelectorAll('[data-modal-toggle]');
    modalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal-toggle');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.toggle('hidden');
                
                // Close when clicking outside
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.classList.add('hidden');
                    }
                });
                
                // Close with escape key
                document.addEventListener('keydown', function closeOnEscape(e) {
                    if (e.key === 'Escape') {
                        modal.classList.add('hidden');
                        document.removeEventListener('keydown', closeOnEscape);
                    }
                });
            }
        });
    });

    // Handle tab components
    const tabGroups = document.querySelectorAll('[data-tabs]');
    tabGroups.forEach(group => {
        const tabs = group.querySelectorAll('[data-tab]');
        const tabContents = group.querySelectorAll('[data-tab-content]');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('border-blue-500', 'text-blue-600'));
                this.classList.add('border-blue-500', 'text-blue-600');
                
                // Show corresponding content
                tabContents.forEach(content => {
                    if (content.getAttribute('data-tab-content') === tabId) {
                        content.classList.remove('hidden');
                    } else {
                        content.classList.add('hidden');
                    }
                });
            });
        });
    });
});

// Helper function to show a toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Toggle menu sections (accordion)
function toggleSection(sectionId) {
    const section = document.getElementById('section-' + sectionId);
    const icon = document.getElementById('icon-' + sectionId);
    const sidebar = document.getElementById('sidebar-modules');

    if (section && icon) {
        // Si el menú está colapsado, expandirlo primero
    const isCollapsed = sidebar && (sidebar.style.width === '64px' || !sidebar.style.width);

        if (isCollapsed) {
            // Expandir el menú primero
            toggleModulesMenu();

            // Luego expandir la sección con un pequeño delay
            setTimeout(() => {
                section.classList.remove('hidden');
                icon.style.transform = 'rotate(90deg)';
                localStorage.setItem('menu-section-' + sectionId, 'open');
            }, 350);
        } else {
            // Comportamiento normal: toggle de la sección
            const isHidden = section.classList.contains('hidden');

            if (isHidden) {
                section.classList.remove('hidden');
                icon.style.transform = 'rotate(90deg)';
            } else {
                section.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
            }

            // Guardar estado en localStorage
            localStorage.setItem('menu-section-' + sectionId, isHidden ? 'open' : 'closed');
        }
    }
}

// Toggle del menú completo de módulos con animación lateral
function toggleModulesMenu() {
    const sidebar = document.getElementById('sidebar-modules');
    const icon = document.getElementById('modules-toggle-icon');
    const title = document.getElementById('modules-title');

    if (!sidebar || !icon || !title) return;

    const isCollapsed = sidebar.style.width === '64px';

    if (isCollapsed) {
        sidebar.style.width = '240px';
        icon.style.transform = 'rotate(180deg)';
        title.classList.remove('fade-leave', 'fade-leave-active');
        title.classList.add('fade-enter-active');
        setTimeout(() => {
            title.classList.remove('fade-enter-active');
        }, 180);
        localStorage.setItem('modules-menu-state', 'open');
    } else {
        sidebar.style.width = '64px';
        icon.style.transform = 'rotate(0deg)';
        title.classList.add('fade-leave-active');
        setTimeout(() => {
            title.classList.remove('fade-leave-active');
        }, 160);
        localStorage.setItem('modules-menu-state', 'closed');
    }
}

// Resaltar elemento activo en el menú
function highlightActiveMenuItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;

        if (currentPath === linkPath || currentPath.startsWith(linkPath + '/')) {
            link.classList.add('nav-link-active', 'font-bold');
            link.classList.remove('text-gray-600');
        }
    });
}

// Restaurar estado del menú al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Restaurar estado del menú (colapsado en home, recordar en otras páginas)
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || currentPath === '/index' || currentPath === '';
    const modulesMenuState = localStorage.getItem('modules-menu-state');
    const sidebar = document.getElementById('sidebar-modules');
    const modulesIcon = document.getElementById('modules-toggle-icon');
    const modulesTitle = document.getElementById('modules-title');

    if (sidebar && modulesIcon && modulesTitle) {
        if (modulesMenuState === 'open') {
            sidebar.style.width = '240px';
            modulesIcon.style.transform = 'rotate(180deg)';
        } else if (modulesMenuState === 'closed') {
            sidebar.style.width = '64px';
            modulesIcon.style.transform = 'rotate(0deg)';
        }
    }

    // Colapsar todas las secciones por defecto en la primera carga
    const sections = ['dashboards', 'reportes', 'personal', 'sistema'];
    const mobileSections = ['mobile-dashboards', 'mobile-reportes', 'mobile-personal', 'mobile-sistema'];

    // Menú desktop
    sections.forEach(sectionId => {
        const savedState = localStorage.getItem('menu-section-' + sectionId);
        const section = document.getElementById('section-' + sectionId);
        const icon = document.getElementById('icon-' + sectionId);

        if (section && icon) {
            // Si hay estado guardado y es 'open', expandir. Si no, colapsar por defecto
            if (savedState === 'open') {
                section.classList.remove('hidden');
                icon.style.transform = 'rotate(90deg)';
            } else {
                section.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
            }
        }
    });

    // Menú móvil - colapsar por defecto
    mobileSections.forEach(sectionId => {
        const savedState = localStorage.getItem('menu-section-' + sectionId);
        const section = document.getElementById('section-' + sectionId);
        const icon = document.getElementById('icon-' + sectionId);

        if (section && icon) {
            if (savedState === 'open') {
                section.classList.remove('hidden');
                icon.style.transform = 'rotate(90deg)';
            } else {
                section.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
            }
        }
    });

    // Resaltar elemento activo
    highlightActiveMenuItem();

    // Enlaces a Inicio no modifican el estado del menú
});

// Export for use in other modules if needed
window.A365Analyst = { showToast, toggleSection };
// Alias temporal para compatibilidad hacia atrás
window.WindSurf = window.A365Analyst;
