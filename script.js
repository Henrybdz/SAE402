// Éléments du DOM
let canvas, ctx, joystickBase, joystickThumb, powerBar, shootButton, startButton, restartButton, startScreen, gameOverScreen, overlay, finalScore;

// Configuration du jeu
let gameActive = false;
let score = 0;
let level = 1;
let arrowFlying = false;
let lives = 3;
let gameWidth, gameHeight;
let isLandscape = false;

// Configuration physique
const gravity = 0.15;
const maxPower = 20;

// Joystick
let joystick = {
    active: false,
    baseX: 0,
    baseY: 0,
    thumbX: 0,
    thumbY: 0,
    angle: 0,
    distance: 0,
    maxDistance: 40
};

// Jauge de puissance
let power = {
    active: false,
    value: 0,
    increasing: true,
    speed: 1.2
};

// Position du tireur (archer)
let archer = {
    x: 0,
    y: 0,
    width: 50,
    height: 100,
    color: '#3A86FF'
};

// Position de la flèche
let arrow = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    angle: 0,
    width: 40,
    height: 8,
    color: '#663300', // Couleur marron pour la flèche
    maxDistance: 1000 // Portée maximale
};

// Position du voleur et de la pomme
let thief = {
    x: 0,
    y: 0,
    width: 50,
    height: 100,
    color: '#FB5607'
};

let apple = {
    x: 0,
    y: 0,
    width: 30,
    height: 30,
    color: '#E63946'
};

// Couleurs pour les dessins
const colors = {
    archerBody: '#3A86FF',
    archerFace: '#FFD7BA',
    thiefBody: '#FB5607',
    thiefFace: '#FFD7BA',
    appleRed: '#E63946',
    appleGreen: '#6A994E',
    arrowBody: '#663300',
    arrowTip: '#883300',
    arrowFeathers: '#CC3300'
};

// Initialiser les éléments du DOM
function initDomElements() {
    // S'assurer que le document est complètement chargé
    canvas = document.getElementById('game-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    } else {
        console.error("Canvas non trouvé !");
    }
    
    joystickBase = document.getElementById('joystick-base');
    joystickThumb = document.getElementById('joystick-thumb');
    powerBar = document.getElementById('power-bar');
    shootButton = document.getElementById('shoot-button');
    startButton = document.getElementById('start-button');
    restartButton = document.getElementById('restart-button');
    startScreen = document.getElementById('start-screen');
    gameOverScreen = document.getElementById('game-over-screen');
    overlay = document.getElementById('overlay');
    finalScore = document.getElementById('final-score');
    
    // Écouteurs d'événements
    if (startButton) startButton.addEventListener('click', startGame);
    if (restartButton) restartButton.addEventListener('click', restartGame);
    
    // Joystick (tactile)
    if (joystickBase) {
        joystickBase.addEventListener('touchstart', handleJoystickStart);
        joystickBase.addEventListener('touchmove', handleJoystickMove);
        joystickBase.addEventListener('touchend', handleJoystickEnd);
        joystickBase.addEventListener('touchcancel', handleJoystickEnd);
    }
    
    // Bouton de tir
    if (shootButton) {
        shootButton.addEventListener('touchstart', startPowerCharge);
        shootButton.addEventListener('touchend', shootArrow);
        shootButton.addEventListener('touchcancel', shootArrow);
    }
    
    // Vérifier l'orientation
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    console.log("Éléments DOM initialisés, écouteurs d'événements ajoutés");
}

