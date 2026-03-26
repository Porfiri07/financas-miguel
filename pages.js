// ===== UTILITÁRIOS =====
function formatBRL(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getMesAtual() {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const d = new Date();
  return `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

function setMes() {
  const el = document.getElementById('mesAtual');
  if (el) el.textContent = getMesAtual();
}

// ===========================
// 🏠 CONTAS FIXAS
// ===========================
function initContasFixas() {
  setMes();
  renderContasFixas();
}

function adicionarFixa() {
  const nome  = document.getElementById('nomeFixa').value.trim();
  const valor = parseFloat(document.getElementById('valorFixa').value);
  const venc  = document.getElementById('vencFixa').value;
  const cat   = document.getElementById('catFixa').value;

  if (!nome || isNaN(valor) || valor <= 0) {
    alert('Preencha nome e valor corretamente!');
    return;
  }

  const dados = getDados();
  dados.contasFixas.push({ id: Date.now(), nome, valor, venc, cat, pago: false });
  salvarDados(dados);

  document.getElementById('nomeFixa').value  = '';
  document.getElementById('valorFixa').value = '';
  document.getElementById('vencFixa').value  = '';
  renderContasFixas();
}

function togglePago(id) {
  const dados = getDados();
  const item = dados.contasFixas.find(c => c.id === id);
  if (item) item.pago = !item.pago;
  salvarDados(dados);
  renderContasFixas();
}

function deletarFixa(id) {
  if (!confirm('Remover esta conta?')) return;
  const dados = getDados();
  dados.contasFixas = dados.contasFixas.filter(c => c.id !== id);
  salvarDados(dados);
  renderContasFixas();
}

function renderContasFixas() {
  const dados = getDados();
  const tbody = document.getElementById('tabelaFixas');
  const total = dados.contasFixas.reduce((s, c) => s + c.valor, 0);
  document.getElementById('totalFixas').textContent = `Total: ${formatBRL(total)}`;

  if (dados.contasFixas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Nenhuma conta fixa cadastrada.</td></tr>';
    return;
  }

  tbody.innerHTML = dados.contasFixas.map(c => `
    <tr>
      <td>${c.nome}</td>
      <td>${c.cat}</td>
      <td>Dia ${c.venc || '-'}</td>
      <td>${formatBRL(c.valor)}</td>
      <td>
        <span class="badge ${c.pago ? 'badge-pago' : 'badge-pendente'}"
              style="cursor:pointer"
              onclick="togglePago(${c.id})">
          ${c.pago ? '✅ Pago' : '⏳ Pendente'}
        </span>
      </td>
      <td><button class="btn-delete" onclick="deletarFixa(${c.id})">🗑 Remover</button></td>
    </tr>
  `).join('');
}

// ===========================
// 🛒 COMPRAS
// ===========================
function initCompras() {
  setMes();
  // Data padrão = hoje
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('dataCompra').value = hoje;
  renderCompras();
}

function adicionarCompra() {
  const desc  = document.getElementById('descCompra').value.trim();
  const valor = parseFloat(document.getElementById('valorCompra').value);
  const data  = document.getElementById('dataCompra').value;
  const cat   = document.getElementById('catCompra').value;
  const pag   = document.getElementById('pagCompra').value;

  if (!desc || isNaN(valor) || valor <= 0) {
    alert('Preencha descrição e valor corretamente!');
    return;
  }

  const dados = getDados();
  dados.compras.push({ id: Date.now(), desc, valor, data, cat, pag });
  salvarDados(dados);

  document.getElementById('descCompra').value  = '';
  document.getElementById('valorCompra').value = '';
  renderCompras();
}

function deletarCompra(id) {
  if (!confirm('Remover esta compra?')) return;
  const dados = getDados();
  dados.compras = dados.compras.filter(c => c.id !== id);
  salvarDados(dados);
  renderCompras();
}

function renderCompras() {
  const dados = getDados();
  const filtro = document.getElementById('filtroCategoria')?.value || '';
  const lista = filtro
    ? dados.compras.filter(c => c.cat === filtro)
    : dados.compras;

  const total = lista.reduce((s, c) => s + c.valor, 0);
  document.getElementById('totalCompras').textContent = `Total: ${formatBRL(total)}`;

  const tbody = document.getElementById('tabelaCompras');
  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Nenhuma compra registrada.</td></tr>';
    return;
  }

  tbody.innerHTML = [...lista].reverse().map(c => `
    <tr>
      <td>${c.desc}</td>
      <td>${c.cat}</td>
      <td>${c.data ? new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
      <td>${c.pag}</td>
      <td>${formatBRL(c.valor)}</td>
      <td><button class="btn-delete" onclick="deletarCompra(${c.id})">🗑 Remover</button></td>
    </tr>
  `).join('');
}

// ===========================
// 💳 FINANCIAMENTOS
// ===========================
function initFinanciamentos() {
  setMes();
  renderFinanciamentos();
}

function adicionarFinanciamento() {
  const nome        = document.getElementById('nomeFinanc').value.trim();
  const valorTotal  = parseFloat(document.getElementById('valorTotalFinanc').value);
  const parcela     = parseFloat(document.getElementById('parcelaFinanc').value);
  const parcelaAt   = parseInt(document.getElementById('parcelaAtual').value);
  const totalParc   = parseInt(document.getElementById('totalParcelas').value);
  const banco       = document.getElementById('bancoFinanc').value.trim();

  if (!nome || isNaN(parcela) || parcela <= 0) {
    alert('Preencha nome e valor da parcela!');
    return;
  }

  const dados = getDados();
  dados.financiamentos.push({
    id: Date.now(), nome, valorTotal, parcela,
    parcelaAt: parcelaAt || 1, totalParc: totalParc || 1, banco
  });
  salvarDados(dados);

  ['nomeFinanc','valorTotalFinanc','parcelaFinanc','parcelaAtual','totalParcelas','bancoFinanc']
    .forEach(id => document.getElementById(id).value = '');
  renderFinanciamentos();
}

function deletarFinanciamento(id) {
  if (!confirm('Remover este financiamento?')) return;
  const dados = getDados();
  dados.financiamentos = dados.financiamentos.filter(f => f.id !== id);
  salvarDados(dados);
  renderFinanciamentos();
}

function renderFinanciamentos() {
  const dados = getDados();
  const grid  = document.getElementById('gridFinanciamentos');
  const total = dados.financiamentos.reduce((s, f) => s + f.parcela, 0);
  document.getElementById('totalFinanc').textContent = `Total Mensal: ${formatBRL(total)}`;

  if (dados.financiamentos.length === 0) {
    grid.innerHTML = '<p class="empty-msg">Nenhum financiamento cadastrado.</p>';
    return;
  }

  grid.innerHTML = dados.financiamentos.map(f => {
    const progresso = Math.round((f.parcelaAt / f.totalParc) * 100);
    const saldo = f.valorTotal - (f.parcela * f.parcelaAt);
    return `
      <div class="financ-card">
        <div>
          <div class="financ-nome">${f.nome}</div>
          <div class="financ-banco">${f.banco || 'Sem banco'}</div>
        </div>
        <div class="financ-parcela">${formatBRL(f.parcela)}<span style="font-size:0.75rem;color:var(--text-muted)">/mês</span></div>
        <div class="financ-progress-bar">
          <div class="financ-progress-fill" style="width:${progresso}%"></div>
        </div>
        <div class="financ-info">
          <span>Parcela ${f.parcelaAt} de ${f.totalParc}</span>
          <span>${progresso}% pago</span>
        </div>
        ${f.valorTotal ? `<div class="financ-info"><span>Saldo devedor:</span><span style="color:var(--red)">${formatBRL(Math.max(saldo,0))}</span></div>` : ''}
        <button class="btn-delete" onclick="deletarFinanciamento(${f.id})">🗑 Remover</button>
      </div>
    `;
  }).join('');
}

// ===========================
// 📈 INVESTIMENTOS
// ===========================
let chartCarteira;

function initInvestimentos() {
  setMes();
  renderInvestimentos();
}

function adicionarInvestimento() {
  const nome  = document.getElementById('nomeInvest').value.trim();
  const tipo  = document.getElementById('tipoInvest').value;
  const inst  = document.getElementById('instInvest').value.trim();
  const valor = parseFloat(document.getElementById('valorInvest').value);
  const rend  = parseFloat(document.getElementById('rendInvest').value) || 0;

  if (!nome || isNaN(valor) || valor <= 0) {
    alert('Preencha nome e valor investido!');
    return;
  }

  const dados = getDados();
  dados.investimentos.push({ id: Date.now(), nome, tipo, inst, valor, rend });
  salvarDados(dados);

  ['nomeInvest','instInvest','valorInvest','rendInvest']
    .forEach(id => document.getElementById(id).value = '');
  renderInvestimentos();
}

function deletarInvestimento(id) {
  if (!confirm('Remover este investimento?')) return;
  const dados = getDados();
  dados.investimentos = dados.investimentos.filter(i => i.id !== id);
  salvarDados(dados);
  renderInvestimentos();
}

function renderInvestimentos() {
  const dados = getDados();
  const totalInvestido  = dados.investimentos.reduce((s, i) => s + i.valor, 0);
  const totalRendimento = dados.investimentos.reduce((s, i) => s + i.rend, 0);
  const patrimonio      = totalInvestido + totalRendimento;

  document.getElementById('totalInvest').textContent     = `Total: ${formatBRL(patrimonio)}`;
  document.getElementById('totalInvestido').textContent  = formatBRL(totalInvestido);
  document.getElementById('totalRendimento').textContent = formatBRL(totalRendimento);
  document.getElementById('patrimonioAtual').textContent = formatBRL(patrimonio);

  // Tabela
  const tbody = document.getElementById('tabelaInvestimentos');
  if (dados.investimentos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Nenhum investimento cadastrado.</td></tr>';
  } else {
    tbody.innerHTML = dados.investimentos.map(i => `
      <tr>
        <td>${i.nome}</td>
        <td>${i.tipo}</td>
        <td>${i.inst || '-'}</td>
        <td>${formatBRL(i.valor)}</td>
        <td style="color:var(--green)">${formatBRL(i.rend)}</td>
        <td style="font-weight:700">${formatBRL(i.valor + i.rend)}</td>
        <td><button class="btn-delete" onclick="deletarInvestimento(${i.id})">🗑 Remover</button></td>
      </tr>
    `).join('');
  }

  // Gráfico carteira
  const ctx = document.getElementById('chartCarteira').getContext('2d');
  if (chartCarteira) chartCarteira.destroy();

  const grupos = {};
  dados.investimentos.forEach(i => {
    grupos[i.tipo] = (grupos[i.tipo] || 0) + i.valor + i.rend;
  });

  const cores = ['#00e5a0','#00bcd4','#ff4d6d','#ffd166','#a78bfa','#f97316','#60a5fa'];
  chartCarteira = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(grupos).length ? Object.keys(grupos) : ['Sem dados'],
      datasets: [{
        data: Object.values(grupos).length ? Object.values(grupos) : [1],
        backgroundColor: cores,
        borderColor: '#1a1a1a',
        borderWidth: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#888', padding: 16, font: { size: 12 } }
        }
      }
    }
  });
}
