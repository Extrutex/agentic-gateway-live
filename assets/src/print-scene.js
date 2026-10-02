// 3D scene of the home page: a gantry printer building a part layer by layer.
//
// Source of /assets/print-scene.js. The site has no build step; this one file
// is bundled by hand when it changes (three.js is tree-shaken into the bundle,
// nothing is loaded from a CDN):
//
//   npx esbuild assets/src/print-scene.js --bundle --minify --format=esm \
//     --target=es2020 --outfile=assets/print-scene.js
//
// The scene is decoration. The page works without it: it is loaded when the
// browser is idle, never without WebGL, renders a single still frame when the
// visitor prefers reduced motion, stops when it is off screen or the tab is
// hidden, and can be paused.

import {
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Shape,
  ShadowMaterial,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";

const INK = 0x191613;
const INK_SOFT = 0x3e3931;
const PAPER_DEEP = 0xe6dfd2;
const ACCENT = 0x3b5bfd;
const NOZZLE = 0xd8a04a;

// Millimetres, roughly a 350 mm machine.
const FRAME = 420;
const FRAME_HEIGHT = 440;
const PROFILE = 14;
const BED = 350;
const BED_TOP = 60;
const LAYER_HEIGHT = 2.8; // exaggerated so single layers read at this size
const LAYERS = 58;
const SECONDS_PER_PRINT = 26;
const HOLD_SECONDS = 4;

function profileShape() {
  // A bracket: rounded plate with a slot and a round hole.
  const shape = new Shape();
  const w = 230;
  const d = 150;
  const r = 26;
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);

  const hole = new Path();
  hole.absarc(60, 0, 32, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const slot = new Path();
  slot.moveTo(-80, -20);
  slot.lineTo(-26, -20);
  slot.absarc(-26, 0, 20, -Math.PI / 2, Math.PI / 2, false);
  slot.lineTo(-80, 20);
  slot.absarc(-80, 0, 20, Math.PI / 2, (Math.PI * 3) / 2, false);
  shape.holes.push(slot);
  return shape;
}

/** Scale of a layer: the part narrows towards the top so the silhouette is not a plain block. */
function layerScale(index) {
  const t = index / (LAYERS - 1);
  if (t < 0.3) return 1;
  return 1 - 0.3 * Math.min(1, (t - 0.3) / 0.45);
}

function box(w, h, d, material) {
  return new Mesh(new BoxGeometry(w, h, d), material);
}

function buildFrame(materials) {
  const group = new Group();
  const half = FRAME / 2 - PROFILE / 2;
  for (const [x, z] of [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ]) {
    const post = box(PROFILE, FRAME_HEIGHT, PROFILE, materials.frame);
    post.position.set(x, FRAME_HEIGHT / 2, z);
    group.add(post);
  }
  for (const y of [PROFILE / 2, FRAME_HEIGHT - PROFILE / 2]) {
    for (const z of [-half, half]) {
      const beam = box(FRAME, PROFILE, PROFILE, materials.frame);
      beam.position.set(0, y, z);
      group.add(beam);
    }
    for (const x of [-half, half]) {
      const beam = box(PROFILE, PROFILE, FRAME, materials.frame);
      beam.position.set(x, y, 0);
      group.add(beam);
    }
  }
  const bed = box(BED, 8, BED, materials.bed);
  bed.position.set(0, BED_TOP - 4, 0);
  bed.receiveShadow = true;
  group.add(bed);
  const base = box(FRAME - PROFILE * 2, 4, FRAME - PROFILE * 2, materials.base);
  base.position.set(0, PROFILE, 0);
  group.add(base);
  return group;
}

function buildGantry(materials) {
  // Rises with the print, as on a machine with a fixed bed.
  const gantry = new Group();
  const half = FRAME / 2 - PROFILE / 2;
  for (const x of [-half, half]) {
    const rail = box(PROFILE, PROFILE, FRAME - PROFILE * 2, materials.frame);
    rail.position.set(x, 0, 0);
    gantry.add(rail);
  }
  const beam = new Group();
  const bar = box(FRAME - PROFILE * 2, 10, 14, materials.rail);
  beam.add(bar);

  const head = new Group();
  const carriage = box(54, 60, 50, materials.head);
  carriage.position.y = -8;
  head.add(carriage);
  const accent = box(54.6, 10, 50.6, materials.accent);
  accent.position.y = 4;
  head.add(accent);
  const nozzle = new Mesh(new CylinderGeometry(1.2, 6, 14, 20), materials.nozzle);
  nozzle.position.y = -45;
  head.add(nozzle);
  beam.add(head);
  gantry.add(beam);
  return { gantry, beam, head };
}

/** Points along the outer contour, used as the tool path of every layer. */
function contour(shape, scale) {
  return shape.getPoints(24).map((p) => new Vector2(p.x * scale, p.y * scale));
}

export function mountPrintScene(canvas, options = {}) {
  const reducedMotion = Boolean(options.reducedMotion);
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 10, 4000);

  const materials = {
    frame: new MeshStandardMaterial({ color: INK, roughness: 0.5, metalness: 0.25 }),
    rail: new MeshStandardMaterial({ color: INK_SOFT, roughness: 0.4, metalness: 0.5 }),
    bed: new MeshStandardMaterial({ color: 0x2a2622, roughness: 0.85, metalness: 0.1 }),
    base: new MeshStandardMaterial({ color: PAPER_DEEP, roughness: 0.9 }),
    head: new MeshStandardMaterial({ color: INK, roughness: 0.45, metalness: 0.2 }),
    accent: new MeshStandardMaterial({ color: ACCENT, roughness: 0.4, emissive: new Color(ACCENT), emissiveIntensity: 0.25 }),
    nozzle: new MeshStandardMaterial({ color: NOZZLE, roughness: 0.3, metalness: 0.8 }),
    part: new MeshStandardMaterial({ color: ACCENT, roughness: 0.62, metalness: 0.02 }),
  };

  const machine = new Group();
  machine.add(buildFrame(materials));
  const { gantry, beam, head } = buildGantry(materials);
  machine.add(gantry);

  // The part: one thin extrusion per layer, revealed by the instance count.
  const shape = profileShape();
  const layerGeometry = new ExtrudeGeometry(shape, {
    depth: LAYER_HEIGHT * 0.86,
    bevelEnabled: true,
    bevelThickness: LAYER_HEIGHT * 0.07,
    bevelSize: 0.5,
    bevelSegments: 1,
    curveSegments: 20,
  });
  layerGeometry.rotateX(-Math.PI / 2); // extrusion axis becomes +Y
  const part = new InstancedMesh(layerGeometry, materials.part, LAYERS);
  part.castShadow = true;
  part.receiveShadow = true;
  const matrix = new Matrix4();
  for (let i = 0; i < LAYERS; i += 1) {
    const s = layerScale(i);
    matrix.makeScale(s, 1, s);
    matrix.setPosition(0, BED_TOP + i * LAYER_HEIGHT, 0);
    part.setMatrixAt(i, matrix);
  }
  part.count = 0;
  machine.add(part);

  const shadowCatcher = new Mesh(new PlaneGeometry(2400, 2400), new ShadowMaterial({ opacity: 0.16 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);
  scene.add(machine);

  scene.add(new AmbientLight(0xffffff, 1.5));
  const key = new DirectionalLight(0xffffff, 2.4);
  key.position.set(380, 760, 420);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -420;
  key.shadow.camera.right = 420;
  key.shadow.camera.top = 520;
  key.shadow.camera.bottom = -420;
  key.shadow.camera.near = 100;
  key.shadow.camera.far = 1800;
  scene.add(key);
  const fill = new DirectionalLight(0xdfe6ff, 0.9);
  fill.position.set(-460, 300, -260);
  scene.add(fill);

  const paths = Array.from({ length: LAYERS }, (_, i) => contour(shape, layerScale(i)));

  function setProgress(progress) {
    const exact = Math.min(LAYERS, Math.max(0, progress) * LAYERS);
    const layer = Math.min(LAYERS - 1, Math.floor(exact));
    part.count = Math.min(LAYERS, Math.ceil(exact));
    const top = BED_TOP + (layer + 1) * LAYER_HEIGHT;
    gantry.position.y = top + 59;
    // The head follows the contour of the layer being printed.
    const path = paths[layer];
    const along = (exact - Math.floor(exact)) * path.length;
    const a = path[Math.floor(along) % path.length];
    const b = path[(Math.floor(along) + 1) % path.length];
    const f = along - Math.floor(along);
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    head.position.x = x;
    beam.position.z = -y; // shape Y maps to -Z after the rotation
  }

  let orbit = 0;
  function placeCamera() {
    const angle = 0.62 + orbit;
    const radius = 1240;
    camera.position.set(Math.sin(angle) * radius, 520, Math.cos(angle) * radius);
    camera.lookAt(0, 200, 0);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }

  let running = false;
  let visible = true;
  let userPaused = false;
  let elapsed = 0;
  let last = 0;
  let frame = 0;

  function draw() {
    const cycle = SECONDS_PER_PRINT + HOLD_SECONDS;
    const t = elapsed % cycle;
    setProgress(Math.min(1, t / SECONDS_PER_PRINT));
    placeCamera();
    renderer.render(scene, camera);
  }

  function tick(now) {
    frame = 0;
    if (!running) return;
    const delta = Math.min(0.1, (now - last) / 1000);
    last = now;
    elapsed += delta;
    // A slow sway instead of a full orbit: the open front stays towards the viewer.
    orbit = Math.sin(elapsed * 0.12) * 0.42;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function update() {
    const shouldRun = visible && !userPaused && !reducedMotion && !document.hidden;
    if (shouldRun && !running) {
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!shouldRun && running) {
      running = false;
      if (frame) cancelAnimationFrame(frame);
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!running) draw();
  });
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    update();
  });
  visibilityObserver.observe(canvas);
  document.addEventListener("visibilitychange", update);

  resize();
  // A still frame first (and the only one with reduced motion): the part two thirds done.
  elapsed = SECONDS_PER_PRINT * 0.66;
  draw();
  update();

  return {
    setPaused(paused) {
      userPaused = Boolean(paused);
      update();
    },
    dispose() {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", update);
      renderer.dispose();
    },
  };
}
