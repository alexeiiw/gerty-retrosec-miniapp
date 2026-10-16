# Changelog

Todas las versiones notables de **WALL-E F1**.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [1.0.0] - 2026-10-16

### Agregado
- Simulador de estrategia de F1 de la temporada 2026 para Telegram Mini App.
- 4 equipos y 8 pilotos reales 2026 (McLaren, Ferrari, Red Bull, Mercedes).
- 6 circuitos (Monza, Monaco, Silverstone, Spa, Singapur, Interlagos) de 24 vueltas.
- 5 compuestos de neumaticos con ritmo, desgaste y cliff propios.
- Flujo de pantallas: circuito, equipo, clasificacion y clima, estrategia, carrera y resultado.
- Pista 2D en canvas con los autos moviendose y controles de velocidad 1x a 4x (mas pausa y salto al final).
- HUD en carrera: vuelta, clima, posicion y llanta por piloto.
- Motor determinista por semilla: clima, clasificacion y carrera reproducibles.
- Accidentes, Safety Car y desgaste dependiente del circuito.
- Guardado de progreso en `localStorage` (carreras, victorias, podios y mejor puesto por circuito).
- Soporte de semilla por URL o `start_param` de Telegram.
- Cache-busting con `?v=` en los assets.
- Documentacion (README) y este changelog.

### Reemplaza
- Sustituye por completo la Mini App anterior (RetroSec Lab y Cripto Clasico).
