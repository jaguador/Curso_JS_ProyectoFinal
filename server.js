var fs = require('fs');		// Acceso al sistema de archivos
var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);


server.listen(8080);
console.log('Servidor ejecutandose en http://127.0.0.1:8080/');

// Lectura de datos estaticos para inicializacion (datos de ejemplo)
var usuarios = require('./usuarios.json');
var aplicaciones_json = require('./aplicaciones.json');
var aplicaciones_array = new Array();
for (var i in aplicaciones_json)    // Transformar json a array para búsquedas
	aplicaciones_array[aplicaciones_json[i].aplicacion] = aplicaciones_json[i].literal;
var solicitudesBaja = new Array();
var solicitudesAlta = new Array();
var solicitudesRenovar = new Array();	
var userSockets = new Array();
	
// Lectura de los html estaticos	
var loginWeb = fs.readFileSync('./login.html','utf-8');
var appWeb = fs.readFileSync('./user.html','utf-8');
var adminWeb = fs.readFileSync('./admin.html','utf-8');
var aplicaconTplWeb = fs.readFileSync('./aplicacion_tpl.html','utf-8');
	
// Tiempo de validez de sesion (milisegundos)
var timeout = 900000;   // 15 minutos


/* SOCKET */
io.sockets.on('connection', function (socket) {
	// Tomar el socket segun el nombre de usuario
	socket.on('setUsuario', function (usuario) {
		var autorizacion = validarUsuario(usuario);
		console.log('autorizacion: '+autorizacion.auth);
		if (autorizacion.auth) {
			userSockets[usuario] = socket;
			socket.usuario = usuario;
			if (userSockets['admin'] != undefined) 
				userSockets['admin'].emit('nuevaConexion', usuario);	
		} else {
			var datos = {msg: 'Acceso no autorizado', url: '/'};
			socket.emit('desconectar', datos);
		}
		console.log('------- conectado: '+usuario);
  });
  
	// Borrar el socket y desautorizar al usuario al desconectar
	socket.on('disconnect', function() { 
		console.log('------- desconectado: '+socket.usuario);
		var autorizacion = validarUsuario(socket.usuario);
		if (autorizacion.auth) {
			var i = autorizacion.indice;
			usuarios[i].autorizado = false;
			usuarios[i].ultimoAcceso = Date.now();
			delete userSockets[socket.usuario]; 
			console.log('desconectado: '+socket.usuario);	
			if (userSockets['admin'] != undefined) 
				userSockets['admin'].emit('nuevaDesconexion', socket.usuario);	
		}
	}); 
});




	
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
	if (allow) {
		var recurso = fs.readFileSync(req.params.page);
		res.send(recurso);
	}
});

/* PORTADA */
app.get('/', function (req, res) { 
    res.send(loginWeb);
});

/* PORTADA */
app.get('/aplicacion_tpl', function (req, res) { 
    res.send(aplicaconTplWeb);
});

/* LISTADO DE USUARIOS */
app.get('/usuarios', function (req, res) {   
    res.contentType('application/json');
	var users = new Array();
	for (var i in usuarios) {
		// Filtrar usuario administrador
		if (usuarios[i].usuario != 'admin')
		users[i] = {usuario: usuarios[i].usuario};
	}
    res.send( { usuarios:  users } );
});

/* LISTADO DE APLICACIONES */
app.get('/aplicaciones', function (req, res) {   
    res.send( aplicaciones_json );
});

