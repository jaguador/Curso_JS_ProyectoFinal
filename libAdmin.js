/************************************************
* libAdmin.js: Libreria javasript de admin.html *
* Proyecto Curso Cliente-Servidor Javascript	*
* Julio Aguado Robles							*
* Alumno: al10788								*
************************************************/

// Objeto de clase Admin
var admin;

// Clase Admin
function Admin(nombre) {
	this.nombre = nombre;	// Nombre
	this.usuariosOnline = new Array();	// Lista de usuarios online
	this.peticiones = new Array();		// Lista de peticiones pendientes de atender
	
	this.addUsuarioOnline = addUsuarioOnline;		// Añadir un usuario online
	this.delUsuarioOnline = delUsuarioOnline;		// Eliminar un usuario online
	this.addPeticion = addPeticion;		// Añadir una nueva peticion
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
// Eliminar un usuario conectado de la lista
function delPeticion(usuario, aplicacion, tipo) {
	for (var i in this.peticiones)  {
		if (this.peticiones[i].usuario == usuario && this.peticiones[i].aplicacion == aplicacion && this.peticiones[i].tipo == tipo) {
			this.peticiones.splice(i, 1);
		}
	}
}


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
				alerta('Informacion', 'Enviada la confirmacion de la peticion al usuario '+user, function () {
					$('#peticion_'+user+'_'+app+'_'+tipo).hide('slow', function(){ $('#peticion_'+user+'_'+app+'_'+tipo).remove(); });				
				});
			}
			else
				alerta('Error', 'ATENCION: Ha ocurrido un problema al intentar confirmar la peticion al usuario '+user);
		});
	});
}

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
				alerta('Informacion', 'Enviada la denegacion de la peticion al usuario '+user);
			}
			else
				alerta('Error', 'ATENCION: Ha ocurrido un problema al intentar denegar la peticion al usuario '+user);
		});
	});
}

