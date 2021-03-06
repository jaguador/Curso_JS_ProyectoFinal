Curso_JS_ProyectoFinal
======================

<h1>Curso "Programación cliente-servidor en Javascript"</h1>
<h2>Proyecto final: Intranet de usuarios y panel de administración</h2>
<hr>
<h3>Aspectos tecnológicos</h3>
<ul>
<li>Módulos node.js utilizados: 
        <ul>
                <li><b>fs</b>: Para acceso al sistema de ficheros para leer páginas html básicas del sistema</li>
                <li><b>express</b>: Módulo empleado para el diseño de la interfaz REST</li>
                <li><b>http</b>: Módulo básico para la creación del servidor web que sirva las páginas html resultantes</li>
                <li><b>socket.io</b>: Facilita la creación y gestión de WebSocket que utilizo para comunicar usuarios y administrador al vuelo </li>
                <li><b>restler</b>: Gestión de interfaces REST en la parte del cliente</li>
                <li><b>optimist</b>: Módulo que facilita la gestión de parámetros en las llamdas a programas node.js en línea de comandos</li>
        </ul>
</li>
<li>Librerías javascript y recursos externos: 
        <ul>
                <li><b>jquery.js</b>: Gestión de presentación y eventos de páginas web</li>
                <li><b>jquery-ui.js</b>: Facilita la creación de la interfaz gráfica</li>
                <li><b>jquery-ui.css (cupertino)</b>: Hoja de estilos del theme elegido para la interfaz</li>
                <li><b>socket.io</b>: Librería para la gestión de sockets en la parte del cliente web</li>
        </ul>
</li>
<li>Recursos propios: 
        <ul>
                <li><b>libLogin.js</b>: Librería javascript empleada en la página web de inicio de login de usuario</li>
                <li><b>libAdmin.js</b>: Librería para la gestión del panel de administración</li>
                <li><b>libUser.js</b>: Librería para la gestión de la aplicación que supone la intranet del usuario</li>
                <li><b>estilos.css</b>: Hoja de estilos propios</li>
        </ul>
</li>
<li>Acceso a datos: Para partir de unos datos mínimos en los que poder realizar las pruebas, se han definido un par de ficheros de datos json que el servidor leerá cada vez que arranque:
        <ul>
                <li><b>aplicaciones.json</b>: Listado de aplicaciones disponibles en el sistema indicando su número de aplicación y nombre (literal)</li>
                <li><b>usuarios.json</b>: Listado de usuarios del sistema con su nombre de usuario, contraseña y lista de aplicaciones con privilegios del usuario indicando su fecha de caducidad</li>
        </ul>
        Estos datos se cargarán en memoria al iniciar el servidor y se mantienen a lo largo de la ejecución del mismo. Esta 'licencia' se ha tomado únicamente para el entorno de este proyecto ya que en un entorno de producción se introduciría una capa de acceso a bases de datos donde se almacenaría la información y sobre la que se realizarían las diferentes lecturas y/o actualizaciones de datos. 
