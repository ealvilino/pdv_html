// -----------------------------
// 1. CONFIGURAÇÕES E ESTADO GLOBAL
// -----------------------------
const mainContainer = document.querySelector('.container');
const navCenter = document.querySelector('#nav-title');

// Salva o HTML original do menu inicial
const originalMenu = mainContainer.innerHTML;


// -----------------------------
// 2. FUNÇÃO PARA CARREGAR HTML EXTERNO
// -----------------------------
async function loadPage(page) {

    try {

        const response = await fetch(`pages/${page}.html`);

        if (!response.ok) {
            throw new Error("Página não encontrada");
        }

        const html = await response.text();

        mainContainer.innerHTML = html;

    } catch (error) {

        mainContainer.innerHTML = `
            <div style="padding:20px">
                <h2>Erro ao carregar página</h2>
                <p>${error.message}</p>
                <button onclick="handleAction('Menu Principal')">
                    Menu Principal 
                </button>
            </div>
        `;
    }

}


// -----------------------------
// 3. LÓGICA DE NAVEGAÇÃO (ROTEADOR)
// -----------------------------
function handleAction(pageName) {

    navCenter.innerText = pageName;

    switch (pageName) {


        case 'estoque':
            loadPage('estoque');
            break;

        case 'Venda Direta':
            loadPage('venda-direta');
            break;

        case 'Abrir Mesa':
            loadPage('abrir-mesa');
            break;

        case 'Fechar Mesa':
            loadPage('fechar-mesa');
            break;

        case 'Relatórios':
            loadPage('relatorios');
            break;

        case 'Configurações':
            loadPage('configuracoes');
            break;

        case 'Menu Principal':
            mainContainer.innerHTML = originalMenu;

            navCenter.innerText = 'Menu Principal';
            break;

        default:

            mainContainer.innerHTML = `
                <div style="padding:20px">
                    <h1>Página ${pageName} em construção</h1>
                </div>
            `;
    }

}


// -----------------------------
// 4. FUNÇÕES DO SISTEMA (ANTIGAS)
// -----------------------------
// Coloque aqui todas as funções do seu PDV

function suaFuncaoAntiga() {

    console.log("Função antiga funcionando");

}


// -----------------------------
// 5. EVENTOS GERAIS DO SISTEMA
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {

    console.log("Sistema PDV iniciado");

});

async function carregarMesas() {

    const res = await fetch("http://localhost:3000/mesas");
    const mesas = await res.json();

    const container = document.getElementById("lista-mesas");

    container.innerHTML = "";

    mesas.forEach(mesa => {

        container.innerHTML += `
            <div class="mesa-card">
                <h3>Mesa ${mesa.numero}</h3>
                <p>Status: ${mesa.status}</p>

                <button onclick="abrirMesa(${mesa.id})">
                    Abrir
                </button>

                <button onclick="fecharMesa(${mesa.id})">
                    Fechar
                </button>
            </div>
        `;
    });
}


async function fecharMesaSemPedido(id) {

    const res = await fetch(`http://localhost:3000/mesas/${id}/fechar`, {
        method: "POST"
    });

    const text = await res.text();
    if (!res.ok) {

        alert(`Erro: ${text}`);
        return;
    }

    alert(text);

    carregarMesas();
}

async function criarMesa() {

    await fetch("http://localhost:3000/mesas", {
        method: "POST"
    });

    alert("Mesa criada!");
    carregarMesas();
}

async function loadPage(page) {

    try {

        const response = await fetch(`pages/${page}.html`);
        const html = await response.text();

        mainContainer.innerHTML = html;

        // 👉 AQUI é o segredo
        if (page === "abrir-mesa") {
            carregarMesas();
        }

    } catch (error) {
        mainContainer.innerHTML = `<h2>Erro</h2>`;
    }
}

async function abrirMesa(id) {

    await fetch(`http://localhost:3000/mesas/${id}/abrir`, {
        method: "POST"
    });

    alert("Mesa aberta!");

    carregarMesas();
}

