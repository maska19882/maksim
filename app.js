import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('scene');
const distanceLabel = document.getElementById('distanceLabel');
const lodLabel = document.getElementById('lodLabel');
const focusLabel = document.getElementById('focusLabel');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const locationList = document.getElementById('locationList');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050912, 0.0026);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 1000);
camera.position.set(0, 0.3, 70);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1.01;
controls.maxDistance = 180;
controls.target.set(0, 0, 0);
controls.enablePan = true;
controls.panSpeed = 0.65;
controls.zoomSpeed = 0.8;

const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 2000; i += 1) {
  const r = 160 + Math.random() * 420;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starVertices.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xe9f1ff, size: 1.2, sizeAttenuation: true })));

const light = new THREE.DirectionalLight(0xffffff, 1.6);
light.position.set(5, 2, 5);
scene.add(light, new THREE.AmbientLight(0x8ca8ff, 0.38));

const earth = new THREE.Group();
scene.add(earth);

const loader = new THREE.TextureLoader();
const earthMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 96, 96),
  new THREE.MeshPhongMaterial({
    map: loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'),
    bumpMap: loader.load('https://threejs.org/examples/textures/planets/earth_bump_2048.jpg'),
    specularMap: loader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg'),
    bumpScale: 0.035,
    specular: 0x202020,
  }),
);
const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(1.01, 64, 64),
  new THREE.MeshPhongMaterial({ map: loader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png'), transparent: true, opacity: 0.35, depthWrite: false }),
);
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 64), new THREE.MeshBasicMaterial({ color: 0x66b8ff, transparent: true, opacity: 0.08, side: THREE.BackSide }));
earth.add(earthMesh, clouds, atmosphere);

const lodContainer = { orbital: new THREE.Group(), regional: new THREE.Group(), surface: new THREE.Group() };
scene.add(lodContainer.orbital, lodContainer.regional, lodContainer.surface);

const categories = [
  { name: 'human', color: 0xffe08a },
  { name: 'animal', color: 0xffa7d6 },
  { name: 'plant', color: 0x88ef9c },
  { name: 'city', color: 0xffd26f },
  { name: 'geology', color: 0x9aa7bf },
];

function addRandomPoints(group, count, scale, sizeRange) {
  categories.forEach((cat, idx) => {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const r = scale + Math.random() * 0.02;
      points.push(r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), r * Math.cos(b));
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: cat.color, size: sizeRange[0] + idx * sizeRange[1], transparent: true, opacity: 0.85 })));
  });
}

addRandomPoints(lodContainer.orbital, 500, 1.1, [0.012, 0.002]);
addRandomPoints(lodContainer.regional, 2400, 1.015, [0.007, 0.0012]);
addRandomPoints(lodContainer.surface, 7200, 1.0025, [0.0035, 0.0005]);

const locations = [
  { name: 'Москва', lat: 55.7558, lon: 37.6173 },
  { name: 'Санкт-Петербург', lat: 59.9343, lon: 30.3351 },
  { name: 'Новосибирск', lat: 55.0084, lon: 82.9357 },
  { name: 'Tokyo', lat: 35.6764, lon: 139.6500 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Amazon Rainforest', lat: -3.4653, lon: -62.2159 },
  { name: 'Sahara', lat: 23.4162, lon: 25.6628 },
  { name: 'Baikal', lat: 53.5587, lon: 108.1650 },
  { name: 'Everest', lat: 27.9881, lon: 86.9250 },
];

function latLonToVector(lat, lon, radius = 1.02) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

const markers = new THREE.Group();
locations.forEach((loc) => {
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  marker.position.copy(latLonToVector(loc.lat, loc.lon));
  marker.userData = loc;
  markers.add(marker);

  const option = document.createElement('option');
  option.value = loc.name;
  locationList.appendChild(option);
});
scene.add(markers);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function focusOnVector(surfacePoint, labelText = 'регион') {
  const dir = surfacePoint.clone().normalize();
  controls.target.copy(dir);
  camera.position.copy(dir.clone().multiplyScalar(Math.max(1.04, camera.position.distanceTo(controls.target))));
  focusLabel.textContent = `Фокус: ${labelText}`;
}

function focusOnLocation(name) {
  const loc = locations.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (!loc) {
    focusLabel.textContent = `Фокус: место «${name}» не найдено`;
    return;
  }
  focusOnVector(latLonToVector(loc.lat, loc.lon, 1), loc.name);
}

function handlePick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(earthMesh);
  if (!intersects.length) return;
  const p = intersects[0].point.clone().normalize();
  const lat = Math.round(Math.asin(p.y) * 57.2958);
  const lon = Math.round(Math.atan2(p.x, p.z) * 57.2958);
  focusOnVector(p, `широта ${lat}°, долгота ${lon}°`);
}
window.addEventListener('pointerdown', (event) => { if (event.button === 0) handlePick(event); });

searchButton.addEventListener('click', () => focusOnLocation(searchInput.value.trim()));
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') focusOnLocation(searchInput.value.trim()); });

const panStep = 0.15;
const zoomFactor = 0.92;
function doAction(action) {
  switch (action) {
    case 'zoomIn':
      camera.position.sub(controls.target).multiplyScalar(zoomFactor).add(controls.target);
      break;
    case 'zoomOut':
      camera.position.sub(controls.target).multiplyScalar(1 / zoomFactor).add(controls.target);
      break;
    case 'panUp': controls.target.y += panStep; camera.position.y += panStep; break;
    case 'panDown': controls.target.y -= panStep; camera.position.y -= panStep; break;
    case 'panLeft': controls.target.x -= panStep; camera.position.x -= panStep; break;
    case 'panRight': controls.target.x += panStep; camera.position.x += panStep; break;
    case 'reset': controls.target.set(0, 0, 0); camera.position.set(0, 0.3, 70); focusLabel.textContent = 'Фокус: планета целиком'; break;
    default:
  }
}

document.querySelectorAll('[data-action]').forEach((btn) => btn.addEventListener('click', () => doAction(btn.dataset.action)));
window.addEventListener('keydown', (e) => {
  const map = { w: 'panUp', s: 'panDown', a: 'panLeft', d: 'panRight', '+': 'zoomIn', '=': 'zoomIn', '-': 'zoomOut', r: 'reset' };
  const action = map[e.key.toLowerCase()];
  if (action) doAction(action);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function toDistanceKm() {
  const d = camera.position.distanceTo(controls.target);
  return Math.max(0, d - 1) * 6371;
}

function formatDistance(km) {
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(2)} млн км`;
  if (km >= 1000) return `${(km / 1000).toFixed(1)} тыс. км`;
  if (km >= 1) return `${km.toFixed(1)} км`;
  return `${Math.max(1, km * 1000).toFixed(0)} м`;
}

function lodByDistance(km) {
  if (km > 10000) return 'Космический обзор';
  if (km > 100) return 'Региональный обзор';
  return 'Поверхность (до ~1 м)';
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  earth.rotation.y += 0.00045;
  clouds.rotation.y += 0.0007;

  const km = toDistanceKm();
  distanceLabel.textContent = formatDistance(km);
  const lodName = lodByDistance(km);
  lodLabel.textContent = lodName;

  lodContainer.orbital.visible = lodName === 'Космический обзор';
  lodContainer.regional.visible = lodName === 'Региональный обзор';
  lodContainer.surface.visible = lodName === 'Поверхность (до ~1 м)';

  renderer.render(scene, camera);
}
animate();