/* VALIDACION DE USUARIO Y CONTRASEÑA */
app.post('/login/:usuario/:password', function (req, res) {
	var auth = false;
	for (var i in usuarios) {
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
	if (req.params.usuario == "admin")
		res.send({resultado: auth, url: '/admin/'+req.params.usuario});
	else
		res.send({resultado: auth, url: '/app/'+req.params.usuario});

});


/* ACCESO AL PANEL DE ADMINISTRACION */
app.get('/admin/:usuario', function (req, res) {   
	var autorizacion = validarUsuario(req.params.usuario);
	if (autorizacion.auth)
	    res.send(adminWeb);
	else
	    res.send(autorizacion.msg);
});


/* LISTADO DE USUARIOS CONECTADOS */
app.get('/usuariosonline', function (req, res) {   
	var online = new Array();
	for (var i in usuarios) {
		if (usuarios[i].autorizado != undefined) {
			if (usuarios[i].autorizado == true) {
				online[online.length] = {usuario: usuarios[i].usuario, conectado: usuarios[i].ultimoAcceso};
			}
		}
	}
	res.send(online);
});

/* LISTADO DE PETICIONES PENDIENTES DE ATENDER */
app.get('/peticionespendientes', function (req, res) { 
	var solicitudes = new Array();
	for (var i in solicitudesBaja) 
		solicitudes[solicitudes.length] = {usuario: solicitudesBaja[i].usuario, aplicacion: solicitudesBaja[i].aplicacion, literal: aplicaciones_array[solicitudesBaja[i].aplicacion], tipo: 'Baja'};
	for (var i in solicitudesAlta) 
		solicitudes[solicitudes.length] = {usuario: solicitudesAlta[i].usuario, aplicacion: solicitudesAlta[i].aplicacion, literal: aplicaciones_array[solicitudesAlta[i].aplicacion], tipo: 'Alta'};
	for (var i in solicitudesRenovar) 
		solicitudes[solicitudes.length] = {usuario: solicitudesRenovar[i].usuario, aplicacion: solicitudesRenovar[i].aplicacion, literal: aplicaciones_array[solicitudesRenovar[i].aplicacion], tipo: 'Renovacion'};
	res.send(solicitudes);
});

/* ACCESO A LA WEB APLICACION */
app.get('/app/:usuario', function (req, res) {   
	var autorizacion = validarUsuario(req.params.usuario);
	if (autorizacion.auth)
	    res.send(appWeb);
	else {
		console.log(autorizacion.msg);
		var datos = {msg: 'Acceso no autorizado', url: '/'};
//		userSockets[req.params.usuario].emit('desconectar', datos);
	    res.send(autorizacion.msg);
	}
});

/* LISTADO DE APLICACIONES DISPONIBLES DEL USUARIO */
app.get('/aplicacionesusuario/:usuario', function (req, res) {  
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send(autorizacion.msg);
	else {	
		var listaApps = new Array();
		res.contentType('application/json');
		for (var i in usuarios) {
			if (usuarios[i].usuario == req.params.usuario) {
				for (var j in usuarios[i].aplicaciones) {
					listaApps[j] = usuarios[i].aplicaciones[j];
					listaApps[j].literal = aplicaciones_array[listaApps[j].numero];
				}
				// Añadir peticiones pendientes
				for (var j in solicitudesAlta) {
					if (solicitudesAlta[j].usuario == usuarios[i].usuario) 
						listaApps[listaApps.length] = {numero: solicitudesAlta[j].aplicacion, literal:aplicaciones_array[solicitudesAlta[j].aplicacion], caducidad: new Date(), peticion: 'Alta'};
				}
				for (var j in solicitudesBaja) {
					if (solicitudesBaja[j].usuario == usuarios[i].usuario) 
						listaApps[listaApps.length] = {numero: solicitudesBaja[j].aplicacion, literal:aplicaciones_array[solicitudesBaja[j].aplicacion], caducidad: new Date(), peticion: 'Baja'};
				}
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

/* SOLICITAR BAJA DE UNA APLICACION */
app.post('/solicitarbaja/:usuario/:aplicacion', function (req, res) {  
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false, mensaje: autorizacion.msg});
	else {	
		solicitudesBaja[solicitudesBaja.length] = {usuario: req.params.usuario, aplicacion: req.params.aplicacion};
		res.send({resultado: true, mensaje: "Se ha guardado la solicitud de baja. Queda pendiente de revisar por el administrador", aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion]+" (Baja)"});
		if (userSockets['admin'] != undefined) 
			userSockets['admin'].emit('nuevapeticion', {usuario: req.params.usuario, aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion], tipo: 'Baja'});	
	}
});

/* SOLICITAR ALTA EN UNA APLICACION */
app.post('/solicitaralta/:usuario/:aplicacion', function (req, res) {  
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false, mensaje: autorizacion.msg});
	else {	
		var txt = "";
		var result = false;
		var i = autorizacion.indice;
		for (var j in usuarios[i].aplicaciones) {
			if (usuarios[i].aplicaciones[j].numero == req.params.aplicacion)
				txt = "El usuario ya tiene acceso a la aplicación seleccionada. No se ha registrado la petición";
		}
		if (txt == "") {
			for (var j in solicitudesAlta) {
				if (solicitudesAlta[j].usuario == req.params.usuario && solicitudesAlta[j].aplicacion == req.params.aplicacion)
					txt = "El usuario ya tiene registrada una solicitud de acceso a la aplicación";
			}
		}
		if (txt == "") {
			solicitudesAlta[solicitudesAlta.length] = {usuario: req.params.usuario, aplicacion: req.params.aplicacion};
			txt = "Se ha guardado la solicitud de acceso a nueva aplicacion. Queda pendiente de revisar por el administrador";
			result = true;
		}
		res.send({resultado: result, mensaje: txt, aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion]+" (Alta)"});

		if (userSockets['admin'] != undefined) 
			userSockets['admin'].emit('nuevapeticion', {usuario: req.params.usuario, aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion], tipo: 'Alta'});	

		//res.send(txt);
	}
});

