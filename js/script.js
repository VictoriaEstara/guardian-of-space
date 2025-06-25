// Audio Context and Sound System
let audioContext;
let sounds = {};
let backgroundMusic;
let musicSource;
let musicBuffer;

// Asset Loading System
let assets = {
    player: null,
    enemyBasic: null,
    enemyFast: null,
    enemyHeavy: null,
    backgroundMusic: null
};

// Asset paths - modify these if your file structure is different
const assetPaths = {
    player: './assets/images/player.png',
    enemyBasic: './assets/images/enemy_basic.png',
    enemyFast: './assets/images/enemy_fast.png',
    enemyHeavy: './assets/images/enemy_heavy.png',
    backgroundMusic: './assets/audio/background_music.mp3'
};

// Function to load images
function loadImage(path, assetKey) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            assets[assetKey] = img;
            console.log(`✓ ${assetKey} loaded successfully from ${path}`);
            resolve(img);
        };
        img.onerror = () => {
            console.log(`✗ Failed to load ${assetKey} from ${path} - using default`);
            resolve(null);
        };
        img.src = path;
    });
}

// Function to load audio
function loadAudio(path) {
    return new Promise((resolve, reject) => {
        fetch(path)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                if (!audioContext) {
                    initAudio();
                }
                return audioContext.decodeAudioData(arrayBuffer);
            })
            .then(buffer => {
                musicBuffer = buffer;
                assets.backgroundMusic = buffer;
                console.log('✓ Background music loaded successfully from', path);
                resolve(buffer);
            })
            .catch(error => {
                console.log('✗ Failed to load background music from', path, '- using default sounds only');
                resolve(null);
            });
    });
}

// Initialize all assets
async function loadAllAssets() {
    console.log('🎮 Loading game assets...');
    console.log('📁 Expected file structure:');
    console.log('   /assets/images/player.png');
    console.log('   /assets/images/enemy_basic.png');
    console.log('   /assets/images/enemy_fast.png');
    console.log('   /assets/images/enemy_heavy.png');
    console.log('   /assets/audio/background_music.mp3');
    
    // Load all assets concurrently
    await Promise.all([
        loadImage(assetPaths.player, 'player'),
        loadImage(assetPaths.enemyBasic, 'enemyBasic'),
        loadImage(assetPaths.enemyFast, 'enemyFast'),
        loadImage(assetPaths.enemyHeavy, 'enemyHeavy'),
        loadAudio(assetPaths.backgroundMusic)
    ]);
    
    // Initialize default assets for any that failed to load
    initDefaultAssets();
    
    console.log('🎮 Asset loading complete!');
}

// Initialize default images (fallback colored rectangles)
function initDefaultAssets() {
    // Create default player image if not loaded
    if (!assets.player) {
        const playerCanvas = document.createElement('canvas');
        playerCanvas.width = 40;
        playerCanvas.height = 40;
        const playerCtx = playerCanvas.getContext('2d');
        playerCtx.fillStyle = '#00d4ff';
        playerCtx.fillRect(0, 0, 40, 40);
        playerCtx.fillStyle = '#ffffff';
        playerCtx.fillRect(15, 5, 10, 30);
        assets.player = playerCanvas;
    }
    
    // Create default enemy images if not loaded
    if (!assets.enemyBasic) {
        const enemyBasicCanvas = document.createElement('canvas');
        enemyBasicCanvas.width = 30;
        enemyBasicCanvas.height = 30;
        const enemyBasicCtx = enemyBasicCanvas.getContext('2d');
        enemyBasicCtx.fillStyle = '#ff6040';
        enemyBasicCtx.fillRect(0, 0, 30, 30);
        assets.enemyBasic = enemyBasicCanvas;
    }
    
    if (!assets.enemyFast) {
        const enemyFastCanvas = document.createElement('canvas');
        enemyFastCanvas.width = 25;
        enemyFastCanvas.height = 25;
        const enemyFastCtx = enemyFastCanvas.getContext('2d');
        enemyFastCtx.fillStyle = '#40ff60';
        enemyFastCtx.fillRect(0, 0, 25, 25);
        assets.enemyFast = enemyFastCanvas;
    }
    
    if (!assets.enemyHeavy) {
        const enemyHeavyCanvas = document.createElement('canvas');
        enemyHeavyCanvas.width = 45;
        enemyHeavyCanvas.height = 45;
        const enemyHeavyCtx = enemyHeavyCanvas.getContext('2d');
        enemyHeavyCtx.fillStyle = '#ff4040';
        enemyHeavyCtx.fillRect(0, 0, 45, 45);
        assets.enemyHeavy = enemyHeavyCanvas;
    }
}

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create default sound effects using Web Audio API
    sounds.shoot = createBeepSound(800, 0.1);
    sounds.enemyHit = createBeepSound(400, 0.2);
    sounds.playerHit = createBeepSound(200, 0.3);
    sounds.powerup = createBeepSound(1000, 0.2);
    sounds.explosion = createNoiseSound(0.3);
}