// Vérifier l'orientation de l'écran
function checkOrientation() {
    isLandscape = window.innerWidth > window.innerHeight;
    
    if (!isLandscape) {
        // Afficher le message de rotation
        if (!document.getElementById('rotation-message')) {
            const rotationMsg = document.createElement('div');
            rotationMsg.id = 'rotation-message';
            rotationMsg.innerHTML = 'Veuillez tourner votre appareil en mode paysage';
            rotationMsg.style.position = 'fixed';
            rotationMsg.style.top = '0';
            rotationMsg.style.left = '0';
            rotationMsg.style.width = '100%';
            rotationMsg.style.height = '100%';
            rotationMsg.style.backgroundColor = '#222';
            rotationMsg.style.color = 'white';
            rotationMsg.style.display = 'flex';
            rotationMsg.style.justifyContent = 'center';
            rotationMsg.style.alignItems = 'center';
            rotationMsg.style.textAlign = 'center';
            rotationMsg.style.padding = '20px';
            rotationMsg.style.fontSize = '24px';
            rotationMsg.style.zIndex = '9999';
            document.body.appendChild(rotationMsg);
        } else {
            document.getElementById('rotation-message').style.display = 'flex';
        }
        
        if (gameActive) {
            pauseGame();
        }
    } else {
        // Cacher le message de rotation
        const rotationMsg = document.getElementById('rotation-message');
        if (rotationMsg) {
            rotationMsg.style.display = 'none';
        }
        
        // Redimensionner le canvas
        resizeCanvas();
    }
}

// Pause du jeu
function pauseGame() {
    // Sauvegarder l'état du jeu si nécessaire
}

// Redimensionner le canvas
function resizeCanvas() {
    if (!canvas) {
        console.error("Canvas non disponible pour le redimensionnement");
        return;
    }
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gameWidth = canvas.width;
    gameHeight = canvas.height;
    
    // Repositionner les éléments du jeu
    if (gameActive) {
        positionGameElements();
    }
}

// Positionner les éléments du jeu
function positionGameElements() {
    // Position de l'archer (à gauche)
    archer.x = 100;
    archer.y = gameHeight - archer.height - 50;
    
    // Position du voleur (à droite)
    thief.x = gameWidth - thief.width - 100;
    thief.y = gameHeight - thief.height - 50;
    
    // Position de la pomme (au-dessus de la tête du voleur)
    updateApplePosition();
    
    // Position initiale de la flèche (près de l'archer)
    resetArrow();
}

// Mettre à jour la position de la pomme
function updateApplePosition() {
    apple.x = thief.x + (thief.width / 2) - (apple.width / 2);
    apple.y = thief.y - apple.height - 5;
}

// Manipulation du joystick
function handleJoystickStart(e) {
    e.preventDefault();
    joystick.active = true;
    
    // Mettre à jour la position initiale
    const rect = joystickBase.getBoundingClientRect();
    joystick.baseX = rect.left + rect.width / 2;
    joystick.baseY = rect.top + rect.height / 2;
    joystick.thumbX = joystick.baseX;
    joystick.thumbY = joystick.baseY;
    
    // Traiter le mouvement initial
    if (e.touches && e.touches[0]) {
        handleJoystickMove(e);
    }
}

function handleJoystickMove(e) {
    if (!joystick.active || !gameActive || arrowFlying) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const dx = touch.clientX - joystick.baseX;
    const dy = touch.clientY - joystick.baseY;
    
    // Calculer la distance du joystick
    joystick.distance = Math.min(Math.sqrt(dx * dx + dy * dy), joystick.maxDistance);
    
    // Calculer l'angle
    joystick.angle = Math.atan2(dy, dx);
    
    // Mettre à jour la position du joystick
    joystick.thumbX = joystick.baseX + Math.cos(joystick.angle) * joystick.distance;
    joystick.thumbY = joystick.baseY + Math.sin(joystick.angle) * joystick.distance;
    
    // Mettre à jour visuellement le joystick
    joystickThumb.style.transform = `translate(${Math.cos(joystick.angle) * joystick.distance}px, ${Math.sin(joystick.angle) * joystick.distance}px) translate(-50%, -50%)`;
    
    // Mettre à jour l'angle de l'arc/flèche
    arrow.angle = joystick.angle;
    
    // Redessiner le jeu pour mettre à jour la trajectoire en temps réel
    drawGame();
}

function handleJoystickEnd(e) {
    e.preventDefault();
    joystick.active = false;
    
    // Réinitialiser la position du joystick
    joystickThumb.style.transform = `translate(-50%, -50%)`;
}

