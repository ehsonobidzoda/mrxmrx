function showResult(text, label){
  const el = document.getElementById('result');
  el.textContent = text;
  document.getElementById('resultTag').textContent = label || 'Ҷавоб';
  document.getElementById('resultDock').scrollIntoView({behavior:'smooth', block:'start'});
  addHistory(label || 'Ҳисоб', text);
}

function fmt(n, d=6){
  if (!isFinite(n)) return String(n);
  return Number(n.toFixed(d)).toString();
}

const OP_DISPLAY = { '>':'>', '<':'<', '>=':'≥', '<=':'≤' };
const OP_FLIP = { '>':'<', '<':'>', '>=':'<=', '<=':'>=' };
function opDisplay(op){ return OP_DISPLAY[op]; }
function flipOp(op){ return OP_FLIP[op]; }
function compareOp(l, r, op){
  switch(op){
    case '>': return l > r;
    case '<': return l < r;
    case '>=': return l >= r;
    case '<=': return l <= r;
  }
}
function fmtInterval(lo, hi, closedLo, closedHi){
  const left = lo === -Infinity ? '-∞' : fmt(lo);
  const right = hi === Infinity ? '+∞' : fmt(hi);
  const openBracketL = (lo === -Infinity) ? '(' : (closedLo ? '[' : '(');
  const openBracketR = (hi === Infinity) ? ')' : (closedHi ? ']' : ')');
  return `${openBracketL}${left}; ${right}${openBracketR}`;
}

document.querySelectorAll('.subject-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.subject-btn').forEach(b=>b.classList.remove('is-active'));
    document.querySelectorAll('.subject').forEach(s=>{ s.hidden = true; });
    btn.classList.add('is-active');
    const target = document.getElementById('subject-' + btn.dataset.subject);
    target.hidden = false;
  });
});

document.querySelectorAll('.subject').forEach(subject=>{
  const tabBtns = subject.querySelectorAll(':scope > .tabs > .tab-btn');
  tabBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabBtns.forEach(b=>b.classList.remove('is-active'));
      subject.querySelectorAll(':scope > .stage > .panel').forEach(p=>p.classList.remove('is-active'));
      btn.classList.add('is-active');
      document.getElementById(btn.dataset.target).classList.add('is-active');
    });
  });
});

const HISTORY_KEY = 'axiom_math_history';

