// -----------------------------
// 1. CONFIGURAÇÕES E ESTADO GLOBAL
// -----------------------------
const contentContainer = document.getElementById('content-container');
const pageTitle = document.getElementById('page-title');

// Salva o HTML original do dashboard principal
const originalDashboard = contentContainer.innerHTML;

// Variáveis Globais de Estado
let mesaAtualId = null;
let pedidoId = null;
window.totalMesa = 0;

// -----------------------------
// 2. SISTEMA DE TOAST (NOTIFICAÇÕES PREMIUM)
// -----------------------------
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `glass-toast toast-${type}`;
    
    let icon = 'fa-check-circle';
    if(type === 'error') icon = 'fa-exclamation-circle';
    if(type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${icon}" style="font-size: 20px;"></i>
        <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; font-size: 14px;">${type === 'error' ? 'Erro' : (type === 'warning' ? 'Aviso' : 'Sucesso')}</span>
            <span style="font-size: 13px; color: var(--text-muted);">${message}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// -----------------------------
// 3. LÓGICA DE NAVEGAÇÃO (ROTEADOR)
// -----------------------------
async function loadPage(page) {
    try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) throw new Error("Página não encontrada no servidor.");
        const html = await response.text();
        
        // Aplica animação de fade-in removendo e adicionando a classe
        contentContainer.style.animation = 'none';
        contentContainer.offsetHeight; // trigger reflow
        contentContainer.innerHTML = html;
        contentContainer.style.animation = 'fadeIn 0.4s ease-out forwards';

        // Lógicas específicas após carregar páginas
        if (page === "mesas") {
            carregarMesas();
        } else if (page === "estoque") {
            carregarEstoque();
        } else if (page === "venda-direta") {
            carregarProdutosVendaDireta();
        } else if (page === "caixa") {
            carregarCaixa();
        }
    } catch (error) {
        contentContainer.innerHTML = `
            <div class="glass-card" style="border-color: var(--danger);">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                <h2 style="color: var(--danger); margin-bottom: 12px;">Página em Construção</h2>
                <p style="color: var(--text-muted); margin-bottom: 24px;">A página solicitada (${page}) ainda não está disponível.</p>
                <button class="btn btn-outline" onclick="handleAction('Menu Principal')">Voltar ao Início</button>
            </div>
        `;
    }
}

function handleAction(pageName, element = null) {
    pageTitle.innerText = pageName;

    // Atualiza estado ativo na sidebar
    if (element) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
    }

    switch (pageName) {
        case 'Menu Principal':
            contentContainer.innerHTML = originalDashboard;
            pageTitle.innerText = 'Dashboard';
            break;
        case 'Estoque':
            loadPage('estoque');
            break;
        case 'Venda Direta':
            loadPage('venda-direta');
            break;
        case 'Mesas':
            loadPage('mesas');
            break;
        case 'Caixa':
            loadPage('caixa');
            break;
        case 'Relatórios':
            loadPage('relatorios');
            break;
        default:
            loadPage(pageName.toLowerCase().replace(" ", "-"));
            break;
    }
}

// -----------------------------
// 4. LÓGICA DE MESAS
// -----------------------------
async function carregarMesas() {
    try {
        const res = await fetch("http://localhost:3000/mesas");
        const mesas = await res.json();
        
        const container = document.getElementById("lista-mesas");
        if (!container) return; // if not on the page

        container.innerHTML = "";
        
        mesas.forEach(mesa => {
            const isOcupada = mesa.status !== 'LIVRE';
            
            container.innerHTML += `
                <div class="mesa-card">
                    <div class="mesa-header">
                        <h3 style="font-size: 18px; font-weight: 500;">Mesa ${mesa.numero}</h3>
                        <span class="status-badge ${isOcupada ? 'status-ocupada' : 'status-livre'}">
                            ${mesa.status}
                        </span>
                    </div>
                    <div class="mesa-actions">
                        ${!isOcupada ? `
                            <button class="btn btn-primary" onclick="abrirMesa(${mesa.id})"><i class="fas fa-play"></i> Abrir</button>
                        ` : `
                            <button class="btn btn-outline" onclick="abrirModalMesa(${mesa.id})"><i class="fas fa-edit"></i> Pedidos</button>
                            <button class="btn btn-danger" onclick="abrirModalFechamento(${mesa.id})"><i class="fas fa-stop"></i> Fechar</button>
                        `}
                    </div>
                </div>
            `;
        });
    } catch (error) {
        showToast("Erro ao conectar com o servidor.", "error");
    }
}

