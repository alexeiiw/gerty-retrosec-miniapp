# WALL-E F1

**v1.0.0** · Mini App estatica para Telegram: simulador de estrategia de Formula 1 de la
temporada **2026**. Sin backend ni servidor: todo corre en el navegador y el progreso se
guarda en `localStorage`.

- **Temporada:** 2026
- **Version:** 1.0.0
- **Tipo:** frontend estatico (HTML + CSS + JavaScript, sin build)

## Que es

Eliges circuito, equipo y estrategia de neumaticos; luego ves la carrera simulada y
descubres si tus decisiones (llantas y vuelta de parada) fueron las correctas.

## Como se juega

1. Elige **circuito** (6 disponibles, carreras de **24 vueltas**).
2. Elige **equipo**. Los 4 rinden igual: solo cambian las condiciones.
3. Revisa la **clasificacion** de los 8 pilotos y el **clima** pronosticado.
4. Define la **estrategia**: dos juegos de llantas (salida y cambio) y en que vuelta entra a
   boxes cada piloto.
5. Mira la **carrera** en la pista 2D con controles de velocidad **1x a 4x** (o saltar al final).
6. Ve el **resultado**: si acertaste la estrategia y en que puesto terminaste.

## Pantalla de carrera (HUD)

- **Vuelta** actual / 24.
- **Clima** (seco / lluvia ligera / lluvia fuerte).
- Por cada piloto: **posicion** y **llanta** en uso.
- Controles: reproducir/pausa, 1x, 2x, 3x, 4x y "Fin" para saltar al resultado.

## Equipos y pilotos (temporada 2026)

| Equipo | Pilotos |
| --- | --- |
| McLaren | Lando Norris · Oscar Piastri |
| Ferrari | Charles Leclerc · Lewis Hamilton |
| Red Bull | Max Verstappen · Isack Hadjar |
| Mercedes | George Russell · Kimi Antonelli |

## Circuitos

Monza, Monaco, Silverstone, Spa, Singapur e Interlagos. Cada uno tiene su propio desgaste,
facilidad de adelantamiento y probabilidad de lluvia. **24 vueltas** por carrera.

## Compuestos de neumaticos

Blanda, Media, Dura, Intermedia y Lluvia. Cada uno tiene ritmo (pace), desgaste, vuelta de
"cliff" (caida brusca de rendimiento) y humedad ideal.

## Como funciona la simulacion

- **Determinista por semilla**: la misma semilla + circuito producen siempre el mismo clima,
  la misma clasificacion y la misma carrera.
- El clima evoluciona vuelta a vuelta (seco, lluvia ligera, lluvia fuerte).
- El desgaste depende del compuesto, las vueltas montadas y el desgaste de la pista.
- Las paradas suman tiempo (menos bajo **Safety Car**).
- Hay **accidentes** aleatorios que pueden causar Safety Car o abandono.
- La posicion final se decide por tiempo acumulado sobre las 24 vueltas.

## Estructura del proyecto

| Archivo | Descripcion |
| --- | --- |
| `index.html` | Pantallas: circuito, equipo, clasificacion, estrategia, carrera y resultado. |
| `style.css` | Diseno mobile-first con tiles grandes, pensado para Mini App. |
| `data.js` | Version, equipos y pilotos 2026, compuestos y las 6 pistas. |
| `sim.js` | Motor determinista: clima, desgaste, paradas, accidentes, Safety Car y 24 vueltas. |
| `app.js` | Flujo de pantallas, canvas de la pista, HUD, controles y guardado local. |
| `CHANGELOG.md` | Historial de versiones. |

## Estado local (localStorage)

- **Clave:** `walle-f1-state-v1`
- **Guarda:** carreras jugadas, victorias, podios, ultimo circuito/equipo y mejor puesto por circuito.

## Telegram

El bot solo abre la Mini App con un boton `web_app`. No necesita backend.

- **Bot -> sitio**: el bot puede pasar datos en la URL, por ejemplo
  `https://<usuario>.github.io/gerty-retrosec-miniapp/?seed=20260315`.
  El sitio lo lee al abrir (la semilla tambien se puede recibir por `start_param`).
- **Sitio -> bot**: en esta version el sitio no envia nada al bot; todo es local.

## Publicacion en GitHub Pages

El sitio se despliega automaticamente desde la rama `main` (carpeta raiz).
URL esperada: `https://alexeiiw.github.io/gerty-retrosec-miniapp/`

### Cache-busting

Los assets se referencian con `?v=3` en `index.html` para forzar la recarga en el WebView de
Telegram. **Sube ese numero al publicar cambios** de `style.css` o de los `.js`.

## Desarrollo

No requiere build ni dependencias. Para probar en local:

```powershell
# Servir la carpeta (requiere Python)
python -m http.server 8080
# Abrir http://localhost:8080
```

Comprobacion de sintaxis:

```powershell
node --check data.js
node --check sim.js
node --check app.js
```

## Seguridad

Repo solo frontend, sin tokens ni secretos. No valida `initData` de Telegram porque no hay
backend. Para uso real con clientes habria que validar `initData` en un servidor aparte.
