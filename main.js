const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const themeSelector = document.getElementById('themeSelector');

let width, height;
let time = 0;
let currentTheme = 'evening';

// Theme configurations
const themes = {
    morning: {
        skyGrad: ['#38bdf8', '#7dd3fc', '#fdf4ff', '#fef08a'],
        sunPos: 0.7, // Lower horizon
        sunColor: ['rgba(253, 224, 71, 1)', 'rgba(253, 230, 138, 0.8)', 'rgba(254, 240, 138, 0)'],
        sunSize: 90,
        starsOpacity: 0,
        waveReflect: 'rgba(253, 230, 138, 0.4)', // Golden reflection
        wavesColorOffset: 'rgba(14, 165, 233, '
    },
    afternoon: {
        skyGrad: ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'],
        sunPos: 0.2, // High above
        sunColor: ['rgba(255, 255, 255, 1)', 'rgba(253, 246, 227, 0.8)', 'rgba(255, 255, 255, 0)'],
        sunSize: 100,
        starsOpacity: 0,
        waveReflect: 'rgba(224, 242, 254, 0.4)', // Bright white/blue reflection
        wavesColorOffset: 'rgba(2, 132, 199, '
    },
    evening: {
        skyGrad: ['#0f172a', '#4c1d95', '#be185d', '#f97316'],
        sunPos: 0.5,
        sunColor: ['rgba(254, 240, 138, 1)', 'rgba(251, 146, 60, 0.8)', 'rgba(249, 115, 22, 0)'],
        sunSize: 80,
        starsOpacity: 0.4, // Some stars visible
        waveReflect: 'rgba(244, 114, 182, 0.4)', // Pinkish reflection
        wavesColorOffset: 'rgba(30, 58, 138, '
    },
    night: {
        skyGrad: ['#020617', '#020617', '#0f172a', '#1e293b'],
        sunPos: 0.3, // Moon
        sunColor: ['rgba(248, 250, 252, 1)', 'rgba(226, 232, 240, 0.6)', 'rgba(203, 213, 225, 0)'],
        sunSize: 60,
        starsOpacity: 1, // Full stars
        waveReflect: 'rgba(148, 163, 184, 0.3)', // Silver moonlight reflection
        wavesColorOffset: 'rgba(15, 23, 42, '
    }
};

const stars = [];
const STAR_COUNT = 150;

// Ocean Waves Geometry
const waves = [
    { yOffset: 0.55, amplitude: 35, frequency: 0.003, speed: 0.015, alpha: 0.4, crestSharpness: 2 },
    { yOffset: 0.65, amplitude: 55, frequency: 0.002, speed: 0.02, alpha: 0.6, crestSharpness: 2.5 },
    { yOffset: 0.75, amplitude: 70, frequency: 0.004, speed: 0.018, alpha: 0.7, crestSharpness: 3 },
    { yOffset: 0.85, amplitude: 90, frequency: 0.0015, speed: 0.025, alpha: 0.8, crestSharpness: 3.5 },
    { yOffset: 0.95, amplitude: 60, frequency: 0.005, speed: 0.035, alpha: 0.95, crestSharpness: 2 }
];

let mouse = { x: 0, y: 0 };

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    initStars();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

themeSelector.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    document.body.classList.toggle('light-theme', currentTheme === 'morning' || currentTheme === 'afternoon');
});
// Trigger once on load
document.body.classList.toggle('light-theme', currentTheme === 'morning' || currentTheme === 'afternoon');

function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.6),
            radius: Math.random() * 1.5,
            opacity: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinkleDir: Math.random() > 0.5 ? 1 : -1
        });
    }
}

function drawSky(theme) {
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    bgGradient.addColorStop(0, theme.skyGrad[0]);
    bgGradient.addColorStop(0.3, theme.skyGrad[1]);
    bgGradient.addColorStop(0.7, theme.skyGrad[2]);
    bgGradient.addColorStop(1, theme.skyGrad[3]);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    if (theme.starsOpacity > 0) {
        stars.forEach(star => {
            star.opacity += star.twinkleSpeed * star.twinkleDir;
            if (star.opacity <= 0.05) star.twinkleDir = 1;
            else if (star.opacity >= 0.8) star.twinkleDir = -1;

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(star.opacity, theme.starsOpacity)})`;
            ctx.fill();
            ctx.closePath();
        });
    }

    ctx.beginPath();
    ctx.arc(width * 0.5, height * theme.sunPos, theme.sunSize, 0, Math.PI * 2); 
    
    const sunGradient = ctx.createRadialGradient(width * 0.5, height * theme.sunPos, theme.sunSize * 0.2, width * 0.5, height * theme.sunPos, theme.sunSize * 2.5);
    sunGradient.addColorStop(0, theme.sunColor[0]);
    sunGradient.addColorStop(0.2, theme.sunColor[1]);
    sunGradient.addColorStop(1, theme.sunColor[2]);
    
    ctx.fillStyle = sunGradient;
    ctx.fill();
    ctx.closePath();
}

function drawWaves(theme) {
    const mouseInfluence = (mouse.x / width) - 0.5;

    waves.forEach((wave, index) => {
        ctx.beginPath();
        ctx.moveTo(0, height); 
        
        const baseY = height * wave.yOffset;
        
        for (let x = 0; x <= width; x += 5) { 
            const primaryPhase = x * wave.frequency + time * wave.speed + (mouseInfluence * index * 0.5);
            const secondaryPhase = x * wave.frequency * 2.5 - time * wave.speed * 1.5;
            
            const smoothSin = Math.sin(primaryPhase);
            const sharpCrest = Math.pow((smoothSin + 1) / 2, wave.crestSharpness); 
            const secondaryRipple = Math.sin(secondaryPhase) * 0.15; 
            
            const y = baseY - wave.amplitude * (sharpCrest + secondaryRipple);
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(width, height); 
        ctx.lineTo(0, height); 
        
        const gradient = ctx.createLinearGradient(0, baseY - wave.amplitude * 1.5, 0, height);
        gradient.addColorStop(0, theme.waveReflect); 
        gradient.addColorStop(0.25, theme.wavesColorOffset + wave.alpha + ')'); 
        gradient.addColorStop(1, theme.wavesColorOffset + '1)'); 
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
    });
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, width, height);
    
    const theme = themes[currentTheme];
    
    drawSky(theme);
    drawWaves(theme);
    
    time += 1;
}

// 3. Scroll Reveal Animations (Intersection Observer)
const revealElements = document.querySelectorAll('.reveal');
const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); 
        }
    });
}, observerOptions);

revealElements.forEach(el => observer.observe(el));

// Mobile navigation logic
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// Modal Logic
const modal = document.getElementById('projectModal');
const closeBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTechStack = document.getElementById('modalTechStack');

document.querySelectorAll('.modal-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const title = trigger.getAttribute('data-title');
        const desc = trigger.getAttribute('data-desc');
        const techs = trigger.getAttribute('data-tech').split(',');
        
        modalTitle.textContent = title;
        modalDesc.textContent = desc;
        
        modalTechStack.innerHTML = '';
        techs.forEach(tech => {
            const span = document.createElement('span');
            span.textContent = tech.trim();
            modalTechStack.appendChild(span);
        });
        
        modal.classList.add('show');
    });
});

closeBtn.addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

resizeCanvas();
initStars();
animate();
