# ACA · Landing Interlagos — versión refinada

Implementación HTML + CSS + JavaScript basada en los frames Figma desktop/mobile de los recorridos Socio y Aún no soy Socio.

## Lógica
1. Hero común.
2. Sección común “Elegí tu camino y sumá chances”.
3. El scroll se bloquea al llegar a la segunda sección.
4. Timeline automática: gris → septiembre rojo → octubre rojo → noviembre rojo → tres luces verdes + “Viví la experiencia”.
5. El usuario debe elegir `Soy Socio` o `Aún no soy Socio` para desbloquear el resto.
6. Se renderiza el recorrido correspondiente sin recargar la página.

## Pendientes de integración
- URL Android / iOS de ACA Móvil.
- URL de alta de socio.
- Precios/categorías de socio definitivos.
- Destino del formulario (CRM, API o email).
- Carga de tipografías institucionales licenciadas si ACA las provee para web.

## QA
Para abrir directamente una rama visual durante QA:
- `index.html?path=member`
- `index.html?path=join`
