const express = require("express");
const mysql = require("mysql2");
const path = require("path");
require("dotenv").config();


const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
console.log(
    "Pasta frontend:",
    path.join(__dirname, "../frontend")
);

const conexao = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

conexao.connect((erro) => {

    if (erro) {
        console.error("Erro ao conectar ao MySQL:", erro);
        return;
    }

    console.log("Conectado ao MySQL!");

});


app.get("/materiais", (req, res) => {

    const sql = "SELECT * FROM materiais";

    conexao.query(sql, (erro, resultados) => {

        if (erro) {
            console.error("Erro ao buscar materiais:", erro);

            return res.status(500).json({
                erro: "Erro ao buscar materiais"
            });
        }

        res.json(resultados);

    });

});


app.post("/materiais", (req, res) => {

    const {
        codigo_barras,
        descricao,
        unidade,
        estoque,
        estoque_minimo
    } = req.body;

    const sql = `
        INSERT INTO materiais
        (codigo_barras, descricao, unidade, estoque, estoque_minimo)
        VALUES (?, ?, ?, ?, ?)
    `;

    conexao.query(
        sql,
        [codigo_barras, descricao, unidade, estoque, estoque_minimo],
        (erro, resultado) => {

            if (erro) {

                if (erro.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        erro: "Este código de barras já está cadastrado."
                    });
                }

                console.error("Erro ao cadastrar material:", erro);

                return res.status(500).json({
                    erro: "Erro ao cadastrar material."
                });
            }

            res.status(201).json({
                mensagem: "Material cadastrado com sucesso!",
                id: resultado.insertId
            });

        }
    );

});

app.get("/materiais/:codigo_barras", async (req, res) => {

    const codigoBarras = req.params.codigo_barras;

    try {

        const [resultado] = await conexao.promise().query(
            `
            SELECT *
            FROM materiais
            WHERE codigo_barras = ?
            AND ativo = TRUE
            `,
            [codigoBarras]
        );

        if (resultado.length === 0) {

            return res.status(404).json({
                erro: "Material não encontrado ou está inativo."
            });

        }

        res.json(resultado[0]);

    } catch (erro) {

        console.error(
            "Erro ao buscar material:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao buscar material."
        });

    }

});

app.post("/requisicoes", (req, res) => {

    const {
        nome_retirante,
        nome_responsavel,
        itens
    } = req.body;

    // Validações básicas
    if (!nome_retirante || !nome_responsavel) {
        return res.status(400).json({
            erro: "Retirante e responsável são obrigatórios."
        });
    }
    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({
            erro: "A requisição precisa ter pelo menos um item."
        });
    }
    // Inicia a transação
    conexao.beginTransaction((erro) => {
        if (erro) {
            console.error("Erro ao iniciar transação:", erro);

            return res.status(500).json({
                erro: "Erro ao iniciar a retirada."
            });
        }
        // Descobre o próximo número de requisição
        const sqlNumero = `
            SELECT COALESCE(MAX(numero_requisicao), 0) + 1
            AS proximo_numero
            FROM requisicoes
        `;
        conexao.query(sqlNumero, (erro, resultadoNumero) => {
            if (erro) {
                return desfazerTransacao(
                    res,
                    erro,
                    "Erro ao gerar número da requisição."
                );
            }
            const numeroRequisicao =
                resultadoNumero[0].proximo_numero;
            // Cria a requisição
            const sqlRequisicao = `
                INSERT INTO requisicoes
                (numero_requisicao, nome_retirante, nome_responsavel)
                VALUES (?, ?, ?)
            `;
            conexao.query(
                sqlRequisicao,
                [
                    numeroRequisicao,
                    nome_retirante,
                    nome_responsavel
                ],
                (erro, resultadoRequisicao) => {
                    if (erro) {
                        return desfazerTransacao(
                            res,
                            erro,
                            "Erro ao criar requisição."
                        );
                    }
                    const requisicaoId =
                        resultadoRequisicao.insertId;
                    processarItens(
                        0,
                        itens,
                        requisicaoId,
                        numeroRequisicao,
                        res
                    );
                }
            );
        });
    });
});

