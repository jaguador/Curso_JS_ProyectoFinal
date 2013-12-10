/************************************************
* server.js: Codigo de servidor node.js         *
* Proyecto Curso Cliente-Servidor Javascript	*
* Julio Aguado Robles							*
* Alumno: al10788								*
************************************************/

var fs = require('fs');		// Acceso al sistema de archivos
var app = require('express')();		// Libreria express
var server = require('http').createServer(app);	// Crear servidor
var io = require('socket.io').listen(server);	// Socket escuchando en servidor
var puerto = process.env.PORT || 8080;


// Servidor escuchando en el puerto
server.listen(puerto);
console.log('Servidor ejecutandose en http://127.0.0.1:'+puerto+'/');

// Lectura de datos estaticos para inicializacion (datos de ejemplo)
var usuarios = require('./usuarios.json');		// Listado de usuarios
var aplicaciones_json = require('./aplicaciones.json'); 	// Listado de aplicaciones

// Lectura de los html estaticos	
var loginWeb = fs.readFileSync('./login.html','utf-8');
var appWeb = fs.readFileSync('./user.html','utf-8');
var adminWeb = fs.readFileSync('./admin.html','utf-8');
var aplicaconTplWeb = fs.readFileSync('./aplicacion_tpl.html','utf-8');

// Transformar json a array para búsquedas
var aplicaciones_array = new Array();
for (var i in aplicaciones_json)    
	aplicaciones_array[aplicaciones_json[i].aplicacion] = aplicaciones_json[i].literal;

// Arrays para las solicitudes de altas, renovaciones y bajas
var solicitudesBaja = new Array();
var solicitudesAlta = new Array();
var solicitudesRenovar = new Array();	

// Array para guardar los sockets de los usuarios
var userSockets = new Array();
		
/*  FUNCION AUXILIAR PARA VALIDAR USUARIO CONECTADO (ENTRADA POR LOGIN) */
function validarUsuario(user) {
	var resultado = {};
	resultado.auth = false;
	resultado.msg = "Acceso Denegado: No se ha encontrado el usuario. <br/>Volver a pantalla de <b><a href='/'>Login</a></b>";
	resultado.indice = -1;
	// Buscar el usuario
	for (var i in usuarios) {
		if (usuarios[i].usuario == user) {
			resultado.indice = i;
			// No tiene establecida la propiedad autorizado --> no ha entrado por login
			if (usuarios[i].autorizado == undefined)
				resultado.msg = "Acceso denegado: No se ha autorizado el acceso. <br/>Volver a pantalla de <b><a href='/'>Login</a></b>";
			else {
				// Tiene la propiedad establecida a false
				if (usuarios[i].autorizado == false) 
					resultado.msg = "Acceso denegado: No se ha autorizado el acceso.  <br/>Volver a pantalla de <b><a href='/'>Login</a></b>";
				else 
					resultado.auth = true;
			}
			break;
		}
	}	
	return resultado;
}


/* INICIALIZACION DEL SOCKET: NUEVA CONEXION */
io.sockets.on('connection', function (socket) {	
	// Tomar el socket segun el nombre de usuario
	socket.on('setUsuario', function (usuario) {
		// Comprobar que es conexion valida (ha hecho login)
		var autorizacion = validarUsuario(usuario);
		// Si es valida se guarda socket y se comunica al admin si esta conectado
		if (autorizacion.auth) {
			userSockets[usuario] = socket;
			socket.usuario = usuario;
			if (userSockets['admin'] != undefined) 
				userSockets['admin'].emit('nuevaConexion', usuario);  // Mensaje de nueva conexion al admin
		}
		// Si no es acceso autorizado se comunica y redirecciona a pantalla login		
		else {
			var datos = {msg: 'Acceso no autorizado', url: '/'};
			socket.emit('desconectar', datos);
		}
	});
  
	// Cuando se desconecta: Borrar el socket y desautorizar al usuario al desconectar
	socket.on('disconnect', function() { 
		// Comprobar que es conexion valida (ha hecho login)
		var autorizacion = validarUsuario(socket.usuario);
		// Si es valida se elimina el socket del usuario y se comunica desconexion al admiin
		if (autorizacion.auth) {
			var i = autorizacion.indice;
			usuarios[i].autorizado = false;
			usuarios[i].ultimoAcceso = Date.now();
			delete userSockets[socket.usuario]; 
			// Enviar desconexion de usuario si el admin esta conectado
			if (userSockets['admin'] != undefined) 
				userSockets['admin'].emit('nuevaDesconexion', socket.usuario);	 // Mensaje de desconexion al admin
		}
	}); 
});


