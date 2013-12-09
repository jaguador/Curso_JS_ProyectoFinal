/************************************************
* libAdmin.js: Libreria javasript de admin.html *
* Proyecto Curso Cliente-Servidor Javascript	*
* Julio Aguado Robles							*
* Alumno: al10788								*
************************************************/

// Url de conexion
var url = window.location.hostname; 

// Objeto de clase Admin
var admin;

/******** Clase Admin ************/
function Admin(nombre) {
	this.nombre = nombre;	// Nombre
	this.usuariosOnline = new Array();	// Lista de usuarios online
	this.peticiones = new Array();		// Lista de peticiones pendientes de atender
	
	this.addUsuarioOnline = addUsuarioOnline;		// Añadir un usuario online
	this.delUsuarioOnline = delUsuarioOnline;		// Eliminar un usuario online
	this.addPeticion = addPeticion;		// Añadir una nueva peticion
	this.delPeticion = delPeticion;		// Elimina una peticion
}
// Añadir objeto de usuario como usuario conectado {usuario: ..., conectado: ...}
function addUsuarioOnline(data) {
	this.usuariosOnline[this.usuariosOnline.length] = data;
}
// Eliminar un usuario conectado de la lista
function delUsuarioOnline(usuario) {
	for (var i in this.usuariosOnline)  {
		if (this.usuariosOnline[i].usuario == usuario) {
			this.usuariosOnline.splice(i, 1);
		}
	}
}
// Toma la lista de peticiones pendientes incluidas en el array data 
function addPeticion(data) {
	this.peticiones[this.peticiones.length] = data;
}
// Eliminar un usuario conectado de la lista (data: usuario, aplicacion, tipo)
function delPeticion(data) {
	for (var i in this.peticiones)  {
		if (this.peticiones[i].usuario == data.usuario && this.peticiones[i].aplicacion == data.aplicacion && this.peticiones[i].tipo == data.tipo) {
			this.peticiones.splice(i, 1);
		}
	}
}

/**********************************/


// Muestra mensaje de alerta con titulo, texto y llama a la funcion callback si se especifica
function alerta(titulo, texto, callback) {
	// Si ya hay un dialogo abierto se cierra
	if ($('#dlgInformacion').is(":visible"))
		$('#dlgInformacion').dialog('close')
	// Titulo y texto del dialogo
	$( "#dlgInformacion" ).attr('title', titulo);
	$( "#dlgInformacion" ).html('<p>'+texto+'</p>');
	$( "#dlgInformacion" ).dialog({
	  modal: true,
	  width: 400,
	  // Antes de cerrar se ejecuta callback si se especifica
	  beforeClose: function (event, ui) {
		if (callback != undefined) 
			callback();
	  }
	});
} 

// Fija las acciones para los botones de desconectar usuarios
function fijarBotonesDesconectar() {
	// Botones de desconectar usuario
	$(".btnDesconectar").button({
	  icons: {
		primary: "ui-icon-cancel"
	  },
	  text: false,
	  label: 'Desconectar usuario'
	});	
	// Evento click del boton de desconectar a un usuario
	$(".btnDesconectar").click(function (e) {	// Evento click boton desconectar usuario
		var user = $(this)[0].id.split('_')[1]; // Usuario a desconectar
		// Envia al servidor peticion de desconexion del usuario
		var msg = 'Desconectado por administrador';
		$.post('/forzardesconectar/'+user+'/'+msg, function(data) {
			// Si la desconexion se ha realizado con exito
			if (data.resultado == true) { 
				alerta('Informacion', 'Enviada peticion de desconexion al usuario '+user);
			}
			else
				alerta('Error', 'ATENCION: Ha ocurrido un problema al intentar desconectar al usuario');
		});
	});
}

