//Librerias que se van a importar
import * as THREE from './libs/three.js/r131/three.module.js';
import { OrbitControls } from './libs/three.js/r131/controls/OrbitControls.js';
import { OBJLoader } from './libs/three.js/r131/loaders/OBJLoader.js';
import { MTLLoader } from './libs/three.js/r131/loaders/MTLLoader.js';
import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js'

//Objetos a renderizar
let renderer = null,
    //Escenario
    group = null,
    scene = null,
    camera = null,
    mapa = null,
    mapa2 = null,
    mapa3 = null,
    mapa4 = null,
    mapa5 = null,
    hongo = null,
    //Controles
    orbitControls = null,
    //Luces
    ambientLight = null,
    //Colores
    colors = ["rojo", "azul", "verde"],
    //Grupos
    grupoJuego = null,
    grupoJugador = null,
    grupoPelotas = null,
    grupopowerUps = null,
    grupoLadrillos = null,
    grupoPowerBox = [],
    //Objetos 
    jugador = null,
    powerUpsList = []
//Variables
//Vidas del jugador
let vidas = 3;
let Gx = null;
let Gy = null;
let Gz = null;
let Ex = null;
let Ey = null;
let Ez = null;
//Objetos con modelo
let pelota = { obj: 'modelos/Foot-Ball-obj/Ball.obj', mtl: 'modelos/Foot-Ball-obj/Ball.mtl' }
let objMtlModelUrlPower1 = { obj: 'modelos/crecer/Mario Mushroom.obj', mtl: 'modelos/crecer/Mario_Mushroom.mtl' };
let objMtlModelUrlPower2 = { obj: 'modelos/medpack2/Sci-fi Med_kit.obj', mtl: 'modelos/medpack2/Sci-fi Med_kit.mtl' };
let objMtlModelUrlPower3 = { obj: 'modelos/multiball/zero point.obj', mtl: 'modelos/multiball/zero_point.mtl' };
//Mapa
let mapUrl = 'img/blanco.jpg';
//Tiempo
let duration = 20000;
let currentTime = Date.now();
// cannon.js variables
let world = new CANNON.World();
const timeStep = 1 / 60;
let lastCallTime = performance.now();
let lastTime;
let sphereShape
let sphereBody
let physicsMaterial
const balls = [];
const ballMeshes = [];
const boxes = [];
const boxMeshes = [];

//colisiones
let flagBrick = false;
let flagPlayer = false;
let flagWall = false;
let flagUpperWall = false
let vely = 0;
let velx = 0;
let velz = 0;
let bodyErase = null;



//Empieza el codigo

//Funcion main
function main() {
    const canvas = document.getElementById('webglcanvas');

    createScene(canvas);

    update();

    // Update the camera controller
    orbitControls.update();
};

//Funcion que captura algún error a la hora de cargar los objetos
function onError(err) {
    console.log(err);
};

//Funcion para conocer el proceso de la carga de los modelos
function onProgress(xhr) {
    if (xhr.lengthComputable) {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log(xhr.target.responseURL, Math.round(percentComplete, 2) + '% downloaded');
    }
}

function randomVel(){
    if(velz >= 0 || velz <= 0){
        if(velz == 0){
            velz = getRandomInt(0,3);
        }
        else {
            if(velz > 0){
                velz = -1 * getRandomInt(0,3);
            }
            else{
                velz = getRandomInt(0,3);
            }
        }
    }
    if(velx >= 0 || velx <= 0){
        if(velx == 0){
            velx = getRandomInt(0,3);
        }
        else {
            if(velx > 0){
                velx = -1 * getRandomInt(0,3);
            }
            else{
                velx = getRandomInt(0,3);
            }
        }
    }
}

