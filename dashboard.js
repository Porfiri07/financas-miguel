// ===== AUTH CHECK =====
if (sessionStorage.getItem('logado') !== 'sim') {
  window.location.href = 'login.html';
}

function sair() {
  sessionStorage.removeItem('logado');
  window.location.href = 'login.html';
}

// ===== ESTADO =====
let tabAtual = 'todos';
let chartInst = null;

// ===== SELETORES ANO/MÊS =====
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function initSeletores() {
  const hoje = new Date();
  const selAno = document.getElementById('selectAno');
  const selMes = document.getElementById('selectMes');

  // Anos
  for (let a = hoje.getFullYear() - 1; a <= hoje.getFullYear() + 1; a++) {
    const op = document.createElement('option');
    op.value = a;
    op.textContent = a;
    if (a === hoje.getFullYear()) op.selected = true;
    selAno.appendChild(op);
  }

  // Meses
  MESES.forEach((m, i) => {
    const op = document.createElement('option');
    op.value = i;
    op.textContent = m;
    if (i === hoje.getMonth()) op.selected = true;
    selMes.appendChild(op);
  });
}

function getMesSelecionado() {
  return {
    ano: parseInt(document.getElementById('selectAno').value),
    mes: parseInt(document.getElementById('selectMes').value),
  };
}

// ===== TAB =====
function setTab(tab, el) {
  tabAtual = tab;
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderDashboard();
}

// ===== FILTRAR TRANSAÇÕES =====
function filtrarTransacoes(trans, ano, mes) {
  return trans.filter(t => {
    if (!t.data) return false;
    const d = new Date(t.data + 'T00:00:00');
    if (d.getFullYear() !== ano || d.getMonth() !== mes) return false;
    if (tabAtual === 'dia15') return d.getDate() <= 15;
    if (tabAtual === 'dia25') return d.getDate() >= 16 && d.getDate() <= 25;
    return true;
  });
}

// ===== RENDER CARDS =====
function renderCards(trans, salario) {
  const despesas  = trans.filter(t => t.tipo === 'despesa').reduce((s,t) => s + t.valor, 0);
  const receitas  = trans.filter(t => t.tipo === 'receita').reduce((s,t) => s + t.valor, 0);
  const saldo     = salario + receitas - despesas;

  const cards = [
    {
      label: 'SALDO DO MÊS',
      value: formatBRL(saldo),
      cls: saldo >= 0 ? 'green' : 'red',
      icon: '💰', iconCls: 'green',
      sub: saldo >= 0 ? 'Positivo ✅' : 'Atenção ⚠️',
    },
    {
      label: 'SALÁRIO MIGUEL',
      value: formatBRL(salario),
      cls: 'green', icon: '👤', iconCls: 'blue',
      sub: 'Receita principal',
      editavel: true,
    },
    {
      label: 'GASTOS TOTAIS',
      value: formatBRL(despesas),
      cls: 'red', icon: '💸', iconCls: 'red',
      sub: `${trans.filter(t=>t.tipo==='despesa').length} transações`,
    },
    {
      label: 'RECEITAS EXTRAS',
      value: formatBRL(receitas),
      cls: 'green', icon: '📥', iconCls: 'green',
      sub: `${trans.filter(t=>t.tipo==='receita').length} entradas`,
    },
    {
      label: 'TRANSAÇÕES',
      value: trans.length,
      cls: '', icon: '🔄', iconCls: 'purple',
      sub: tabAtual === 'todos' ? 'Mês completo' : tabAtual === 'dia15' ? 'Até dia 15' : 'Dias 16–25',
    },
  ];

  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = cards.map(c => `
    <div class="card" ${c.editavel ? 'style="cursor:pointer" onclick="editarSalario()"' : ''}>
      <div class="card-top">
        <span class="card-label">${c.label}</span>
        <div class="card-icon ${c.iconCls}">${c.icon}</div>
      </div>
      <div class="card-value ${c.cls}">${c.value}</div>
      <div class="card-sub">${c.sub} ${c.editavel ? '<span style="color:#10b981;font-size:0.7rem">✏️ editar</span>' : ''}</div>
    </div>
  `).join('');
}