/**************** GET ************************/
/* SERVIR RECURSOS */
app.get('/recursos/:page', function (req, res) {
	// Verificar servir solo los recursos permitidos
	var allow = false;
	switch (req.params.page) {
		case 'libLogin.js':
			allow = true;
			res.contentType('text/javascript');
			break;
		case 'libUser.js':
			allow = true;
			res.contentType('text/javascript');
			break;
		case 'libAdmin.js':
			allow = true;
			res.contentType('text/javascript');
			break;
		case 'estilos.css':
			allow = true;
			res.contentType('text/css');
			break;
		default:
			allow = false;
	}
	// Si se permite se sirve
	if (allow) {
		var recurso = fs.readFileSync(req.params.page);
		res.send(recurso);
	}
});

/* ACCESO A PORTADA: PANTALLA DE LOGIN DE USUARIO */
app.get('/', function (req, res) { 
    // Servir html de login
	res.send(loginWeb);
});

/* ENVIAR EL PUERTO DE CONEXION */
app.get('/puerto', function (req, res) { 
    // Servir puerto al que se esta conectado
    res.contentType('application/json');
	res.send({p: puerto});
});




/* ACCESO AL PANEL DE ADMINISTRACION */
app.get('/admin/:usuario', function (req, res) {   
	// Si esta autorizado se sirve html del panel de administracion
	var autorizacion = validarUsuario(req.params.usuario);
	if (autorizacion.auth)
	    res.send(adminWeb);
	// Si no esta autorizado se indica
	else
	    res.send(autorizacion.msg);
});

/* ACCESO A LA WEB DE USUARIO */
app.get('/app/:usuario', function (req, res) {   
	// Comprobar si esta autorizado al acceso se sirve
	var autorizacion = validarUsuario(req.params.usuario);
	if (autorizacion.auth)
	    res.send(appWeb);
	// Si no esta autorizado se indica
	else {
		var datos = {msg: 'Acceso no autorizado', url: '/'};
	    res.send(autorizacion.msg);
	}
});

/* PLANTILLA COMUN DE APLICACION (TABS)*/
app.get('/aplicacion_tpl', function (req, res) { 
    // Servir html de plantilla
	res.send(aplicaconTplWeb);
});

/* OBTENER LISTADO DE TODOS LOS USUARIOS */
app.get('/usuarios', function (req, res) {   
    res.contentType('application/json');
	// Recorrer el json y crear un array de usuarios
	var users = new Array();
	for (var i in usuarios) {
		// Filtrar usuario administrador
		if (usuarios[i].usuario != 'admin')
			users[i] = {usuario: usuarios[i].usuario};
	}
	// Servir array
    res.send( { usuarios:  users } );
});

/* OBTENER LISTADO DE TODAS LAS APLICACIONES */
app.get('/aplicaciones', function (req, res) {   
    // Servir json de aplicaciones
	res.send(aplicaciones_json);
});

