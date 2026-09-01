/* ============================================================
   carrinho.js - Lógica específica da página do Carrinho
   ============================================================ */

// ============================================================
// VARIÁVEIS
// ============================================================
let cupomAplicado = false;
let valorDesconto = 0;

const cuponsValidos = {
    'RAIZ10': { desconto: 10, tipo: 'porcentagem' },
    'FLORAL20': { desconto: 20, tipo: 'porcentagem' },
    'MEL15': { desconto: 15, tipo: 'porcentagem' },
    'NATURAL5': { desconto: 5, tipo: 'porcentagem' }
};

// ============================================================
// RENDERIZAR CARRINHO
// ============================================================
function renderizarCarrinho() {
    const container = document.getElementById('listaItens');
    const btnFinalizar = document.getElementById('btnFinalizar');

    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-vazio">
                <span class="icone">🛒</span>
                <h3>Seu carrinho está vazio</h3>
                <p>Que tal explorar nossos produtos e encontrar algo especial para você?</p>
                <a href="produtos.html" class="botao-primario">Explorar produtos</a>
            </div>
        `;
        if (btnFinalizar) btnFinalizar.disabled = true;
        atualizarResumo();
        return;
    }

    if (btnFinalizar) btnFinalizar.disabled = false;

    let html = `
        <div class="cabecalho-lista">
            <span>Produto</span>
            <span style="text-align:center;">Quantidade</span>
            <span style="text-align:right;">Subtotal</span>
            <span style="text-align:center;">Remover</span>
        </div>
    `;

    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        html += `
            <div class="item-carrinho" data-index="${index}">
                <div class="produto-info">
                    <div class="imagem">
                        <img src="${item.imagem}" alt="${item.nome}" loading="lazy">
                    </div>
                    <div class="detalhes">
                        <h4>${item.nome}</h4>
                        <span class="preco-unitario">R$ ${item.preco.toFixed(2)} cada</span>
                    </div>
                </div>
                <div class="quantidade">
                    <button class="btn-diminuir" data-index="${index}">−</button>
                    <span>${item.quantidade}</span>
                    <button class="btn-aumentar" data-index="${index}">+</button>
                </div>
                <div class="subtotal">R$ ${subtotal.toFixed(2)}</div>
                <button class="botao-remover" data-index="${index}" title="Remover item">✕</button>
            </div>
        `;
    });

    container.innerHTML = html;

    // Eventos
    container.querySelectorAll('.btn-diminuir').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            diminuirQuantidade(index);
        });
    });

    container.querySelectorAll('.btn-aumentar').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            aumentarQuantidade(index);
        });
    });

    container.querySelectorAll('.botao-remover').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removerItem(index);
        });
    });

    atualizarResumo();
}

// ============================================================
// FUNÇÕES DE MANIPULAÇÃO
// ============================================================
function diminuirQuantidade(index) {
    if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade--;
    } else {
        carrinho.splice(index, 1);
        mostrarToast('🗑️', 'Item removido!', 'O produto foi removido do seu carrinho.');
    }
    salvarCarrinho();
    renderizarCarrinho();
    resetarCupom();
}

function aumentarQuantidade(index) {
    carrinho[index].quantidade++;
    salvarCarrinho();
    renderizarCarrinho();
    resetarCupom();
}

function removerItem(index) {
    const nome = carrinho[index].nome;
    carrinho.splice(index, 1);
    salvarCarrinho();
    renderizarCarrinho();
    resetarCupom();
    mostrarToast('🗑️', 'Item removido!', `${nome} foi removido do seu carrinho.`);
}

// ============================================================
// ATUALIZAR RESUMO
// ============================================================
function atualizarResumo() {
    const subtotal = carrinho.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
    const frete = subtotal > 0 ? (subtotal >= 150 ? 0 : 15.90) : 0;
    let total = subtotal + frete;
    let desconto = 0;

    if (cupomAplicado && valorDesconto > 0) {
        if (typeof valorDesconto === 'number' && valorDesconto < 1) {
            desconto = subtotal * valorDesconto;
        } else {
            desconto = Math.min(valorDesconto, subtotal);
        }
        total = total - desconto;
    }

    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('frete').textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2)}`;
    document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;

    const linhaDesconto = document.getElementById('linhaDesconto');
    const descontoValor = document.getElementById('descontoValor');

    if (cupomAplicado && desconto > 0) {
        linhaDesconto.style.display = 'flex';
        descontoValor.textContent = `- R$ ${desconto.toFixed(2)}`;
    } else {
        linhaDesconto.style.display = 'none';
    }
}

