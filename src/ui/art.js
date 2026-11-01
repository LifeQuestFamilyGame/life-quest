// Drawings shared with the Life Quest Studio and the design canvas.
// Each function returns SVG markup built only from fixed colour tables and option names.
/* eslint-disable */
var SKIN=["#FCE0C5","#F3C99B","#DDA26C","#B97B4E","#8A5634","#5E3A22"];
var HAIR={black:"#1F1B24",brown:"#5A3825",chestnut:"#8E4B2A",blonde:"#E7B84B",ginger:"#CC5A2A",blue:"#3F7DE0",green:"#2FB67C",purple:"#8A5CD6"};
var HAIR_NAMES={black:"Black",brown:"Brown",chestnut:"Chestnut",blonde:"Blonde",ginger:"Ginger",blue:"Blue",green:"Green",purple:"Purple"};
var OUTFIT=["#E5484D","#F28C28","#F5C518","#22A06B","#2F80ED","#7C5CFF","#E94C9B","#2C3446"];
var OUTFIT_NAMES=["Red","Orange","Yellow","Green","Blue","Purple","Pink","Black"];
var PANTS="#2B3A67";
function esc(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function shade(hex,f){var n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255,m=f<0?0:255,p=Math.abs(f);
  r=Math.round((m-r)*p+r);g=Math.round((m-g)*p+g);b=Math.round((m-b)*p+b);
  return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
function starPts(cx,cy,R,r){var pts=[];for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rad=i%2?r:R;pts.push((cx+rad*Math.cos(a)).toFixed(1)+","+(cy+rad*Math.sin(a)).toFixed(1));}return pts.join(" ");}
function heroInner(c,mode,uid){
  var ink="#141414", ol=mode==="comic"?' stroke="'+ink+'" stroke-width="3" stroke-linejoin="round"':"";
  var sk=SKIN[c.skin], hr=HAIR[c.hairColour], oc=OUTFIT[c.outfitColour], ocd=shade(oc,-0.24);
  var suit=c.outfit==="spacesuit", coat=c.outfit==="labcoat";
  var white="#EEF2F7", grey="#C5CEDB", coatWhite="#F7F9FC";
  var torso=suit?white:coat?coatWhite:oc;
  var longSleeve=c.outfit==="hoodie"||coat||suit;
  var sleeve=suit?white:coat?coatWhite:oc;
  var leg=suit?white:PANTS, shoe=suit?"#8C97A8":"#2A2A2E";
  var clip="tc"+uid, s="";
  s+='<defs><clipPath id="'+clip+'"><rect x="61" y="118" width="78" height="78" rx="24"/></clipPath></defs>';
  s+='<ellipse cx="100" cy="240" rx="50" ry="7" fill="#000" fill-opacity=".12"/>';
  if(c.extra==="cape")s+='<path d="M64 124 L136 124 L156 228 Q100 238 44 228 Z" fill="'+ocd+'"'+ol+'/>';
  if(c.extra==="backpack")s+='<rect x="54" y="128" width="92" height="64" rx="18" fill="#8B5E34"'+ol+'/>';
  if(c.hairStyle==="long")s+='<path d="M51 80 Q47 148 74 152 L126 152 Q153 148 149 80 Z" fill="'+hr+'"'+ol+'/>';
  s+='<rect x="79" y="186" width="18" height="44" rx="8" fill="'+leg+'"'+ol+'/><rect x="103" y="186" width="18" height="44" rx="8" fill="'+leg+'"'+ol+'/>';
  s+='<rect x="71" y="222" width="29" height="14" rx="7" fill="'+shoe+'"'+ol+'/><rect x="100" y="222" width="29" height="14" rx="7" fill="'+shoe+'"'+ol+'/>';
  var arm=longSleeve?sleeve:sk;
  s+='<rect x="44" y="126" width="19" height="56" rx="9.5" fill="'+arm+'"'+ol+'/><rect x="137" y="126" width="19" height="56" rx="9.5" fill="'+arm+'"'+ol+'/>';
  if(!longSleeve)s+='<rect x="44" y="123" width="19" height="25" rx="9" fill="'+oc+'"'+ol+'/><rect x="137" y="123" width="19" height="25" rx="9" fill="'+oc+'"'+ol+'/>';
  if(suit)s+='<rect x="44" y="166" width="19" height="9" fill="'+oc+'"/><rect x="137" y="166" width="19" height="9" fill="'+oc+'"/>';
  var hand=suit?grey:sk;
  s+='<circle cx="53.5" cy="186" r="9.5" fill="'+hand+'"'+ol+'/><circle cx="146.5" cy="186" r="9.5" fill="'+hand+'"'+ol+'/>';
  s+='<rect x="91" y="106" width="18" height="20" rx="6" fill="'+sk+'"'+ol+'/>';
  if(c.outfit==="hoodie")s+='<path d="M68 128 Q100 98 132 128 Z" fill="'+ocd+'"'+ol+'/>';
  s+='<rect x="61" y="118" width="78" height="78" rx="24" fill="'+torso+'"'+ol+'/>';
  var d="";
  if(c.outfit==="tshirt")d+='<path d="M87 118 Q100 132 113 118 Z" fill="'+sk+'"/><polygon points="'+starPts(100,156,13,5.5)+'" fill="#fff" fill-opacity=".92"/>';
  if(c.outfit==="hoodie")d+='<path d="M94 124 v22 M106 124 v22" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="77" y="164" width="46" height="20" rx="9" fill="'+ocd+'"/>';
  if(c.outfit==="jersey")d+='<rect x="64" y="118" width="9" height="80" fill="#fff" fill-opacity=".9"/><rect x="127" y="118" width="9" height="80" fill="#fff" fill-opacity=".9"/><path d="M87 118 Q100 128 113 118" stroke="#fff" stroke-width="5" fill="none"/><text x="100" y="172" text-anchor="middle" font-family="Lilita One, Arial Black, sans-serif" font-size="32" fill="#fff">10</text>';
  if(coat)d+='<path d="M84 118 L100 154 L116 118 Z" fill="'+oc+'"/><path d="M84 118 L97 162 M116 118 L103 162" stroke="#B9C3D3" stroke-width="3" fill="none"/><rect x="112" y="152" width="17" height="18" rx="3" fill="#E3E8F0"/><path d="M116 147 v11 M122 146 v12" stroke="'+oc+'" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="174" r="3" fill="#B9C3D3"/><circle cx="100" cy="186" r="3" fill="#B9C3D3"/>';
  if(suit)d+='<rect x="61" y="178" width="78" height="10" fill="'+oc+'"/><rect x="82" y="138" width="36" height="24" rx="6" fill="'+grey+'"/><circle cx="91" cy="150" r="4" fill="'+oc+'"/><circle cx="100" cy="150" r="4" fill="#F5C518"/><circle cx="109" cy="150" r="4" fill="#22A06B"/>';
  s+='<g clip-path="url(#'+clip+')">'+d+'</g>';
  if(suit)s+='<ellipse cx="100" cy="119" rx="27" ry="8" fill="'+grey+'"'+ol+'/>';
  if(c.extra==="backpack")s+='<rect x="70" y="119" width="9" height="58" rx="4" fill="#6E4524"/><rect x="121" y="119" width="9" height="58" rx="4" fill="#6E4524"/>';
  s+='<circle cx="56" cy="82" r="9" fill="'+sk+'"'+ol+'/><circle cx="144" cy="82" r="9" fill="'+sk+'"'+ol+'/>';
  s+='<circle cx="100" cy="76" r="44" fill="'+sk+'"'+ol+'/>';
  s+='<circle cx="73" cy="94" r="6.5" fill="#F07C7C" fill-opacity=".35"/><circle cx="127" cy="94" r="6.5" fill="#F07C7C" fill-opacity=".35"/>';
  var e="#1D2A4D";
  if(c.eyes==="round")s+='<circle cx="84" cy="80" r="6" fill="'+e+'"/><circle cx="116" cy="80" r="6" fill="'+e+'"/><circle cx="86" cy="78" r="2" fill="#fff"/><circle cx="118" cy="78" r="2" fill="#fff"/>';
  if(c.eyes==="happy")s+='<path d="M77 82 Q84 73 91 82 M109 82 Q116 73 123 82" stroke="'+e+'" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
  if(c.eyes==="sparkly")s+='<circle cx="84" cy="80" r="8.5" fill="'+e+'"/><circle cx="116" cy="80" r="8.5" fill="'+e+'"/><circle cx="87" cy="77" r="3" fill="#fff"/><circle cx="119" cy="77" r="3" fill="#fff"/><circle cx="81.5" cy="83" r="1.5" fill="#fff"/><circle cx="113.5" cy="83" r="1.5" fill="#fff"/>';
  if(c.eyes==="determined")s+='<circle cx="84" cy="81" r="5.5" fill="'+e+'"/><circle cx="116" cy="81" r="5.5" fill="'+e+'"/><path d="M74 68 L92 73 M126 68 L108 73" stroke="'+shade(hr,-0.1)+'" stroke-width="4.5" stroke-linecap="round"/>';
  s+='<path d="M87 97 Q100 113 113 97 Z" fill="#8E2F3C"/><ellipse cx="100" cy="104.5" rx="6" ry="2.6" fill="#F28B8B"/>';
  var hs=c.hairStyle;
  if(hs==="short")s+='<path d="M56 74 Q56 30 100 29 Q144 30 144 74 Q132 52 100 53 Q68 52 56 74 Z" fill="'+hr+'"'+ol+'/>';
  if(hs==="buzz")s+='<path d="M58 66 Q62 34 100 33 Q138 34 142 66 Q124 50 100 50 Q76 50 58 66 Z" fill="'+hr+'" fill-opacity=".88"'+ol+'/>';
  if(hs==="spiky")s+='<polygon points="56,74 58,46 70,50 74,27 88,42 100,19 112,42 126,27 130,50 142,46 144,74 128,56 100,54 72,56" fill="'+hr+'"'+ol+'/>';
  if(hs==="curly")s+='<path d="M56 72 Q56 32 100 31 Q144 32 144 72 Q130 54 100 55 Q70 54 56 72 Z" fill="'+hr+'"/><g fill="'+hr+'"'+ol+'><circle cx="61" cy="60" r="12"/><circle cx="69" cy="43" r="13"/><circle cx="85" cy="32" r="14"/><circle cx="103" cy="28" r="14"/><circle cx="120" cy="33" r="13"/><circle cx="133" cy="45" r="12"/><circle cx="140" cy="61" r="10"/></g>';
  if(hs==="swoosh")s+='<path d="M56 72 Q56 30 100 29 Q144 30 144 72 Q138 56 120 54 Q90 52 56 72 Z" fill="'+hr+'"'+ol+'/><path d="M59 67 Q84 33 138 50 Q108 52 92 66 Q75 77 59 67 Z" fill="'+shade(hr,0.14)+'"'+ol+'/>';
  if(hs==="long")s+='<path d="M55 78 Q55 30 100 29 Q145 30 145 78 Q141 56 124 51 Q100 61 76 51 Q59 56 55 78 Z" fill="'+hr+'"'+ol+'/>';
  if(c.extra==="cap")s+='<path d="M54 67 Q55 25 100 24 Q145 25 146 67 Z" fill="'+oc+'"'+ol+'/><path d="M104 60 Q150 55 173 65 Q153 72 104 66 Z" fill="'+ocd+'"'+ol+'/><circle cx="100" cy="25" r="4" fill="'+ocd+'"/>';
  if(c.extra==="headphones")s+='<path d="M51 84 Q49 20 100 20 Q151 20 149 84" stroke="#2B2B35" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="39" y="66" width="18" height="33" rx="8" fill="'+oc+'"'+(ol||' stroke="#2B2B35" stroke-width="3"')+'/><rect x="143" y="66" width="18" height="33" rx="8" fill="'+oc+'"'+(ol||' stroke="#2B2B35" stroke-width="3"')+'/>';
  if(c.extra==="glasses")s+='<circle cx="84" cy="80" r="12.5" fill="#fff" fill-opacity=".22" stroke="#1D2A4D" stroke-width="3.5"/><circle cx="116" cy="80" r="12.5" fill="#fff" fill-opacity=".22" stroke="#1D2A4D" stroke-width="3.5"/><path d="M96.5 80 Q100 76 103.5 80 M71.5 79 L58 75 M128.5 79 L142 75" stroke="#1D2A4D" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
  return s;
}
var uidN=0;
function die(x,y,rot,stroke,sw){
  var p=[[-8,-8],[8,-8],[0,0],[-8,8],[8,8]],s='<g transform="translate('+x+' '+y+') rotate('+rot+')"><rect x="-17" y="-17" width="34" height="34" rx="8" fill="#fff" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
  for(var i=0;i<p.length;i++)s+='<circle cx="'+p[i][0]+'" cy="'+p[i][1]+'" r="3.3" fill="#1D2A4D"/>';
  return s+'</g>';
}
function petSVG(id){
  var o='<svg viewBox="0 0 120 96" role="img" aria-label="'+esc(id)+'">',c="</svg>";
  if(id==="puppy")return o+'<rect width="120" height="96" rx="14" fill="#FFF3D6"/><ellipse cx="37" cy="50" rx="12" ry="23" fill="#C98A34" transform="rotate(18 37 50)"/><ellipse cx="83" cy="50" rx="12" ry="23" fill="#C98A34" transform="rotate(-18 83 50)"/><circle cx="60" cy="46" r="27" fill="#E3AA55"/><ellipse cx="60" cy="60" rx="16" ry="12" fill="#F6D7A0"/><ellipse cx="60" cy="54" rx="6.5" ry="4.5" fill="#2A1E17"/><circle cx="49" cy="42" r="4" fill="#2A1E17"/><circle cx="71" cy="42" r="4" fill="#2A1E17"/><circle cx="50.4" cy="40.6" r="1.4" fill="#fff"/><circle cx="72.4" cy="40.6" r="1.4" fill="#fff"/><path d="M57 65 q3 10 6 0 z" fill="#F27A8A"/><path d="M53 63 Q60 69 67 63" stroke="#2A1E17" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="40" y="73" width="40" height="7" rx="3.5" fill="#E5484D"/><circle cx="60" cy="83" r="4.5" fill="#F5C518" stroke="#C99A00" stroke-width="1.5"/>'+c;
  if(id==="axolotl")return o+'<rect width="120" height="96" rx="14" fill="#E3F6FF"/><g fill="#E8679A"><ellipse cx="26" cy="36" rx="12" ry="4.5" transform="rotate(-25 26 36)"/><ellipse cx="22" cy="49" rx="13" ry="4.5"/><ellipse cx="26" cy="62" rx="12" ry="4.5" transform="rotate(25 26 62)"/><ellipse cx="94" cy="36" rx="12" ry="4.5" transform="rotate(25 94 36)"/><ellipse cx="98" cy="49" rx="13" ry="4.5"/><ellipse cx="94" cy="62" rx="12" ry="4.5" transform="rotate(-25 94 62)"/></g><ellipse cx="60" cy="50" rx="33" ry="26" fill="#F7A8C4"/><circle cx="46" cy="46" r="4.5" fill="#2A1E2F"/><circle cx="74" cy="46" r="4.5" fill="#2A1E2F"/><circle cx="47.5" cy="44.5" r="1.5" fill="#fff"/><circle cx="75.5" cy="44.5" r="1.5" fill="#fff"/><circle cx="40" cy="57" r="4.5" fill="#F07AA5" fill-opacity=".5"/><circle cx="80" cy="57" r="4.5" fill="#F07AA5" fill-opacity=".5"/><path d="M48 59 Q60 68 72 59" stroke="#B4466F" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="96" cy="80" r="3" fill="#9BD7F2"/><circle cx="102" cy="72" r="2" fill="#9BD7F2"/>'+c;
  if(id==="beetle")return o+'<defs><linearGradient id="iri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2EC4B6"/><stop offset=".5" stop-color="#3A86FF"/><stop offset="1" stop-color="#8338EC"/></linearGradient></defs><rect width="120" height="96" rx="14" fill="#EAF8EC"/><path d="M41 44 L25 36 M39 58 L22 60 M43 71 L29 83 M79 44 L95 36 M81 58 L98 60 M77 71 L91 83" stroke="#2A2A2E" stroke-width="3" stroke-linecap="round"/><path d="M55 20 Q49 8 40 9 M65 20 Q71 8 80 9" stroke="#2A2A2E" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="60" cy="27" r="10" fill="#1F2937"/><ellipse cx="60" cy="58" rx="24" ry="29" fill="url(#iri)"/><path d="M60 31 V86" stroke="#1F2937" stroke-width="2.5"/><ellipse cx="50" cy="48" rx="5" ry="11" fill="#fff" fill-opacity=".35"/>'+c;
  if(id==="shrimp")return o+'<rect width="120" height="96" rx="14" fill="#E8F6FF"/><rect x="16" y="14" width="88" height="68" rx="8" fill="#BFE8FF" stroke="#5A7FA8" stroke-width="3"/><rect x="17.5" y="15.5" width="85" height="9" fill="#fff" fill-opacity=".55"/><rect x="18" y="70" width="84" height="10" fill="#C9A27A"/><g fill="#A9845F"><circle cx="28" cy="74" r="2"/><circle cx="44" cy="77" r="2"/><circle cx="66" cy="74" r="2"/><circle cx="88" cy="76" r="2"/></g><path d="M33 70 Q26 54 35 40 Q42 54 38 70 Z" fill="#2FB67C"/><path d="M84 70 Q93 50 82 35 Q77 52 79 70 Z" fill="#22A06B"/><path d="M47 54 Q60 38 75 49 Q71 60 58 60 Q51 60 47 54 Z" fill="#E5484D"/><path d="M48 54 L39 49 L41 58 Z" fill="#C73A3F"/><circle cx="70" cy="48.5" r="1.9" fill="#1D2A4D"/><path d="M75 47 Q85 37 94 41" stroke="#E5484D" stroke-width="1.6" fill="none"/><g fill="#fff" fill-opacity=".8"><circle cx="64" cy="32" r="2.5"/><circle cx="68" cy="25" r="1.8"/></g>'+c;
  if(id==="turtle")return o+'<rect width="120" height="96" rx="14" fill="#EAF7E6"/><g fill="#8BC34A"><ellipse cx="33" cy="46" rx="10" ry="7"/><ellipse cx="87" cy="46" rx="10" ry="7"/><ellipse cx="35" cy="76" rx="10" ry="7"/><ellipse cx="85" cy="76" rx="10" ry="7"/><path d="M57 84 L60 92 L63 84 Z"/><circle cx="60" cy="24" r="12"/></g><circle cx="55" cy="22" r="2.6" fill="#1D2A4D"/><circle cx="65" cy="22" r="2.6" fill="#1D2A4D"/><path d="M55 29 Q60 32 65 29" stroke="#1D2A4D" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="60" rx="31" ry="26" fill="#3E8E41"/><g fill="#5DAE5F"><polygon points="60,45 71,51 71,63 60,69 49,63 49,51"/><polygon points="40,52 46,49 46,64 38,66 34,59"/><polygon points="80,52 74,49 74,64 82,66 86,59"/></g><ellipse cx="60" cy="60" rx="31" ry="26" fill="none" stroke="#2E6B31" stroke-width="3"/>'+c;
  return o+'<rect width="120" height="96" rx="14" fill="#FFF0E6"/><polygon points="33,34 39,8 56,24" fill="#F28C28"/><polygon points="87,34 81,8 64,24" fill="#F28C28"/><polygon points="38,28 41,15 50,24" fill="#F7B5B5"/><polygon points="82,28 79,15 70,24" fill="#F7B5B5"/><ellipse cx="60" cy="50" rx="31" ry="27" fill="#F6A04D"/><path d="M52 26 L54 34 M60 24 L60 33 M68 26 L66 34" stroke="#D97C24" stroke-width="3" stroke-linecap="round"/><ellipse cx="48" cy="48" rx="4.2" ry="5.5" fill="#233"/><ellipse cx="72" cy="48" rx="4.2" ry="5.5" fill="#233"/><circle cx="49.5" cy="46" r="1.5" fill="#fff"/><circle cx="73.5" cy="46" r="1.5" fill="#fff"/><polygon points="56.5,57 63.5,57 60,61" fill="#E35D6A"/><path d="M60 61 q-4 6 -9 2 M60 61 q4 6 9 2" stroke="#233" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M42 58 L22 54 M42 62 L22 64 M78 58 L98 54 M78 62 L98 64" stroke="#6B4A2B" stroke-width="1.6" stroke-linecap="round"/>'+c;
}

function roomSVG(id){
  var o='<svg viewBox="0 0 120 96" role="img" aria-label="'+esc(id)+'">',c="</svg>";
  if(id==="telescope")return o+'<rect width="120" height="96" rx="14" fill="#1E2A4A"/><g fill="#fff"><circle cx="16" cy="18" r="1.6"/><circle cx="40" cy="10" r="1.2"/><circle cx="102" cy="40" r="1.4"/><circle cx="84" cy="12" r="1.2"/><circle cx="22" cy="48" r="1.2"/></g><path d="M98 14 a12 12 0 1 0 8 20 a10 10 0 1 1 -8 -20 z" fill="#FFE38A"/><path d="M58 52 L40 86 M58 52 L60 88 M58 52 L78 86" stroke="#C9D3E0" stroke-width="4" stroke-linecap="round"/><g transform="rotate(-32 58 46)"><rect x="30" y="38" width="60" height="16" rx="5" fill="#E5484D"/><rect x="86" y="35" width="10" height="22" rx="3" fill="#F5C518"/><rect x="24" y="41" width="8" height="10" rx="2" fill="#C9D3E0"/></g>'+c;
  if(id==="terrarium")return o+'<rect width="120" height="96" rx="14" fill="#F1FAEE"/><rect x="18" y="20" width="84" height="62" rx="6" fill="#DFF5E3" stroke="#6B8F71" stroke-width="3"/><rect x="14" y="13" width="92" height="9" rx="3" fill="#6B8F71"/><rect x="19.5" y="66" width="81" height="14" fill="#8D6E4E"/><path d="M28 66 Q44 46 70 50 Q84 52 92 40" stroke="#7A5230" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M40 60 Q32 44 46 38 Q48 52 40 60 Z" fill="#2FB67C"/><path d="M86 66 Q94 54 88 46 Q80 56 86 66 Z" fill="#22A06B"/><ellipse cx="66" cy="45" rx="7" ry="5" fill="#3A86FF"/><circle cx="72" cy="44" r="3" fill="#1F2937"/>'+c;
  if(id==="bunk")return o+'<rect width="120" height="96" rx="14" fill="#FFF7E6"/><rect x="14" y="12" width="7" height="74" rx="3" fill="#8B5E34"/><rect x="66" y="12" width="7" height="74" rx="3" fill="#8B5E34"/><rect x="14" y="30" width="59" height="12" rx="4" fill="#4D96FF"/><rect x="14" y="62" width="59" height="12" rx="4" fill="#FF6B6B"/><rect x="20" y="24" width="16" height="8" rx="3" fill="#fff"/><rect x="20" y="56" width="16" height="8" rx="3" fill="#fff"/><path d="M73 30 Q86 34 92 56 Q98 78 112 84 L112 90 Q92 86 86 62 Q80 42 73 40 Z" fill="#FFC93C" stroke="#E9A800" stroke-width="2"/>'+c;
  if(id==="chair")return o+'<rect width="120" height="96" rx="14" fill="#F1ECFF"/><rect x="40" y="8" width="40" height="50" rx="14" fill="#2C3446"/><rect x="48" y="12" width="7" height="42" rx="3" fill="#7C5CFF"/><rect x="65" y="12" width="7" height="42" rx="3" fill="#7C5CFF"/><rect x="34" y="52" width="52" height="14" rx="7" fill="#2C3446"/><rect x="30" y="40" width="8" height="18" rx="4" fill="#3B455B"/><rect x="82" y="40" width="8" height="18" rx="4" fill="#3B455B"/><rect x="57" y="66" width="6" height="12" fill="#5B6478"/><path d="M60 78 L36 84 M60 78 L84 84 M60 78 L60 88" stroke="#5B6478" stroke-width="5" stroke-linecap="round"/><g fill="#1D2A4D"><circle cx="34" cy="86" r="4"/><circle cx="86" cy="86" r="4"/><circle cx="60" cy="90" r="4"/></g>'+c;
  if(id==="stars")return o+'<rect width="120" height="96" rx="14" fill="#24325C"/><g fill="#DDF94F"><polygon points="'+starPts(28,26,9,4)+'"/><polygon points="'+starPts(62,18,6,2.6)+'"/><polygon points="'+starPts(92,34,10,4.4)+'"/><polygon points="'+starPts(44,58,7,3)+'"/><polygon points="'+starPts(78,68,8,3.4)+'"/><polygon points="'+starPts(20,76,5,2.2)+'"/></g><g fill="#DDF94F" fill-opacity=".18"><circle cx="28" cy="26" r="15"/><circle cx="92" cy="34" r="16"/><circle cx="78" cy="68" r="13"/></g><path d="M104 66 a10 10 0 1 0 6 16 a8 8 0 1 1 -6 -16 z" fill="#FFF7C2"/>'+c;
  return o+'<rect width="120" height="96" rx="14" fill="#FFF3E0"/><rect x="12" y="58" width="96" height="9" rx="3" fill="#C08A5A"/><rect x="18" y="67" width="7" height="21" fill="#A06E43"/><rect x="95" y="67" width="7" height="21" fill="#A06E43"/><g><rect x="24" y="44" width="26" height="14" rx="2" fill="#E5484D"/><rect x="27" y="40" width="6" height="4" rx="1" fill="#E5484D"/><rect x="40" y="40" width="6" height="4" rx="1" fill="#E5484D"/><rect x="34" y="30" width="26" height="14" rx="2" fill="#2F80ED"/><rect x="37" y="26" width="6" height="4" rx="1" fill="#2F80ED"/><rect x="50" y="26" width="6" height="4" rx="1" fill="#2F80ED"/><rect x="62" y="44" width="20" height="14" rx="2" fill="#F5C518"/><rect x="65" y="40" width="6" height="4" rx="1" fill="#F5C518"/><rect x="84" y="44" width="16" height="14" rx="2" fill="#22A06B"/><rect x="87" y="40" width="6" height="4" rx="1" fill="#22A06B"/><rect x="66" y="22" width="16" height="22" rx="2" fill="#7C5CFF"/></g>'+c;
}


export { SKIN, HAIR, HAIR_NAMES, OUTFIT, OUTFIT_NAMES, shade, starPts, esc };
export function heroSvg(hero, opts) {
  opts = opts || {};
  uidN++;
  var label = opts.label || 'Hero';
  if (opts.style === 'pixel') return pixelHeroSvg(hero, label);
  return '<svg viewBox="0 0 200 250" width="100%" height="100%" role="img" aria-label="' + esc(label) + '">' + heroInner(hero, opts.comic ? 'comic' : 'cartoon', 'h' + uidN) + '</svg>';
}
export function pixelHeroSvg(hero, label) {
  var map = ["...HHHHHH...","..HHHHHHHH..","..HSSSSSSH..","..SSESSESS..","..SSSSSSSS..","..SSRRRRSS..","...SSSSSS...","..OOOOOOOO..",".SOOOOOOOOS.",".SOOOWWOOOS.",".SOOOOOOOOS.","..OOOOOOOO..","..PPP..PPP..","..PPP..PPP..","..PPP..PPP..",".BBBB..BBBB."];
  var col = { H: HAIR[hero.hairColour] || '#5A3825', S: SKIN[hero.skin] || SKIN[1], E: '#1D2A4D', R: '#C0392B', O: OUTFIT[hero.outfitColour] || OUTFIT[4], W: '#FFFFFF', P: PANTS, B: '#2A2A2E' };
  var s = '';
  for (var r = 0; r < map.length; r++) { var c = 0; while (c < 12) { var k = map[r][c]; if (k === '.') { c++; continue; } var e = c; while (e < 12 && map[r][e] === k) e++; s += '<rect x="' + c + '" y="' + r + '" width="' + (e - c) + '" height="1" fill="' + col[k] + '"/>'; c = e; } }
  return '<svg viewBox="-3 -1 18 18" width="100%" height="100%" role="img" aria-label="' + esc(label) + '" shape-rendering="crispEdges">' + s + '</svg>';
}
export function petSvg(type) { return petSVG(type); }
export function roomSvg(id) { return roomSVG(id); }
export function dieSvg(n) {
  var P = { 1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[30, 30], [50, 50], [70, 70]], 4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]], 6: [[30, 28], [70, 28], [30, 50], [70, 50], [30, 72], [70, 72]] }[n] || [];
  var s = '<svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="Die showing ' + n + '"><rect x="9" y="11" width="86" height="86" rx="20" fill="#1D2A4D"/><rect x="4" y="4" width="86" height="86" rx="20" fill="#fff" stroke="#1D2A4D" stroke-width="5"/>';
  for (var i = 0; i < P.length; i++) s += '<circle cx="' + (P[i][0] - 3) + '" cy="' + (P[i][1] - 3) + '" r="8" fill="#1D2A4D"/>';
  return s + '</svg>';
}