function loadHistory(){
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch(e){ return []; }
}
function addHistory(label, text){
  const list = loadHistory();
  list.unshift({ ts: Date.now(), label, text });
  if (list.length > 60) list.length = 60;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch(e){}
  renderHistory();
}
function formatTime(ts){
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function renderHistory(){
  const list = loadHistory();
  const ul = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  ul.innerHTML = '';
  if (!list.length){ empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  list.forEach(item=>{
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `<span class="h-label">${item.label}</span><span class="h-time">${formatTime(item.ts)}</span>
      <div class="h-snippet">${item.text.split('\n')[0]}</div>`;
    li.addEventListener('click', ()=>{
      document.getElementById('result').textContent = item.text;
      document.getElementById('resultTag').textContent = item.label;
      closeHistory();
      document.getElementById('resultDock').scrollIntoView({behavior:'smooth', block:'start'});
    });
    ul.appendChild(li);
  });
}
function openHistory(){
  document.getElementById('historyDrawer').classList.add('is-open');
  document.getElementById('scrim').classList.add('is-open');
  document.getElementById('toggleHistory').setAttribute('aria-expanded','true');
}
function closeHistory(){
  document.getElementById('historyDrawer').classList.remove('is-open');
  document.getElementById('scrim').classList.remove('is-open');
  document.getElementById('toggleHistory').setAttribute('aria-expanded','false');
}
document.getElementById('toggleHistory').addEventListener('click', ()=>{
  const isOpen = document.getElementById('historyDrawer').classList.contains('is-open');
  isOpen ? closeHistory() : openHistory();
});
document.getElementById('scrim').addEventListener('click', closeHistory);
document.getElementById('clearHistory').addEventListener('click', ()=>{
  try { localStorage.removeItem(HISTORY_KEY); } catch(e){}
  renderHistory();
});
document.getElementById('copyResult').addEventListener('click', ()=>{
  const text = document.getElementById('result').textContent;
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(()=>{});
});
renderHistory();

function linearEqCore(a1, a0){
  if (a1 === 0) return a0 === 0 ? "Ҳама x мувофиқ аст (0=0)." : `Ҳал надорад (0 ≠ ${fmt(a0)}).`;
  const x = -a0/a1;
  return `${fmt(a1)}x + ${fmt(a0)} = 0\nx = ${fmt(x)}`;
}

function quadraticEqCore(a2, a1, a0){
  if (a2 === 0) return "a=0 → " + linearEqCore(a1, a0);
  const D = a1*a1 - 4*a2*a0;
  let out = `${fmt(a2)}x² + ${fmt(a1)}x + ${fmt(a0)} = 0\nДискриминант: D = ${fmt(D)}\n`;
  if (D > 0){
    const x1 = (-a1 + Math.sqrt(D))/(2*a2);
    const x2 = (-a1 - Math.sqrt(D))/(2*a2);
    out += `D > 0 → ду реша:\nx₁ = ${fmt(x1)}\nx₂ = ${fmt(x2)}`;
  } else if (D === 0){
    const x = -a1/(2*a2);
    out += `D = 0 → як реша:\nx = ${fmt(x)}`;
  } else {
    const re = -a1/(2*a2), im = Math.sqrt(-D)/(2*a2);
    out += `D < 0 → решаҳои комплексӣ:\nx₁ = ${fmt(re)} + ${fmt(im)}i\nx₂ = ${fmt(re)} - ${fmt(im)}i`;
  }
  return out;
}

function linIneqCore(a1, a0, op){
  if (a1 === 0){
    const holds = compareOp(a0, 0, op);
    return `${fmt(a1)}x + ${fmt(a0)} ${opDisplay(op)} 0 → доимӣ ${fmt(a0)} ${opDisplay(op)} 0 — ${holds ? 'дуруст: ҳама x ✓ (x ∈ ℝ)' : 'нодуруст: ҳал надорад (∅)'}`;
  }
  const threshold = -a0/a1;
  const finalOp = a1 > 0 ? op : flipOp(op);
  let out = `${fmt(a1)}x + ${fmt(a0)} ${opDisplay(op)} 0\n`;
  if (a1 < 0) out += `Тақсим ба адади манфӣ (${fmt(a1)}) → аломат баргардонида мешавад:\n`;
  out += `x ${opDisplay(finalOp)} ${fmt(threshold)}`;
  return out;
}

function quadIneqCore(a2, a1, a0, op){
  if (a2 === 0) return "a=0 → нобаробарии хатӣ:\n" + linIneqCore(a1, a0, op);
  const D = a1*a1 - 4*a2*a0;
  const eq = op === '>=' || op === '<=';
  const wantPositive = op === '>' || op === '>=';
  let out = `Дискриминант: D = b² - 4ac = ${fmt(D)}\n`;
  if (D < 0){
    const alwaysPositive = a2 > 0;
    out += `D < 0 → парабола решаи ҳақиқӣ надорад, аломати ифода ҳамеша якхела аст (мисли a=${fmt(a2)}).\n`;
    const satisfied = wantPositive ? alwaysPositive : !alwaysPositive;
    out += satisfied ? "Ҳама x ✓ ечим аст (x ∈ ℝ)." : "Нобаробарӣ ҳал надорад (∅).";
  } else if (D === 0){
    const r = -a1/(2*a2);
    out += `D = 0 → як реша: x = ${fmt(r)}\n`;
    if (a2 > 0){
      if (op === '>') out += `x ∈ (-∞; ${fmt(r)}) ∪ (${fmt(r)}; +∞)  (ҳама x, ба ғайр аз x=${fmt(r)})`;
      else if (op === '>=') out += `x ∈ ℝ (ҳама x, зеро ифода ҳамеша ≥ 0)`;
      else if (op === '<') out += `Ҳал надорад (∅) — ифода ҳеҷ гоҳ манфӣ намешавад.`;
      else out += `x = ${fmt(r)} (танҳо ин нуқта, зеро ифода танҳо дар ин ҷо = 0 аст)`;
    } else {
      if (op === '<') out += `x ∈ (-∞; ${fmt(r)}) ∪ (${fmt(r)}; +∞)  (ҳама x, ба ғайр аз x=${fmt(r)})`;
      else if (op === '<=') out += `x ∈ ℝ (ҳама x, зеро ифода ҳамеша ≤ 0)`;
      else if (op === '>') out += `Ҳал надорад (∅) — ифода ҳеҷ гоҳ мусбат намешавад.`;
      else out += `x = ${fmt(r)} (танҳо ин нуқта)`;
    }
  } else {
    const s = Math.sqrt(D);
    let r1 = (-a1 - s)/(2*a2), r2 = (-a1 + s)/(2*a2);
    if (r1 > r2) { const t = r1; r1 = r2; r2 = t; }
    out += `D > 0 → ду реша:\nx₁ = ${fmt(r1)}\nx₂ = ${fmt(r2)}\n`;
    const upward = a2 > 0;
    const wantOutside = wantPositive ? upward : !upward;
    if (wantOutside) out += `x ∈ ${fmtInterval(-Infinity, r1, false, eq)} ∪ ${fmtInterval(r2, Infinity, eq, false)}`;
    else out += `x ∈ ${fmtInterval(r1, r2, eq, eq)}`;
  }
  return out;
}

function irrationalEqCore(a, b, c, d){
  let out = `√(${fmt(a)}x + ${fmt(b)}) = ${fmt(c)}x + ${fmt(d)}\nШарт: ${fmt(c)}x + ${fmt(d)} ≥ 0 (тарафи рост бояд манфӣ набошад)\n\n`;

  if (c === 0){
    if (d < 0) return out + `Тарафи рост = ${fmt(d)} < 0 → реша вуҷуд надорад (решаи квадратӣ манфӣ шуда наметавонад).`;
    if (a === 0){
      const holds = Math.abs(b - d*d) < 1e-9;
      return out + (holds
        ? `a=0 → шарти доимӣ: √(${fmt(b)}) = ${fmt(d)} — дуруст.\nҲама x ✓ мувофиқ аст (x ∈ ℝ).`
        : `a=0 → шарти доимӣ: √(${fmt(b)}) = ${fmt(d)} — нодуруст.\nРеша вуҷуд надорад.`);
    }
    const x = (d*d - b)/a;
    return out + `Ба квадрат мебарорем: ${fmt(a)}x + ${fmt(b)} = ${fmt(d)}²\nx = (${fmt(d*d)} - ${fmt(b)}) / ${fmt(a)} = ${fmt(x)}`;
  }

  const A = c*c, B = 2*c*d - a, C = d*d - b;
  out += `Ба квадрат мебарорем: ${fmt(a)}x + ${fmt(b)} = (${fmt(c)}x + ${fmt(d)})²\n${fmt(A)}x² + ${fmt(B)}x + ${fmt(C)} = 0\n`;
  const Dq = B*B - 4*A*C;
  out += `Дискриминант: D = ${fmt(Dq)}\n`;
  if (Dq < 0) return out + "D < 0 → баъд аз ба квадрат баровардан ҳам реша нест → муодила ҳал надорад.";

  let roots;
  if (Dq === 0) roots = [-B/(2*A)];
  else { const s = Math.sqrt(Dq); roots = [(-B-s)/(2*A), (-B+s)/(2*A)]; }

  const valid = [];
  if (roots.length === 1) out += `Реша: x = ${fmt(roots[0])}\n`;
  else out += `Решаҳо: x₁ = ${fmt(roots[0])}, x₂ = ${fmt(roots[1])}\n`;
  out += "Санҷиши шарт (cx+d ≥ 0):\n";
  roots.forEach(x=>{
    const rhs = c*x + d;
    const ok = rhs >= -1e-9;
    if (ok) valid.push(x);
    out += `x = ${fmt(x)}: ${fmt(c)}·(${fmt(x)}) + ${fmt(d)} = ${fmt(rhs)} → ${ok ? 'қабул мешавад ✓' : 'решаи бегона ✗ (рад карда мешавад)'}\n`;
  });
  out += valid.length ? `\nҶавоб: x = ${valid.map(v=>fmt(v)).join(' ё x = ')}` : "\nҶавоб: ҳал надорад (ҳамаи решаҳо бегона буданд).";
  return out;
}

function percentCore(mode, v1, v2){
  if (mode === 'ofNumber') return `${fmt(v1)}% аз ${fmt(v2)} = (${fmt(v1)}/100) × ${fmt(v2)} = ${fmt((v1/100)*v2)}`;
  if (mode === 'whatPercent'){
    if (v2 === 0) return null;
    return `${fmt(v1)} чанд фоизи ${fmt(v2)} аст:\n(${fmt(v1)}/${fmt(v2)}) × 100 = ${fmt((v1/v2)*100,3)} %`;
  }
  const res = v1*(1+v2/100), diff = res - v1;
  return `Адади ибтидоӣ: ${fmt(v1)}, тағйирот: ${fmt(v2)}%\nАдади нав = ${fmt(v1)} × (1 + ${fmt(v2)}/100) = ${fmt(res)}\nТағйирот дар арзиш = ${fmt(diff)}`;
}

function proportionCore(a, b, c){
  const x = (b*c)/a;
  return `a/b = c/x  →  x = (b×c)/a\nx = (${fmt(b)} × ${fmt(c)}) / ${fmt(a)} = ${fmt(x)}`;
}

function motionCore(d, s, t, missing){
  if (missing === 'd') return `Масофа = суръат × вақт = ${fmt(s)} × ${fmt(t)} = ${fmt(s*t)}`;
  if (missing === 's'){ if (t === 0) return null; return `Суръат = масофа ÷ вақт = ${fmt(d)} ÷ ${fmt(t)} = ${fmt(d/t)}`; }
  if (s === 0) return null;
  return `Вақт = масофа ÷ суръат = ${fmt(d)} ÷ ${fmt(s)} = ${fmt(d/s)}`;
}

function probabilityCore(fav, total){
  const p = fav/total;
  return `P = ${fmt(fav)} / ${fmt(total)} = ${fmt(p,6)} ≈ ${fmt(p*100,3)} %`;
}

function pythagorasCore(a, b, c, missing){
  if (missing === 'a'){ if (c<=b) return null; return `a = √(c² - b²) = √(${fmt(c*c)} - ${fmt(b*b)}) = ${fmt(Math.sqrt(c*c-b*b))}`; }
  if (missing === 'b'){ if (c<=a) return null; return `b = √(c² - a²) = √(${fmt(c*c)} - ${fmt(a*a)}) = ${fmt(Math.sqrt(c*c-a*a))}`; }
  return `c = √(a² + b²) = √(${fmt(a*a)} + ${fmt(b*b)}) = ${fmt(Math.sqrt(a*a+b*b))}`;
}

function triangleCore(a, b, c){
  if (a+b<=c || a+c<=b || b+c<=a) return null;
  const s = (a+b+c)/2, area = Math.sqrt(s*(s-a)*(s-b)*(s-c)), perim = a+b+c;
  return `Периметр = ${fmt(a)} + ${fmt(b)} + ${fmt(c)} = ${fmt(perim)}\nНимпериметр s = ${fmt(s)}\nМасоҳат (формулаи Герон) = √(s(s-a)(s-b)(s-c)) = ${fmt(area)}`;
}

function rectCore(w, h){
  return `Масоҳат = ${fmt(w)} × ${fmt(h)} = ${fmt(w*h)}\nПериметр = 2 × (${fmt(w)} + ${fmt(h)}) = ${fmt(2*(w+h))}`;
}

function circleCore(r){
  return `Радиус r = ${fmt(r)}\nДузиши давра = 2πr = ${fmt(2*Math.PI*r)}\nМасоҳат = πr² = ${fmt(Math.PI*r*r)}`;
}

function volumeCore(shape, A, B, C){
  if (shape === 'cube') return `Куб (a=${fmt(A)})\nҲаҷм = a³ = ${fmt(A**3)}\nСатҳ = 6a² = ${fmt(6*A*A)}`;
  if (shape === 'box') return `Параллелепипед (${fmt(A)}×${fmt(B)}×${fmt(C)})\nҲаҷм = a×b×c = ${fmt(A*B*C)}\nСатҳ = 2(ab+bc+ac) = ${fmt(2*(A*B+B*C+A*C))}`;
  if (shape === 'cylinder') return `Силиндр (r=${fmt(A)}, h=${fmt(C)})\nҲаҷм = πr²h = ${fmt(Math.PI*A*A*C)}\nСатҳ = 2πr(r+h) = ${fmt(2*Math.PI*A*(A+C))}`;
  if (shape === 'sphere') return `Кура (r=${fmt(A)})\nҲаҷм = (4/3)πr³ = ${fmt((4/3)*Math.PI*A**3)}\nСатҳ = 4πr² = ${fmt(4*Math.PI*A*A)}`;
  if (shape === 'cone'){
    const slant = Math.sqrt(A*A+C*C);
    return `Конус (r=${fmt(A)}, h=${fmt(C)})\nҲаҷм = (1/3)πr²h = ${fmt((1/3)*Math.PI*A*A*C)}\nОбрази ҷониб l = √(r²+h²) = ${fmt(slant)}\nСатҳ = πr(r+l) = ${fmt(Math.PI*A*(A+slant))}`;
  }
  return null;
}

function statsCore(nums){
  const count = nums.length;
  const sum = nums.reduce((a,b)=>a+b,0);
  const mean = sum/count;
  const sorted = [...nums].sort((a,b)=>a-b);
  const mid = Math.floor(count/2);
  const median = count%2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2;
  const freq = {};
  nums.forEach(n=>freq[n]=(freq[n]||0)+1);
  const maxFreq = Math.max(...Object.values(freq));
  const modes = maxFreq>1 ? Object.keys(freq).filter(k=>freq[k]===maxFreq).map(Number) : [];
  const range = sorted[sorted.length-1]-sorted[0];
  const variancePop = nums.reduce((a,b)=>a+(b-mean)**2,0)/count;
  const varianceSample = count>1 ? nums.reduce((a,b)=>a+(b-mean)**2,0)/(count-1) : NaN;
  return `Маълумот (n=${count}): ${nums.join(', ')}
Сумма = ${fmt(sum)}
Миёна (mean) = ${fmt(mean)}
Медиана = ${fmt(median)}
Мода = ${modes.length ? modes.join(', ') : 'нест (ҳама якдафъа такрор мешаванд)'}
Домана (range) = ${fmt(range)}
Диспersия (популятсионӣ) = ${fmt(variancePop)}
Хатогии стандартӣ (популятсионӣ) = ${fmt(Math.sqrt(variancePop))}
Диспersия (интихобӣ, n-1) = ${count>1 ? fmt(varianceSample) : '—'}
Хатогии стандартӣ (интихобӣ) = ${count>1 ? fmt(Math.sqrt(varianceSample)) : '—'}`;
}

document.getElementById('calcLinear').addEventListener('click', ()=>{
  const a = parseFloat(document.getElementById('linA').value);
  const b = parseFloat(document.getElementById('linB').value);
  const c = parseFloat(document.getElementById('linC').value);
  const d = parseFloat(document.getElementById('linD').value);
  if ([a,b,c,d].some(isNaN)){ showResult("Лутфан ҳамаи чор коэффисиентро (a,b,c,d) ворид кунед.", "Муодилаи хатӣ"); return; }
  const out = `${a}x + ${b} = ${c}x + ${d}\n(a-c)x = d-b\n` + linearEqCore(a-c, b-d);
  showResult(out, "Муодилаи хатӣ");
});

document.getElementById('calcQuadratic').addEventListener('click', ()=>{
  const a = parseFloat(document.getElementById('quadA').value);
  const b = parseFloat(document.getElementById('quadB').value);
  const c = parseFloat(document.getElementById('quadC').value);
  if ([a,b,c].some(isNaN)){ showResult("Лутфан a, b ва c-ро ворид кунед.", "Муодилаи квадратӣ"); return; }
  showResult(quadraticEqCore(a,b,c), "Муодилаи квадратӣ");
});

document.getElementById('calcSystem').addEventListener('click', ()=>{
  const a1 = parseFloat(document.getElementById('sysA1').value);
  const b1 = parseFloat(document.getElementById('sysB1').value);
  const c1 = parseFloat(document.getElementById('sysC1').value);
  const a2 = parseFloat(document.getElementById('sysA2').value);
  const b2 = parseFloat(document.getElementById('sysB2').value);
  const c2 = parseFloat(document.getElementById('sysC2').value);
  if ([a1,b1,c1,a2,b2,c2].some(isNaN)){ showResult("Лутфан ҳамаи шаш коэффисиентро ворид кунед.", "Системаи муодилаҳо"); return; }
  const det = a1*b2 - a2*b1;
  if (det === 0){ showResult("Детерминант = 0 — система ҳал ягона надорад (бешумор ҳал ё ҳал надорад).", "Системаи муодилаҳо"); return; }
  const x = (c1*b2 - c2*b1)/det;
  const y = (a1*c2 - a2*c1)/det;
  const out = `Детерминант: D = a₁b₂ - a₂b₁ = ${fmt(det)}\nx = (c₁b₂ - c₂b₁) / D = ${fmt(x)}\ny = (a₁c₂ - a₂c₁) / D = ${fmt(y)}`;
  showResult(out, "Системаи муодилаҳо");
});

document.getElementById('calcInequality').addEventListener('click', ()=>{
  const a = parseFloat(document.getElementById('ineqA').value);
  const b = parseFloat(document.getElementById('ineqB').value);
  const c = parseFloat(document.getElementById('ineqC').value);
  const d = parseFloat(document.getElementById('ineqD').value);
  const op = document.getElementById('ineqOp').value;
  if ([a,b,c,d].some(isNaN)){ showResult("Лутфан ҳамаи чор коэффисиентро (a,b,c,d) ворид кунед.", "Нобаробарии хатӣ"); return; }
  const out = `${a}x + ${b} ${opDisplay(op)} ${c}x + ${d}\n(a-c)x ${opDisplay(op)} (d-b)\n` + linIneqCore(a-c, d-b, op);
  showResult(out, "Нобаробарии хатӣ");
});

document.getElementById('calcQuadIneq').addEventListener('click', ()=>{
  const a = parseFloat(document.getElementById('ineqQA').value);
  const b = parseFloat(document.getElementById('ineqQB').value);
  const c = parseFloat(document.getElementById('ineqQC').value);
  const op = document.getElementById('ineqQOp').value;
  if ([a,b,c].some(isNaN)){ showResult("Лутфан a, b ва c-ро ворид кунед.", "Нобаробарии квадратӣ"); return; }
  showResult(quadIneqCore(a,b,c,op), "Нобаробарии квадратӣ");
});

document.getElementById('calcIrrational').addEventListener('click', ()=>{
  const a = parseFloat(document.getElementById('irrA').value);
  const b = parseFloat(document.getElementById('irrB').value);
  const c = parseFloat(document.getElementById('irrC').value);
  const d = parseFloat(document.getElementById('irrD').value);
  if ([a,b,c,d].some(isNaN)){ showResult("Лутфан ҳамаи чор коэффисиентро (a,b,c,d) ворид кунед.", "Муодилаи иррационалӣ"); return; }
  showResult(irrationalEqCore(a,b,c,d), "Муодилаи иррационалӣ");
});

document.getElementById('calcPythagoras').addEventListener('click', ()=>{
  const aStr = document.getElementById('pytA').value.trim();
  const bStr = document.getElementById('pytB').value.trim();
  const cStr = document.getElementById('pytC').value.trim();
  const a = parseFloat(aStr), b = parseFloat(bStr), c = parseFloat(cStr);
  const blanks = [aStr,bStr,cStr].filter(s=>s==='').length;
  if (blanks !== 1){ showResult("Маҳз як майдонро холӣ монед (a, b ё c).", "Теоремаи Пифагор"); return; }
  const missing = aStr===''?'a':(bStr===''?'b':'c');
  if (missing!=='c' && [a,b,c].filter((_,i)=>['a','b','c'][i]!==missing).some(isNaN)){ showResult("Лутфан рақамҳои боқимондаро ворид кунед.", "Теоремаи Пифагор"); return; }
  const out = pythagorasCore(a,b,c,missing);
  if (out === null){ showResult(missing==='a' ? "Барои ёфтани a, лозим аст c > b бошад." : "Барои ёфтани b, лозим аст c > a бошад.", "Теоремаи Пифагор"); return; }
  showResult(out, "Теоремаи Пифагор");
});

document.getElementById('calcTriangle').addEventListener('click', ()=>{
  const a = parseFloat(document.getElementById('triA').value);
  const b = parseFloat(document.getElementById('triB').value);
  const c = parseFloat(document.getElementById('triC').value);
  if ([a,b,c].some(isNaN) || a<=0 || b<=0 || c<=0){ showResult("Лутфан се тарафи мусбатро ворид кунед.", "Секунҷа"); return; }
  const out = triangleCore(a,b,c);
  if (out === null){ showResult("Ин се тараф секунҷа ташкил намекунанд (қоидаи нобаробарии секунҷа вайрон шудааст).", "Секунҷа"); return; }
  showResult(out, "Секунҷа");
});

document.getElementById('calcRect').addEventListener('click', ()=>{
  const w = parseFloat(document.getElementById('rectW').value);
  const h = parseFloat(document.getElementById('rectH').value);
  if (isNaN(w) || isNaN(h)){ showResult("Лутфан дарозӣ ва барро ворид кунед.", "Росткунҷа"); return; }
  showResult(rectCore(w,h), "Росткунҷа");
});

document.getElementById('calcCircle').addEventListener('click', ()=>{
  const val = parseFloat(document.getElementById('circR').value);
  const mode = document.getElementById('circMode').value;
  if (isNaN(val) || val<=0){ showResult("Лутфан арзиши мусбат ворид кунед.", "Давра"); return; }
  const r = mode === 'd' ? val/2 : val;
  showResult(circleCore(r), "Давра");
});

document.getElementById('calcVolume').addEventListener('click', ()=>{
  const shape = document.getElementById('volShape').value;
  const A = parseFloat(document.getElementById('volA').value);
  const B = parseFloat(document.getElementById('volB').value);
  const C = parseFloat(document.getElementById('volC').value);
  const needsB = shape === 'box';
  const needsC = shape === 'box' || shape === 'cylinder' || shape === 'cone';
  if (isNaN(A) || (needsB && isNaN(B)) || (needsC && isNaN(C))){ showResult("Лутфан майдонҳои зарурро пур кунед.", "Ҳаҷм"); return; }
  showResult(volumeCore(shape, A, B, C), "Ҳаҷм ва сатҳ");
});

document.getElementById('calcStats').addEventListener('click', ()=>{
  const raw = document.getElementById('statsData').value.trim();
  if (!raw){ showResult("Лутфан рӯйхати рақамҳоро ворид кунед.", "Статистика"); return; }
  const nums = raw.split(',').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n));
  if (!nums.length){ showResult("Формат хато. Намуна: 4, 8, 6, 5, 3", "Статистика"); return; }
  showResult(statsCore(nums), "Статистика");
});

