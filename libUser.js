/************************************************
* libUser.js: Libreria javasript de user.html   *
* Proyecto Curso Cliente-Servidor Javascript	*
* Julio Aguado Robles							*
* Alumno: al10788								*
************************************************/

// Socket de conexion
var socket;

// Url de conexion
var url = window.location.hostname; 

// Objeto de clase Usuario
var usuario;

/******* CLASE USUARIO ***************/
function Usuario(nombre) {
	this.nombre = nombre;		// Nombre del usuario
	this.apps = new Array();	// Lista de aplicaciones activas, caducadas y solicitudes
		this.apps['activas'] = new Array();
		this.apps['caducadas'] = new Array();
		this.apps['solicitudes'] = new Array();
	
	this.addAplicacion = addAplicacion;		// Añadir aplicacion o peticion del usuario
	this.delAplicacion = delAplicacion;		// Tomar en array apps la lista de aplicaciones disponibles del usuario
}
// Añade una aplicacion a la lista del usuario incluidas en el array data (incluye tanto aplicaciones disponibles como peticiones)
function addAplicacion(data) {
	// Filtrar las peticiones de aplicaciones para quedarnos solo con aplicaciones con acceso
	if (data.peticion == undefined) {
		// Tomar fecha de caducidad
		var caducidad = data.caducidad.split('/');
		var fecha_caducidad = new Date(parseInt(caducidad[2]), parseInt(caducidad[1])-1, parseInt(caducidad[0]));
		var hoy = new Date();
		// Si la fecha de caducidad es posterior -> aplicacion activa
		if (fecha_caducidad > hoy) 
			this.apps['activas'][data.numero] = {literal: data.literal, numero: data.numero, caducidad: data.caducidad};
		// fecha de caducidad anterior -> aplicacion caducada
		else
			this.apps['caducadas'][data.numero] = {literal: data.literal, numero: data.numero, caducidad: data.caducidad};		
	} 
	// Se toman tambien las solicitudes
	else 
		this.apps['solicitudes'][data.numero] = {literal: data.literal, numero: data.numero, peticion: data.peticion};
}
// Elimina una aplicacion de la lista (activa, caducada o solicitudes segun data.tipo)
function delAplicacion(data) {
	// Localiza la aplicacion o peticion y elimina
	for (var i in this.apps[data.tipo])
		if (this.apps[data.tipo][i].numero == data.aplicacion)
			this.apps[data.tipo].splice(i, 1);
}

/***************************************/


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

// Inicializar boton para cerrar sesion de usuario
function initBtnCerrarSesion() {
	// Informacion de usuario y boton de desconectar sesion
	$('#userinfo').html("Usuario: <b>"+usuario.nombre+"</b> &nbsp;&nbsp;<button id='btndesconectar'></button>");
	$("#btndesconectar").button({
	  icons: {primary: "ui-icon-cancel"},
	  text: false,
	  label: 'Cerrar sesion'
	});	
	// Evento click boton desconectar
	$("#btndesconectar").click(function (e) {	
		// Envia al servidor peticion de desconexion del usuario
		$.post('/desconectar/'+usuario.nombre, function(data) {
			// Si la desconexion se ha realizado con exito
			if (data.resultado == true) { 
				$(location).attr('href',data.url);
			}
			else
				alerta('Error', 'ATENCION: Ha ocurrido un problema al intentar desconectar la sesion');
		});
	});

}
 
