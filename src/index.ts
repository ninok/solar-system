import { BoxGeometry, SphereGeometry, Mesh, Sphere, MeshBasicMaterial, Scene, PerspectiveCamera, WebGLRenderer, PointLight, MeshStandardMaterial, MeshLambertMaterial, Matrix4, Euler, Vector3, Object3D, TextureLoader, DirectionalLight, AmbientLight, LineBasicMaterial, Geometry, Line } from "three";
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

const sunRadius = 6.96342e8;
const earthRadius = 6378137;
const earthDistance = 15; // earth distance from the sun
const moonDistance = 2; // moon distance from the earth

/**
 * Calculate the earth position depending on the day of the year.
 * @param day Day of the year (between 1 and 365)
 */
function calcEarthPos(day: number, result?: Vector3): Vector3 {
     if (result === undefined) { result = new Vector3(); }

     const angle = (day / 365) * 2 * Math.PI;

     // TODO: Use proper elliptic trajectory
     // TODO: Account for earth-moon system barycenter
     result.x = Math.cos(angle) * earthDistance;
     result.y = Math.sin(angle) * earthDistance;
     result.z = 0;

     return result;
}

/**
 * Calculate the moon position releative to the earth.
 * @param day Day of the month (between 1 and 30)
 */
function calcMoonPos(day: number, result?: Vector3): Vector3 {
     if (result === undefined) { result = new Vector3(); }

     const angle = (day / 30) * 2 * Math.PI;

     // TODO: Use proper elliptic trajectory
     // TODO: Account for earth-moon system barycenter
     result.x = Math.cos(angle) * moonDistance;
     result.y = Math.sin(angle) * moonDistance;
     result.z = 0;

     return result;
}


function createEarthTrajectory() {
     var material = new LineBasicMaterial({
          color: 0x0000ff
     });

     var geometry = new Geometry();
     for (let day = 1; day <= 366; ++day) {
          geometry.vertices.push(
               calcEarthPos(day, new Vector3()));
     }

     return new Line(geometry, material);
}

function createMoonTrajectory() {
     var material = new LineBasicMaterial({
          color: 0x00ffff
     });

     var geometry = new Geometry();
     for (let day = 1; day <= 31; ++day) {
          geometry.vertices.push(
               calcMoonPos(day, new Vector3()));
     }

     return new Line(geometry, material);
}


let canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let scene = new Scene();
let sun = new Mesh(new SphereGeometry(1.0, 20, 20), new MeshBasicMaterial({ color: "#ffff00" }));
scene.add(sun);
scene.add(createEarthTrajectory());

let earthSystem = new Object3D();
scene.add(earthSystem);
let earth = new Mesh(
     new SphereGeometry(1.0, 20, 20),
     new MeshStandardMaterial({
          color: "#0000cc",
          metalness: 0,
          emissive: 0,
          roughness: 0.8
     }));
calcEarthPos(1, earthSystem.position);
earthSystem.add(earth);
earth.setRotationFromEuler(new Euler(Math.PI / 2));


let moon = new Mesh(
     new SphereGeometry(0.1, 20, 20),
     new MeshStandardMaterial({
          color: "#cccccc",
          metalness: 0,
          emissive: 0,
          roughness: 0.8
     }));
calcMoonPos(1, moon.position);
earthSystem.add(moon);
earthSystem.add(createMoonTrajectory());

new TextureLoader().load("2_no_clouds_8k.jpg", (texture: THREE.Texture) => {
     (earth.material as MeshStandardMaterial).map = texture;
     (earth.material as MeshStandardMaterial).color.set("#ffffff");
     (earth.material as MeshStandardMaterial).needsUpdate = true;
     requestAnimationFrame(render);
});

let light = new DirectionalLight("#ffffff", 2.0);
light.position.set(0, 0, 0);
light.target = earth;
scene.add(light);

let ambientLight = new AmbientLight("#ffffff", 0.1);
scene.add(ambientLight);


let camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 10000);
camera.position.set(0, 0, 25);

let renderer = new WebGLRenderer({ canvas: canvas });

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI;
controls.target.set(0, 0, 0)
controls.update();

controls.addEventListener('change', render);

const gui = new dat.GUI();

let options = {
     day: 1,
     hour: 1,
     moon: 1,
     cameraTarget: "sun"
}

gui.add(options, "day", 1, 365, 1).onChange((value?: any) => {
     calcEarthPos(options.day, earthSystem.position);
     if (options.cameraTarget === "earth" || options.cameraTarget === "moon") {
          scene.updateMatrixWorld();
          updateCamera();
     }
     requestAnimationFrame(render);
});

gui.add(options, "moon", 1, 30, 1).onChange((value?: any) => {
     calcMoonPos(options.moon, moon.position);
     if (options.cameraTarget === "moon") {
          scene.updateMatrixWorld();
          updateCamera();
     }
     requestAnimationFrame(render);
});

gui.add(options, "hour", 1, 3600, 1).onChange((value?: any) => {
     let rotation = (options.hour / 3600) * 2 * Math.PI;
     earth.setRotationFromEuler(new Euler(Math.PI / 2, rotation, 0, 'XYZ'));
     requestAnimationFrame(render);
});

function updateCamera() {
     switch (options.cameraTarget) {
          case "sun":
               sun.getWorldPosition(controls.target);
               camera.position.copy(controls.target);
               camera.position.setZ(25);
               camera.up.set(0, 1, 0);
               break;
          case "earth":
               earth.getWorldPosition(controls.target);
               camera.position.copy(controls.target);
               camera.position.setZ(10);
               camera.up.set(0, 1, 0);
               break;
          case "moon":
               moon.getWorldPosition(controls.target);
               earth.getWorldPosition(camera.position);
               camera.up.set(0, 0, 1);
               break;
     }
     console.log(controls.target);
     controls.update();
}

gui.add(options, "cameraTarget", ["sun", "earth", "moon"]).onChange((value?: any) => {
     updateCamera();
     requestAnimationFrame(render);
});

function render() {
     //  controls.update();
     renderer.render(scene, camera);
}
requestAnimationFrame(render);