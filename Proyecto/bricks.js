//Librerias que se van a importar
import * as THREE from './libs/three.js/r131/three.module.js'
import { OrbitControls } from './libs/three.js/r131/controls/OrbitControls.js';
import { OBJLoader } from './libs/three.js/r131/loaders/OBJLoader.js';
import { MTLLoader } from './libs/three.js/r131/loaders/MTLLoader.js';

//Objetos a renderizar
let renderer = null,
//Escenario
group = null,
scene = null,
camera = null,
map = null,
//Controles
orbitControls = null,
//Luces
ambientLight = null,
//Colores
colors = ["rojo","azul","verde"],
//Grupos
grupoJuego = null,
grupoJugador = null,
grupoPelotas = null,
grupopowerUps= null,
grupoLadrillos = null,
//Objetos 
jugador = null,
pelota = null,
powerUpsList = []
//Variables
let Gx = null;
let Gy = null;
let Gz = null;
//Objetos con modelo
let objMtlModelUrlPower1 = {obj:'', mtl: ''};
let objMtlModelUrlPower2 = {obj:'', mtl: ''};
let objMtlModelUrlPower3 = {obj:'', mtl: ''};
//Mapa
let mapUrl = 'img/blanco.jpg';
//Tiempo
let duration = 20000;
let currentTime = Date.now();



//Empieza el codigo

//Funcion main
function main()
{
    const canvas = document.getElementById('webglcanvas');

    createScene(canvas);

    update();

    // Update the camera controller
    orbitControls.update();
};

//Funcion que captura algún error a la hora de cargar los objetos
function onError(err)
{
    console.log(err);
};

//Funcion para conocer el proceso de la carga de los modelos
function onProgress( xhr ) 
{
    if ( xhr.lengthComputable ) {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log( xhr.target.responseURL, Math.round( percentComplete, 2 ) + '% downloaded' );
    }
}


//Crea la rotacion de los objetos mientras caen
function animate() {
    let now = Date.now();
    let deltat = now - currentTime;
    currentTime = now;
    let fract = deltat / duration;
    let angle = Math.PI * 1 * fract; 
}

function update() 
{
    requestAnimationFrame(function() { update(); });

    var time = Date.now();

    // Render the scene
    renderer.render( scene, camera );

    // Spin the cube for next frame
    animate();

}

//Funcion para cargar los powerUps
async function loadObjMtl(objModelUrl, objectList, Gx, Gy,Gz,grupo)
{
    console.log("Entra a carga objetos")
    try
    {
        const mtlLoader = new MTLLoader();
        const materials = await mtlLoader.loadAsync(objModelUrl.mtl, onProgress, onError);
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        const object = await objLoader.loadAsync(objModelUrl.obj, onProgress, onError);
        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        object.position.set(Gx,Gy,Gz);
        object.scale.set(.01, .01, .01);
        objectList.push(object);
        grupo.add(object);
    }
    catch (err)
    {
        onError(err);
    }
}

//Funcion para crear el rectangulo
async function createRectangle(x,y,z,url){
    return new Promise(async (resolve) => {
        // Textura del ladrillo
        const textureUrl = url;
        const texture = new THREE.TextureLoader().load(textureUrl);
        const material = new THREE.MeshPhongMaterial({ map: texture });

        //Geometria del ladrillo
        let geometry = new THREE.BoxGeometry (x,y,z);

        //Se crea el objeto 
        let brick = new THREE.Mesh(geometry, material);
        
        //Regresamos el ladrillo
        resolve(brick)

    })
}

async function createSphere(x,y,z,url){
    return new Promise(async (resolve) => {
        // Textura de la esfera
        const textureUrl = url;
        const texture = new THREE.TextureLoader().load(textureUrl);
        const material = new THREE.MeshPhongMaterial({ map: texture });
        
        // Geometria de la esfera
        let geometry = new THREE.SphereGeometry (x,y,z);

        // Creamos el objeto con la geometria y el material
        let sphere = new THREE.Mesh(geometry, material);

        resolve(sphere)
    })
}