document.getElementById('calcProbability').addEventListener('click', ()=>{
  const fav = parseFloat(document.getElementById('probFav').value);
  const total = parseFloat(document.getElementById('probTotal').value);
  if (isNaN(fav) || isNaN(total) || total<=0 || fav<0 || fav>total){ showResult("Лутфан рақамҳои дурустро ворид кунед (0 ≤ мусоид ≤ ҳама).", "Эҳтимолият"); return; }
  showResult(probabilityCore(fav, total), "Эҳтимолият");
});

document.getElementById('probType').addEventListener('change', (e)=>{
  document.querySelectorAll('.prob-fields').forEach(f=>{
    const active = f.dataset.prob === e.target.value;
    f.hidden = !active;
    f.classList.toggle('is-active', active);
  });
});

document.getElementById('solveProblem').addEventListener('click', ()=>{
  const type = document.getElementById('probType').value;
  if (type === 'percent'){
    const mode = document.getElementById('pctMode').value;
    const v1 = parseFloat(document.getElementById('pctVal1').value);
    const v2 = parseFloat(document.getElementById('pctVal2').value);
    if (isNaN(v1) || isNaN(v2)){ showResult("Лутфан ҳарду арзишро ворид кунед.", "Фоиз"); return; }
    const out = percentCore(mode, v1, v2);
    if (out === null){ showResult("Арзиши 2 набояд сифр бошад.", "Фоиз"); return; }
    showResult(out, "Фоиз");
  } else if (type === 'proportion'){
    const a = parseFloat(document.getElementById('propA').value);
    const b = parseFloat(document.getElementById('propB').value);
    const c = parseFloat(document.getElementById('propC').value);
    if ([a,b,c].some(isNaN) || a===0){ showResult("Лутфан a, b, c-ро ворид кунед (a ≠ 0).", "Пропорция"); return; }
    showResult(proportionCore(a,b,c), "Пропорция");
  } else if (type === 'motion'){
    const dStr = document.getElementById('motD').value.trim();
    const sStr = document.getElementById('motS').value.trim();
    const tStr = document.getElementById('motT').value.trim();
    const d = parseFloat(dStr), s = parseFloat(sStr), t = parseFloat(tStr);
    const blanks = [dStr,sStr,tStr].filter(x=>x==='').length;
    if (blanks !== 1){ showResult("Маҳз як майдонро холӣ монед (масофа, суръат ё вақт).", "Ҳаракат"); return; }
    const missing = dStr===''?'d':(sStr===''?'s':'t');
    const out = motionCore(d,s,t,missing);
    if (out === null){ showResult(missing==='s' ? "Вақт набояд сифр бошад." : "Суръат набояд сифр бошад.", "Ҳаракат"); return; }
    showResult(out, "Ҳаракат");
  }
});

function normalizeExpr(str){
  return str
    .replace(/х/g,'x').replace(/Х/g,'x')
    .replace(/²/g,'^2')
    .replace(/×/g,'*')
    .replace(/√/g,'sqrt')
    .replace(/≥/g,'>=').replace(/≤/g,'<=')
    .replace(/\s+/g,'');
}

function parsePoly(str){
  let s = str;
  if (!/^[+-]/.test(s)) s = '+'+s;
  const terms = s.match(/[+-][^+-]+/g) || [];
  let a2=0, a1=0, a0=0;
  terms.forEach(t=>{
    const sign = t[0] === '-' ? -1 : 1;
    const body = t.slice(1);
    if (/x\^?2$/.test(body)){
      const cs = body.replace(/x\^?2$/,'');
      a2 += sign * (cs === '' ? 1 : parseFloat(cs));
    } else if (/x$/.test(body)){
      const cs = body.replace(/x$/,'');
      a1 += sign * (cs === '' ? 1 : parseFloat(cs));
    } else {
      const coef = parseFloat(body.replace(',','.'));
      if (!isNaN(coef)) a0 += sign * coef;
    }
  });
  return {a2,a1,a0};
}

function splitOperator(s){
  const ops = ['>=','<=','=','>','<'];
  for (const op of ops){
    const idx = s.indexOf(op);
    if (idx !== -1) return { op, left: s.slice(0,idx), right: s.slice(idx+op.length) };
  }
  return null;
}

function extractNums(text){
  const m = text.match(/-?\d+(?:[.,]\d+)?/g) || [];
  return m.map(s=>parseFloat(s.replace(',','.')));
}
function numAfterKeyword(text, keyword){
  const re = new RegExp(keyword + "[^\\d-]{0,15}?(-?\\d+(?:[.,]\\d+)?)", 'i');
  const m = text.match(re);
  return m ? parseFloat(m[1].replace(',','.')) : null;
}