function processarItens(
    indice,
    itens,
    requisicaoId,
    numeroRequisicao,
    res
) {
    // Terminamos todos os itens
    if (indice >= itens.length) {
        conexao.commit((erro) => {
            if (erro) {
                return desfazerTransacao(
                    res,
                    erro,
                    "Erro ao finalizar a retirada."
                );
            }
            res.status(201).json({
                mensagem: "Retirada realizada com sucesso!",
                requisicao_id: requisicaoId,
                numero_requisicao: numeroRequisicao
            });
        });
        return;
    }
    const item = itens[indice];
    if (
        !Number.isInteger(item.material_id) ||
        !Number.isInteger(item.quantidade) ||
        item.quantidade <= 0
    ) {
        return desfazerTransacao(
            res,
            new Error("Item inválido"),
            "Existe um item inválido na retirada.",
            400
        );
    }
    // Baixa o estoque somente se houver quantidade suficiente
    const sqlEstoque = `
        UPDATE materiais
        SET estoque = estoque - ?
        WHERE id = ?
        AND estoque >= ?
    `;
    conexao.query(
        sqlEstoque,
        [
            item.quantidade,
            item.material_id,
            item.quantidade
        ],
        (erro, resultadoEstoque) => {
            if (erro) {
                return desfazerTransacao(
                    res,
                    erro,
                    "Erro ao atualizar estoque."
                );
            }
            // Nenhuma linha alterada = material inexistente
            // ou estoque insuficiente
            if (resultadoEstoque.affectedRows === 0) {
                return desfazerTransacao(
                    res,
                    new Error("Estoque insuficiente"),
                    "Material inexistente ou estoque insuficiente.",
                    409
                );
            }
            const sqlItem = `
                INSERT INTO itens_requisicao
                (requisicao_id, material_id, quantidade)
                VALUES (?, ?, ?)
            `;
            conexao.query(
                sqlItem,
                [
                    requisicaoId,
                    item.material_id,
                    item.quantidade
                ],
                (erro) => {
                    if (erro) {
                        return desfazerTransacao(
                            res,
                            erro,
                            "Erro ao registrar item da requisição."
                        );
                    }
                    // Passa para o próximo item
                    processarItens(
                        indice + 1,
                        itens,
                        requisicaoId,
                        numeroRequisicao,
                        res
                    );
                }
            );
        }
    );
}

function desfazerTransacao(
    res,
    erro,
    mensagem,
    status = 500
) {
    console.error(mensagem, erro);
    conexao.rollback(() => {
        res.status(status).json({
            erro: mensagem
        });
    });
}

app.get("/requisicoes/:id", (req, res) => {

    const requisicaoId = req.params.id;

    const sql = `
        SELECT
            r.id,
            r.numero_requisicao,
            r.data_hora,
            r.nome_retirante,
            r.nome_responsavel,
            m.codigo_barras,
            m.descricao,
            m.unidade,
            ir.quantidade
        FROM requisicoes r
        JOIN itens_requisicao ir
            ON ir.requisicao_id = r.id
        JOIN materiais m
            ON ir.material_id = m.id
        WHERE r.id = ?
    `;

    conexao.query(sql, [requisicaoId], (erro, resultados) => {

        if (erro) {
            console.error("Erro ao buscar requisição:", erro);

            return res.status(500).json({
                erro: "Erro ao buscar requisição."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                erro: "Requisição não encontrada."
            });
        }

        res.json(resultados);

    });

});