// ============================================================
// CUPOM
// ============================================================
function resetarCupom() {
    cupomAplicado = false;
    valorDesconto = 0;
    const input = document.getElementById('cupomInput');
    if (input) input.value = '';
    const mensagem = document.getElementById('mensagemCupom');
    if (mensagem) {
        mensagem.className = 'mensagem-cupom';
        mensagem.textContent = '';
    }
    atualizarResumo();
}

function aplicarCupom() {
    const input = document.getElementById('cupomInput');
    const codigo = input.value.trim().toUpperCase();
    const mensagem = document.getElementById('mensagemCupom');

    if (!codigo) {
        mensagem.className = 'mensagem-cupom erro';
        mensagem.textContent = '❌ Digite um código de cupom.';
        return;
    }

    if (cupomAplicado) {
        mensagem.className = 'mensagem-cupom erro';
        mensagem.textContent = '❌ Já existe um cupom aplicado.';
        return;
    }

    if (cuponsValidos[codigo]) {
        const cupom = cuponsValidos[codigo];
        cupomAplicado = true;
        valorDesconto = cupom.desconto / 100;

        mensagem.className = 'mensagem-cupom sucesso';
        mensagem.textContent = `✅ Cupom "${codigo}" aplicado! ${cupom.desconto}% de desconto.`;
        atualizarResumo();

        input.disabled = true;
        document.getElementById('btnAplicarCupom').disabled = true;
    } else {
        mensagem.className = 'mensagem-cupom erro';
        mensagem.textContent = '❌ Código inválido. Tente novamente.';
        setTimeout(() => {
            mensagem.className = 'mensagem-cupom';
            mensagem.textContent = '';
        }, 3000);
    }
}

// ============================================================
// FINALIZAR COMPRA
// ============================================================
function finalizarCompra() {
    if (carrinho.length === 0) return;

    const total = document.getElementById('total').textContent;

    if (confirm(`🌸 Finalizar compra?\n\nTotal: ${total}\n\nDeseja confirmar seu pedido?`)) {
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();
        resetarCupom();

        mostrarToast(
            '🎉',
            'Pedido finalizado!',
            `Seu pedido no valor de ${total} foi confirmado. Em breve você receberá um e-mail.`
        );

        const input = document.getElementById('cupomInput');
        if (input) input.disabled = false;
        const btn = document.getElementById('btnAplicarCupom');
        if (btn) btn.disabled = false;
    }
}

// ============================================================
// TOAST
// ============================================================
function mostrarToast(icone, titulo, mensagem) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.querySelector('.icone').textContent = icone;
    toast.querySelector('.conteudo h4').textContent = titulo;
    toast.querySelector('.conteudo p').textContent = mensagem;

    toast.classList.add('mostrar');
    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 4000);
}

// ============================================================
// INICIALIZAR PÁGINA DO CARRINHO
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    carregarCarrinho();
    renderizarCarrinho();
    initMenuMobile();

    const btnCupom = document.getElementById('btnAplicarCupom');
    if (btnCupom) {
        btnCupom.addEventListener('click', aplicarCupom);
    }

    const inputCupom = document.getElementById('cupomInput');
    if (inputCupom) {
        inputCupom.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                aplicarCupom();
            }
        });
    }

    const btnFinalizar = document.getElementById('btnFinalizar');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', finalizarCompra);
    }
});

// Sincronizar em outras abas
window.addEventListener('storage', function(e) {
    if (e.key === 'carrinhoRaizFloral') {
        carregarCarrinho();
        renderizarCarrinho();
    }
});