//Funcion para cargar los objetos mtl
async function loadObjMtl(objModelUrl, objectList, Gx, Gy, Gz, grupo, Ex, Ey, Ez) {
    console.log("CargaMtl: ", objModelUrl)
    console.log("Entra a carga objetos")
    try {
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
        console.log("ObjMtl: ", object)
        object.position.set(Gx, Gy, Gz);
        object.scale.set(Ex, Ey, Ez);
        objectList.push(object);
        grupo.add(object);
        console.log("Children: ", object.children)
        let box3js = new THREE.Box3();
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshBasicMaterial()
        )
        let shape = null;
        console.log("MESH: ", mesh)
        mesh.geometry.computeBoundingBox()
        let box = mesh.geometry.boundingBox
        shape = new CANNON.Box(new CANNON.Vec3(
            (box.max.x - box.min.x) / 2,
            (box.max.y - box.min.y) / 2,
            (box.max.z - box.min.z) / 2
        ));
        let body = new CANNON.Body({mass:1});
        body.addShape(shape);
        body.position.set(Gx, Gy, Gz)
        body.updateAABB();
        body.object = object;
        console.log("BODY: ", body)
        body.velocity.set(0,-3,0)
        body.addEventListener('collide', function(e){
            if(e.contact.bj.player){
                if(objModelUrl == objMtlModelUrlPower1){
                    powerUp1()
                } else if(objModelUrl == objMtlModelUrlPower2) {
                    powerUp2()
                } else {
                    powerUp3()
                }
            }
        })
        powerUpsList.push(object)
        grupoPowerBox.push(body)
        world.addBody(body);
    }
    catch (err) {
        onError(err);
    }
}



//Crea la pelota
function crearPelota(mesh){
    console.log("Mesh: ", mesh)
    let material = new THREE.MeshLambertMaterial();
    console.log("Material: ", material);
    new THREE.Mesh(material)
    const ballShape = new CANNON.Sphere(0.2);
    const ballGeometry = new THREE.SphereBufferGeometry(ballShape.radius, 32, 32);
    const ballBody = new CANNON.Body({ mass: 1 });
    ballBody.addShape(ballShape);
    const ballMesh = new THREE.Mesh(ballGeometry, material);
    balls.push(ballBody);
    ballMeshes.push(ballMesh);
    ballBody.velocity.set(
        0 * 2,
        -2 * 2,
        0 * 2
    );
    ballBody.position.set(0, 15, 0);
    ballMesh.position.copy(ballBody.position);
    ballBody.collisionResponse = 0;
    ballBody.addEventListener('collide', function (e) {
        ballBody.velocity.set(
            0,
            0,
            0
        );
        if(e.contact.bj.brick){
            flagBrick = true;
            console.log("ladrillo")
            // console.log(e.contact.bj.id)
            bodyErase = e.contact.bj
            // console.log(bodyErase)
            bodyErase.brick.visible = false;
            // bodyErase.collisionResponse = false;
            // bodyErase.shapes[0].collisionResponse = false
            // bodyErase.mass = 0
            // bodyErase.sleep()
            // bodyErase.wakeUpAfterNarrowphase = true
            world.removeBody(bodyErase)
            // bodyErase.position.x = 1000
        }
        if(e.contact.bj.player){
            flagPlayer = true;
            console.log("jugador")
        }

        if(e.contact.bj.wall){
            flagWall = true
            console.log("mapa")
        }
        if(e.contact.bj.upperWall){
            flagUpperWall = true
            console.log("arriba")
        }

        // console.log(e.contact);
        // console.log('Collision!');
        if(flagBrick){
            // console.log("aqui entras?")
            vely = -1 * getRandomInt(0,3);
            if(vely == 0){
                vely = -1;
            }
            randomVel();
            createPowerUp();
            flagBrick = false

        }
        if(flagPlayer){
            vely = getRandomInt(0,3);
            if(vely == 0){
                vely = 1;
            }
            randomVel();
            flagPlayer = false
        }

        if(flagWall) {
            randomVel();
            flagWall = false;
        }

        if(flagUpperWall){
            randomVel();
            vely = -1 * getRandomInt(0,3);
            if(vely == 0){
                vely = -1;
            }
            flagUpperWall = false;
        }
        // randomVel();
        console.log(velx + "    " + vely + "    " + velz)
        ballBody.velocity.set(
            velz * 2,
            vely * 2 * 5,
            velz * 2
        );
    });
    world.addBody(ballBody);
    scene.add(ballMesh);
}


//Crea la rotacion de los objetos mientras caen
function animate() {
    let now = Date.now();
    let deltat = now - currentTime;
    currentTime = now;
    let fract = deltat / duration;
    let angle = Math.PI * 1 * fract;
    // Update ball positions
}


function update() {
    requestAnimationFrame(function () { update(); });
    const time = performance.now() / 1000
    const dt = time - lastCallTime
    lastCallTime = time
    // Render the scene
    renderer.render(scene, camera);

    movePlayer(grupoJugador);
    moveCamera(camera);
    world.step(timeStep, dt)
    for (let i = 0; i < balls.length; i++) {
        ballMeshes[i].position.copy(balls[i].position)
        ballMeshes[i].quaternion.copy(balls[i].quaternion)
    }

    for (let i = 0; i < grupoPowerBox.length; i++) {
        powerUpsList[i].position.copy(grupoPowerBox[i].position)
        powerUpsList[i].quaternion.copy(grupoPowerBox[i].quaternion)
    }

    // Spin the cube for next frame
    animate();

}

