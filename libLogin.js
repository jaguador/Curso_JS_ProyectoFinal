/************************************************
* libLogin.js: Libreria javasript de login.html *
* Proyecto Curso Cliente-Servidor Javascript	*
* Julio Aguado Robles							*
* Alumno: al10788								*
************************************************/

// Consulta al servidor (get) la lista de usuarios para mostrarlos en la pantalla de login
function muestraUsuarios() {
	// Mostrar informacion de direccion y puerto donde se ejecuta el servidor
	$.get('/puerto', function(data) {
		$('#infoServer').html('Servidor ejecutandose en: '+window.location.hostname+':'+data.p);
	});
	// Peticion de listado de usuarios
 	$.get('/usuarios', function(data) {
		// Construye tabla con los nombres de usuarios
		var html = "<table width='60%' align='center' cellspacing=2 cellpadding=20><tr>";
 		for (var i in data.usuarios)
			html += "<td class='celdaUsuario'><div class='cuadroUsuario' id='divUsuario_"+data.usuarios[i].usuario+"'><b>&nbsp;&nbsp;"+data.usuarios[i].usuario+"&nbsp;&nbsp;</b></div></td>";
		html += "</tr></table>";
		html += "<br/><b>Acceso Panel de Administracion</b><br/><table width='20%' align='center' cellspacing=2 cellpadding=20><tr><td class='celdaUsuario'><div class='cuadroUsuario' id='divUsuario_admin'><b>&nbsp;&nbsp;admin&nbsp;&nbsp;</b></div></td></tr></table>";
		$('#wrapperLogin').html(html);  // Se añade el html al contenedor div 
		
		// Cada div que representa un cuadro de usuario se le añade efecto hover con el raton
		$('.cuadroUsuario').each(function() {
			// Al entrar y salir con el raton se le cambia opacidad y muestra campo para introducir password
			$(this).hover(
				// Al entrar con el raton
				function(e) {
					// Tomar el usuario a partir del id del div
					var usuario = $(this)[0].id.split('_')[1];
					// Se muestra al completo y se añade campo de password
					$(this).fadeTo("fast", 1);
					$(this).append("<span class='txtPass'><br/><input type='password' size=1 id='inputPass_"+usuario+"'></span>");
					// Se envia al pulsar tecla 'Enter' (13)
					$('#inputPass_'+usuario).keypress(function(e) {
						if (e.which == 13) {
							doLogin($(this)[0].id.split('_')[1], $(this)[0].value); 
						}
					});
				},
				// Al salir con el raton
				function(e) {
					// Se vuelve a la opacidad anterior y se elimina el campo de password
					$(this).fadeTo("fast", 0.33);
					$(".txtPass").each(function() { $(this).remove() });
				}
			); 
		});  
	}); 
} 
 

// Envia (post) una peticion de login de usuario
function doLogin(usuario, password) { 
	// Se envia usuario y password
	$.post('/login/'+usuario+'/'+password, function (data) {
		// Si la validacion es correcta se redirecciona a la url proporcionada
		if (data.resultado == true) {
			$(location).attr('href',data.url);
		}
		// En caso contrario se muestra mensaje de alerta de login incorrecto
		else {
			$( "#dlgInformacion" ).html(data.msg);
			$( "#dlgInformacion" ).dialog({
			  modal: true,
			  width: 400,
			  buttons: {
				"Aceptar": function() {
						$( "#dlgInformacion" ).dialog("close");
				}
			  }
			});
		}
	});
}