// Creacion del socket y fijar eventos 
function crearSocket(nombre) {
	// Crear el socket de conexion (con parametro para desconectarse al salir de la web)
	socket = io.connect(url, {
		'sync disconnect on unload': true,
		transports:['websocket', 'flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'],
		rememberTransport:false
	}); 
	// Al recibir peticion de desconexion enviada desde administrador
	socket.on('desconectar', function (data) {
		// Muestra alerta y sale a login
		alerta('Usuario desconectado', data.msg, function () {
			$(location).attr('href',data.url);
		});
	});
	// Recibido mensaje desde administrador
	socket.on('mensaje', function (data) {
		alerta('Mensaje del administrador', data);
	});
	// Peticion confirmada del administrador
	socket.on('peticionconfirmada', function (data) {
		var tipo = data.tipo;
		var literal = data.literal;
		var aplicacion = data.aplicacion;
		var caducidad = data.caducidad;
		// Muestra mensaje de peticion confirmada
		alerta('Peticion confirmada', "La peticion de <b>"+tipo+"</b> en la aplicacion <b>"+literal+"</b> ha sido confirmada por el administrador", function () {
			switch (tipo) {
				case "Alta" :  // PETICION DE ALTA
					// Eliminar el div de la solicitud pendiente
					$('#divSolicitud_'+aplicacion).hide('slow', function(){ $('#divSolicitud_'+aplicacion).remove(); });				
					// Eliminar la solicitud
					var datasolicitud = {tipo: 'solicitudes', aplicacion: aplicacion};
					usuario.delAplicacion(datasolicitud);
					// Incluir la aplicacion en aplicaciones activas
					var data2 = {numero:aplicacion, caducidad: caducidad, literal: literal};
					usuario.addAplicacion(data2);
					addAplicacionActiva(aplicacion, literal, caducidad);
					fijarBotonesSolicitarBaja();
					$('html,body').animate({scrollTop: $('#spanActivas').offset().top});
					$('#divAlta_'+data.aplicacion).animate({backgroundColor: '#00FF00'}, 1000, function () {
						$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
					});
					break;
				case "Baja" :	// PETICION DE BAJA
					// Eliminar el div de la solicitud pendiente
					$('#divSolicitud_'+aplicacion).hide('slow', function(){ $('#divSolicitud_'+aplicacion).remove(); });
					// Eliminar la solicitud
					var datasolicitud = {tipo: 'solicitudes', aplicacion: aplicacion};
					usuario.delAplicacion(datasolicitud);
					// Eliminar la aplicacion de aplicaciones activas
					var data2 = {tipo: 'activas', aplicacion: aplicacion};
					usuario.delAplicacion(data2);
					$('#divAlta_'+aplicacion).hide('slow', function(){ $('#divAlta_'+aplicacion).remove(); });			
					// Si esta el tab abierto se elimina tambien
					if ($('#litab_'+aplicacion).length) {
						$('#litab_'+aplicacion).remove();
						$( "#tabs" ).tabs( "refresh" );
					}
					break;
				case "Renovacion" :     // PETICION DE RENOVACION
					// Eliminar el div de la solicitud pendiente
					$('#divSolicitud_'+aplicacion).hide('slow', function(){ $('#divSolicitud_'+aplicacion).remove(); });
					// Eliminar la solicitud
					var datasolicitud = {tipo: 'solicitudes', aplicacion: aplicacion};
					usuario.delAplicacion(datasolicitud);
					// Eliminar la aplicacion de aplicaciones caducadas
					var data2 = {tipo: 'caducadas', aplicacion: aplicacion};
					usuario.delAplicacion(data2);
					$('#divCaducada_'+aplicacion).hide('slow', function(){ $('#divCaducada_'+aplicacion).remove(); });			
					// Incluir la aplicacion en aplicaciones activas
					var data3 = {numero:aplicacion, caducidad: caducidad, literal: literal};
					usuario.addAplicacion(data3);
					addAplicacionActiva(aplicacion, literal, caducidad);
					fijarBotonesSolicitarBaja();
					$('html,body').animate({scrollTop: $('#spanActivas').offset().top});
					$('#divAlta_'+data.aplicacion).animate({backgroundColor: '#00FF00'}, 1000, function () {
						$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
					});
					break;
			}
		});
	
	});	
	// Recibe la denegacion de una peticion
	socket.on('peticiondenegada', function (data) {
		var tipo = data.tipo;
		var literal = data.literal;
		var aplicacion = data.aplicacion;
		var caducidad = data.caducidad;
		// Muestra mensaje de peticion denegada
		alerta('Peticion denegada', "La peticion de <b>"+tipo+"</b> en la aplicacion <b>"+literal+"</b> ha sido denegada por el administrador", function () {
			switch (tipo) {
				case "Alta" :	// PETICION DE ALTA
					// Eliminar el div de la solicitud pendiente
					$('#divSolicitud_'+aplicacion).hide('slow', function(){ $('#divSolicitud_'+aplicacion).remove(); });				
					// Eliminar la solicitud
					var datasolicitud = {tipo: 'solicitudes', aplicacion: aplicacion};
					usuario.delAplicacion(datasolicitud);
					break;
				case "Baja" :	// PETICION DE BAJA
					// Eliminar el div de la solicitud pendiente
					$('#divSolicitud_'+aplicacion).hide('slow', function(){ $('#divSolicitud_'+aplicacion).remove(); });
					// Eliminar la solicitud
					var datasolicitud = {tipo: 'solicitudes', aplicacion: aplicacion};
					usuario.delAplicacion(datasolicitud);
					break;
				case "Renovacion" :		// PETICION DE RENOVACION
					// Eliminar el div de la solicitud pendiente
					$('#divSolicitud_'+aplicacion).hide('slow', function(){ $('#divSolicitud_'+aplicacion).remove(); });
					// Eliminar la solicitud
					var datasolicitud = {tipo: 'solicitudes', aplicacion: aplicacion};
					usuario.delAplicacion(datasolicitud);
					break;
			}
		});
	
	});	
	
	// Enviar mensaje al servidor indicando el nombre de usuario conectado
	socket.emit('setUsuario', nombre);
}
 