// Gestion de la puissance
function startPowerCharge(e) {
    if (!gameActive || arrowFlying || !isLandscape) return;
    e.preventDefault();
    
    // Activer la charge de puissance
    power.active = true;
    power.value = 0;
    power.increasing = true;
    
    // Ajouter la classe pour l'animation
    powerBar.classList.add('power-active');
    
    // Démarrer l'animation de la jauge
    requestAnimationFrame(updatePower);
}

function updatePower() {
    if (!power.active) return;
    
    if (power.increasing) {
        power.value += power.speed;
        if (power.value >= 100) {
            power.value = 100;
            power.increasing = false;
        }
    } else {
        power.value -= power.speed;
        if (power.value <= 0) {
            power.value = 0;
            power.increasing = true;
        }
    }
    
    // Mettre à jour la barre de puissance
    powerBar.style.width = `${power.value}%`;
    
    // Redessiner le jeu pour mettre à jour la trajectoire prévue
    drawGame();
    
    // Continuer l'animation
    if (power.active) {
        requestAnimationFrame(updatePower);
    }
}

// Tirer une flèche
function shootArrow(e) {
    if (!gameActive || arrowFlying || !isLandscape) return;
    e.preventDefault();
    
    // Arrêter la charge de puissance
    power.active = false;
    powerBar.classList.remove('power-active');
    
    // Définir la vitesse initiale de la flèche basée sur la puissance
    arrow.speed = (power.value / 100) * maxPower;
    arrow.vx = Math.cos(arrow.angle) * arrow.speed;
    arrow.vy = Math.sin(arrow.angle) * arrow.speed;
    
    // Lancer la flèche
    arrowFlying = true;
    animateArrow();
}

// Animer le mouvement de la flèche
function animateArrow() {
    if (!arrowFlying) return;
    
    // Appliquer la physique
    arrow.vy += gravity;
    arrow.x += arrow.vx;
    arrow.y += arrow.vy;
    
    // Calculer l'angle de la flèche basé sur sa trajectoire
    arrow.angle = Math.atan2(arrow.vy, arrow.vx);
    
    // Vérifier les collisions
    if (checkCollisions()) {
        return; // La collision a été gérée
    }
    
    // Vérifier si la flèche est sortie de l'écran
    if (arrow.x < 0 || arrow.x > gameWidth || arrow.y > gameHeight) {
        resetArrow();
        return;
    }
    
    // Dessiner le jeu
    drawGame();
    
    // Continuer l'animation
    requestAnimationFrame(animateArrow);
}

// Vérifier les collisions
function checkCollisions() {
    // Coordonnées du centre de la flèche
    const arrowCenterX = arrow.x + arrow.width / 2;
    const arrowCenterY = arrow.y + arrow.height / 2;
    
    // Vérifier si la flèche a touché la pomme
    if (
        arrowCenterX > apple.x &&
        arrowCenterX < apple.x + apple.width &&
        arrowCenterY > apple.y &&
        arrowCenterY < apple.y + apple.height
    ) {
        // Succès!
        score += 10 * level;
        nextLevel();
        return true;
    }
    // Vérifier si la flèche a touché le voleur
    else if (
        arrowCenterX > thief.x &&
        arrowCenterX < thief.x + thief.width &&
        arrowCenterY > thief.y &&
        arrowCenterY < thief.y + thief.height
    ) {
        // Échec!
        lives--;
        if (lives <= 0) {
            gameOver();
        } else {
            resetArrow();
        }
        return true;
    }
    
    return false;
}

// Réinitialiser la position de la flèche
function resetArrow() {
    arrowFlying = false;
    arrow.x = archer.x + archer.width;
    arrow.y = archer.y + 30;
    arrow.vx = 0;
    arrow.vy = 0;
    drawGame();
}

// Passer au niveau suivant
function nextLevel() {
    level++;
    // Augmenter la difficulté (réduire la taille de la pomme)
    if (level <= 5) {
        apple.width = Math.max(15, 30 - (level * 3));
        apple.height = apple.width;
    }
    resetArrow();
}

