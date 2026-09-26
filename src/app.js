'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let playing=!motionReduced,modalOpen=false;
const labels=['Bus · turning','Hiker','Hoverboard · sweeping path','Hoverboard · turning','Goldfish','Bike-packing','Bus · moving forward','Sea turtle','Hoverboard · fixed camera','Living room · moving camera','Living room · fixed camera','Garden vase · moving camera','Garden vase · fixed camera','Girl & dog · moving camera','Girl & dog · fixed camera','Robotic arm · pushing a box'];
const isFixed=c=>c.instruction.includes('Keep the camera viewpoint fixed');
const videoObserver=new IntersectionObserver(entries=>{for(const e of entries){e.target.dataset.visible=e.isIntersecting?'yes':'no';if(e.isIntersecting)ensureLoaded(e.target);updateVideo(e.target);}},{threshold:0.12});
function ensureLoaded(v){if(v.dataset.src&&v.getAttribute('src')!==v.dataset.src){v.src=v.dataset.src;v.load();}}
function updateVideo(v){if(playing&&!modalOpen&&!document.hidden&&v.dataset.visible==='yes'&&!v.hidden){ensureLoaded(v);if(v.currentSrc||v.getAttribute('src'))v.play().catch(e=>{if(e.name!=='AbortError')v.controls=true;});}else v.pause();}
function refreshPlayback(){document.querySelectorAll('video:not(#modalVideo)').forEach(updateVideo);$('globalPlay').textContent=playing?'Ⅱ Pause motion':'▷ Play motion';$('globalPlay').setAttribute('aria-pressed',String(playing));}
function bindVideo(v,p){v.pause();v.removeAttribute('src');v.dataset.src=p.videoData;v.poster=p.posterData;v.setAttribute('width',p.size[0]);v.setAttribute('height',p.size[1]);v.dataset.title=p.label;v.closest('.visual')?.querySelector('.load-error')?.remove();if(v.dataset.visible==='yes')ensureLoaded(v);updateVideo(v);}
function watchVideo(v){videoObserver.observe(v);v.addEventListener('error',()=>{if(v.error&&v.closest('.visual')&&!v.closest('.visual').querySelector('.load-error')){const t=document.createElement('div');t.className='load-error';t.textContent='Video could not load. Reload the page to retry.';v.closest('.visual').append(t);}});v.addEventListener('click',()=>openVideo(v));}
function setPressed(parent,attribute,value){parent.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute(attribute)===String(value))));}
$('globalPlay').addEventListener('click',()=>{playing=!playing;refreshPlayback();});
document.addEventListener('visibilitychange',refreshPlayback);
const featured=[{i:2,label:'Hoverboard'},{i:7,label:'Sea turtle'},{i:9,label:'Living room'},{i:11,label:'Garden vase'},{i:13,label:'Girl & dog'}];
function setHero(i){const c=DATA.cases[i];$('heroInput').src=c.inputData;$('heroInput').alt=labels[i]+' input image';bindVideo($('heroControl'),c.scene);bindVideo($('heroResult'),c.models.find(x=>x.key==='ours'));$('heroCaption').textContent=labels[i]+'. '+c.instruction;setPressed($('heroTabs'),'data-case',i);$('examplePickerStatus').textContent='Viewing '+(featured.findIndex(x=>x.i===i)+1)+' / '+featured.length;}
$('heroTabs').innerHTML=featured.map((x,index)=>`<button type="button" data-case="${x.i}" aria-pressed="false" aria-controls="heroPreview" aria-label="Show ${x.label} example"><span class="scene-step" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span>${x.label}</span></button>`).join('');
$('heroTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setHero(+b.dataset.case);});
['heroControl','heroResult','compareControl','compareOurs','compareBaseline'].forEach(id=>watchVideo($(id)));
setHero(2);
// Curate only section 05; retain original case indices for its Compare buttons.
const excludedResultCases=new Set(["gardenvase_720_first6s_no_rendering__jaa50c602", "dogs-jump__jb413bdd9", "hike__j1a0b8606"]);
const resultCases=DATA.cases.map((c,i)=>({c,i})).filter(({c})=>!excludedResultCases.has(c.id));
$('galleryCount').textContent=resultCases.length+' examples';
$('galleryGrid').innerHTML=resultCases.map(({c,i})=>{const p=c.models.find(x=>x.key==='ours');return `<article class="gallery-card" data-camera="${isFixed(c)?'fixed':'joint'}"><div class="visual"><video id="galleryVideo${i}" muted loop playsinline preload="none" poster="${esc(p.posterData)}" data-src="${esc(p.videoData)}" data-title="${esc(labels[i])} · Ours" aria-label="${esc(labels[i])} generated video" width="${p.size[0]}" height="${p.size[1]}"></video><button class="enlarge" data-enlarge="galleryVideo${i}" aria-label="Enlarge ${esc(labels[i])}">⤢</button></div><div class="gallery-caption"><div><h3>${esc(labels[i])}</h3><p>${isFixed(c)?'Object motion · Fixed camera':'Object motion + Camera motion'}</p></div><button class="text-button" data-compare="${i}">Compare ↗</button></div></article>`;}).join('');
document.querySelectorAll('.gallery-card video').forEach(watchVideo);
$('galleryFilters').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;setPressed($('galleryFilters'),'data-filter',b.dataset.filter);let n=0;document.querySelectorAll('.gallery-card').forEach(card=>{card.hidden=b.dataset.filter!=='all'&&card.dataset.camera!==b.dataset.filter;if(!card.hidden)n++;else card.querySelector('video').pause();});$('galleryCount').textContent=n+' examples';});
$('caseSelect').innerHTML=DATA.cases.map((c,i)=>`<option value="${i}">${esc(labels[i])}</option>`).join('');
$('modelSelect').innerHTML=Object.entries(DATA.models).filter(([k])=>k!=='ours').map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('');
let controlMode='camera';
function setControl(){const c=DATA.cases[+$('caseSelect').value];const image=controlMode==='input'||controlMode==='annotation';$('compareControl').hidden=image;$('compareImage').hidden=!image;if(image){$('compareControl').pause();$('compareImage').src=controlMode==='input'?c.inputData:c.annotationData;$('compareImage').alt=labels[+$('caseSelect').value]+(controlMode==='input'?' original image':' projected 2D control');}else bindVideo($('compareControl'),c[controlMode]);$('compareControlLabel').innerHTML=`<span class="dot"></span> ${esc({camera:'Camera overview',scene:'Scene detail',input:'Input image',annotation:'2D control'}[controlMode])}`;setPressed($('controlModes'),'data-control',controlMode);}
function setComparison(){const c=DATA.cases[+$('caseSelect').value];const model=c.models.find(x=>x.key===$('modelSelect').value);$('compareInstruction').textContent=c.instruction;bindVideo($('compareOurs'),c.models.find(x=>x.key==='ours'));bindVideo($('compareBaseline'),model);$('baselineLabel').textContent=model.label;setControl();}
$('caseSelect').addEventListener('change',setComparison);$('modelSelect').addEventListener('change',setComparison);
$('controlModes').addEventListener('click',e=>{const b=e.target.closest('button');if(b){controlMode=b.dataset.control;setControl();}});
setComparison();
$('replayCompare').addEventListener('click',async()=>{const vs=[$('compareControl'),$('compareOurs'),$('compareBaseline')].filter(v=>!v.hidden);vs.forEach(v=>{v.pause();ensureLoaded(v);});await Promise.all(vs.map(v=>v.readyState>=2?Promise.resolve():new Promise(resolve=>{v.addEventListener('loadeddata',resolve,{once:true});setTimeout(resolve,6000);})));playing=true;vs.forEach(v=>{v.currentTime=0;v.dataset.visible='yes';});refreshPlayback();});
$('compareOurs').addEventListener('timeupdate',()=>{const a=$('compareOurs');if(!a.paused)for(const b of [$('compareControl'),$('compareBaseline')])if(!b.hidden&&!b.paused&&b.readyState>=2&&Math.abs(a.currentTime-b.currentTime)>.2)b.currentTime=a.currentTime;});
document.addEventListener('click',e=>{const enlarge=e.target.closest('[data-enlarge]');if(enlarge)openVideo($(enlarge.dataset.enlarge));const compare=e.target.closest('[data-compare]');if(compare){$('caseSelect').value=compare.dataset.compare;setComparison();$('compare').scrollIntoView({behavior:motionReduced?'instant':'smooth'});}const image=e.target.closest('[data-image]');if(image)openImage(image.dataset.image,image.dataset.title);});
function showModal(title){$('modalTitle').textContent=title;modalOpen=true;refreshPlayback();$('mediaDialog').showModal();}
function openVideo(v){const src=v.dataset.src||v.getAttribute('src');if(!src)return;showModal(v.dataset.title||v.getAttribute('aria-label'));$('modalContent').innerHTML=`<video id="modalVideo" src="${esc(src)}" poster="${esc(v.poster)}" controls autoplay muted loop playsinline aria-label="Enlarged video"></video>`;$('modalVideo').currentTime=v.currentTime||0;$('modalVideo').play().catch(()=>{});}
function openImage(src,title){showModal(title);$('modalContent').innerHTML=`<img src="${esc(src)}" alt="${esc(title)}">`;}
$('closeDialog').addEventListener('click',()=>$('mediaDialog').close());
$('mediaDialog').addEventListener('click',e=>{if(e.target===$('mediaDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('mediaDialog').addEventListener('close',()=>{const v=$('modalVideo');if(v)v.pause();$('modalContent').replaceChildren();modalOpen=false;refreshPlayback();});
$('enlargeControl').addEventListener('click',()=>{if($('compareImage').hidden)openVideo($('compareControl'));else openImage($('compareImage').src,$('compareImage').alt);});
// True perspective projection, with fixed world XYZ colors and one Gaussian handle.
const bg=[];for(let x=-2.5;x<=2.5;x+=.32)for(let z=.1;z<=4;z+=.3)bg.push([x,0,z]);for(let x=-2.5;x<=2.5;x+=.32)for(let y=.28;y<=1.9;y+=.27)bg.push([x,y,4]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rgb=p=>[clamp((p[0]+3)/6,0,1),clamp((p[1]+.2)/2.4,0,1),clamp(p[2]/4.5,0,1)].map(v=>Math.round(v*255));
const color=p=>'rgb('+rgb(p).join(',')+')';
const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function clearCanvas(id,bgcolor){const c=$(id),ctx=c.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle=bgcolor;ctx.fillRect(0,0,c.width/2,c.height/2);return ctx;}
function drawLab(){const orbit=+$('cameraRange').value,u=+$('objectRange').value/100,angle=orbit*Math.PI/180,handle=[u*1.65,1+u*.18,2+u*.45],camera=[Math.sin(angle)*5,1.15,2-Math.cos(angle)*5];const forward=norm([0-camera[0],.75-camera[1],2-camera[2]]),right=norm(cross([0,1,0],forward)),up=cross(forward,right);
const project=p=>{const q=p.map((v,i)=>v-camera[i]),z=dot(q,forward);return [110+dot(q,right)*200/z,85-dot(q,up)*200/z,z];};
$('cameraValue').textContent=orbit+'°';$('objectValue').textContent=(u*1.65).toFixed(2)+' world X';$('xyzValue').textContent=rgb(handle).join(', ');$('xyzSwatch').style.background=color(handle);
const b=clearCanvas('bgCanvas','#000000');for(const p of bg){const q=project(p);if(q[2]>0){b.fillStyle=color(p);b.beginPath();b.arc(q[0],q[1],1.8,0,Math.PI*2);b.fill();}}
const h=project(handle),radius=200*.3/h[2];for(const [id,base] of [['fgCanvas',rgb(handle)],['idCanvas',[83,183,201]]]){const c=clearCanvas(id,'#000000');const grad=c.createRadialGradient(h[0],h[1],0,h[0],h[1],radius*1.8);grad.addColorStop(0,`rgba(${base},1)`);grad.addColorStop(.35,`rgba(${base},.82)`);grad.addColorStop(1,`rgba(${base},0)`);c.fillStyle=grad;c.beginPath();c.ellipse(h[0],h[1],radius*1.8,radius*1.8,0,0,Math.PI*2);c.fill();}
const w=clearCanvas('worldCanvas','#f5f7f3');const iso=p=>[205+p[0]*43+p[2]*19,218-p[1]*65+p[2]*10];function line(p,q,c,width=1,dash=[]){const a=iso(p),b=iso(q);w.strokeStyle=c;w.lineWidth=width;w.setLineDash(dash);w.beginPath();w.moveTo(...a);w.lineTo(...b);w.stroke();w.setLineDash([]);}
for(let x=-3;x<=3;x++)line([x,0,-2],[x,0,4],'#dde5db');for(let z=-2;z<=4;z++)line([-3,0,z],[3,0,z],'#dde5db');
for(const p of bg){const q=iso(p);w.fillStyle='#80a58c';w.globalAlpha=p[1]===0?.45:.65;w.beginPath();w.arc(...q,1.5,0,Math.PI*2);w.fill();}w.globalAlpha=1;
line([-1.65,.82,1.55],[1.65,1.18,2.45],'#3b8ca4',1.7,[4,4]);line([handle[0],0,handle[2]],handle,'#81a8b1',1,[3,3]);
for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++)for(let z=-1;z<=1;z++){const p=[handle[0]+x*.075,handle[1]+y*.075,handle[2]+z*.08],q=iso(p);w.fillStyle='#3b8ca4';w.globalAlpha=.5+((x+y+z+5)%3)*.18;w.beginPath();w.arc(...q,2,0,Math.PI*2);w.fill();}w.globalAlpha=1;
const hp=iso(handle);w.strokeStyle='#39869a';w.lineWidth=1.2;w.beginPath();w.arc(...hp,16,0,Math.PI*2);w.stroke();w.font='13px -apple-system, sans-serif';w.fillStyle='#34768b';w.fillText('Handle 01',hp[0]-23,hp[1]-24);
const cp=iso(camera);line(camera,[0,.75,2],'#c8793d',1,[4,5]);w.fillStyle='#fff7eb';w.strokeStyle='#c8793d';w.lineWidth=1.7;w.beginPath();w.roundRect(cp[0]-11,cp[1]-7,22,14,3);w.fill();w.stroke();w.beginPath();w.moveTo(cp[0]+11,cp[1]-4);w.lineTo(cp[0]+18,cp[1]-8);w.lineTo(cp[0]+18,cp[1]+8);w.lineTo(cp[0]+11,cp[1]+4);w.closePath();w.fill();w.stroke();w.fillStyle='#a36334';w.fillText('Camera',cp[0]-19,cp[1]+25);
w.fillStyle='#7a8e7b';w.font='12px -apple-system, sans-serif';w.fillText('Static scene',273,95);
$('labNote').textContent=u!==0?'The handle moved in world space: its XYZ color changed, while Handle 01 kept the same identity color. Both foreground maps follow the same projection.':orbit!==0?'The camera moved: the projected locations changed, while the world XYZ and identity colors stayed fixed.':'Try the camera slider: projections move, but the world-coordinate colors stay the same.';
}
$('cameraRange').addEventListener('input',drawLab);$('objectRange').addEventListener('input',drawLab);$('resetLab').addEventListener('click',()=>{$('cameraRange').value=0;$('objectRange').value=0;drawLab();});drawLab();refreshPlayback();
