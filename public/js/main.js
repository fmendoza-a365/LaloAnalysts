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
        const isCollapsed = sidebar && (sidebar.style.width === '60px' || !sidebar.style.width);

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
    const container = document.getElementById('modules-container');
    const icon = document.getElementById('modules-toggle-icon');
    const title = document.getElementById('modules-title');
    const hamburgerIcon = document.getElementById('modules-hamburger-icon');
    const menuTexts = document.querySelectorAll('.menu-text');
    const menuExpanded = document.querySelectorAll('.menu-expanded');

    if (sidebar && container && icon && title && hamburgerIcon) {
        const isCollapsed = sidebar.style.width === '60px' || !sidebar.style.width;

        if (isCollapsed) {
            // Expandir
            sidebar.style.width = '256px'; // w-64 = 16rem = 256px

            // Ocultar hamburger, mostrar título y chevron
            hamburgerIcon.style.opacity = '0';
            setTimeout(() => {
                hamburgerIcon.style.display = 'none';
                title.style.opacity = '1';
                icon.style.opacity = '1';
            }, 150);

            icon.style.transform = 'rotate(180deg)';

            // Mostrar textos con delay para animación suave
            setTimeout(() => {
                menuTexts.forEach(text => {
                    text.style.opacity = '1';
                    text.style.display = '';
                });
            }, 150);

            localStorage.setItem('modules-menu-state', 'open');
        } else {
            // Colapsar
            sidebar.style.width = '60px';

            // Ocultar título y chevron, mostrar hamburger
            title.style.opacity = '0';
            icon.style.opacity = '0';
            icon.style.transform = 'rotate(0deg)';

            setTimeout(() => {
                hamburgerIcon.style.display = '';
                hamburgerIcon.style.opacity = '1';
            }, 150);

            // Ocultar textos y cerrar submenús
            menuTexts.forEach(text => {
                text.style.opacity = '0';
                setTimeout(() => {
                    text.style.display = 'none';
                }, 300);
            });

            // Cerrar todos los submenús expandidos
            menuExpanded.forEach(menu => {
                menu.classList.add('hidden');
            });

            localStorage.setItem('modules-menu-state', 'closed');
        }
    }
}

// Resaltar elemento activo en el menú
function highlightActiveMenuItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;

        // Si el path actual coincide con el link
        if (currentPath === linkPath || currentPath.startsWith(linkPath + '/')) {
            // Determinar el color según la sección
            let bgColor = 'bg-blue-100';
            let textColor = 'text-blue-800';
            let borderColor = 'border-blue-400';

            if (link.href.includes('/srr') || link.href.includes('/kpis') || link.href.includes('/analytics')) {
                bgColor = 'bg-purple-100';
                textColor = 'text-purple-800';
                borderColor = 'border-purple-400';
            } else if (link.href.includes('/asesores') || link.href.includes('/asistencia')) {
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                borderColor = 'border-green-400';
            } else if (link.href.includes('/admin')) {
                bgColor = 'bg-orange-100';
                textColor = 'text-orange-800';
                borderColor = 'border-orange-400';
            } else if (link.href.includes('/custom-dashboard')) {
                bgColor = 'bg-purple-100';
                textColor = 'text-purple-800';
                borderColor = 'border-purple-400';
            }

            // Agregar clases de activo suaves
            link.classList.add(bgColor, textColor, 'font-bold', 'border-l-4', borderColor);
            link.classList.remove('text-gray-600');

            // Expandir la sección padre automáticamente solo si el menú está expandido
            const parentSection = link.closest('ul[id^="section-"]');
            if (parentSection) {
                const sectionId = parentSection.id.replace('section-', '');
                const icon = document.getElementById('icon-' + sectionId);
                const button = document.querySelector(`button[onclick="toggleSection('${sectionId}')"]`);
                const sidebar = document.getElementById('sidebar-modules');

                // Solo expandir si el menú lateral está expandido
                const isMenuExpanded = sidebar && sidebar.style.width === '256px';

                if (isMenuExpanded) {
                    parentSection.classList.remove('hidden');
                    if (icon) {
                        icon.style.transform = 'rotate(90deg)';
                    }
                }

                // Resaltar también el botón primario de la sección activa de forma sutil
                if (button) {
                    // Determinar color del botón según la sección
                    let buttonBg = 'bg-blue-100';
                    let buttonText = 'text-blue-700';

                    if (sectionId === 'reportes') {
                        buttonBg = 'bg-purple-100';
                        buttonText = 'text-purple-700';
                    } else if (sectionId === 'personal') {
                        buttonBg = 'bg-green-100';
                        buttonText = 'text-green-700';
                    } else if (sectionId === 'sistema') {
                        buttonBg = 'bg-orange-100';
                        buttonText = 'text-orange-700';
                    }

                    button.classList.add(buttonBg, buttonText);
                    button.classList.remove('bg-gray-50', 'text-gray-800');
                }
            }
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
    const modulesContainer = document.getElementById('modules-container');
    const modulesIcon = document.getElementById('modules-toggle-icon');
    const modulesTitle = document.getElementById('modules-title');
    const hamburgerIcon = document.getElementById('modules-hamburger-icon');
    const menuTexts = document.querySelectorAll('.menu-text');

    if (sidebar && modulesContainer && modulesIcon && modulesTitle && hamburgerIcon) {
        // Si estamos en home, SIEMPRE colapsado. Si no, respetar localStorage
        if (isHomePage || modulesMenuState !== 'open') {
            // Estado colapsado
            sidebar.style.width = '60px';
            modulesTitle.style.opacity = '0';
            modulesIcon.style.opacity = '0';
            modulesIcon.style.transform = 'rotate(0deg)';
            hamburgerIcon.style.opacity = '1';
            hamburgerIcon.style.display = '';
            menuTexts.forEach(text => {
                text.style.opacity = '0';
                text.style.display = 'none';
            });
        } else {
            // Estado expandido (solo si NO es home y localStorage dice 'open')
            sidebar.style.width = '256px';
            modulesTitle.style.opacity = '1';
            modulesIcon.style.opacity = '1';
            modulesIcon.style.transform = 'rotate(180deg)';
            hamburgerIcon.style.opacity = '0';
            hamburgerIcon.style.display = 'none';
            menuTexts.forEach(text => {
                text.style.opacity = '1';
                text.style.display = '';
            });
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

    // Colapsar menú SOLO al ir a Inicio o hacer clic en el logo
    const homeLinks = document.querySelectorAll('a[href="/"]');
    homeLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Guardar estado colapsado
            localStorage.setItem('modules-menu-state', 'closed');

            // Colapsar todas las secciones expandidas
            const sections = ['dashboards', 'reportes', 'personal', 'sistema'];
            sections.forEach(sectionId => {
                const section = document.getElementById('section-' + sectionId);
                const icon = document.getElementById('icon-' + sectionId);
                if (section && !section.classList.contains('hidden')) {
                    section.classList.add('hidden');
                    if (icon) {
                        icon.style.transform = 'rotate(0deg)';
                    }
                }
                localStorage.setItem('menu-section-' + sectionId, 'closed');
            });

            // Colapsar el menú lateral inmediatamente si existe
            const sidebar = document.getElementById('sidebar-modules');
            if (sidebar && sidebar.style.width === '256px') {
                toggleModulesMenu();
            }
        });
    });
});

// Export for use in other modules if needed
window.A365Analyst = { showToast, toggleSection };
// Alias temporal para compatibilidad hacia atrás
window.WindSurf = window.A365Analyst;
