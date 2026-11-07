const API_URL = "/api";

async function fazerRequisicaoApi(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: {
      "Content-Type": "application/json",
      ...(opcoes.headers || {}),
    },
    ...opcoes,
  });

  let resultado = null;

  try {
    resultado = await resposta.json();
  } catch (error) {
    resultado = null;
  }

  if (!resposta.ok) {
    throw new Error(
      resultado?.erro ||
        resultado?.detalhe ||
        resultado?.mensagem ||
        "Erro na requisição.",
    );
  }

  return resultado;
}

async function carregarConfiguracoesLojaApi() {
  return fazerRequisicaoApi("/store");
}

async function salvarConfiguracoesLojaApi(dadosLoja) {
  const token = localStorage.getItem("clickbus_token");

  if (!token) {
    throw new Error(
      "Você precisa estar autenticado como administrador."
    );
  }

  return fazerRequisicaoApi("/store", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dadosLoja),
  });
}
