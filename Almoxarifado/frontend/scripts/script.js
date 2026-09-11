const formulario = document.getElementById("form-material");

formulario.addEventListener("submit", async function(event) {

    event.preventDefault();

const material = {

    codigo_barras:
        document.getElementById("codigo-barras")
            .value
            .trim(),

    descricao:
        document.getElementById("descricao")
            .value
            .trim(),

    unidade:
        document.getElementById("unidade")
            .value
            .trim(),

    estoque: 0,

    estoque_minimo:
        Number(
            document.getElementById(
                "estoque-minimo"
            ).value
        )

};

if (material.codigo_barras === "") {
    alert("Informe o código de barras.");
    return;
}
if (material.descricao === "") {
    alert("Informe a descrição do material.");
    return;
}
if (material.unidade === "") {
    alert("Informe a unidade do material.");
    return;
}
if (
    !Number.isInteger(material.estoque_minimo) ||
    material.estoque_minimo < 0
) {
    alert("Informe um estoque mínimo válido.");
    return;
}

    try {

        const resposta = await fetch("/materiais", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(material)
        });

        const dados = await resposta.json();

        if (resposta.ok) {

            alert("Material cadastrado com sucesso!");

            formulario.reset();

        } else {

            alert(dados.erro);

        }

    } catch (erro) {

        console.error("Erro:", erro);

        alert("Não foi possível conectar ao servidor.");

    }

});


// ==================================================
// RETIRADA DE MATERIAL
// ==================================================

const btnBuscarMaterial =
    document.getElementById("btn-buscar-material");

let materialAtual = null;

let itensRetirada = [];


btnBuscarMaterial.addEventListener("click", async function() {

    const codigoBarras =
        document.getElementById("codigo-retirada").value.trim();

    if (codigoBarras === "") {

        alert("Informe o código de barras.");

        return;

    }

    try {

        const resposta =
            await fetch(`/materiais/${codigoBarras}`);

        const dados =
            await resposta.json();

        if (resposta.ok) {

            materialAtual = dados;

            document.getElementById("descricao-retirada").textContent =
                dados.descricao;

            document.getElementById("estoque-retirada").textContent =
                dados.estoque;

            document.getElementById(
                "quantidade-retirada"
            ).focus();

        } else {

            materialAtual = null;

            document.getElementById("descricao-retirada").textContent =
                "---";

            document.getElementById("estoque-retirada").textContent =
                "---";

            alert(dados.erro);

        }

    } catch (erro) {

        console.error("Erro:", erro);

        alert("Não foi possível buscar o material.");

    }

});
const campoCodigoRetirada =
    document.getElementById("codigo-retirada");

campoCodigoRetirada.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            btnBuscarMaterial.click();

        }

    }
);

const btnAdicionarItem =
    document.getElementById("btn-adicionar-item");


btnAdicionarItem.addEventListener("click", function() {

    if (materialAtual === null) {

        alert("Primeiro busque um material.");

        return;

    }

    const quantidade =
        Number(
            document.getElementById(
                "quantidade-retirada"
            ).value
        );


    if (!Number.isInteger(quantidade) || quantidade <= 0) {

        alert("Informe uma quantidade válida.");

        return;

    }


    if (quantidade > materialAtual.estoque) {

        alert(
            "Quantidade maior que o estoque disponível."
        );

        return;

    }


    const itemExistente =
        itensRetirada.find(function(item) {

            return item.material_id === materialAtual.id;

        });


    if (itemExistente) {

        const novaQuantidade =
            itemExistente.quantidade + quantidade;


        if (novaQuantidade > materialAtual.estoque) {

            alert(
                "Quantidade total maior que o estoque disponível."
            );

            return;

        }


        itemExistente.quantidade =
            novaQuantidade;

    } else {

        const item = {

            material_id:
                materialAtual.id,

            descricao:
                materialAtual.descricao,

            quantidade:
                quantidade,

            estoque:
                materialAtual.estoque

        };


        itensRetirada.push(item);

    }


    atualizarTabelaRetirada();

});


function atualizarTabelaRetirada() {

    const lista =
        document.getElementById("lista-retirada");


    lista.innerHTML = "";


    itensRetirada.forEach(
        function(item, indice) {

            const linha =
                document.createElement("tr");


            linha.innerHTML = `
                <td>${item.descricao}</td>

                <td>${item.quantidade}</td>

                <td>
                    <button onclick="removerItem(${indice})">
                        Remover
                    </button>
                </td>
            `;


            lista.appendChild(linha);

        }
    );

}