function solveUniversalText(raw){
  const text = raw.trim();
  if (!text){ showResult("Лутфан матни масъаларо нависед.", "Ҳалкунаки умумӣ"); return; }
  const norm = normalizeExpr(text);
  const parts = splitOperator(norm);


  if (parts && /x/.test(norm)){
    const { op, left, right } = parts;
    const hasSqrtLeft = /sqrt\(/.test(left);
    const hasSqrtRight = /sqrt\(/.test(right);

    if (hasSqrtLeft || hasSqrtRight){
      const sqrtSide = hasSqrtLeft ? left : right;
      const otherSide = hasSqrtLeft ? right : left;
      const m = sqrtSide.match(/sqrt\(([^)]+)\)/);
      if (!m){ showResult("Ифодаи зери реша фаҳмида нашуд. Намуна: √(x+2)=x", "Ҳалкунаки умумӣ"); return; }
      const inner = parsePoly(m[1]);
      const outer = parsePoly(otherSide);
      if (inner.a2 !== 0 || outer.a2 !== 0){ showResult("Ин ҳалкунак танҳо муодилаи иррационалии хатии дохили реша ва тарафи ростро дастгирӣ мекунад.", "Ҳалкунаки умумӣ"); return; }
      showResult(irrationalEqCore(inner.a1, inner.a0, outer.a1, outer.a0), "Муодилаи иррационалӣ");
      return;
    }

    const L = parsePoly(left), R = parsePoly(right);
    const A2 = L.a2 - R.a2, A1 = L.a1 - R.a1, A0 = L.a0 - R.a0;
    if (op === '='){
      showResult(A2 === 0 ? linearEqCore(A1, A0) : quadraticEqCore(A2, A1, A0), A2 === 0 ? "Муодилаи хатӣ" : "Муодилаи квадратӣ");
    } else {
      showResult(A2 === 0 ? linIneqCore(A1, A0, op) : quadIneqCore(A2, A1, A0, op), A2 === 0 ? "Нобаробарии хатӣ" : "Нобаробарии квадратӣ");
    }
    return;
  }


  const low = text.toLowerCase();
  const nums = extractNums(text);

  if (/гипотенуз|катет/.test(low)){
    if (nums.length < 2){ showResult("Барои теоремаи Пифагор ҳадди ақал ду адад лозим аст.", "Теоремаи Пифагор"); return; }
    const out = pythagorasCore(nums[0], nums[1], 0, 'c');
    showResult(out, "Теоремаи Пифагор");
    return;
  }

  if (/силиндр/.test(low)){
    if (nums.length < 2){ showResult("Барои силиндр радиус ва баландӣ лозим аст.", "Ҳаҷм"); return; }
    showResult(volumeCore('cylinder', nums[0], null, nums[1]), "Ҳаҷм ва сатҳ"); return;
  }
  if (/парал.*пипед|қуттӣ/.test(low)){
    if (nums.length < 3){ showResult("Барои параллелепипед се андоза лозим аст.", "Ҳаҷм"); return; }
    showResult(volumeCore('box', nums[0], nums[1], nums[2]), "Ҳаҷм ва сатҳ"); return;
  }
  if (/кура/.test(low)){
    if (nums.length < 1){ showResult("Радиуси кураро нависед.", "Ҳаҷм"); return; }
    showResult(volumeCore('sphere', nums[0], null, null), "Ҳаҷм ва сатҳ"); return;
  }
  if (/конус/.test(low)){
    if (nums.length < 2){ showResult("Барои конус радиус ва баландӣ лозим аст.", "Ҳаҷм"); return; }
    showResult(volumeCore('cone', nums[0], null, nums[1]), "Ҳаҷм ва сатҳ"); return;
  }
  if (/\bкуб\b/.test(low)){
    if (nums.length < 1){ showResult("Тарафи кубро нависед.", "Ҳаҷм"); return; }
    showResult(volumeCore('cube', nums[0], null, null), "Ҳаҷм ва сатҳ"); return;
  }
  if (/дав(и|ра)|доира|радиус|диаметр/.test(low)){
    if (nums.length < 1){ showResult("Радиус ё диаметрро нависед.", "Давра"); return; }
    const r = /диаметр/.test(low) ? nums[0]/2 : nums[0];
    showResult(circleCore(r), "Давра"); return;
  }
  if (/росткунҷ|параллелограмм/.test(low)){
    if (nums.length < 2){ showResult("Дарозӣ ва барро нависед.", "Росткунҷа"); return; }
    showResult(rectCore(nums[0], nums[1]), "Росткунҷа"); return;
  }
  if (/секунҷ/.test(low)){
    if (nums.length < 3){ showResult("Се тарафи секунҷаро нависед.", "Секунҷа"); return; }
    const out = triangleCore(nums[0], nums[1], nums[2]);
    if (out === null){ showResult("Ин се тараф секунҷа ташкил намекунанд.", "Секунҷа"); return; }
    showResult(out, "Секунҷа"); return;
  }

  if (/фоиз/.test(low) || /%/.test(text)){
    const percentMatch = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (/чанд\s*фоизи/i.test(low)){
      if (nums.length < 2){ showResult("Ду ададро нависед: масалан «12 чанд фоизи 60 аст?»", "Фоиз"); return; }
      showResult(percentCore('whatPercent', nums[0], nums[1]) || "Арзиши дуюм набояд сифр бошад.", "Фоиз"); return;
    }
    if (/афзоиш|зиёд/.test(low)){
      if (nums.length < 2){ showResult("Адади ибтидоӣ ва фоизи тағйиротро нависед.", "Фоиз"); return; }
      showResult(percentCore('change', nums[0], Math.abs(nums[1])), "Фоиз"); return;
    }
    if (/камшав|каме[cш]|паст/.test(low)){
      if (nums.length < 2){ showResult("Адади ибтидоӣ ва фоизи тағйиротро нависед.", "Фоиз"); return; }
      showResult(percentCore('change', nums[0], -Math.abs(nums[1])), "Фоиз"); return;
    }

    if (percentMatch){
      const pVal = parseFloat(percentMatch[1]);
      const other = nums.find(n => n !== pVal);
      if (other === undefined){ showResult("Адади дуюмро нависед: масалан «25% аз 80».", "Фоиз"); return; }
      showResult(percentCore('ofNumber', pVal, other), "Фоиз"); return;
    }
    if (nums.length < 2){ showResult("Ду ададро нависед: масалан «25% аз 80 чанд аст?»", "Фоиз"); return; }
    showResult(percentCore('ofNumber', nums[0], nums[1]), "Фоиз"); return;
  }

  if (/эҳтимолият/.test(low)){
    const m = text.match(/(\d+(?:[.,]\d+)?)\s*аз\s*(\d+(?:[.,]\d+)?)/i);
    let fav, total;
    if (m){ fav = parseFloat(m[1].replace(',','.')); total = parseFloat(m[2].replace(',','.')); }
    else if (nums.length >= 2){ fav = nums[0]; total = nums[1]; }
    if (fav === undefined || total === undefined || total<=0 || fav<0 || fav>total){ showResult("Намуна: «3 аз 10 эҳтимолият».", "Эҳтимолият"); return; }
    showResult(probabilityCore(fav, total), "Эҳтимолият"); return;
  }

  if (/пропорц|нисбат/.test(low)){
    if (nums.length < 3){ showResult("Барои пропорция (a/b=c/x) се адад лозим аст.", "Пропорция"); return; }
    if (nums[0] === 0){ showResult("Адади якум набояд сифр бошад.", "Пропорция"); return; }
    showResult(proportionCore(nums[0], nums[1], nums[2]), "Пропорция"); return;
  }

  if (/суръат|масофа|ҳаракат/.test(low) || (/вақт/.test(low) && nums.length>=2)){
    const d = numAfterKeyword(text, 'масофа');
    const s = numAfterKeyword(text, 'суръат');
    const t = numAfterKeyword(text, 'вақт');
    const known = [d,s,t].filter(v=>v!==null).length;
    if (known < 2){ showResult("Ҳадди ақал ду аз се арзиш (масофа, суръат, вақт)-ро нависед.", "Ҳаракат"); return; }
    if (d===null){ showResult(motionCore(0,s,t,'d'), "Ҳаракат"); return; }
    if (s===null){ const out = motionCore(d,0,t,'s'); showResult(out===null ? "Вақт набояд сифр бошад." : out, "Ҳаракат"); return; }
    if (t===null){ const out = motionCore(d,s,0,'t'); showResult(out===null ? "Суръат набояд сифр бошад." : out, "Ҳаракат"); return; }
    showResult(`Ҳар се арзиш дода шудаанд:\nМасофа = ${fmt(d)}, Суръат = ${fmt(s)}, Вақт = ${fmt(t)}\nСанҷиш: суръат × вақт = ${fmt(s*t)} ${Math.abs(s*t-d)<1e-6 ? '✓ мувофиқи масофа' : '— бо масофаи додашуда мувофиқат намекунад'}`, "Ҳаракат");
    return;
  }

  if (/миёна|медиана|стандарт|диспersия/.test(low) || nums.length >= 4){
    if (nums.length < 1){ showResult("Рӯйхати рақамҳоро нависед: масалан 4, 8, 6, 5, 3", "Статистика"); return; }
    showResult(statsCore(nums), "Статистика"); return;
  }

  showResult(
    nums.length
      ? `Намуди масъала шинохта нашуд. Рақамҳои ёфтшуда: ${nums.join(', ')}\n\nЛутфан аз калимаҳои калидӣ истифода баред (фоиз, суръат/масофа/вақт, эҳтимолият, гипотенуза/катет, радиус, куб, силиндр, кура, конус, секунҷа, росткунҷа, пропорсия, миёна) ё муодиларо бо =, >, < нависед, масалан: 2x+3=x-7`
      : "Матн фаҳмида нашуд. Лутфан рақамҳо илова кунед ё муодиларо бо =, >, < нависед (масалан: 2x+3=x-7), ё калимаи калидӣ истифода баред (фоиз, суръат, эҳтимолият ва г.).",
    "Ҳалкунаки умумӣ"
  );
}

document.getElementById('calcUniversal').addEventListener('click', ()=>{
  solveUniversalText(document.getElementById('uniInput').value);
});

function insertAtCursor(el, text, offset){
  const start = el.selectionStart != null ? el.selectionStart : el.value.length;
  const end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
  el.value = el.value.slice(0, start) + text + el.value.slice(end);
  const pos = start + (offset !== undefined ? offset : text.length);
  el.focus();
  el.setSelectionRange(pos, pos);
}
function backspaceAtCursor(el){
  const start = el.selectionStart != null ? el.selectionStart : el.value.length;
  const end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
  if (start === end){
    if (start === 0) { el.focus(); return; }
    el.value = el.value.slice(0, start-1) + el.value.slice(end);
    el.focus();
    el.setSelectionRange(start-1, start-1);
  } else {
    el.value = el.value.slice(0, start) + el.value.slice(end);
    el.focus();
    el.setSelectionRange(start, start);
  }
}
document.querySelectorAll('#uniKeys .mkey').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const ta = document.getElementById('uniInput');
    if (btn.dataset.action === 'backspace'){ backspaceAtCursor(ta); return; }
    if (btn.dataset.action === 'clear'){ ta.value = ''; ta.focus(); return; }
    const ins = btn.dataset.ins !== undefined ? btn.dataset.ins : btn.textContent;
    const offset = btn.dataset.offset !== undefined ? parseInt(btn.dataset.offset, 10) : undefined;
    insertAtCursor(ta, ins, offset);
  });
});

function randInt(min, max){ return Math.floor(Math.random()*(max-min+1)) + min; }
function randNonZero(min, max){ let v; do { v = randInt(min, max); } while (v === 0); return v; }
function setVal(id, v){ const el = document.getElementById(id); if (el) el.value = v; }
function wireRandom(id, fn){
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', fn);
}

wireRandom('randLinear', ()=>{
  setVal('linA', randNonZero(-9,9));
  setVal('linB', randInt(-15,15));
  setVal('linC', randNonZero(-9,9));
  setVal('linD', randInt(-15,15));
});

wireRandom('randQuadratic', ()=>{
  setVal('quadA', randNonZero(-6,6));
  setVal('quadB', randInt(-10,10));
  setVal('quadC', randInt(-10,10));
});

wireRandom('randSystem', ()=>{
  setVal('sysA1', randNonZero(-8,8));
  setVal('sysB1', randNonZero(-8,8));
  setVal('sysC1', randInt(-15,15));
  setVal('sysA2', randNonZero(-8,8));
  setVal('sysB2', randNonZero(-8,8));
  setVal('sysC2', randInt(-15,15));
});

wireRandom('randInequality', ()=>{
  setVal('ineqA', randNonZero(-9,9));
  setVal('ineqB', randInt(-15,15));
  setVal('ineqC', randNonZero(-9,9));
  setVal('ineqD', randInt(-15,15));
  const ops = ['>','<','>=','<='];
  const sel = document.getElementById('ineqOp');
  if (sel) sel.value = ops[randInt(0,ops.length-1)];
});

wireRandom('randQuadIneq', ()=>{
  setVal('ineqQA', randNonZero(-6,6));
  setVal('ineqQB', randInt(-10,10));
  setVal('ineqQC', randInt(-10,10));
  const ops = ['>','<','>=','<='];
  const sel = document.getElementById('ineqQOp');
  if (sel) sel.value = ops[randInt(0,ops.length-1)];
});

wireRandom('randIrrational', ()=>{
  setVal('irrA', randNonZero(1,6));
  setVal('irrB', randInt(0,12));
  setVal('irrC', randNonZero(-4,4));
  setVal('irrD', randInt(0,10));
});

wireRandom('randPythagoras', ()=>{
  setVal('pytA', randInt(3,20));
  setVal('pytB', randInt(3,20));
  setVal('pytC', '');
});

wireRandom('randPercent', ()=>{
  setVal('pctVal1', randInt(1,100));
  setVal('pctVal2', randInt(10,500));
});

wireRandom('randProportion', ()=>{
  setVal('propA', randNonZero(1,12));
  setVal('propB', randInt(1,30));
  setVal('propC', randInt(1,30));
});

wireRandom('randMotion', ()=>{
  const which = randInt(0,2);
  const d = randInt(20,400);
  const s = randNonZero(5,120);
  const t = randInt(1,10);
  setVal('motD', which===0 ? '' : d);
  setVal('motS', which===1 ? '' : s);
  setVal('motT', which===2 ? '' : t);
});

function readField(id){
  const el = document.getElementById(id);
  const raw = el.value.trim();
  return raw === '' ? null : parseFloat(raw);
}
function oneBlank(vals){
  const keys = Object.keys(vals);
  const blanks = keys.filter(k => vals[k] === null);
  const invalid = keys.filter(k => vals[k] !== null && isNaN(vals[k]));
  if (invalid.length) return { error: "Лутфан рақамҳои дурустро ворид кунед." };
  if (blanks.length !== 1) return { error: "Лутфан рӯйхати майдонҳоро пур карда, АЙНАН якеро холӣ монед (то он ҳисоб карда шавад)." };
  return { blankKey: blanks[0], values: vals };
}

document.getElementById('calcMechUniform').addEventListener('click', ()=>{
  const res = oneBlank({ s: readField('mechS'), v: readField('mechV'), t: readField('mechT') });
  if (res.error){ showResult(res.error, "Ҳаракати якхела"); return; }
  const { s, v, t } = res.values;
  let out;
  if (res.blankKey === 's'){ const val = v*t; out = `s = v·t = ${fmt(v)} × ${fmt(t)} = ${fmt(val)} м`; }
  else if (res.blankKey === 'v'){ if (t===0){ showResult("t=0 буда наметавонад.", "Ҳаракати якхела"); return; } const val = s/t; out = `v = s/t = ${fmt(s)} / ${fmt(t)} = ${fmt(val)} м/с`; }
  else { if (v===0){ showResult("v=0 буда наметавонад.", "Ҳаракати якхела"); return; } const val = s/v; out = `t = s/v = ${fmt(s)} / ${fmt(v)} = ${fmt(val)} с`; }
  showResult(out, "Ҳаракати якхела");
});

document.getElementById('calcMechAccel').addEventListener('click', ()=>{
  const v0 = readField('accV0'), a = readField('accA'), t = readField('accT');
  if ([v0,a,t].some(x => x === null || isNaN(x))){ showResult("Лутфан v₀, a ва t-ро пур кунед.", "Ҳаракати тезгирифташуда"); return; }
  const v = v0 + a*t;
  const s = v0*t + 0.5*a*t*t;
  showResult(`v = v₀+at = ${fmt(v0)} + ${fmt(a)}×${fmt(t)} = ${fmt(v)} м/с\ns = v₀t + at²/2 = ${fmt(v0)}×${fmt(t)} + ${fmt(a)}×${fmt(t)}²/2 = ${fmt(s)} м`, "Ҳаракати тезгирифташуда");
});

document.getElementById('calcNewton').addEventListener('click', ()=>{
  const res = oneBlank({ F: readField('newF'), m: readField('newM'), a: readField('newA') });
  if (res.error){ showResult(res.error, "Қонуни дуюми Нютон"); return; }
  const { F, m, a } = res.values;
  let out;
  if (res.blankKey === 'F'){ const val = m*a; out = `F = m·a = ${fmt(m)} × ${fmt(a)} = ${fmt(val)} Н`; }
  else if (res.blankKey === 'm'){ if (a===0){ showResult("a=0 буда наметавонад.", "Қонуни дуюми Нютон"); return; } const val = F/a; out = `m = F/a = ${fmt(F)} / ${fmt(a)} = ${fmt(val)} кг`; }
  else { if (m===0){ showResult("m=0 буда наметавонад.", "Қонуни дуюми Нютон"); return; } const val = F/m; out = `a = F/m = ${fmt(F)} / ${fmt(m)} = ${fmt(val)} м/с²`; }
  showResult(out, "Қонуни дуюми Нютон");
});