// ===== RENDER TABELA =====
function renderTabela(trans) {
  const tbody = document.getElementById('tabelaTrans');
  if (trans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#4b5563">
      Nenhuma transação neste período.</td></tr>`;
    return;
  }
  tbody.innerHTML = [...trans].reverse().map(t => `
    <tr>
      <td>${t.data ? new Date(t.data+'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
      <td>${t.desc}</td>
      <td><span class="cat-badge">${t.cat}</span></td>
      <td style="color:#6b7280;font-size:0.82rem">${t.pag || '-'}</td>
      <td class="${t.tipo==='despesa'?'val-neg':'val-pos'}">
        ${t.tipo==='despesa'?'-':'+'} ${formatBRL(t.valor)}
      </td>
      <td>
        <button onclick="deletarTransacao(${t.id})"
          style="background:transparent;border:none;color:#4b5563;cursor:pointer;font-size:1rem;transition:color 0.2s"
          onmouseover="this.style.color='#f87171'"
          onmouseout="this.style.color='#4b5563'">🗑</button>
      </td>
    </tr>
  `).join('');
}

// ===== RENDER CHART =====
function renderChart(ano, mes) {
  const dados = getDados();
  const labels = [];
  const gastos = [];
  const receitas = [];

  for (let i = 5; i >= 0; i--) {
    let m = mes - i;
    let a = ano;
    while (m < 0) { m += 12; a--; }
    labels.push(`${MESES_CURTOS[m]}/${String(a).slice(2)}`);

    const trans = (dados.compras || []).filter(t => {
      if (!t.data) return false;
      const d = new Date(t.data + 'T00:00:00');
      return d.getFullYear() === a && d.getMonth() === m;
    });
    gastos.push(trans.filter(t=>t.tipo==='despesa').reduce((s,t)=>s+t.valor,0));
    receitas.push(trans.filter(t=>t.tipo==='receita').reduce((s,t)=>s+t.valor,0) + (dados.salario || 0));
  }

  const ctx = document.getElementById('chartTendencia').getContext('2d');
  if (chartInst) chartInst.destroy();

  chartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Gastos',
          data: gastos,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981',
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Receita',
          data: receitas,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.05)',
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f2937',
          borderColor: '#374151',
          borderWidth: 1,
          titleColor: '#e5e7eb',
          bodyColor: '#9ca3af',
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${formatBRL(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#6b7280', font: { size: 11 } },
          grid: { color: '#1f2937' }
        },
        y: {
          ticks: {
            color: '#6b7280',
            font: { size: 11 },
            callback: v => 'R$' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v)
          },
          grid: { color: '#1f2937' }
        }
      }
    }
  });
}

// ===== RENDER PRINCIPAL =====
function renderDashboard() {
  const dados = getDados();
  const { ano, mes } = getMesSelecionado();
  const todasTrans = dados.compras || [];
  const filtradas  = filtrarTransacoes(todasTrans, ano, mes);

  renderCards(filtradas, dados.salario || 0);
  renderTabela(filtradas);
  renderChart(ano, mes);
}

// ===== EDITAR SALÁRIO =====
function editarSalario() {
  const dados = getDados();
  const novo = prompt('💰 Digite seu salário mensal:', dados.salario || 0);
  if (novo !== null && !isNaN(parseFloat(novo))) {
    dados.salario = parseFloat(novo.replace(',', '.'));
    salvarDados(dados);
    renderDashboard();
  }
}

// ===== MODAL =====
function abrirModal() {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('tData').value = hoje;
  document.getElementById('tDesc').value = '';
  document.getElementById('tValor').value = '';
  document.getElementById('modalOverlay').classList.add('open');
}
function fecharModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}
function fecharModalFora(e) {
  if (e.target.id === 'modalOverlay') fecharModal();
}

function salvarTransacao() {
  const desc  = document.getElementById('tDesc').value.trim();
  const valor = parseFloat(document.getElementById('tValor').value);
  const data  = document.getElementById('tData').value;
  const tipo  = document.getElementById('tTipo').value;
  const cat   = document.getElementById('tCat').value;
  const pag   = document.getElementById('tPag').value;

  if (!desc || isNaN(valor) || valor <= 0 || !data) {
    alert('Preencha todos os campos!');
    return;
  }

  const dados = getDados();
  if (!dados.compras) dados.compras = [];
  dados.compras.push({ id: Date.now(), desc, valor, data, tipo, cat, pag });
  salvarDados(dados);
  fecharModal();
  renderDashboard();
}

function deletarTransacao(id) {
  if (!confirm('Remover esta transação?')) return;
  const dados = getDados();
  dados.compras = (dados.compras || []).filter(t => t.id !== id);
  salvarDados(dados);
  renderDashboard();
}

// ===== INIT =====
initSeletores();
renderDashboard();