function removerItem(indice) {

    itensRetirada.splice(indice, 1);

    atualizarTabelaRetirada();

}


// ==================================================
// FINALIZAR RETIRADA
// ==================================================

const btnFinalizarRetirada =
    document.getElementById(
        "btn-finalizar-retirada"
    );


btnFinalizarRetirada.addEventListener(
    "click",
    async function() {

        const nomeRetirante =
            document
                .getElementById("nome-retirante")
                .value
                .trim();


        const nomeResponsavel =
            document
                .getElementById("nome-responsavel")
                .value
                .trim();


        if (nomeRetirante === "") {

            alert(
                "Informe o nome do colaborador que está retirando."
            );

            return;

        }


        if (nomeResponsavel === "") {

            alert(
                "Informe o responsável pelo almoxarifado."
            );

            return;

        }


        if (itensRetirada.length === 0) {

            alert(
                "Adicione pelo menos um material à retirada."
            );

            return;

        }


        const requisicao = {

            nome_retirante:
                nomeRetirante,

            nome_responsavel:
                nomeResponsavel,

            itens:
                itensRetirada.map(
                    function(item) {

                        return {

                            material_id:
                                item.material_id,

                            quantidade:
                                item.quantidade

                        };

                    }
                )

        };


        try {

            const resposta =
                await fetch(
                    "/requisicoes",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(requisicao)
                    }
                );


            const dados =
                await resposta.json();


            if (resposta.ok) {

                const numeroFormatado =
                    String(
                        dados.numero_requisicao
                    ).padStart(
                        4,
                        "0"
                    );


                alert(
                    `Retirada realizada com sucesso!\nRequisição nº ${numeroFormatado}`
                );
                


                window.open(
                    `/impressao.html?id=${dados.requisicao_id}`,
                    "_blank"
                );


                itensRetirada = [];

                atualizarTabelaRetirada();


                document.getElementById(
                    "nome-retirante"
                ).value = "";


                document.getElementById(
                    "codigo-retirada"
                ).value = "";


                document.getElementById(
                    "quantidade-retirada"
                ).value = 1;


                document.getElementById(
                    "descricao-retirada"
                ).textContent = "---";


                document.getElementById(
                    "estoque-retirada"
                ).textContent = "---";


                materialAtual = null;
                carregarEstoque();
                carregarHistorico();

            } else {

                alert(dados.erro);

            }

        } catch (erro) {

            console.error(
                "Erro ao finalizar retirada:",
                erro
            );


            alert(
                "Não foi possível finalizar a retirada."
            );

        }

    }
);


// ==================================================
// ENTRADA DE ESTOQUE
// ==================================================

let materialEntradaAtual = null;


const btnBuscarEntrada =
    document.getElementById(
        "btn-buscar-entrada"
    );
const campoCodigoEntrada =
    document.getElementById("codigo-entrada");

campoCodigoEntrada.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            btnBuscarEntrada.click();

        }

    }
);

btnBuscarEntrada.addEventListener(
    "click",
    async function() {

        const codigoBarras =
            document
                .getElementById("codigo-entrada")
                .value
                .trim();


        if (codigoBarras === "") {

            alert(
                "Informe o código de barras."
            );

            return;

        }


        try {

            const resposta =
                await fetch(
                    `/materiais/${codigoBarras}`
                );


            const dados =
                await resposta.json();


            if (resposta.ok) {

                materialEntradaAtual =
                    dados;


                document.getElementById(
                    "descricao-entrada"
                ).textContent =
                    dados.descricao;


                document.getElementById(
                    "estoque-atual-entrada"
                ).textContent =
                    dados.estoque;
                    document.getElementById(
                        "quantidade-entrada"
                    ).focus();

            } else {

                materialEntradaAtual =
                    null;


                document.getElementById(
                    "descricao-entrada"
                ).textContent =
                    "---";


                document.getElementById(
                    "estoque-atual-entrada"
                ).textContent =
                    "---";


                alert(dados.erro);

            }

        } catch (erro) {

            console.error(
                "Erro ao buscar material:",
                erro
            );


            alert(
                "Não foi possível buscar o material."
            );

        }

    }
);


// ==================================================
// CONFIRMAR ENTRADA DE ESTOQUE
// ==================================================

const btnConfirmarEntrada =
    document.getElementById(
        "btn-confirmar-entrada"
    );