/* OBTENER LISTADO DE APLICACIONES DISPONIBLES DEL USUARIO */
app.get('/aplicacionesusuario/:usuario', function (req, res) {  
	// Comprobar si esta autorizado
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send(autorizacion.msg);
	// Si esta autorizado
	else {	
		var listaApps = new Array();
		res.contentType('application/json');
		// Buscar el usuario
		for (var i in usuarios) {
			if (usuarios[i].usuario == req.params.usuario) {
				// Añadir aplicaciones con acceso
				for (var j in usuarios[i].aplicaciones) {
					listaApps[j] = usuarios[i].aplicaciones[j];
					listaApps[j].literal = aplicaciones_array[listaApps[j].numero];
				}
				// Añadir peticiones pendientes de alta
				for (var j in solicitudesAlta) {
					if (solicitudesAlta[j].usuario == usuarios[i].usuario) 
						listaApps[listaApps.length] = {numero: solicitudesAlta[j].aplicacion, literal:aplicaciones_array[solicitudesAlta[j].aplicacion], caducidad: new Date(), peticion: 'Alta'};
				}
				// Añadir peticiones pendientes de baja
				for (var j in solicitudesBaja) {
					if (solicitudesBaja[j].usuario == usuarios[i].usuario) 
						listaApps[listaApps.length] = {numero: solicitudesBaja[j].aplicacion, literal:aplicaciones_array[solicitudesBaja[j].aplicacion], caducidad: new Date(), peticion: 'Baja'};
				}
				// Añadir peticiones pendientes de renovacion
				for (var j in solicitudesRenovar) {
					if (solicitudesRenovar[j].usuario == usuarios[i].usuario) 
						listaApps[listaApps.length] = {numero: solicitudesRenovar[j].aplicacion, literal:aplicaciones_array[solicitudesRenovar[j].aplicacion], caducidad: new Date(), peticion: 'Renovacion'};
				}
				break;
			}
		}
		res.send(listaApps);
	}
});

/* OBTENER LISTADO DE USUARIOS CONECTADOS */
app.get('/usuariosonline', function (req, res) {   
	// Recorrer lista de usuarios y comprobar los autorizados
	var online = new Array();
	for (var i in usuarios) {
		if (usuarios[i].autorizado != undefined) {
			// Si esta autorizado el acceso se añade
			if (usuarios[i].autorizado == true) {
				online[online.length] = {usuario: usuarios[i].usuario, conectado: usuarios[i].ultimoAcceso};
			}
		}
	}
	res.send(online);
});

/* OBTENER LISTADO DE PETICIONES PENDIENTES DE ATENDER */
app.get('/peticionespendientes', function (req, res) { 
	var solicitudes = new Array();
	// Solicitudes de baja
	for (var i in solicitudesBaja) 
		solicitudes[solicitudes.length] = {usuario: solicitudesBaja[i].usuario, aplicacion: solicitudesBaja[i].aplicacion, literal: aplicaciones_array[solicitudesBaja[i].aplicacion], tipo: 'Baja'};
	// Solicitudes de alta
	for (var i in solicitudesAlta) 
		solicitudes[solicitudes.length] = {usuario: solicitudesAlta[i].usuario, aplicacion: solicitudesAlta[i].aplicacion, literal: aplicaciones_array[solicitudesAlta[i].aplicacion], tipo: 'Alta'};
	// Solicitudes de renovacion
	for (var i in solicitudesRenovar) 
		solicitudes[solicitudes.length] = {usuario: solicitudesRenovar[i].usuario, aplicacion: solicitudesRenovar[i].aplicacion, literal: aplicaciones_array[solicitudesRenovar[i].aplicacion], tipo: 'Renovacion'};
	res.send(solicitudes);
});