//Funcion para esperar
function delay(n){
    return new Promise(function(resolve){
        setTimeout(resolve,n*1000);
    });
}

//Funcion para crear el rectangulo
async function createRectangle(x, y, z, url) {
    return new Promise(async (resolve) => {
        // Textura del ladrillo
        const textureUrl = url;
        const texture = new THREE.TextureLoader().load(textureUrl);
        const material = new THREE.MeshPhongMaterial({ map: texture });

        //Geometria del ladrillo
        let geometry = new THREE.BoxGeometry(x, y, z);

        //Se crea el objeto 
        let brick = new THREE.Mesh(geometry, material);

        //Regresamos el ladrillo
        resolve(brick)

    })
}

//Funcion para crear el rectangulo
async function createRectangleMap(x, y, z, url) {
    return new Promise(async (resolve) => {

        // Textura del ladrillo
        const textureUrl = url;
        const texture = new THREE.TextureLoader().load(textureUrl);
        const material = new THREE.MeshPhongMaterial({ map: texture });

        //Geometria del ladrillo
        let geometry = new THREE.BoxGeometry(x, y, z);

        //Se crea el objeto 
        let wall = new THREE.Mesh(geometry, material);

        //Regresamos el ladrillo
        resolve(wall)

    })
}

async function createPlayer(x, y, z, url, grupo) {
    try {
        const player = await createRectangle(x, y, z, url, grupo);

        grupo.add(player);

        grupo.position.set(0, -1, 0);
        //Se pone el Cannon al objeto
        let shape = null;
        player.geometry.computeBoundingBox();
        let box = player.geometry.boundingBox;
        shape = new CANNON.Box(new CANNON.Vec3(
            (box.max.x - box.min.x) / 2,
            (box.max.y - box.min.y) / 2,
            (box.max.z - box.min.z) / 2
        ));
        let body = new CANNON.Body({mass:1});
        body.addShape(shape);
        body.position.copy(player.position);
        body.updateAABB();
        body.player = player;
        world.addBody(body);


    } catch (err) {
        return onError(err)
    }
}

async function createBricks(Gx, Gy, Gz, x, y, z, url, grupo) {
    try {
        const brick = await createRectangle(x, y, z, url, grupo);

        grupo.add(brick);

        brick.position.set(Gx, Gy, Gz);

        //Se pone el Cannon al objeto
        let shape = null;
        brick.geometry.computeBoundingBox();
        let box = brick.geometry.boundingBox;
        shape = new CANNON.Box(new CANNON.Vec3(
            (box.max.x - box.min.x) / 2,
            (box.max.y - box.min.y) / 2,
            (box.max.z - box.min.z) / 2
        ));
        let body = new CANNON.Body({mass:5});
        const posx = brick.position.x
        const posy = brick.position.y + 48
        const posz = brick.position.z
        body.addShape(shape);
        body.position.set(posx, posy, posz)
        body.updateAABB();
        body.brick = brick;
        boxMeshes.push(body)
        boxes.push(body)
        world.addBody(body);

    } catch (err) {
        return onError(err)
    }
}

async function createMap(Gx, Gy, Gz, x, y, z, url, grupo) {
    try {
        const wall = await createRectangleMap(x, y, z, url);
        grupo.add(wall);

        wall.position.set(Gx, Gy, Gz);
        //Se pone el Cannon al objeto
        let shape = null;
        wall.geometry.computeBoundingBox();
        let box = wall.geometry.boundingBox;
        shape = new CANNON.Box(new CANNON.Vec3(
            (box.max.x - box.min.x) / 2,
            (box.max.y - box.min.y) / 2,
            (box.max.z - box.min.z) / 2
        ));
        let body = new CANNON.Body({mass:5});
        body.addShape(shape);
        body.position.copy(wall.position);
        body.updateAABB();
        body.wall = wall;
        // body.addEventListener('collide', function(e){
        //     console.log(e)
        // })
        world.addBody(body);

    } catch (err) {
        return onError(err)
    }    
}