app.put("/materiais/:id/entrada", (req, res) => {

    const materialId = Number(req.params.id);
    const quantidade = Number(req.body.quantidade);
    const responsavel = req.body.responsavel;


    // Valida o ID do material
    if (!Number.isInteger(materialId) || materialId <= 0) {

        return res.status(400).json({
            erro: "Material inválido."
        });

    }


    // Valida a quantidade
    if (!Number.isInteger(quantidade) || quantidade <= 0) {

        return res.status(400).json({
            erro: "Informe uma quantidade válida."
        });

    }


    // Valida o responsável
    if (!responsavel || responsavel.trim() === "") {

        return res.status(400).json({
            erro: "Informe o responsável pela entrada."
        });

    }


    // Inicia a transação
    conexao.beginTransaction((erro) => {

        if (erro) {

            console.error(
                "Erro ao iniciar transação da entrada:",
                erro
            );

            return res.status(500).json({
                erro: "Erro ao iniciar a entrada de estoque."
            });

        }


        // Atualiza o estoque
        const sqlEstoque = `
            UPDATE materiais
            SET estoque = estoque + ?
            WHERE id = ?
        `;


        conexao.query(
            sqlEstoque,
            [quantidade, materialId],
            (erro, resultadoEstoque) => {

                if (erro) {

                    return desfazerTransacaoEntrada(
                        res,
                        erro,
                        "Erro ao atualizar o estoque."
                    );

                }


                // Se nenhum material foi encontrado
                if (resultadoEstoque.affectedRows === 0) {

                    return desfazerTransacaoEntrada(
                        res,
                        new Error("Material não encontrado"),
                        "Material não encontrado.",
                        404
                    );

                }


                // Registra a entrada no histórico
                const sqlHistorico = `
                    INSERT INTO entradas_estoque
                    (material_id, quantidade, responsavel)
                    VALUES (?, ?, ?)
                `;


                conexao.query(
                    sqlHistorico,
                    [
                        materialId,
                        quantidade,
                        responsavel.trim()
                    ],
                    (erro) => {

                        if (erro) {

                            return desfazerTransacaoEntrada(
                                res,
                                erro,
                                "Erro ao registrar o histórico da entrada."
                            );

                        }


                        // Busca o material com o estoque atualizado
                        const sqlBuscar = `
                            SELECT *
                            FROM materiais
                            WHERE id = ?
                        `;


                        conexao.query(
                            sqlBuscar,
                            [materialId],
                            (erro, resultados) => {

                                if (erro) {

                                    return desfazerTransacaoEntrada(
                                        res,
                                        erro,
                                        "Erro ao consultar o novo estoque."
                                    );

                                }


                                // Confirma todas as alterações
                                conexao.commit((erro) => {

                                    if (erro) {

                                        return desfazerTransacaoEntrada(
                                            res,
                                            erro,
                                            "Erro ao finalizar a entrada."
                                        );

                                    }


                                    res.json({

                                        mensagem:
                                            "Entrada realizada com sucesso!",

                                        material:
                                            resultados[0]

                                    });

                                });

                            }
                        );

                    }
                );

            }
        );

    });

});

function desfazerTransacaoEntrada(
    res,
    erro,
    mensagem,
    status = 500
) {

    console.error(mensagem, erro);

    conexao.rollback(() => {

        res.status(status).json({
            erro: mensagem
        });

    });

}

app.get("/movimentacoes", (req, res) => {

    const sql = `
        SELECT
            ee.data_hora,
            'entrada' AS tipo,
            m.descricao AS material,
            ee.quantidade,
            ee.responsavel,
            NULL AS numero_requisicao,
            NULL AS requisicao_id
        FROM entradas_estoque ee

        JOIN materiais m
            ON ee.material_id = m.id

        UNION ALL

        SELECT
            r.data_hora,
            'retirada' AS tipo,
            m.descricao AS material,
            ir.quantidade,
            r.nome_responsavel AS responsavel,
            r.numero_requisicao,
            r.id AS requisicao_id
        FROM itens_requisicao ir

        JOIN requisicoes r
            ON ir.requisicao_id = r.id

        JOIN materiais m
            ON ir.material_id = m.id

        ORDER BY data_hora DESC
    `;

    conexao.query(sql, (erro, resultados) => {

        if (erro) {

            console.error(
                "Erro ao buscar movimentações:",
                erro
            );

            return res.status(500).json({
                erro: "Erro ao buscar movimentações."
            });

        }

        res.json(resultados);

    });

});

app.put("/materiais/:id/inativar", async (req, res) => {

    const id = req.params.id;

    try {

        const [resultado] = await conexao.promise().query(
            `
            UPDATE materiais
            SET ativo = FALSE
            WHERE id = ?
            `,
            [id]
        );

        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                erro: "Material não encontrado."
            });

        }

        res.json({
            mensagem: "Material inativado com sucesso."
        });

    } catch (erro) {

        console.error(
            "Erro ao inativar material:",
            erro
        );

        res.status(500).json({
            erro: "Não foi possível inativar o material."
        });

    }

});

app.put("/materiais/:id/reativar", async (req, res) => {

    const id = req.params.id;

    try {

        const [resultado] = await conexao.promise().query(
            `
            UPDATE materiais
            SET ativo = TRUE
            WHERE id = ?
            `,
            [id]
        );

        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                erro: "Material não encontrado."
            });

        }

        res.json({
            mensagem: "Material reativado com sucesso."
        });

    } catch (erro) {

        console.error(
            "Erro ao reativar material:",
            erro
        );

        res.status(500).json({
            erro: "Não foi possível reativar o material."
        });

    }

});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});