/* SOLICITAR RENOVACION EN UNA APLICACION */
app.post('/solicitarrenovacion/:usuario/:aplicacion', function (req, res) {  
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false, mensaje: autorizacion.msg});
	else {	
		solicitudesRenovar[solicitudesRenovar.length] = {usuario: req.params.usuario, aplicacion: req.params.aplicacion};
		res.send({resultado: true, mensaje: "Se ha guardado la solicitud de renovacion de acceso a la aplicacion. Queda pendiente de revisar por el administrador", aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion]+" (Renovacion)"});
		if (userSockets['admin'] != undefined) 
			userSockets['admin'].emit('nuevapeticion', {usuario: req.params.usuario, aplicacion: req.params.aplicacion, literal: aplicaciones_array[req.params.aplicacion], tipo: 'Renovacion'});	
	}
});

/* SOLICITAR DESCONEXION DE LA APLICACION (VUELVE A PANTALLA LOGIN) */
app.post('/desconectar/:usuario', function (req, res) {  
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
/*		var i = autorizacion.indice;
		usuarios[i].autorizado = false;
		usuarios[i].ultimoAcceso = Date.now();
		delete userSockets[req.params.usuario]; 
		console.log('desconectado: '+req.params.usuario);*/
		res.send({resultado: true, url: '/'});
	}
});