btnConfirmarEntrada.addEventListener(
    "click",
    async function() {

        if (materialEntradaAtual === null) {

            alert(
                "Primeiro busque um material."
            );

            return;

        }


        const quantidade =
            Number(
                document.getElementById(
                    "quantidade-entrada"
                ).value
            );


        const responsavel =
            document
                .getElementById(
                    "responsavel-entrada"
                )
                .value
                .trim();


        if (
            !Number.isInteger(quantidade) ||
            quantidade <= 0
        ) {

            alert(
                "Informe uma quantidade válida."
            );

            return;

        }


        if (responsavel === "") {

            alert(
                "Informe o responsável pela entrada."
            );

            return;

        }


        try {

            const resposta =
                await fetch(
                    `/materiais/${materialEntradaAtual.id}/entrada`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                quantidade:
                                    quantidade,

                                responsavel:
                                    responsavel
                            })
                    }
                );


            const dados =
                await resposta.json();


            if (resposta.ok) {

                materialEntradaAtual =
                    dados.material;


                document.getElementById(
                    "estoque-atual-entrada"
                ).textContent =
                    dados.material.estoque;


                document.getElementById(
                    "quantidade-entrada"
                ).value = 1;
                carregarEstoque();
                carregarHistorico();

                alert(
                    `Entrada realizada com sucesso!\nNovo estoque: ${dados.material.estoque}`
                );

            } else {

                alert(dados.erro);

            }

        } catch (erro) {

            console.error(
                "Erro ao adicionar estoque:",
                erro
            );


            alert(
                "Não foi possível realizar a entrada."
            );

        }

    }
);

// ==================================================
// CONSULTA DE ESTOQUE
// ==================================================

let materiaisEstoque = [];

const btnAtualizarEstoque =
    document.getElementById("btn-atualizar-estoque");

const campoBuscaEstoque =
    document.getElementById("busca-estoque");


// Busca todos os materiais no servidor
async function carregarEstoque() {

    try {

        const resposta = await fetch("/materiais");

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert("Não foi possível carregar o estoque.");
            return;
        }

        materiaisEstoque = dados;

        mostrarEstoque(materiaisEstoque);

    } catch (erro) {

        console.error(
            "Erro ao carregar estoque:",
            erro
        );

        alert(
            "Não foi possível carregar o estoque."
        );

    }

}

// Mostra os materiais na tabela
function mostrarEstoque(materiais) {

    const lista =
        document.getElementById("lista-estoque");

    lista.innerHTML = "";
    let totalMateriais = materiaisEstoque.length;
    let totalEstoqueBaixo = 0;
    let totalSemEstoque = 0;

    materiaisEstoque.forEach(function(material) {

        if (material.estoque === 0) {

            totalSemEstoque++;

        } else if (
            material.estoque <= material.estoque_minimo
        ) {

            totalEstoqueBaixo++;

        }

    });

    document.getElementById(
        "total-materiais"
    ).textContent = totalMateriais;

    document.getElementById(
        "total-estoque-baixo"
    ).textContent = totalEstoqueBaixo;

    document.getElementById(
        "total-sem-estoque"
    ).textContent = totalSemEstoque;

    materiais.forEach(function(material) {
        const linha =
            document.createElement("tr");

        let situacao = `
            <span class="status-estoque status-normal">
                Normal
            </span>
        `;

        let classeSituacao = "estoque-normal";


        // SEM ESTOQUE
        if (material.estoque === 0) {

            situacao = `
                <span class="status-estoque status-sem-estoque">
                    Sem estoque
                </span>
            `;

            classeSituacao = "sem-estoque";


        // ESTOQUE BAIXO
        } else if (material.estoque <= material.estoque_minimo) {

            situacao = `
                <span class="status-estoque status-baixo">
                    ⚠ Estoque baixo
                </span>
            `;

            classeSituacao = "estoque-baixo";

        }
        linha.innerHTML = `
            <td>${material.codigo_barras}</td>
            <td>${material.descricao}</td>
            <td>${material.unidade}</td>
            <td>${material.estoque}</td>
            <td>${material.estoque_minimo}</td>
            <td>${situacao}</td>
        `;
        linha.classList.add(classeSituacao);
        lista.appendChild(linha);
    });
}
// Botão Atualizar Estoque
btnAtualizarEstoque.addEventListener(
    "click",
    function() {
        carregarEstoque();
    }
);
// Campo de pesquisa
campoBuscaEstoque.addEventListener(
    "input",
    function() {
        const busca =
            campoBuscaEstoque.value
                .trim()
                .toLowerCase();
        const materiaisFiltrados =
            materiaisEstoque.filter(
                function(material) {
                    const codigo =
                        String(
                            material.codigo_barras
                        ).toLowerCase();
                    const descricao =
                        material.descricao.toLowerCase();
                    return (
                        codigo.includes(busca) ||
                        descricao.includes(busca)
                    );
                }
            );
        mostrarEstoque(materiaisFiltrados);
    }
);