function inicializaciones() {

	// Rellenar combo de lista de aplicaciones para dialogo de nueva aplicacion
	$.get('/aplicaciones/', function(data) {
		for (var i in data) {
			$('#comboAplicaciones').append(new Option(data[i].literal, data[i].aplicacion));
		}
	});
	
	// Informacion de usuario y boton de desconectar sesion
	$('#userinfo').html("Usuario: <b>"+admin.nombre+"</b> &nbsp;&nbsp;<button id='btndesconectar'></button>");
	$("#btndesconectar").button({
	  icons: {primary: "ui-icon-cancel"},
	  text: false,
	  label: 'Cerrar sesion'
	});	
	$("#btndesconectar").click(function (e) {	// Evento click boton desconectar
		// Envia al servidor peticion de desconexion del usuario
		$.post('/desconectar/'+admin.nombre, function(data) {
			// Si la desconexion se ha realizado con exito
			if (data.resultado == true) { 
				$(location).attr('href',data.url);
			}
			else
				alerta('Error', 'ATENCION: Ha ocurrido un problema al intentar desconectar la sesion');
		});
	});

}
 
 
function muestraAplicacionesUsuario() {
	// Crear el socket de conexion
	socket = io.connect('http://localhost:8080', {'sync disconnect on unload': true });
	// Nueva conexion de usuario
	socket.on('nuevaConexion', function (data) {
		if (data != admin.nombre) {   // No actuar con la conexion del administrador
			admin.addUsuarioOnline({usuario: data, conectado: new Date()});
			alerta('Usuario conectado', 'El usuario '+data+' acaba de iniciar sesion en el sistema', function() {
				var fecha = new Date();
				var botones = "";
				if (data != admin.nombre)
					botones =  "&nbsp;&nbsp;<button class='btnDesconectar' id='btnDesconectar_"+data+"'></button> <button class='btnMensaje' id='btnMensaje_"+data+"'></button>";
				$('#ulUsuariosConectados').prepend("<li id='listaUsuariosOnline_"+data+"' ><b>"+data+"</b> (desde: "+fecha.toLocaleDateString()+" "+fecha.toLocaleTimeString()+")  "+botones+"</li>");
				
				// Fijar evento click a botones desconectar
				fijarBotonesDesconectar();
				// Fijaar evento click a botones de enviar mensaje
				fijarBotonesEnviarMensaje();
				
				$('html,body').animate({scrollTop: $("#listaUsuariosOnline_"+data).offset().top});
				$('#listaUsuariosOnline_'+data).animate({backgroundColor: '#00FF00'}, 1000, function () {
					$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
				});
			});
		}
	});
	// Desconexion desde administrador
	socket.on('nuevaDesconexion', function (data) {
		admin.delUsuarioOnline(data);
		alerta('Usuario desconectado', 'El usuario '+data+' acaba de cerrar sesion en el sistema', function() {
			try {
				$('html,body').animate({scrollTop: $("#listaUsuariosOnline_"+data).offset().top});
				$('#listaUsuariosOnline_'+data).hide('slow', function(){ $('#listaUsuariosOnline_'+data).remove(); });
			} catch(e) {};
		});
	});
	// Llegada de nueva peticion de usuario
	socket.on('nuevapeticion', function (data) {
		admin.addPeticion(data);
		alerta('Nueva peticion', 'Se ha recibido una nueva peticion de <b>'+data.tipo+'</b> por el usuario <b>'+data.usuario+'</b>', function() {
			$('#ulPeticiones').append("<li id='peticion_"+data.usuario+"_"+data.aplicacion+"_"+data.tipo+"'><b>"+data.usuario+"</b>: "+data.literal+" ("+data.tipo+") &nbsp;&nbsp;<button class='btnPeticionOk' id='btnPeticionOk_"+data.usuario+"_"+data.aplicacion+"_"+data.tipo+"'></button> <button class='btnPeticionCancel' id='btnPeticionCancel_"+data.usuario+"_"+data.aplicacion+"_"+data.tipo+"'></button></li>");
			// Fijar evento click a botones confirmar peticion
			fijarBotonesConfirmarPeticion();
			// Fijar evento click a botones de denegar peticion
			fijarBotonesDenegarPeticion();
			$('html,body').animate({scrollTop: $('#peticion_'+data.usuario+'_'+data.aplicacion+'_'+data.tipo).offset().top});
			var color = '#FF0000';
			if (data.tipo == 'Alta') color = '#00FF00';
			if (data.tipo == 'Renovacion') color = '#0000FF';
			$('#peticion_'+data.usuario+'_'+data.aplicacion+'_'+data.tipo).animate({backgroundColor: color}, 1000, function () {
				$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
			});
		});
	});	
	
	// Crear el objeto de la clase usuario pasandole el nombre
	admin =  new Admin($(location).attr('pathname').split('/')[2]);

	// Indicar al socket el nombre de usuario
	socket.emit('setUsuario', admin.nombre);

	// Inicializaciones: cerrar sesion antes de salir, combo lista apps, boton cerrar sesion
	inicializaciones();
	
	// Obtener lista usuarios online
 	$.get('/usuariosonline/', function(data) {
		// Tomar aplicaciones en objeto usuario
		for (var i in data)
			admin.addUsuarioOnline(data[i]);
		$('#pnlAcordeon').append('<h3>Usuarios Online</h3><div id="divOnline"></div>');
		var html = "<ul id='ulUsuariosConectados'>";
		for (var i in admin.usuariosOnline) {
			var fecha = new Date(admin.usuariosOnline[i].conectado);
			var botones = "";
			//alert('data: '+data+', admin.nombre: '+admin.nombre);
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
		// Boton de desconectar
		$("#btnDesconectarTodos").button({
		  icons: {
			primary: "ui-icon-cancel"
		  },
		  text: true,
		  label: 'Desconectar a todos los usuarios'
		});		
		$("#btnDesconectarTodos").click(function (e) {
			var listaUsers = "";
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
		// Boton de desconectar
		$("#btnMensajeTodos").button({
		  icons: {
			primary: "ui-icon-comment"
		  },
		  text: true,
		  label: 'Mensaje a todos los usuarios'
		});		
		$("#btnMensajeTodos").click(function (e) {	// Evento click boton mensaje a usuario
			$( "#dlgMensaje" ).dialog({
			  modal: true,
			  width: 500,
			  buttons: {
				"Aceptar": function() {					
					var listaUsers = "";
					for (var i in admin.usuariosOnline) {
						if (admin.usuariosOnline[i].usuario != admin.nombre) { // Todos menos el administrador
							var user = admin.usuariosOnline[i].usuario; // Usuario a enviar mensaje
							listaUsers += "<br/>"+user;
							// Envia al servidor peticion de desconexion del usuario
							var msg = $('#inputMensaje').val();
							$.post('/mensaje/'+user+'/'+msg, function(data) {
								// En la ultima peticion se muestra dialogo de usuarios desconectados
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
			// Tomar peticiones en objeto usuario
			for (var i in data)
				admin.addPeticion(data[i]);
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