// Fija las acciones para los botones de enviar mensaje a usuarios
function fijarBotonesEnviarMensaje() {
	// Botones de enviar mensaje
	$(".btnMensaje").button({
	  icons: {
		primary: "ui-icon-comment"
	  },
	  text: false,
	  label: 'Enviar mensaje a usuario'
	});	
	$(".btnMensaje").click(function (e) {	// Evento click boton mensaje a usuario
		var user = $(this)[0].id.split('_')[1]; // Usuario a enviar mensaje
		// Muestra dialogo para introducir el texto
		$( "#dlgMensaje" ).dialog({
		  modal: true,
		  width: 500,
		  buttons: {
			"Aceptar": function() {					
				// Envia al servidor peticion de desconexion del usuario
				var msg = $('#inputMensaje').val();
				$.post('/mensaje/'+user+'/'+msg, function(data) {
					// Si la desconexion se ha realizado con exito
					$( "#dlgMensaje" ).dialog("close");
					if (data.resultado == true) { 
						alerta('Informacion', 'Mensaje enviado al usuario '+user);
					}
					else
						alerta('Error', 'ATENCION: No ha sido posible enviar el mensaje al usuario. Puede que el usuario no este conectado');
				});
			},
			"Cancelar": function() {
			  $( this ).dialog( "close" );
			}
		  }
		});
	});

}

// Fija las acciones para los botones de confirmar una peticion de usuario
function fijarBotonesConfirmarPeticion() {
	// Botones de confirmar la peticion
	$(".btnPeticionOk").button({
	  icons: {
		primary: "ui-icon-check"
	  },
	  text: false,
	  label: 'Confirmar peticion'
	});	
	$(".btnPeticionOk").click(function (e) {	// Evento click boton confirmar peticion
		var user = $(this)[0].id.split('_')[1]; // Usuario 
		var app = $(this)[0].id.split('_')[2]	// Aplicacion
		var tipo = $(this)[0].id.split('_')[3]	// Tipo
		// Envia al servidor confirmacion de peticion
		$.post('/confirmarpeticion/'+user+'/'+app+'/'+tipo, function(data) {
			// Si la peticion se ha realizado con exito
			if (data.resultado == true) { 
				// Elimina de la lista la peticion
				var data = {usuario: user, aplicacion: app, tipo: tipo};
				admin.delPeticion(data);
				alerta('Informacion', 'Enviada la confirmacion de la peticion al usuario '+user, function () {
					// Se oculta y elimina la peticion
					$('#peticion_'+user+'_'+app+'_'+tipo).hide('slow', function(){ $('#peticion_'+user+'_'+app+'_'+tipo).remove(); });				
				});
			}
			else
				alerta('Error', 'ATENCION: Ha ocurrido un problema al intentar confirmar la peticion al usuario '+user);
		});
	});
}

// Fija las acciones para los botones de denegar una peticion de usuario
function fijarBotonesDenegarPeticion() {			
	// Botones de denegar la peticion
	$(".btnPeticionCancel").button({
	  icons: {
		primary: "ui-icon-circle-close"
	  },
	  text: false,
	  label: 'Denegar peticion'
	});	
	$(".btnPeticionCancel").click(function (e) {	// Evento click boton denegar peticion
		var user = $(this)[0].id.split('_')[1]; // Usuario 
		var app = $(this)[0].id.split('_')[2]	// Aplicacion
		var tipo = $(this)[0].id.split('_')[3]	// Tipo
		// Envia al servidor denegacion de peticion
		$.post('/denegarpeticion/'+user+'/'+app+'/'+tipo, function(data) {
			// Si la denegacion se ha realizado con exito
			if (data.resultado == true) { 
				// Elimina de la lista la peticion
				var data = {usuario: user, aplicacion: app, tipo: tipo};
				admin.delPeticion(data);
				alerta('Informacion', 'Enviada la denegacion de la peticion al usuario '+user, function () {
					// Se oculta y elimina la peticion
					$('#peticion_'+user+'_'+app+'_'+tipo).hide('slow', function(){ $('#peticion_'+user+'_'+app+'_'+tipo).remove(); });				
				});
			}
			else
				alerta('Error', 'ATENCION: Ha ocurrido un problema al intentar denegar la peticion al usuario '+user);
		});
	});
}

