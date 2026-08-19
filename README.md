# Gerty Crack: RetroSec Mini App

Demo estatica de Telegram Mini App basada en el modo `Gerty Crack RetroSec` de GERTY.

## Que Incluye

- Juego 100% estatico con `index.html`, `style.css` y `app.js`.
- Cinco misiones ficticias tipo terminal retro.
- Comandos simulados: `ls`, `cat`, `strings`, `grep`, `nmap`, `binwalk`, `john`, `hydra` y `submit`.
- Progreso guardado en `localStorage`.
- Compatibilidad con Telegram Mini Apps mediante `telegram-web-app.js`.
- Boton para enviar resultado con `Telegram.WebApp.sendData()` cuando se abre dentro de Telegram.

## Publicacion En GitHub Pages

1. En GitHub, abrir `Settings > Pages`.
2. Seleccionar `Deploy from a branch`.
3. Usar rama `main` y carpeta `/root`.
4. La URL quedara similar a:
   `https://alexeiiw.github.io/gerty-retrosec-miniapp/`

## Uso Como Mini App

El bot de prueba debe enviar un boton con `web_app.url` apuntando a la URL de GitHub Pages.

La app no contiene tokens ni secretos. Si se abre fuera de Telegram funciona en modo local.

## Seguridad

Este repo es solo frontend estatico. No valida identidad de Telegram en backend porque no tiene backend. Para un uso real con clientes se debe validar `initData` del Web App en un servidor o Apps Script separado.
