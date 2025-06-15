const tela = document.getElementById('tela-jogo');
const ctx = tela.getContext('2d');
const elementoPontuacao = document.getElementById('pontuacao');

const morteSom = new Audio('s.Dark Souls_[cut_5sec].mp3');
const soundTrack = new Audio('s.Mega Man (NES) Music - Cut Man Stage.mp3');
const tiroSom = new Audio('s.QuackSoundEffect_[cut_0sec].mp3');

const img2 = new Image();
img2.src = "i.patoRED.png";
const img = new Image();
img.src = "i.pato.png";

const Largura_P = 40;
const Altura_P = 40;
const Largura_Ini = 40;
const Altura_Ini = 40;

const PARTICLE_COUNT_PLAYER = 30;
const PARTICLE_COUNT_ENEMY = 50;
const DEATH_ANIMATION_DURATION = 1000;

const deathAnimations = {
    player: null,
    enemies: []
};

const jogo = {
    jogador: {
        x: tela.width / 2 - Largura_P / 2,
        y: tela.height - Altura_P - 10,
        velocidade: 5,
        tiros: [],
        pontuacao: 0,
        isDying: false,
        deathTimer: 0,
        alpha: 1
    },
    inimigos: [],
    teclas: {},
    gameOver: false
};

class Tiro {
    constructor(x, y, ehInimigo = false) {
        this.x = x;
        this.y = y;
        this.largura = 5;
        this.altura = 10;
        this.velocidade = ehInimigo ? 4 : -7;
        this.ehInimigo = ehInimigo;
    }

    desenhar() {
        ctx.fillStyle = this.ehInimigo ? 'red' : 'blue';
        ctx.fillRect(this.x, this.y, this.largura, this.altura);
    }

    mover() {
        this.y += this.velocidade;
    }
}

class Inimigo {
    constructor() {
        this.x = Math.random() * (tela.width - Largura_Ini);
        this.y = 0;
        this.velocidade = Math.random() * 2 + 1;
        this.intervaloTiro = Math.random() * 100 + 30;
        this.contadorTiro = 0;
        this.isDying = false;
        this.deathTimer = 0;
        this.alpha = 1;
    }

    desenhar() {
        if (this.isDying) {
            ctx.globalAlpha = this.alpha;
        }
        ctx.drawImage(img2, this.x, this.y, Largura_Ini, Altura_Ini);
        ctx.globalAlpha = 1;
    }

    mover() {
        if (this.isDying) {
            this.deathTimer += 16;
            this.alpha = 1 - (this.deathTimer / DEATH_ANIMATION_DURATION);
            return;
        }

        this.y += this.velocidade;
        this.contadorTiro++;
        if (this.contadorTiro >= this.intervaloTiro) {
            this.atirar();
            this.contadorTiro = 0;
        }
    }

    atirar() {
        jogo.jogador.tiros.push(new Tiro(this.x + Largura_Ini / 2, this.y + Altura_Ini, true));
    }

    triggerDeath() {
        this.isDying = true;
        this.deathTimer = 0;

        deathAnimations.enemies.push(new ParticleSystem({
            position: { x: this.x + Largura_Ini / 2, y: this.y + Altura_Ini / 2 },
            count: PARTICLE_COUNT_ENEMY,
            color: 'red',
            size: 3,
            speed: 2,
            life: 1000,
            spread: Math.PI * 2,
            gravity: 0.1
        }));
        return DEATH_ANIMATION_DURATION;
    }
}

class Particle {
    constructor(x, y, size, color, speed, angle, gravity, life) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = speed;
        this.angle = angle;
        this.gravity = gravity;
        this.life = life;
        this.opacity = 1;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.life -= 16;
        this.opacity = Math.max(this.life / 1000, 0);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isAlive() {
        return this.life > 0;
    }
}

class ParticleSystem {
    constructor({ position, count, color, size, speed, life, spread, gravity }) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * spread;
            const spd = speed * (0.5 + Math.random());
            this.particles.push(
                new Particle(
                    position.x,
                    position.y,
                    size,
                    color,
                    spd,
                    angle,
                    gravity,
                    life
                )
            );
        }
    }

    update() {
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.isAlive());
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

function desenharJogador() {
    if (jogo.jogador.isDying) {
        ctx.globalAlpha = jogo.jogador.alpha;
    }
    ctx.drawImage(img, jogo.jogador.x, jogo.jogador.y, Largura_P, Altura_P);
    ctx.globalAlpha = 1;
}

function moverJogador() {
    if (jogo.gameOver || jogo.jogador.isDying) return;

    if ((jogo.teclas['ArrowLeft'] || jogo.teclas['a']) && jogo.jogador.x > 0) {
        jogo.jogador.x -= jogo.jogador.velocidade;
    }
    if ((jogo.teclas['ArrowRight'] || jogo.teclas['d']) && jogo.jogador.x < tela.width - Largura_P) {
        jogo.jogador.x += jogo.jogador.velocidade;
    }
    if ((jogo.teclas['ArrowUp'] || jogo.teclas['w']) && jogo.jogador.y > 0) {
        jogo.jogador.y -= jogo.jogador.velocidade;
    }
    if ((jogo.teclas['ArrowDown'] || jogo.teclas['s']) && jogo.jogador.y < tela.height - Altura_P) {
        jogo.jogador.y += jogo.jogador.velocidade;
    }
}

let podeAtirar = true;
const intervaloAtira = 300;

