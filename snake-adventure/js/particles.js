/* ============================================================
   ParticleSystem — sprite-based particle bursts + screen shake
   ============================================================ */
class Particle {
  constructor(x, y, img, opts = {}) {
    this.x = x; this.y = y;
    this.img = img;
    this.vx = opts.vx ?? (Math.random() * 2 - 1) * 2.2;
    this.vy = opts.vy ?? (Math.random() * 2 - 1) * 2.2 - 1;
    this.size = opts.size ?? 22;
    this.life = opts.life ?? 500;
    this.age = 0;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() * 2 - 1) * 4;
    this.gravity = opts.gravity ?? 0.05;
    this.fadeOut = opts.fadeOut ?? true;
  }

  update(dt) {
    this.age += dt;
    this.x += this.vx * (dt / 16);
    this.y += this.vy * (dt / 16);
    this.vy += this.gravity * (dt / 16);
    this.rotation += this.rotSpeed * (dt / 1000);
    return this.age < this.life;
  }

  draw(ctx) {
    const t = this.age / this.life;
    const alpha = this.fadeOut ? 1 - t : 1;
    const scale = 1 + t * 0.3;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const s = this.size * scale;
    if (this.img) {
      ctx.drawImage(this.img, -s / 2, -s / 2, s, s);
    }
    ctx.restore();
  }
}

class FloatingText {
  constructor(x, y, text, color = '#ffd54a') {
    this.x = x; this.y = y;
    this.text = text;
    this.color = color;
    this.life = 700;
    this.age = 0;
  }
  update(dt) {
    this.age += dt;
    this.y -= 0.04 * dt;
    return this.age < this.life;
  }
  draw(ctx) {
    const t = this.age / this.life;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.texts = [];
    this.shakeTime = 0;
    this.shakeMag = 0;
  }

  burst(x, y, img, count = 8, opts = {}) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, img, opts));
    }
  }

  floatText(x, y, text, color) {
    this.texts.push(new FloatingText(x, y, text, color));
  }

  shake(magnitude = 8, duration = 260) {
    this.shakeMag = Math.max(this.shakeMag, magnitude);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(dt) {
    this.particles = this.particles.filter((p) => p.update(dt));
    this.texts = this.texts.filter((t) => t.update(dt));
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeMag = 0;
    }
  }

  getShakeOffset() {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    const decay = this.shakeTime / 260;
    return {
      x: (Math.random() * 2 - 1) * this.shakeMag * decay,
      y: (Math.random() * 2 - 1) * this.shakeMag * decay,
    };
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach((p) => p.draw(ctx));
    this.texts.forEach((t) => t.draw(ctx));
  }
}