document.getElementById('calcWork').addEventListener('click', ()=>{
  const F = readField('workF'), s = readField('workS'), t = readField('workT');
  if (F === null || s === null || isNaN(F) || isNaN(s)){ showResult("Лутфан F ва s-ро пур кунед.", "Кор ва Қувва"); return; }
  const A = F*s;
  let out = `A = F·s = ${fmt(F)} × ${fmt(s)} = ${fmt(A)} Ҷ`;
  if (t !== null && !isNaN(t) && t !== 0){
    const N = A/t;
    out += `\nN = A/t = ${fmt(A)} / ${fmt(t)} = ${fmt(N)} Вт`;
  }
  showResult(out, "Кор ва Қувва");
});

document.getElementById('calcEnergy').addEventListener('click', ()=>{
  const m = readField('energyM'), v = readField('energyV'), h = readField('energyH');
  if (m === null || isNaN(m)){ showResult("Лутфан массаро (m) ворид кунед.", "Энергия"); return; }
  const g = 9.8;
  let out = '';
  if (v !== null && !isNaN(v)){ const Ek = m*v*v/2; out += `Eк = mv²/2 = ${fmt(m)}×${fmt(v)}²/2 = ${fmt(Ek)} Ҷ\n`; }
  if (h !== null && !isNaN(h)){ const Ep = m*g*h; out += `Eп = mgh = ${fmt(m)}×9.8×${fmt(h)} = ${fmt(Ep)} Ҷ\n`; }
  if (!out){ showResult("Лутфан суръат (v) ё баландӣ (h)-ро ҳам ворид кунед.", "Энергия"); return; }
  showResult(out.trim(), "Энергия");
});

document.getElementById('calcImpulse').addEventListener('click', ()=>{
  const res = oneBlank({ p: readField('impP'), m: readField('impM'), v: readField('impV') });
  if (res.error){ showResult(res.error, "Импулс"); return; }
  const { p, m, v } = res.values;
  let out;
  if (res.blankKey === 'p'){ const val = m*v; out = `p = m·v = ${fmt(m)} × ${fmt(v)} = ${fmt(val)} кг·м/с`; }
  else if (res.blankKey === 'm'){ if (v===0){ showResult("v=0 буда наметавонад.", "Импулс"); return; } const val = p/v; out = `m = p/v = ${fmt(p)} / ${fmt(v)} = ${fmt(val)} кг`; }
  else { if (m===0){ showResult("m=0 буда наметавонад.", "Импулс"); return; } const val = p/m; out = `v = p/m = ${fmt(p)} / ${fmt(m)} = ${fmt(val)} м/с`; }
  showResult(out, "Импулс");
});

document.getElementById('calcOhm').addEventListener('click', ()=>{
  const res = oneBlank({ U: readField('ohmU'), I: readField('ohmI'), R: readField('ohmR') });
  if (res.error){ showResult(res.error, "Қонуни Ом"); return; }
  const { U, I, R } = res.values;
  let out;
  if (res.blankKey === 'U'){ const val = I*R; out = `U = I·R = ${fmt(I)} × ${fmt(R)} = ${fmt(val)} В`; }
  else if (res.blankKey === 'I'){ if (R===0){ showResult("R=0 буда наметавонад.", "Қонуни Ом"); return; } const val = U/R; out = `I = U/R = ${fmt(U)} / ${fmt(R)} = ${fmt(val)} А`; }
  else { if (I===0){ showResult("I=0 буда наметавонад.", "Қонуни Ом"); return; } const val = U/I; out = `R = U/I = ${fmt(U)} / ${fmt(I)} = ${fmt(val)} Ом`; }
  showResult(out, "Қонуни Ом");
});

document.getElementById('calcElecPower').addEventListener('click', ()=>{
  const res = oneBlank({ P: readField('powP'), U: readField('powU'), I: readField('powI') });
  if (res.error){ showResult(res.error, "Қувваи барқ"); return; }
  const { P, U, I } = res.values;
  let out;
  if (res.blankKey === 'P'){ const val = U*I; out = `P = U·I = ${fmt(U)} × ${fmt(I)} = ${fmt(val)} Вт`; }
  else if (res.blankKey === 'U'){ if (I===0){ showResult("I=0 буда наметавонад.", "Қувваи барқ"); return; } const val = P/I; out = `U = P/I = ${fmt(P)} / ${fmt(I)} = ${fmt(val)} В`; }
  else { if (U===0){ showResult("U=0 буда наметавонад.", "Қувваи барқ"); return; } const val = P/U; out = `I = P/U = ${fmt(P)} / ${fmt(U)} = ${fmt(val)} А`; }
  showResult(out, "Қувваи барқ");
});

document.getElementById('calcResistance').addEventListener('click', ()=>{
  const raw = document.getElementById('resList').value;
  const mode = document.getElementById('resMode').value;
  const nums = (raw.match(/-?\d+(\.\d+)?/g) || []).map(Number).filter(n => n > 0);
  if (nums.length < 2){ showResult("Лутфан ҳадди ақал ду муқовимати мусбат ворид кунед (бо вергул ҷудо).", "Пайвасти муқовиматҳо"); return; }
  let out;
  if (mode === 'series'){
    const total = nums.reduce((a,b)=>a+b,0);
    out = `Силсилавӣ: R = ${nums.map(fmt).join(' + ')} = ${fmt(total)} Ом`;
  } else {
    const invSum = nums.reduce((a,b)=>a + 1/b, 0);
    const total = 1/invSum;
    out = `Параллелӣ: 1/R = ${nums.map(n=>`1/${fmt(n)}`).join(' + ')}\nR = ${fmt(total)} Ом`;
  }
  showResult(out, "Пайвасти муқовиматҳо");
});

document.getElementById('calcJoule').addEventListener('click', ()=>{
  const res = oneBlank({ Q: readField('jouleQ'), I: readField('jouleI'), R: readField('jouleR'), t: readField('jouleT') });
  if (res.error){ showResult(res.error, "Гармии Ҷоул-Ленс"); return; }
  const { Q, I, R, t } = res.values;
  let out;
  if (res.blankKey === 'Q'){ const val = I*I*R*t; out = `Q = I²Rt = ${fmt(I)}²×${fmt(R)}×${fmt(t)} = ${fmt(val)} Ҷ`; }
  else if (res.blankKey === 'R'){ if (I===0||t===0){ showResult("I ва t набояд 0 бошанд.", "Гармии Ҷоул-Ленс"); return; } const val = Q/(I*I*t); out = `R = Q/(I²t) = ${fmt(Q)} / (${fmt(I)}²×${fmt(t)}) = ${fmt(val)} Ом`; }
  else if (res.blankKey === 't'){ if (I===0||R===0){ showResult("I ва R набояд 0 бошанд.", "Гармии Ҷоул-Ленс"); return; } const val = Q/(I*I*R); out = `t = Q/(I²R) = ${fmt(Q)} / (${fmt(I)}²×${fmt(R)}) = ${fmt(val)} с`; }
  else { if (R===0||t===0){ showResult("R ва t набояд 0 бошанд.", "Гармии Ҷоул-Ленс"); return; } if (Q/(R*t) < 0){ showResult("Q/(Rt) манфӣ аст — I ҳақиқӣ вуҷуд надорад.", "Гармии Ҷоул-Ленс"); return; } const val = Math.sqrt(Q/(R*t)); out = `I = √(Q/(Rt)) = √(${fmt(Q)}/(${fmt(R)}×${fmt(t)})) = ${fmt(val)} А`; }
  showResult(out, "Гармии Ҷоул-Ленс");
});

document.getElementById('calcHeatCapacity').addEventListener('click', ()=>{
  const res = oneBlank({ Q: readField('heatQ'), c: readField('heatC'), m: readField('heatM'), dT: readField('heatDT') });
  if (res.error){ showResult(res.error, "Миқдори гармӣ"); return; }
  const { Q, c, m, dT } = res.values;
  let out;
  if (res.blankKey === 'Q'){ const val = c*m*dT; out = `Q = c·m·ΔT = ${fmt(c)}×${fmt(m)}×${fmt(dT)} = ${fmt(val)} Ҷ`; }
  else if (res.blankKey === 'c'){ if (m===0||dT===0){ showResult("m ва ΔT набояд 0 бошанд.", "Миқдори гармӣ"); return; } const val = Q/(m*dT); out = `c = Q/(mΔT) = ${fmt(Q)} / (${fmt(m)}×${fmt(dT)}) = ${fmt(val)} Ҷ/кг·К`; }
  else if (res.blankKey === 'm'){ if (c===0||dT===0){ showResult("c ва ΔT набояд 0 бошанд.", "Миқдори гармӣ"); return; } const val = Q/(c*dT); out = `m = Q/(cΔT) = ${fmt(Q)} / (${fmt(c)}×${fmt(dT)}) = ${fmt(val)} кг`; }
  else { if (c===0||m===0){ showResult("c ва m набояд 0 бошанд.", "Миқдори гармӣ"); return; } const val = Q/(c*m); out = `ΔT = Q/(cm) = ${fmt(Q)} / (${fmt(c)}×${fmt(m)}) = ${fmt(val)} К`; }
  showResult(out, "Миқдори гармӣ");
});

document.getElementById('calcMelt').addEventListener('click', ()=>{
  const res = oneBlank({ Q: readField('meltQ'), L: readField('meltL'), m: readField('meltM') });
  if (res.error){ showResult(res.error, "Гудозиш / сахтшавӣ"); return; }
  const { Q, L, m } = res.values;
  let out;
  if (res.blankKey === 'Q'){ const val = L*m; out = `Q = λ·m = ${fmt(L)} × ${fmt(m)} = ${fmt(val)} Ҷ`; }
  else if (res.blankKey === 'L'){ if (m===0){ showResult("m=0 буда наметавонад.", "Гудозиш / сахтшавӣ"); return; } const val = Q/m; out = `λ = Q/m = ${fmt(Q)} / ${fmt(m)} = ${fmt(val)} Ҷ/кг`; }
  else { if (L===0){ showResult("λ=0 буда наметавонад.", "Гудозиш / сахтшавӣ"); return; } const val = Q/L; out = `m = Q/λ = ${fmt(Q)} / ${fmt(L)} = ${fmt(val)} кг`; }
  showResult(out, "Гудозиш / сахтшавӣ");
});

document.getElementById('calcVaporize').addEventListener('click', ()=>{
  const res = oneBlank({ Q: readField('vapQ'), L: readField('vapL'), m: readField('vapM') });
  if (res.error){ showResult(res.error, "Бухоршавӣ / конденсатсия"); return; }
  const { Q, L, m } = res.values;
  let out;
  if (res.blankKey === 'Q'){ const val = L*m; out = `Q = L·m = ${fmt(L)} × ${fmt(m)} = ${fmt(val)} Ҷ`; }
  else if (res.blankKey === 'L'){ if (m===0){ showResult("m=0 буда наметавонад.", "Бухоршавӣ / конденсатсия"); return; } const val = Q/m; out = `L = Q/m = ${fmt(Q)} / ${fmt(m)} = ${fmt(val)} Ҷ/кг`; }
  else { if (L===0){ showResult("L=0 буда наметавонад.", "Бухоршавӣ / конденсатсия"); return; } const val = Q/L; out = `m = Q/L = ${fmt(Q)} / ${fmt(L)} = ${fmt(val)} кг`; }
  showResult(out, "Бухоршавӣ / конденсатсия");
});

document.getElementById('calcDensity').addEventListener('click', ()=>{
  const res = oneBlank({ m: readField('densM'), V: readField('densV'), rho: readField('densR') });
  if (res.error){ showResult(res.error, "Зичӣ"); return; }
  const { m, V, rho } = res.values;
  let out;
  if (res.blankKey === 'rho'){ if (V===0){ showResult("V=0 буда наметавонад.", "Зичӣ"); return; } const val = m/V; out = `ρ = m/V = ${fmt(m)} / ${fmt(V)} = ${fmt(val)} кг/м³`; }
  else if (res.blankKey === 'm'){ const val = rho*V; out = `m = ρ·V = ${fmt(rho)} × ${fmt(V)} = ${fmt(val)} кг`; }
  else { if (rho===0){ showResult("ρ=0 буда наметавонад.", "Зичӣ"); return; } const val = m/rho; out = `V = m/ρ = ${fmt(m)} / ${fmt(rho)} = ${fmt(val)} м³`; }
  showResult(out, "Зичӣ");
});