function createBeepSound(frequency, duration) {
    return () => {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    };
}

function createNoiseSound(duration) {
    return () => {
        if (!audioContext) return;
        
        const noise = audioContext.createBufferSource();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = buffer;
        
        const gainNode = audioContext.createGain();
        noise.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        noise.start();
    };
}

// Background music control
function playBackgroundMusic() {
    if (!audioContext || !musicBuffer) return;
    
    // Stop current music if playing
    if (musicSource) {
        musicSource.stop();
    }
    
    musicSource = audioContext.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.loop = true;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.6; // Set volume to 60%
    
    musicSource.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    musicSource.start();
}

function stopBackgroundMusic() {
    if (musicSource) {
        musicSource.stop();
        musicSource = null;
    }
}

function toggleMusic() {
    const button = document.getElementById('musicToggle');
    if (musicSource) {
        stopBackgroundMusic();
        if (button) button.textContent = 'Play Music';
    } else {
        if (musicBuffer) {
            playBackgroundMusic();
            if (button) button.textContent = 'Stop Music';
        } else {
            console.log('No background music loaded');
        }
    }
}

// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'start';
let selectedCharacter = 'nova';
let score = 0;
let stage = 1;
let lives = 3;
let health = 100;
let gameSpeed = 1;

// Game objects
let player;
let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];
let stars = [];

// Input handling
const keys = {};

// Character stats
const characters = {
    nova: { speed: 5, fireRate: 8, damage: 1, color: '#00d4ff', name: 'Nova' },
    blaze: { speed: 4, fireRate: 6, damage: 2, color: '#ff4040', name: 'Blaze' },
    viper: { speed: 7, fireRate: 12, damage: 1, color: '#40ff40', name: 'Viper' }
};

// Powerup system
let activePowerups = {};

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input event listeners
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Character selection
document.querySelectorAll('.character').forEach(char => {
    char.addEventListener('click', () => {
        document.querySelector('.character.selected')?.classList.remove('selected');
        char.classList.add('selected');
        selectedCharacter = char.dataset.character;
    });
});

// Initialize stars
function initStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 2 + 1,
            size: Math.random() * 2
        });
    }
}

// Player class
class Player {
    constructor(character) {
        const char = characters[character];
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.width = 40;
        this.height = 40;
        this.speed = char.speed;
        this.fireRate = char.fireRate;
        this.damage = char.damage;
        this.color = char.color;
        this.lastShot = 0;
        this.invulnerable = false;
        this.invulnerableTime = 0;
    }
    