function atirar() {
    if (!jogo.gameOver && podeAtirar && !jogo.jogador.isDying) {
        jogo.jogador.tiros.push(new Tiro(jogo.jogador.x + Largura_P / 2, jogo.jogador.y));
        disparoSom();
        podeAtirar = false;
        setTimeout(() => podeAtirar = true, intervaloAtira);
    }
}

function triggerPlayerDeath() {
    jogo.jogador.isDying = true;
    jogo.gameOver = true;
    reproduzirMrt();

    deathAnimations.player = new ParticleSystem({
        position: { x: jogo.jogador.x + Largura_P / 2, y: jogo.jogador.y + Altura_P / 2 },
        count: PARTICLE_COUNT_PLAYER,
        color: 'red',
        size: 4,
        speed: 1.5,
        life: 1000,
        spread: Math.PI * 2,
        gravity: 0.05
    });
}

function atualizarTiros() {
    jogo.jogador.tiros = jogo.jogador.tiros.filter(tiro => {
        tiro.mover();

        if (!tiro.ehInimigo) {
            jogo.inimigos = jogo.inimigos.filter(inimigo => {
                if (!inimigo.isDying && verificarColisao(tiro, inimigo)) {
                    const deathDuration = inimigo.triggerDeath();
                    setTimeout(() => {
                        jogo.jogador.pontuacao += 10;
                        elementoPontuacao.textContent = `Pontuação: ${jogo.jogador.pontuacao}`;
                    }, deathDuration);
                    return false;
                }
                return true;
            });
        }

        if (!jogo.gameOver && tiro.ehInimigo && verificarColisao(tiro, jogo.jogador) && !jogo.jogador.isDying) {
            triggerPlayerDeath();
        }

        return tiro.y > 0 && tiro.y < tela.height;
    });
}

function verificarColisao(obj1, obj2) {
    return !(
        obj1.x > obj2.x + Largura_Ini ||
        obj1.x + obj1.largura < obj2.x ||
        obj1.y > obj2.y + Altura_Ini ||
        obj1.y + obj1.altura < obj2.y
    );
}

function atualizarInimigos() {
    if (!jogo.gameOver && !jogo.jogador.isDying) {
        if (Math.random() < 0.02) {
            jogo.inimigos.push(new Inimigo());
        }
        jogo.inimigos = jogo.inimigos.filter(inimigo => {
            inimigo.mover();
            return inimigo.y <= tela.height && !inimigo.isDying;
        });
    }
}

function reproduzirMrt() {
    morteSom.currentTime = 0;
    morteSom.volume = 0.6;
    morteSom.play();
}

function disparoSom() {
    tiroSom.currentTime = 0;
    tiroSom.volume = 0.3;
    tiroSom.play();
}

function reproduzirST() {
    if (!soundTrack.playing) {
        soundTrack.loop = true;
        soundTrack.volume = 0.8;
        soundTrack.play();
    }
}

function desenhar() {
    ctx.clearRect(0, 0, tela.width, tela.height);

    if (!jogo.jogador.isDying) {
        desenharJogador();
    }

    jogo.jogador.tiros.forEach(t => t.desenhar());
    jogo.inimigos.forEach(i => i.desenhar());

    if (deathAnimations.player) {
        deathAnimations.player.update();
        deathAnimations.player.draw(ctx);
        if (deathAnimations.player.particles.length === 0) {
            deathAnimations.player = null;
        }
    }

    deathAnimations.enemies.forEach((ps, index) => {
        ps.update();
        ps.draw(ctx);
        if (ps.particles.length === 0) {
            deathAnimations.enemies.splice(index, 1);
        }
    });

    if (jogo.gameOver && !deathAnimations.player) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, tela.width, tela.height);
        ctx.fillStyle = 'crimson';
        ctx.font = '48px "Jersey 10"';
        ctx.textAlign = 'center';
        ctx.fillText('YOU DIED', tela.width / 2, tela.height / 2);
        ctx.font = '20px "Jersey 10"';
        ctx.fillText(`Pontuação: ${jogo.jogador.pontuacao}`, tela.width / 2, tela.height / 2 + 40);
        ctx.fillText('Pressione ENTER para reiniciar', tela.width / 2, tela.height / 2 + 80);
    }
}

function reiniciarJogo() {
    jogo.jogador.x = tela.width / 2 - Largura_P / 2;
    jogo.jogador.y = tela.height - Altura_P - 10;
    jogo.jogador.tiros = [];
    jogo.inimigos = [];
    jogo.jogador.pontuacao = 0;
    jogo.jogador.isDying = false;
    jogo.jogador.deathTimer = 0;
    jogo.jogador.alpha = 1;
    elementoPontuacao.textContent = 'Pontuação: 0';
    jogo.gameOver = false;
    deathAnimations.player = null;
    deathAnimations.enemies = [];
}

function loopJogo() {
    moverJogador();
    atualizarTiros();
    atualizarInimigos();
    desenhar();
    requestAnimationFrame(loopJogo);
}

window.addEventListener('keydown', (evento) => {
    jogo.teclas[evento.key] = true;
    if (evento.key === 'Enter' && jogo.gameOver && !deathAnimations.player) {
        reiniciarJogo();
    }
    if (evento.key === ' ' && !jogo.gameOver && !jogo.jogador.isDying) {
        atirar();
    }
});

window.addEventListener('keyup', (evento) => {
    jogo.teclas[evento.key] = false;
});

window.onload = () => {
    reproduzirST();
    loopJogo();
};
