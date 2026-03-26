// ===== DADOS (localStorage) =====
function getDados() {
  return JSON.parse(localStorage.getItem('financasMiguel')) || {
    salario: 0,
    compras: [],
    contasFixas: [],
    financiamentos: [],
    investimentos: [],
    historico: []
  };
}

function salvarDados(dados) {
  localStorage.setItem('financasMiguel', JSON.stringify(dados));
}

function formatBRL(val) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}


function salvarDados(dados) {
  localStorage.setItem('financasMiguel', JSON.stringify(dados));
}

// ===== MÊS ATUAL =====
function getMesAtual() {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const d = new Date();
  return `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

// ===== FORMATAR MOEDA =====
function formatBRL(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ===== EDITAR SALÁRIO =====
function editarValor(campo) {
  const dados = getDados();
  const novo = prompt('Digite o valor do salário:');
  if (novo !== null && !isNaN(parseFloat(novo))) {
    dados.salario = parseFloat(novo.replace(',', '.'));
    salvarDados(dados);
    renderDashboard();
  }
}

// ===== RENDER PRINCIPAL =====
function renderDashboard() {
  const dados = getDados();

  // Mês
  const mes = getMesAtual();
  document.getElementById('mesAtual').textContent = mes;
  document.getElementById('mesTransacoes').textContent = mes;

  // Salário
  document.getElementById('salarioMiguel').textContent = formatBRL(dados.salario);

  // Total Fixas
  const totalFixas = dados.contasFixas.reduce((s, c) => s + c.valor, 0);
  document.getElementById('totalFixas').textContent = formatBRL(totalFixas);

  // Total Compras
  const totalCompras = dados.compras.reduce((s, c) => s + c.valor, 0);

  // Total Financiamentos
  const totalFinanc = dados.financiamentos.reduce((s, f) => s + f.parcela, 0);

  // Total Gastos
  const totalGastos = totalFixas + totalCompras + totalFinanc;
  document.getElementById('totalGastos').textContent = formatBRL(totalGastos);

  // Receita
  document.getElementById('totalReceitas').textContent = formatBRL(dados.salario);

  // Saldo
  const saldo = dados.salario - totalGastos;
  const elSaldo = document.getElementById('saldoMes');
  elSaldo.textContent = formatBRL(saldo);
  elSaldo.className = 'card-value ' + (saldo >= 0 ? 'green' : 'red');

  // Transações
  const todasTransacoes = [
    ...dados.compras.map(c => ({ desc: c.desc, val: -c.valor, data: c.data })),
    ...dados.contasFixas.map(c => ({ desc: c.nome, val: -c.valor, data: 'Fixo' })),
  ].slice(0, 6);

  document.getElementById('totalTransacoes').textContent =
    dados.compras.length + dados.contasFixas.length + dados.financiamentos.length;

  const lista = document.getElementById('listaTransacoes');
  if (todasTransacoes.length === 0) {
    lista.innerHTML = '<p class="empty-msg">Nenhuma transação ainda.</p>';
  } else {
    lista.innerHTML = todasTransacoes.map(t => `
      <div class="transacao-item">
        <div>
          <div class="t-desc">${t.desc}</div>
          <div class="t-data">${t.data}</div>
        </div>
        <span class="${t.val < 0 ? 't-val-neg' : 't-val-pos'}">
          ${formatBRL(Math.abs(t.val))}
        </span>
      </div>
    `).join('');
  }

  // Badge variação
  if (dados.historico.length >= 2) {
    const hist = dados.historico;
    const ult = hist[hist.length - 1].total;
    const ant = hist[hist.length - 2].total;
    const variacao = (((ult - ant) / ant) * 100).toFixed(1);
    document.getElementById('badgeGastos').textContent =
      `${variacao > 0 ? '▲' : '▼'} ${Math.abs(variacao)}%`;
  }

  renderCharts(dados, totalFixas, totalCompras, totalFinanc);
}

// ===== GRÁFICOS =====
let chartTendencia, chartPizza;

function renderCharts(dados, fixas, compras, financ) {
  // Tendência
  const ctxT = document.getElementById('chartTendencia').getContext('2d');
  if (chartTendencia) chartTendencia.destroy();
  chartTendencia = new Chart(ctxT, {
    type: 'line',
    data: {
      labels: dados.historico.map(h => h.mes),
      datasets: [{
        label: 'Gastos Totais',
        data: dados.historico.map(h => h.total),
        borderColor: '#00e5a0',
        backgroundColor: 'rgba(0,229,160,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#00e5a0',
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: '#888' },
          grid: { color: '#1f1f1f' }
        },
        y: {
          ticks: {
            color: '#888',
            callback: v => 'R$' + (v/1000).toFixed(1) + 'k'
          },
          grid: { color: '#1f1f1f' }
        }
      }
    }
  });

  // Pizza
  const ctxP = document.getElementById('chartPizza').getContext('2d');
  if (chartPizza) chartPizza.destroy();
  chartPizza = new Chart(ctxP, {
    type: 'doughnut',
    data: {
      labels: ['Fixas', 'Compras', 'Financiamentos'],
      datasets: [{
        data: [fixas || 1, compras || 1, financ || 1],
        backgroundColor: ['#00e5a0', '#00bcd4', '#ff4d6d'],
        borderColor: '#1a1a1a',
        borderWidth: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#888', padding: 16, font: { size: 12 } }
        }
      }
    }
  });
}

// ===== INIT =====
renderDashboard();