// Carrega o estoque quando a página abrir
carregarEstoque();

// ==================================================
// HISTÓRICO DE MOVIMENTAÇÕES
// ==================================================

let movimentacoes = [];

const campoBuscaHistorico =
    document.getElementById("busca-historico");

const tipoHistorico =
    document.getElementById("tipo-historico");

const dataInicialHistorico =
    document.getElementById("data-inicial-historico");

const dataFinalHistorico =
    document.getElementById("data-final-historico");

const btnAtualizarHistorico =
    document.getElementById("btn-atualizar-historico");


async function carregarHistorico() {

    try {

        const resposta =
            await fetch("/movimentacoes");

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            alert(
                "Não foi possível carregar o histórico."
            );

            return;

        }

        movimentacoes = dados;

        filtrarHistorico();

    } catch (erro) {

        console.error(
            "Erro ao carregar histórico:",
            erro
        );

        alert(
            "Não foi possível carregar o histórico."
        );

    }

}


function mostrarHistorico(lista) {

    const tabela =
        document.getElementById("lista-historico");

    tabela.innerHTML = "";
    let totalMovimentacoes = lista.length;

    let totalEntradas = 0;

    let totalRetiradas = 0;


    lista.forEach(function(movimentacao) {

        if (movimentacao.tipo === "entrada") {

            totalEntradas++;

        } else if (movimentacao.tipo === "retirada") {

            totalRetiradas++;

        }

    });
    document.getElementById(
        "total-movimentacoes"
    ).textContent = totalMovimentacoes;

    document.getElementById(
        "total-entradas"
    ).textContent = totalEntradas;

    document.getElementById(
        "total-retiradas"
    ).textContent = totalRetiradas;


    lista.forEach(function(movimentacao) {

        const linha =
            document.createElement("tr");


        const dataHora =
            new Date(movimentacao.data_hora);


        const dataFormatada =
            dataHora.toLocaleDateString("pt-BR");


        const horaFormatada =
            dataHora.toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


        let tipoTexto = "";

        if (movimentacao.tipo === "entrada") {

            tipoTexto = `
                <span class="status-movimentacao status-entrada">
                    Entrada
                </span>
            `;

        } else {

            tipoTexto = `
                <span class="status-movimentacao status-retirada">
                    Retirada
                </span>
            `;

        }


        let numeroRequisicao = "---";

        let botaoAcao = "---";


        if (
            movimentacao.tipo === "retirada" &&
            movimentacao.numero_requisicao !== null
        ) {

            const numeroFormatado =
                String(
                    movimentacao.numero_requisicao
                ).padStart(4, "0");

            numeroRequisicao = `
                <span class="numero-requisicao">
                    ${numeroFormatado}
                </span>
            `;


            botaoAcao = `
                <button
                    type="button"
                    class="btn-abrir-requisicao"
                    onclick="abrirRequisicao(${movimentacao.requisicao_id})"
                >
                    Abrir
                </button>
            `;

        }


        linha.innerHTML = `
            <td>
                ${dataFormatada}
                ${horaFormatada}
            </td>

            <td>${tipoTexto}</td>

            <td>${movimentacao.material}</td>

            <td>${movimentacao.quantidade}</td>

            <td>${movimentacao.responsavel}</td>

            <td>${numeroRequisicao}</td>

            <td>${botaoAcao}</td>
        `;


        tabela.appendChild(linha);

    });

}


function filtrarHistorico() {

    const busca =
        campoBuscaHistorico.value
            .trim()
            .toLowerCase();


    const tipoSelecionado =
        tipoHistorico.value;


    const dataInicial =
        dataInicialHistorico.value;


    const dataFinal =
        dataFinalHistorico.value;


    const resultado =
        movimentacoes.filter(
            function(movimentacao) {

                const material =
                    movimentacao.material
                        .toLowerCase();


                const responsavel =
                    movimentacao.responsavel
                        .toLowerCase();


                const correspondeBusca =
                    material.includes(busca) ||
                    responsavel.includes(busca);


                const correspondeTipo =
                    tipoSelecionado === "todos" ||
                    movimentacao.tipo === tipoSelecionado;


                const dataMovimentacao =
                    new Date(
                        movimentacao.data_hora
                    );


                let correspondeDataInicial = true;
                let correspondeDataFinal = true;


                if (dataInicial !== "") {

                    const inicio =
                        new Date(
                            `${dataInicial}T00:00:00`
                        );


                    correspondeDataInicial =
                        dataMovimentacao >= inicio;

                }


                if (dataFinal !== "") {

                    const fim =
                        new Date(
                            `${dataFinal}T23:59:59`
                        );


                    correspondeDataFinal =
                        dataMovimentacao <= fim;

                }


                return (
                    correspondeBusca &&
                    correspondeTipo &&
                    correspondeDataInicial &&
                    correspondeDataFinal
                );

            }
        );


    mostrarHistorico(resultado);

}