// Fin de partie
function gameOver() {
    gameActive = false;
    finalScore.textContent = `Score: ${score}`;
    overlay.style.display = 'flex';
    gameOverScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
}

// Démarrer le jeu
function startGame() {
    if (!isLandscape) {
        alert("Veuillez tourner votre appareil en mode paysage pour jouer");
        return;
    }
    
    console.log("Démarrage du jeu");
    gameActive = true;
    score = 0;
    level = 1;
    lives = 3;
    
    apple.width = 30;
    apple.height = 30;
    
    positionGameElements();
    resetArrow();
    
    // Réinitialiser la puissance
    power.value = 0;
    powerBar.style.width = "0%";
    
    // Réinitialiser le joystick
    joystickThumb.style.transform = `translate(-50%, -50%)`;
    
    overlay.style.display = 'none';
    drawGame();
}

// Redémarrer le jeu
function restartGame() {
    startGame();
}

// Dessiner l'archer
function drawArcher(x, y, width, height) {
    // Corps
    ctx.fillStyle = colors.archerBody;
    ctx.fillRect(x, y + height * 0.3, width, height * 0.7);
    
    // Tête
    ctx.fillStyle = colors.archerFace;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height * 0.2, width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Yeux
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + width * 0.35, y + height * 0.18, width * 0.07, 0, Math.PI * 2);
    ctx.arc(x + width * 0.65, y + height * 0.18, width * 0.07, 0, Math.PI * 2);
    ctx.fill();
    
    // Arc
    ctx.save();
    ctx.translate(x + width * 1.1, y + height * 0.5);
    ctx.rotate(arrow.angle);
    
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, height * 0.3, Math.PI * 0.2, Math.PI * 1.8, false);
    ctx.stroke();
    
    // Corde de l'arc
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(Math.PI * 0.2) * height * 0.3, Math.sin(Math.PI * 0.2) * height * 0.3);
    ctx.lineTo(Math.cos(Math.PI * 1.8) * height * 0.3, Math.sin(Math.PI * 1.8) * height * 0.3);
    ctx.stroke();
    
    ctx.restore();
}

// Dessiner le voleur
function drawThief(x, y, width, height) {
    // Corps
    ctx.fillStyle = colors.thiefBody;
    ctx.fillRect(x, y + height * 0.3, width, height * 0.7);
    
    // Tête
    ctx.fillStyle = colors.thiefFace;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height * 0.2, width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Yeux
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + width * 0.35, y + height * 0.18, width * 0.07, 0, Math.PI * 2);
    ctx.arc(x + width * 0.65, y + height * 0.18, width * 0.07, 0, Math.PI * 2);
    ctx.fill();
    
    // Masque
    ctx.fillStyle = 'black';
    ctx.fillRect(x + width * 0.2, y + height * 0.15, width * 0.6, width * 0.15);
}

// Dessiner la pomme
function drawApple(x, y, width, height) {
    // Corps de la pomme
    ctx.fillStyle = colors.appleRed;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Tige
    ctx.fillStyle = '#5A3921';
    ctx.fillRect(x + width * 0.45, y, width * 0.1, height * 0.2);
    
    // Feuille
    ctx.fillStyle = colors.appleGreen;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, y);
    ctx.quadraticCurveTo(x + width * 0.7, y - height * 0.2, x + width * 0.9, y);
    ctx.quadraticCurveTo(x + width * 0.7, y + height * 0.1, x + width * 0.5, y);
    ctx.fill();
    
    // Reflet
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x + width * 0.35, y + height * 0.35, width * 0.15, 0, Math.PI * 2);
    ctx.fill();
}

