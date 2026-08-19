# Gerty Games Mini App

Telegram Mini App estatica basada en los juegos `Gerty Crack RetroSec` y `Cripto Clasico` de GERTY.

## Que Incluye

- Juego 100% estatico con `index.html`, `style.css` y `app.js`.
- Selector interno con dos juegos: `RetroSec Lab` y `Cripto Clasico`.
- RetroSec incluye cinco misiones ficticias tipo terminal retro.
- RetroSec simula comandos: `ls`, `cat`, `strings`, `grep`, `nmap`, `binwalk`, `john`, `hydra` y `submit`.
- Cripto Clasico incluye retos de Cesar, Atbash, Hex, Base64, Reversa + Cesar, Vigenere y Multicapa.
- Progreso separado en `localStorage` para cada juego.
- Compatibilidad con Telegram Mini Apps mediante `telegram-web-app.js`.
- Boton para reiniciar el progreso local del juego activo.

## Publicacion En GitHub Pages

1. En GitHub, abrir `Settings > Pages`.
2. Seleccionar `Deploy from a branch`.
3. Usar rama `main` y carpeta `/root`.
4. La URL quedara similar a:
   `https://alexeiiw.github.io/gerty-retrosec-miniapp/`

## Uso Como Mini App

El bot de prueba debe enviar un boton con `web_app.url` apuntando a la URL de GitHub Pages.

La app no contiene tokens ni secretos. El bot solo abre la Mini App; el progreso de ambos juegos se guarda localmente en el navegador con `localStorage`.

## Seguridad

Este repo es solo frontend estatico. No valida identidad de Telegram en backend porque no tiene backend. Para un uso real con clientes se debe validar `initData` del Web App en un servidor o Apps Script separado.