function abrirRequisicao(id) {

    window.open(
        `/impressao.html?id=${id}`,
        "_blank"
    );

}


campoBuscaHistorico.addEventListener(
    "input",
    filtrarHistorico
);


tipoHistorico.addEventListener(
    "change",
    filtrarHistorico
);


dataInicialHistorico.addEventListener(
    "change",
    filtrarHistorico
);


dataFinalHistorico.addEventListener(
    "change",
    filtrarHistorico
);


btnAtualizarHistorico.addEventListener(
    "click",
    carregarHistorico
);


carregarHistorico();

// ==================================================
// MENU / NAVEGAÇÃO ENTRE TELAS
// ==================================================

const telaCadastro =
    document.querySelector(".cadastro-material");

const telaRetirada =
    document.querySelector(".retirada-material");

const telaEntrada =
    document.querySelector(".entrada-estoque");

const telaEstoque =
    document.querySelector(".consulta-estoque");

const telaHistorico =
    document.querySelector(".historico-movimentacoes");


const btnMenuCadastro =
    document.getElementById("menu-cadastro");

const btnMenuRetirada =
    document.getElementById("menu-retirada");

const btnMenuEntrada =
    document.getElementById("menu-entrada");

const btnMenuEstoque =
    document.getElementById("menu-estoque");

const btnMenuHistorico =
    document.getElementById("menu-historico");


// ==================================================
// ESCONDER TODAS AS TELAS
// ==================================================

function esconderTodasAsTelas() {

    telaCadastro.classList.add("tela-oculta");

    telaRetirada.classList.add("tela-oculta");

    telaEntrada.classList.add("tela-oculta");

    telaEstoque.classList.add("tela-oculta");

    telaHistorico.classList.add("tela-oculta");

}


// ==================================================
// MOSTRAR TELA SELECIONADA
// ==================================================

function mostrarTela(tela, botao) {

    esconderTodasAsTelas();

    // Mostra a tela escolhida
    tela.classList.remove("tela-oculta");


    // Remove o destaque de todos os botões
    document
        .querySelectorAll(".menu button")
        .forEach(function(btn) {

            btn.classList.remove("menu-ativo");

        });


    // Destaca o botão da tela atual
    if (botao) {

        botao.classList.add("menu-ativo");

    }

}


// ==================================================
// BOTÃO CADASTRAR MATERIAL
// ==================================================

btnMenuCadastro.addEventListener(
    "click",
    function() {

        mostrarTela(
            telaCadastro,
            btnMenuCadastro
        );

    }
);


// ==================================================
// BOTÃO NOVA RETIRADA
// ==================================================

btnMenuRetirada.addEventListener(
    "click",
    function() {

        mostrarTela(
            telaRetirada,
            btnMenuRetirada
        );

    }
);


// ==================================================
// BOTÃO ENTRADA DE ESTOQUE
// ==================================================

btnMenuEntrada.addEventListener(
    "click",
    function() {

        mostrarTela(
            telaEntrada,
            btnMenuEntrada
        );

    }
);


// ==================================================
// BOTÃO CONSULTAR ESTOQUE
// ==================================================

btnMenuEstoque.addEventListener(
    "click",
    function() {

        mostrarTela(
            telaEstoque,
            btnMenuEstoque
        );

        // Atualiza os dados ao entrar na tela
        carregarEstoque();

    }
);


// ==================================================
// BOTÃO HISTÓRICO
// ==================================================

btnMenuHistorico.addEventListener(
    "click",
    function() {

        mostrarTela(
            telaHistorico,
            btnMenuHistorico
        );

        // Atualiza os dados ao entrar na tela
        carregarHistorico();

    }
);


// ==================================================
// TELA INICIAL DO SISTEMA
// ==================================================

// Ao abrir o sistema,
// Nova Retirada será a tela inicial.

mostrarTela(
    telaRetirada,
    btnMenuRetirada
);