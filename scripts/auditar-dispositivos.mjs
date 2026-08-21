import { createCanvas, ImageData as ID } from 'canvas'
globalThis.ImageData=ID; globalThis.document={createElement:()=>createCanvas(1,1)}; globalThis.window={devicePixelRatio:1}
const {construirEscena,paletaFondo}=await import('/home/claude/c50/src/lib/escena.js')
const {crearMotor}=await import('/home/claude/c50/src/lib/motorEscena.js')

// Viewports reales. El alto es el de la SECCION de bio, no el del viewport:
// en movil la bio apilada mide varias veces la pantalla.
const DISPOSITIVOS=[
 ['iPhone SE',      375, 1560],
 ['iPhone 14/15',   390, 1480],
 ['Pixel 8',        412, 1440],
 ['iPad vertical',  820,  900],
 ['iPad apaisado', 1180,  520],
 ['Laptop 1366',   1366,  440],
 ['Desktop 1920',  1920,  460],
]
const ESCENAS=[
 ['lluvia','heavyrain',{total:1,baja:.95,media:.86,alta:.3},9,5,15,0],
 ['nublado','cloudy',{total:.95,baja:.9,media:.62,alta:.26},12,0,15,0],
 ['despejado dia','clearsky_day',{total:.05,baja:0,media:0,alta:.05},18,0,15,0],
 ['noche','clearsky_night',{total:.03,baja:0,media:0,alta:.04},11,0,4,0],
 ['camanchaca','fog',{total:.9,baja:.9,media:.2,alta:0},12,0,13,.8],
 ['nieve','heavysnow',{total:1,baja:.95,media:.8,alta:.3},-3,4,15,0],
 ['escarcha -14','clearsky_day',{total:.05,baja:0,media:0,alta:.05},-14,0,15,0],
 ['calor 38','clearsky_day',{total:0,baja:0,media:0,alta:0},38,0,16,0],
]
const lum=(r,g,b)=>{const c=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*c(r)+.7152*c(g)+.0722*c(b)}
const ratio=(a,b)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05)
function cajas(W,H){
 const estrecho=W<620, mx=estrecho?W*0.06:W*0.24
 const n=estrecho?6:3, util=H*0.84, paso=util/n, out=[]
 for(let i=0;i<n;i++) out.push({x0:mx,x1:W-mx,y0:H*0.06+i*paso,y1:H*0.06+i*paso+paso*0.7})
 return out
}
function costura(img,W,H){
 let peor=0
 for(let x=2;x<W-2;x+=2){let r=0
  for(let y=2;y<H-2;y++){
   const i=(y*W+x)*4, iz=(y*W+x-1)*4, iz2=(y*W+x-2)*4
   const d1=Math.abs(img[i]-img[iz])+Math.abs(img[i+1]-img[iz+1])+Math.abs(img[i+2]-img[iz+2])
   const d0=Math.abs(img[iz]-img[iz2])+Math.abs(img[iz+1]-img[iz2+1])+Math.abs(img[iz+2]-img[iz2+2])
   if(d1>12 && Math.abs(d1-d0)>9){r++;if(r>peor)peor=r}else r=0}}
 for(let y=2;y<H-2;y+=2){let r=0
  for(let x=2;x<W-2;x++){
   const i=(y*W+x)*4, ar=((y-1)*W+x)*4, ar2=((y-2)*W+x)*4
   const d1=Math.abs(img[i]-img[ar])+Math.abs(img[i+1]-img[ar+1])+Math.abs(img[i+2]-img[ar+2])
   const d0=Math.abs(img[ar]-img[ar2])+Math.abs(img[ar+1]-img[ar2+1])+Math.abs(img[ar+2]-img[ar2+2])
   if(d1>12 && Math.abs(d1-d0)>9){r++;if(r>peor)peor=r}else r=0}}
 return peor}

