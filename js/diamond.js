// A round brilliant-cut gemstone built from code with Three.js.
// No model file: the facets are calculated from a handful of rings of points.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const stage = document.getElementById('stage');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Renderer, scene, camera ----------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (err) {
  document.getElementById('fallback').style.display = 'grid';
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 1.6, 5.4);

// Soft studio reflections: the "room" the stone reflects.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

// A few coloured lights add flashes of "fire" as the stone turns.
const lights = [
  [0xffffff, 40, [3, 4, 3]],
  [0x8fb4ff, 25, [-4, 2, 1]],
  [0xffc89a, 25, [2, -1, -4]],
];
lights.forEach(([color, intensity, [x, y, z]]) => {
  const l = new THREE.PointLight(color, intensity, 20);
  l.position.set(x, y, z);
  scene.add(l);
});

// ---------- The gem geometry ----------
function buildBrilliantCut() {
  const deg = Math.PI / 180;
  const ring = (count, radius, y, offset = 0) =>
    Array.from({ length: count }, (_, k) => {
      const a = (k * 360 / count + offset) * deg;
      return new THREE.Vector3(radius * Math.cos(a), y, radius * Math.sin(a));
    });

  const table = ring(8, 0.55, 0.36);          // flat top edge
  const star = ring(8, 0.80, 0.22, 22.5);     // crown star points
  const girdleTop = ring(16, 1, 0.02);        // widest edge, top
  const girdleBottom = ring(16, 1, -0.02);    // widest edge, bottom
  const pavilion = ring(8, 0.42, -0.48);      // lower facet points
  const tableCentre = new THREE.Vector3(0, 0.36, 0);
  const culet = new THREE.Vector3(0, -0.86, 0); // bottom tip

  const positions = [];
  const centre = new THREE.Vector3(0, -0.1, 0);
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3(), mid = new THREE.Vector3();

  // Add a triangle, flipping it if needed so it faces outward.
  const tri = (a, b, c) => {
    n.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    mid.copy(a).add(b).add(c).divideScalar(3).sub(centre);
    if (n.dot(mid) < 0) [b, c] = [c, b];
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const m8 = (i) => (i + 8) % 8;
  const m16 = (i) => (i + 16) % 16;

  for (let k = 0; k < 8; k++) {
    // Crown
    tri(tableCentre, table[k], table[m8(k + 1)]);                 // table
    tri(table[k], table[m8(k + 1)], star[k]);                      // star facets
    tri(table[k], star[m8(k - 1)], girdleTop[m16(2 * k)]);         // kite (bezel) facets
    tri(table[k], girdleTop[m16(2 * k)], star[k]);
    tri(star[k], girdleTop[m16(2 * k)], girdleTop[m16(2 * k + 1)]); // upper girdle facets
    tri(star[k], girdleTop[m16(2 * k + 1)], girdleTop[m16(2 * k + 2)]);
    // Pavilion
    tri(girdleBottom[m16(2 * k - 1)], girdleBottom[m16(2 * k)], pavilion[k]); // lower girdle facets
    tri(girdleBottom[m16(2 * k)], girdleBottom[m16(2 * k + 1)], pavilion[k]);
    tri(pavilion[k], girdleBottom[m16(2 * k + 1)], pavilion[m8(k + 1)]);
    tri(pavilion[k], pavilion[m8(k + 1)], culet);                  // pavilion mains
  }
  // Girdle band
  for (let j = 0; j < 16; j++) {
    tri(girdleTop[j], girdleTop[m16(j + 1)], girdleBottom[m16(j + 1)]);
    tri(girdleTop[j], girdleBottom[m16(j + 1)], girdleBottom[j]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals(); // unshared vertices = crisp flat facets
  return geometry;
}

// ---------- Stones ----------
const STONES = {
  // Coloured stones are less see-through: with nothing behind the stone to refract,
  // full transparency plus a strong tint just turns dark instead of colourful.
  diamond:  { color: '#ffffff', tint: '#ffffff', distance: 10, ior: 2.42, iridescence: 0.7,  env: 2.4, transmission: 1 },
  sapphire: { color: '#2448ff', tint: '#3a5cff', distance: 3,  ior: 1.77, iridescence: 0.15, env: 0.8, transmission: 0.2 },
  emerald:  { color: '#00b45c', tint: '#1fd27a', distance: 3,  ior: 1.58, iridescence: 0.1,  env: 0.8, transmission: 0.2 },
  ruby:     { color: '#e0002e', tint: '#ff2a55', distance: 3,  ior: 1.76, iridescence: 0.15, env: 0.8, transmission: 0.2 },
};

const material = new THREE.MeshPhysicalMaterial({
  metalness: 0, roughness: 0,
  transmission: 1, thickness: 1.4,
  specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0,
  iridescenceIOR: 1.3,
  envMapIntensity: 2.4,
  flatShading: true,
});

const gem = new THREE.Mesh(buildBrilliantCut(), material);
gem.name = 'BrilliantCutGem';
const group = new THREE.Group();
group.add(gem);
group.rotation.x = 0.35;   // tip it towards the viewer so the table shows
scene.add(group);

// Smoothly blend between stones
const target = { color: new THREE.Color(), tint: new THREE.Color(), distance: 10, ior: 2.42, iridescence: 0.7, env: 2.4, transmission: 1 };
function setStone(name, instant = false) {
  const s = STONES[name];
  target.color.set(s.color);
  target.tint.set(s.tint);
  Object.assign(target, { distance: s.distance, ior: s.ior, iridescence: s.iridescence, env: s.env, transmission: s.transmission });
  if (instant) {
    material.color.copy(target.color);
    material.attenuationColor.copy(target.tint);
    Object.assign(material, { attenuationDistance: s.distance, ior: s.ior, iridescence: s.iridescence, envMapIntensity: s.env, transmission: s.transmission });
  }
}
setStone('diamond', true);

// ---------- Sparkles: little star glints on the facet corners ----------
function starTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, 'rgba(255,255,255,.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,255,255,.9)';
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(64, 4); g.lineTo(64, 124); g.moveTo(4, 64); g.lineTo(124, 64); g.stroke();
  return new THREE.CanvasTexture(c);
}

const sparkleTex = starTexture();
const corners = [];
const pos = gem.geometry.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const v = new THREE.Vector3().fromBufferAttribute(pos, i);
  if (v.y > 0 && !corners.some((c) => c.distanceTo(v) < 0.01)) corners.push(v);
}
const sparkles = Array.from({ length: 12 }, () => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sparkleTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  s.position.copy(corners[Math.floor(Math.random() * corners.length)]).multiplyScalar(1.02);
  s.userData = { phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 1.2 };
  s.scale.setScalar(0);
  group.add(s);
  return s;
});

