# WALL-E F1

Mini App estatica para Telegram: un simulador de estrategia de Formula 1 de la temporada 2026.
No tiene backend ni servidor: todo corre en el navegador y el progreso se guarda en `localStorage`.

## Como se juega

1. Elige **circuito** (6 disponibles, carreras de **24 vueltas**).
2. Elige **equipo** (McLaren, Ferrari, Red Bull o Mercedes). Los 4 rinden igual: solo cambian las condiciones.
3. Revisa la **clasificacion** de los 8 pilotos y el **clima** pronosticado de la carrera.
4. Define la **estrategia**: dos juegos de llantas (salida y cambio) y en que vuelta entra a boxes cada piloto.
5. Mira la **carrera** en la pista 2D con controles de velocidad **1x a 4x** (o saltar al final).
6. Ve el **resultado**: si acertaste la estrategia y en que puesto terminaste.

## Pantalla de carrera (HUD)

- **Vuelta** actual / 24.
- **Clima** (seco / lluvia ligera / lluvia fuerte).
- Por cada piloto: **posicion** y **llanta** en uso.
- Controles: reproducir/pausa, 1x, 2x, 3x, 4x y "Fin" para saltar.

## Estructura

- `index.html` - pantallas (circuito, equipo, clasificacion, estrategia, carrera, resultado).
- `style.css` - diseno mobile-first con tiles grandes, pensado para Mini App.
- `data.js` - equipos y pilotos 2026, compuestos de neumaticos y las 6 pistas.
- `sim.js` - motor determinista: clima por semilla, desgaste, paradas, accidentes, Safety Car y 24 vueltas.
- `app.js` - flujo de pantallas, canvas de la pista, HUD, controles y guardado local.

## Publicacion en GitHub Pages

El sitio se despliega automaticamente desde la rama `main` (carpeta raiz).

## Telegram

El bot solo abre la Mini App con un boton `web_app`. No necesita backend.

- **Bot -> sitio**: el bot puede pasar datos en la URL, por ejemplo
  `https://<usuario>.github.io/walle-f1/?seed=20260315`
  y el sitio lo lee al abrir (`seed` tambien se puede recibir por `start_param`).
- **Sitio -> bot**: el sitio no envia nada al bot en esta version (todo es local en `localStorage`).

## Notas

- Sin tokens ni secretos: es solo frontend estatico.
- El estado (carreras jugadas, victorias, podios y mejor puesto por circuito) se guarda en el navegador.
