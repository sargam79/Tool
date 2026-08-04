/* ============================================================
   SceneManager — all Three.js rendering lives here. Takes plain
   numbers from RunnerLogic (lane offsets, z-distances, state
   names) and turns them into a stylized, lit, toon-shaded 3D
   world. No gameplay rules are decided in this file.
   ============================================================ */
class SceneManager {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.assets = assets;
    this.clock = 0;

    this._initRenderer();
    this._initScene();
    this._initLights();
    this._initSky();
    this._initGradientMap();
    this._initCharacter();
    this._initTrackPool();
    this._initParticlePools();

    this.shakeMag = 0;
    this.shakeTime = 0;
  }

  /* ---------------- setup ---------------- */
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.ACESFilmicToneMapping) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
    }
    if ('outputEncoding' in this.renderer) this.renderer.outputEncoding = THREE.sRGBEncoding;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(RUNNER_CONFIG.COLORS.fogColor, 22, 85);

    this.camera = new THREE.PerspectiveCamera(RUNNER_CONFIG.CAMERA.baseFov, 1, 0.1, 300);
    this.cameraRig = new THREE.Object3D(); // used for shake offset without fighting the lerp target
    this.scene.add(this.cameraRig);
  }

  _initLights() {
    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x2a3a2a, 0.65);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff3d6, 1.15);
    sun.position.set(-8, 16, -10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 50;
    sun.shadow.bias = -0.0025;
    this.scene.add(sun);
    this.sunLight = sun;

    const rim = new THREE.DirectionalLight(RUNNER_CONFIG.COLORS.crystalGlow, 0.35);
    rim.position.set(6, 4, 6);
    this.scene.add(rim);
  }

  _initSky() {
    // vertical gradient sky dome
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1a3a6e');
    grad.addColorStop(0.55, '#3f7bc4');
    grad.addColorStop(1, '#bfe3ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    const geo = new THREE.SphereGeometry(140, 24, 16);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false });
    this.sky = new THREE.Mesh(geo, mat);
    this.scene.add(this.sky);

    // a few simple cloud billboards drifting slowly
    this.clouds = [];
    const cloudTex = this._makeCloudTexture();
    for (let i = 0; i < 10; i++) {
      const mat2 = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
      const spr = new THREE.Sprite(mat2);
      const scale = 14 + Math.random() * 16;
      spr.scale.set(scale, scale * 0.5, 1);
      spr.position.set((Math.random() - 0.5) * 120, 26 + Math.random() * 14, (Math.random() - 0.5) * 140);
      this.scene.add(spr);
      this.clouds.push(spr);
    }

    // simple birds: small dark V-shaped sprites drifting in loose arcs
    this.birds = [];
    const birdTex = this._makeBirdTexture();
    for (let i = 0; i < 5; i++) {
      const mat3 = new THREE.SpriteMaterial({ map: birdTex, transparent: true, depthWrite: false, fog: false });
      const spr = new THREE.Sprite(mat3);
      spr.scale.set(1.2, 0.6, 1);
      spr.position.set((Math.random() - 0.5) * 40, 10 + Math.random() * 6, 20 + Math.random() * 40);
      spr.userData.phase = Math.random() * Math.PI * 2;
      spr.userData.speed = 0.5 + Math.random() * 0.4;
      this.scene.add(spr);
      this.birds.push(spr);
    }
  }

  _makeCloudTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 6; i++) {
      const x = 20 + Math.random() * 88, y = 24 + Math.random() * 16, r = 14 + Math.random() * 14;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  _makeBirdTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(30,30,40,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(4, 10); ctx.quadraticCurveTo(32, 30, 60, 10);
    ctx.stroke();
    return new THREE.CanvasTexture(c);
  }

  _initGradientMap() {
    // 3-step toon gradient for that bright cartoon cel-shaded look
    const c = document.createElement('canvas');
    c.width = 4; c.height = 1;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4a4a55'; ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#9a9aa8'; ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#d8d8e0'; ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(3, 0, 1, 1);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    this.toonGradient = tex;
  }

  toonMat(color, extra = {}) {
    return new THREE.MeshToonMaterial({ color, gradientMap: this.toonGradient, ...extra });
  }

  _loadTexture(key, repeatX = 1, repeatY = 1) {
    const img = this.assets.get(key);
    const tex = new THREE.Texture(img);
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    return tex;
  }

  /* ---------------- character ---------------- */
  _initCharacter() {
    const group = new THREE.Group();

    const skin = 0xffd7a8;
    const jacketWhite = 0xf2f4f8;
    const jacketOrange = 0xff8a30;
    const pants = 0x2b2f3a;
    const hair = 0xe8e8ee;
    const goggle = 0x2fa9ff;

    // torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.75, 10), this.toonMat(jacketWhite));
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), this.toonMat(jacketOrange));
    chestStripe.position.set(0, 1.2, 0.32);
    group.add(chestStripe);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), this.toonMat(skin));
    head.position.y = 1.72;
    head.castShadow = true;
    group.add(head);

    // goggles
    const goggleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.08), this.toonMat(goggle, { emissive: 0x1a4a70, emissiveIntensity: 0.5 }));
    goggleMesh.position.set(0, 1.75, 0.25);
    group.add(goggleMesh);

    // spiky hair (a few tetra-ish cones)
    for (let i = 0; i < 7; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 5), this.toonMat(hair));
      const ang = (i / 7) * Math.PI - Math.PI / 2;
      spike.position.set(Math.sin(ang) * 0.16, 1.92 + Math.cos(ang) * 0.06, -0.05 + Math.cos(ang) * 0.05);
      spike.rotation.z = -ang * 0.6;
      spike.rotation.x = -0.4;
      group.add(spike);
    }

    // arms (shoulder pivots for swing animation)
    const armGeo = new THREE.CylinderGeometry(0.075, 0.09, 0.55, 8);
    const handGeo = new THREE.SphereGeometry(0.09, 8, 8);
    this.shoulderL = new THREE.Object3D(); this.shoulderL.position.set(-0.38, 1.42, 0);
    this.shoulderR = new THREE.Object3D(); this.shoulderR.position.set(0.38, 1.42, 0);
    group.add(this.shoulderL, this.shoulderR);

    const armL = new THREE.Mesh(armGeo, this.toonMat(jacketWhite)); armL.position.y = -0.27; armL.castShadow = true;
    const handL = new THREE.Mesh(handGeo, this.toonMat(0x2a2a30)); handL.position.y = -0.55;
    this.shoulderL.add(armL, handL);

    const armR = new THREE.Mesh(armGeo, this.toonMat(jacketOrange)); armR.position.y = -0.27; armR.castShadow = true;
    const handR = new THREE.Mesh(handGeo, this.toonMat(0x2a2a30)); handR.position.y = -0.55;
    this.shoulderR.add(armR, handR);

    // legs (hip pivots)
    const legGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.62, 8);
    const shoeGeo = new THREE.BoxGeometry(0.16, 0.12, 0.28);
    this.hipL = new THREE.Object3D(); this.hipL.position.set(-0.17, 0.8, 0);
    this.hipR = new THREE.Object3D(); this.hipR.position.set(0.17, 0.8, 0);
    group.add(this.hipL, this.hipR);

    const legL = new THREE.Mesh(legGeo, this.toonMat(pants)); legL.position.y = -0.3; legL.castShadow = true;
    const shoeL = new THREE.Mesh(shoeGeo, this.toonMat(goggle)); shoeL.position.set(0, -0.62, 0.07); shoeL.castShadow = true;
    this.hipL.add(legL, shoeL);

    const legR = new THREE.Mesh(legGeo, this.toonMat(pants)); legR.position.y = -0.3; legR.castShadow = true;
    const shoeR = new THREE.Mesh(shoeGeo, this.toonMat(jacketOrange)); shoeR.position.set(0, -0.62, 0.07); shoeR.castShadow = true;
    this.hipR.add(legR, shoeR);

    this.character = group;
    this.characterParts = { torso, head, goggleMesh };
    this.scene.add(group);

    // shield visual shell (hidden until active)
    const shieldGeo = new THREE.SphereGeometry(0.75, 16, 12);
    const shieldMat = new THREE.MeshBasicMaterial({ color: RUNNER_CONFIG.COLORS.crystalGlow, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.1;
    this.shieldMesh.visible = false;
    group.add(this.shieldMesh);
  }

  /* ---------------- infinite track pool ---------------- */
  _initTrackPool() {
    const groundTex = this._loadTexture('texSand', 3, RUNNER_CONFIG.TRACK.segmentLength / 4);
    const rockTex = this._loadTexture('texRock', 4, 2);
    const groundMat = this.toonMat(0xd8c088, { map: groundTex });
    const wallMat = this.toonMat(0x8a8a92, { map: rockTex });

    this.trackSegments = [];
    const total = RUNNER_CONFIG.TRACK.segmentsAhead + RUNNER_CONFIG.TRACK.segmentsBehind;
    for (let i = 0; i < total; i++) {
      const seg = new THREE.Group();

      const groundW = RUNNER_CONFIG.LANE_WIDTH * 3 + 1.2;
      const ground = new THREE.Mesh(
        new THREE.BoxGeometry(groundW, 0.4, RUNNER_CONFIG.TRACK.segmentLength),
        groundMat
      );
      ground.position.y = -0.2;
      ground.receiveShadow = true;
      seg.add(ground);

      // lane divider glow strips
      for (const laneEdge of [-1, 1]) {
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.02, RUNNER_CONFIG.TRACK.segmentLength),
          new THREE.MeshBasicMaterial({ color: RUNNER_CONFIG.COLORS.crystalGlow })
        );
        strip.position.set(laneEdge * RUNNER_CONFIG.LANE_WIDTH * 0.5, 0.01, 0);
        seg.add(strip);
      }

      // canyon walls
      for (const side of [-1, 1]) {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 9, RUNNER_CONFIG.TRACK.segmentLength),
          wallMat
        );
        wall.position.set(side * (groundW / 2 + 1.25), 4.3, 0);
        wall.receiveShadow = true;
        wall.castShadow = true;
        seg.add(wall);

        // occasional tree on the rim
        if (Math.random() < 0.6) {
          const tree = this._makeTree();
          tree.position.set(side * (groundW / 2 + 2.6), 9.2, (Math.random() - 0.5) * RUNNER_CONFIG.TRACK.segmentLength);
          seg.add(tree);
        }
        // occasional distant floating island silhouette for atmosphere
        if (Math.random() < 0.25) {
          const isle = this._makeFloatingIsland();
          isle.position.set(side * (14 + Math.random() * 10), 6 + Math.random() * 6, (Math.random() - 0.5) * RUNNER_CONFIG.TRACK.segmentLength);
          seg.add(isle);
        }
      }

      seg.position.z = i * RUNNER_CONFIG.TRACK.segmentLength;
      seg.userData.index = i;
      this.scene.add(seg);
      this.trackSegments.push(seg);
    }
  }

  _makeTree() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 6), this.toonMat(0x6b4a2a));
    trunk.position.y = 0.7; trunk.castShadow = true;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.6, 8), this.toonMat(0x2f9e4f));
    leaves.position.y = 1.9; leaves.castShadow = true;
    g.add(trunk, leaves);
    return g;
  }

  _makeFloatingIsland() {
    const g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.6, 6), this.toonMat(0x7a7a86));
    rock.rotation.x = Math.PI;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.5, 6), this.toonMat(0x3fa85a));
    top.position.y = 1.4;
    const crystalMat = new THREE.MeshBasicMaterial({ color: RUNNER_CONFIG.COLORS.crystalGlow, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.1, 5), crystalMat);
    crystal.position.y = 2.2;
    g.add(rock, top, crystal);
    return g;
  }

  /** Move every ground/canyon segment toward the player by `amount`. Without
   *  this the track geometry sits frozen in place while only the obstacles/
   *  collectibles scroll, leaving the player floating over static, rapidly
   *  mis-recycled ground. */
  scrollTrackSegments(amount) {
    for (const seg of this.trackSegments) {
      seg.position.z -= amount;
    }
  }

  recycleTrackSegments() {
    const total = this.trackSegments.length;
    const behindThreshold = -RUNNER_CONFIG.TRACK.segmentLength * (RUNNER_CONFIG.TRACK.segmentsBehind + 0.5);
    for (const seg of this.trackSegments) {
      if (seg.position.z < behindThreshold) {
        seg.position.z += RUNNER_CONFIG.TRACK.segmentLength * total;
      }
    }
  }

  /* ---------------- particle pools ---------------- */
  _initParticlePools() {
    this.dustTex = this._toThreeTexture(this.assets.get('dustEffect'));
    this.sparkTex = this._makeGlowTexture('#ffffff');
    this.crystalGlowTex = this._makeGlowTexture('#33ccff');
    this.activeParticles = [];
  }

  _toThreeTexture(img) {
    const tex = new THREE.Texture(img);
    tex.needsUpdate = true;
    return tex;
  }

  _makeGlowTexture(color) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  spawnParticle(worldPos, texture, opts = {}) {
    const mat = new THREE.SpriteMaterial({
      map: texture, transparent: true, depthWrite: false,
      blending: opts.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    const spr = new THREE.Sprite(mat);
    const s = opts.size ?? 0.6;
    spr.scale.set(s, s, 1);
    spr.position.copy(worldPos);
    this.scene.add(spr);
    this.activeParticles.push({
      sprite: spr,
      vel: opts.vel ?? new THREE.Vector3((Math.random() - 0.5) * 1.2, 1.2 + Math.random(), (Math.random() - 0.5) * 1.2),
      life: opts.life ?? 500,
      age: 0,
      gravity: opts.gravity ?? -1.4,
      growth: opts.growth ?? 1.5,
    });
  }

  updateParticles(dtSec) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.age += dtSec * 1000;
      if (p.age >= p.life) {
        this.scene.remove(p.sprite);
        p.sprite.material.dispose();
        this.activeParticles.splice(i, 1);
        continue;
      }
      const t = p.age / p.life;
      p.vel.y += p.gravity * dtSec;
      p.sprite.position.addScaledVector(p.vel, dtSec);
      p.sprite.material.opacity = 1 - t;
      const s = (p.sprite.scale.x) + p.growth * dtSec;
      p.sprite.scale.set(s, s, 1);
    }
  }

  /* ---------------- per-frame updates ---------------- */
  updateCharacterPose(player, distanceTraveled, speed) {
    const cfg = RUNNER_CONFIG;
    const g = this.character;

    // lane + jump/slide vertical offset
    g.position.x = player.laneOffset * cfg.LANE_WIDTH;
    g.position.y = player.height;

    // running cycle tied to distance so it visually matches actual speed
    const cycle = distanceTraveled * 2.2;
    const runAmp = player.state === 'run' ? 1 : 0.3;
    this.shoulderL.rotation.x = Math.sin(cycle) * 0.9 * runAmp;
    this.shoulderR.rotation.x = -Math.sin(cycle) * 0.9 * runAmp;
    this.hipL.rotation.x = -Math.sin(cycle) * 1.0 * runAmp;
    this.hipR.rotation.x = Math.sin(cycle) * 1.0 * runAmp;

    // state-specific pose adjustments
    g.rotation.set(0, 0, 0);
    g.scale.set(1, 1, 1);
    if (player.state === 'jump') {
      g.rotation.x = -0.15;
      this.hipL.rotation.x = 0.6; this.hipR.rotation.x = 0.6;
    } else if (player.state === 'slide') {
      g.rotation.x = -1.05;
      g.position.y += 0.15;
    } else if (player.state === 'hit') {
      g.rotation.z = Math.sin(this.clock * 40) * 0.15;
    } else if (player.state === 'dead') {
      g.rotation.x = Math.PI / 2 * Math.min(1, player._deathT ?? 0);
    }

    // lean into lane changes
    const laneVelocity = (player.targetLane - player.lane) * (1 - player.laneT);
    g.rotation.z += -laneVelocity * 0.25;

    this.shieldMesh.visible = !!player._shieldVisible;
    if (this.shieldMesh.visible) {
      const pulse = 1 + Math.sin(this.clock * 6) * 0.05;
      this.shieldMesh.scale.set(pulse, pulse, pulse);
    }
  }

  updateCamera(distanceTraveled, speed, player, dtSec) {
    const cfg = RUNNER_CONFIG.CAMERA;
    const speedT = Math.min(1, (speed - RUNNER_CONFIG.SPEED.baseWorldUnitsPerSec) / (RUNNER_CONFIG.SPEED.maxWorldUnitsPerSec - RUNNER_CONFIG.SPEED.baseWorldUnitsPerSec));

    const targetX = this.character.position.x * 0.4;
    const targetY = cfg.baseHeight;
    const targetZ = -cfg.baseDistance;

    this.cameraRig.position.x += (targetX - this.cameraRig.position.x) * cfg.followLerp;
    this.cameraRig.position.y += (targetY - this.cameraRig.position.y) * cfg.followLerp;
    this.cameraRig.position.z += (targetZ - this.cameraRig.position.z) * cfg.followLerp;

    // shake
    let shakeX = 0, shakeY = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= dtSec * 1000;
      const decay = Math.max(0, this.shakeTime / 300);
      shakeX = (Math.random() - 0.5) * this.shakeMag * decay;
      shakeY = (Math.random() - 0.5) * this.shakeMag * decay;
    }

    this.camera.position.set(
      this.character.position.x + this.cameraRig.position.x + shakeX,
      this.character.position.y + this.cameraRig.position.y + shakeY,
      this.character.position.z + this.cameraRig.position.z
    );
    const lookTarget = new THREE.Vector3(
      this.character.position.x * 0.6,
      this.character.position.y + cfg.lookAheadHeight,
      this.character.position.z + 4
    );
    this.camera.lookAt(lookTarget);

    // dynamic FOV + tilt
    this.camera.fov = cfg.baseFov + speedT * cfg.maxFovBoost;
    const laneVelocity = (player.targetLane - player.lane) * (1 - player.laneT);
    this.camera.rotation.z = -laneVelocity * (cfg.tiltMaxDeg * Math.PI / 180);
    this.camera.updateProjectionMatrix();
  }

  triggerShake(mag = 0.3, durationMs = 300) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeTime = Math.max(this.shakeTime, durationMs);
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /* ---------------- obstacle / collectible / powerup meshes ---------------- */
  createItemVisual(item) {
    if (item.type === 'obstacle') return this._createObstacleMesh(item);
    if (item.type === 'collectible') return this._createCollectibleMesh(item);
    if (item.type === 'powerup') return this._createPowerupMesh(item);
    return null;
  }

  _createObstacleMesh(item) {
    const laneX = (item.lane - 1) * RUNNER_CONFIG.LANE_WIDTH;
    let mesh;
    switch (item.kind) {
      case 'barrier': {
        const tex = this._toThreeTexture(this.assets.get('barrierTexture'));
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(RUNNER_CONFIG.LANE_WIDTH * 0.85, 1.1), mat);
        plane.position.set(laneX, 0.55, 0);
        mesh = plane;
        break;
      }
      case 'rock': {
        const g = new THREE.Group();
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), this.toonMat(0x8f8f98));
        rock.position.y = 0.55;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        g.add(rock);
        g.position.set(laneX, 0, 0);
        mesh = g;
        break;
      }
      case 'movingRock': {
        const g = new THREE.Group();
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), this.toonMat(0x9a8f7a));
        rock.position.y = 0.5;
        rock.castShadow = true;
        g.add(rock);
        g.position.set(laneX, 0, 0);
        g.userData.moveSeed = item.moveSeed || 0;
        mesh = g;
        break;
      }
      case 'fallenTree': {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, RUNNER_CONFIG.LANE_WIDTH * 3.2, 8), this.toonMat(0x6b4a2a));
        trunk.rotation.z = Math.PI / 2;
        trunk.position.y = 0.65;
        trunk.castShadow = true;
        g.add(trunk);
        for (let i = 0; i < 4; i++) {
          const branch = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 5), this.toonMat(0x2f9e4f));
          branch.position.set((i - 1.5) * 1.4, 1.0, 0.2);
          branch.rotation.x = 0.5;
          g.add(branch);
        }
        mesh = g;
        break;
      }
      case 'brokenBridge': {
        const g = new THREE.Group();
        for (const side of [-1, 1]) {
          const plank = new THREE.Mesh(new THREE.BoxGeometry(RUNNER_CONFIG.LANE_WIDTH * 1.4, 0.25, 0.8), this.toonMat(0x8a6a3a));
          plank.position.set(side * RUNNER_CONFIG.LANE_WIDTH * 0.9, 0.1, side * 0.5);
          plank.rotation.z = side * 0.35;
          plank.castShadow = true;
          g.add(plank);
        }
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(RUNNER_CONFIG.LANE_WIDTH * 3, 1.4), new THREE.MeshBasicMaterial({ color: RUNNER_CONFIG.COLORS.crystalGlow, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending }));
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = -0.15;
        g.add(glow);
        mesh = g;
        break;
      }
      default: {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), this.toonMat(0xaaaaaa));
        mesh.position.set(laneX, 0.3, 0);
      }
    }
    if (item.kind !== 'fallenTree' && item.kind !== 'brokenBridge' && item.kind !== 'barrier') {
      // rock/movingRock already positioned via group; nothing extra needed
    }
    mesh.position.z = item.z;
    this.scene.add(mesh);
    return mesh;
  }

  _createCollectibleMesh(item) {
    const laneX = (item.lane - 1) * RUNNER_CONFIG.LANE_WIDTH;
    let mesh;
    if (item.kind === 'crystal') {
      const tex = this._toThreeTexture(this.assets.get('crystalIcon'));
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      mesh = new THREE.Sprite(mat);
      mesh.scale.set(0.9, 0.9, 1);
      mesh.position.set(laneX, 1.1, item.z);
    } else if (item.kind === 'coin') {
      const tex = this._toThreeTexture(this.assets.get('coinIcon'));
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
      mesh = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), mat);
      mesh.position.set(laneX, 1.0, item.z);
      mesh.rotation.y = Math.random() * Math.PI;
    } else { // gem (rare)
      mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshBasicMaterial({ color: 0xff4fd8 }));
      mesh.position.set(laneX, 1.1, item.z);
    }
    this.scene.add(mesh);
    return mesh;
  }

  _createPowerupMesh(item) {
    const laneX = (item.lane - 1) * RUNNER_CONFIG.LANE_WIDTH;
    const key = item.kind === 'shield' ? 'shieldIcon' : 'speedIcon';
    const tex = this._toThreeTexture(this.assets.get(key));
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Sprite(mat);
    mesh.scale.set(1.0, 1.0, 1);
    mesh.position.set(laneX, 1.3, item.z);
    this.scene.add(mesh);
    return mesh;
  }

  updateItemVisual(item, mesh, dtSec) {
    mesh.position.z = item.z;
    if (item.type === 'collectible') {
      const bob = Math.sin(this.clock * 3 + item.id) * 0.08;
      mesh.position.y = (item.kind === 'coin' ? 1.0 : 1.1) + bob;
      if (item.kind === 'coin') mesh.rotation.y += dtSec * 3;
      if (item.kind === 'gem') mesh.rotation.y += dtSec * 2.2;
    } else if (item.type === 'powerup') {
      mesh.position.y = 1.3 + Math.sin(this.clock * 2.4 + item.id) * 0.1;
    } else if (item.kind === 'movingRock') {
      const laneX = (item.lane - 1) * RUNNER_CONFIG.LANE_WIDTH;
      mesh.position.x = laneX + Math.sin(this.clock * 2 + (mesh.userData.moveSeed || 0)) * 0.55;
    }
  }

  removeItemVisual(mesh) {
    this.scene.remove(mesh);
    mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }

  step(dtSec) {
    this.clock += dtSec;
    this.clouds.forEach((c) => { c.position.x += dtSec * 0.3; });
    this.birds.forEach((b) => {
      b.userData.phase += dtSec * b.userData.speed;
      b.position.y += Math.sin(b.userData.phase) * 0.01;
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SceneManager };
}

