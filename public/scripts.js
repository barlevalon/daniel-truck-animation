// Create audio context for honk sound
let audioContext = null;

// Vehicle configurations
const VEHICLES = {
    semi: {
        name: 'Semi Truck',
        icon: '🚛',
        cabClass: 'cab-semi',
        trailerClass: 'trailer-semi',
        colors: {
            cab: '#FF6B6B',
            trailer: '#FFE66D',
            stripe: '#FF6B6B'
        }
    },
    garbage: {
        name: 'Garbage Truck',
        icon: '🗑️',
        cabClass: 'cab-garbage',
        trailerClass: 'trailer-garbage',
        colors: {
            cab: '#4CAF50',
            trailer: '#388E3C',
            stripe: '#81C784'
        }
    },
    cybertruck: {
        name: 'Pink Cybertruck',
        icon: '🚗',
        cabClass: 'cab-cybertruck',
        trailerClass: 'trailer-cybertruck',
        colors: {
            cab: '#FF69B4',
            trailer: '#FF69B4',
            stripe: '#FFB6C1'
        }
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
    const context = ensureAudioContext();
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

function bounceTruck() {
    const truck = document.getElementById('truck');
    if (!truck) {
        return;
    }
    truck.style.animation = 'none';
    setTimeout(() => {
        truck.style.animation = 'bounce 0.5s ease-in-out infinite alternate';
    }, 10);
}

function handleHonk(event, options = {}) {
    const clickX = options.x ?? event?.clientX ?? window.innerWidth / 2;
    const clickY = options.y ?? event?.clientY ?? window.innerHeight / 2;
    const text = options.text || 'HONK!';
    const preset = options.preset || 'classic';
    playHonk(preset);
    addHonkBurst(clickX, clickY, text);
    bounceTruck();
}

function toggleLights() {
    const truck = document.getElementById('truck');
    if (!truck) {
        return;
    }
    truck.classList.toggle('lights-on');
}



function showNameModal() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('name-input');
    input.value = document.getElementById('trailer-text').textContent;
    modal.classList.add('active');
    input.focus();
    input.select();
}

function hideNameModal() {
    document.getElementById('name-modal').classList.remove('active');
}

function submitName() {
    const input = document.getElementById('name-input');
    if (input.value.trim() !== '') {
        document.getElementById('trailer-text').textContent = input.value.trim().toUpperCase();
    }
    hideNameModal();
}

document.getElementById('trailer-text').addEventListener('click', (event) => {
    event.stopPropagation();
    showNameModal();
});

document.getElementById('modal-ok').addEventListener('click', submitName);
document.getElementById('modal-cancel').addEventListener('click', hideNameModal);

document.getElementById('name-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        submitName();
    } else if (event.key === 'Escape') {
        hideNameModal();
    }
});

document.getElementById('name-modal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
        hideNameModal();
    }
});

// Touch controls: tap cab for HONK
document.getElementById('truck-cab').addEventListener('click', (event) => {
    event.stopPropagation();
    handleHonk(event, {
        preset: 'classic',
        text: 'HONK!'
    });
});

// Touch controls: tap trailer for TOOT
document.getElementById('trailer').addEventListener('click', (event) => {
    // Don't trigger if clicking the name
    if (event.target.id === 'trailer-text') return;
    event.stopPropagation();
    handleHonk(event, {
        preset: 'buddy',
        text: 'TOOT!'
    });
});

// Touch controls: tap sun/moon for night mode
document.querySelector('.sun').addEventListener('click', (event) => {
    event.stopPropagation();
    toggleNightMode();
});

// Touch controls: tap headlights to toggle
document.querySelectorAll('.headlight').forEach(light => {
    light.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleLights();
    });
});

function toggleNightMode() {
    document.body.classList.toggle('night-mode');
    // Auto-enable lights in night mode
    const truck = document.getElementById('truck');
    if (document.body.classList.contains('night-mode')) {
        truck.classList.add('lights-on');
    }
}

// Toggle instructions panel
const instructionsHeader = document.getElementById('instructions-header') || document.querySelector('.instructions-header');
if (instructionsHeader) {
    instructionsHeader.addEventListener('click', () => {
        document.getElementById('instructions').classList.toggle('collapsed');
    });
}

// Vehicle selection
function switchVehicle(vehicleId) {
    if (!VEHICLES[vehicleId]) return;
    
    const truck = document.getElementById('truck');
    const cab = document.getElementById('truck-cab');
    const trailer = document.getElementById('trailer');
    const stripe = document.querySelector('.trailer-stripe');
    
    // Remove all vehicle classes
    Object.values(VEHICLES).forEach(v => {
        cab.classList.remove(v.cabClass);
        trailer.classList.remove(v.trailerClass);
    });
    
    // Add new vehicle classes
    const vehicle = VEHICLES[vehicleId];
    cab.classList.add(vehicle.cabClass);
    trailer.classList.add(vehicle.trailerClass);
    
    // Apply colors via CSS custom properties
    cab.style.setProperty('--cab-color', vehicle.colors.cab);
    trailer.style.setProperty('--trailer-color', vehicle.colors.trailer);
    stripe.style.setProperty('--stripe-color', vehicle.colors.stripe);
    
    // Update current vehicle
    currentVehicle = vehicleId;
    
    // Update selector UI
    updateVehicleSelector();
}

function updateVehicleSelector() {
    document.querySelectorAll('.vehicle-option').forEach(opt => {
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
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initVehicleSelector();
});

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
