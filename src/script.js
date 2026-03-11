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

    switch(pageName) {

        
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