// Añade nueva aplicacion a la lista de activas y fija la pestaña a abrir cuando se entra
function addAplicacionActiva(aplicacion, literal, caducidad) {
	// añadir a la lista de altas
	$('#spanActivas').after("<div id='divAlta_"+aplicacion+"'><div id='acceso_"+aplicacion+"' class='listaAppActivas'>"+literal+" (caducidad: "+caducidad +")</div>  &nbsp;&nbsp;<button class='btnBaja' id='btn_"+aplicacion+"'></button></br></div>");		
	// Crear el Tab al hacer click en la aplicacion
	$('#acceso_'+aplicacion).click(function(e) {
		var id_app = $(this)[0].id.split('_')[1];   // Numero de aplicacion
		// Elemento lista para crear el tab
		$('#li_tabs-1').after("<li id='litab_"+id_app+"'><a href='#tabs-"+id_app+"'>"+usuario.apps['activas'][id_app].literal+"</a><span class='ui-icon ui-icon-close' role='presentation'>Cerrar</span></li></li>");
		$.get('/aplicacion_tpl', function (datos) {
			$('#tabs-1').after("<div id='tabs-"+id_app+"'><h2 style='text-align: center'>"+usuario.apps['activas'][id_app].literal+"</h2>"+datos+"</div>");
			$( "#tabs" ).tabs( "refresh" );
			$( "#tabs" ).tabs( "option", "active", 1 );   // Ponerla activa								
		});
	});
}
 
// Crea botones para solicitar baja de aplicaciones activas
function fijarBotonesSolicitarBaja() {
	// Botones de solicitar baja
	$(".btnBaja").button({
	  icons: {
		primary: "ui-icon-trash"
	  },
	  text: false,
	  label: 'Solicitar la baja de la aplicacion'
	});		
	// Dialogo de confirmacion de solicitud de baja
	$(".btnBaja").click(function (e) {
		var aplicacion = $(this)[0].id.split('_')[1];
		$( "#dlgConfirmBaja" ).dialog({
		  modal: true,
		  buttons: {
			"Aceptar": function() {
				// Envia al servidor peticion de solicitar baja
				$.post('/solicitarbaja/'+usuario.nombre+'/'+aplicacion, function(data) {
					$( "#dlgConfirmBaja" ).dialog("close");
					if (data.resultado == false)
						alerta('Error', data.mensaje);	
					else {
						// Peticion enviada correctamente -> deshabilita boton para pedir de nuevo y la añade a las peticiones
						alerta('Informacion', data.mensaje, function () { 							
							$("#btn_"+aplicacion).button("disable");
							$('#spanPendientes').after("<div id='divSolicitud_"+data.aplicacion+"'><div id='acceso_"+data.aplicacion+"_Baja' class='listaAppSolicitudes'>"+data.literal+" </div> <br/></div>");		
							$('html,body').animate({scrollTop: $('#spanPendientes').offset().top});
							$('#divSolicitud_'+data.aplicacion).animate({backgroundColor: '#FF0000'}, 1000, function () {
								$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
							});
						});
					}
				});
			},
			"Cancelar": function() {
			  $( this ).dialog( "close" );
			}
		  }
		});
	});
} 
 
