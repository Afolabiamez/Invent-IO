import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import { fileURLToPath } from "node:url";

const output=new URL('../dist/',import.meta.url);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await build({entryPoints:[fileURLToPath(new URL('../src/App.jsx',import.meta.url))],bundle:true,minify:true,format:'esm',jsx:'automatic',outfile:fileURLToPath(new URL('app.js',output)),define:{'process.env.NODE_ENV':'"production"'},metafile:true}).then(async result=>writeFile(new URL('build-meta.json',output),JSON.stringify(result.metafile,null,2)));
for(const name of ['assets','style.css','manifest.webmanifest','catalog-template.csv','sw.js'])await cp(new URL('../public/'+name,import.meta.url),new URL(name,output),{recursive:true});
// Published assets exclude the isolated design review and its fixtures.
await rm(new URL('assets/figma/',output),{recursive:true,force:true});
await writeFile(new URL('index.html',output),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0b6358"><title>Invent IO</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/app.css"><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/assets/app-icon-180.png"></head><body><div id="app"></div><div id="overlay"></div><div id="toast" role="status" aria-live="polite"></div><script type="module" src="/app.js"></script></body></html>');
console.log('React production app built in dist/.');