document.getElementById('calcPressure').addEventListener('click', ()=>{
  const res = oneBlank({ F: readField('presF'), S: readField('presS'), P: readField('presP') });
  if (res.error){ showResult(res.error, "Фишор"); return; }
  const { F, S, P } = res.values;
  let out;
  if (res.blankKey === 'P'){ if (S===0){ showResult("S=0 буда наметавонад.", "Фишор"); return; } const val = F/S; out = `P = F/S = ${fmt(F)} / ${fmt(S)} = ${fmt(val)} Па`; }
  else if (res.blankKey === 'F'){ const val = P*S; out = `F = P·S = ${fmt(P)} × ${fmt(S)} = ${fmt(val)} Н`; }
  else { if (P===0){ showResult("P=0 буда наметавонад.", "Фишор"); return; } const val = F/P; out = `S = F/P = ${fmt(F)} / ${fmt(P)} = ${fmt(val)} м²`; }
  showResult(out, "Фишор");
});

document.getElementById('calcHydro').addEventListener('click', ()=>{
  const res = oneBlank({ rho: readField('hydroRho'), h: readField('hydroH'), P: readField('hydroP') });
  if (res.error){ showResult(res.error, "Фишори гидростатикӣ"); return; }
  const { rho, h, P } = res.values;
  const g = 9.8;
  let out;
  if (res.blankKey === 'P'){ const val = rho*g*h; out = `P = ρgh = ${fmt(rho)}×9.8×${fmt(h)} = ${fmt(val)} Па`; }
  else if (res.blankKey === 'rho'){ if (h===0){ showResult("h=0 буда наметавонад.", "Фишори гидростатикӣ"); return; } const val = P/(g*h); out = `ρ = P/(gh) = ${fmt(P)} / (9.8×${fmt(h)}) = ${fmt(val)} кг/м³`; }
  else { if (rho===0){ showResult("ρ=0 буда наметавонад.", "Фишори гидростатикӣ"); return; } const val = P/(g*rho); out = `h = P/(ρg) = ${fmt(P)} / (${fmt(rho)}×9.8) = ${fmt(val)} м`; }
  showResult(out, "Фишори гидростатикӣ");
});

let ATOMIC = {
  "H":1.00794,"He":4.002602,"Li":6.941,"Be":9.012182,"B":10.811,"C":12.0107,"N":14.0067,"O":15.9994,"F":18.9984032,"Ne":20.1797,
  "Na":22.98976928,"Mg":24.305,"Al":26.9815386,"Si":28.0855,"P":30.973762,"S":32.065,"Cl":35.453,"K":39.0983,"Ca":40.078,
  "Fe":55.845,"Cu":63.546,"Zn":65.38,"Ag":107.8682,"Au":196.966569,"Pb":207.2,"I":126.90447,"Br":79.904
};
const R_GAS = 0.082057;

function tokenize(formula){
  if(!formula) return [];
  return formula.match(/(\(|\)|[A-Z][a-z]?|\d+)/g) || [];
}
function parseFormula(formula){
  const tokens = tokenize(formula);
  const stack = [ {} ];
  let i=0;
  while(i<tokens.length){
    const t = tokens[i];
    if (t === '('){ stack.push({}); i++; }
    else if (t === ')'){
      i++;
      let mul = 1;
      if (i<tokens.length && /^\d+$/.test(tokens[i])) { mul = parseInt(tokens[i]); i++; }
      const grp = stack.pop();
      for(const el in grp) stack[stack.length-1][el] = (stack[stack.length-1][el]||0) + grp[el]*mul;
    } else if (/^[A-Z][a-z]?$/.test(t)){
      const el = t; i++;
      let cnt = 1;
      if (i<tokens.length && /^\d+$/.test(tokens[i])) { cnt = parseInt(tokens[i]); i++; }
      stack[stack.length-1][el] = (stack[stack.length-1][el]||0) + cnt;
    } else { i++; }
  }
  return stack[0];
}
function molarMass(formula, atomic){
  const comp = parseFormula(formula);
  let mm = 0, missing = [];
  for(const el in comp){
    if (!(el in atomic)) missing.push(el);
    else mm += atomic[el]*comp[el];
  }
  return {mm, comp, missing};
}
function balanceReaction(reaction) {
  const parts = reaction.split('->').map(s => s.trim());
  if (parts.length !== 2) return "Хато: Реаксия бояд дар формат 'реагентҳо -> продуктҳо' бошад.";
  const reactants = parts[0].split('+').map(s => s.trim());
  const products = parts[1].split('+').map(s => s.trim());
  const all = [...reactants, ...products];
  const elements = [];
  const compList = all.map(comp => parseFormula(comp));
  compList.forEach(obj => Object.keys(obj).forEach(el => { if(!elements.includes(el)) elements.push(el); }));
  const rows = elements.map(el => all.map((comp, idx) => {
    const parsed = compList[idx];
    return (idx < reactants.length ? - (parsed[el]||0) : (parsed[el]||0));
  }));
  const maxCoef = 10;
  const n = all.length;
  function check(coefs){
    for(let r=0;r<rows.length;r++){
      let s=0;
      for(let j=0;j<n;j++) s += rows[r][j]*coefs[j];
      if (Math.abs(s) > 1e-6) return false;
    }
    return true;
  }
  const stack = [];
  function dfs(pos){
    if (pos===n) { if (check(stack)) return stack.slice(); return null; }
    for(let v=1; v<=maxCoef; v++){
      stack[pos]=v;
      const res = dfs(pos+1);
      if (res) return res;
    }
    return null;
  }
  let found = null;
  if (n<=6) found = dfs(0);
  if (!found) return "Натавонист реаксияи додашударо ба таври умумӣ ба таври эътидолӣ ҳамвор кунад. Лутфан реаксияро бо формулаҳои соддатар ворид кунед.";
  const gcd = (a,b)=>b?gcd(b,a%b):a;
  let g = found.reduce((acc,x)=>gcd(acc,x), found[0]);
  const simplified = found.map(x=>x/g);
  const rPart = reactants.map((r,i)=> (simplified[i]>1? simplified[i] + ' ' : '') + r).join(' + ');
  const pPart = products.map((p,i)=> (simplified[reactants.length + i]>1? simplified[reactants.length + i] + ' ' : '') + p).join(' + ');
  return `${rPart} -> ${pPart}`;
}

document.getElementById('calcMM').addEventListener('click', ()=>{
  const f = document.getElementById('chemFormula').value.trim();
  if (!f){ showResult("Лутфан формуларо ворид кунед.", "Массаи молярӣ"); return; }
  const res = molarMass(f, ATOMIC);
  if (res.missing.length) showResult("Элемент(ҳо) ношинохта: " + res.missing.join(", ") + "\nЛутфан онҳоро дар 'Массаҳо' илова кунед.", "Массаи молярӣ");
  else {
    let out = `${f} — массаи молярӣ = ${res.mm.toFixed(5)} г/моль\nСостав:\n`;
    for(const el in res.comp) out += `  ${el}: ${res.comp[el]}\n`;
    showResult(out, "Массаи молярӣ");
  }
});
document.getElementById('pct').addEventListener('click', ()=>{
  const f = document.getElementById('chemFormula').value.trim();
  if (!f){ showResult("Лутфан формуларо ворид кунед.", "% таркиб"); return; }
  const res = molarMass(f, ATOMIC);
  if (res.missing.length) { showResult("Элемент(ҳо) ношинохта: " + res.missing.join(", "), "% таркиб"); return; }
  let out = `${f} — % таркиб:\n`;
  for(const el in res.comp){
    const part = ATOMIC[el]*res.comp[el] / res.mm * 100;
    out += `${el}: ${part.toFixed(4)} %\n`;
  }
  showResult(out, "% таркиб");
});
document.getElementById('massToMoles').addEventListener('click', ()=>{
  const f = document.getElementById('chemFormula').value.trim();
  const mass = parseFloat(document.getElementById('chemMassInput').value);
  if (!f || isNaN(mass)){ showResult("Лутфан формула ва масса (г) ворид кунед.", "Масса → моль"); return; }
  const res = molarMass(f, ATOMIC);
  if (res.missing.length) { showResult("Элемент(ҳо) ношинохта: " + res.missing.join(", "), "Масса → моль"); return; }
  const moles = mass / res.mm;
  showResult(`${mass} г ${f} = ${moles.toFixed(6)} моль (MM = ${res.mm.toFixed(5)} г/моль)`, "Масса → моль");
});
document.getElementById('molesToMass').addEventListener('click', ()=>{
  const f = document.getElementById('chemFormula').value.trim();
  const moles = parseFloat(document.getElementById('chemMolesInput').value);
  if (!f || isNaN(moles)){ showResult("Лутфан формула ва миқдори молҳоро ворид кунед.", "Моль → масса"); return; }
  const res = molarMass(f, ATOMIC);
  if (res.missing.length) { showResult("Элемент(ҳо) ношинохта: " + res.missing.join(", "), "Моль → масса"); return; }
  const mass = moles * res.mm;
  showResult(`${moles} моль ${f} = ${mass.toFixed(6)} г (MM = ${res.mm.toFixed(5)} г/моль)`, "Моль → масса");
});
document.getElementById('balanceReaction').addEventListener('click', ()=>{
  const r = document.getElementById('chemReaction').value.trim();
  if (!r){ showResult("Лутфан реаксияро ворид кунед.", "Баланс"); return; }
  const balanced = balanceReaction(r);
  showResult(`Сатиҳбаландшуда:\n${balanced}`, "Баланс");
});
document.getElementById('calcPH').addEventListener('click', ()=>{
  const conc = parseFloat(document.getElementById('phConc').value);
  const type = document.getElementById('phType').value;
  if (isNaN(conc) || conc <= 0){ showResult("Лутфан концентрацияи мусбат ворид кунед.", "pH"); return; }
  let pH;
  if (type === 'acid') pH = -Math.log10(conc);
  else pH = 14 + Math.log10(conc);
  showResult(`pH ≈ ${pH.toFixed(2)}`, "pH");
});
document.getElementById('calcGas').addEventListener('click', ()=>{
  const P = parseFloat(document.getElementById('gasP').value);
  const V = parseFloat(document.getElementById('gasV').value);
  const T = parseFloat(document.getElementById('gasT').value);
  const n = parseFloat(document.getElementById('gasN').value);
  let out = '';
  if (!isNaN(P) && !isNaN(V) && !isNaN(T)) out += `n = ${((P*V)/(R_GAS*T)).toFixed(6)} моль\n`;
  if (!isNaN(n) && !isNaN(V) && !isNaN(T)) out += `P = ${((n*R_GAS*T)/V).toFixed(6)} атм\n`;
  if (!isNaN(n) && !isNaN(P) && !isNaN(T)) out += `V = ${((n*R_GAS*T)/P).toFixed(6)} л\n`;
  if (!isNaN(n) && !isNaN(P) && !isNaN(V)) out += `T = ${((P*V)/(n*R_GAS)).toFixed(6)} K\n`;
  if (!out) out = "Лутфан дуруст даромадҳоро ворид кунед (на камтар аз се арзиш барои ҳисоб).";
  showResult(out, "Қонуни газҳо");
});
document.getElementById('calcMolarity').addEventListener('click', ()=>{
  const mass = parseFloat(document.getElementById('massSolute').value);
  const V = parseFloat(document.getElementById('volumeSol').value);
  const formula = document.getElementById('formulaConc').value.trim();
  if (isNaN(mass) || isNaN(V) || V<=0 || !formula){ showResult("Лутфан масса, ҳаҷм (л) ва формуларо пурра ворид кунед.", "Молярият"); return; }
  const res = molarMass(formula, ATOMIC);
  if (res.missing.length){ showResult("Элемент(ҳо) ношинохта: " + res.missing.join(", "), "Молярият"); return; }
  const moles = mass / res.mm;
  const M = moles / V;
  showResult(`Молярият: ${M.toFixed(6)} моль/л (moles = ${moles.toFixed(6)} mol, MM = ${res.mm.toFixed(5)} г/моль)`, "Молярият");
});
document.getElementById('calcPercent').addEventListener('click', ()=>{
  const mass = parseFloat(document.getElementById('massSolute').value);
  const V = parseFloat(document.getElementById('volumeSol').value);
  if (isNaN(mass) || isNaN(V) || V<=0){ showResult("Лутфан масса ва ҳаҷм ворид кунед.", "Консентратсия %"); return; }
  const massPercent = (mass / (V * 1000)) * 100;
  showResult(`% масса дар маҳлул (тахминӣ, зичии 1 г/см³): ${massPercent.toFixed(4)} %`, "Консентратсия %");
});
document.getElementById('calcEnthalpy').addEventListener('click', ()=>{
  const rStr = document.getElementById('reactantsEnth').value.trim();
  const pStr = document.getElementById('productsEnth').value.trim();
  if (!rStr || !pStr){ showResult("Лутфан энталпияҳоро барои реагентҳо ва продуктҳо ворид кунед (бо ',').", "ΔH"); return; }
  const rArr = rStr.split(',').map(x=>parseFloat(x.trim()));
  const pArr = pStr.split(',').map(x=>parseFloat(x.trim()));
  if (rArr.some(isNaN) || pArr.some(isNaN)){ showResult("Формат хато: рақамҳоро бо ',' ҷудо кунед.", "ΔH"); return; }
  const sumR = rArr.reduce((a,b)=>a+b,0);
  const sumP = pArr.reduce((a,b)=>a+b,0);
  const dH = sumP - sumR;
  showResult(`ΔH реаксия (прибл.): ${dH.toFixed(4)} кДж (суммаи продуктҳо - суммаи реагентҳо)`, "ΔH");
});
document.getElementById('applyCustom').addEventListener('click', ()=>{
  const txt = document.getElementById('customMasses').value.trim();
  if (!txt){ showResult("Матни холӣ — ҳеҷ тағйир ёбед нашуд.", "Массаҳои атомӣ"); return; }
  const lines = txt.split('\n');
  let changed = 0, errs = [];
  lines.forEach(line=>{
    const s = line.trim();
    if (!s) return;
    const parts = s.split(':').map(x=>x.trim());
    if (parts.length !== 2 || isNaN(parseFloat(parts[1]))) { errs.push(s); return; }
    ATOMIC[parts[0]] = parseFloat(parts[1]);
    changed++;
  });
  let msg = `Тағйир дода шуд: ${changed} элемент(ҳо).`;
  if (errs.length) msg += `\nХатогӣ дар сатр(ҳо): ${errs.join(', ')}`;
  showResult(msg, "Массаҳои атомӣ");
});
const ATOMIC_DEFAULT = JSON.parse(JSON.stringify(ATOMIC));
document.getElementById('resetDefault').addEventListener('click', ()=>{
  ATOMIC = JSON.parse(JSON.stringify(ATOMIC_DEFAULT));
  document.getElementById('customMasses').value = '';
  showResult("Ҷадвали массаҳои атомӣ ба ҳолати пешфарз баргашт.", "Массаҳои атомӣ");
});