// ---------- Soft shadow under the stone ----------
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = shadowCanvas.height = 128;
const sg = shadowCanvas.getContext('2d');
const sgrad = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
sgrad.addColorStop(0, 'rgba(0,0,0,.55)');
sgrad.addColorStop(1, 'rgba(0,0,0,0)');
sg.fillStyle = sgrad;
sg.fillRect(0, 0, 128, 128);
const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(2.6, 2.6),
  new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -1.25;
scene.add(shadow);

// ---------- Controls ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableDamping = true;
controls.autoRotate = !reduceMotion;
controls.autoRotateSpeed = 1.4;
controls.minPolarAngle = Math.PI * 0.25;
controls.maxPolarAngle = Math.PI * 0.6;

// ---------- Sizing ----------
function resize() {
  const { clientWidth: w, clientHeight: h } = stage;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Pull the camera back on narrow screens so the stone fits.
  camera.position.setLength(w / h < 0.9 ? 8.2 : 6.8);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

// ---------- Animation ----------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // Ease the material towards the chosen stone
  const k = 1 - Math.pow(0.002, dt);
  material.color.lerp(target.color, k);
  material.attenuationColor.lerp(target.tint, k);
  material.attenuationDistance += (target.distance - material.attenuationDistance) * k;
  material.ior += (target.ior - material.ior) * k;
  material.iridescence += (target.iridescence - material.iridescence) * k;
  material.envMapIntensity += (target.env - material.envMapIntensity) * k;
  material.transmission += (target.transmission - material.transmission) * k;

  if (!reduceMotion) group.position.y = Math.sin(t * 1.2) * 0.06;  // gentle float

  sparkles.forEach((s) => {
    const v = Math.max(0, Math.sin(t * s.userData.speed + s.userData.phase));
    s.scale.setScalar(Math.pow(v, 12) * 0.45);                        // brief twinkle
  });

  controls.update();
  renderer.render(scene, camera);
});

// ---------- UI ----------
document.getElementById('stones').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-stone]');
  if (!btn) return;
  document.querySelectorAll('[data-stone]').forEach((b) => b.setAttribute('aria-pressed', b === btn));
  setStone(btn.dataset.stone);
});

// Export just the gem as a reusable .glb file
document.getElementById('download').addEventListener('click', () => {
  new GLTFExporter().parse(gem, (result) => {
    const url = URL.createObjectURL(new Blob([result], { type: 'model/gltf-binary' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'gem.glb' });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, (err) => console.error(err), { binary: true });
});