/***************** POST **********************/
/* PETICION DE ACCESO AL SISTEMA: LOGIN */
app.post('/login/:usuario/:password', function (req, res) {
	// Confirmar si el usuario ya se ha logueado
	var autorizacion = validarUsuario(req.params.usuario);
	// Si ya esta logueado no se permite nueva sesion
	if (autorizacion.auth)
	    res.send({resultado: false, msg: "<p>ATENCION: Ya existe una sesion del usuario en el sistema</p>"});
	else {
		var msg = "<p>ATENCION: La combinacion usuario/password no es correcta. <br>Se ha denegado el acceso</p>";
		var auth = false;
		// Localizar usuario
		for (var i in usuarios) {
			// Comprobar usuario y contraseña y establecer propiedad autorizado
			if (usuarios[i].usuario == req.params.usuario) {
				if (usuarios[i].password == req.params.password) {
					auth = true;
					usuarios[i].autorizado = auth;
					usuarios[i].ultimoAcceso = Date.now();
				} else {
					usuarios[i].autorizado = false;
				}
			}
		}	
		// Redireccion usuario admin --> web admin
		if (req.params.usuario == "admin")
			res.send({resultado: auth, url: '/admin/'+req.params.usuario, msg: msg});
		// Redireccion usuario --> web usuario
		else
			res.send({resultado: auth, url: '/app/'+req.params.usuario, msg: msg});
	}
});

/* REGISTRAR SOLICITUD DE BAJA DE UNA APLICACION */
app.post('/solicitarbaja/:usuario/:aplicacion', function (req, res) {  
	// Confirmar usuario autorizado por login
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false, mensaje: autorizacion.msg});
	// Autorizado
	else {	
		// Guarda solicitud de baja y envia la confirmacion
		solicitudesBaja[solicitudesBaja.length] = {usuario: req.params.usuario, aplicacion: req.params.aplicacion};
		res.send({resultado: true, mensaje: "Se ha guardado la solicitud de baja. Queda pendiente de revisar por el administrador", aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion]+" (Baja)"});

		// Si el administrador esta conectado se le comunica la nueva peticion
		if (userSockets['admin'] != undefined) 
			userSockets['admin'].emit('nuevapeticion', {usuario: req.params.usuario, aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion], tipo: 'Baja'});	
	}
});

/* REGISTRAR SOLICITUD DE ALTA DE UNA APLICACION */
app.post('/solicitaralta/:usuario/:aplicacion', function (req, res) {  
	// Confirmar usuario autorizado por login
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false, mensaje: autorizacion.msg});
	// Autorizado
	else {	
		var txt = "";
		var result = false;
		var i = autorizacion.indice;
		// Comprueba si tiene ya acceso
		for (var j in usuarios[i].aplicaciones) {
			if (usuarios[i].aplicaciones[j].numero == req.params.aplicacion)
				txt = "El usuario ya tiene acceso a la aplicación seleccionada. No se ha registrado la petición";
		}
		if (txt == "") {
			// Comprueba si ya tiene la solicitud
			for (var j in solicitudesAlta) {
				if (solicitudesAlta[j].usuario == req.params.usuario && solicitudesAlta[j].aplicacion == req.params.aplicacion)
					txt = "El usuario ya tiene registrada una solicitud de acceso a la aplicación";
			}
		}
		// Si no hay problema se registra la solicitud y se envia el resultado
		if (txt == "") {
			solicitudesAlta[solicitudesAlta.length] = {usuario: req.params.usuario, aplicacion: req.params.aplicacion};
			txt = "Se ha guardado la solicitud de acceso a nueva aplicacion. Queda pendiente de revisar por el administrador";
			result = true;
		}
		res.send({resultado: result, mensaje: txt, aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion]+" (Alta)"});

		// Si el administrador esta conectado se le comunica la nueva peticion
		if (userSockets['admin'] != undefined) 
			userSockets['admin'].emit('nuevapeticion', {usuario: req.params.usuario, aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion], tipo: 'Alta'});	
	}
});

/* REGISTRAR SOLICITUD DE RENOVACION DE UNA APLICACION */
app.post('/solicitarrenovacion/:usuario/:aplicacion', function (req, res) {  
	// Confirmar usuario autorizado por login
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false, mensaje: autorizacion.msg});
	// Autorizado
	else {	
		// Registrar la solicitud
		solicitudesRenovar[solicitudesRenovar.length] = {usuario: req.params.usuario, aplicacion: req.params.aplicacion};
		res.send({resultado: true, mensaje: "Se ha guardado la solicitud de renovacion de acceso a la aplicacion. Queda pendiente de revisar por el administrador", aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion]+" (Renovacion)"});

		// Si el administrador esta conectado se le comunica la nueva peticion
		if (userSockets['admin'] != undefined) 
			userSockets['admin'].emit('nuevapeticion', {usuario: req.params.usuario, aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion], tipo: 'Renovacion'});	
	}
});

