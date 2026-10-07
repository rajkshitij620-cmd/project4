/**
 * SlingPuckBackground.ts
 * ---------------------------------------------------------------------------
 * A self-playing 3D "sling puck" (Super Winner) board game used as an animated
 * app background.
 *
 * UPGRADED FEATURES:
 * 1. Neon Glowing Pucks: Arctic White with Cyan core vs Midnight Obsidian with Magenta core.
 * 2. Glowing Elastic Sling Band: Dynamic energetic tension glow that reacts to pull force.
 * 3. Collision Sparks & Gate Passing Flash: Spark bursts on impacts and gate crossing.
 * 4. Mobile Tilt / Gyroscope Parallax: Responsive tilting on smartphones & tablets.
 * 5. Interactive Touch / Click to Fling: Tap near any puck to sling it towards the gate.
 *
 * Performance: Zero garbage collection in render loops (reusable vectors & pools).
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------------- */
/* Public API                                                                */
/* ------------------------------------------------------------------------- */

export interface SlingPuckOptions {
  /** Start animating immediately. Default: true */
  autoStart?: boolean;
  /** Camera reacts to mouse/touch and gyroscope movement. Default: true */
  parallax?: boolean;
  /** 'low' disables soft shadows and reduces particles. Default: 'high' */
  quality?: 'low' | 'high';
  /** Pucks per player. Default: 5 */
  pucksPerSide?: number;
  /** Seconds between shots (approx). Default: 1.3 */
  turnDelay?: number;
  /** Max device pixel ratio, caps GPU cost on retina screens. Default: 1.75 */
  maxPixelRatio?: number;
  /** Allow clicking/tapping on background to fling pucks. Default: true */
  interactive?: boolean;
}

type Side = 1 | -1; // +1 = near/cyan player (z > 0), -1 = far/magenta player (z < 0)

interface Puck {
  group: THREE.Group;
  baseMesh: THREE.Mesh;
  glowRing: THREE.Mesh;
  owner: Side;
  pos: THREE.Vector2; // x, z on the board
  lastPos: THREE.Vector2;
  vel: THREE.Vector2;
  held: boolean; // true while aiming
  scale: number;
}

interface Spark {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  active: boolean;
}

type Phase = 'wait' | 'aim' | 'resetOut' | 'resetIn';

/* ------------------------------------------------------------------------- */
/* Board constants (world units)                                             */
/* ------------------------------------------------------------------------- */

const BOARD_W = 6;
const BOARD_L = 10;
const PUCK_R = 0.28;
const PUCK_H = 0.14;
const GATE_W = 1.15; // opening in the center divider
const DIVIDER_T = 0.12; // divider thickness
const ANCHOR_Z = 4.1; // where the elastic band is anchored
const PULL_DIST = 0.55; // how far puck is pulled back
const FRICTION = 1.1; // exponential velocity damping
const WALL_BOUNCE = 0.72;
const PUCK_BOUNCE = 0.88;
const MAX_SPARKS = 80;

const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ------------------------------------------------------------------------- */
/* Main class                                                                */
/* ------------------------------------------------------------------------- */

export class SlingPuckBackground {
  private readonly container: HTMLElement;
  private readonly opts: Required<SlingPuckOptions>;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private particles: THREE.Points;
  private band: THREE.Line;
  private bandMaterial: THREE.LineBasicMaterial;
  private gateLight: THREE.PointLight;
  private pucks: Puck[] = [];
  private disposables: Array<{ dispose(): void }> = [];

  // Spark Particle Pool
  private sparks: Spark[] = [];
  private sparkPoints: THREE.Points;
  private sparkGeo: THREE.BufferGeometry;

  private rafId = 0;
  private running = false;
  private lastTime = 0;
  private elapsed = 0;
  private resizeObserver: ResizeObserver;

  // camera & parallax
  private readonly camTarget = new THREE.Vector3(0, 0, 0.1);
  private camDist = 6.2;
  private pointer = new THREE.Vector2(0, 0);
  private pointerSmooth = new THREE.Vector2(0, 0);
  private gyro = new THREE.Vector2(0, 0);
  private readonly reducedMotion: boolean;

