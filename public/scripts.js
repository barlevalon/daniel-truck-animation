// Create audio context for honk sound
let audioContext = null;
let lastFocusElement = null;

// Vehicle configurations
const VEHICLES = {
    semi: {
        name: 'Semi Truck',
        icon: '🚛',
        defaultText: 'BIG RIG'
    },
    garbage: {
        name: 'Garbage Truck',
        icon: '🗑️',
        defaultText: 'TRASH CO'
    },
    cybertruck: {
        name: 'Pink Cybertruck',
        icon: '🚗',
        defaultText: ''
    }
};

let currentVehicle = 'semi';

function ensureAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
            /* Gracefully ignore resume failures */
        });
    }
    return audioContext;
}

function playHonk(preset = 'classic') {
    let context;
    try {
        context = ensureAudioContext();
    } catch (error) {
        return;
    }

    if (!context) {
        return;
    }

    try {
        const now = context.currentTime;
        
        const settings = {
            classic: [220, 275, 330],
            buddy: [330, 392, 494]
        };
        const frequencies = settings[preset] || settings.classic;
        
        const oscillators = frequencies.map(() => context.createOscillator());
        const gainNode = context.createGain();
        const filter = context.createBiquadFilter();
        const vibrato = context.createOscillator();
        const vibratoGain = context.createGain();
        
        oscillators.forEach((oscillator, index) => {
            oscillator.frequency.setValueAtTime(frequencies[index], now);
            oscillator.type = index === 1 ? 'square' : 'sawtooth';
            oscillator.connect(filter);
        });
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.connect(gainNode);
        gainNode.connect(context.destination);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.45, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        vibrato.frequency.value = 5;
        vibratoGain.gain.value = preset === 'buddy' ? 5 : 3;
        vibrato.connect(vibratoGain);
        oscillators.forEach((oscillator) => {
            vibratoGain.connect(oscillator.frequency);
        });
        
        oscillators.forEach((oscillator) => oscillator.start(now));
        vibrato.start(now);
        
        oscillators.forEach((oscillator) => oscillator.stop(now + 0.8));
        vibrato.stop(now + 0.8);
    } catch (error) {
        return;
    }
}

function addHonkBurst(positionX, positionY, text = 'HONK!') {
    const honk = document.createElement('div');
    honk.className = 'honk';
    honk.textContent = text;
    honk.style.left = positionX + 'px';
    honk.style.top = positionY + 'px';
    document.body.appendChild(honk);
    
    setTimeout(() => {
        honk.remove();
    }, 1000);
}

function bounceVehicle() {
    const container = document.getElementById('vehicle-container');
    if (!container) {
        return;
    }
    container.style.animation = 'none';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            container.style.animation = 'bounce 0.5s ease-in-out infinite alternate';
        });
    });
}

function handleHonk(event, options = {}) {
    const clickX = options.x ?? event?.clientX ?? window.innerWidth / 2;
    const clickY = options.y ?? event?.clientY ?? window.innerHeight / 2;
    const text = options.text || 'HONK!';
    const preset = options.preset || 'classic';
    playHonk(preset);
    addHonkBurst(clickX, clickY, text);
    bounceVehicle();
}

function toggleLights() {
    const activeVehicle = document.querySelector('.vehicle.active');
    if (!activeVehicle) {
        return;
    }
    activeVehicle.classList.toggle('lights-on');
}

function showNameModal() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('name-input');
    const trailerText = document.getElementById('trailer-text');

    if (!modal || !input || !trailerText) {
        return;
    }

    lastFocusElement = document.activeElement;
    input.value = trailerText.textContent;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    input.focus();
    input.select();
}

function hideNameModal() {
    const modal = document.getElementById('name-modal');
    if (!modal) {
        return;
    }
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocusElement && typeof lastFocusElement.focus === 'function') {
        lastFocusElement.focus();
    }
    lastFocusElement = null;
}

function submitName() {
    const input = document.getElementById('name-input');
    const trailerText = document.getElementById('trailer-text');

    if (!input || !trailerText) {
        return;
    }

    if (input.value.trim() !== '') {
        trailerText.textContent = input.value.trim().toUpperCase();
    }
    hideNameModal();
}

const focusableModalSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function handleModalKeydown(event) {
    if (event.key === 'Escape') {
        event.preventDefault();
        hideNameModal();
        return;
    }

    if (event.key !== 'Tab') {
        return;
    }

    const modal = document.getElementById('name-modal');
    if (!modal) {
        return;
    }
    const focusable = modal.querySelectorAll(focusableModalSelectors);
    if (!focusable.length) {
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function onActivate(element, handler) {
    if (!element) {
        return;
    }
    element.addEventListener('click', (event) => {
        event.stopPropagation();
        handler(event);
    });

    element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handler(event);
        }
    });
}

