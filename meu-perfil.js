
"use strict";

document.addEventListener("DOMContentLoaded", iniciarMeuPerfil);

let enderecosDoCliente = [];
let cpfOriginalPerfil = "";

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



async function configurarDadosPessoais() {
  const usuario = await requisicaoPerfil("/auth/me");

  elemento("perfilNome").value = usuario.name || "";
  elemento("perfilCpf").value = usuario.cpf || "";
  cpfOriginalPerfil = String(usuario.cpf || "").replace(/\D/g, "");
  elemento("perfilEmail").value = usuario.email || "";
  elemento("perfilTelefone").value = usuario.phone || "";

  // Os campos ficam disponíveis para edição.
  elemento("perfilNome").disabled = false;
  elemento("perfilCpf").disabled = false;
  elemento("perfilCpf").readOnly = false;
  elemento("perfilEmail").disabled = false;
  elemento("perfilTelefone").disabled = false;
  elemento("btnSalvarDados").disabled = false;
}

async function salvarDadosPessoais(evento) {
  evento.preventDefault();

  const name = elemento("perfilNome").value.trim();
  const email = elemento("perfilEmail").value.trim();
  const phone = elemento("perfilTelefone").value.trim();
  const cpf = elemento("perfilCpf").value.replace(/\D/g, "");

  if (name.length < 3 || !email || !phone) {
    mostrarMensagem(
      "Preencha corretamente nome, email e telefone.",
      true
    );
    return;
  }

  if (cpf && cpf.length !== 11) {
    mostrarMensagem("O CPF deve conter 11 números.", true);
    return;
  }

  if (cpf !== cpfOriginalPerfil) {
    const confirmado = window.confirm(
      "Atenção! Você está alterando seu CPF. " +
      "Tem certeza de que deseja continuar?"
    );

    if (!confirmado) return;
  }

  const botao = elemento("btnSalvarDados");
  botao.disabled = true;

  try {
    const resposta = await requisicaoPerfil("/auth/me", {
      method: "PUT",
      body: JSON.stringify({
        name,
        email,
        phone,
        cpf,
      }),
    });

    const usuario = resposta.usuario;

    if (!usuario) {
      throw new Error("Resposta inválida ao salvar seus dados.");
    }

    elemento("perfilNome").value = usuario.name || "";
    elemento("perfilEmail").value = usuario.email || "";
    elemento("perfilTelefone").value = usuario.phone || "";
    elemento("perfilCpf").value = usuario.cpf || "";

    cpfOriginalPerfil = String(usuario.cpf || "")
      .replace(/\D/g, "");

    mostrarMensagem("Dados pessoais atualizados com sucesso.");
  } catch (erro) {
    mostrarMensagem(erro.message, true);
  } finally {
    botao.disabled = false;
  }
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
  
  elemento("camposEnderecoDetalhado").hidden = false;
  elemento("mapaPerfilEndereco").hidden = true;
  elemento("btnConfirmarMapaPerfil").hidden = true;

  elemento("tituloFormularioEndereco").textContent =
    "Cadastrar novo endereço";

  elemento("btnCancelarEdicaoEndereco").hidden = true;
  elemento("btnSalvarEndereco").textContent = "Salvar endereço";
}


function editarEndereco(endereco) {
  elemento("enderecoId").value = endereco.id;
  elemento("enderecoCompleto").value = endereco.address || "";
  elemento("enderecoPrincipal").checked = endereco.is_primary;

  elemento("perfilCep").value = endereco.cep || "";
  elemento("perfilRua").value = endereco.street || "";
  elemento("perfilNumero").value = endereco.number || "";
  elemento("perfilBairro").value = endereco.neighborhood || "";
  elemento("perfilCidade").value = endereco.city || "";
  elemento("perfilEstado").value = endereco.state || "";
  elemento("perfilComplemento").value = endereco.complement || "";
  elemento("perfilReferencia").value = endereco.reference || "";
  elemento("perfilLocalizacao").value = endereco.location || "";

  elemento("camposEnderecoDetalhado").hidden = false;
  elemento("mapaPerfilEndereco").hidden = true;
  elemento("btnConfirmarMapaPerfil").hidden = true;

  elemento("tituloFormularioEndereco").textContent = "Editar endereço";
  elemento("btnCancelarEdicaoEndereco").hidden = false;
  elemento("btnSalvarEndereco").textContent = "Salvar alterações";

  elemento("perfilCep").focus();
}

function montarEnderecoCompleto() {
  const rua = elemento("perfilRua").value.trim();
  const numero = elemento("perfilNumero").value.trim();
  const bairro = elemento("perfilBairro").value.trim();
  const cidade = elemento("perfilCidade").value.trim();
  const estado = elemento("perfilEstado").value.trim().toUpperCase();
  const cep = elemento("perfilCep").value.trim();
  const complemento = elemento("perfilComplemento").value.trim();
  const referencia = elemento("perfilReferencia").value.trim();

  const partes = [
    [rua, numero].filter(Boolean).join(", "),
    bairro,
    [cidade, estado].filter(Boolean).join(" - "),
    cep ? `CEP: ${cep}` : "",
    complemento ? `Complemento: ${complemento}` : "",
    referencia ? `Referência: ${referencia}` : "",
  ].filter(Boolean);

  return partes.join(", ");
}

