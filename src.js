import * as T from 'three';
import './style.css';

const $ = id => document.getElementById(id);
const scene = new T.Scene();
scene.background = new T.Color(0x080a10);
scene.fog = new T.FogExp2(0x080a10, .0015);
const camera = new T.PerspectiveCamera(43, 1, .1, 1800);
const renderer = new T.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
$('scene').append(renderer.domElement);
scene.add(new T.HemisphereLight(0xb6c9ff, 0x574738, 1.2));
const sun = new T.DirectionalLight(0xffecd2, 3);
sun.position.set(-65, 45, -23);
sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 160 });
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -.0004;
scene.add(sun);

let seed = 73;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const stars = new T.BufferGeometry();
const points = [];
for (let i = 0; i < 3400; i++) {
  const angle = random() * Math.PI * 2;
  const y = random() * .98;
  const r = Math.sqrt(1 - y * y) * 850;
  points.push(Math.cos(angle) * r, y * 850, Math.sin(angle) * r);
}
stars.setAttribute('position', new T.Float32BufferAttribute(points, 3));
scene.add(new T.Points(stars, new T.PointsMaterial({ color: 0xbcc9e8, size: 1.2, fog: false })));

const craters = Array.from({ length: 55 }, () => ({
  x: (random() - .5) * 950, z: (random() - .5) * 950, r: 9 + random() * 47
}));
function elevation(x, z) {
  let h = Math.sin(x * .038 + z * .022) * 4 + Math.cos(z * .053 - x * .011) * 2;
  h += Math.sin(x * .48 + z * .37) * .16 + Math.sin(x * .107 - z * .14) * .7;
  for (const c of craters) {
    const d = Math.hypot(x - c.x, z - c.z) / c.r;
    if (d < 1.45) h += c.r * (.07 * Math.exp(-((d - 1) ** 2) * 35) - .22 * Math.max(0, 1 - d * d));
  }
  return h * T.MathUtils.smoothstep(Math.hypot(x, z), 8, 26) - .18;
}
const terrain = new T.PlaneGeometry(1000, 1000, 400, 400);
terrain.rotateX(-Math.PI / 2);
const vertices = terrain.attributes.position;
const colors = [];
for (let i = 0; i < vertices.count; i++) {
  const x = vertices.getX(i), z = vertices.getZ(i);
  vertices.setY(i, elevation(x, z));
  const shade = .23 + random() * .1 + .04 * Math.sin(x * .12 + z * .07);
  colors.push(shade, shade * .96, shade * .92);
}
terrain.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
terrain.computeVertexNormals();
const ground = new T.Mesh(terrain, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
ground.receiveShadow = true;
scene.add(ground);

const material = (color, metalness = 0, roughness = .6) => new T.MeshStandardMaterial({ color, metalness, roughness });
const steel = material(0xbac1c6, .55), black = material(0x23262d), gold = material(0xba7931, .56, .42);
function mesh(parent, geometry, surface, x = 0, y = 0, z = 0) {
  const part = new T.Mesh(geometry, surface);
  part.position.set(x, y, z);
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}
const rocks = new T.InstancedMesh(new T.DodecahedronGeometry(1), material(0x5c5855), 570);
const dummy = new T.Object3D();
for (let i = 0; i < rocks.count; i++) {
  const angle = random() * Math.PI * 2, r = 8 + random() ** 1.7 * 245;
  const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
  const size = .12 + random() ** 3 * 1.65;
  dummy.position.set(x, elevation(x, z), z);
  dummy.rotation.set(random(), random() * 6, random());
  dummy.scale.set(size * 1.4, size * .65, size);
  dummy.updateMatrix();
  rocks.setMatrixAt(i, dummy.matrix);
}
rocks.receiveShadow = true;
scene.add(rocks);

const amber = new T.MeshBasicMaterial({ color: 0xffb459 });
const pad = mesh(scene, new T.CylinderGeometry(5, 5.2, .16, 64), black, 0, -.08);
const ring = mesh(scene, new T.RingGeometry(4.47, 4.56, 64), amber, 0, .012);
ring.rotation.x = -Math.PI / 2;
for (let i = 0; i < 16; i++) {
  const a = i * Math.PI / 8;
  mesh(scene, new T.BoxGeometry(.16, .1, .16), amber, Math.cos(a) * 4.8, .055, Math.sin(a) * 4.8);
}
for (const x of [-.75, .75]) mesh(scene, new T.BoxGeometry(.16, .02, 2.15), steel, x, .022);
mesh(scene, new T.BoxGeometry(1.5, .02, .16), steel, 0, .022);

const ship = new T.Group();
scene.add(ship);
mesh(ship, new T.CylinderGeometry(1.57, 1.69, .92, 8), gold, 0, 1.45);
mesh(ship, new T.CylinderGeometry(1.08, 1.28, 1.33, 6), steel, 0, 2.5);
mesh(ship, new T.BoxGeometry(1.78, .54, .88), black, 0, 2.71, .7);
const windowGlass = material(0x182d43, .35, .24);
for (const x of [-.45, .45]) mesh(ship, new T.BoxGeometry(.62, .32, .04), windowGlass, x, 2.73, 1.157);
mesh(ship, new T.CylinderGeometry(.33, .63, .56, 24), black, 0, .85);
mesh(ship, new T.CylinderGeometry(.04, .06, .87, 10), steel, -.65, 3.49, -.32);
const dish = mesh(ship, new T.SphereGeometry(.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), steel, -.65, 3.92, -.32);
dish.rotation.z = -.62;
function strut(a, b, width, surface) {
  const direction = b.clone().sub(a);
  const p = mesh(ship, new T.CylinderGeometry(width, width, direction.length(), 10), surface);
  p.position.copy(a).lerp(b, .5);
  p.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
}
for (const x of [-1, 1]) for (const z of [-1, 1]) {
  const foot = new T.Vector3(x * 1.85, .15, z * 1.33);
  strut(new T.Vector3(x * .98, 1.67, z * .87), foot, .09, steel);
  strut(new T.Vector3(x * 1.15, .99, z * .65), foot, .055, gold);
  mesh(ship, new T.CylinderGeometry(.32, .38, .15, 16), steel, foot.x, .075, foot.z);
}
const flame = mesh(ship, new T.ConeGeometry(.42, 1, 24), new T.MeshBasicMaterial({
  color: 0xff9850, transparent: true, opacity: .76, depthWrite: false
}));
flame.castShadow = false;
flame.rotation.z = Math.PI;
const glow = new T.PointLight(0xff7833, 0, 13, 2);
glow.position.y = .45;
ship.add(glow);

const keys = new Set();
const controlButtons = [...document.querySelectorAll('[data-key]')];
let audio, engine, engineFilter, muted = false;
function initAudio() {
  if (audio) {
    audio.resume();
    return;
  }
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  audio = new Audio();
  const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  engineFilter = audio.createBiquadFilter();
  engineFilter.type = 'lowpass';
  engineFilter.frequency.value = 145;
  engine = audio.createGain();
  engine.gain.value = 0;
  noise.connect(engineFilter).connect(engine).connect(audio.destination);
  noise.start();
  audio.resume();
}
function cue(success) {
  if (!audio || muted) return;
  const tone = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
  tone.type = success ? 'sine' : 'triangle';
  tone.frequency.setValueAtTime(success ? 440 : 105, t);
  tone.frequency.exponentialRampToValueAtTime(success ? 660 : 33, t + .3);
  gain.gain.setValueAtTime(.19, t);
  gain.gain.exponentialRampToValueAtTime(.001, t + .46);
  tone.connect(gain).connect(audio.destination);
  tone.start(t);
  tone.stop(t + .47);
}

const initialFuel = 560;
const gravity = 1.62;
const degrees = T.MathUtils.radToDeg;
let x, y, vx, vy, angle, fuel, mode, burning;
const target = new T.Vector3();
function reset(start = false) {
  x = -14; y = 29; vx = 2.1; vy = -2.4; angle = 0; fuel = initialFuel;
  mode = start ? 'flight' : 'ready';
  burning = false;
  keys.clear();
  $('brief').hidden = start;
  $('brief').querySelector('h1').textContent = 'First descent';
  $('report').textContent = 'Guide the lander onto the illuminated pad. Touch down below 2 m/s vertically, 1 m/s laterally, and within 10° of upright.';
  $('start').firstChild.nodeValue = 'BEGIN DESCENT ';
  camera.position.set(24, 16, 58);
}
function finish(success, reason) {
  mode = success ? 'landed' : 'crashed';
  burning = false;
  if (success) angle = 0;
  $('brief').hidden = false;
  $('brief').querySelector('h1').textContent = success ? 'Touchdown' : 'Landing failed';
  $('report').textContent = reason;
  $('start').firstChild.nodeValue = 'FLY AGAIN ';
  cue(success);
}
function step(dt) {
  const thrust = keys.has('ArrowUp') || keys.has('Space') || keys.has('KeyW');
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  angle = T.MathUtils.clamp(angle + (Number(left) - Number(right)) * 1.05 * dt, -1.22, 1.22);
  const burn = thrust ? Math.min(fuel, 13 * dt) : 0;
  burning = burn > 0;
  const acceleration = 6400 / (1180 + fuel) * (burn / (13 * dt));
  fuel -= burn;
  vx -= Math.sin(angle) * acceleration * dt;
  vy += (Math.cos(angle) * acceleration - gravity) * dt;
  x += vx * dt;
  y += vy * dt;

  const onPad = Math.abs(x) <= 2.45;
  const footDrop = Math.max(0, 1.85 * Math.abs(Math.sin(angle)) - .075);
  const surface = Math.abs(x) < 5 ? 0 : Math.max(elevation(x - 1.85, 0), elevation(x + 1.85, 0));
  if (y > surface + footDrop) return;
  y = surface + footDrop;
  const soft = Math.abs(vy) < 2 && Math.abs(vx) < 1 && Math.abs(degrees(angle)) <= 10;
  const success = onPad && soft;
  if (success) y = 0;
  finish(success, success ? 'The lander is secure on the pad. Mission complete.' :
    !onPad ? 'The landing gear touched down outside the marked zone.' :
      `Surface contact at ${Math.abs(vy).toFixed(1)} m/s vertical, ${Math.abs(vx).toFixed(1)} m/s lateral, and ${Math.abs(degrees(angle)).toFixed(0)}° tilt.`);
}
$('start').onclick = () => { initAudio(); reset(true); };
$('reset').onclick = () => { initAudio(); reset(mode !== 'ready'); };
$('sound').onclick = () => {
  muted = !muted;
  if (!muted) initAudio();
  $('sound').textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  $('sound').setAttribute('aria-pressed', String(!muted));
};
const flightKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW']);
window.addEventListener('keydown', event => {
  if (event.code === 'KeyR' && !event.repeat) $('reset').click();
  if (!flightKeys.has(event.code) || (event.code === 'Space' && event.target instanceof HTMLButtonElement && mode !== 'flight')) return;
  event.preventDefault();
  keys.add(event.code);
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
for (const button of controlButtons) {
  button.addEventListener('pointerdown', event => {
    button.setPointerCapture(event.pointerId);
    keys.add(button.dataset.key);
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(name, () => keys.delete(button.dataset.key));
  }
}
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
window.addEventListener('resize', resize);
reset();
resize();
let previous = performance.now(), accumulator = 0;
const timeStep = 1 / 120;
const cameraGoal = new T.Vector3();
renderer.setAnimationLoop(now => {
  const dt = Math.min((now - previous) / 1000, .05);
  previous = now;
  accumulator += dt;
  while (accumulator >= timeStep) {
    if (mode === 'flight') step(timeStep);
    accumulator -= timeStep;
  }
  ship.position.set(x, y, 0);
  ship.rotation.z = angle;
  flame.visible = burning;
  const plumeLength = 1.1 + Math.random() * .75;
  flame.scale.set(1, plumeLength, 1);
  flame.position.y = .57 - plumeLength / 2;
  glow.intensity = burning ? 42 + Math.random() * 18 : 0;
  if (engine) engine.gain.setTargetAtTime(burning && !muted ? .52 : 0, audio.currentTime, .065);

  const spread = Math.max(1, .85 / camera.aspect);
  cameraGoal.set(x * .48 + 15 * spread, 6 + y * .49 + 5 * spread, 24 * spread + Math.max(y * .85, Math.abs(x) * .55));
  camera.position.lerp(cameraGoal, 1 - Math.exp(-dt * 2.4));
  target.set(x * .47, Math.max(1.2, y * .48), 0);
  camera.lookAt(target);

  $('alt').textContent = Math.max(0, y - (Math.abs(x) < 5 ? 0 : elevation(x, 0))).toFixed(1);
  $('vy').textContent = vy.toFixed(1);
  $('vx').textContent = vx.toFixed(1);
  $('tilt').textContent = Math.round(-degrees(angle));
  const percent = Math.round(fuel / initialFuel * 100);
  $('fuel').textContent = percent + '%';
  $('bar').style.width = percent + '%';
  $('state').textContent = { ready: 'AWAITING DESCENT', flight: burning ? 'ENGINE FIRING' : 'DESCENT ACTIVE', landed: 'LANDED', crashed: 'SURFACE IMPACT' }[mode];
  for (const button of controlButtons) button.classList.toggle('active', keys.has(button.dataset.key));
  renderer.render(scene, camera);
});