  // interaction raycasting
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private rayHit = new THREE.Vector3();

  // game state
  private phase: Phase = 'wait';
  private timer = 0.8;
  private shooter: Side = 1;
  private active: Puck | null = null;
  private aimT = 0;
  private aimStart = new THREE.Vector2();
  private aimRest = new THREE.Vector2();
  private aimPull = new THREE.Vector2();
  private aimTarget = new THREE.Vector2();
  private aimSpeed = 9;
  private resetT = 0;

  // Scratch vectors to eliminate GC memory allocations in physics and render loops
  private readonly _diff = new THREE.Vector2();
  private readonly _shootDir = new THREE.Vector2();
  private readonly _camDir = new THREE.Vector3();
  private readonly _tempColor = new THREE.Color();

  constructor(container: HTMLElement, options: SlingPuckOptions = {}) {
    this.container = container;
    this.opts = {
      autoStart: options.autoStart ?? true,
      parallax: options.parallax ?? true,
      quality: options.quality ?? 'high',
      pucksPerSide: options.pucksPerSide ?? 5,
      turnDelay: options.turnDelay ?? 1.3,
      maxPixelRatio: options.maxPixelRatio ?? 1.75,
      interactive: options.interactive ?? true,
    };
    this.reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const high = this.opts.quality === 'high';

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({
      antialias: high,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.opts.maxPixelRatio));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = high ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
    canvas.setAttribute('aria-hidden', 'true');
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    container.appendChild(canvas);

    /* Scene */
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c18);
    this.scene.fog = new THREE.FogExp2(0x060c18, 0.010);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

    this.buildLights(high);
    this.gateLight = this.buildGateLight();
    this.buildTable();
    this.buildBoard();
    const { line, mat } = this.buildBand();
    this.band = line;
    this.bandMaterial = mat;
    this.particles = this.buildParticles(high ? 130 : 45);
    const { points, geo } = this.buildSparkSystem();
    this.sparkPoints = points;
    this.sparkGeo = geo;
    this.spawnPucks();

    /* Events */
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    if (this.opts.parallax && !this.reducedMotion) {
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
      window.addEventListener('deviceorientation', this.onDeviceOrientation, { passive: true });
    }
    if (this.opts.interactive) {
      window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    }
    document.addEventListener('visibilitychange', this.onVisibility);