// Dessiner la flèche
function drawArrow(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Tige de la flèche
    ctx.fillStyle = colors.arrowBody;
    ctx.fillRect(0, -arrow.height / 2, arrow.width - 10, arrow.height);
    
    // Pointe de la flèche
    ctx.beginPath();
    ctx.moveTo(arrow.width - 10, -arrow.height * 1.5);
    ctx.lineTo(arrow.width + 10, 0);
    ctx.lineTo(arrow.width - 10, arrow.height * 1.5);
    ctx.closePath();
    ctx.fillStyle = colors.arrowTip;
    ctx.fill();
    
    // Empennage de la flèche
    ctx.beginPath();
    ctx.moveTo(0, -arrow.height);
    ctx.lineTo(-10, -arrow.height * 2);
    ctx.lineTo(-10, arrow.height * 2);
    ctx.lineTo(0, arrow.height);
    ctx.closePath();
    ctx.fillStyle = colors.arrowFeathers;
    ctx.fill();
    
    ctx.restore();
}

// Dessiner la trajectoire
function drawTrajectory() {
    if (!gameActive || arrowFlying) return;
    
    // Dessiner une ligne de trajectoire prédictive
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    
    // Calculer la vitesse en fonction de la puissance actuelle
    const currentPower = (power.value / 100) * maxPower;
    
    // Calculer et dessiner la trajectoire prévue
    let simX = arrow.x;
    let simY = arrow.y;
    let simVx = Math.cos(arrow.angle) * currentPower;
    let simVy = Math.sin(arrow.angle) * currentPower;
    
    ctx.moveTo(simX, simY);
    
    // Simuler plus de points pour une trajectoire plus longue et précise
    for (let i = 0; i < 60; i++) {
        simVy += gravity;
        simX += simVx;
        simY += simVy;
        
        if (simX < 0 || simX > gameWidth || simY > gameHeight) break;
        
        ctx.lineTo(simX, simY);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
}

// Dessiner l'écran de démarrage
function drawStartScreen() {
    if (!gameActive && ctx) {
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        
        // Dessiner le fond
        ctx.fillStyle = '#8ecae6';
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        
        // Dessiner les personnages statiques
        drawArcher(100, gameHeight - archer.height - 50, archer.width, archer.height);
        drawThief(gameWidth - thief.width - 100, gameHeight - thief.height - 50, thief.width, thief.height);
        
        const appleX = gameWidth - thief.width - 100 + (thief.width / 2) - 15;
        const appleY = gameHeight - thief.height - 50 - 35;
        drawApple(appleX, appleY, 30, 30);
        
        // Dessiner une flèche statique pour l'écran d'accueil
        if (gameWidth && gameHeight) {
            drawArrow(200, gameHeight - 150, Math.PI / 6);
        }
    }
}

// Dessiner le jeu
function drawGame() {
    if (!ctx || !isLandscape) return; // Assurez-vous que le contexte est disponible et orientation correcte
    
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    
    // Dessiner le fond
    ctx.fillStyle = '#8ecae6';
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    // Dessiner la trajectoire prévue (si pas en train de tirer)
    if (gameActive && !arrowFlying && power.value > 0) {
        drawTrajectory();
    }
    
    // Dessiner l'archer
    drawArcher(archer.x, archer.y, archer.width, archer.height);
    
    // Dessiner le voleur
    drawThief(thief.x, thief.y, thief.width, thief.height);
    
    // Dessiner la pomme
    drawApple(apple.x, apple.y, apple.width, apple.height);
    
    // Dessiner la flèche
    drawArrow(arrow.x, arrow.y, arrow.angle);
    
    // Dessiner le score et le niveau
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Niveau: ${level}`, 20, 60);
    
    // Dessiner les vies
    ctx.fillText(`Vies: ${lives}`, 20, 90);
}

// Initialiser le jeu au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, initialisation du jeu...");
    init();
});

// Initialisation du jeu
function init() {
    // Initialiser les éléments DOM
    initDomElements();
    
    // Si le canvas est disponible, redimensionner et dessiner
    if (canvas) {
        resizeCanvas();
        
        // Positionner les éléments du jeu pour l'écran de démarrage
        if (gameWidth && gameHeight) {
            positionGameElements();
        }
        
        // Dessiner l'écran de démarrage
        requestAnimationFrame(drawStartScreen);
    } else {
        console.error("Canvas non disponible lors de l'initialisation");
    }
    
    console.log("Jeu initialisé");
}