document.getElementById('chemProbType').addEventListener('change', (e)=>{
  document.querySelectorAll('#subject-chemistry .prob-fields').forEach(f=>{
    const active = f.dataset.prob === e.target.value;
    f.hidden = !active;
    f.classList.toggle('is-active', active);
  });
});

function parseCoeffCompound(str){
  const s = str.trim();
  const m = s.match(/^(\d+)\s*(.+)$/);
  if (m) return { coef: parseInt(m[1]), formula: m[2].trim() };
  return { coef: 1, formula: s };
}
function parseEquationSide(side){ return side.split('+').map(parseCoeffCompound); }
function findCompound(list, formula){ return list.find(c => c.formula.replace(/\s+/g,'') === formula.replace(/\s+/g,'')); }

function solveStoichiometry(){
  const eq = document.getElementById('stoichEquation').value.trim();
  const knownFormula = document.getElementById('stoichKnownFormula').value.trim();
  const knownMass = parseFloat(document.getElementById('stoichKnownMass').value);
  const targetFormula = document.getElementById('stoichTargetFormula').value.trim();
  const parts = eq.split('->').map(s=>s.trim());
  if (parts.length !== 2 || !knownFormula || !targetFormula || isNaN(knownMass)){
    showResult("Лутфан реаксия, моддаи маълум (бо масса) ва моддаи ҷустуҷӯшавандаро пурра ворид кунед.", "Стехиометрия");
    return;
  }
  const all = [...parseEquationSide(parts[0]), ...parseEquationSide(parts[1])];
  const known = findCompound(all, knownFormula);
  const target = findCompound(all, targetFormula);
  if (!known || !target){ showResult("Формулаи додашуда дар реаксия ёфт нашуд. Формулаҳоро бо навишти реаксия муқоиса кунед.", "Стехиометрия"); return; }
  const mmKnown = molarMass(known.formula, ATOMIC);
  const mmTarget = molarMass(target.formula, ATOMIC);
  if (mmKnown.missing.length || mmTarget.missing.length){ showResult("Элемент(ҳо) ношинохта: " + [...mmKnown.missing, ...mmTarget.missing].join(", "), "Стехиометрия"); return; }
  const molesKnown = knownMass / mmKnown.mm;
  const molesTarget = molesKnown * (target.coef / known.coef);
  const massTarget = molesTarget * mmTarget.mm;
  const out =
`Реаксия: ${eq}
1) n(${known.formula}) = ${knownMass} г ÷ ${mmKnown.mm.toFixed(4)} г/моль = ${molesKnown.toFixed(6)} моль
2) Нисбати коэффисиентҳо: ${target.coef} / ${known.coef}
   n(${target.formula}) = ${molesKnown.toFixed(6)} × (${target.coef}/${known.coef}) = ${molesTarget.toFixed(6)} моль
3) m(${target.formula}) = ${molesTarget.toFixed(6)} × ${mmTarget.mm.toFixed(4)} г/моль
   = ${massTarget.toFixed(6)} г`;
  showResult(out, "Стехиометрия");
}
function solveLimiting(){
  const eq = document.getElementById('limEquation').value.trim();
  const f1 = document.getElementById('limF1').value.trim();
  const m1 = parseFloat(document.getElementById('limMass1').value);
  const f2 = document.getElementById('limF2').value.trim();
  const m2 = parseFloat(document.getElementById('limMass2').value);
  const productFormula = document.getElementById('limProduct').value.trim();
  const parts = eq.split('->').map(s=>s.trim());
  if (parts.length !== 2 || !f1 || !f2 || isNaN(m1) || isNaN(m2) || !productFormula){
    showResult("Лутфан реаксия, ду реагент бо массаҳо ва маҳсулотро пурра ворид кунед.", "Реагенти маҳдудкунанда");
    return;
  }
  const all = [...parseEquationSide(parts[0]), ...parseEquationSide(parts[1])];
  const c1 = findCompound(all, f1), c2 = findCompound(all, f2), prod = findCompound(all, productFormula);
  if (!c1 || !c2 || !prod){ showResult("Формулаҳо дар реаксия ёфт нашуданд.", "Реагенти маҳдудкунанда"); return; }
  const mm1 = molarMass(c1.formula, ATOMIC), mm2 = molarMass(c2.formula, ATOMIC), mmP = molarMass(prod.formula, ATOMIC);
  if (mm1.missing.length || mm2.missing.length || mmP.missing.length){ showResult("Элемент(ҳо) ношинохта.", "Реагенти маҳдудкунанда"); return; }
  const n1 = m1/mm1.mm, n2 = m2/mm2.mm;
  const ratio1 = n1/c1.coef, ratio2 = n2/c2.coef;
  const limiting = ratio1 < ratio2 ? c1 : c2;
  const limRatio = Math.min(ratio1, ratio2);
  const molesProduct = limRatio * prod.coef;
  const massProduct = molesProduct * mmP.mm;
  const out =
`Реаксия: ${eq}
n(${c1.formula}) = ${m1} ÷ ${mm1.mm.toFixed(4)} = ${n1.toFixed(6)} моль  →  ÷${c1.coef} = ${ratio1.toFixed(6)}
n(${c2.formula}) = ${m2} ÷ ${mm2.mm.toFixed(4)} = ${n2.toFixed(6)} моль  →  ÷${c2.coef} = ${ratio2.toFixed(6)}

Реагенти маҳдудкунанда: ${limiting.formula} (нисбати хурдтарин)

m(${prod.formula}) = ${limRatio.toFixed(6)} × ${prod.coef} × ${mmP.mm.toFixed(4)} г/моль
 = ${massProduct.toFixed(6)} г`;
  showResult(out, "Реагенти маҳдудкунанда");
}
function solveDilution(){
  const vals = {
    c1: parseFloat(document.getElementById('dilC1').value.trim()),
    v1: parseFloat(document.getElementById('dilV1').value.trim()),
    c2: parseFloat(document.getElementById('dilC2').value.trim()),
    v2: parseFloat(document.getElementById('dilV2').value.trim())
  };
  const empty = Object.entries(vals).filter(([k,v])=>isNaN(v)).map(([k])=>k);
  if (empty.length !== 1){ showResult("Маҳз як майдонро холӣ монед, се майдони дигарро пур кунед.", "Тайёр кардани маҳлул"); return; }
  const missing = empty[0];
  let result, formula;
  if (missing === 'c1'){ result = (vals.c2*vals.v2)/vals.v1; formula = 'C₁ = C₂V₂ / V₁'; }
  else if (missing === 'v1'){ result = (vals.c2*vals.v2)/vals.c1; formula = 'V₁ = C₂V₂ / C₁'; }
  else if (missing === 'c2'){ result = (vals.c1*vals.v1)/vals.v2; formula = 'C₂ = C₁V₁ / V₂'; }
  else { result = (vals.c1*vals.v1)/vals.c2; formula = 'V₂ = C₁V₁ / C₂'; }
  const out =
`C₁V₁ = C₂V₂
Тағйирёбандаи ҷустуҷӯшаванда: ${missing.toUpperCase()}
Формула: ${formula}
Ҷавоб: ${missing.toUpperCase()} ≈ ${result.toFixed(6)}`;
  showResult(out, "Тайёр кардани маҳлул");
}
function solveYield(){
  const actual = parseFloat(document.getElementById('yieldActual').value);
  const theoretical = parseFloat(document.getElementById('yieldTheoretical').value);
  if (isNaN(actual) || isNaN(theoretical) || theoretical<=0){ showResult("Лутфан ҳосили воқеӣ ва назариявиро ворид кунед.", "Ҳосили реаксия"); return; }
  const pctY = (actual/theoretical)*100;
  const out =
`Ҳосили % = (ҳосили воқеӣ ÷ ҳосили назариявӣ) × 100
= (${actual} ÷ ${theoretical}) × 100
= ${pctY.toFixed(3)} %`;
  showResult(out, "Ҳосили реаксия");
}
function solveEmpirical(){
  const raw = document.getElementById('empComposition').value.trim();
  if (!raw){ showResult("Лутфан таркиби фоизиро ворид кунед (масалан: C:40, H:6.7, O:53.3).", "Формулаи эмпирикӣ"); return; }
  const pairs = raw.split(',').map(s=>s.trim()).filter(Boolean);
  const comp = {};
  for (const p of pairs){
    const [el, pctStr] = p.split(':').map(x=>x.trim());
    if (!el || isNaN(parseFloat(pctStr))){ showResult("Формат хато. Намуна: C:40, H:6.7, O:53.3", "Формулаи эмпирикӣ"); return; }
    comp[el] = parseFloat(pctStr);
  }
  const missing = Object.keys(comp).filter(el => !(el in ATOMIC));
  if (missing.length){ showResult("Элемент(ҳо) ношинохта: " + missing.join(", "), "Формулаи эмпирикӣ"); return; }
  const moles = {};
  for (const el in comp) moles[el] = comp[el]/ATOMIC[el];
  const minMoles = Math.min(...Object.values(moles));
  let ratio = {};
  for (const el in moles) ratio[el] = moles[el]/minMoles;
  let bestMultiplier = 1, bestErr = Infinity;
  for (let mult=1; mult<=6; mult++){
    let err = 0;
    for (const el in ratio) err += Math.abs(ratio[el]*mult - Math.round(ratio[el]*mult));
    if (err < bestErr){ bestErr = err; bestMultiplier = mult; }
  }
  let formula = '';
  let steps = '';
  for (const el in ratio){
    const n = Math.round(ratio[el]*bestMultiplier);
    steps += `  ${el}: ${comp[el]}% ÷ ${ATOMIC[el]} = ${moles[el].toFixed(4)} моль → нисбат ${ratio[el].toFixed(3)} → ×${bestMultiplier} ≈ ${n}\n`;
    formula += el + (n>1? n : '');
  }
  const out = `Ҳисоби нисбатҳои молӣ:\n${steps}\nФормулаи эмпирикӣ ≈ ${formula}`;
  showResult(out, "Формулаи эмпирикӣ");
}
document.getElementById('chemSolveProblem').addEventListener('click', ()=>{
  const type = document.getElementById('chemProbType').value;
  if (type === 'stoich') solveStoichiometry();
  else if (type === 'limiting') solveLimiting();
  else if (type === 'dilution') solveDilution();
  else if (type === 'yield') solveYield();
  else if (type === 'empirical') solveEmpirical();
});

