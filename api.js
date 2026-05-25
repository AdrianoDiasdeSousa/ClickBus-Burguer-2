const API_URL = "https://clickbus-burguer-api.onrender.com/api";

async function fazerRequisicaoApi(caminho, opcoes = {}) {
  const token = localStorage.getItem("clickbus_token");

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opcoes.headers || {}),
    },
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