async function createPlayer(x,y,z,url,grupo){
    try{
        const player = await createRectangle(x,y,z,url,grupo);
        
        grupo.add(player);

        grupo.position.set(0,20,0);

    } catch(err) {
        return onError(err)
    }
}

async function createBricks(Gx,Gy,Gz,x,y,z,url,grupo){
    try{
        const brick = await createRectangle(x,y,z,url,grupo);

        grupo.add(brick);

        brick.position.set(Gx,Gy,Gz);

    } catch(err) {
        return onError(err)
    }
}

async function createBall(x,y,z,url,grupo){
    try{
        const ball = await createSphere(x,y,z,url,grupo);

        grupo.add(ball);

        grupo.position.set(0,25,0);

    } catch(err) {
        return onError(err)
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

//Funcion que mueve las pelotas
async function moveBall() {
   
}

//Funcion que mueve al jugador
async function movePlayer() {

}

async function colisiones() {

}

//Funcion para crear la Scena
function createScene(canvas)
{
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.BasicShadowMap;
    
    // Crea el fondo de estrellas
    let background_image = new THREE.TextureLoader().load("img/fondo_estrellas.jpg")


    background_image.minFilter = THREE.LinearFilter;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    scene.background = background_image;

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(0, 40, 0);

    // Add a directional light to show off the objects
    const light = new THREE.DirectionalLight( 0xffffff, 1.0);

    // Position the light out from the scene, pointing at the origin
    light.position.set(-.5, .2, 1);
    light.target.position.set(0,-2,0);
    scene.add(light);
    
    orbitControls = new OrbitControls(camera, renderer.domElement);

    // Create and add all the lights
    ambientLight = new THREE.AmbientLight( 0x444444, 0.8);
    scene.add(ambientLight);

    //Crear los grupos

    // Create a group to hold the objects
    group = new THREE.Object3D;
    scene.add(group);

    //Grupo del juego
    grupoJuego = new THREE.Object3D;
    group.add(grupoJuego)

    //Grupo del juegador
    grupoJugador = new THREE.Object3D;
    grupoJuego.add(grupoJugador)

    //Grupo de las pelotas
    grupoPelotas = new THREE.Object3D;
    grupoJuego.add(grupoPelotas)

    //Grupo ladrillos 
    grupoLadrillos = new THREE.Object3D;
    grupoLadrillos.position.set(0,50,0);
    grupoJuego.add(grupoLadrillos)

    //Grupo powerUps
    grupopowerUps = new THREE.Object3D;
    grupoJuego.add(grupopowerUps)


    //Crea los objetos del juego
    jugador = createPlayer(5,1,5, "img/ladrillo_morado.jpg", grupoJugador);

    pelota = createBall(2,2,2, "img/blanco.jpg", grupoPelotas);

    //Crear los 125 ladrillos para romper
    let Gx = -10, 
    Gy = 0, 
    Gz = -10
    
    for(let i = 0; i < 5 ; i ++){
        Gy += 3; 
        Gz = -10
        for(let j = 0; j < 5 ; j ++){
            Gz += 5;
            Gx = -10
            for(let k = 0; k < 5 ; k ++){
                var numero = getRandomInt(0,2)
                console.log("Color: ",numero)
                createBricks(Gx,Gy,Gz,5,3,5,"img/ladrillo_"+colors[numero]+".jpg",grupoLadrillos);
                Gx += 5;
            }
        }
    }

    //Dibujar muestra powerUps
    loadObjMtl(objMtlModelUrlPower1, powerUpsList, 0, 10, 0, grupopowerUps)
    loadObjMtl(objMtlModelUrlPower2, powerUpsList, 5, 10, 0, grupopowerUps)
    loadObjMtl(objMtlModelUrlPower3, powerUpsList, 10, 10, 0, grupopowerUps)

    //Crear la textura del fondo
    const map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    //Put in a ground plane to show off the lighting
    let geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({map:map, side:THREE.DoubleSide}));
    
    //Create the cylinder 
    geometry = new THREE.CylinderGeometry(1, 2, 2, 50, 10);
    mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
    mesh.position.y = -3;
    mesh.castShadow = false;
    mesh.receiveShadow = true;    
    group.add( mesh );

}

main();


