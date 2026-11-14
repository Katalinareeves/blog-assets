(()=>{'use strict';
const $=id=>document.getElementById(id),emojis=['✳','⚛','☾','✦','♧','◈','☀','♫','♡','⚙','∞','☄','❀','♠','♦'];
const key='ciudadMemoryBestV1';let level=1,best=1,deck=[],selected=[],matched=0,moves=0,startTime=0,elapsed=0,running=false,locked=false,timeout=null,interval=null;
try{best=Math.max(1,Number(localStorage.getItem(key))||1)}catch{}
function ui(){ $('level').textContent=level;$('best').textContent=best;$('moves').textContent=moves;const s=Math.floor(elapsed/1000);$('time').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function render(){const root=$('memory-grid');root.replaceChildren();root.classList.toggle('hard',deck.length>16);
 deck.forEach((card,index)=>{const b=document.createElement('button');b.type='button';b.dataset.i=index;const show=card.done||selected.includes(index);b.textContent=show?card.symbol:'✧';b.className=card.done?'matched':show?'revealed':'';b.setAttribute('aria-label',show?'Símbolo '+card.symbol:'Carta oculta '+(index+1));b.disabled=card.done||locked||!running;b.onclick=()=>flip(index);root.append(b);});
}
function stopClock(){if(interval){clearInterval(interval);interval=null;}}
function reset(lv=1){if(timeout)clearTimeout(timeout);stopClock();level=lv;matched=0;moves=0;elapsed=0;selected=[];locked=false;running=true;startTime=Date.now();const pairs=level<=2?6:level<=4?8:10;const chosen=shuffle([...emojis]).slice(0,pairs);deck=shuffle(chosen.flatMap(s=>[{symbol:s,done:false},{symbol:s,done:false}]));
 $('start').hidden=true;$('next').hidden=true;$('memory-message').textContent='Encuentra '+pairs+' parejas para superar el nivel '+level+'.';
 interval=setInterval(()=>{elapsed=Date.now()-startTime;ui();},200);ui();render();}
function win(){running=false;stopClock();elapsed=Date.now()-startTime;ui();if(level>=best){best=level+1;try{localStorage.setItem(key,String(best))}catch{}}
 $('memory-message').textContent='¡Nivel '+level+' completado en '+$('time').textContent+' y '+moves+' intentos! ✨';
 $('next').hidden=false;ui();render();
}
function flip(i){
 if(!running||locked||deck[i].done||selected.includes(i))return;
 selected.push(i);
 if(selected.length===2){
  moves++;locked=true;
  const [a,b]=selected;if(deck[a].symbol===deck[b].symbol){
   timeout=setTimeout(()=>{deck[a].done=deck[b].done=true;matched+=2;selected=[];locked=false;render();if(matched===deck.length)win();},340);
  }else{timeout=setTimeout(()=>{selected=[];locked=false;render();},700);}
 }
 ui();render();
}
$('start').onclick=()=>reset(1);$('next').onclick=()=>reset(level+1);$('restart').onclick=()=>reset(1);ui();render();
})();