function toggleNightMode() {
    document.body.classList.toggle('night-mode');
    // Auto-enable lights in night mode
    const activeVehicle = document.querySelector('.vehicle.active');
    if (activeVehicle && document.body.classList.contains('night-mode')) {
        activeVehicle.classList.add('lights-on');
    }
}

// Toggle instructions panel
function initInstructions() {
    const instructionsHeader = document.getElementById('instructions-header') || document.querySelector('.instructions-header');
    const instructionsToggle = document.getElementById('instructions-toggle');
    if (instructionsHeader) {
        instructionsHeader.addEventListener('click', () => {
            const instructions = document.getElementById('instructions');
            if (!instructions) return;
            const isCollapsed = instructions.classList.toggle('collapsed');
            if (instructionsToggle) {
                instructionsToggle.setAttribute('aria-expanded', String(!isCollapsed));
            }
        });
    }
}

// Vehicle selection - now just show/hide
function switchVehicle(vehicleId) {
    if (!VEHICLES[vehicleId]) return;
    
    // Hide all vehicles
    document.querySelectorAll('.vehicle').forEach(v => {
        v.classList.remove('active');
    });
    
    // Show selected vehicle
    const vehicleElement = document.getElementById(`vehicle-${vehicleId}`);
    if (vehicleElement) {
        vehicleElement.classList.add('active');
    }
    
    // Update current vehicle
    currentVehicle = vehicleId;
    
    // Update selector UI
    updateVehicleSelector();
}

function updateVehicleSelector() {
    const options = document.querySelectorAll('.vehicle-option');
    if (!options.length) {
        return;
    }
    options.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.vehicle === currentVehicle);
    });
}

function cycleVehicle() {
    const vehicleIds = Object.keys(VEHICLES);
    const currentIndex = vehicleIds.indexOf(currentVehicle);
    const nextIndex = (currentIndex + 1) % vehicleIds.length;
    switchVehicle(vehicleIds[nextIndex]);
}

// Initialize vehicle selector
function initVehicleSelector() {
    const selector = document.getElementById('vehicle-selector');
    if (!selector) return;
    
    selector.innerHTML = '';
    
    Object.entries(VEHICLES).forEach(([id, vehicle]) => {
        const option = document.createElement('button');
        option.className = 'vehicle-option' + (id === currentVehicle ? ' active' : '');
        option.dataset.vehicle = id;
        option.innerHTML = `<span class="vehicle-icon">${vehicle.icon}</span>`;
        option.setAttribute('aria-label', vehicle.name);
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            switchVehicle(id);
        });
        selector.appendChild(option);
    });
    
    // Show default vehicle
    switchVehicle(currentVehicle);
}

// Initialize on DOM ready
function initializeInteractions() {
    const trailerText = document.getElementById('trailer-text');
    const modalOk = document.getElementById('modal-ok');
    const modalCancel = document.getElementById('modal-cancel');
    const nameInput = document.getElementById('name-input');
    const nameModal = document.getElementById('name-modal');

    if (trailerText) {
        trailerText.addEventListener('click', (event) => {
            event.stopPropagation();
            showNameModal();
        });
    }

    if (modalOk) {
        modalOk.addEventListener('click', submitName);
    }

    if (modalCancel) {
        modalCancel.addEventListener('click', hideNameModal);
    }

    if (nameInput) {
        nameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                submitName();
            } else if (event.key === 'Escape') {
                hideNameModal();
            }
        });
    }

    if (nameModal) {
        nameModal.addEventListener('click', (event) => {
            if (event.target === event.currentTarget) {
                hideNameModal();
            }
        });
        nameModal.addEventListener('keydown', handleModalKeydown);
    }

    // Set up click handlers for all vehicles
    document.querySelectorAll('.vehicle').forEach(vehicle => {
        vehicle.addEventListener('click', (event) => {
            // Don't honk if clicking on trailer text
            if (event.target.id === 'trailer-text' || event.target.classList.contains('semi-trailer-text')) {
                return;
            }
            handleHonk(event, {
                preset: 'classic',
                text: 'HONK!'
            });
        });
    });

    const sun = document.querySelector('.sun');
    onActivate(sun, () => {
        toggleNightMode();
    });

    // Headlight handlers for semi
    document.querySelectorAll('.semi-headlight').forEach(light => {
        onActivate(light, (e) => {
            e.stopPropagation();
            toggleLights();
        });
    });

    initInstructions();
    initVehicleSelector();
}

document.addEventListener('DOMContentLoaded', initializeInteractions);

document.addEventListener('keydown', (event) => {
    // Don't trigger shortcuts when typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    if (event.key && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        handleHonk(event, {
            preset: 'classic',
            text: 'HONK!'
        });
    }
    if (event.key && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        handleHonk(event, {
            preset: 'buddy',
            text: 'TOOT!'
        });
    }
    if (event.key && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        toggleLights();
    }
    if (event.key && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        toggleNightMode();
    }
    if (event.key && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        cycleVehicle();
    }
});