async function carregarMesas() {

    const res = await fetch("http://localhost:3000/mesas");
    const mesas = await res.json();

    const container = document.getElementById("lista-mesas");
    container.innerHTML = "";

    mesas.forEach(mesa => {

        container.innerHTML += `
    <div class="mesa-card">
        <h3>Mesa ${mesa.numero}</h3>
        <p>Status: ${mesa.status}</p>

        <button onclick="abrirMesa(${mesa.id})">Abrir</button>
        <button onclick="fecharMesaSemPedido(${mesa.id})">Fechar</button>
        <button onclick="abrirModalMesa(${mesa.id})">Entrar</button>
    </div>
`;
    });
}



async function carregarDetalhesMesa(id) {

    const res = await fetch(`http://localhost:3000/mesas/${id}`);
    const mesa = await res.json();

    const container = document.getElementById("detalhes-mesa");

    let html = `<h3>Total: R$ ${mesa.total}</h3>`;

    mesa.itens.forEach(item => {
        html += `
            <div>
                ${item.nome_produto} - 
                ${item.quantidade}x 
                R$ ${item.preco_unitario}
            </div>
        `;
    });

    container.innerHTML = html;
}

let mesaAtualId = null;
let pedidoId = null;


function fecharModal() {
    document.getElementById("modal-mesa")?.remove();
}



function atualizarModal() {
    carregarDetalhesMesaModal();
}

async function abrirModalMesa(id) {

    document.getElementById("modal-mesa")?.remove();

    mesaAtualId = id;

    const response = await fetch("pages/mesa.html");
    const html = await response.text();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    document.body.appendChild(wrapper);

    const modal = document.getElementById("modal-mesa");

    const btnAdicionar = modal.querySelector("#btn-adicionar");
    const btnFechar = modal.querySelector("#btn-fechar");
    const btnAtualizar = modal.querySelector("#btn-atualizar");

    btnAdicionar.addEventListener("click", adicionarItemModal);
    btnFechar.addEventListener("click", fecharModal);
    btnAtualizar.addEventListener("click", carregarDetalhesMesaModal);

    document.getElementById("modal-titulo").innerText = `Mesa ${id}`;

    carregarProdutos();
    await carregarDetalhesMesaModal();
    
}

function fecharModal() {

    const modal = document.getElementById("modal-mesa");

    if (modal) {
        modal.remove();
    }
}
async function carregarDetalhesMesaModal() {

    const res = await fetch(`http://localhost:3000/mesas/${mesaAtualId}`);
    const mesa = await res.json();


    pedidoId = mesa.pedido_id;

    const container = document.getElementById("modal-detalhes");

    let html = `
    <h3 id="modal-total" data-total="${mesa.total}">
        Total: R$ ${mesa.total.toFixed(2)}
    </h3>
`;

    mesa.itens.forEach(item => {
        html += `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>
                    ${item.nome_produto} - 
                    ${item.quantidade}x 
                    R$ ${item.preco_unitario}
                </span>

                <button class="btn-remover" data-id="${item.item_id}">
                    ❌
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
    setupPagamento();

    document.querySelectorAll(".btn-remover").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const itemId = e.currentTarget.dataset.id;
            abrirModalConfirmacao(itemId);
        });
    });
}

async function carregarProdutos() {

    const res = await fetch("http://localhost:3000/produtos");
    const produtos = await res.json();

    const select = document.getElementById("select-produto");

    select.innerHTML = "";

    produtos.forEach(produto => {

        if (!produto.ativo) return;

        select.innerHTML += `
            <option value="${produto.id}">
                ${produto.nome} - R$ ${produto.preco}
            </option>
        `;
    });
}

async function adicionarItemModal() {


    const produto_id = document.getElementById("select-produto").value;
    const quantidade = document.getElementById("quantidade").value;

    const resMesa = await fetch(`http://localhost:3000/mesas/${mesaAtualId}`);
    const mesa = await resMesa.json();

    pedidoId = mesa.pedido_id;


    if (!pedidoId) {

        const resPedido = await fetch("http://localhost:3000/pedidos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mesa_id: mesaAtualId,
                tipo: "CONSUMO_LOCAL"
            })
        });

        const data = await resPedido.json();
        pedidoId = data.id;
    }

    await fetch(`http://localhost:3000/pedidos/${pedidoId}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            produto_id: Number(produto_id),
            quantidade: Number(quantidade)
        })
    });

    carregarDetalhesMesaModal();
}

function abrirModalConfirmacao(itemId) {

    const modal = document.createElement("div");

    modal.innerHTML = `
        <div class="modal">
            <div class="modal-content">

                <h3>Remover item?</h3>
                <p>Tem certeza que deseja remover este item?</p>

                <button id="confirmar-remocao">Sim</button>
                <button id="cancelar-remocao">Cancelar</button>

            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#confirmar-remocao")
        .addEventListener("click", async () => {

            await removerItem(itemId);

            modal.remove();
            carregarDetalhesMesaModal();
        });

    modal.querySelector("#cancelar-remocao")
        .addEventListener("click", () => {
            modal.remove();
        });
}