async function createUpperMap(Gx, Gy, Gz, x, y, z, url, grupo) {
    try {
        const upperWall = await createRectangleMap(x, y, z, url);
        grupo.add(upperWall);

        upperWall.position.set(Gx, Gy, Gz);
        //Se pone el Cannon al objeto
        let shape = null;
        upperWall.geometry.computeBoundingBox();
        let box = upperWall.geometry.boundingBox;
        shape = new CANNON.Box(new CANNON.Vec3(
            (box.max.x - box.min.x) / 2,
            (box.max.y - box.min.y) / 2,
            (box.max.z - box.min.z) / 2
        ));
        let body = new CANNON.Body({mass:5});
        body.addShape(shape);
        body.position.copy(upperWall.position);
        body.updateAABB();
        body.upperWall = upperWall;
        // body.addEventListener('collide', function(e){
        //     console.log(e)
        // })
        world.addBody(body);

    } catch (err) {
        return onError(err)
    }    
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Funcion que mueve al jugador
async function movePlayer(player) {
    let speedX = 0.0001
    let speedZ = 0.0001

    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        // DOWN ARROW
        if (keyCode == 40) {
            player.position.z += speedZ;
        } 
        // UP ARROW
        else if (keyCode == 38) {
            player.position.z -= speedZ;
        } 
        // LEFT ARROW
        else if (keyCode == 37) {
            player.position.x -= speedX;
        } 
        // RIGHT ARROW
        else if (keyCode == 39) {
            player.position.x += speedX;
        } 
        // S
        else if (keyCode == 83) {
            player.position.x += speedX;
            player.position.z -= speedZ;
        } 
        // A
        else if (keyCode == 65) {
            player.position.x -= speedX;
            player.position.z += speedZ;
        } 
        // W
        else if (keyCode == 87) {
            player.position.x -= speedZ;
            player.position.z -= speedX;
        } 
        // S
          else if (keyCode == 68) {
            player.position.x += speedZ;
            player.position.z += speedX;
        } 
        // SPACE
        else if (keyCode == 32) {
            player.position.set(0, 20, 0);
        }
    };

}

//Funcion que mueve al jugador
async function moveCamera(camera) {
    let speedX = 0.0001
    let speedZ = 0.0001

    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        // DOWN ARROW
        if (keyCode == 40) {
            camera.position.z += speedZ;
        } 
        // UP ARROW
        else if (keyCode == 38) {
            camera.position.z -= speedZ;
        } 
        // LEFT ARROW
        else if (keyCode == 37) {
            camera.position.x -= speedX;
        } 
        // RIGHT ARROW
        else if (keyCode == 39) {
            camera.position.x += speedX;
        } 
        // S
        else if (keyCode == 83) {
            camera.position.x += speedX;
            camera.position.z -= speedZ;
        } 
        // A
        else if (keyCode == 65) {
            camera.position.x -= speedX;
            camera.position.z += speedZ;
        } 
        // W
        else if (keyCode == 87) {
            camera.position.x -= speedZ;
            camera.position.z -= speedX;
        } 
        // S
          else if (keyCode == 68) {
            camera.position.x += speedZ;
            camera.position.z += speedX;
        } 
        // SPACE
        else if (keyCode == 32) {
            camera.position.set(0, 20, 0);
        }
    };
}

async function createPowerObj(obj) {
    return new Promise(async (resolve) => {
        let x = 0;
        let y = 0;
        let z = 0;
        x = bodyErase.position.x
        y = bodyErase.position.y
        z = bodyErase.position.z
        let power = await loadObjMtl(obj, powerUpsList, x, y, z, grupopowerUps, 0.3, 0.3, 0.3)
        console.log("Power: ", power)
        resolve(power)
    })
}

async function createPowerUp(){
    let k = getRandomInt(0,101)
    let shape = null;
    console.log("K: ", k)
    if (k > 0 && k < 36){
        console.log("Entro al hongo")
        hongo = await createPowerObj(objMtlModelUrlPower1)
        console.log("Hongo: ",hongo)
        
    } else if(k > 35 && k < 71) {
        console.log("Entro al medical")
        let medical = await createPowerObj(objMtlModelUrlPower2)
        console.log("Medical: ",medical)
    } else if(k > 70 && k < 101) {
        console.log("Entro al multiball")
        let esferas = await createPowerObj(objMtlModelUrlPower3)
        console.log("Esferas: ",esferas)
    }
}

async function powerUp1(jugador){

    //Duplica el tamaño del jugador
    jugador.x = jugador.x * 2
    jugador.z = jugador.z * 2

    //Esperar 10 segundos
    await delay(10)

    //Regresa al tamaño original
    jugador.x = jugador.x / 2
    jugador.z = jugador.z / 2

}

