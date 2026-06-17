#TODOs

This is a list of TODOs task (features) I want to implement in the web app **quiniela mundialista**

- ✅ Mostrar el partido en curso junto con el marcador y una leyenda de "En vivo", esto se mostrará en la página de /partidos. Me gustaría que se mostrará arriba en el contenedor que tiene la leyenda de partidos y bolsa acumulada, para mostrarlo en medio.
- ✅ Agregar nombre de estadio y ciudad dónde se juega cada partido.
- Compartir predicción por cada partido. El usuario le da click a un Share button que genera una imagen con la predicción hecha por el usuario. En caso de que ya se cuente con una resultado, debe aparecer +1 punto en caso de haber acertado al resultado. En la imagen igual debe aparecer información relativa a la plataforma como enlace de registro, nombre de la plataforma y un mensaje alentando a futuros usuarios para captarlos. Estoy pensando igual en un código QR que los diriga a la página de registro. Recuerda que el estilo de la imagen debe seguir las reglas del sistema de diseño actual.
- Crear la landing page de Quiniela Mundialista.
- ✅ Agregar un filtro en la página de /partidos para poder buscar por nombre de equipo, esto hará que se filtre la lista y se muestren los partidos de ese equipo, la ui será la misma simplemente el listado se acortará
- ✅ Modificar la web para que sea tipo progressive web app y los usuarios tengan la opción en el navegador de instalar la web en el celular.
- ✅ Agregar un opción para filtrar los partidos por día, actualmente aparece una lista con todos los partidos.
  Quiero que sea una fila con los días de la semana comenzando de Domingo a Sábado como en el calendario, el día actual es el que debe de estar seleccionado por defecto al entrar. La lista de tarjetas no se debe de modificar, solo es agregar este nuevo componente de filtrado. Si el usuario lo desea podría seleccionar más de un día, simplemente la lista se haría más larga. Este filtro debe estar tanto en /partidos para los usuarios normales y /admin/partidos para el admin
