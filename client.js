/************************************************
* client.js: Cliente node.js                    *
* Proyecto Curso Cliente-Servidor Javascript	*
* Julio Aguado Robles							*
* Alumno: al10788								*
************************************************/

var rest = require('restler');
// Gestion de parametros con optimist
var optimist = require('optimist');
var argv = optimist
    .usage('\n\nAdministracion de usuarios conectados en la aplicacion de intranet municipal.')
    .options('h', {
		alias : 'help',
		describe : 'Muestra esta ayuda de uso',
	})
    .options('c', {
		alias : 'connect',
		describe : 'Indica el servidor y puerto del servidor al que se conectara en formato direcion:puerto',
		default : 'http://al10788-proyecto.herokuapp.com:80'
	})
    .options('o', {
		boolean : true,
		alias : 'online',
		describe : 'Muestra los usuarios actualmente online'
	})    
    .options('d', {
		boolean : true,
		alias :  'desconectar',
		describe :  'Desconecta los usuarios indicados en el parametro -u'
	})
    .options('m', {
		string : true,
		alias :  'mensaje',
		describe : 'Envia el mensaje (encerrado entre comillas "") especificado a los usuarios indicados en el parametro -u. Ej: -m="Mensaje a usuarios"'
	})
	.options('u', {
		string : true,
		alias : 'usuarios',
		describe : 'Indica una lista de usuarios separados por comas(,) a los que aplicar la accion -d(desconectar) o -m(mensaje).Si no se especifica valor en el parametro se aplicara a todos los usuarios conectados. Ej: -u=3556,1497'
	})
    .argv;

var url;   // Url de conexion

// Se muestra ayuda de linea de comandos si se indica ver ayuda
if (argv.h) {
	optimist.showHelp();
	return;
}

// Indicar que se debe introducir opcion valida
if	(!argv.o && !argv.u && !argv.d && !argv.m && !argv.h)  {
	console.log("No se ha indicado una opcion valida. Use 'node client.js -h' para informacion" );
	return;
}

// Tomar la url a conectar que se pasa como parametro (si no se indica la especificada en default)
url = argv.c;
	
/* VER USUARIOS ONLINE */
// Si se indica la opcion para ver los usuarios online -o
if (argv.o) {
	rest.get( url + '/usuariosonline').on('success', function( data ) {
		if (data.length == 0)
			console.log('No hay usuarios conectados en este momento');
		else {
			console.log('Usuarios conectados:');
			for (var i in data) {
				var fecha = new Date(data[i].conectado);
				console.log(data[i].usuario+' (desde: '+fecha.toLocaleDateString()+' '+fecha.toLocaleTimeString()+') ');
			}
		}
	}).on('error' , function (data) {console.log('Se ha producido un error en la conexion al servidor. \nCodigo error: '+data)});  
}

/* DESCONECTAR USUARIOS */
// Si se indica la opcion para desconectar usuarios
if (argv.d) {
	// Se debe especificar los usuarios a desconectar como parametro
	if (!argv.u) {
		console.log("Para desconectar uno o varios usuarios debe indicarlos con el parametro -u. Use 'node client.js -h' para informacion");
		return;
	} else {
		// Se envia la peticion de desconexion a los usuarios indicados
		rest.put( url + '/forzardesconectar/'+argv.u ).on('success', function( data ) {
			// Si no se ha desconectado a nadie
			if (data.length == 0)
				console.log("No se ha encontrado el usuario conectado");
			// Si se ha desconectado se indica los usuarios desconectados
			else {
				console.log('Usuarios a los que se ha enviado la desconexion:');
				for (var i in data) 
					console.log(data[i].nombre);
			}
        }).on('error' , function (data) {console.log('Se ha producido un error en la conexion al servidor. \nCodigo error: '+data.errno)});   	
	}
}

/* ENVIAR MENSAJE A USUARIOS */
// Si se indica la opcion para enviar un mensaje a usuarios
if (argv.m) {
	// Se debe especificar los usuarios a los que enviar mensaje como parametro
	if (!argv.u) {
		console.log("Para enviar un mensaje a uno o varios usuarios debe indicarlos con el parametro -u. Use 'node client.js -h' para informacion");
		return;
	} else {
		// Se envia la peticion de mensaje a los usuarios indicados
		rest.put( url + '/enviarmensaje/'+argv.u+'/'+argv.m).on('success', function( data ) {
			// Si no se ha encontrado a ningun usuario
			if (data.length == 0)
				console.log("No se ha encontrado el usuario al que enviar el mensaje");
			// Si se ha desconectado se indica los usuarios desconectados
			else {
				console.log('Usuarios a los que se ha enviado el mensaje:');
				for (var i in data) 
					console.log(data[i].nombre);
			}
        }).on('error' , function (data) {console.log('Se ha producido un error en la conexion al servidor. \nCodigo error: '+data.errno)});   	
	}
}