// Crea botones para solicitar renovacion de aplicaciones caducadas
function fijarBotonesCaducadas() {
	// Botones de solicitar renovacion
	$(".listaAppCaducadas").next().button({
	  icons: {
		primary: "ui-icon-unlocked"
	  },
	  text: false,
	  label: 'Solicitar renovacion de privilegios'
	});			
	// Dialogo de solicitud de renovacion de privilegios
	$(".listaAppCaducadas").next().click(function (e) {
		var aplicacion = $(this)[0].id.split('_')[1];
		$( "#dlgConfirmRenovacion" ).dialog({
		  modal: true,
		  buttons: {
			"Aceptar": function() {
				// Envia al servidor peticion de renovacion en la aplicacion
				$.post('/solicitarrenovacion/'+usuario.nombre+'/'+aplicacion, function(data) {
					$( "#dlgConfirmRenovacion" ).dialog("close");
					if (data.resultado == false)
						alerta('Error', data.mensaje);	
					else {
						// Si se ha enviado correctamente se deshabitlita boton para solicitar de nuevo y añade a la lista de solicitudes
						alerta('Informacion', data.mensaje, function () {
							$("#btn_"+data.aplicacion).button("disable");
							$('#spanPendientes').after("<div id='divSolicitud_"+data.aplicacion+"'><div id='acceso_"+data.aplicacion+"_Renovacion' class='listaAppSolicitudes'>"+data.literal+" </div> <br/></div>");		
							$('html,body').animate({scrollTop: $('#spanPendientes').offset().top});
							$('#divSolicitud_'+data.aplicacion).animate({backgroundColor: '#0000FF'}, 1000, function () {
								$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
							});
						});
					}
				});
			},
			"Cancelar": function() {
			  $( this ).dialog( "close" );
			}
		  }
		});
	});	

} 
 