/* CONFIRMAR PETICION DE USUARIO POR PARTE DEL ADMINISTRADOR */
app.post('/confirmarpeticion/:usuario/:aplicacion/:tipo', function (req, res) {  
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		var usuario = req.params.usuario;
		var aplicacion = req.params.aplicacion;
		var tipo = req.params.tipo;
		var enviada = false;
		switch (tipo) {
			case "Alta" :   
				// Localizar la solicitud de alta y eliminar
				for (var i in solicitudesAlta) {
					if (solicitudesAlta[i].usuario == usuario && solicitudesAlta[i].aplicacion == aplicacion) {
						var fecha = new Date();    
						fecha.setFullYear(fecha.getFullYear() + 1);  // Fijar fecha de caducidad a 1 año posterior
						var fechatxt = fecha.getDate()+"/"+parseInt(fecha.getMonth()+1)+"/"+fecha.getFullYear();
						userSockets[usuario].emit('peticionconfirmada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion], caducidad: fechatxt}); 
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
						userSockets[usuario].emit('peticionconfirmada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion]}); 
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
						var fecha = new Date();    
						fecha.setFullYear(fecha.getFullYear() + 1);  // Fijar fecha de caducidad a 1 año posterior
						var fechatxt = fecha.getDate()+"/"+parseInt(fecha.getMonth()+1)+"/"+fecha.getFullYear();
						userSockets[usuario].emit('peticionconfirmada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion], caducidad: fechatxt}); 
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
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		var usuario = req.params.usuario;
		var aplicacion = req.params.aplicacion;
		var tipo = req.params.tipo;
		var enviada = false;
		switch (tipo) {
			case "Alta" :   
				// Localizar la solicitud de alta y eliminar
				for (var i in solicitudesAlta) {
					if (solicitudesAlta[i].usuario == usuario && solicitudesAlta[i].aplicacion == aplicacion) {
						userSockets[usuario].emit('peticiondenegada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion]}); 
						solicitudesAlta.splice(i, 1);
						enviada = true;
					}
				}
				break;
			case "Baja" :  
				// localizar la solicitud de baja y eliminar
				for (var i in solicitudesBaja) {
					if (solicitudesBaja[i].usuario == usuario && solicitudesBaja[i].aplicacion == aplicacion) {
						userSockets[usuario].emit('peticiondenegada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion]}); 
						solicitudesBaja.splice(i, 1);
						enviada = true;
					}
				}
				break;
			case "Renovacion" :  
				// Localizar la solicitud de renovar y eliminar
				for (var i in solicitudesRenovar) {
					if (solicitudesRenovar[i].usuario == usuario && solicitudesRenovar[i].aplicacion == aplicacion) {
						userSockets[usuario].emit('peticiondenegada', {tipo: tipo, aplicacion: aplicacion, literal: aplicaciones_array[aplicacion]}); 
						solicitudesRenovar.splice(i, 1);
						enviada = true;
					}
				}
				break;
		}
		res.send({resultado: enviada});
	}
});



/* DESCONEXION DE USUARIO POR PARDE DE ADMINISTRADOR */
app.post('/forzardesconectar/:usuario/:msg', function (req, res) {  
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		var datos = {msg: req.params.msg, url: '/'};
		userSockets[req.params.usuario].emit('desconectar', datos); 
		res.send({resultado: true, url: '/'});
	}
});

/* ENVIAR MENSAJE A USUARIO */
app.post('/mensaje/:usuario/:msg', function (req, res) {  
	var autorizacion = validarUsuario(req.params.usuario);
	if (!autorizacion.auth)
	    res.send({resultado: false});
	else {	
		userSockets[req.params.usuario].emit('mensaje', req.params.msg); 
		res.send({resultado: true});
	}
});

function validarUsuario(user) {
	var resultado = {};
	resultado.auth = false;
	resultado.msg = "Acceso Denegado: No se ha encontrado el usuario. <br/>Volver a pantalla de <b><a href='/'>Login</a></b>";
	resultado.indice = -1;
	for (var i in usuarios) {
		if (usuarios[i].usuario == user) {
			resultado.indice = i;
			if (usuarios[i].autorizado == undefined)
				resultado.msg = "Acceso denegado: No se ha autorizado el acceso. <br/>Volver a pantalla de <b><a href='/'>Login</a></b>";
			else {
				if (usuarios[i].autorizado == false) 
					resultado.msg = "Acceso denegado: No se ha autorizado el acceso.  <br/>Volver a pantalla de <b><a href='/'>Login</a></b>";
				else {
					var tiempo = Date.now() - usuarios[i].ultimoAcceso;
					if (tiempo > timeout)
						resultado.msg = "Acceso denegado: Se ha superado el tiempo de inactividad.  <br/>Volver a pantalla de <b><a href='/'>Login</a></b>";
					else
						resultado.auth = true;
				}
			}
			break;
		}
	}	
	return resultado;
}


