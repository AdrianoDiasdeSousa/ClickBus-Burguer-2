
"use strict";

document.addEventListener("DOMContentLoaded", iniciarMeuPerfil);

let enderecosDoCliente = [];

function elemento(id) {
  return document.getElementById(id);
}

function mostrarMensagem(texto, erro = false) {
  const mensagem = elemento("mensagemPerfil");
  mensagem.textContent = texto;
  mensagem.style.color = erro ? "#b91c1c" : "";
}

function obterTokenPerfil() {
  return localStorage.getItem("clickbus_token");
}

async function requisicaoPerfil(caminho, opcoes = {}) {
  const token = obterTokenPerfil();

  if (!token) {
    throw new Error("Faça login para acessar seus endereços.");
  }

  return fazerRequisicaoApi(caminho, {
    ...opcoes,
    headers: {
      ...(opcoes.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

function configurarDadosPessoais() {
  const formulario = elemento("formMeusDados");

  // A API de dados pessoais ainda será implementada.
  // Não permitir salvamento sem backend.
  for (const campo of formulario.querySelectorAll("input")) {
    campo.disabled = true;
  }

  elemento("btnSalvarDados").disabled = true;

  const aviso = document.createElement("p");
  aviso.textContent =
    "A consulta e a edição dos dados pessoais serão liberadas " +
    "quando concluirmos a integração segura com o backend.";

  formulario.before(aviso);
}

async function carregarEnderecos() {
  const enderecos = await requisicaoPerfil("/addresses");

  if (!Array.isArray(enderecos)) {
    throw new Error("Resposta inválida ao carregar os endereços.");
  }

  enderecosDoCliente = enderecos;
  renderizarEnderecos();
}

function criarBotaoEndereco(texto, acao, desabilitado = false) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = texto;
  botao.disabled = desabilitado;
  botao.addEventListener("click", acao);
  return botao;
}

function renderizarEnderecos() {
  const lista = elemento("listaEnderecos");
  lista.replaceChildren();

  if (enderecosDoCliente.length === 0) {
    const aviso = document.createElement("p");
    aviso.textContent = "Você ainda não tem endereços cadastrados.";
    lista.appendChild(aviso);
    return;
  }

  for (const endereco of enderecosDoCliente) {
    const item = document.createElement("article");
    item.className = "item-endereco";

    const descricao = document.createElement("p");
    descricao.textContent = endereco.address;
    item.appendChild(descricao);

    if (endereco.is_primary) {
      const principal = document.createElement("strong");
      principal.textContent = "Endereço principal";
      item.appendChild(principal);
    }

    const acoes = document.createElement("div");
    acoes.className = "acoes-endereco";

    acoes.appendChild(
      criarBotaoEndereco("Editar", () => editarEndereco(endereco))
    );

    if (!endereco.is_primary) {
      acoes.appendChild(
        criarBotaoEndereco(
          "Definir como principal",
          () => definirEnderecoPrincipal(endereco.id)
        )
      );
    }

    acoes.appendChild(
      criarBotaoEndereco(
        "Excluir",
        () => excluirEndereco(endereco.id),
        enderecosDoCliente.length === 1
      )
    );

    item.appendChild(acoes);
    lista.appendChild(item);
  }
}

function limparFormularioEndereco() {
  elemento("formEndereco").reset();
  elemento("enderecoId").value = "";
  elemento("tituloFormularioEndereco").textContent =
    "Cadastrar novo endereço";
  elemento("btnCancelarEdicaoEndereco").hidden = true;
  elemento("btnSalvarEndereco").textContent = "Salvar endereço";
}

function editarEndereco(endereco) {
  elemento("enderecoId").value = endereco.id;
  elemento("enderecoCompleto").value = endereco.address;
  elemento("enderecoPrincipal").checked = endereco.is_primary;

  elemento("tituloFormularioEndereco").textContent = "Editar endereço";
  elemento("btnCancelarEdicaoEndereco").hidden = false;
  elemento("btnSalvarEndereco").textContent = "Salvar alterações";

  elemento("enderecoCompleto").focus();
}

async function salvarEndereco(evento) {
  evento.preventDefault();

  const id = elemento("enderecoId").value;
  const address = elemento("enderecoCompleto").value.trim();
  const isPrimary = elemento("enderecoPrincipal").checked;
  const botao = elemento("btnSalvarEndereco");

  if (address.length < 5 || address.length > 500) {
    mostrarMensagem(
      "Informe um endereço entre 5 e 500 caracteres.",
      true
    );
    return;
  }

  botao.disabled = true;

  try {
    if (id) {
      await requisicaoPerfil(`/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify({ address }),
      });

      const enderecoAnterior = enderecosDoCliente.find(
        (item) => String(item.id) === id
      );

      if (isPrimary && !enderecoAnterior?.is_primary) {
        await requisicaoPerfil(`/addresses/${id}/primary`, {
          method: "PATCH",
        });
      }
    } else {
      await requisicaoPerfil("/addresses", {
        method: "POST",
        body: JSON.stringify({
          address,
          is_primary: isPrimary,
        }),
      });
    }

    limparFormularioEndereco();
    await carregarEnderecos();

    mostrarMensagem("Endereço salvo com sucesso.");
  } catch (erro) {
    mostrarMensagem(erro.message, true);

    // Atualiza a lista caso alguma etapa tenha sido concluída.
    try {
      await carregarEnderecos();
    } catch (_) {
      // Preserva a mensagem do erro original.
    }
  } finally {
    botao.disabled = false;
  }
}

async function definirEnderecoPrincipal(id) {
  try {
    await requisicaoPerfil(`/addresses/${id}/primary`, {
      method: "PATCH",
    });

    await carregarEnderecos();
    limparFormularioEndereco();

    mostrarMensagem("Endereço principal atualizado.");
  } catch (erro) {
    mostrarMensagem(erro.message, true);
  }
}

async function excluirEndereco(id) {
  if (enderecosDoCliente.length <= 1) {
    mostrarMensagem(
      "Você precisa manter pelo menos um endereço cadastrado.",
      true
    );
    return;
  }

  const confirmado = window.confirm(
    "Deseja realmente excluir este endereço?"
  );

  if (!confirmado) return;

  try {
    await requisicaoPerfil(`/addresses/${id}`, {
      method: "DELETE",
    });

    limparFormularioEndereco();
    await carregarEnderecos();

    mostrarMensagem("Endereço excluído com sucesso.");
  } catch (erro) {
    mostrarMensagem(erro.message, true);
  }
}

function mostrarErroDeAcesso(texto) {
  const aviso = document.createElement("p");
  aviso.setAttribute("role", "alert");
  aviso.textContent = texto;

  const link = document.createElement("a");
  link.href = "login.html";
  link.textContent = " Ir para o login";

  aviso.appendChild(link);

  const cabecalho = document.querySelector("header");
  cabecalho.after(aviso);
}

async function iniciarMeuPerfil() {
  const conteudo = elemento("conteudoPerfil");

  if (!obterTokenPerfil()) {
    mostrarErroDeAcesso(
      "Você precisa fazer login para acessar o Meu Perfil."
    );
    return;
  }

  elemento("formEndereco").addEventListener(
    "submit",
    salvarEndereco
  );

  elemento("btnCancelarEdicaoEndereco").addEventListener(
    "click",
    limparFormularioEndereco
  );

  elemento("formMeusDados").addEventListener(
    "submit",
    (evento) => evento.preventDefault()
  );

  configurarDadosPessoais();

  try {
    // O backend valida o token e exige a função de cliente.
    await carregarEnderecos();

    conteudo.hidden = false;
    mostrarMensagem("");
  } catch (erro) {
    mostrarErroDeAcesso(
      "Não foi possível validar sua sessão ou carregar seus endereços. " +
      erro.message
    );
  }
}
