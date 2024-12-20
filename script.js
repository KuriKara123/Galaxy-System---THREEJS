import * as THREE from './Three_HEHE/build/three.module.js';
import { OrbitControls } from './Three_HEHE/examples/jsm/controls/OrbitControls.js';
import { TextureLoader } from './Three_HEHE/build/three.module.js';
import { GLTFLoader } from './Three_HEHE/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from './Three_HEHE/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from './Three_HEHE/examples/jsm/geometries/TextGeometry.js';


let camera, thirdPersonCamera, activeCamera, scene, renderer, controls, spaceship, spotlight, earth, satellite;

let keys = {};
const spaceshipSpeed = 1;
let currentLabel = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const colorList = [
    "#00FFFF", "#00FF00", "#FFCC00", "#E6E6FA", "#FF69B4",
    "#FF8C00", "#FFB6C1", "#00FFFF", "#87CEEB", "#A8FFB2",
    "#EE82EE", "#ADD8E6"
];

const orbitParams = {
    Mercury: { speed: 0.004, radius: 320 },
    Venus: { speed: 0.003, radius: 298 },
    Earth: { speed: 0.002, radius: 278 },
    Mars: { speed: 0.0018, radius: 248 },
    Jupiter: { speed: 0.001, radius: 203 },
    Saturn: { speed: 0.0008, radius: 138 },
    Uranus: { speed: 0.0006, radius: 98 },
    Neptune: { speed: 0.0004, radius: 58 },
    EarthSatellite: { speed: 0.002, radius: 8 }
};

const orbitalObjects = [];

function createPlanet(loader, name, size, texturePath, position, castShadow = true) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(position.x, position.y, position.z);
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.rotationSpeed = 0.01;
    material.map = loader.load(texturePath);
    planet.name = name;
    scene.add(planet);
    return planet;
}


const loader = new THREE.FontLoader();
let loadedFont = null;

loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    loadedFont = font;
});


function createPlanetWithOrbit(loader, name, size, texturePath, position, castShadow = true) {
    const planet = createPlanet(loader, name, size, texturePath, position, castShadow);
    planet.orbitData = { radius: position.x, angle: Math.random() * Math.PI * 2, speed: orbitParams[name].speed };
    orbitalObjects.push(planet);
    return planet;
}

function createRingWithOrbit(loader, texturePath, planet, sizeInner, sizeOuter) {
    const geometry = new THREE.RingGeometry(sizeInner, sizeOuter, 64);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, 
        side: THREE.DoubleSide, 
        map: loader.load(texturePath) 
    });
    const ring = new THREE.Mesh(geometry, material);

    ring.rotation.x = Math.PI / 2;
    ring.receiveShadow = true;
    ring.castShadow = false;

    planet.add(ring);

    return ring;
}


