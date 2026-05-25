const API_URL = "http://localhost:3000/api";

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
  return fazerRequisicaoApi("/store", {
    method: "PUT",
    body: JSON.stringify(dadosLoja),
  });
}