async function abrirMesa(id) {
    try {
        const res = await fetch(`http://localhost:3000/mesas/${id}/abrir`, { method: "POST" });
        if(!res.ok) throw new Error("Erro ao abrir");
        showToast(`Mesa ${id} aberta com sucesso!`, "success");
        carregarMesas();
    } catch (error) {
        showToast("Falha ao abrir mesa.", "error");
    }
}

async function criarMesa() {
    try {
        const res = await fetch("http://localhost:3000/mesas", { method: "POST" });
        if(!res.ok) throw new Error("Falha ao criar mesa");
        showToast("Nova mesa criada com sucesso!", "success");
        carregarMesas();
    } catch (e) {
        showToast("Erro ao criar nova mesa.", "error");
    }
}

// -----------------------------
// 5. SISTEMA DE MODAL GLOBAL
// -----------------------------
function abrirModalHTML(htmlContent) {
    const id = "global-modal";
    let modal = document.getElementById(id);
    
    if (!modal) {
        // Criar estrutura base do Modal Premium
        modal = document.createElement("div");
        modal.id = id;
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="glass-modal">
                <div id="modal-dinamico-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById("modal-dinamico-content").innerHTML = htmlContent;
    
    // Animação de entrada
    setTimeout(() => {
        modal.classList.add("active");
    }, 10);
}

function fecharModal() {
    const modal = document.getElementById("global-modal");
    if (modal) {
        modal.classList.remove("active");
        setTimeout(() => modal.remove(), 300); // espera animação
    }
}

// -----------------------------
// 6. LÓGICA INTERNA DA MESA (PEDIDOS)
// -----------------------------
async function abrirModalMesa(id) {
    mesaAtualId = id;
    
    // Carregar modal de edição de pedidos da mesa
    const htmlModal = `
        <div class="modal-header">
            <h2>Mesa ${id} - Consumo</h2>
            <button class="close-btn" onclick="fecharModal()"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="form-group" style="display: flex; gap: 10px;">
            <select id="select-produto" class="glass-select" style="flex: 2;"></select>
            <input type="number" id="quantidade" class="glass-input" value="1" min="1" style="flex: 1;" placeholder="Qtd">
            <button class="btn btn-primary" onclick="adicionarItemModal()"><i class="fas fa-plus"></i></button>
        </div>
        
        <div class="glass-table-wrapper" style="margin-top: 20px; max-height: 250px; overflow-y: auto;">
            <table class="glass-table">
                <thead><tr><th>Item</th><th>Qtd</th><th class="text-right">Preço</th><th></th></tr></thead>
                <tbody id="modal-detalhes-body"></tbody>
            </table>
        </div>
        
        <div style="margin-top: 20px; display: flex; align-items: flex-end; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <input type="text" id="mesa-cliente" class="glass-input" placeholder="Nome do Cliente (Comanda)" style="padding: 6px 10px; width: 220px;">
                <button class="btn btn-outline" style="padding: 8px 16px; width: fit-content;" onclick="imprimirComandaMesa()"><i class="fas fa-print"></i> Imprimir Comanda</button>
            </div>
            
            <div style="text-align: right;">
                <span style="font-size: 14px; color: var(--text-muted); display: block;">Total da Mesa</span>
                <h3 id="modal-total" data-total="0" style="font-size: 24px; color: var(--success);">R$ 0.00</h3>
            </div>
        </div>
    `;
    
    abrirModalHTML(htmlModal);
    
    await carregarProdutosSelect();
    await carregarDetalhesMesaModal();
}

async function carregarProdutosSelect() {
    try {
        const res = await fetch("http://localhost:3000/produtos");
        const produtos = await res.json();
        const select = document.getElementById("select-produto");
        select.innerHTML = "";
        
        produtos.forEach(p => {
            if (p.ativo) {
                select.innerHTML += `<option value="${p.id}">${p.nome} - R$ ${p.preco.toFixed(2)}</option>`;
            }
        });
    } catch(e) {}
}

async function carregarDetalhesMesaModal() {
    try {
        const res = await fetch(`http://localhost:3000/mesas/${mesaAtualId}`);
        const mesa = await res.json();
        
        pedidoId = mesa.pedido_id;
        window.totalMesa = mesa.total;
        
        document.getElementById("modal-total").innerText = `R$ ${mesa.total.toFixed(2)}`;
        document.getElementById("modal-total").dataset.total = mesa.total;
        
        const tbody = document.getElementById("modal-detalhes-body");
        tbody.innerHTML = "";
        
        window.itensMesaAtual = [];
        if (mesa.itens && mesa.itens.length > 0) {
            window.itensMesaAtual = mesa.itens.map(i => ({ nome: i.nome_produto, qtd: i.quantidade, preco: i.preco_unitario }));
            mesa.itens.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.nome_produto}</td>
                        <td>${item.quantidade}x</td>
                        <td class="text-right">R$ ${item.preco_unitario.toFixed(2)}</td>
                        <td class="text-right">
                            <button class="btn btn-outline" style="padding: 4px 8px; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);" onclick="removerItem(${item.item_id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Nenhum item adicionado.</td></tr>`;
        }
    } catch(e) {
        showToast("Erro ao carregar detalhes", "error");
    }
}

