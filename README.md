# SOS Ansiedade — site completo (copy/paste)

Instruções rápidas:
1. Crie uma pasta e cole os arquivos acima mantendo a estrutura:
   - index.html
   - styles.css
   - script.js
   - manifest.json
   - service-worker.js
   - offline.html
   - icons/icon-192.svg
   - icons/icon-512.svg
   - tools/convert-icons.js (opcional, para gerar PNGs)

2. (Opcional) Gerar PNGs a partir dos SVGs:
   - Instale Node.js e rode:
     npm init -y
     npm install sharp
     node tools/convert-icons.js
   - Isso cria icons/icon-192.png e icons/icon-512.png

3. Testar local:
   - Python: python -m http.server 8000
   - Acesse: http://localhost:8000
   - SW funciona em localhost; em produção serve via HTTPS.

4. Publicar: Netlify / Vercel / GitHub Pages (HTTPS) — para habilitar Service Worker/instalação PWA em produção.

Observações:
- Ritmo: inspire 4s / expire 6s.
- Mobile-first, poucas telas, linguagem acolhedora.
- Áudio gerado localmente via WebAudio (opcional, botão "Som").
- Código comentado e modular para evoluir (manifest/service-worker separados).