async function powerUp2(vidas){
    vidas += 1   
    return vidas
}

async function powerUp3(grupo){
    // Crea las nuevas pelotas
    let pelota2 = loadObjMtl(pelota, powerUpsList, 0, 25, 0, grupoPelotas, 0.01, 0.01, 0.01);
    crearPelota(pelota2)
    let pelota3 = loadObjMtl(pelota, powerUpsList, 0, 25, 0, grupoPelotas, 0.01, 0.01, 0.01);
    crearPelota(pelota3)

    // Agregar las pelotas al grupo
    grupo.add(pelota2)
    grupo.add(pelota3)

    //Espera 10 segundos
    await delay(10)

    // Remover las pelotas del grupo
    grupo.remove(pelota2)
    grupo.remove(pelota3)

}

async function eliminarVida(vidas){
    vidas -= 1
    return vidas
}

async function colisiones() {

}

//Funcion para crear la Scena
function createScene(canvas) {
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;

    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.BasicShadowMap;

    // Crea el fondo de estrellas
    let background_image = new THREE.TextureLoader().load("img/fondo_estrellas.jpg");


    background_image.minFilter = THREE.LinearFilter;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    scene.background = background_image;

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 4000);
    camera.position.set(0, -1, 0);

    // Add a directional light to show off the objects
    const light = new THREE.DirectionalLight(0xffffff, 1.0);

    // Position the light out from the scene, pointing at the origin
    light.position.set(-.5, .2, 1);
    light.target.position.set(0, -10, 0);
    scene.add(light);

    orbitControls = new OrbitControls(camera, renderer.domElement);

    // Create and add all the lights
    ambientLight = new THREE.AmbientLight(0x444444, 0.8);
    scene.add(ambientLight);

    //Crear los grupos

    // Create a group to hold the objects
    group = new THREE.Object3D;
    scene.add(group);

    //Grupo del juego
    grupoJuego = new THREE.Object3D;
    group.add(grupoJuego)

    //Grupo del jugador
    grupoJugador = new THREE.Object3D;
    grupoJuego.add(grupoJugador)

    //Grupo de las pelotas
    grupoPelotas = new THREE.Object3D;
    grupoJuego.add(grupoPelotas)

    //Grupo ladrillos 
    grupoLadrillos = new THREE.Object3D;
    grupoLadrillos.position.set(0, 50, 0);
    grupoJuego.add(grupoLadrillos)

    //Grupo powerUps
    grupopowerUps = new THREE.Object3D;
    grupoJuego.add(grupopowerUps)


    //Crea los objetos del juego
    mapa = createUpperMap(0, 83, 0, 50, 5, 40, "img/ladrillo_rojo.jpg", grupoJuego);
    mapa2 = createMap(0, 30, 25, 50, 100, 5, "img/ladrillo_rojo.jpg", grupoJuego);
    mapa3 = createMap(0, 30, -15, 50, 100, 5, "img/ladrillo_rojo.jpg", grupoJuego);
    mapa4 = createMap(20, 30, 5, 5, 100, 32, "img/ladrillo_rojo.jpg", grupoJuego);
    mapa5 = createMap(-20, 30, 5, 5, 100, 32, "img/ladrillo_rojo.jpg", grupoJuego);

    jugador = createPlayer(5, 1, 5, "img/ladrillo_morado.jpg", grupoJugador);
    
    crearPelota(pelota)
    //Crear los 125 ladrillos para romper
    let Gx = -10,
        Gy = 10,
        Gz = -10

    for (let i = 0; i < 5; i++) {
        Gy += 3;
        Gz = -10
        for (let j = 0; j < 5; j++) {
            Gz += 5;
            Gx = -10
            for (let k = 0; k < 5; k++) {
                var numero = getRandomInt(0, 2)
                createBricks(Gx, Gy, Gz, 5, 3, 5, "img/ladrillo_" + colors[numero] + ".jpg", grupoLadrillos);
                Gx += 5;
            }
        }
    }

    //Crear la textura del fondo
    const map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    //Put in a ground plane to show off the lighting
    let geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ map: map, side: THREE.DoubleSide }));

    //Create the cylinder 
    geometry = new THREE.CylinderGeometry(1, 2, 2, 50, 10);
    mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
    mesh.position.y = -3;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);

    console.log(world)
    console.log(grupoLadrillos)
    console.log(ballMeshes)

}

main();