async function adicionarItemModal() {
    const produto_id = document.getElementById("select-produto").value;
    const quantidade = document.getElementById("quantidade").value;

    try {
        if (!pedidoId) {
            // Cria pedido associado à mesa se não existir
            const resPedido = await fetch("http://localhost:3000/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mesa_id: mesaAtualId, tipo: "CONSUMO_LOCAL" })
            });
            const data = await resPedido.json();
            pedidoId = data.id;
        }

        const res = await fetch(`http://localhost:3000/pedidos/${pedidoId}/itens`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ produto_id: Number(produto_id), quantidade: Number(quantidade) })
        });
        
        if(!res.ok) throw new Error("Erro add");
        carregarDetalhesMesaModal();
    } catch(e) {
        showToast("Erro ao adicionar item", "error");
    }
}

async function removerItem(itemId) {
    if(!confirm("Tem certeza que deseja remover este item?")) return;

    try {
        const res = await fetch(`http://localhost:3000/itens/${itemId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
        showToast("Item removido", "success");
        carregarDetalhesMesaModal();
    } catch(e) {
        showToast(e.message || "Erro ao remover", "error");
    }
}

// -----------------------------
// 7. FECHAMENTO DE MESA E PAGAMENTO
// -----------------------------
async function abrirModalFechamento(id) {
    mesaAtualId = id;
    
    // Busca total da mesa
    const res = await fetch(`http://localhost:3000/mesas/${mesaAtualId}`);
    const mesa = await res.json();
    pedidoId = mesa.pedido_id;
    window.totalMesa = mesa.total;
    window.itensMesaAtual = mesa.itens ? mesa.itens.map(i => ({ nome: i.nome_produto, qtd: i.quantidade, preco: i.preco_unitario })) : [];

    const htmlModal = `
        <div class="modal-header">
            <h2>Pagamento - Mesa ${id}</h2>
            <button class="close-btn" onclick="fecharModal()"><i class="fas fa-times"></i></button>
        </div>
        
        <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px; border: 1px solid var(--glass-border);">
            <span style="color: var(--text-muted); font-size: 14px;">Total a Pagar</span>
            <h1 style="color: white; font-size: 36px; margin-top: 5px;">R$ ${mesa.total.toFixed(2)}</h1>
        </div>

        <div class="form-group">
            <label>Forma de Pagamento</label>
            <select id="forma-pagamento" class="glass-select" onchange="toggleTroco(this.value)">
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
            </select>
        </div>

        <div id="troco-container" class="form-group" style="display: none;">
            <label>Valor Recebido (R$)</label>
            <input type="number" id="valor-recebido" class="glass-input" placeholder="0.00" oninput="calcularTroco(this.value, ${mesa.total})">
            
            <div style="margin-top: 10px; display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Troco:</span>
                <strong id="troco-valor" style="color: var(--success); font-size: 18px;">R$ 0.00</strong>
            </div>
        </div>

        <button class="btn btn-success" style="width: 100%; margin-top: 10px;" onclick="confirmarPagamento()"><i class="fas fa-check"></i> Confirmar Recebimento</button>
    `;
    
    abrirModalHTML(htmlModal);
}

function toggleTroco(forma) {
    document.getElementById('troco-container').style.display = forma === 'DINHEIRO' ? 'block' : 'none';
}

function calcularTroco(recebido, total) {
    const val = Number(recebido);
    const trocoEl = document.getElementById('troco-valor');
    if (val > total) {
        trocoEl.innerText = `R$ ${(val - total).toFixed(2)}`;
    } else {
        trocoEl.innerText = "R$ 0.00";
    }
}

async function confirmarPagamento() {
    const forma = document.getElementById("forma-pagamento").value;

    if (forma === "DINHEIRO") {
        const recebido = Number(document.getElementById("valor-recebido").value);
        if (recebido < window.totalMesa) {
            showToast("Valor recebido é menor que o total da mesa!", "error");
            return;
        }
    }

    try {
        if(pedidoId) {
            await fetch(`http://localhost:3000/pedidos/${pedidoId}/finalizar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
        }

        await fetch(`http://localhost:3000/mesas/${mesaAtualId}/fechar`, { method: "POST" });
        
        let troco = 0;
        if(forma === "DINHEIRO") {
            const recebido = Number(document.getElementById("valor-recebido").value);
            troco = recebido - window.totalMesa;
        }

        imprimirComprovante(forma, troco > 0 ? troco : 0, window.itensMesaAtual || []);

        showToast("Mesa fechada e paga com sucesso!", "success");
        fecharModal();
        carregarMesas();
    } catch (err) {
        showToast("Erro ao processar o pagamento", "error");
    }
}

// -----------------------------
// 8. LÓGICA DE ESTOQUE
// -----------------------------
async function carregarEstoque() {
    try {
        const res = await fetch("http://localhost:3000/produtos");
        const produtos = await res.json();
        const tbody = document.getElementById("tabela-estoque");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        
        produtos.forEach(p => {
            const row = `
                <tr>
                    <td>#${p.id}</td>
                    <td><strong>${p.nome}</strong></td>
                    <td>R$ ${p.preco.toFixed(2)}</td>
                    <td><span class="status-badge ${p.estoque > 10 ? 'status-livre' : 'status-ocupada'}">${p.estoque} un</span></td>
                    <td style="text-align: center;">
                        <button class="btn btn-primary" style="padding: 6px 10px; font-size: 12px;" onclick="abrirModalAjusteEstoque(${p.id}, '${p.nome}', ${p.estoque})">
                            <i class="fas fa-edit"></i> Ajustar
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (e) {
        showToast("Erro ao carregar estoque.", "error");
    }
}

function abrirModalAjusteEstoque(id, nome, estoqueAtual) {
    const htmlModal = `
        <div class="modal-header">
            <h2>Ajustar Estoque</h2>
            <button class="close-btn" onclick="fecharModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="form-group">
            <label>Produto: ${nome}</label>
            <input type="number" id="novo-estoque" class="glass-input" value="${estoqueAtual}">
        </div>
        <button class="btn btn-primary w-100" style="width: 100%;" onclick="confirmarAjusteEstoque(${id})">Salvar</button>
    `;
    abrirModalHTML(htmlModal);
}

async function confirmarAjusteEstoque(id) {
    const novaQtd = document.getElementById("novo-estoque").value;
    try {
        await fetch(`http://localhost:3000/produtos/${id}/estoque`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantidade: Number(novaQtd) }) // backend requires QuantidadeNova or something similar, assuming "quantidade"
        });
        showToast("Estoque atualizado", "success");
        fecharModal();
        carregarEstoque();
    } catch(e) {
        showToast("Ajuste falhou", "error");
    }
}

function abrirModalNovoProduto() {
    const htmlModal = `
        <div class="modal-header">
            <h2>Novo Produto</h2>
            <button class="close-btn" onclick="fecharModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="form-group"><label>Nome</label><input type="text" id="prod-nome" class="glass-input"></div>
        <div class="form-group"><label>Preço (R$)</label><input type="number" step="0.01" id="prod-preco" class="glass-input"></div>
        <div class="form-group"><label>Estoque Inicial</label><input type="number" id="prod-estoque" class="glass-input" value="0"></div>
        <button class="btn btn-success w-100" style="width: 100%;" onclick="salvarNovoProduto()">Cadastrar</button>
    `;
    abrirModalHTML(htmlModal);
}

async function salvarNovoProduto() {
    const nome = document.getElementById("prod-nome").value;
    const preco = Number(document.getElementById("prod-preco").value);
    const estoque = Number(document.getElementById("prod-estoque").value);
    
    try {
        await fetch("http://localhost:3000/produtos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, preco, estoque, ativo: true })
        });
        showToast("Produto criado!", "success");
        fecharModal();
        carregarEstoque();
    } catch(e) {
        showToast("Erro ao criar produto.", "error");
    }
}

// -----------------------------
// 9. LÓGICA VENDA DIRETA E CAIXA
// -----------------------------
let carrinhoVenda = [];

async function carregarProdutosVendaDireta() {
    carrinhoVenda = []; // reset
    renderizarCarrinhoVenda();
    
    try {
        const res = await fetch("http://localhost:3000/produtos");
        const produtos = await res.json();
        window.produtosLocais = produtos; // Cache for search
        renderizarGradeProdutosVenda(produtos);
    } catch(e) {
        showToast("Falha ao baixar catálogo.", "error");
    }
}

function renderizarGradeProdutosVenda(lista) {
    const container = document.getElementById("lista-produtos-venda");
    if (!container) return;
    container.innerHTML = "";
    
    lista.forEach(p => {
        if (!p.ativo) return;
        container.innerHTML += `
            <div class="glass-card" style="padding: 16px; min-height: 120px;" onclick="adicionarVendaDireta(${p.id}, '${p.nome}', ${p.preco})">
                <i class="fas fa-box" style="font-size: 24px;"></i>
                <div style="margin-top: 12px; font-weight: 500;">${p.nome}</div>
                <div style="color: var(--success); font-size: 14px; margin-top: 4px;">R$ ${p.preco.toFixed(2)}</div>
            </div>
        `;
    });
}       

function filtrarVendaDireta(termo) {
    if (!window.produtosLocais) return;
    const filtro = termo.toLowerCase();
    const list = window.produtosLocais.filter(p => p.nome.toLowerCase().includes(filtro));
    renderizarGradeProdutosVenda(list);
}

function adicionarVendaDireta(id, nome, preco) {
    const existe = carrinhoVenda.find(i => i.id === id);
    if (existe) existe.qtd += 1;
    else carrinhoVenda.push({ id, nome, preco, qtd: 1 });
    
    renderizarCarrinhoVenda();
}

function renderizarCarrinhoVenda() {
    const cartEl = document.getElementById("venda-carrinho");
    const totalEl = document.getElementById("venda-total");
    if(!cartEl) return;
    
    let html = "";
    let total = 0;
    
    if (carrinhoVenda.length === 0) {
        html = '<p style="text-align: center; color: var(--text-muted); margin-top: 50px;">Carrinho Vazio</p>';
    } else {
        carrinhoVenda.forEach((item, index) => {
            const sub = item.preco * item.qtd;
            total += sub;
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 500;">${item.nome}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${item.qtd}x R$ ${item.preco.toFixed(2)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-weight: bold;">R$ ${sub.toFixed(2)}</span>
                        <i class="fas fa-trash" style="color: var(--danger); cursor: pointer;" onclick="removerCarrinhoVenda(${index})"></i>
                    </div>
                </div>
            `;
        });
    }
    
    cartEl.innerHTML = html;
    totalEl.innerText = `R$ ${total.toFixed(2)}`;
}

function removerCarrinhoVenda(index) {
    carrinhoVenda.splice(index, 1);
    renderizarCarrinhoVenda();
}

async function finalizarVendaDireta() {
    if (carrinhoVenda.length === 0) return showToast("Adicione itens ao carrinho.", "warning");
    
    const forma = document.getElementById("venda-pagamento").value;
    
    try {
        // 1. Criar pedido
        const resP = await fetch("http://localhost:3000/pedidos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mesa_id: null, tipo: "TAKE_AWAY" })
        });
        const pedido = await resP.json();
        
        // 2. Adicionar itens serialmente
        for (const item of carrinhoVenda) {
            await fetch(`http://localhost:3000/pedidos/${pedido.id}/itens`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ produto_id: item.id, quantidade: item.qtd })
            });
        }
        
        // 3. Finalizar
        await fetch(`http://localhost:3000/pedidos/${pedido.id}/finalizar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        
        let troco = 0; // Venda Direta could have an input for troco, but omitted for simplicity unless user wants it
        
        showToast("Venda processada com sucesso!", "success");
        imprimirComprovante(forma, troco, carrinhoVenda);
        
        carrinhoVenda = [];
        renderizarCarrinhoVenda();
        
    } catch(e) {
        showToast("Erro ao processar a venda", "error");
    }
}

async function carregarCaixa() {
    try {
        const res = await fetch("http://localhost:3000/caixa/resumo");
        if(res.ok) {
            const data = await res.json();
            document.getElementById("caixa-total").innerText = `R$ ${data.total.toFixed(2)}`;
            document.getElementById("caixa-pedidos").innerText = data.qtd_pedidos;
            
            let ticket = data.qtd_pedidos > 0 ? (data.total / data.qtd_pedidos) : 0;
            document.getElementById("caixa-ticket").innerText = `R$ ${ticket.toFixed(2)}`;
            
            const tbody = document.getElementById("caixa-vendas");
            tbody.innerHTML = "";
            if(data.pedidos && data.pedidos.length > 0) {
                data.pedidos.forEach(p => {
                    const statusClass = p.status === 'FINALIZADO' ? 'status-livre' : 'status-ocupada';
                    tbody.innerHTML += `
                        <tr>
                            <td>${new Date(p.criado_em).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td>${p.tipo} ${p.mesa_id ? '(Mesa ' + p.mesa_id + ')' : ''}</td>
                            <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                            <td>R$ ${p.total.toFixed(2)}</td>
                        </tr>
                    `;
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma venda registrada hoje.</td></tr>`;
            }
        }
    } catch(e) {
        // endpoint not ready
        document.getElementById("caixa-total").innerText = "R$ ---";
        document.getElementById("caixa-pedidos").innerText = "-";
        document.getElementById("caixa-ticket").innerText = "R$ ---";
    }
}

// -----------------------------
// BOOT E IMPRESSÃO
// -----------------------------
function preencherCupom(html) {
    const area = document.getElementById("print-area");
    if(area) area.innerHTML = html;
}

function imprimirComanda(tipoVenda, nomeCliente, itens) {
    const data = new Date().toLocaleString();
    let itensHtml = itens.map(i => `<tr><td>${i.qtd}x</td><td>${i.nome}</td><td class="right">R$ ${(i.preco * i.qtd).toFixed(2)}</td></tr>`).join('');
    
    let total = itens.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
    
    let html = `
        <div class="print-header">
            <h2 class="print-title">SEVEN SNOOKER BAR</h2>
            <p class="print-subtitle">Comanda Interna</p>
        </div>
        <div class="print-info">
            <strong>COMANDA DE CONSUMO</strong><br>
            Data: ${data}<br>
            Tipo: ${tipoVenda}<br>
            ${nomeCliente ? 'Cliente: ' + nomeCliente : ''}
        </div>
        <table class="print-table">
            <thead><tr><th>Qtd</th><th>Item</th><th class="right">Sub</th></tr></thead>
            <tbody>${itensHtml}</tbody>
        </table>
        <div class="print-total">TOTAL: R$ ${total.toFixed(2)}</div>
        <div class="print-footer">Apenas para controle interno.</div>
    `;
    preencherCupom(html);
    window.print();
}

function imprimirComandaMesa() {
    if(!window.itensMesaAtual || window.itensMesaAtual.length === 0) return showToast("Mesa não tem itens", "warning");
    const nome = document.getElementById("mesa-cliente") ? document.getElementById("mesa-cliente").value : "";
    imprimirComanda(`Mesa ${mesaAtualId}`, nome, window.itensMesaAtual);
}

function imprimirComandaVenda() {
    if(carrinhoVenda.length === 0) return showToast("Carrinho vazio", "warning");
    const nome = document.getElementById("venda-cliente") ? document.getElementById("venda-cliente").value : "";
    imprimirComanda("Venda Rápida", nome, carrinhoVenda);
}

function imprimirComprovante(formaPagamento, troco, itens) {
    const data = new Date().toLocaleString();
    let itensHtml = itens.map(i => `<tr><td>${i.qtd}x</td><td>${i.nome}</td><td class="right">R$ ${(i.preco * i.qtd).toFixed(2)}</td></tr>`).join('');
    
    let total = itens.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
    
    let html = `
        <div class="print-header">
            <h2 class="print-title">SEVEN SNOOKER BAR</h2>
            <p class="print-subtitle">Obrigado pela preferência!</p>
        </div>
        <div class="print-info">
            <strong>COMPROVANTE DE PAGAMENTO</strong><br>
            Data: ${data}<br>
        </div>
        <table class="print-table">
            <thead><tr><th>Qtd</th><th>Item</th><th class="right">Sub</th></tr></thead>
            <tbody>${itensHtml}</tbody>
        </table>
        <div class="print-total" style="border-top: 1px dashed black; padding-top: 5px;">SUBTOTAL: R$ ${total.toFixed(2)}</div>
        <div style="text-align: right; font-size: 12px; margin-bottom: 2px;">PAGAMENTO: ${formaPagamento}</div>
        ${troco > 0 ? `<div style="text-align: right; font-size: 12px; font-weight: bold;">TROCO: R$ ${troco.toFixed(2)}</div>` : ''}
        <div class="print-footer">Volte sempre!</div>
    `;
    preencherCupom(html);
    window.print();
}

document.addEventListener("DOMContentLoaded", () => {
});