// Crea socket de conexion y fija eventos
function creaSocket(usuario) {
	// Crear el socket de conexion con sincronizacion al salir de la web
	socket = io.connect(url, {'sync disconnect on unload': true });
	
	// Al recibir nueva conexion de usuario
	socket.on('nuevaConexion', function (data) {
		 // No actuar con la conexion del administrador
		if (data != admin.nombre) {  
			// Añade nuevo usuario conectado
			admin.addUsuarioOnline({usuario: data, conectado: new Date()});
			// Muestra dialogo de nuevo usuario conectado
			alerta('Usuario conectado', 'El usuario '+data+' acaba de iniciar sesion en el sistema', function() {
				// Añade a la lista de usuarios conectados con la hora de conexion
				var fecha = new Date();
				var botones = "";
				if (data != admin.nombre)
					botones =  "&nbsp;&nbsp;<button class='btnDesconectar' id='btnDesconectar_"+data+"'></button> <button class='btnMensaje' id='btnMensaje_"+data+"'></button>";
				$('#ulUsuariosConectados').prepend("<li id='listaUsuariosOnline_"+data+"' ><b>"+data+"</b> (desde: "+fecha.toLocaleDateString()+" "+fecha.toLocaleTimeString()+")  "+botones+"</li>");
				
				// Fijar evento click a botones desconectar
				fijarBotonesDesconectar();
				// Fijaar evento click a botones de enviar mensaje
				fijarBotonesEnviarMensaje();
				
				// Dirige el scroll al nuevo usuario concectado
				$('html,body').animate({scrollTop: $("#listaUsuariosOnline_"+data).offset().top});
				$('#listaUsuariosOnline_'+data).animate({backgroundColor: '#00FF00'}, 1000, function () {
					$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
				});
			});
		}
	});

	// Al recibir una desconexion de un usuario
	socket.on('nuevaDesconexion', function (data) {
		// Elimina el usuario de usuarios conectados
		admin.delUsuarioOnline(data);
		// Muestra dialogo con la salida del usuario
		alerta('Usuario desconectado', 'El usuario '+data+' acaba de cerrar sesion en el sistema', function() {
			// Scroll a la lista de usuarios desconectados
			$('html,body').animate({scrollTop: $("#listaUsuariosOnline_"+data).offset().top});
			$('#listaUsuariosOnline_'+data).hide('slow', function(){ $('#listaUsuariosOnline_'+data).remove(); });
		});
	});
	
	// Al recibir nueva peticion de un usuario
	socket.on('nuevapeticion', function (data) {
		// Añade a nueva peticion a la lista
		admin.addPeticion(data);
		// Muestra dialogo indicando la nueva peticion
		alerta('Nueva peticion', 'Se ha recibido una nueva peticion de <b>'+data.tipo+'</b> por el usuario <b>'+data.usuario+'</b>', function() {
			// Se añade la nueva peticion a la lista
			$('#ulPeticiones').append("<li id='peticion_"+data.usuario+"_"+data.aplicacion+"_"+data.tipo+"'><b>"+data.usuario+"</b>: "+data.literal+" ("+data.tipo+") &nbsp;&nbsp;<button class='btnPeticionOk' id='btnPeticionOk_"+data.usuario+"_"+data.aplicacion+"_"+data.tipo+"'></button> <button class='btnPeticionCancel' id='btnPeticionCancel_"+data.usuario+"_"+data.aplicacion+"_"+data.tipo+"'></button></li>");
			// Fijar evento click a botones confirmar peticion
			fijarBotonesConfirmarPeticion();
			// Fijar evento click a botones de denegar peticion
			fijarBotonesDenegarPeticion();
			$('html,body').animate({scrollTop: $('#peticion_'+data.usuario+'_'+data.aplicacion+'_'+data.tipo).offset().top});
			var color = '#FF0000';
			if (data.tipo == 'Alta') color = '#00FF00';
			if (data.tipo == 'Renovacion') color = '#0000FF';
			// Scroll a la lista de peticiones
			$('#peticion_'+data.usuario+'_'+data.aplicacion+'_'+data.tipo).animate({backgroundColor: color}, 1000, function () {
				$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
			});
		});
	});	

	// Indicar al socket el nombre de usuario
	socket.emit('setUsuario', usuario);
} 
 