async function removerItem(itemId) {

    const res = await fetch(`http://localhost:3000/itens/${itemId}`, {
        method: "DELETE"
    });

    if (!res.ok) {
        const erro = await res.text();
        alert(erro);
        return;
    }

    carregarDetalhesMesaModal();
}


async function confirmarPagamento() {

    const forma = document.getElementById("forma-pagamento").value;

    if (forma === "DINHEIRO") {
        const recebido = parseFloat(document.getElementById("valor-recebido").value || 0);

        if (recebido < window.totalMesa) {
            alert("Valor insuficiente!");
            return;
        }
    }

    await fetch(`http://localhost:3000/pedidos/${pedidoId}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forma_pagamento: forma })
    });

    await fetch(`http://localhost:3000/mesas/${mesaAtualId}/fechar`, {
        method: "POST"
    });

    alert("✅ Mesa fechada com sucesso!");

    fecharModalPagamento();
    carregarMesas();
}

async function fecharMesa() {
    
    const formaPagamento = document.getElementById("forma-pagamento").value;

  
    if (formaPagamento === "DINHEIRO") {

        const recebido = Number(document.getElementById("valor-recebido").value);
        const total = Number(document.getElementById("modal-total").dataset.total);

        if (recebido < total) {
            alert("Valor recebido é menor que o total!");
            return;
        }
    }

    try {

        await fetch(`http://localhost:3000/pedidos/${pedidoId}/finalizar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                forma_pagamento: formaPagamento
            })
        });

        await fetch(`http://localhost:3000/mesas/${mesaAtualId}/fechar`, {
            method: "POST"
        });

        alert("Mesa fechada com sucesso!");

        fecharModal();
        carregarMesas();

    } catch (err) {
        alert("Erro ao fechar mesa");
        console.error(err);
    }
}
function setupPagamento() {

    const select = document.getElementById("forma-pagamento");
    const input = document.getElementById("valor-recebido");

    if (!select || !input) return;

    
    select.onchange = null;
    input.oninput = null;

    select.addEventListener("change", function () {
        const tipo = this.value;
        const trocoContainer = document.getElementById("troco-container");

        trocoContainer.style.display =
            tipo === "DINHEIRO" ? "block" : "none";
    });

    input.addEventListener("input", function () {

        const totalEl = document.getElementById("modal-total");
        if (!totalEl) return;

        const total = Number(totalEl.dataset.total);
        const valorRecebido = Number(this.value);
        const troco = valorRecebido - total;

        document.getElementById("troco").innerText =
            troco >= 0
                ? `R$ ${troco.toFixed(2)}`
                : " ";
    });
}