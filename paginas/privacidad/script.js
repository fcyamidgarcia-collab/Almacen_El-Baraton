document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for barra-lateral links
    const barra-lateralLinks = document.querySelectorAll('.barra-lateral a');
    
    barra-lateralLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Highlight activo section on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('.contenido-principal section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Adjust offset to trigger activo state properly
            if (pageYOffset >= sectionTop - 150) {
                current = '#' + section.getAttribute('id');
            }
        });
        
        barra-lateralLinks.forEach(link => {
            link.classList.remove('activo');
            if (link.getAttribute('href') === current) {
                link.classList.add('activo');
            }
        });
    });
});
