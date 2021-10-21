#3D Brick Game
##Que es el juego
El juego es tomar el juego existente de brick breaker pero ahora hacerlo en 3D en donde el juego tome dentro un objeto de 3D, en este caso el que decidimos usar es un Cubo en donde los jugadores van a tener que navegar moviéndose en dos de los tres ejes para golpear la pelota que se encuentre en los límites del cubo
<p>
  <img src="img\brick.jpg" width="350" alt="Juego original">
</p>
Imagen de brick original
###Objetivo del juego
Destruir todos lo ladrillos dentro del cubo antes de que se acaben las vidas del jugador, para destruir los ladrillos se le necesita golpear por medio de un rebote la pelota que cuando golpee un número determinado de veces (dependiendo del color) el ladrillo este se destruye.
##El juego como tal
La idea para que el jugador pueda ver fácilmente el área de juego es que la cámara se encuentra abajo y el pueda ver desde esa posición el movimiento que hace el bloque para golpear la pelota como se ve en las siguientes imágenes
<p>
  <img src="img\vistaInferior.png" width="350" alt="lateral">
</p>

El canvas del juego muestra las vidas que tiene en ese momento el jugador, el puntaje que lleva y el nivel en el que se encuentra.
<p>
  <img src="img\VistaJugador.png " width="350" alt="vista jugador">
</p>

### Jugador (Diseño inicial)
Aunque aun no se tiene colores el diseño serio basando esta estructura
<p>
  <img src="img\jugador.png " width="350" alt="jugador">
</p>

Vista en el juego y lateral
<p>
  <img src="img\jugador1.png " width="350" alt="jugador">
</p>

<p>
  <img src="img\jugador2.png " width="350" alt="jugador">
</p>


###Ladrillos
Ahora pasamos a los ladrillos, cada color de bloque tiene distintos valores en puntaje y resistencia a golpes, por el momento se tienen estos tres colores
<p>
  <img src="img\vistaLateral.png " width="350" alt="ladrillos">
</p>

<p>
  <img src="img\Brick1.png " width="350" alt="ladrillos">
</p>

<p>
  <img src="img\Brick2.png " width="350" alt="ladrillos">
</p>

Azules
Los azules son los más débiles y solo resisten un golpe
<p>
  <img src="img\brickAzul1.png " width="350" alt="jugador">
</p>

<p>
  <img src="img\brickAzul2.png " width="350" alt="jugador">
</p>

Rojo
Los rojos resisten dos golpes
<p>
  <img src="img\brickRojo1.png " width="350" alt="jugador">
</p>

<p>
  <img src="img\brickRojo2.png " width="350" alt="jugador">
</p>

Amarrillo
Los amarillos son igual de resistentes que los azules, pero sueltan alguno de los power-ups
<p>
  <img src="img\brickAmarillo1.png " width="350" alt="jugador">
</p>

<p>
  <img src="img\brickAmarillo3.png " width="350" alt="jugador">
</p>

###Pelota
La pelota es el objeto principal del juego y este puede moverse en todos los ejes y revisando las librerías las que se parece ser mas simple de usar y nos ayudara con el tema de las colisiones de la pelota es la de cannon https://github.com/pmndrs/cannon-es
<p>
  <img src="img\pelota.png " width="350" alt="jugador">
</p>

###Power-Ups
Actualmente se piensa que habrá tres tipos de power-ups, cuando se destruye un ladrillo de color amarillo aparece uno de los power ups en el ladrillo destruido y este empieza a descender en el cubo y el jugador debe de agarrarlo para que tome en cuenta el power-up
Obtener vida extra
Al agarra el bloque el jugador obtiene una vida extra

Agrandar la barra
Al agarra el bloque la barra del jugador se agranda

Agrandar la pelota
Al agarra el bloque la pelota se agranda