// Inicializar componentes y llamadas jquery 
function initUsuario() {
	// Crear el objeto de la clase usuario pasandole el nombre
	usuario =  new Usuario($(location).attr('pathname').split('/')[2]);
	
	// Crear socket y definir eventos
	crearSocket(usuario.nombre);

	// Inicializar boton cerrar sesion de usuario
	initBtnCerrarSesion();

	// Mostrar informacion de direccion y puerto donde se ejecuta el servidor
	$.get('/puerto', function(data) {
		$('#infoServer').html('Servidor ejecutandose en: '+window.location.hostname+':'+data.p);
	});

	// Rellenar combo de lista de aplicaciones para dialogo de nueva aplicacion
	$.get('/aplicaciones/', function(data) {
		// Se recorren los resultados y añade al combo de aplicaciones disponibles
		for (var i in data) {
			$('#comboAplicaciones').append(new Option(data[i].literal, data[i].aplicacion));
		}
	});
	
	// Obtener lista aplicaciones (y peticiones pendientes) disponibles para el usuario
 	$.get('/aplicacionesusuario/'+usuario.nombre, function(data) {
		// Tomar aplicaciones en objeto usuario
		for (var i in data)
			usuario.addAplicacion(data[i]);
		
		// Crear seccion para lista de APLICACIONES ACTIVAS
		$('#tabs-1').append("<span id='spanActivas'><b>ACTIVAS:</b><br/></span>");		
		// Recorrer aplicaciones activas y crear el html de la lista
		for (var i in usuario.apps['activas']) 
			addAplicacionActiva(usuario.apps['activas'][i].numero, usuario.apps['activas'][i].literal, usuario.apps['activas'][i].caducidad); 
		// Icono de cerrar tab para tabs activas
		$( "#tabs" ).tabs().delegate( "span.ui-icon-close", "click", function() {
			var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
			$( "#" + panelId ).remove();
			$( "#tabs" ).tabs( "refresh" );
		});
		// Crear los botones de solicitar baja para cada aplicacion activa
		fijarBotonesSolicitarBaja();
		
		// Crear seccion para lista de APLICACIONES CADUCADAS
		$('#tabs-1').append("<hr><br/><span id='spanCaducadas'><b>CADUCADAS:</b><br/></span>");
		// Recorrer apicaciones caducadas y crear el html de la lista
		for (var i in usuario.apps['caducadas'])
			$('#spanCaducadas').after("<div id='divCaducada_"+usuario.apps['caducadas'][i].numero+"'><div id='acceso_"+usuario.apps['caducadas'][i].numero+"' class='listaAppCaducadas'>"+usuario.apps['caducadas'][i].literal+" (caducidad: "+usuario.apps['caducadas'][i].caducidad +") </div> &nbsp;&nbsp;<button class='btnCaducadas' id='btn_"+usuario.apps['caducadas'][i].numero+"'></button><br/></div>");		
		// Crear los botones de solicitud de renovacion de aplicaciones caducadas
		fijarBotonesCaducadas();
			
		// Crear seccion para lista de PETICIONES PENDIENTES DE CONFIRMAR
		$('#tabs-1').append("<hr><br/><span id='spanPendientes'><b>Solicitudes pendientes de verificacion:</b><br/></span>");
		// Recorre la lista de peticiones pendientes y crea su html
		for (var i in usuario.apps['solicitudes'])
			$('#spanPendientes').after("<div id='divSolicitud_"+usuario.apps['solicitudes'][i].numero+"'><div id='acceso_"+usuario.apps['solicitudes'][i].numero+"_Renovacion' class='listaAppSolicitudes'>"+usuario.apps['solicitudes'][i].literal+" ("+usuario.apps['solicitudes'][i].peticion +") </div> <br/></div>");		

		// Crear Boton para añadir nueva aplicacion
		$('#tabs-1').append("<br/><br/><br/><button id='btnNuevaAplicacion'>Nueva aplicacion</button>");
		$("#btnNuevaAplicacion").button({
		  icons: {
			primary: "ui-icon-plus"
		  },
		  text: true,
		  label: 'Solicitar acceso a nueva aplicacion'
		});		
		// Evento click del boton de nueva aplicacion
		$("#btnNuevaAplicacion").click(function (e) {
			$( "#dlgAltaAplicacion" ).dialog({
			  modal: true,
			  width: 500,
			  buttons: {
				"Aceptar": function() {
					var aplicacion = $('#comboAplicaciones').val();
					// Se envia la peticion con la nueva aplicacion seleccionada
				 	$.post('/solicitaralta/'+usuario.nombre+'/'+aplicacion, function(data) {
						$( "#dlgAltaAplicacion" ).dialog("close");
						if (data.resultado == false)
							alerta('Error', data.mensaje);	
						else {
							// Si la peticion se ha enviado correctamente se añade a la lista de peticiones pendientes
							alerta('Informacion', data.mensaje, function () {
								$('#spanPendientes').after("<div id='divSolicitud_"+data.aplicacion+"'><div id='acceso_"+data.aplicacion+"_Alta' class='listaAppSolicitudes'>"+data.literal+" </div> <br/></div>");		
								$('html,body').animate({scrollTop: $('#spanPendientes').offset().top});
								$('#divSolicitud_'+data.aplicacion).animate({backgroundColor: '#00FF00'}, 1000, function () {
									$(this).animate({backgroundColor: '#f2f5f7'}, 1000);
								});
							});
						}
					});
				},
				"Cancelar": function() {
				  $( this ).dialog( "close" );
				}
			  }
			});
		});		
	});
}

