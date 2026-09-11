const parametros = new URLSearchParams(window.location.search);

const requisicaoId = parametros.get("id");

async function carregarRequisicao() {

    try {

        const resposta = await fetch(`/requisicoes/${requisicaoId}`);

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        const primeiraLinha = dados[0];

        document.getElementById("numero-requisicao").textContent =
            String(primeiraLinha.numero_requisicao).padStart(4, "0");

        const dataHora = new Date(primeiraLinha.data_hora);

        document.getElementById("data-requisicao").textContent =
            dataHora.toLocaleDateString("pt-BR");

        document.getElementById("hora-requisicao").textContent =
            dataHora.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
            });

        document.getElementById("nome-retirante").textContent =
            primeiraLinha.nome_retirante;

        document.getElementById("nome-responsavel").textContent =
            primeiraLinha.nome_responsavel;

        const tabela = document.getElementById("itens-requisicao");

        dados.forEach(function(item) {

            const linha = document.createElement("tr");

            linha.innerHTML = `
                <td>${item.codigo_barras}</td>
                <td>${item.descricao}</td>
                <td>${item.unidade}</td>
                <td>${item.quantidade}</td>
            `;

            tabela.appendChild(linha);

        });

    } catch (erro) {

        console.error("Erro:", erro);

        alert("Não foi possível carregar a requisição.");

    }

}

carregarRequisicao();