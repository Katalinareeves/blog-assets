/* La Ciudad · sala recreativa original en canvas. */
(()=>{'use strict';
const canvas=document.getElementById('arcade-canvas'),ctx=canvas.getContext('2d'),W=1024,H=560;
const machines=[
 {x:22,name:'Bubble Lab',sub:'SOLO / BOT',href:'bubble.html',color:'#d3a2f7',symbol:'✳'},
 {x:189,name:'Lluvia Estelar',sub:'ACCIÓN / SOLO',href:'stars.html',color:'#ffe0a3',symbol:'★'},
 {x:356,name:'Memoria Cósmica',sub:'PUZLE / SOLO',href:'memory.html',color:'#b1c8f6',symbol:'◇'},
 {x:523,name:'Duelo de física',sub:'ONLINE / 2',href:'quiz.html',color:'#8dd2d2',symbol:'⚛'},
 {x:690,name:'Cachipún',sub:'ONLINE / 2',href:'rps.html',color:'#f0b6bb',symbol:'✂'},
 {x:857,name:'Gato',sub:'ONLINE / 2',href:'clasicos.html',color:'#e0c389',symbol:'⌗'}
];
let hover=-1,selected=0,t=0;
const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const text=(str,x,y,size,color,align='center',family='monospace')=>{
 ctx.fillStyle=color;ctx.font='bold '+size+'px '+family;ctx.textAlign=align;ctx.fillText(str,x,y);
};
function machine(m,i){
 const x=m.x,y=188,active=i===(hover>=0?hover:selected);
 ctx.save();
 if(active){ctx.shadowColor=m.color;ctx.shadowBlur=22;}
 rect(x-2,y+54,160,269,'#10111d');
 rect(x+2,y+48,152,263,'#51435e');
 rect(x+10,y+60,136,211,'#28243a');
 rect(x+19,y+83,118,111,'#090d20');
 rect(x+23,y+88,110,100,'#26314d');
 ctx.globalAlpha=.18;rect(x+23,y+88,110,100,m.color);ctx.globalAlpha=1;
 // Neon border and pixel display
 rect(x+17,y+78,122,5,m.color);rect(x+17,y+196,122,5,m.color);
 const pulsing=.7+.3*Math.sin(t/700+i*1.5);
 ctx.globalAlpha=pulsing;
 text(m.symbol,x+78,y+158,48,m.color);
 ctx.globalAlpha=1;
 rect(x+21,y+211,113,5,'#191a2f');
 rect(x+29,y+223,32,11,m.color);
 rect(x+72,y+225,13,13,'#d3bbec');rect(x+91,y+223,13,13,'#6a5b89');
 rect(x+51,y+252,50,15,'#161827');
 rect(x+6,y+293,142,12,'#3c3145');
 rect(x+9,y+306,21,20,'#181c29');rect(x+127,y+306,20,20,'#181c29');
 text(m.name.length>19?m.name.slice(0,19):m.name,x+78,y+39,11,active?'#ffffff':m.color);
 text(m.sub,x+78,y+282,9,'#c8bdd6');
 if(active){ctx.strokeStyle=m.color;ctx.lineWidth=3;ctx.strokeRect(x-6,y+44,164,284);}
 ctx.restore();
}
function scene(){
 t=performance.now();
 rect(0,0,W,H,'#1b1b2f');
 // brick wall pixel pattern
 for(let y=36;y<275;y+=37){rect(0,y,W,2,'#3e3852');for(let x=((y/37)%2)*32;x<W;x+=93)rect(x,y-35,2,35,'#343145');}
 rect(0,0,W,35,'#171829');
 rect(0,278,W,11,'#6a5266');
 rect(0,289,W,271,'#27253a');
 // Floor tiles with perspective
 for(let y=302;y<560;y+=52)rect(0,y,W,2,'#3e394e');
 for(let x=0;x<W;x+=74)rect(x,289,2,271,'#3e394e');
 for(let x=37;x<W;x+=148)rect(x,390,2,170,'#42384f');
 // neon back wall sign
 rect(397,43,230,76,'#0e1328');rect(403,48,218,65,'#33294e');
 text('LA CIUDAD',512,75,17,'#edd5ff');text('★  ARCADE  ★',512,99,16,'#98ded2');
 // window on each side
 for(const x of [32,920]){rect(x,47,70,124,'#111b2d');rect(x+8,54,54,109,'#242841');rect(x+34,54,3,109,'#685978');}
 // ceiling glows
 for(const x of machines.map(m=>m.x)){const a=.55+.3*Math.sin(t/1000+x);ctx.fillStyle='rgba(230,180,250,'+a+')';ctx.beginPath();ctx.arc(x+78,161,4,0,Math.PI*2);ctx.fill();}
 machines.forEach(machine);
 // arcade floor stools
 for(const x of machines.map(m=>m.x+69)){rect(x,498,56,14,'#514357');rect(x+22,512,13,28,'#342d45');rect(x+4,540,50,6,'#191829');}
 // foreground carpet with glowing lane
 rect(0,545,W,15,'#1d1b2d');rect(280,549,465,3,'#6c507a');
 const idx=hover>=0?hover:selected;
 text('◈ '+machines[idx].name+' · CLIC O ENTER PARA JUGAR',W/2,24,12,'#d9c9e9');
 requestAnimationFrame(scene);
}
function indexAt(e){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
 if(y<205||y>526)return -1;return machines.findIndex(m=>x>=m.x-14&&x<=m.x+158);}
canvas.addEventListener('pointermove',e=>{hover=indexAt(e);canvas.style.cursor=hover>=0?'pointer':'default';});
canvas.addEventListener('pointerleave',()=>hover=-1);
canvas.addEventListener('click',e=>{const idx=indexAt(e);if(idx>=0)location.href=machines[idx].href;});
canvas.addEventListener('keydown',e=>{
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();selected=(selected+(e.key==='ArrowRight'?1:3) )%machines.length;hover=-1;}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();location.href=machines[hover>=0?hover:selected].href;}
});
requestAnimationFrame(scene);
})();