// Inicializar componentes y llamadas jquery 
function initAdmin() {
	// Crear el objeto de la clase admin pasandole el nombre
	admin =  new Admin($(location).attr('pathname').split('/')[2]);

	// Crear socket y escuchar en 
	creaSocket(admin.nombre);
	
	// Informacion de admin y boton de desconectar sesion
	$('#userinfo').html("Usuario: <b>"+admin.nombre+"</b> &nbsp;&nbsp;<button id='btndesconectar'></button>");
	$("#btndesconectar").button({	// Boton cerrar sesion admin
	  icons: {primary: "ui-icon-cancel"},
	  text: false,
	  label: 'Cerrar sesion'
	});	
	$("#btndesconectar").click(function (e) {	// Evento click boton desconectar sesion de admin
		// Envia al servidor peticion de desconexion del admin
		$.post('/desconectar/'+admin.nombre, function(data) {
			// Si la desconexion se ha realizado con exito
			if (data.resultado == true) { 
				$(location).attr('href',data.url);
			}
			else
				alerta('Error', 'ATENCION: Ha ocurrido un problema al intentar desconectar la sesion');
		});
	});
	
	// Obtener lista usuarios online
 	$.get('/usuariosonline/', function(data) {
		// Tomar aplicaciones y añadir a objeto admin
		for (var i in data)
			admin.addUsuarioOnline(data[i]);
		// Panel de usuarios online
		$('#pnlAcordeon').append('<h3>Usuarios Online</h3><div id="divOnline"></div>');
		var html = "<ul id='ulUsuariosConectados'>";
		// Recorre todos los usuarios conectados y crea elemento li
		for (var i in admin.usuariosOnline) {
			var fecha = new Date(admin.usuariosOnline[i].conectado);
			var botones = "";
			if (admin.usuariosOnline[i].usuario != admin.nombre)
				botones =  "&nbsp;&nbsp;<button class='btnDesconectar' id='btnDesconectar_"+admin.usuariosOnline[i].usuario+"'></button> <button class='btnMensaje' id='btnMensaje_"+admin.usuariosOnline[i].usuario+"'></button>";
			html += "<li id='listaUsuariosOnline_"+admin.usuariosOnline[i].usuario+"'><b>"+admin.usuariosOnline[i].usuario+"</b> (desde: "+fecha.toLocaleDateString()+" "+fecha.toLocaleTimeString()+")  "+botones+ "</li>";
		}
		html += "</ul>";
		$('#divOnline').html(html);
		
		// Fijar evento click a botones desconectar
		fijarBotonesDesconectar();
		// Fijaar evento click a botones de enviar mensaje
		fijarBotonesEnviarMensaje();

		// Boton de desconectar a todos los usuarios
		$('#divOnline').append(" <button id='btnDesconectarTodos'>Desconectar a todos los usuarios conectados</button>");
		$("#btnDesconectarTodos").button({
		  icons: {
			primary: "ui-icon-cancel"
		  },
		  text: true,
		  label: 'Desconectar a todos los usuarios'
		});		
		// Evento click de boton desconectar a todos
		$("#btnDesconectarTodos").click(function (e) {
			var listaUsers = "";
			// Recorrer todos los usuarios online
			for (var i in admin.usuariosOnline) {
				if (admin.usuariosOnline[i].usuario != admin.nombre) { // Todos menos el administrador
					var user = admin.usuariosOnline[i].usuario; // Usuario a desconectar
					listaUsers += "<br/>"+user;
					// Envia al servidor peticion de desconexion del usuario
					var msg = 'Desconectado por administrador';
					$.post('/forzardesconectar/'+user+'/'+msg, function(data) {
						// En la ultima peticion se muestra dialogo de usuarios desconectados
						if (i == (admin.usuariosOnline.length -1))
							alerta('Informacion', 'Peticion de desconexion enviada a los usuarios: '+listaUsers);
					});
				}
			}
		});			
		
		// Boton de mensaje a todos los usuarios
		$('#divOnline').append(" &nbsp;&nbsp;<button id='btnMensajeTodos'>Mandar mensaje a todos usuarios</button>");
		$("#btnMensajeTodos").button({
		  icons: {
			primary: "ui-icon-comment"
		  },
		  text: true,
		  label: 'Mensaje a todos los usuarios'
		});		
		// Evento click de enviar mensaje a todos los usuarios
		$("#btnMensajeTodos").click(function (e) {	
			// Dialogo de enviar mensaje
			$( "#dlgMensaje" ).dialog({
			  modal: true,
			  width: 500,
			  buttons: {
				"Aceptar": function() {					
					var listaUsers = "";
					// Recorrer todos los usuarios online
					for (var i in admin.usuariosOnline) {
						if (admin.usuariosOnline[i].usuario != admin.nombre) { // Todos menos el administrador
							var user = admin.usuariosOnline[i].usuario; // Usuario a enviar mensaje
							listaUsers += "<br/>"+user;
							// Envia al servidor mensaje a cada usuario
							var msg = $('#inputMensaje').val();
							$.post('/mensaje/'+user+'/'+msg, function(data) {
								// En la ultima peticion se muestra dialogo de usuarios a los que se ha enviado mensaje
								if (i == (admin.usuariosOnline.length -1))
								// Si la desconexion se ha realizado con exito
								$( "#dlgMensaje" ).dialog("close");
								if (data.resultado == true) { 
									alerta('Informacion', 'Mensaje enviado a los usuarios: '+listaUsers);
								}
								else
									alerta('Error', 'ATENCION: No ha sido posible enviar el mensaje al usuario. Puede que el usuario no este conectado');
							});
						}
					}
				},
				"Cancelar": function() {
				  $( this ).dialog( "close" );
				}
			  }
			});

		});	
		
		// Obtener lista peticiones pendientes
		$.get('/peticionespendientes/', function(data) {
			// Añadir peticiones en objeto admin
			for (var i in data)
				admin.addPeticion(data[i]);
			// Crear elemento de lista con la peticion
			$('#pnlAcordeon').append('<h3>Peticiones Pendientes</h3><div id="divPendientes"></div>');
			var html = "<ul id='ulPeticiones'>";
			for (var i in admin.peticiones) 
				html += "<li id='peticion_"+admin.peticiones[i].usuario+"_"+admin.peticiones[i].aplicacion+"_"+admin.peticiones[i].tipo+"'><b>"+admin.peticiones[i].usuario+"</b>: "+admin.peticiones[i].literal+" ("+admin.peticiones[i].tipo+") &nbsp;&nbsp;<button class='btnPeticionOk' id='btnPeticionOk_"+admin.peticiones[i].usuario+"_"+admin.peticiones[i].aplicacion+"_"+admin.peticiones[i].tipo+"'></button> <button class='btnPeticionCancel' id='btnPeticionCancel_"+admin.peticiones[i].usuario+"_"+admin.peticiones[i].aplicacion+"_"+admin.peticiones[i].tipo+"'></button></li>";
			html += "</ul>";
			$('#divPendientes').html(html);
			$('#pnlAcordeon').accordion({heightStyle: "content"});

			// Fijar evento click a botones confirmar peticion
			fijarBotonesConfirmarPeticion();
			// Fijar evento click a botones de denegar peticion
			fijarBotonesDenegarPeticion();
		});
	});

}