function updateOrbit() {
    orbitalObjects.forEach((object) => {
        if (object.orbitData) {
            object.orbitData.angle += object.orbitData.speed; 
            object.position.x = Math.cos(object.orbitData.angle) * object.orbitData.radius + 640; 
            object.position.z = Math.sin(object.orbitData.angle) * object.orbitData.radius + 0;
        }
    });

    if (earth && satellite) {
        const satelliteData = orbitParams.EarthSatellite;
        satelliteData.angle = (satelliteData.angle || 0) + satelliteData.speed; 
        satellite.position.x = earth.position.x + Math.cos(satelliteData.angle) * satelliteData.radius;
        satellite.position.z = earth.position.z + Math.sin(satelliteData.angle) * satelliteData.radius;
        satellite.position.y = earth.position.y; 
    }
}


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(640, 480, 240);
    camera.lookAt(640, 320, 0);

    thirdPersonCamera = new THREE.PerspectiveCamera(
        90, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        10000 
    );

    activeCamera = camera;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const loader = new TextureLoader();
    const gltfLoader = new GLTFLoader();

    const pointLight = new THREE.PointLight(0xFFFFFF, 1, 1280);
    pointLight.castShadow = true;
    pointLight.position.set(640, 320, 0);
    scene.add(pointLight);

    spotlight = new THREE.SpotLight(0xFFFFFF, 1);
    spotlight.castShadow = true;
    scene.add(spotlight);

    gltfLoader.load('./model/spaceship/scene.gltf', (gltf) => {
        spaceship = gltf.scene;
        spaceship.position.set(240, 320, 10);
        spaceship.scale.set(1,1,1);
        spaceship.castShadow = true;
        spaceship.receiveShadow = true;
        scene.add(spaceship);
    });

    createPlanetWithOrbit(loader, 'Mercury', 3.2, './textures/mercury.jpg', { x: 58, y: 320, z: 0 });
    createPlanetWithOrbit(loader, 'Venus', 4.8, './textures/venus.jpg', { x: 80, y: 320, z: 0 });
    earth = createPlanetWithOrbit(loader, 'Earth', 4.8, './textures/earth.jpg', { x: 100, y: 320, z: 0 });
    createPlanetWithOrbit(loader, 'Mars', 4, './textures/mars.jpg', { x: 130, y: 320, z: 0 });
    createPlanetWithOrbit(loader, 'Jupiter', 13, './textures/jupiter.jpg', { x: 175, y: 320, z: 0 });
    const saturn = createPlanetWithOrbit(loader, 'Saturn', 10, './textures/saturn.jpg', { x: 240, y: 320, z: 0 });
    createRingWithOrbit(loader, './textures/saturn_ring.png', saturn, 16, 32);
    const uranus = createPlanetWithOrbit(loader, 'Uranus', 8, './textures/uranus.jpg', { x: 280, y: 320, z: 0 });
    createRingWithOrbit(loader, './textures/uranus_ring.png', uranus, 16, 20);
    createPlanetWithOrbit(loader, 'Neptune', 6, './textures/neptune.jpg', { x: 320, y: 320, z: 0 });


    const sungeo = new THREE.SphereGeometry(40, 64, 64); 
    const sunmat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const sun = new THREE.Mesh(sungeo, sunmat);
    sun.position.set(640, 320, 0); 
    const suntexture = loader.load('./textures/sun.jpg', () => {
        console.log('Sun texture loaded successfully');
    }, undefined, (error) => {
        console.error('Error loading sun texture:', error);
    });
    sunmat.map = suntexture;
    sun.rotationSpeed = 0.005;
    sun.name = 'Sun';
    sun.castShadow = false;
    scene.add(sun);

    satellite = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 0.5, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.5, roughness: 0.5 })
    );
    satellite.castShadow = false;
    satellite.receiveShadow = true;
    scene.add(satellite);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(640, 320, 0);
    controls.update();
    loadskybox2();

    window.addEventListener('keydown', onKeyPress);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', (event) => keys[event.key] = true);
    window.addEventListener('keyup', (event) => keys[event.key] = false);
}

function onKeyPress(event) {
    if (event.key === '1') {
        activeCamera = camera;
        controls.enabled = true;
        console.log('Switched to Normal Camera');
    } else if (event.key === '2') {
        activeCamera = thirdPersonCamera;
        controls.enabled = false;
        console.log('Switched to Third-Person Camera');
        updateThirdPersonCamera(); 
    }
}

function updateSpaceshipMovement() {
    if (!spaceship) return; 

    console.log(keys); 

    const direction = new THREE.Vector3(); 
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromQuaternion(spaceship.quaternion);

    if (keys['w']) {
        direction.z = 1; 
    } else if (keys['s']) {
        direction.z = -1; 
    }

    if (keys['a']) {
        direction.x = 1; 
    } else if (keys['d']) {
        direction.x = -1; 
    }

    direction.applyMatrix4(rotationMatrix).normalize();

    spaceship.position.addScaledVector(direction, spaceshipSpeed);
}