    update() {
        // Movement
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed;
        if (keys['ArrowUp'] || keys['KeyW']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['KeyS']) this.y += this.speed;
        
        // Boundaries
        this.x = Math.max(20, Math.min(canvas.width - 20, this.x));
        this.y = Math.max(20, Math.min(canvas.height - 20, this.y));
        
        // Shooting
        if (keys['Space'] && Date.now() - this.lastShot > 1000/this.fireRate) {
            this.shoot();
            this.lastShot = Date.now();
        }
        
        // Handle invulnerability
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    shoot() {
        const spread = activePowerups.tripleShot ? 3 : 1;
        const bulletSpeed = activePowerups.rapidFire ? 12 : 8;
        
        for (let i = 0; i < spread; i++) {
            const angle = spread === 1 ? 0 : (i - 1) * 0.3;
            bullets.push(new Bullet(
                this.x, this.y - 20,
                Math.sin(angle) * bulletSpeed,
                -bulletSpeed,
                this.damage * (activePowerups.powerShot ? 2 : 1),
                this.color, true
            ));
        }
        if (sounds.shoot) sounds.shoot();
    }
    
    takeDamage(damage) {
        if (this.invulnerable) return false;
        
        health -= damage;
        this.invulnerable = true;
        this.invulnerableTime = 60;
        if (sounds.playerHit) sounds.playerHit();
        
        // Create damage particles
        for (let i = 0; i < 10; i++) {
            particles.push(new Particle(this.x, this.y, '#ff4040'));
        }
        
        if (health <= 0) {
            lives--;
            health = 100;
            if (lives <= 0) {
                gameOver();
            }
        }
        return true;
    }
    
    draw() {
        ctx.save();
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw ship image
        if (assets.player) {
            ctx.drawImage(assets.player, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
        
        // Engine glow (optional)
        if (!this.invulnerable || Math.floor(Date.now() / 100) % 2) {
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(this.x - 3, this.y + this.height/2 - 5, 6, 10);
        }
        
        ctx.restore();
    }
}

// Bullet class
class Bullet {
    constructor(x, y, vx, vy, damage, color, isPlayer) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.color = color;
        this.isPlayer = isPlayer;
        this.width = 4;
        this.height = 10;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x - 2, this.y - 5, 4, 10);
    }
    
    isOffScreen() {
        return this.y < -10 || this.y > canvas.height + 10 || 
               this.x < -10 || this.x > canvas.width + 10;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.lastShot = 0;
        
        switch(type) {
            case 'basic':
                this.width = 30;
                this.height = 30;
                this.speed = 2;
                this.health = 1;
                this.color = '#ff6040';
                this.fireRate = 2;
                this.points = 10;
                this.asset = assets.enemyBasic;
                break;
            case 'fast':
                this.width = 25;
                this.height = 25;
                this.speed = 4;
                this.health = 1;
                this.color = '#40ff60';
                this.fireRate = 3;
                this.points = 15;
                this.asset = assets.enemyFast;
                break;
            case 'heavy':
                this.width = 45;
                this.height = 45;
                this.speed = 1;
                this.health = 3;
                this.color = '#ff4040';
                this.fireRate = 1;
                this.points = 25;
                this.asset = assets.enemyHeavy;
                break;
        }
    }
    
    update() {
        this.y += this.speed * gameSpeed;
        
        // Shooting
        if (Math.random() < this.fireRate / 1000) {
            bullets.push(new Bullet(
                this.x, this.y + 20,
                0, 4,
                1, '#ff4040', false
            ));
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (sounds.enemyHit) sounds.enemyHit();
        
        // Create hit particles
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
        
        if (this.health <= 0) {
            score += this.points;
            
            // Explosion particles
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(this.x, this.y, '#ffff40'));
            }
            
            // Chance to drop powerup
            if (Math.random() < 0.15) {
                powerups.push(new Powerup(this.x, this.y));
            }
            
            if (sounds.explosion) sounds.explosion();
            return true;
        }
        return false;
    }
    