let fallos=[], nn=0
console.log('dispositivo      escena          mov%   franjas(4)        contraste  costura  dens')
console.log('-'.repeat(88))
for(const [dnom,W,H] of DISPOSITIVOS){
 const cj=cajas(W,H)
 let peorMovD=99, peorConD=99, peorCosD=0
 for(const [enom,sim,nub,temp,mm,h,nieb] of ESCENAS){
  const f=new Date('2026-06-15T'+String(h).padStart(2,'0')+':00:00Z')
  const e=construirEscena({ok:1,lat:-39.81,lon:-73.25,simbolo:sim,nubes:nub,
   aire:{temp,humedad:nieb?.96:(mm?.92:.6),presion:mm>2?996:1015,rocio:nieb?temp-.4:temp-7},
   niebla:nieb,uv:temp>26?10:3,viento:{vel:11,dir:280},precip:{mm}},f)
  const p=paletaFondo(e)
  const cv=createCanvas(W,H), ctx=cv.getContext('2d')
  const m=crearMotor(cv,{dprMax:1}); m.dimensionar(W,H,1); m.fijarCajaTexto(cj)
  m.actualizarEscena(e,p,f)
  let t=1000; for(let k=0;k<40;k++){m.cuadro(t,33);t+=33}
  const a=ctx.getImageData(0,0,W,H); for(let k=0;k<40;k++){m.cuadro(t,33);t+=33}
  const b=ctx.getImageData(0,0,W,H)
  let q=0; const fr=[0,0,0,0], tf=[0,0,0,0]
  for(let i=0;i<a.data.length;i+=4){const idx=i/4,y=Math.floor(idx/W),k=Math.min(3,Math.floor(y/(H/4)));tf[k]++
   if(Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2])>5){q++;fr[k]++}}
  let peor=99
  for(const c of cj){const z=ctx.getImageData(Math.round(c.x0),Math.round(c.y0),Math.round(c.x1-c.x0),Math.round(c.y1-c.y0))
   let lo=1,hi=0;for(let i=0;i<z.data.length;i+=8){const L=lum(z.data[i],z.data[i+1],z.data[i+2]);if(L<lo)lo=L;if(L>hi)hi=L}
   const lT=p.polaridad==='claro'?lum(42,59,76):lum(255,253,248);peor=Math.min(peor,ratio(lT,lo),ratio(lT,hi))}
  const cs=costura(b.data,W,H)
  const mov=100*q/(a.data.length/4)
  const frp=fr.map((v,i)=>(100*v/tf[i]))
  const vivas=frp.filter(v=>v>0.02).length
  const dens=m.contarParticulas().total/((W*H)/100000)
  nn++
  const okM=mov>=0.12, okC=peor>=7, okS=cs<40, okF=vivas>=3
  if(!(okM&&okC&&okS&&okF)) fallos.push(`${dnom}/${enom}: mov ${mov.toFixed(3)}${okM?'':' BAJO'} contraste ${peor.toFixed(2)}${okC?'':' BAJO'} costura ${cs}${okS?'':' BORDE'} franjas ${vivas}/4${okF?'':' CONCENTRADO'}`)
  peorMovD=Math.min(peorMovD,mov); peorConD=Math.min(peorConD,peor); peorCosD=Math.max(peorCosD,cs)
  console.log(dnom.padEnd(16),enom.padEnd(15),mov.toFixed(2).padStart(6),' ',frp.map(v=>v.toFixed(1).padStart(5)).join(' '),' ',peor.toFixed(2).padStart(6),' ',String(cs).padStart(5),' ',dens.toFixed(0).padStart(4))
 }
 console.log('  '+dnom+' -> mov min '+peorMovD.toFixed(3)+'% | contraste min '+peorConD.toFixed(2)+' | costura max '+peorCosD)
 console.log('-'.repeat(88))
}
console.log('COMBINACIONES:',nn,' FALLOS:',fallos.length)
fallos.forEach(f=>console.log('  >> '+f))
console.log(fallos.length?'AUDITORIA CON FALLOS':'AUDITORIA SUPERADA EN TODOS LOS DISPOSITIVOS')
