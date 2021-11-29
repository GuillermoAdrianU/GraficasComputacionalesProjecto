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
    mapadown = null,
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
let vidas = 1;
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
let ballErase = [];
let playerBox = null;
let playerMesh = null;

//colisiones
let flagBrick = false;
let flagPlayer = false;
let flagWall = false;
let flagUpperWall = false;
let flagBottomWall = false;
let flagMultiBall = false;
let flagPowerUp = false;
let powerIndex = 0;
let vely = 0;
let velx = 0;
let velz = 0;
let bodyErase = null;
let jugadorID = null;



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

//Funcion para calcular la velocidad
function randomVel(){
    if(velz >= 0 || velz <= 0){
        if(velz == 0){
            velz = getRandomInt(2,4);
        }
        else {
            if(velz > 0){
                velz = -1 * getRandomInt(2,4);
            }
            else{
                velz = getRandomInt(2,4);
            }
        }
    }
    if(velx >= 0 || velx <= 0){
        if(velx == 0){
            velx = getRandomInt(2,4);
        }
        else {
            if(velx > 0){
                velx = -1 * getRandomInt(2,4);
            }
            else{
                velx = getRandomInt(2,4);
            }
        }
    }
}

//Funcion para cargar los objetos mtl y sus cajas 
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
        if(objModelUrl == objMtlModelUrlPower1){
            object.position.set(Gx + 100, Gy, Gz);
        } else {
            object.position.set(Gx, Gy, Gz);
        }
        object.scale.set(Ex, Ey, Ez);
        objectList.push(object);
        grupo.add(object);
        console.log("Children: ", object.children)
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
            if(flagPowerUp && powerIndex == 1){
                if(e.contact.bi.player){
                    if(objModelUrl == objMtlModelUrlPower1){
                        powerUp1()
                    } else if(objModelUrl == objMtlModelUrlPower2) {
                        powerUp2()
                    } else {
                        powerUp3()
                    }
                }
            }
            if(flagPowerUp == false && powerIndex == 0){
                flagPowerUp = true;
            }
            powerIndex += 1;
            console.log(e.contact.bi)
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
function crearPelota(){
    // console.log("Mesh: ", mesh)
    let material = new THREE.MeshLambertMaterial();
    // console.log("Material: ", material);
    new THREE.Mesh(material)
    const ballShape = new CANNON.Sphere(0.2);
    const ballGeometry = new THREE.SphereBufferGeometry(ballShape.radius, 32, 32);
    const ballBody = new CANNON.Body({ mass: 1 });
    ballBody.addShape(ballShape);
    const ballMesh = new THREE.Mesh(ballGeometry, material);
    if(flagMultiBall){
        ballErase.push(balls)
    }
    balls.push(ballBody);
    ballMeshes.push(ballMesh);
    if(flagMultiBall){
        ballBody.velocity.set(
            0 * 2,
            2 * 2,
            0 * 2
        );
    } else {
        ballBody.velocity.set(
            0 * 2,
            -2 * 2,
            0 * 2
        );
    }
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

        if(e.contact.bj.bottomWall){
            if(flagMultiBall){
                console.log("no debe de morir")
            } else {
                console.log("muere")
                flagBottomWall = true;
                eliminarVida()
            }
        }

        // console.log(e.contact);
        // console.log('Collision!');
        if(flagBrick){
            // console.log("aqui entras?")
            vely = -1 * getRandomInt(0,3);
            if(vely < 3){
                vely = -3;
            }
            randomVel();
            createPowerUp();
            flagBrick = false

        }
        if(flagPlayer){
            vely = getRandomInt(0,3);
            if(vely < 3){
                vely = 3;
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
            if(vely < 3){
                vely = -3;
            }
            flagUpperWall = false;
        }
        // randomVel();
        console.log(velx + "    " + vely + "    " + velz)
        ballBody.velocity.set(
            velz * 2,
            vely * 3,
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
    if(flagBottomWall){
        camera.position.set(0, -1, 0)
    }
    world.step(timeStep, dt)
    for (let i = 0; i < balls.length; i++) {
        ballMeshes[i].position.copy(balls[i].position)
        ballMeshes[i].quaternion.copy(balls[i].quaternion)
    }

    for (let i = 0; i < grupoPowerBox.length; i++) {
        powerUpsList[i].position.copy(grupoPowerBox[i].position)
        powerUpsList[i].quaternion.copy(grupoPowerBox[i].quaternion)
    }

    playerBox.position.copy(playerMesh.position)

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

//Funcion que crea al jugador con su caja 
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
        playerMesh = player;
        playerBox = body;
        // console.log("player", player);
        jugadorID = body;
        world.addBody(body);


    } catch (err) {
        return onError(err)
    }
}

//Funcion que crea las cajas para colisiones de los ladrillos
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

//Funcion que crea las paredes del mapa
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


//Funcion que crea la tapa del mapa
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

async function createDownMap(Gx, Gy, Gz, x, y, z, url, grupo) {
    try {
        const bottomWall = await createRectangleMap(x, y, z, url);
        grupo.add(bottomWall);

        bottomWall.position.set(Gx, Gy, Gz);
        //Se pone el Cannon al objeto
        let shape = null;
        bottomWall.geometry.computeBoundingBox();
        let box = bottomWall.geometry.boundingBox;
        shape = new CANNON.Box(new CANNON.Vec3(
            (box.max.x - box.min.x) / 2,
            (box.max.y - box.min.y) / 2,
            (box.max.z - box.min.z) / 2
        ));
        let body = new CANNON.Body({mass:5});
        body.addShape(shape);
        body.position.copy(bottomWall.position);
        body.updateAABB();
        body.bottomWall = bottomWall;
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
    let speedX = 0.001
    let speedZ = 0.001

    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        // DOWN ARROW
        if (keyCode == 40) {
            player.position.z += speedZ;
            playerMesh.position.z = player.position.z
        } 
        // UP ARROW
        else if (keyCode == 38) {
            player.position.z -= speedZ;
            playerMesh.position.z = player.position.z
        } 
        // LEFT ARROW
        else if (keyCode == 37) {
            player.position.x -= speedX;
            playerMesh.position.x = player.position.x
        } 
        // RIGHT ARROW
        else if (keyCode == 39) {
            player.position.x += speedX;
            playerMesh.position.x = player.position.x
        } 
        // S
        else if (keyCode == 83) {
            player.position.x += speedX;
            player.position.z -= speedZ;
            playerMesh.position.x = player.position.x
            playerMesh.position.z = player.position.z
        } 
        // A
        else if (keyCode == 65) {
            player.position.x -= speedX;
            player.position.z += speedZ;
            playerMesh.position.x = player.position.x
            playerMesh.position.z = player.position.z
        } 
        // W
        else if (keyCode == 87) {
            player.position.x -= speedZ;
            player.position.z -= speedX;
            playerMesh.position.x = player.position.x
            playerMesh.position.z = player.position.z
        } 
        // S
          else if (keyCode == 68) {
            player.position.x += speedZ;
            player.position.z += speedX;
            playerMesh.position.x = player.position.x
            playerMesh.position.z = player.position.z
        } 
        // SPACE
        else if (keyCode == 32) {
            player.position.set(0, 20, 0);
            playerMesh.position.copy(player.position)
        }
    };

}

//Funcion que mueve al jugador
async function moveCamera(camera) {
    let speedX = 0.001
    let speedZ = 0.001

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


//Funcion que dibuja el powerUP
async function createPowerObj(obj, size) {
    return new Promise(async (resolve) => {
        let x = 0;
        let y = 0;
        let z = 0;
        x = bodyErase.position.x
        y = bodyErase.position.y
        z = bodyErase.position.z
        let power = await loadObjMtl(obj, powerUpsList, x, y, z, grupopowerUps, size, size, size)
        resolve(power)
    })
}

//Funcion que crea los powerups con probablidad
async function createPowerUp(){
    let k = getRandomInt(0,101)
    console.log("K: ", k)
    if (k > 0 && k < 6){
        console.log("Entro al hongo")
        hongo = await createPowerObj(objMtlModelUrlPower1, 0.3)        
    } else if(k > 5 && k < 11) {
        console.log("Entro al medical")
        let medical = await createPowerObj(objMtlModelUrlPower2 , 0.3)
    } else if(k > 10 && k < 16) {
        console.log("Entro al multiball")
        let esferas = await createPowerObj(objMtlModelUrlPower3, 0.001)
    }
}

//Funcion que activa el powerup 1
async function powerUp1(){    
    let powerUp = grupoPowerBox.pop();
    let mesh = powerUpsList.pop();
    powerUp.visible = false;
    world.removeBody(powerUp)
    mesh.position.x = 100
    //Duplica el tamaño del jugador
    jugadorID.player.visible = false;
    world.removeBody(jugadorID)

    jugador = createPlayer(5 * 2, 1, 5 * 2, "img/ladrillo_morado.jpg", grupoJugador);

    //Esperar 10 segundos
    await delay(10)

    //Regresa al tamaño original
    jugadorID.player.visible = false;
    world.removeBody(jugadorID)

    jugador = createPlayer(5, 1, 5, "img/ladrillo_morado.jpg", grupoJugador);

}


//Funcion que activa el powerup2
async function powerUp2(){
    let powerUp = grupoPowerBox.pop();
    let mesh = powerUpsList.pop();
    powerUp.visible = false;
    world.removeBody(powerUp)
    mesh.position.x = 100
    console.log("espero ver",powerUp)

    vidas += 1   
}

//Funcion quue activa el powerup 3
async function powerUp3(){
    let powerUp = grupoPowerBox.pop();
    let mesh = powerUpsList.pop();
    powerUp.visible = false;
    world.removeBody(powerUp)
    mesh.position.x = 100
    // Crea las nuevas pelotas
    flagMultiBall = true;
    crearPelota()
    crearPelota()

    //Espera 10 segundos
    await delay(10)
    console.log(ballErase)
    flagMultiBall = false;
    for (let i = 0; i < 3; i++) {
        let pelota = balls.pop()
        let meshes = ballMeshes.pop()
        meshes.visible = false;
        console.log(meshes)
        world.removeBody(pelota);
    }
    crearPelota(dddd)
    ballErase.pop();
    ballErase.pop();

}

//Funcion que se encarga de eliminar las vidas
async function eliminarVida(){
    vidas -= 1;
    
    pelota = balls.pop();
    let meshes = ballMeshes.pop()
    meshes.visible = false;
    world.removeBody(pelota)
    crearPelota()
    
    jugadorID.player.visible = false;
    world.removeBody(jugadorID)

    jugador = createPlayer(5, 1, 5, "img/ladrillo_morado.jpg", grupoJugador);
    console.log("VIDAS:", vidas)

    if(vidas == 0){
        window.location="perder.html";
    }
    flagBottomWall = false;
    return vidas
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
    mapa = createUpperMap(0, 82, 0, 50, 2, 50, "img/ladrillo_rojo.jpg", grupoJuego);
    mapa2 = createMap(0, 30, 20, 50, 100, 2, "img/ladrillo_rojo.jpg", grupoJuego);
    mapa3 = createMap(0, 30, -10, 50, 100, 2, "img/ladrillo_rojo.jpg", grupoJuego);
    mapa4 = createMap(14, 30, 5, 2, 100, 27, "img/ladrillo_rojo.jpg", grupoJuego);
    mapa5 = createMap(-14, 30, 5, 2, 100, 27, "img/ladrillo_rojo.jpg", grupoJuego);
    mapadown = createDownMap(0, -21, 0, 100, 1, 100, "img/ladrillo_rojo.jpg", grupoJuego);

    jugador = createPlayer(5, 1, 5, "img/ladrillo_morado.jpg", grupoJugador);
    
    crearPelota()
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