function updateThirdPersonCamera() {
    if (spaceship) {
        const offset = new THREE.Vector3(0, 16, -16); 
        offset.applyQuaternion(spaceship.quaternion); 
        const targetPosition = new THREE.Vector3().copy(spaceship.position).add(offset);

        thirdPersonCamera.position.lerp(targetPosition, 0.1); 
        thirdPersonCamera.lookAt(spaceship.position); 
    }
}

function loadskybox2(){
    const cubeTextureLoader = new THREE.CubeTextureLoader;
    const skyBoxTexture = cubeTextureLoader.load([
        './skybox/px.bmp',
        './skybox/nx.bmp',
        './skybox/py.bmp',
        './skybox/ny.bmp',
        './skybox/pz.bmp',
        './skybox/nz.bmp'
    ]);
    scene.background = skyBoxTexture;
}

function create3DText(text, size = 2, height = 20) {
    if (!loadedFont) return null;

    const textGeometry = new THREE.TextGeometry(text, {
        font: loadedFont,
        size: size,
        height: height,
    });

    textGeometry.center();

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    return textMesh;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;

        if (hoveredObject.orbitData || hoveredObject.name) {

            if (hoveredObject.material && hoveredObject.material.color) {
                hoveredObject.material.color.set(0xffaa00); 
            }

            if (!currentLabel) {
                currentLabel = create3DText(hoveredObject.name || 'Unknown', 3, 0.3); 
                if (currentLabel) {
                    scene.add(currentLabel);
                }
            }

            if (currentLabel) {
                const planetRadius = hoveredObject.geometry.parameters.radius || 1;
                currentLabel.position.set(
                    hoveredObject.position.x,
                    hoveredObject.position.y + planetRadius + 20, 
                    hoveredObject.position.z
                );

                const scaleFactor = 5; 
                currentLabel.scale.set(scaleFactor, scaleFactor, scaleFactor);

                currentLabel.lookAt(camera.position);
            }
        }
    } else {

        if (currentLabel) {
            scene.remove(currentLabel);
            currentLabel.geometry.dispose(); 
            currentLabel.material.dispose();
            currentLabel = null;
        }

        scene.children.forEach(child => {
            if (child.material && child.material.color) {
                child.material.color.set(0xffffff); 
            }
        });
    }
}

function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        if (clickedObject.name) { 
            console.log(`Clicked on: ${clickedObject.name}`);

            if (!clickedObject.rotationSpeed) {
                clickedObject.rotationSpeed = 0.01; 
            }

            clickedObject.rotationSpeed *= 2;

            setTimeout(() => {
                clickedObject.rotationSpeed /= 2;
            }, 1000);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
    requestAnimationFrame(render);

    updateSpaceshipMovement();
    updateThirdPersonCamera();

    updateOrbit();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    scene.children.forEach((object) => {
        if (object.isHovered && !intersects.some((i) => i.object === object)) {
            object.material.color.set(object.originalColor);
            object.isHovered = false;
        }
    });

    if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        if (!hoveredObject.isHovered) {
            hoveredObject.isHovered = true;
            hoveredObject.originalColor = hoveredObject.material.color.getStyle();
            hoveredObject.material.color.set(colorList[Math.floor(Math.random() * colorList.length)]);
            console.log(`Hovered: ${hoveredObject.name || "Unknown Object"}`);
        }
    }

    if (spaceship) {
        spotlight.position.set(spaceship.position.x, spaceship.position.y + 6, spaceship.position.z);
        spotlight.target.position.set(spaceship.position.x, spaceship.position.y, spaceship.position.z);
        spotlight.target.updateMatrixWorld();
    }

    if (earth) {
        satellite.position.set(earth.position.x + 8, earth.position.y, earth.position.z);
    }

    scene.children.forEach((object) => {
        if (object.rotationSpeed) {
            object.rotation.y += object.rotationSpeed;
        }
    });

    renderer.render(scene, activeCamera);
    controls.update();
}

window.onload = function () {
    init();
    render();
};