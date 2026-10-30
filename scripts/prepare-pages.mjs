import { cp, mkdir, writeFile } from 'node:fs/promises';
await mkdir('build/pages', { recursive: true });
await cp('dist', 'build/pages', { recursive: true });
await cp('build/worker.js', 'build/pages/_worker.js');
await writeFile('build/pages/_routes.json', JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log('Cloudflare Pages: frontend estático y API preparados.');