</li>
</ul>
<br/>
<h2>Documentación</h2>
<p>A continuación se describirán las diferentes secciones de las que se compone el proyecto:</p>
<h3>Acceso al sistema: Login</h3>
<p>Al cargar la url principal de acceso al sistema se presenta la pantalla de login en la cual se mostrarán los usuarios disponibles y habrá que seleccionar el usuario con el que se desea acceder al sistema e introducir su password (en este caso el password es el mismo que el número de usuario) y pulsar la tecla 'Enter'. Igualmente, en la parte inferior, se muestra el acceso para el usuario administrador del sistema (con password admin)</p>
</br>
<h3>Panel de Administración</h3>
<p>Cuando el usuario administrador inicia sesión en el sistema, automáticamente se le redirecciona al panel de administración. En dicho panel se podrán diferenciar los 2 grupos de acciones principales que podrá gestionar:</p>
<ul>
<li><b>Usuarios conectados:</b> En esta sección se muestran todos los usuarios que hay conectados actualmente en el sistema, así como la fecha y hora en la que se conectó. Sobre cada uno de ellos podrá realizar 2 acciones con sendos botones: <b>Desconectar</b> al usuario del sistema o enviarle un <b>mensaje</b> (se mostrará una ventana nueva para introducir el texto del mensaje). Al final de la lista de usuarios conectados aparecerán 2 botones adicionales que permitirán desconectar o enviar un mensaje a <b>todos</b> los usuarios actualmente conectados</li>
<li><b>Peticiones Pendientes:</b> Se muestran una lista con todas las peticiones de los usuarios que están pendientes para ser atendidas. En cada petición se informa del usuario que la realiza, la aplicación que solicita y el tipo de petición (Alta, Baja o Renovación de privilegios). El administrador tendrá 2 opciones en cada petición: <b>aceptar</b> la misma o <b>denegar</b> dicha petición</li>
</ul>
<p>Tanto la lista de usuarios como la de peticiones pendientes de atender se actualizan online, es decir esta se modifica cada vez que se conecta/desconecta un usuario o cada vez que se reciba una nueva petición por parte de un usuario</p>
<p>En la parte superior derecha se muestra el nombre del usuario administrador y un botón para cerrar la sesión del administrador</p>
</br>
<h3>Acceso de Usuario: Intranet</h3>
<p>Al hacer login los usuarios del sistema serán redireccionados a la Intranet Municipal, en la cual se le mostrarán las aplicaciones y peticiones disponibles según la siguiente clasificación:</p>
<ul>
<li><b>Aplicaciones Activas:</b> Se muestra la lista de aplicaciones que tiene disponibles el usuario y que a fecha de hoy aún tiene acceso. Al pinchar sobre cada una de dichas aplicaciones se abrirá una nueva pestaña en la cual se abrirá la aplicación selecionada sobre la que podrá trabajar el usuario (NOTA: Actualmente las aplicaciones se basan en una plantilla común que muestra una serie de trámites y expedientes genéricos sin posibilidad de interacción). El usuario tendrá la posibilida de solicitar la <b>baja</b> de una aplicación mediante su botón correspondiente</li>
<li><b>Aplicaciones Caducadas:</b> Cuando un usuario ha tenido en el pasado acceso a una aplicación pero a dia de hoy sus privilegios ya han caducado, esta se mostrará en una lista aparte en la cual no podrá seleccionarla para acceder. Se le presenta un botón en el cual podrá solicitar una <b>renovación</b> de los privilegios de acceso</li>
<li><b>Solicitudes pendientes:</b> En este apartado aparecerán todas las peticiones que haya realizado el usuario (Alta, Baja o Renovación) y que aún no han sido atendidas por parte del administrador.</li>
</ul>
<p>Al final de la lista de aplicaciones y solicitudes se mostrará un botón a través del cual el usuario podrá solicitar el <b>alta en una nueva aplicación</b>, para lo cual se le mostrará un diálogo con todas las aplicaciones disponibles para que el usuario seleccione una de ellas.</p>
<p>Al igual que sucede con el panel de administración, el usuario recibirá las actualizaciones online, por lo tanto recibirá al vuelo las confirmaciones o denegaciones de las peticiones realizadas por parte del administrador y se actualizarán las diferentes listas automáticamente según el tipo de petición. Igualmente, podrá recibir por parte del administrador mensajes y peticiones de desconexión del sistema.</p>
<p>También dispone en la parte superior derecha su nombre de usuario y un botón para cerrar la sesión de usuario</p>
<br/>
<h3>Interfaz de Cliente en línea de comandos</h3>
<p>Se ha desarrollado un cliente de administración básico en línea de comandos basado en node.js que se suministra con el proyecto: <a href="https://github.com/jaguador/Curso_JS_ProyectoFinal/blob/master/client.js">client.js</a>. Dicho cliente permitirá realizar las siguientes acciones de administración:</p>
<ul>
<li>Ver la lista de usuarios conectados en el sistema actualmente</li>
<li>Desconectar a uno, varios o todos los usuarios actualmente conectados</li>
<li>Enviar un mensaje concreto a uno, varios o todosl los usuarios que están conectados al sistema</li>
</ul>
<p>Las diferentes posibilidades se invocan desde la línea de comandos según unos parámetros establecidos. Dichos parámetros se pueden consultar invocando a la ayuda del programa con "node client.js -h" y son los siguientes: </p>
<pre>
Administracion de usuarios conectados en la aplicacion de intranet municipal.
Options:
  -h, --help         Muestra esta ayuda de uso
  -c, --connect      Indica el servidor y puerto del servidor al que se conectara en formato direcion:puerto [default: "http://rocky-spire-6999.herokuapp.com/:80"]
  -o, --online       Muestra los usuarios actualmente online
  -d, --desconectar  Desconecta los usuarios indicados en el parametro -u
  -m, --mensaje      Envia el mensaje (encerrado entre comillas "") especificado a los usuarios indicados en el parametro -u. Ej: -m="Mensaje a usuarios"
  -u, --usuarios     Indica una lista de usuarios separados por comas(,) a los que aplicar la accion -d(desconectar) o -m(mensaje).Si no se especifica valor en el parametro se aplicara a todos los usuarios conectados. Ej: -u=3556,1497
</pre>
<p>Ejemplos de uso:
<pre>>node client.js -c=http://127.0.0.1:8080 -o</pre> Se conecta al servidor 127.0.0.1 y puerto 8080 y muestra los usuarios actualmente online 
<pre>>node client.js -d -u=3556</pre> Envia señal de desconexión al usuario 3556 (se conecta al servidor establecido por defecto)
<pre>>node client.js -m="Hola usuarios!" -u=3556,7441</pre> Envia mensaje "Hola usuarios!" a los usuarios 3556 y 7441 (si están conectados)
<pre>>node client.js -m="Atención, es la hora" -u</pre> Envia mensaje "Atención, es la hora" a los usuarios actualmente conectados en el sistema
</p>
<p><b>NOTA:</b> Se puede consultar la url y puerto de conexion del cliente al servidor en Heroku en la parte inferior de la interfaz web</p>
<br/>
<br/><br/>
<hr>
<p><b>Julio Aguado Robles<br/>
Usuario GitHub: jaguador<br/> Alumno: al10788</b></p>