function atualizarEnderecoCompleto() {
  const camposEssenciais = [
    "perfilRua",
    "perfilNumero",
    "perfilBairro",
    "perfilCidade",
    "perfilEstado",
  ];

  const completo = camposEssenciais.every(
    (id) => elemento(id).value.trim() !== ""
  );

  if (!completo) return;
  const enderecoMontado = montarEnderecoCompleto();

  if (enderecoMontado.length <= 500) {
    elemento("enderecoCompleto").value = enderecoMontado;
  }
}

async function salvarEndereco(evento) {
  evento.preventDefault();

  const id = elemento("enderecoId").value;

  const enderecoDigitado = elemento("enderecoCompleto").value.trim();

  const enderecoAnterior = enderecosDoCliente.find(
    (item) => String(item.id) === id
  );

  const camposDetalhadosAlterados = [
    ["perfilCep", "cep"],
    ["perfilRua", "street"],
    ["perfilNumero", "number"],
    ["perfilBairro", "neighborhood"],
    ["perfilCidade", "city"],
    ["perfilEstado", "state"],
    ["perfilComplemento", "complement"],
    ["perfilReferencia", "reference"],
  ].some(([campo, propriedade]) => {
    const atual = elemento(campo).value.trim();
    const anterior = enderecoAnterior?.[propriedade] || "";
    return atual.toUpperCase() !== anterior.toUpperCase();
  });

  const enderecoMontado = montarEnderecoCompleto();

 
  const camposEssenciaisPreenchidos =
    elemento("perfilRua").value.trim() !== "" &&
    elemento("perfilNumero").value.trim() !== "" &&
    elemento("perfilBairro").value.trim() !== "" &&
    elemento("perfilCidade").value.trim() !== "" &&
    elemento("perfilEstado").value.trim() !== "";

  const isPrimary = elemento("enderecoPrincipal").checked;
  const botao = elemento("btnSalvarEndereco");
  const camposDetalhados = {
    cep: elemento("perfilCep").value.trim(),
    street: elemento("perfilRua").value.trim(),
    number: elemento("perfilNumero").value.trim(),
    neighborhood: elemento("perfilBairro").value.trim(),
    city: elemento("perfilCidade").value.trim(),
    state: elemento("perfilEstado").value.trim().toUpperCase(),
    complement: elemento("perfilComplemento").value.trim(),
    reference: elemento("perfilReferencia").value.trim(),
    location: elemento("perfilLocalizacao").value.trim(),
  };

  const camposObrigatorios = {
    "CEP": camposDetalhados.cep,
    "Rua / Avenida": camposDetalhados.street,
    "Número": camposDetalhados.number,
    "Bairro": camposDetalhados.neighborhood,
    "Cidade": camposDetalhados.city,
    "Estado": camposDetalhados.state,
  };

  for (const [nome, valor] of Object.entries(camposObrigatorios)) {
    if (!valor) {
      mostrarMensagem(`Preencha o campo ${nome}.`, true);
      return;
    }
  }

  const cepNumeros = camposDetalhados.cep.replace(/\D/g, "");

  if (cepNumeros.length !== 8) {
    mostrarMensagem("Informe um CEP com 8 números.", true);
    return;
  }


camposDetalhados.cep =
  `${cepNumeros.slice(0, 5)}-${cepNumeros.slice(5)}`;

elemento("perfilCep").value = camposDetalhados.cep;


  if (!/^[A-Z]{2}$/.test(camposDetalhados.state)) {
    mostrarMensagem("Informe a sigla do estado com 2 letras.", true);
    return;
  }

  const enderecoValidado = montarEnderecoCompleto();

  if (enderecoValidado.length < 5 || enderecoValidado.length > 500) {
    mostrarMensagem(
      "O endereço completo deve ter entre 5 e 500 caracteres.",
      true
    );
    return;
  }
  const address = enderecoValidado;
  
  botao.disabled = true;

  try {
    if (id) {
  
await requisicaoPerfil(`/addresses/${id}`, {
  method: "PUT",
      await requisicaoPerfil(`/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          address,
          ...camposDetalhados,
        }),
      });

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
          ...camposDetalhados,
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
  
  const camposQueFormamEndereco = [
    "perfilCep",
    "perfilRua",
    "perfilNumero",
    "perfilBairro",
    "perfilCidade",
    "perfilEstado",
    "perfilComplemento",
    "perfilReferencia",
  ];

  for (const id of camposQueFormamEndereco) {
    elemento(id).addEventListener(
      "input",
      atualizarEnderecoCompleto
    );
  }
 
elemento("formMeusDados").addEventListener(
  "submit",
  salvarDadosPessoais
);

  try {
    // O backend valida o token e exige a função de cliente.
    await configurarDadosPessoais();
    await carregarEnderecos();
    elemento("camposEnderecoDetalhado").hidden = false;

    conteudo.hidden = false;
    mostrarMensagem("");
  } catch (erro) {
    mostrarErroDeAcesso(
      "Não foi possível validar sua sessão ou carregar seus endereços. " +
      erro.message
    );
  }
}