    if (this.opts.autoStart) this.start();
    else this.renderer.render(this.scene, this.camera);
  }

  /* ----------------------------- lifecycle ------------------------------ */

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('deviceorientation', this.onDeviceOrientation);
    window.removeEventListener('pointerdown', this.onPointerDown);
    document.removeEventListener('visibilitychange', this.onVisibility);

    this.scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.remove();
    }
  }

  /* ------------------------------ scene setup --------------------------- */

  private track<T extends { dispose(): void }>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private buildLights(high: boolean): void {
    this.scene.add(new THREE.HemisphereLight(0xdfeaff, 0x1b2b3d, 0.9));

    const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
    sun.position.set(4, 11, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
    const s = 7.5;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 28;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    // Dynamic glowing rim lights (cyan & hot magenta neon gaming glow)
    const cyan = new THREE.PointLight(0x00f0ff, 42, 25, 1.8);
    cyan.position.set(-7, 3.8, -3);
    const magenta = new THREE.PointLight(0xff007f, 42, 25, 1.8);
    magenta.position.set(7, 3.8, 4);
    this.scene.add(cyan, magenta);
  }

  private buildGateLight(): THREE.PointLight {
    const light = new THREE.PointLight(0x00ffff, 0, 8, 1.5);
    light.position.set(0, 0.45, 0);
    this.scene.add(light);
    return light;
  }

  private buildTable(): void {
    const geo = this.track(new THREE.PlaneGeometry(80, 80));
    const mat = this.track(new THREE.MeshStandardMaterial({ color: 0x071524, roughness: 0.92, metalness: 0.05 }));
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private buildBoard(): void {
    const wood = this.track(new THREE.MeshStandardMaterial({ color: 0xfff1e6, roughness: 0.55, metalness: 0.02 }));
    const darkWood = this.track(new THREE.MeshStandardMaterial({ color: 0xe8c9aa, roughness: 0.5 }));
    const goldPegMat = this.track(new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.25, metalness: 0.85 }));

    // Base slab
    const slab = new THREE.Mesh(this.track(new THREE.BoxGeometry(BOARD_W + 0.6, 0.2, BOARD_L + 0.6)), wood);
    slab.position.y = -0.1;
    slab.receiveShadow = true;
    slab.castShadow = true;
    this.scene.add(slab);

    // Playing surface with painted markings
    const surface = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(BOARD_W, BOARD_L)),
      this.track(new THREE.MeshStandardMaterial({ map: this.makeBoardTexture(), roughness: 0.45, metalness: 0 })),
    );
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.002;
    surface.receiveShadow = true;
    this.scene.add(surface);

    // Rails
    const railH = 0.35;
    const railT = 0.3;
    const addRail = (w: number, d: number, x: number, z: number): void => {
      const r = new THREE.Mesh(this.track(new THREE.BoxGeometry(w, railH, d)), darkWood);
      r.position.set(x, railH / 2, z);
      r.castShadow = true;
      r.receiveShadow = true;
      this.scene.add(r);
    };
    addRail(railT, BOARD_L + railT * 2, -(BOARD_W / 2 + railT / 2), 0);
    addRail(railT, BOARD_L + railT * 2, BOARD_W / 2 + railT / 2, 0);
    addRail(BOARD_W, railT, 0, -(BOARD_L / 2 + railT / 2));
    addRail(BOARD_W, railT, 0, BOARD_L / 2 + railT / 2);

    // Anchor Pegs on rails where the elastic band connects
    const pegGeo = this.track(new THREE.CylinderGeometry(0.06, 0.06, 0.38, 16));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const peg = new THREE.Mesh(pegGeo, goldPegMat);
        peg.position.set(sx * (BOARD_W / 2 - 0.04), railH / 2 + 0.04, sz * ANCHOR_Z);
        peg.castShadow = true;
        this.scene.add(peg);
      }
    }

    // Center divider with a gate opening
    const segW = (BOARD_W - GATE_W) / 2;
    const divH = 0.24;
    for (const sx of [-1, 1]) {
      const d = new THREE.Mesh(this.track(new THREE.BoxGeometry(segW, divH, DIVIDER_T)), darkWood);
      d.position.set(sx * (GATE_W / 2 + segW / 2), divH / 2, 0);
      d.castShadow = true;
      d.receiveShadow = true;
      this.scene.add(d);
    }
  }

  /** Procedural wood texture + game markings drawn on a canvas. */
  private makeBoardTexture(): THREE.CanvasTexture {
    const W = 1024;
    const H = 1708;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');

    // Base color gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#fff1e6');
    g.addColorStop(0.5, '#f8e0c8');
    g.addColorStop(1, '#fce8d5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Fine wood grain lines
    ctx.lineWidth = 1;
    for (let i = 0; i < 700; i++) {
      ctx.strokeStyle = `rgba(110,65,25,${rand(0.015, 0.055)})`;
      ctx.lineWidth = rand(0.6, 2.0);
      const y = rand(0, H);
      const x = rand(-100, W);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 200, y + rand(-6, 6), x + 400, y + rand(-6, 6), x + rand(500, 900), y + rand(-4, 4));
      ctx.stroke();
    }

    const halfH = H / 2;
    const drawHalf = (): void => {
      // Guide stripes
      ctx.fillStyle = '#1c1510';
      for (const y of [215, 262, 309]) ctx.fillRect(40, y, W - 80, 8);
      ctx.fillRect(40, 690, W - 80, 7); // baseline
      for (let i = 0; i < 5; i++) ctx.fillRect(W * (0.1 + i * 0.2) - 2, 705, 4, 60);

      // Red gate chevron marker
      ctx.fillStyle = '#b3261e';
      ctx.beginPath();
      ctx.moveTo(W / 2, 28);
      ctx.lineTo(W / 2 - 18, 64);
      ctx.lineTo(W / 2 + 18, 64);
      ctx.closePath();
      ctx.fill();

      // Board Emblem Logo
      ctx.save();
      ctx.translate(W / 2, 300);
      ctx.strokeStyle = '#8b2e20';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, 150, 105, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff1e6';
      ctx.beginPath();
      ctx.ellipse(0, 0, 138, 94, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9b2c1c';
      ctx.textAlign = 'center';
      ctx.font = 'italic 900 62px Georgia, serif';
      ctx.fillText('Super', 0, -6);
      ctx.fillStyle = '#1e3023';
      ctx.font = '800 42px Georgia, serif';
      ctx.fillText('WINNER', 0, 44);
      ctx.restore();
    };

    // Near half
    ctx.save();
    ctx.translate(0, halfH);
    drawHalf();
    ctx.restore();

    // Far half (rotated)
    ctx.save();
    ctx.translate(W, halfH);
    ctx.rotate(Math.PI);
    drawHalf();
    ctx.restore();

    // Center divider seam
    ctx.fillStyle = 'rgba(40,25,10,0.55)';
    ctx.fillRect(0, halfH - 2, W, 4);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return this.track(tex);
  }

  private buildBand(): { line: THREE.Line; mat: THREE.LineBasicMaterial } {
    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    const mat = this.track(new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 }));
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    line.visible = false;
    this.scene.add(line);
    return { line, mat };
  }

  private buildParticles(count: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = rand(-16, 16);
      positions[i * 3 + 1] = rand(0.5, 9);
      positions[i * 3 + 2] = rand(-14, 14);
    }
    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = this.track(
      new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: 0.08,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    return pts;
  }

  /* -------------------------- Spark System ------------------------------ */

  private buildSparkSystem(): { points: THREE.Points; geo: THREE.BufferGeometry } {
    const positions = new Float32Array(MAX_SPARKS * 3);
    const colors = new Float32Array(MAX_SPARKS * 3);

    for (let i = 0; i < MAX_SPARKS; i++) {
      this.sparks.push({
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        color: new THREE.Color(0x00ffff),
        life: 0,
        maxLife: 1,
        active: false,
      });
      positions[i * 3 + 1] = -10; // hidden initially
    }

    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = this.track(
      new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    return { points, geo };
  }

  private emitSparks(x: number, y: number, z: number, count: number, colorHex: number, speedScale = 1.0): void {
    let emitted = 0;
    for (const spark of this.sparks) {
      if (!spark.active) {
        spark.active = true;
        spark.pos.set(x, Math.max(0.08, y), z);
        const angle = Math.random() * Math.PI * 2;
        const spd = rand(1.5, 4.5) * speedScale;
        spark.vel.set(Math.cos(angle) * spd, rand(1.0, 3.2), Math.sin(angle) * spd);
        spark.color.setHex(colorHex);
        spark.life = 0;
        spark.maxLife = rand(0.3, 0.65);
        emitted++;
        if (emitted >= count) break;
      }
    }
  }

  private updateSparks(dt: number): void {
    const posAttr = this.sparkGeo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.sparkGeo.getAttribute('color') as THREE.BufferAttribute;
    let anyActive = false;

    for (let i = 0; i < MAX_SPARKS; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        posAttr.setXYZ(i, 0, -10, 0);
        continue;
      }

      anyActive = true;
      s.life += dt;
      if (s.life >= s.maxLife) {
        s.active = false;
        posAttr.setXYZ(i, 0, -10, 0);
        continue;
      }

      s.vel.y -= 9.8 * dt; // gravity
      s.pos.addScaledVector(s.vel, dt);
      if (s.pos.y < 0.04) {
        s.pos.y = 0.04;
        s.vel.y = -s.vel.y * 0.45; // bounce
      }

      const alpha = 1 - s.life / s.maxLife;
      posAttr.setXYZ(i, s.pos.x, s.pos.y, s.pos.z);
      colAttr.setXYZ(i, s.color.r * alpha, s.color.g * alpha, s.color.b * alpha);
    }

    if (anyActive) {
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }
  }

  /* ------------------------------- pucks -------------------------------- */

  private spawnPucks(): void {
    const geo = this.track(new THREE.CylinderGeometry(PUCK_R, PUCK_R, PUCK_H, 32));
    const ringGeo = this.track(new THREE.CylinderGeometry(PUCK_R * 0.72, PUCK_R * 0.72, PUCK_H + 0.006, 24));

    // Player 1: Arctic White base with glowing Cyan neon core
    const whiteMat = this.track(new THREE.MeshStandardMaterial({ color: 0xf5f7fb, roughness: 0.25, metalness: 0.35 }));
    const cyanCoreMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00d0ff,
        emissiveIntensity: 1.1,
        roughness: 0.2,
      }),
    );

    // Player 2: Midnight Obsidian base with glowing Hot Pink/Magenta neon core
    const blackMat = this.track(new THREE.MeshStandardMaterial({ color: 0x10121a, roughness: 0.25, metalness: 0.6 }));
    const magentaCoreMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xff007f,
        emissiveIntensity: 1.1,
        roughness: 0.2,
      }),
    );

    for (const side of [1, -1] as Side[]) {
      for (let i = 0; i < this.opts.pucksPerSide; i++) {
        const group = new THREE.Group();

        const baseMesh = new THREE.Mesh(geo, side === 1 ? whiteMat : blackMat);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        group.add(baseMesh);

        // Neon Glow Ring on top of the puck
        const glowRing = new THREE.Mesh(ringGeo, side === 1 ? cyanCoreMat : magentaCoreMat);
        group.add(glowRing);

        this.scene.add(group);
        this.pucks.push({
          group,
          baseMesh,
          glowRing,
          owner: side,
          pos: new THREE.Vector2(),
          lastPos: new THREE.Vector2(),
          vel: new THREE.Vector2(),
          held: false,
          scale: 1,
        });
      }
    }
    this.scatterPucks();
    this.syncMeshes();
  }

  /** Random non-overlapping layout */
  private scatterPucks(): void {
    const placed: THREE.Vector2[] = [];
    for (const p of this.pucks) {
      let tries = 0;
      const candidate = new THREE.Vector2();
      do {
        candidate.set(rand(-BOARD_W / 2 + 0.7, BOARD_W / 2 - 0.7), p.owner * rand(0.9, 3.7));
        tries++;
      } while (tries < 60 && placed.some((q) => q.distanceTo(candidate) < PUCK_R * 2.3));
      p.pos.copy(candidate);
      p.lastPos.copy(candidate);
      p.vel.set(0, 0);
      p.held = false;
      placed.push(candidate.clone());
    }
  }

  private syncMeshes(): void {
    for (const p of this.pucks) {
      p.group.position.set(p.pos.x, (PUCK_H / 2) * p.scale + 0.004, p.pos.y);
      p.group.scale.setScalar(Math.max(0.0001, p.scale));
    }
  }

  /* ------------------------------ physics ------------------------------- */

  private stepPhysics(dt: number): void {
    const limX = BOARD_W / 2 - PUCK_R;
    const limZ = BOARD_L / 2 - PUCK_R;

    for (const p of this.pucks) {
      if (p.held) continue;
      p.lastPos.copy(p.pos);
      p.pos.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(Math.exp(-FRICTION * dt));
      if (p.vel.lengthSq() < 0.0016) p.vel.set(0, 0);

      // outer walls with spark burst on fast bounce
      if (p.pos.x < -limX) {
        p.pos.x = -limX;
        if (Math.abs(p.vel.x) > 4.5) this.emitSparks(-limX, 0.1, p.pos.y, 4, p.owner === 1 ? 0x00f0ff : 0xff007f);
        p.vel.x = Math.abs(p.vel.x) * WALL_BOUNCE;
      }
      if (p.pos.x > limX) {
        p.pos.x = limX;
        if (Math.abs(p.vel.x) > 4.5) this.emitSparks(limX, 0.1, p.pos.y, 4, p.owner === 1 ? 0x00f0ff : 0xff007f);
        p.vel.x = -Math.abs(p.vel.x) * WALL_BOUNCE;
      }
      if (p.pos.y < -limZ) {
        p.pos.y = -limZ;
        p.vel.y = Math.abs(p.vel.y) * WALL_BOUNCE;
      }
      if (p.pos.y > limZ) {
        p.pos.y = limZ;
        p.vel.y = -Math.abs(p.vel.y) * WALL_BOUNCE;
      }

      // center divider (solid except for the gate)
      const half = PUCK_R + DIVIDER_T / 2;
      if (Math.abs(p.pos.x) > GATE_W / 2 && Math.abs(p.pos.y) < half) {
        const s = p.pos.y >= 0 ? 1 : -1;
        p.pos.y = s * half;
        p.vel.y = s * Math.abs(p.vel.y) * WALL_BOUNCE;
        if (Math.abs(p.vel.y) > 3.0) {
          this.emitSparks(p.pos.x, 0.15, p.pos.y, 5, 0xffd700);
        }
      }

      // Check Gate Crossing Flash (puck sailed through center slot)
      if (
        Math.abs(p.pos.x) < GATE_W / 2 &&
        Math.sign(p.pos.y) !== Math.sign(p.lastPos.y) &&
        p.lastPos.y !== 0
      ) {
        this.gateLight.intensity = 24;
        this.gateLight.color.setHex(p.owner === 1 ? 0x00f0ff : 0xff007f);
        this.emitSparks(p.pos.x, 0.18, 0, 10, p.owner === 1 ? 0x00f0ff : 0xff007f, 1.4);
      }
    }

    // puck <-> puck collisions using pre-allocated _diff vector to avoid GC
    const n = this.pucks.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = this.pucks[i];
        const b = this.pucks[j];
        if (a.held && b.held) continue;

        this._diff.subVectors(b.pos, a.pos);
        const dist = this._diff.length();
        const min = PUCK_R * 2;
        if (dist >= min || dist === 0) continue;

        this._diff.divideScalar(dist); // unit collision normal a -> b
        const overlap = min - dist;

        if (a.held) {
          b.pos.addScaledVector(this._diff, overlap);
          const vn = b.vel.dot(this._diff);
          if (vn < 0) b.vel.addScaledVector(this._diff, -(1 + PUCK_BOUNCE) * vn);
        } else if (b.held) {
          a.pos.addScaledVector(this._diff, -overlap);
          const vn = a.vel.dot(this._diff);
          if (vn > 0) a.vel.addScaledVector(this._diff, -(1 + PUCK_BOUNCE) * vn);
        } else {
          a.pos.addScaledVector(this._diff, -overlap / 2);
          b.pos.addScaledVector(this._diff, overlap / 2);
          const rel = b.vel.dot(this._diff) - a.vel.dot(this._diff);
          if (rel < 0) {
            const imp = (-(1 + PUCK_BOUNCE) * rel) / 2;
            a.vel.addScaledVector(this._diff, -imp);
            b.vel.addScaledVector(this._diff, imp);

            // Emit collision sparks on hard hits
            if (-rel > 3.5) {
              const cx = (a.pos.x + b.pos.x) / 2;
              const cz = (a.pos.y + b.pos.y) / 2;
              this.emitSparks(cx, 0.12, cz, 6, -rel > 6.0 ? 0xffffff : 0x00f0ff);
            }
          }
        }
      }
    }
  }

  /* ------------------------------ game AI ------------------------------- */

  private pickPuck(side: Side): Puck | null {
    const pool = this.pucks.filter(
      (p) => p.owner === side && Math.sign(p.pos.y) === side && p.vel.lengthSq() < 0.09 && p.scale > 0.99,
    );
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  private remaining(side: Side): number {
    return this.pucks.filter((p) => p.owner === side && Math.sign(p.pos.y) === side).length;
  }

  private updateGame(dt: number): void {
    // Fade out gate light flash
    if (this.gateLight.intensity > 0.1) {
      this.gateLight.intensity = Math.max(0, this.gateLight.intensity - dt * 38);
    }

    switch (this.phase) {
      case 'wait': {
        this.timer -= dt;
        if (this.timer > 0) return;

        if (this.remaining(this.shooter) === 0) {
          if (this.remaining((-this.shooter) as Side) === 0) {
            this.phase = 'resetOut';
            this.resetT = 0;
            return;
          }
          this.shooter = (-this.shooter) as Side;
        }

        const puck = this.pickPuck(this.shooter);
        if (!puck) {
          this.timer = 0.3;
          return;
        }
        this.active = puck;
        puck.held = true;
        puck.vel.set(0, 0);
        this.aimT = 0;
        this.aimStart.copy(puck.pos);
        const rx = rand(-1.6, 1.6);
        this.aimRest.set(rx, this.shooter * ANCHOR_Z);
        this.aimPull.set(rx, this.shooter * (ANCHOR_Z + PULL_DIST));
        this.aimTarget.set(rand(-0.28, 0.28), 0);
        this.aimSpeed = rand(8.5, 11.2);
        this.phase = 'aim';
        return;
      }

      case 'aim': {
        const p = this.active;
        if (!p) {
          this.phase = 'wait';
          return;
        }
        this.aimT += dt;
        const move = clamp(this.aimT / 0.5, 0, 1);
        const pull = clamp((this.aimT - 0.5) / 0.55, 0, 1);

        if (pull <= 0) {
          p.pos.lerpVectors(this.aimStart, this.aimRest, easeInOut(move));
        } else {
          p.pos.lerpVectors(this.aimRest, this.aimPull, easeInOut(pull));
        }

        // Elastic band (V shape from rails to puck with tension glow)
        if (move >= 1) {
          const attr = this.band.geometry.getAttribute('position') as THREE.BufferAttribute;
          attr.setXYZ(0, -BOARD_W / 2 + 0.04, 0.07, this.shooter * ANCHOR_Z);
          attr.setXYZ(1, p.pos.x, 0.07, p.pos.y);
          attr.setXYZ(2, BOARD_W / 2 - 0.04, 0.07, this.shooter * ANCHOR_Z);
          attr.needsUpdate = true;

          // Tension color shift: base neon to bright hot energy
          if (this.shooter === 1) {
            this._tempColor.setHex(0x00f0ff).lerp(new THREE.Color(0xffffff), pull * 0.7);
          } else {
            this._tempColor.setHex(0xff007f).lerp(new THREE.Color(0xffaa00), pull * 0.7);
          }
          this.bandMaterial.color.copy(this._tempColor);
          this.band.visible = true;
        }

        if (this.aimT >= 1.08) {
          // Release & sling!
          this.band.visible = false;
          this._shootDir.subVectors(this.aimTarget, p.pos).normalize();
          p.vel.copy(this._shootDir).multiplyScalar(this.aimSpeed);
          p.held = false;

          // Release spark burst at elastic release point
          this.emitSparks(p.pos.x, 0.1, p.pos.y, 6, this.shooter === 1 ? 0x00f0ff : 0xff007f, 1.2);

          this.active = null;
          this.shooter = (-this.shooter) as Side;
          this.timer = this.opts.turnDelay + rand(0, 0.45);
          this.phase = 'wait';
        }
        return;
      }

      case 'resetOut': {
        this.resetT += dt;
        const k = clamp(this.resetT / 0.6, 0, 1);
        for (const p of this.pucks) p.scale = 1 - easeInOut(k);
        if (k >= 1) {
          this.scatterPucks();
          this.phase = 'resetIn';
          this.resetT = 0;
        }
        return;
      }

      case 'resetIn': {
        this.resetT += dt;
        const k = clamp(this.resetT / 0.6, 0, 1);
        for (const p of this.pucks) p.scale = easeInOut(k);
        if (k >= 1) {
          this.phase = 'wait';
          this.timer = 1;
        }
        return;
      }
    }
  }

  /* ------------------------------ rendering ----------------------------- */

  private loop = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.elapsed += dt;

    // fixed 4 sub-steps prevent tunneling through divider and other pucks
    const steps = 4;
    const subDt = dt / steps;
    for (let i = 0; i < steps; i++) this.stepPhysics(subDt);

    this.updateGame(dt);
    this.syncMeshes();

    this.updateCamera(dt);
    this.updateParticles(dt);
    this.updateSparks(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateCamera(dt: number): void {
    const sway = this.reducedMotion ? 0 : 1;

    // Smoothly blend mouse pointer + mobile gyroscope tilt
    const targetX = this.pointer.x * 0.7 + this.gyro.x * 0.8;
    const targetY = this.pointer.y * 0.7 + this.gyro.y * 0.8;
    this.pointerSmooth.x = THREE.MathUtils.lerp(this.pointerSmooth.x, targetX, 1 - Math.exp(-4 * dt));
    this.pointerSmooth.y = THREE.MathUtils.lerp(this.pointerSmooth.y, targetY, 1 - Math.exp(-4 * dt));

    const t = this.elapsed;
    const yaw = Math.sin(t * 0.12) * 0.10 * sway + this.pointerSmooth.x * 0.14;
    const pitch = 0.90 + Math.sin(t * 0.10) * 0.04 * sway - this.pointerSmooth.y * 0.06;

    this._camDir.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    );
    this.camera.position.copy(this.camTarget).addScaledVector(this._camDir, this.camDist);
    this.camera.lookAt(this.camTarget);
  }

  private updateParticles(dt: number): void {
    if (this.reducedMotion) return;
    const attr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = attr.count;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + dt * 0.12;
      if (y > 9) y = 0.5;
      attr.setY(i, y);
      attr.setX(i, attr.getX(i) + Math.sin(this.elapsed * 0.3 + i) * dt * 0.04);
    }
    attr.needsUpdate = true;
  }

  /* ------------------------------- events ------------------------------- */

  private resize = (): void => {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;

    // Zoom in tightly so the Sling Puck board fills the entire background view
    const aspect = clamp(w / h, 0.4, 2);
    this.camDist = aspect >= 1.2 ? 5.8 : 5.8 + (1.2 - aspect) * 3.2;
    this.camera.updateProjectionMatrix();
    if (!this.running) this.renderer.render(this.scene, this.camera);
  };

  private onPointerMove = (e: PointerEvent): void => {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private onDeviceOrientation = (e: DeviceOrientationEvent): void => {
    if (e.gamma === null || e.beta === null) return;
    // gamma is left-to-right [-90, 90], beta is front-to-back [-180, 180]
    const gx = clamp(e.gamma / 32, -1, 1);
    const gy = clamp((e.beta - 45) / 32, -1, 1);
    this.gyro.set(gx, gy);
  };

  /** User Tap / Click to sling or fling nearby puck */
  private onPointerDown = (e: PointerEvent): void => {
    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.rayHit);
    if (!hit) return;

    // Check if clicked near any resting puck
    let closestPuck: Puck | null = null;
    let closestDist = 1.6;

    for (const p of this.pucks) {
      if (p.held) continue;
      const d = Math.hypot(p.pos.x - hit.x, p.pos.y - hit.z);
      if (d < closestDist) {
        closestDist = d;
        closestPuck = p;
      }
    }

    if (closestPuck) {
      // Fling towards center gate
      const target = new THREE.Vector2(rand(-0.2, 0.2), 0);
      const impulseDir = target.clone().sub(closestPuck.pos).normalize();
      const speed = rand(8.5, 11.5);
      closestPuck.vel.copy(impulseDir).multiplyScalar(speed);
      this.emitSparks(
        closestPuck.pos.x,
        0.12,
        closestPuck.pos.y,
        8,
        closestPuck.owner === 1 ? 0x00f0ff : 0xff007f,
        1.3,
      );
    }
  };

  private onVisibility = (): void => {
    if (document.hidden) this.stop();
    else if (this.opts.autoStart) this.start();
  };
}

/** Convenience factory */
export function createSlingPuckBackground(
  container: HTMLElement,
  options?: SlingPuckOptions,
): SlingPuckBackground {
  return new SlingPuckBackground(container, options);
}