/* SOLICITAR DESCONEXION DEL PROPIO USUARIO (VUELVE A PANTALLA LOGIN) */
app.post('/desconectar/:usuario', function (req, res) {  	
	// Confirmar usuario autorizado por login
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		// Establece la propiedad autorizado a false
/*		for (var i in usuarios) 
			if (usuarios[i].usuario == req.params.usuario) 
				usuarios[i].autorizado = false;
		// Redirecciona a pantalla de login
*/		res.send({resultado: true, url: '/'});
	}
});

/* CONFIRMAR PETICION DE USUARIO POR PARTE DEL ADMINISTRADOR */
app.post('/confirmarpeticion/:usuario/:aplicacion/:tipo', function (req, res) {  
	// Confirmar usuario autorizado por login
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		var usuario = req.params.usuario;
		var aplicacion = req.params.aplicacion;
		var tipo = req.params.tipo;
		var enviada = false;
		// Actuar segun el tipo de de peticion
		switch (tipo) {
			case "Alta" :   
				// Localizar la solicitud de alta y eliminar
				for (var i in solicitudesAlta) {
					if (solicitudesAlta[i].usuario == usuario && solicitudesAlta[i].aplicacion == aplicacion) {
						// Fijar fecha de caducidad a 1 año posterior
						var fecha = new Date();    
						fecha.setFullYear(fecha.getFullYear() + 1);  
						var fechatxt = fecha.getDate()+"/"+parseInt(fecha.getMonth()+1)+"/"+fecha.getFullYear();
						// Comunicar al usuario la aceptacion de la peticion
						if (userSockets[usuario] != undefined)
							userSockets[usuario].emit('peticionconfirmada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion], caducidad: fechatxt}); 
						// Eliminar la solicitud de alta del array
						solicitudesAlta.splice(i, 1);
						enviada = true;
						// Añadir la aplicacion como activa para el usuario
						for (var j in usuarios)
							if (usuarios[j].usuario == usuario) 
								usuarios[j].aplicaciones[usuarios[j].aplicaciones.length] = {numero: aplicacion, caducidad: fechatxt};
					}
				}
				break;
			case "Baja" :  
				// localizar la solicitud de baja y eliminar
				for (var i in solicitudesBaja) {
					if (solicitudesBaja[i].usuario == usuario && solicitudesBaja[i].aplicacion == aplicacion) {
						// Comunicar al usuario la aceptacion de la peticion
						if (userSockets[usuario] != undefined)
							userSockets[usuario].emit('peticionconfirmada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion]}); 
						// Eliminar la solicitud de baja del array
						solicitudesBaja.splice(i, 1);
						enviada = true;
						// Eliminar la aplicacion de la lista de aplicaciones activas del usuario
						for (var j in usuarios) 
							if (usuarios[j].usuario == usuario) 
								for (var k in usuarios[j].aplicaciones)
									if (usuarios[j].aplicaciones[j].numero == aplicacion)
										usuarios[j].aplicaciones.splice(k, 1);
					}
				}
				break;
			case "Renovacion" :  
				// Localizar la solicitud de renovar y eliminar
				for (var i in solicitudesRenovar) {
					if (solicitudesRenovar[i].usuario == usuario && solicitudesRenovar[i].aplicacion == aplicacion) {
						// Fijar fecha de caducidad a 1 año posterior
						var fecha = new Date();    
						fecha.setFullYear(fecha.getFullYear() + 1);  
						var fechatxt = fecha.getDate()+"/"+parseInt(fecha.getMonth()+1)+"/"+fecha.getFullYear();
						// Comunicar al usuario la aceptacion de la peticion
						if (userSockets[usuario] != undefined)
							userSockets[usuario].emit('peticionconfirmada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion], caducidad: fechatxt}); 
						// Eliminar la solicitud de renovacion del array
						solicitudesRenovar.splice(i, 1);
						enviada = true;
						// Modificar la fecha de caducidad de la aplicacion
						for (var j in usuarios)
							if (usuarios[j].usuario == usuario) 
								for (var k in usuarios[j].aplicaciones)
									if (usuarios[j].aplicaciones[j].numero == aplicacion)
										usuarios[j].aplicaciones[k].caducidad = fechatxt;						
					}
				}
				break;
		}
		res.send({resultado: enviada});
	}
});

/* DENEGAR PETICION DE USUARIO POR PARTE DEL ADMINISTRADOR */
app.post('/denegarpeticion/:usuario/:aplicacion/:tipo', function (req, res) {  
	// Confirmar usuario autorizado por login
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		var usuario = req.params.usuario;
		var aplicacion = req.params.aplicacion;
		var tipo = req.params.tipo;
		var enviada = false;
		// Segun el tipo de peticion
		switch (tipo) {
			case "Alta" :   
				// Localizar la solicitud de alta y eliminar
				for (var i in solicitudesAlta) {
					if (solicitudesAlta[i].usuario == usuario && solicitudesAlta[i].aplicacion == aplicacion) {
						// Comunicar al usuario la denegacion de la peticion
						if (userSockets[usuario] != undefined)
							userSockets[usuario].emit('peticiondenegada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion]}); 
						// Eliminar la solicitud del array
						solicitudesAlta.splice(i, 1);
						enviada = true;
					}
				}
				break;
			case "Baja" :  
				// Localizar la solicitud de baja y eliminar
				for (var i in solicitudesBaja) {
					if (solicitudesBaja[i].usuario == usuario && solicitudesBaja[i].aplicacion == aplicacion) {
						// Comunicar al usuario la denegacion de la peticion
						if (userSockets[usuario] != undefined) 
							userSockets[usuario].emit('peticiondenegada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion]}); 
						// Eliminar la solicitud del array 
						solicitudesBaja.splice(i, 1);
						enviada = true;
					}
				}
				break;
			case "Renovacion" :  
				// Localizar la solicitud de renovar y eliminar
				for (var i in solicitudesRenovar) {
					if (solicitudesRenovar[i].usuario == usuario && solicitudesRenovar[i].aplicacion == aplicacion) {
						// Comunicar al usuario la denegacion de la peticion
						if (userSockets[usuario] != undefined)
							userSockets[usuario].emit('peticiondenegada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion]}); 
						// eliminar la solicitud del array
						solicitudesRenovar.splice(i, 1);
						enviada = true;
					}
				}
				break;
		}
		res.send({resultado: enviada});
	}
});

/* DESCONEXION DE USUARIO POR PARTE DE ADMINISTRADOR */
app.post('/forzardesconectar/:usuario/:msg', function (req, res) {  
	// Confirmar usuario autorizado por login
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		var datos = {msg: req.params.msg, url: '/'};
		// Comunicar al usuario la desconexion
		if (userSockets[req.params.usuario] != undefined)
			userSockets[req.params.usuario].emit('desconectar', datos); 
		res.send({resultado: true, url: '/'});
	}
});

/* ENVIAR MENSAJE A USUARIO */
app.post('/mensaje/:usuario/:msg', function (req, res) {  
	// Confirmar usuario autorizado por login
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		// Comunicar al usuario el mensaje
		if (userSockets[req.params.usuario] != undefined)
			userSockets[req.params.usuario].emit('mensaje', req.params.msg); 
		res.send({resultado: true});
	}
});


/***************** PUT **********************/
/* DESCONEXION DE USUARIO/S POR PARTE DE ADMINISTRADOR EN CLIENT.JS */
app.put('/forzardesconectar/:usuario', function (req, res) {  
	var msg = "Desconectado por parte del administrador en linea de comandos";
	var arrayUsuarios = new Array();   // Usuarios a desconectar
	var lstUsuarios = new Array();
	
	// Si el parametro usuario es 'true' se desconectan todos
	if (req.params.usuario == 'true' ) arrayUsuarios[0] = "";
	// En caso contrario se especifica lista de usuarios separados por ,
	else arrayUsuarios = req.params.usuario.split(',');   

	// Recorrer los usuarios 	
	for (var i in usuarios) {
		var encontrado = false;
		// Si se listan todos se mira si esta conectado
		if (arrayUsuarios[0] == "") {
			// Si esta online el usuario
			if (usuarios[i].autorizado != undefined) {
				if (usuarios[i].autorizado == true) {
					// Si tiene creado su socket se toma
					if (userSockets[usuarios[i].usuario] != undefined) 
						encontrado = true;
				}
			}
		} 
		// Si se especifican usuarios se mira si el usuario esta en la lista que se pasa como parametro
		else {
			for (var j in arrayUsuarios) {
				// Buscar cada usuario si esta conectado
				if (usuarios[i].usuario == arrayUsuarios[j]) {
					// Si esta online el usuario
					if (usuarios[i].autorizado != undefined) {
						if (usuarios[i].autorizado == true) {
							// Si tiene creado su socket se toma
							if (userSockets[usuarios[i].usuario] != undefined) {
								encontrado = true;
							}
						}
					}
					break;
				}
			}
		}
		// Si se ha encontrado el ususario y esta conectado se emite la desconexion
		if (encontrado) {
			var datos = {msg: msg, url: '/'};
			userSockets[usuarios[i].usuario].emit('desconectar', datos); 
			lstUsuarios[lstUsuarios.length] = {nombre: usuarios[i].usuario};
		}
	}

	// Enviar los usuarios que se han desconectado
	res.send(lstUsuarios);
});

/* ENVIAR MENSAJE A USUARIOS POR PARTE DE ADMINISTRADOR EN CLIENT.JS */
app.put('/enviarmensaje/:usuario/:mensaje', function (req, res) {  
	var msg = req.params.mensaje;
	var arrayUsuarios = new Array();   // Usuarios a los que enviar mensaje
	var lstUsuarios = new Array();
	
	// Si el parametro usuario es 'true' se envia a todos
	if (req.params.usuario == 'true' ) arrayUsuarios[0] = "";
	// En caso contrario se especifica lista de usuarios separados por ,
	else arrayUsuarios = req.params.usuario.split(',');   

	// Recorrer los usuarios 	
	for (var i in usuarios) {
		var encontrado = false;
		// Si se listan todos se mira si esta conectado
		if (arrayUsuarios[0] == "") {
			// Si esta online el usuario 
			if (usuarios[i].autorizado != undefined) {
				if (usuarios[i].autorizado == true) {
					// Si tiene creado su socket se toma
					if (userSockets[usuarios[i].usuario] != undefined) 
						encontrado = true;
				}
			}
		} 
		// Si se especifican usuarios se mira si el usuario esta en la lista que se pasa como parametro
		else {
			for (var j in arrayUsuarios) {
				// Buscar cada usuario si esta conectado
				if (usuarios[i].usuario == arrayUsuarios[j]) {
					// Si esta online el usuario 
					if (usuarios[i].autorizado != undefined) {
						if (usuarios[i].autorizado == true) {
							// Si tiene creado su socket se toma
							if (userSockets[usuarios[i].usuario] != undefined) {
								encontrado = true;
							}
						}
					}
					break;
				}
			}
		}
		// Si se ha encontrado el ususario y esta conectado se emite la desconexion
		if (encontrado) {
			userSockets[usuarios[i].usuario].emit('mensaje', msg); 
			lstUsuarios[lstUsuarios.length] = {nombre: usuarios[i].usuario};
		}
	}

	// Enviar los usuarios a los que se ha emitido el mensaje
	res.send(lstUsuarios);
});