const ALPHA_TJ = "а б в г ғ д е ё ж з и ӣ й к қ л м н о п р с т у ӯ ф х ҳ ч ҷ ш ъ э ю я".split(' ');
const ALPHA_EN = "a b c d e f g h i j k l m n o p q r s t u v w x y z".split(' ');

function renderLetterGrid(alpha){
  const grid = document.getElementById('letterGrid');
  grid.innerHTML = '';
  alpha.forEach(ch=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lkey';
    b.textContent = ch;
    b.addEventListener('click', ()=>{
      insertAtCursor(document.getElementById('uniInput'), ch);
    });
    grid.appendChild(b);
  });
}
renderLetterGrid(ALPHA_TJ);

document.getElementById('toggleLetterKeys').addEventListener('click', ()=>{
  const panel = document.getElementById('letterKeys');
  panel.hidden = !panel.hidden;
});
document.querySelectorAll('.lkey-lang').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.lkey-lang').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderLetterGrid(btn.dataset.alpha === 'tj' ? ALPHA_TJ : ALPHA_EN);
  });
});

const I18N = {
  tj: {
    tagline: "Ҳалкунаки масъалаҳои математикӣ, физикӣ ва химиявӣ",
    "subj-math": "Математика", "subj-physics": "Физика", "subj-chem": "Химия",
    "tab-solver": "Ҳалкунак", "tab-algebra": "Алгебра", "tab-geometry": "Геометрия", "tab-stats": "Статистика", "tab-problems": "Масъалаҳо",
    "ph-mech": "Механика", "ph-elec": "Электр", "ph-heat": "Гармӣ", "ph-press": "Фишор ва зичӣ",
    "result-tag": "Ҷавоб", "welcome": "Салом! Мавзӯъ ва амалро интихоб ва рақамҳоро ворид карда, тугмаро зер кунед.",
    "history-title": "Таърихи ҳалҳо", "history-clear": "Пок кардан", "history-empty": "Ҳанӯз ҳисобе нест.",
    "kb-toggle": "Ҳарфҳо / Letters", "btn-calc": "Ҳисоб кардан", "fill-empty": "Як майдонро холӣ монед — он ҳисоб карда мешавад.", "optional": "ихтиёрӣ",
    "mech-uniform": "Ҳаракати якхела", "mech-s": "Масофа s (м)", "mech-v": "Суръат v (м/с)", "mech-t": "Вақт t (с)",
    "mech-accel": "Ҳаракати тезгирифташуда", "mech-newton": "Қонуни дуюми Нютон", "mech-work": "Кор ва қувва",
    "mech-ke": "Энергияи кинетикӣ", "mech-pe": "Энергияи потенсиалӣ", "mech-impulse": "Импулс",
    "elec-ohm": "Қонуни Ом", "elec-power": "Қувваи барқ", "elec-series": "Пайвасти силсилавӣ", "elec-parallel": "Пайвасти параллелӣ",
    "elec-rlist": "Муқовиматҳо (Ом, бо вергул)", "elec-joule": "Гармии Ҷоул-Ленс",
    "heat-q": "Миқдори гармӣ", "heat-c": "c (Ҷ/(кг·К))", "heat-melt": "Гудозиш / сахтшавӣ", "heat-lambda": "λ (Ҷ/кг)",
    "heat-vap": "Бухоршавӣ / конденсатсия", "heat-L": "L (Ҷ/кг)",
    "press-density": "Зичӣ", "press-p": "Фишор", "press-hydro": "Фишори гидростатикӣ",
    "chem-tab-formulas": "Формула", "chem-tab-reaction": "Реаксия", "chem-tab-phgas": "pH · Газ", "chem-tab-conc": "Консентратсия",
    "chem-tab-enthalpy": "Энталпия", "chem-tab-problems": "Масъалаҳо", "chem-tab-masses": "Массаҳо",
    "foot-line": "ҳар масъала як роҳи ҳал дорад"
  },
  ru: {
    tagline: "Решатель задач по математике, физике и химии",
    "subj-math": "Математика", "subj-physics": "Физика", "subj-chem": "Химия",
    "tab-solver": "Решатель", "tab-algebra": "Алгебра", "tab-geometry": "Геометрия", "tab-stats": "Статистика", "tab-problems": "Задачи",
    "ph-mech": "Механика", "ph-elec": "Электричество", "ph-heat": "Теплота", "ph-press": "Давление и плотность",
    "result-tag": "Ответ", "welcome": "Привет! Выберите тему и действие, введите числа и нажмите кнопку.",
    "history-title": "История решений", "history-clear": "Очистить", "history-empty": "Пока нет расчётов.",
    "kb-toggle": "Буквы / Letters", "btn-calc": "Вычислить", "fill-empty": "Оставьте одно поле пустым — оно будет вычислено.", "optional": "необязательно",
    "mech-uniform": "Равномерное движение", "mech-s": "Путь s (м)", "mech-v": "Скорость v (м/с)", "mech-t": "Время t (с)",
    "mech-accel": "Равноускоренное движение", "mech-newton": "Второй закон Ньютона", "mech-work": "Работа и мощность",
    "mech-ke": "Кинетическая энергия", "mech-pe": "Потенциальная энергия", "mech-impulse": "Импульс",
    "elec-ohm": "Закон Ома", "elec-power": "Электрическая мощность", "elec-series": "Последовательное соединение", "elec-parallel": "Параллельное соединение",
    "elec-rlist": "Сопротивления (Ом, через запятую)", "elec-joule": "Закон Джоуля-Ленца",
    "heat-q": "Количество теплоты", "heat-c": "c (Дж/(кг·К))", "heat-melt": "Плавление / отвердевание", "heat-lambda": "λ (Дж/кг)",
    "heat-vap": "Парообразование / конденсация", "heat-L": "L (Дж/кг)",
    "press-density": "Плотность", "press-p": "Давление", "press-hydro": "Гидростатическое давление",
    "chem-tab-formulas": "Формулы", "chem-tab-reaction": "Реакция", "chem-tab-phgas": "pH · Газ", "chem-tab-conc": "Концентрация",
    "chem-tab-enthalpy": "Энтальпия", "chem-tab-problems": "Задачи", "chem-tab-masses": "Массы",
    "foot-line": "у каждой задачи есть решение"
  },
  en: {
    tagline: "Math, Physics and Chemistry problem solver",
    "subj-math": "Math", "subj-physics": "Physics", "subj-chem": "Chemistry",
    "tab-solver": "Solver", "tab-algebra": "Algebra", "tab-geometry": "Geometry", "tab-stats": "Statistics", "tab-problems": "Word problems",
    "ph-mech": "Mechanics", "ph-elec": "Electricity", "ph-heat": "Heat", "ph-press": "Pressure & density",
    "result-tag": "Answer", "welcome": "Hi! Pick a topic and action, enter numbers, then press the button.",
    "history-title": "Solution history", "history-clear": "Clear", "history-empty": "No calculations yet.",
    "kb-toggle": "Letters / Ҳарфҳо", "btn-calc": "Calculate", "fill-empty": "Leave one field empty — it will be calculated.", "optional": "optional",
    "mech-uniform": "Uniform motion", "mech-s": "Distance s (m)", "mech-v": "Speed v (m/s)", "mech-t": "Time t (s)",
    "mech-accel": "Uniformly accelerated motion", "mech-newton": "Newton's second law", "mech-work": "Work & power",
    "mech-ke": "Kinetic energy", "mech-pe": "Potential energy", "mech-impulse": "Momentum",
    "elec-ohm": "Ohm's law", "elec-power": "Electric power", "elec-series": "Series connection", "elec-parallel": "Parallel connection",
    "elec-rlist": "Resistances (Ω, comma-separated)", "elec-joule": "Joule-Lenz law",
    "heat-q": "Amount of heat", "heat-c": "c (J/(kg·K))", "heat-melt": "Melting / solidification", "heat-lambda": "λ (J/kg)",
    "heat-vap": "Vaporization / condensation", "heat-L": "L (J/kg)",
    "press-density": "Density", "press-p": "Pressure", "press-hydro": "Hydrostatic pressure",
    "chem-tab-formulas": "Formulas", "chem-tab-reaction": "Reaction", "chem-tab-phgas": "pH · Gas", "chem-tab-conc": "Concentration",
    "chem-tab-enthalpy": "Enthalpy", "chem-tab-problems": "Word problems", "chem-tab-masses": "Atomic masses",
    "foot-line": "every problem has a solution"
  },
  uz: {
    tagline: "Matematika, fizika va kimyo masalalarini yechuvchi",
    "subj-math": "Matematika", "subj-physics": "Fizika", "subj-chem": "Kimyo",
    "tab-solver": "Yechuvchi", "tab-algebra": "Algebra", "tab-geometry": "Geometriya", "tab-stats": "Statistika", "tab-problems": "Masalalar",
    "ph-mech": "Mexanika", "ph-elec": "Elektr", "ph-heat": "Issiqlik", "ph-press": "Bosim va zichlik",
    "result-tag": "Javob", "welcome": "Salom! Mavzu va amalni tanlang, sonlarni kiriting va tugmani bosing.",
    "history-title": "Yechimlar tarixi", "history-clear": "Tozalash", "history-empty": "Hali hisob yo'q.",
    "kb-toggle": "Harflar / Letters", "btn-calc": "Hisoblash", "fill-empty": "Bir maydonni bo'sh qoldiring — u hisoblanadi.", "optional": "ixtiyoriy",
    "mech-uniform": "Tekis harakat", "mech-s": "Masofa s (m)", "mech-v": "Tezlik v (m/s)", "mech-t": "Vaqt t (s)",
    "mech-accel": "Tezlanuvchi harakat", "mech-newton": "Nyutonning ikkinchi qonuni", "mech-work": "Ish va quvvat",
    "mech-ke": "Kinetik energiya", "mech-pe": "Potensial energiya", "mech-impulse": "Impuls",
    "elec-ohm": "Om qonuni", "elec-power": "Elektr quvvati", "elec-series": "Ketma-ket ulanish", "elec-parallel": "Parallel ulanish",
    "elec-rlist": "Qarshiliklar (Om, vergul bilan)", "elec-joule": "Joul-Lens qonuni",
    "heat-q": "Issiqlik miqdori", "heat-c": "c (J/(kg·K))", "heat-melt": "Erish / qotish", "heat-lambda": "λ (J/kg)",
    "heat-vap": "Bug'lanish / kondensatsiya", "heat-L": "L (J/kg)",
    "press-density": "Zichlik", "press-p": "Bosim", "press-hydro": "Gidrostatik bosim",
    "chem-tab-formulas": "Formula", "chem-tab-reaction": "Reaksiya", "chem-tab-phgas": "pH · Gaz", "chem-tab-conc": "Konsentratsiya",
    "chem-tab-enthalpy": "Entalpiya", "chem-tab-problems": "Masalalar", "chem-tab-masses": "Atom massalari",
    "foot-line": "har bir masalaning yechimi bor"
  }
};

function applyLanguage(lang){
  const dict = I18N[lang] || I18N.tj;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.documentElement.lang = lang;
  try { localStorage.setItem('mrx_lang', lang); } catch(e){}
}
document.querySelectorAll('.lang-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    applyLanguage(btn.dataset.lang);
  });
});
(function initLang(){
  let saved = 'tj';
  try { saved = localStorage.getItem('mrx_lang') || 'tj'; } catch(e){}
  const btn = document.querySelector(`.lang-btn[data-lang="${saved}"]`);
  if (btn){
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
  }
  applyLanguage(saved);
})();