    draw() {
        // Draw enemy ship image
        if (this.asset) {
            ctx.drawImage(this.asset, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
    }
    
    isOffScreen() {
        return this.y > canvas.height + 50;
    }
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.color = color;
        this.life = 60;
        this.maxLife = 60;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life--;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// Powerup class
class Powerup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 2;
        this.size = 20;
        this.rotation = 0;
        this.types = ['tripleShot', 'rapidFire', 'powerShot', 'shield'];
        this.type = this.types[Math.floor(Math.random() * this.types.length)];
        this.colors = {
            tripleShot: '#ffff00',
            rapidFire: '#ff8000',
            powerShot: '#ff0080',
            shield: '#00ff80'
        };
    }
    
    update() {
        this.y += this.speed;
        this.rotation += 0.1;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.colors[this.type];
        ctx.shadowColor = this.colors[this.type];
        ctx.shadowBlur = 10;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
    
    isOffScreen() {
        return this.y > canvas.height + 50;
    }
    
    collect() {
        activePowerups[this.type] = 600; // 10 seconds at 60fps
        if (sounds.powerup) sounds.powerup();
        updatePowerupDisplay();
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function circleCollision(obj1, obj2, radius1, radius2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius1 + radius2;
}

// Game functions
function spawnEnemies() {
    if (Math.random() < 0.02 + stage * 0.005) {
        const x = Math.random() * (canvas.width - 60) + 30;
        let type = 'basic';
        
        const rand = Math.random();
        if (stage >= 2 && rand < 0.3) type = 'fast';
        if (stage >= 3 && rand < 0.15) type = 'heavy';
        
        enemies.push(new Enemy(x, -30, type));
    }
}

function updatePowerups() {
    Object.keys(activePowerups).forEach(key => {
        activePowerups[key]--;
        if (activePowerups[key] <= 0) {
            delete activePowerups[key];
        }
    });
    updatePowerupDisplay();
}

function updatePowerupDisplay() {
    const display = document.getElementById('powerupStatus');
    if (display) {
        const active = Object.keys(activePowerups);
        if (active.length > 0) {
            display.textContent = 'Active: ' + active.join(', ');
        } else {
            display.textContent = '';
        }
    }
}

function updateStage() {
    const newStage = Math.floor(score / 500) + 1;
    if (newStage > stage && newStage <= 3) {
        stage = newStage;
        gameSpeed = 1 + (stage - 1) * 0.3;
        const stageElement = document.getElementById('stage');
        if (stageElement) stageElement.textContent = stage;
    }
}

function updateUI() {
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const healthFill = document.getElementById('healthFill');
    const currentCharacter = document.getElementById('currentCharacter');
    
    if (scoreElement) scoreElement.textContent = score;
    if (livesElement) livesElement.textContent = lives;
    if (healthFill) healthFill.style.width = health + '%';
    if (currentCharacter) currentCharacter.textContent = characters[selectedCharacter].name;
}

function gameLoop() {
    if (gameState !== 'playing') return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw scrolling stars
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        star.y += star.speed * gameSpeed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        ctx.globalAlpha = 0.8;
        ctx.fillRect(star.x, star.y, star.size, star.size);
        ctx.globalAlpha = 1;
    });
    
    // Update game objects
    player.update();
    
    bullets.forEach((bullet, index) => {
        bullet.update();
        if (bullet.isOffScreen()) {
            bullets.splice(index, 1);
        }
    });
    
    enemies.forEach((enemy, index) => {
        enemy.update();
        if (enemy.isOffScreen()) {
            enemies.splice(index, 1);
        }
    });
    
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.isDead()) {
            particles.splice(index, 1);
        }
    });
    
    powerups.forEach((powerup, index) => {
        powerup.update();
        if (powerup.isOffScreen()) {
            powerups.splice(index, 1);
        }
    });
    
    // Collision detection
    // Bullets vs Enemies
    bullets.forEach((bullet, bulletIndex) => {
        if (bullet.isPlayer) {
            enemies.forEach((enemy, enemyIndex) => {
                if (circleCollision(bullet, enemy, 5, 20)) {
                    if (enemy.takeDamage(bullet.damage)) {
                        enemies.splice(enemyIndex, 1);
                    }
                    bullets.splice(bulletIndex, 1);
                }
            });
        }
    });
    
    // Enemy bullets vs Player
    bullets.forEach((bullet, index) => {
        if (!bullet.isPlayer && circleCollision(bullet, player, 5, 20)) {
            player.takeDamage(20);
            bullets.splice(index, 1);
        }
    });
    
    // Enemies vs Player
    enemies.forEach((enemy, index) => {
        if (circleCollision(enemy, player, 25, 20)) {
            player.takeDamage(30);
            enemies.splice(index, 1);
        }
    });
    
    // Powerups vs Player
    powerups.forEach((powerup, index) => {
        if (circleCollision(powerup, player, 15, 20)) {
            powerup.collect();
            powerups.splice(index, 1);
        }
    });
    
    // Draw everything
    player.draw();
    
    bullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    particles.forEach(particle => particle.draw());
    powerups.forEach(powerup => powerup.draw());
    
    // Spawn enemies
    spawnEnemies();
    
    // Update systems
    updatePowerups();
    updateStage();
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (!audioContext || audioContext.state === 'suspended') {
        initAudio();
        audioContext.resume().then(() => {
            console.log('✅ AudioContext resumed after user interaction');
            playBackgroundMusic();
        });
    } else {
        playBackgroundMusic();
    }

    
    gameState = 'playing';
    score = 0;
    stage = 1;
    lives = 3;
    health = 100;
    gameSpeed = 1;
    
    player = new Player(selectedCharacter);
    bullets = [];
    enemies = [];
    particles = [];
    powerups = [];
    activePowerups = {};
    
    initStars();
    
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    
    if (startScreen) startScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    
    // Start background music if available
    if (musicBuffer) {
        playBackgroundMusic();
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) musicToggle.textContent = 'Stop Music';
    }
    
    gameLoop();
}

function gameOver() {
    gameState = 'gameOver';
    stopBackgroundMusic();
    
    const musicToggle = document.getElementById('musicToggle');
    const finalScore = document.getElementById('finalScore');
    const finalStage = document.getElementById('finalStage');
    const gameOverScreen = document.getElementById('gameOverScreen');
    
    if (musicToggle) musicToggle.textContent = 'Play Music';
    if (finalScore) finalScore.textContent = score;
    if (finalStage) finalStage.textContent = stage;
    if (gameOverScreen) gameOverScreen.style.display = 'flex';
}

function restartGame() {
    gameState = 'start';
    stopBackgroundMusic();
    
    const musicToggle = document.getElementById('musicToggle');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const startScreen = document.getElementById('startScreen');
    
    if (musicToggle) musicToggle.textContent = 'Play Music';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (startScreen) startScreen.style.display = 'flex';
}

// Initialize the game
async function initGame() {
    console.log('🎮 Initializing Space Shooter Game...');
    
    // Load all assets first
    await loadAllAssets();
    
    // Initialize game systems
    initStars();
    // initAudio();
    
    console.log('🎮 Game initialized and ready to play!');
}

// Auto-initialize when page loads
window.addEventListener('load', initGame);

//
