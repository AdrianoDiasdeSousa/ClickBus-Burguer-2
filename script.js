/* =========================
   AVISOS TEMPORÁRIOS
========================= */

const TEMPO_AVISO_PADRAO = 2600;
const TEMPO_AVISO_NAVEGACAO = 1600;
const API_BASE_URL = "https://clickbus-burguer-api.onrender.com/api";

function prepararAvisosTemporarios() {
  if (document.getElementById("estiloAvisosTemporarios")) return;

  const estilo = document.createElement("style");
  estilo.id = "estiloAvisosTemporarios";
  estilo.textContent = `
    .area-avisos-temporarios {
      position: fixed;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: min(92vw, 420px);
      pointer-events: none;
    }

    .aviso-temporario {
      background: #1f1f1f;
      color: #fff;
      padding: 14px 18px;
      border-radius: 14px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
      font-size: 15px;
      font-weight: 600;
      line-height: 1.35;
      opacity: 0;
      transform: translateY(-14px) scale(0.98);
      transition: opacity 0.25s ease, transform 0.25s ease;
      border-left: 5px solid #f4b400;
    }

    .aviso-temporario.visivel {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .aviso-temporario.saida {
      opacity: 0;
      transform: translateY(-12px) scale(0.98);
    }

    .aviso-temporario.sucesso {
      border-left-color: #34a853;
    }

    .aviso-temporario.erro {
      border-left-color: #ea4335;
    }

    .aviso-temporario.info {
      border-left-color: #4285f4;
    }
  `;
  document.head.appendChild(estilo);
}

function mostrarAviso(mensagem, tipo = "info", tempo = TEMPO_AVISO_PADRAO) {
  prepararAvisosTemporarios();

  let areaAvisos = document.getElementById("areaAvisosTemporarios");

  if (!areaAvisos) {
    areaAvisos = document.createElement("div");
    areaAvisos.id = "areaAvisosTemporarios";
    areaAvisos.className = "area-avisos-temporarios";
    document.body.appendChild(areaAvisos);
  }

  const aviso = document.createElement("div");
  aviso.className = `aviso-temporario ${tipo}`;
  aviso.textContent = mensagem;

  areaAvisos.appendChild(aviso);

  requestAnimationFrame(() => aviso.classList.add("visivel"));

  setTimeout(() => {
    aviso.classList.add("saida");
    aviso.addEventListener("transitionend", () => aviso.remove(), {
      once: true,
    });
  }, tempo);
}

function avisarENavegar(mensagem, url, tipo = "sucesso") {
  mostrarAviso(mensagem, tipo, TEMPO_AVISO_NAVEGACAO);
  setTimeout(() => {
    window.location.href = url;
  }, TEMPO_AVISO_NAVEGACAO);
}

/* =========================
   LOGIN E CADASTRO
========================= */

function alternarVisibilidadeSenha(inputId, botao) {
  const campoSenha = document.getElementById(inputId);

  if (!campoSenha) return;

  const senhaEstaVisivel = campoSenha.type === "text";
  campoSenha.type = senhaEstaVisivel ? "password" : "text";

  if (botao) {
    botao.textContent = senhaEstaVisivel ? "👁️" : "🙈";
    botao.setAttribute(
      "aria-label",
      senhaEstaVisivel ? "Mostrar senha" : "Ocultar senha",
    );
    botao.setAttribute(
      "title",
      senhaEstaVisivel ? "Mostrar senha" : "Ocultar senha",
    );
  }
}

function obterCredenciaisAdmin() {
  let credenciaisSalvas = null;

  try {
    credenciaisSalvas = JSON.parse(
      localStorage.getItem("adminClickBusCredenciais") || "null",
    );
  } catch (erro) {
    credenciaisSalvas = null;
  }

  return {
    email: credenciaisSalvas?.email || "admin@clickbus.com",
    senha: credenciaisSalvas?.senha || "admin123",
    perguntaRecuperacao: credenciaisSalvas?.perguntaRecuperacao || "",
    respostaRecuperacao: credenciaisSalvas?.respostaRecuperacao || "",
  };
}

function salvarCredenciaisAdmin(credenciais) {
  const credenciaisAtuais = obterCredenciaisAdmin();

  const credenciaisSeguras = {
    email: credenciais.email || credenciaisAtuais.email || "admin@clickbus.com",
    senha: credenciais.senha || credenciaisAtuais.senha || "admin123",
    perguntaRecuperacao:
      credenciais.perguntaRecuperacao ||
      credenciaisAtuais.perguntaRecuperacao ||
      "",
    respostaRecuperacao:
      credenciais.respostaRecuperacao ||
      credenciaisAtuais.respostaRecuperacao ||
      "",
  };

  localStorage.setItem(
    "adminClickBusCredenciais",
    JSON.stringify(credenciaisSeguras),
  );
}

function preencherContaAdministrador() {
  const areaContaAdmin = document.getElementById("areaContaAdmin");
  const emailAdminAtual = document.getElementById("emailAdminAtual");
  const novoEmailAdmin = document.getElementById("novoEmailAdmin");
  const perguntaRecuperacaoAdmin = document.getElementById(
    "perguntaRecuperacaoAdmin",
  );
  const respostaRecuperacaoAdmin = document.getElementById(
    "respostaRecuperacaoAdmin",
  );

  if (!areaContaAdmin || !emailAdminAtual) return;

  if (!usuarioEhAdmin()) {
    areaContaAdmin.classList.add("oculto");
    return;
  }

  const credenciais = obterCredenciaisAdmin();

  areaContaAdmin.classList.remove("oculto");
  emailAdminAtual.value = credenciais.email;
  novoEmailAdmin.value = "";
  perguntaRecuperacaoAdmin.value = credenciais.perguntaRecuperacao || "";
  respostaRecuperacaoAdmin.value = "";
}

function salvarContaAdministrador(event) {
  event.preventDefault();

  if (!usuarioEhAdmin()) {
    mostrarAviso("Apenas o administrador pode alterar essa conta.", "erro");
    return;
  }

  const credenciais = obterCredenciaisAdmin();

  const novoEmail = document.getElementById("novoEmailAdmin").value.trim();
  const senhaAtual = document.getElementById("senhaAtualAdmin").value;
  const novaSenha = document.getElementById("novaSenhaAdmin").value.trim();
  const confirmarSenha = document
    .getElementById("confirmarSenhaAdmin")
    .value.trim();
  const perguntaRecuperacao = document
    .getElementById("perguntaRecuperacaoAdmin")
    .value.trim();
  const respostaRecuperacao = document
    .getElementById("respostaRecuperacaoAdmin")
    .value.trim();

  if (senhaAtual !== credenciais.senha) {
    mostrarAviso(
      "Digite a senha atual correta para salvar alterações.",
      "erro",
    );
    return;
  }

  const emailFinal = novoEmail || credenciais.email;

  if (!emailFinal.includes("@") || !emailFinal.includes(".")) {
    mostrarAviso("Digite um email de administrador válido.", "erro");
    return;
  }

  if (novaSenha && novaSenha.length < 4) {
    mostrarAviso("A nova senha precisa ter pelo menos 4 caracteres.", "erro");
    return;
  }

  if (novaSenha && novaSenha !== confirmarSenha) {
    mostrarAviso("As senhas não conferem.", "erro");
    return;
  }

  if (!perguntaRecuperacao || !respostaRecuperacao) {
    mostrarAviso(
      "Preencha a pergunta e a resposta de recuperação para não perder acesso depois.",
      "erro",
    );
    return;
  }

  salvarCredenciaisAdmin({
    email: emailFinal,
    senha: novaSenha || credenciais.senha,
    perguntaRecuperacao,
    respostaRecuperacao: respostaRecuperacao.toLowerCase(),
  });

  localStorage.setItem("usuarioLogado", emailFinal);
  localStorage.setItem("tipoUsuario", "admin");
  localStorage.setItem("nomeUsuario", "Administrador");

  document.getElementById("emailAdminAtual").value = emailFinal;
  document.getElementById("novoEmailAdmin").value = "";
  document.getElementById("senhaAtualAdmin").value = "";
  document.getElementById("novaSenhaAdmin").value = "";
  document.getElementById("confirmarSenhaAdmin").value = "";
  document.getElementById("respostaRecuperacaoAdmin").value = "";

  mostrarAviso("Conta do administrador atualizada com sucesso.", "sucesso");
}

function mudarSenhaAdministrador() {
  mostrarAviso(
    "A senha do admin agora fica em Perfil da loja > Conta do administrador.",
    "info",
  );
}

function limparPedidoEmAndamento() {
  const produtos = carregarProdutos();

  produtos.forEach((produto) => {
    produto.quantidade = 0;
  });

  salvarProdutos(produtos);
  localStorage.removeItem("pedidoAtual");
  localStorage.removeItem("produtoObservacaoId");
  localStorage.removeItem("observacoesPedidoAtual");
  localStorage.removeItem("enderecoTemporarioEntrega");
  localStorage.removeItem("enderecoEntrega");
  localStorage.removeItem("localizacaoEntrega");
  localStorage.removeItem("tipoEnderecoSelecionado");
}
async function fazerLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email")?.value.trim();
  const senha = document.getElementById("senha")?.value.trim();

  if (!email || !senha) {
    mostrarAviso("Preencha todos os campos.", "erro");
    return;
  }

  const botaoEntrar = document.querySelector(".botao-entrar");
  const textoOriginalBotao = botaoEntrar?.textContent || "Entrar";

  try {
    if (botaoEntrar) {
      botaoEntrar.disabled = true;
      botaoEntrar.textContent = "Entrando...";
    }

    const resposta = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: senha,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(
        resultado.erro ||
          "Email ou senha incorretos. Verifique os dados ou faça seu cadastro.",
        "erro",
      );
      return;
    }

    const usuario = resultado.user;

    limparPedidoEmAndamento();

    localStorage.setItem("clickbus_token", resultado.token);
    localStorage.setItem("clickbus_usuario", JSON.stringify(usuario));

    localStorage.setItem("usuarioLogado", usuario.email);
    localStorage.setItem("tipoUsuario", usuario.role || "cliente");
    localStorage.setItem("nomeUsuario", usuario.name);
    localStorage.setItem("telefoneUsuario", usuario.phone || "");
    localStorage.setItem("cpfUsuario", usuario.cpf || "");
    localStorage.setItem("enderecoUsuario", usuario.address || "");
    localStorage.setItem("localizacaoUsuario", "");

    localStorage.removeItem("enderecoUsuarioDados");

    if (usuario.role === "admin") {
      avisarENavegar(
        "Login de administrador realizado com sucesso!",
        "cardapio.html",
      );
      return;
    }

    avisarENavegar("Login realizado com sucesso!", "cardapio.html");
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    mostrarAviso(
      "Erro de conexão com o servidor. Verifique se o backend está rodando.",
      "erro",
    );
  } finally {
    if (botaoEntrar) {
      botaoEntrar.disabled = false;
      botaoEntrar.textContent = textoOriginalBotao;
    }
  }
}

function montarEndereco(dados) {
  const partes = [
    dados.rua && `${dados.rua}, Nº ${dados.numero}`,
    dados.bairro,
    dados.cidade && dados.estado
      ? `${dados.cidade} - ${dados.estado}`
      : dados.cidade || dados.estado,
    dados.cep && `CEP: ${dados.cep}`,
    dados.complemento && `Complemento: ${dados.complemento}`,
    dados.referencia && `Referência: ${dados.referencia}`,
  ];

  return partes.filter(Boolean).join("\n");
}

function lerCamposEndereco(prefixo = "") {
  const campo = (id) =>
    document.getElementById(prefixo + id)?.value.trim() || "";

  return {
    cep: campo("Cep"),
    rua: campo("Rua"),
    numero: campo("Numero"),
    bairro: campo("Bairro"),
    cidade: campo("Cidade"),
    estado: campo("Estado").toUpperCase(),
    complemento: campo("Complemento"),
    referencia: campo("Referencia"),
    localizacao: normalizarLocalizacao(campo("Localizacao")),
  };
}

function salvarLocalizacaoNoCampo(campoId, contextoMapa = "") {
  const campoLocalizacao = document.getElementById(campoId);

  if (!campoLocalizacao) return;

  if (!navigator.geolocation) {
    mostrarAviso(
      "Seu navegador não permite pegar a localização automaticamente. Cole o link do mapa no campo.",
      "erro",
    );
    return;
  }

  mostrarAviso("Buscando sua localização...", "info");

  navigator.geolocation.getCurrentPosition(
    (posicao) => {
      const latitude = Number(posicao.coords.latitude).toFixed(6);
      const longitude = Number(posicao.coords.longitude).toFixed(6);
      const precisao = Math.round(posicao.coords.accuracy || 0);

      // Salva somente latitude e longitude. Isso evita que o Google Maps abra uma busca textual
      // ou aproveite coordenadas antigas do link, deixando a rota mais confiável para o entregador.
      campoLocalizacao.value = `${latitude},${longitude}`;

      if (contextoMapa) {
        exibirMapaEndereco(contextoMapa, latitude, longitude);
      }

      if (precisao && precisao > 80) {
        mostrarAviso(
          `Localização adicionada com precisão aproximada de ${precisao} metros. Confira se o ponto está correto.`,
          "info",
        );
      } else {
        mostrarAviso("Localização adicionada.", "sucesso");
      }
    },
    () => {
      mostrarAviso(
        "Não foi possível pegar sua localização. Cole o link do Google Maps no campo.",
        "erro",
      );
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
}

function coordenadaEhValida(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function extrairCoordenadasLocalizacao(valor) {
  if (!valor) return null;

  const texto = decodeURIComponent(String(valor).trim());

  const padroes = [
    /[?&]q=(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /[?&]query=(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /[?&]destination=(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /@(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/i,
  ];

  for (const padrao of padroes) {
    const coordenadas = texto.match(padrao);

    if (coordenadas && coordenadaEhValida(coordenadas[1], coordenadas[2])) {
      return {
        latitude: Number(coordenadas[1]).toFixed(6),
        longitude: Number(coordenadas[2]).toFixed(6),
      };
    }
  }

  return null;
}

function normalizarLocalizacao(valor) {
  if (!valor) return "";

  const texto = String(valor).trim();
  const coordenadas = extrairCoordenadasLocalizacao(texto);

  if (coordenadas) {
    return `${coordenadas.latitude},${coordenadas.longitude}`;
  }

  return texto;
}

const mapasEndereco = {};

function obterConfigMapaEndereco(contexto = "novo") {
  const configs = {
    novo: {
      campoLocalizacaoId: "novoLocalizacao",
      mapaId: "mapaNovoEndereco",
      botaoConfirmarId: "btnConfirmarMapaNovo",
      campos: {
        cep: "novoCep",
        rua: "novoRua",
        numero: "novoNumero",
        bairro: "novoBairro",
        cidade: "novoCidade",
        estado: "novoEstado",
      },
    },
    cadastro: {
      campoLocalizacaoId: "localizacao",
      mapaId: "mapaCadastroEndereco",
      botaoConfirmarId: "btnConfirmarMapaCadastro",
      campos: {
        cep: "cep",
        rua: "rua",
        numero: "numero",
        bairro: "bairro",
        cidade: "cidade",
        estado: "estado",
      },
    },
  };

  return configs[contexto] || configs.novo;
}

function montarBuscaEnderecoMapa(contexto = "novo") {
  const config = obterConfigMapaEndereco(contexto);
  const valorCampo = (id) => document.getElementById(id)?.value.trim() || "";
  const partes = [
    valorCampo(config.campos.rua),
    valorCampo(config.campos.numero),
    valorCampo(config.campos.bairro),
    valorCampo(config.campos.cidade),
    valorCampo(config.campos.estado),
    valorCampo(config.campos.cep),
    "Brasil",
  ].filter(Boolean);

  return partes.join(", ");
}

function atualizarCampoLocalizacaoMapa(contexto, latitude, longitude) {
  const config = obterConfigMapaEndereco(contexto);
  const campoLocalizacao = document.getElementById(config.campoLocalizacaoId);

  if (campoLocalizacao) {
    campoLocalizacao.value = `${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`;
  }
}

function exibirMapaEndereco(contexto = "novo", latitude, longitude) {
  const config = obterConfigMapaEndereco(contexto);
  const mapaElemento = document.getElementById(config.mapaId);
  const botaoConfirmar = document.getElementById(config.botaoConfirmarId);
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!mapaElemento || !coordenadaEhValida(lat, lng)) return;

  if (typeof L === "undefined") {
    atualizarCampoLocalizacaoMapa(contexto, lat, lng);
    mostrarAviso(
      "Localização encontrada, mas o mapa não carregou. Confira a internet e tente novamente.",
      "info",
    );
    return;
  }

  mapaElemento.classList.remove("oculto");
  if (botaoConfirmar) botaoConfirmar.classList.remove("oculto");

  setTimeout(() => {
    if (!mapasEndereco[contexto]) {
      const mapa = L.map(mapaElemento).setView([lat, lng], 17);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapa);

      const marcador = L.marker([lat, lng], { draggable: true }).addTo(mapa);

      marcador.on("dragend", () => {
        const ponto = marcador.getLatLng();
        atualizarCampoLocalizacaoMapa(contexto, ponto.lat, ponto.lng);
        mostrarAviso("Ponto ajustado no mapa.", "info");
      });

      mapa.on("click", (evento) => {
        marcador.setLatLng(evento.latlng);
        atualizarCampoLocalizacaoMapa(
          contexto,
          evento.latlng.lat,
          evento.latlng.lng,
        );
      });

      mapasEndereco[contexto] = { mapa, marcador };
    } else {
      mapasEndereco[contexto].mapa.setView([lat, lng], 17);
      mapasEndereco[contexto].marcador.setLatLng([lat, lng]);
    }

    mapasEndereco[contexto].mapa.invalidateSize();
    atualizarCampoLocalizacaoMapa(contexto, lat, lng);
  }, 100);
}

async function buscarEnderecoNoMapa(contexto = "novo") {
  const busca = montarBuscaEnderecoMapa(contexto);

  if (!busca || busca === "Brasil") {
    mostrarAviso(
      "Digite pelo menos rua, bairro ou cidade antes de buscar no mapa.",
      "erro",
    );
    return;
  }

  mostrarAviso("Buscando endereço no mapa...", "info");

  try {
    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(busca)}`,
    );
    const resultados = await resposta.json();
    const primeiroResultado = resultados && resultados[0];

    if (!primeiroResultado) {
      mostrarAviso(
        "Não encontrei esse endereço no mapa. Confira rua, número, bairro e cidade.",
        "erro",
      );
      return;
    }

    exibirMapaEndereco(contexto, primeiroResultado.lat, primeiroResultado.lon);
    mostrarAviso(
      "Endereço encontrado. Ajuste o marcador se precisar e confirme a localização.",
      "sucesso",
    );
  } catch (erro) {
    mostrarAviso(
      "Não foi possível buscar no mapa agora. Verifique sua internet ou cole um link do Google Maps.",
      "erro",
    );
  }
}

function confirmarLocalizacaoMapa(contexto = "novo") {
  const dadosMapa = mapasEndereco[contexto];

  if (dadosMapa?.marcador) {
    const ponto = dadosMapa.marcador.getLatLng();
    atualizarCampoLocalizacaoMapa(contexto, ponto.lat, ponto.lng);
    mostrarAviso("Localização confirmada no mapa.", "sucesso");
    return;
  }

  const config = obterConfigMapaEndereco(contexto);
  const campoLocalizacao = document.getElementById(config.campoLocalizacaoId);

  if (campoLocalizacao?.value.trim()) {
    campoLocalizacao.value = normalizarLocalizacao(campoLocalizacao.value);
    const coordenadas = extrairCoordenadasLocalizacao(campoLocalizacao.value);

    if (coordenadas) {
      exibirMapaEndereco(contexto, coordenadas.latitude, coordenadas.longitude);
      mostrarAviso("Localização confirmada.", "sucesso");
    } else {
      mostrarAviso(
        "Cole um link ou coordenada válida, ou busque o endereço no mapa.",
        "erro",
      );
    }
    return;
  }

  mostrarAviso(
    "Busque o endereço no mapa ou informe uma localização antes de confirmar.",
    "erro",
  );
}

function obterLinkLocalizacao(valor) {
  if (!valor) return "";

  const texto = String(valor).trim();
  const coordenadas = extrairCoordenadasLocalizacao(texto);

  if (coordenadas) {
    return `https://www.google.com/maps/search/?api=1&query=${coordenadas.latitude},${coordenadas.longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
}

function obterLinkGoogleMapsRota(valor) {
  if (!valor) return "";

  const texto = String(valor).trim();
  const coordenadas = extrairCoordenadasLocalizacao(texto);
  const destino = coordenadas
    ? `${coordenadas.latitude},${coordenadas.longitude}`
    : texto;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&travelmode=driving`;
}

function obterLinkWaze(valor) {
  if (!valor) return "";

  const texto = String(valor).trim();
  const coordenadas = extrairCoordenadasLocalizacao(texto);

  if (coordenadas) {
    return `https://waze.com/ul?ll=${coordenadas.latitude},${coordenadas.longitude}&navigate=yes`;
  }

  return `https://waze.com/ul?q=${encodeURIComponent(texto)}&navigate=yes`;
}

function enderecoSomentePorLocalizacao(dados) {
  return Boolean(
    dados.localizacao &&
    !dados.cep &&
    !dados.rua &&
    !dados.numero &&
    !dados.bairro &&
    !dados.cidade &&
    !dados.estado,
  );
}

function obterApenasNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function formatarTelefoneBR(valor) {
  const numeros = obterApenasNumeros(valor).slice(0, 11);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function telefoneValido(valor) {
  const numeros = obterApenasNumeros(valor);
  return numeros.length === 10 || numeros.length === 11;
}

function prepararCamposTelefone() {
  const camposTelefone = document.querySelectorAll(
    'input[type="tel"], #telefone',
  );

  camposTelefone.forEach((campo) => {
    campo.setAttribute("inputmode", "numeric");
    campo.setAttribute("maxlength", "15");
    campo.setAttribute("autocomplete", "tel");

    campo.addEventListener("input", () => {
      campo.value = formatarTelefoneBR(campo.value);
    });

    if (campo.value) {
      campo.value = formatarTelefoneBR(campo.value);
    }
  });
}

async function fazerCadastro(event) {
  event.preventDefault();

  const nome = document.getElementById("nome")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const senha = document.getElementById("senha")?.value.trim();
  const cpf = document.getElementById("cpf")?.value.trim() || "";
  const confirmarSenha = document
    .getElementById("confirmarSenha")
    ?.value.trim();

  const telefone = formatarTelefoneBR(
    document.getElementById("telefone")?.value.trim() || "",
  );

  const dadosEndereco = {
    cep: document.getElementById("cep")?.value.trim() || "",
    rua: document.getElementById("rua")?.value.trim() || "",
    numero: document.getElementById("numero")?.value.trim() || "",
    bairro: document.getElementById("bairro")?.value.trim() || "",
    cidade: document.getElementById("cidade")?.value.trim() || "",
    estado: (
      document.getElementById("estado")?.value.trim() || ""
    ).toUpperCase(),
    complemento: document.getElementById("complemento")?.value.trim() || "",
    referencia: document.getElementById("referencia")?.value.trim() || "",
    localizacao: normalizarLocalizacao(
      document.getElementById("localizacao")?.value.trim() || "",
    ),
  };

  const endereco = montarEndereco(dadosEndereco);

  if (
    !nome ||
    !cpf ||
    !email ||
    !senha ||
    !confirmarSenha ||
    !telefone ||
    !dadosEndereco.cep ||
    !dadosEndereco.rua ||
    !dadosEndereco.numero ||
    !dadosEndereco.bairro ||
    !dadosEndereco.cidade ||
    !dadosEndereco.estado
  ) {
    mostrarAviso("Preencha todos os campos obrigatórios.", "erro");
    return;
  }

  if (!telefoneValido(telefone)) {
    mostrarAviso(
      "Digite um telefone válido com DDD. Exemplo: (63) 99998-4134.",
      "erro",
    );
    return;
  }

  if (senha !== confirmarSenha) {
    mostrarAviso("As senhas não conferem.", "erro");
    return;
  }

  if (senha.length < 6) {
    mostrarAviso("A senha precisa ter pelo menos 6 caracteres.", "erro");
    return;
  }

  const botaoCadastrar = document.querySelector(".botao-cadastrar");
  const textoOriginalBotao = botaoCadastrar?.textContent || "Cadastrar";

  try {
    if (botaoCadastrar) {
      botaoCadastrar.disabled = true;
      botaoCadastrar.textContent = "Cadastrando...";
    }

    const resposta = await fetch(`${API_BASE_URL}/auth/cadastro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nome,
        cpf,
        email,
        phone: telefone,
        password: senha,
        address: endereco,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(
        resultado.erro || "Não foi possível realizar o cadastro.",
        "erro",
      );
      return;
    }

    localStorage.setItem("clickbus_token", resultado.token);
    localStorage.setItem("clickbus_usuario", JSON.stringify(resultado.user));

    mostrarAviso("Cadastro realizado com sucesso!", "sucesso");

    setTimeout(() => {
      window.location.href = "cardapio.html";
    }, 900);
  } catch (error) {
    console.error("Erro ao fazer cadastro:", error);
    mostrarAviso(
      "Erro de conexão com o servidor. Verifique se o backend está rodando.",
      "erro",
    );
  } finally {
    if (botaoCadastrar) {
      botaoCadastrar.disabled = false;
      botaoCadastrar.textContent = textoOriginalBotao;
    }
  }
}

function enviarRecuperacao(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (email === "") {
    mostrarAviso("Digite um email válido.", "erro");
    return;
  }

  const credenciaisAdmin = obterCredenciaisAdmin();

  if (email === credenciaisAdmin.email) {
    if (
      !credenciaisAdmin.perguntaRecuperacao ||
      !credenciaisAdmin.respostaRecuperacao
    ) {
      mostrarAviso(
        "A recuperação do administrador ainda não foi configurada. Entre com a senha atual e configure no painel.",
        "erro",
      );
      return;
    }

    const resposta = prompt(credenciaisAdmin.perguntaRecuperacao);

    if (resposta === null) return;

    if (
      resposta.trim().toLowerCase() !== credenciaisAdmin.respostaRecuperacao
    ) {
      mostrarAviso("Resposta de recuperação incorreta.", "erro");
      return;
    }

    const novaSenha = prompt("Digite a nova senha do administrador:");

    if (!novaSenha || novaSenha.trim().length < 4) {
      mostrarAviso("A nova senha precisa ter pelo menos 4 caracteres.", "erro");
      return;
    }

    const confirmarSenha = prompt("Confirme a nova senha do administrador:");

    if (novaSenha !== confirmarSenha) {
      mostrarAviso("As senhas não conferem.", "erro");
      return;
    }

    credenciaisAdmin.senha = novaSenha.trim();
    salvarCredenciaisAdmin(credenciaisAdmin);
    mostrarAviso(
      "Senha do administrador redefinida com sucesso. Já pode fazer login.",
      "sucesso",
    );
    return;
  }

  mostrarAviso("Instruções de recuperação enviadas para: " + email, "sucesso");
}

/* =========================
   PRODUTOS DO CARDÁPIO
========================= */

const produtosPadrao = [
  {
    id: 1,
    categoria: "lanche",
    nome: "Burguer SIMPLES",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, milho, batata palha, tomate e alface.",
    preco: 15,
    imagem: "img/produtos/burguer-simples.png",
    quantidade: 0,
  },
  {
    id: 2,
    categoria: "lanche",
    nome: "Burguer ESPECIAL",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, milho, batata palha, tomate e alface.",
    preco: 18,
    imagem: "img/produtos/burguer-especial.png",
    quantidade: 0,
  },
  {
    id: 3,
    categoria: "lanche",
    nome: "Burguer BACON",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, bacon, milho, batata palha, tomate e alface.",
    preco: 22,
    imagem: "img/produtos/burguer-bacon.png",
    quantidade: 0,
  },
  {
    id: 4,
    categoria: "lanche",
    nome: "Burguer CALABRESA",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, calabresa, milho, batata palha, tomate e alface.",
    preco: 22,
    imagem: "img/produtos/burguer-calabresa.png",
    quantidade: 0,
  },
  {
    id: 5,
    categoria: "lanche",
    nome: "Burguer FRANGO",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, milho, batata palha, tomate e alface.",
    preco: 20,
    imagem: "img/produtos/burguer-frango.png",
    quantidade: 0,
  },
  {
    id: 6,
    categoria: "lanche",
    nome: "Burguer TUDO",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, bacon, calabresa, milho, batata palha, tomate e alface.",
    preco: 25,
    imagem: "img/produtos/burguer-tudo.png",
    quantidade: 0,
  },
  {
    id: 7,
    categoria: "lanche",
    nome: "Batata Frita",
    descricao: "",
    preco: 5,
    imagem: "img/produtos/batata.png",
    quantidade: 0,
  },
  {
    id: 8,
    categoria: "lanche",
    nome: "Porção de Batata",
    descricao: "",
    preco: 25,
    imagem: "img/produtos/porcao-batata.png",
    quantidade: 0,
  },
  {
    id: 9,
    categoria: "bebida",
    nome: "Coca Cola 2 LTS",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/coca-2l.png",
    quantidade: 0,
  },
  {
    id: 10,
    categoria: "bebida",
    nome: "Coca Cola 1 LT",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/coca-1l.png",
    quantidade: 0,
  },
  {
    id: 11,
    categoria: "bebida",
    nome: "Guaraná Antarctica 2 LT",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/guarana-2l.png",
    quantidade: 0,
  },
  {
    id: 12,
    categoria: "bebida",
    nome: "Guaraná Antarctica 1 LT",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/guarana-1l.png",
    quantidade: 0,
  },
  {
    id: 13,
    categoria: "bebida",
    nome: "Coca Cola Lata 350 ml",
    descricao: "",
    preco: 7,
    imagem: "img/produtos/coca-lata.png",
    quantidade: 0,
  },
  {
    id: 14,
    categoria: "bebida",
    nome: "Guaraná Antarctica Lata 350 ml",
    descricao: "",
    preco: 7,
    imagem: "img/produtos/guarana-lata.png",
    quantidade: 0,
  },
  {
    id: 15,
    categoria: "bebida",
    nome: "Creme de Cupuaçu 500 ml",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/creme-cupuacu.png",
    quantidade: 0,
  },
  {
    id: 16,
    categoria: "bebida",
    nome: "Creme de Maracujá 500 ml",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/creme-maracuja.png",
    quantidade: 0,
  },
  {
    id: 17,
    categoria: "bebida",
    nome: "Creme de Morango 500 ml",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/creme-morango.png",
    quantidade: 0,
  },
  {
    id: 18,
    categoria: "bebida",
    nome: "Creme de Acerola 500 ml",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/creme-acerola.png",
    quantidade: 0,
  },
  {
    id: 19,
    categoria: "bebida",
    nome: "Suco de Cupuaçu 500 ml",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/suco-cupuacu.png",
    quantidade: 0,
  },
  {
    id: 20,
    categoria: "bebida",
    nome: "Suco de Maracujá 500 ml",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/suco-maracuja.png",
    quantidade: 0,
  },
  {
    id: 21,
    categoria: "bebida",
    nome: "Suco de Morango 500 ml",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/suco-morango.png",
    quantidade: 0,
  },
  {
    id: 22,
    categoria: "bebida",
    nome: "Suco de Acerola 500 ml",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/suco-acerola.png",
    quantidade: 0,
  },
  {
    id: 23,
    categoria: "bebida",
    nome: "Água mineral com Gás 500 ml",
    descricao: "",
    preco: 5,
    imagem: "img/produtos/agua-gas.png",
    quantidade: 0,
  },
  {
    id: 24,
    categoria: "bebida",
    nome: "Água mineral 500 ml",
    descricao: "",
    preco: 4,
    imagem: "img/produtos/agua-mineral.png",
    quantidade: 0,
  },
  {
    id: 25,
    categoria: "bebida",
    nome: "Cerveja Lata Antarctica 269 ml",
    descricao: "",
    preco: 5,
    imagem: "img/produtos/cerveja-antartica.png",
    quantidade: 0,
  },
  {
    id: 26,
    categoria: "bebida",
    nome: "Cerveja Lata Budweiser 269 ml",
    descricao: "",
    preco: 5,
    imagem: "img/produtos/cerveja-budweiser.png",
    quantidade: 0,
  },
];

/* =========================
   FUNÇÕES DO CARDÁPIO
========================= */

function normalizarProdutos(produtos) {
  return produtos.map((produto) => {
    const produtoNormalizado = {
      ...produto,
      disponivel: produto.disponivel !== false,
    };

    delete produtoNormalizado.observacao;

    return produtoNormalizado;
  });
}

function carregarProdutos() {
  const produtosSalvos = localStorage.getItem("produtosClickBus");

  if (produtosSalvos) {
    try {
      const produtos = normalizarProdutos(JSON.parse(produtosSalvos));

      if (Array.isArray(produtos) && produtos.length > 0) {
        localStorage.setItem("produtosClickBus", JSON.stringify(produtos));
        return produtos;
      }
    } catch (error) {
      console.error("Erro ao carregar produtos locais:", error);
    }
  }

  const produtosIniciais = normalizarProdutos([...produtosPadrao]);
  localStorage.setItem("produtosClickBus", JSON.stringify(produtosIniciais));
  return produtosIniciais;
}

function salvarProdutos(produtos) {
  localStorage.setItem("produtosClickBus", JSON.stringify(produtos));
}

function converterProdutoApiParaTela(produtoApi) {
  const categoriaApi = String(produtoApi.category || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return {
    id: Number(produtoApi.id),
    categoria:
      categoriaApi.includes("hamb") ||
      categoriaApi.includes("lanche") ||
      categoriaApi.includes("burguer")
        ? "lanche"
        : "bebida",
    nome: produtoApi.name,
    descricao: produtoApi.description || "",
    preco: Number(produtoApi.price) || 0,
    imagem: produtoApi.image_url || "",
    quantidade: 0,
    disponivel: produtoApi.available !== false,
    ordem: Number(produtoApi.display_order) || Number(produtoApi.id),
    avisoAdmin: produtoApi.admin_notice || "",
  };
}

async function carregarProdutosDaApi() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/products`);

    if (!resposta.ok) {
      throw new Error("Erro ao buscar produtos.");
    }

    const produtosApi = await resposta.json();

    if (!Array.isArray(produtosApi) || produtosApi.length === 0) {
      throw new Error("A API não retornou produtos.");
    }

    const produtosAtuais = carregarProdutos();

    const produtosConvertidos = produtosApi.map((produtoApi) => {
      const produtoAntigo = produtosAtuais.find(
        (produto) => Number(produto.id) === Number(produtoApi.id),
      );

      const produtoConvertido = converterProdutoApiParaTela(produtoApi);

      return {
        ...produtoConvertido,
        quantidade: produtoAntigo ? Number(produtoAntigo.quantidade) || 0 : 0,
      };
    });

    salvarProdutos(produtosConvertidos);

    return produtosConvertidos;
  } catch (error) {
    console.error("Erro ao carregar produtos da API:", error);
    mostrarAviso(
      "Não foi possível carregar os produtos do servidor. Usando dados locais.",
      "erro",
    );

    return carregarProdutos();
  }
}

function converterProdutoTelaParaApi(produto) {
  return {
    name: produto.nome,
    description: produto.descricao || "",
    price: Number(produto.preco) || 0,
    category: produto.categoria || "lanche",
    image_url: produto.imagem || "",
    available: produto.disponivel !== false,
    display_order: Number(produto.ordem) || Number(produto.id),
    admin_notice: produto.avisoAdmin || "",
  };
}
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function usuarioEhAdmin() {
  return localStorage.getItem("tipoUsuario") === "admin";
}

function bloquearPedidoParaAdmin() {
  return usuarioEhAdmin();
}

function protegerPaginaCardapio() {
  const estaNoCardapio = window.location.pathname.includes("cardapio.html");

  if (!estaNoCardapio) return;

  const usuarioLogado = localStorage.getItem("usuarioLogado");

  if (!usuarioLogado) {
    avisarENavegar("Faça login para acessar o cardápio.", "login.html", "erro");
  }
}

function criarImagemProduto(produto) {
  if (!produto.imagem) {
    return "";
  }

  return `
    <img
      src="${produto.imagem}"
      alt="${produto.nome}"
      onerror="this.style.display='none'"
    />
  `;
}

async function renderizarCardapio() {
  const listaLanches = document.getElementById("listaLanches");
  const listaBebidas = document.getElementById("listaBebidas");

  if (!listaLanches || !listaBebidas) return;

  const produtos = await carregarProdutosDaApi();
  const admin = usuarioEhAdmin();

  listaLanches.innerHTML = "";
  listaBebidas.innerHTML = "";

  const nomeUsuario = localStorage.getItem("nomeUsuario") || "Cliente";
  const saudacao = document.getElementById("saudacaoUsuario");

  if (saudacao) {
    saudacao.textContent = admin
      ? "Olá, Administrador!"
      : `Olá, ${nomeUsuario}!`;
  }

  const areaAdmin = document.getElementById("areaAdmin");

  if (areaAdmin) {
    if (admin) {
      areaAdmin.classList.remove("oculto");
    } else {
      areaAdmin.classList.add("oculto");
    }
  }

  const barraTotal = document.querySelector(".barra-total");

  if (barraTotal) {
    barraTotal.classList.toggle("oculto", admin);
    barraTotal.style.display = admin ? "none" : "";
  }

  produtos.forEach((produto) => {
    if (!admin && produto.disponivel === false) return;

    const card = document.createElement("article");
    card.className =
      produto.disponivel === false ? "produto produto-indisponivel" : "produto";
    card.dataset.produtoId = produto.id;
    card.dataset.categoria = produto.categoria;

    if (admin) {
      card.classList.add("produto-admin");
      card.draggable = true;
      card.addEventListener("dragstart", iniciarArrasteProduto);
      card.addEventListener("dragover", passarProdutoArrastado);
      card.addEventListener("drop", soltarProdutoArrastado);
      card.addEventListener("dragend", finalizarArrasteProduto);
    }

    card.innerHTML = `
      <div class="produto-info">
        <div class="produto-texto">
          <h3>${produto.nome}</h3>

          ${produto.disponivel === false ? `<span class="selo-indisponivel">Em falta</span>` : ""}

          ${produto.descricao ? `<p>${produto.descricao}</p>` : ""}

          ${produto.avisoAdmin ? `<div class="aviso-produto-card">⚠️ ${produto.avisoAdmin}</div>` : ""}

          <strong>${formatarMoeda(Number(produto.preco) || 0)}</strong>

          ${
            !admin && produto.categoria === "lanche"
              ? `<button type="button" class="btn-observacoes" onclick="adicionarObservacao(${produto.id})">Observações</button>`
              : ""
          }

          ${
            admin
              ? `
                <div class="alca-arrastar-produto" title="Arraste para ordenar">
                  ☰ Arraste para ordenar
                </div>

                <div class="admin-acoes">
                <button type="button" onclick="editarProduto(${produto.id})">Editar produto</button>
                <button type="button" onclick="editarImagemProduto(${produto.id})">Editar imagem</button>
                <button type="button" onclick="editarAvisoProduto(${produto.id})">${produto.avisoAdmin ? "Editar aviso" : "Adicionar aviso"}</button>
                <button type="button" onclick="alternarDisponibilidadeProduto(${produto.id})">${produto.disponivel === false ? "Disponibilizar" : "Marcar em falta"}</button>
                <button type="button" onclick="excluirProduto(${produto.id})">Excluir produto</button>
                </div>
              `
              : ""
          }
        </div>

        <div class="produto-img">
          ${criarImagemProduto(produto)}
        </div>
      </div>

      ${
        admin
          ? `
            <div class="ordenar-produto ordenar-produto-externo">
              <button type="button" class="btn-ordem btn-subir" onclick="moverProduto(${produto.id}, -1)">⬆ Subir</button>
              <button type="button" class="btn-ordem btn-descer" onclick="moverProduto(${produto.id}, 1)">⬇ Descer</button>
            </div>
          `
          : `
            <div class="produto-qtd">
              <span>Quantidade</span>

              <div class="controle-qtd">
                <button type="button" onclick="alterarQuantidade(${produto.id}, -1)" ${produto.disponivel === false ? "disabled" : ""}>−</button>

                <input
                  type="number"
                  min="0"
                  value="${Number(produto.quantidade) > 0 ? produto.quantidade : ""}"
                  oninput="digitarQuantidade(${produto.id}, this.value)"
                  ${produto.disponivel === false ? "disabled" : ""}
                />

                <button type="button" onclick="alterarQuantidade(${produto.id}, 1)" ${produto.disponivel === false ? "disabled" : ""}>+</button>
              </div>
            </div>
          `
      }
    `;

    if (produto.categoria === "lanche") {
      listaLanches.appendChild(card);
    } else {
      listaBebidas.appendChild(card);
    }
  });

  atualizarTotal();
}

function alterarQuantidade(id, valor) {
  if (bloquearPedidoParaAdmin()) return;

  const produtos = carregarProdutos();
  const produto = produtos.find((item) => item.id === id);

  if (!produto) return;

  if (produto.disponivel === false && !usuarioEhAdmin()) {
    mostrarAviso("Este produto está em falta no momento.", "erro");
    return;
  }

  produto.quantidade = Number(produto.quantidade) || 0;
  produto.quantidade += valor;

  if (produto.quantidade < 0) {
    produto.quantidade = 0;
  }

  salvarProdutos(produtos);
  renderizarCardapio();
}

function digitarQuantidade(id, valor) {
  if (bloquearPedidoParaAdmin()) return;

  const produtos = carregarProdutos();
  const produto = produtos.find((item) => item.id === id);

  if (!produto) return;

  if (produto.disponivel === false && !usuarioEhAdmin()) {
    mostrarAviso("Este produto está em falta no momento.", "erro");
    return;
  }

  if (valor === "") {
    produto.quantidade = 0;
  } else {
    let quantidade = parseInt(valor);

    if (isNaN(quantidade) || quantidade < 0) {
      quantidade = 0;
    }

    produto.quantidade = quantidade;
  }

  salvarProdutos(produtos);
  atualizarTotal();
}

function atualizarTotal() {
  if (usuarioEhAdmin()) {
    const valorTotal = document.getElementById("valorTotal");
    if (valorTotal) valorTotal.textContent = "R$ 0,00";
    return;
  }

  const produtos = carregarProdutos();

  const total = produtos.reduce((soma, produto) => {
    return (
      soma + (Number(produto.preco) || 0) * (Number(produto.quantidade) || 0)
    );
  }, 0);

  const valorTotal = document.getElementById("valorTotal");

  if (valorTotal) {
    valorTotal.textContent = formatarMoeda(total);
  }
}

function adicionarObservacao(id) {
  localStorage.setItem("produtoObservacaoId", id);
  window.location.href = "observacoes.html";
}

function obterCardProdutoMaisProximo(elemento) {
  return elemento?.closest?.(".produto-admin") || null;
}

function iniciarArrasteProduto(event) {
  if (!usuarioEhAdmin()) return;

  const card = obterCardProdutoMaisProximo(event.currentTarget);

  if (!card) return;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.dataset.produtoId);

  card.classList.add("produto-arrastando");
}

function passarProdutoArrastado(event) {
  if (!usuarioEhAdmin()) return;

  event.preventDefault();

  const card = obterCardProdutoMaisProximo(event.currentTarget);
  const idArrastado = event.dataTransfer.getData("text/plain");

  if (!card || !idArrastado || card.dataset.produtoId === idArrastado) return;

  const produtos = carregarProdutos();
  const produtoArrastado = produtos.find(
    (produto) => String(produto.id) === idArrastado,
  );
  const produtoAlvo = produtos.find(
    (produto) => String(produto.id) === card.dataset.produtoId,
  );

  if (!produtoArrastado || !produtoAlvo) return;

  if (produtoArrastado.categoria !== produtoAlvo.categoria) {
    card.classList.remove("produto-alvo-arraste");
    return;
  }

  card.classList.add("produto-alvo-arraste");
}

async function soltarProdutoArrastado(event) {
  if (!usuarioEhAdmin()) return;

  event.preventDefault();

  const cardAlvo = obterCardProdutoMaisProximo(event.currentTarget);
  const idArrastado = Number(event.dataTransfer.getData("text/plain"));
  const idAlvo = Number(cardAlvo?.dataset.produtoId);

  document
    .querySelectorAll(".produto-alvo-arraste")
    .forEach((card) => card.classList.remove("produto-alvo-arraste"));

  if (!cardAlvo || !idArrastado || !idAlvo || idArrastado === idAlvo) return;

  await reposicionarProdutoArrastado(idArrastado, idAlvo);
}

function finalizarArrasteProduto() {
  document
    .querySelectorAll(".produto-arrastando, .produto-alvo-arraste")
    .forEach((card) => {
      card.classList.remove("produto-arrastando");
      card.classList.remove("produto-alvo-arraste");
    });
}

async function reposicionarProdutoArrastado(idArrastado, idAlvo) {
  if (!usuarioEhAdmin()) {
    mostrarAviso(
      "Apenas o administrador pode mudar a ordem dos produtos.",
      "erro",
    );
    return;
  }

  const produtos = carregarProdutos();

  const produtoArrastado = produtos.find(
    (produto) => Number(produto.id) === Number(idArrastado),
  );

  const produtoAlvo = produtos.find(
    (produto) => Number(produto.id) === Number(idAlvo),
  );

  if (!produtoArrastado || !produtoAlvo) {
    mostrarAviso("Produto não encontrado.", "erro");
    return;
  }

  if (produtoArrastado.categoria !== produtoAlvo.categoria) {
    mostrarAviso("Organize o produto dentro da própria categoria.", "erro");
    return;
  }

  const ordemArrastado =
    Number(produtoArrastado.ordem) || Number(produtoArrastado.id);

  const ordemAlvo = Number(produtoAlvo.ordem) || Number(produtoAlvo.id);

  const produtoArrastadoAtualizado = {
    ...produtoArrastado,
    ordem: ordemAlvo,
  };

  const produtoAlvoAtualizado = {
    ...produtoAlvo,
    ordem: ordemArrastado,
  };

  try {
    const respostaArrastado = await fetch(
      `${API_BASE_URL}/products/${produtoArrastado.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          converterProdutoTelaParaApi(produtoArrastadoAtualizado),
        ),
      },
    );

    const resultadoArrastado = await respostaArrastado.json();

    if (!respostaArrastado.ok) {
      mostrarAviso(
        resultadoArrastado.erro || "Erro ao atualizar ordem do produto.",
        "erro",
      );
      return;
    }

    const respostaAlvo = await fetch(
      `${API_BASE_URL}/products/${produtoAlvo.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          converterProdutoTelaParaApi(produtoAlvoAtualizado),
        ),
      },
    );

    const resultadoAlvo = await respostaAlvo.json();

    if (!respostaAlvo.ok) {
      mostrarAviso(
        resultadoAlvo.erro || "Erro ao atualizar ordem do produto.",
        "erro",
      );
      return;
    }

    mostrarAviso("Produto reposicionado com sucesso.", "sucesso");

    await renderizarCardapio();
  } catch (error) {
    console.error("Erro ao arrastar produto:", error);
    mostrarAviso("Erro de conexão ao reposicionar produto.", "erro");
  }
}

async function moverProduto(id, direcao) {
  if (!usuarioEhAdmin()) {
    mostrarAviso(
      "Apenas o administrador pode mudar a ordem dos produtos.",
      "erro",
    );
    return;
  }

  const produtos = carregarProdutos();

  const produtoAtual = produtos.find(
    (produto) => Number(produto.id) === Number(id),
  );

  if (!produtoAtual) {
    mostrarAviso("Produto não encontrado.", "erro");
    return;
  }

  const produtosDaCategoria = produtos
    .filter((produto) => produto.categoria === produtoAtual.categoria)
    .sort((a, b) => {
      const ordemA = Number(a.ordem) || Number(a.id);
      const ordemB = Number(b.ordem) || Number(b.id);
      return ordemA - ordemB;
    });

  const indiceCategoria = produtosDaCategoria.findIndex(
    (produto) => Number(produto.id) === Number(id),
  );

  const novoIndiceCategoria = indiceCategoria + direcao;

  if (
    novoIndiceCategoria < 0 ||
    novoIndiceCategoria >= produtosDaCategoria.length
  ) {
    mostrarAviso(
      direcao < 0
        ? "Esse produto já está no topo da categoria."
        : "Esse produto já está no fim da categoria.",
      "erro",
    );
    return;
  }

  const produtoAlvo = produtosDaCategoria[novoIndiceCategoria];

  const ordemAtual = Number(produtoAtual.ordem) || Number(produtoAtual.id);
  const ordemAlvo = Number(produtoAlvo.ordem) || Number(produtoAlvo.id);

  const produtoAtualAtualizado = {
    ...produtoAtual,
    ordem: ordemAlvo,
  };

  const produtoAlvoAtualizado = {
    ...produtoAlvo,
    ordem: ordemAtual,
  };

  try {
    const respostaAtual = await fetch(
      `${API_BASE_URL}/products/${produtoAtual.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          converterProdutoTelaParaApi(produtoAtualAtualizado),
        ),
      },
    );

    const resultadoAtual = await respostaAtual.json();

    if (!respostaAtual.ok) {
      mostrarAviso(
        resultadoAtual.erro || "Erro ao atualizar ordem do produto.",
        "erro",
      );
      return;
    }

    const respostaAlvo = await fetch(
      `${API_BASE_URL}/products/${produtoAlvo.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          converterProdutoTelaParaApi(produtoAlvoAtualizado),
        ),
      },
    );

    const resultadoAlvo = await respostaAlvo.json();

    if (!respostaAlvo.ok) {
      mostrarAviso(
        resultadoAlvo.erro || "Erro ao atualizar ordem do produto.",
        "erro",
      );
      return;
    }

    mostrarAviso("Ordem do produto atualizada.", "sucesso");

    await renderizarCardapio();
  } catch (error) {
    console.error("Erro ao mover produto:", error);
    mostrarAviso("Erro de conexão ao mudar a ordem do produto.", "erro");
  }
}
async function editarProduto(id) {
  if (!usuarioEhAdmin()) {
    mostrarAviso("Apenas o administrador pode editar produtos.", "erro");
    return;
  }

  const produtos = carregarProdutos();
  const produto = produtos.find((item) => Number(item.id) === Number(id));

  if (!produto) {
    mostrarAviso("Produto não encontrado.", "erro");
    return;
  }

  const novoNome = prompt("Nome do produto:", produto.nome);
  const novaDescricao = prompt(
    "Descrição do produto:",
    produto.descricao || "",
  );
  const novoPreco = prompt("Preço do produto:", produto.preco);

  if (!novoNome || !novoPreco) {
    mostrarAviso("Nome e preço são obrigatórios.", "erro");
    return;
  }

  const precoConvertido = Number(String(novoPreco).replace(",", "."));

  if (isNaN(precoConvertido) || precoConvertido < 0) {
    mostrarAviso("Digite um preço válido.", "erro");
    return;
  }

  const produtoAtualizado = {
    ...produto,
    nome: novoNome.trim(),
    descricao: novaDescricao ? novaDescricao.trim() : "",
    preco: precoConvertido,
  };

  try {
    const resposta = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(converterProdutoTelaParaApi(produtoAtualizado)),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(resultado.erro || "Erro ao atualizar produto.", "erro");
      return;
    }

    mostrarAviso("Produto atualizado com sucesso.", "sucesso");

    await renderizarCardapio();
  } catch (error) {
    console.error("Erro ao editar produto:", error);
    mostrarAviso("Erro de conexão ao editar produto.", "erro");
  }
}

async function editarAvisoProduto(id) {
  if (!usuarioEhAdmin()) {
    mostrarAviso("Apenas o administrador pode editar avisos.", "erro");
    return;
  }

  const produtos = carregarProdutos();
  const produto = produtos.find((item) => Number(item.id) === Number(id));

  if (!produto) {
    mostrarAviso("Produto não encontrado.", "erro");
    return;
  }

  const avisoAtual = produto.avisoAdmin || "";

  const novoAviso = prompt(
    "Digite o aviso para o cliente. Exemplo: Estamos sem alface hoje.\n\nPara remover o aviso, deixe em branco e confirme.",
    avisoAtual,
  );

  if (novoAviso === null) return;

  const produtoAtualizado = {
    ...produto,
    avisoAdmin: novoAviso.trim(),
  };

  try {
    const resposta = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(converterProdutoTelaParaApi(produtoAtualizado)),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(resultado.erro || "Erro ao salvar aviso.", "erro");
      return;
    }

    mostrarAviso(
      produtoAtualizado.avisoAdmin
        ? "Aviso atualizado no cardápio."
        : "Aviso removido do produto.",
      "sucesso",
    );

    await renderizarCardapio();
  } catch (error) {
    console.error("Erro ao salvar aviso:", error);
    mostrarAviso("Erro de conexão ao salvar aviso.", "erro");
  }
}

function editarImagemProduto(id) {
  if (!usuarioEhAdmin()) {
    mostrarAviso("Apenas o administrador pode editar imagens.", "erro");
    return;
  }

  const produtos = carregarProdutos();
  const produto = produtos.find((item) => item.id === id);

  if (!produto) return;

  const inputArquivo = document.createElement("input");
  inputArquivo.type = "file";
  inputArquivo.accept = "image/*";

  inputArquivo.addEventListener("change", () => {
    const arquivo = inputArquivo.files[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = () => {
      produto.imagem = leitor.result;

      salvarProdutos(produtos);
      renderizarCardapio();

      mostrarAviso("Imagem atualizada com sucesso!", "sucesso");
    };

    leitor.readAsDataURL(arquivo);
  });

  inputArquivo.click();
}

async function alternarDisponibilidadeProduto(id) {
  if (!usuarioEhAdmin()) {
    mostrarAviso(
      "Apenas o administrador pode alterar a disponibilidade.",
      "erro",
    );
    return;
  }

  const produtos = carregarProdutos();
  const produto = produtos.find((item) => Number(item.id) === Number(id));

  if (!produto) {
    mostrarAviso("Produto não encontrado.", "erro");
    return;
  }

  const produtoAtualizado = {
    ...produto,
    disponivel: produto.disponivel === false,
  };

  if (produtoAtualizado.disponivel === false) {
    produtoAtualizado.quantidade = 0;

    const pedidoAtual = JSON.parse(localStorage.getItem("pedidoAtual")) || [];
    const pedidoAtualAtualizado = pedidoAtual.filter(
      (item) => Number(item.id) !== Number(id),
    );

    localStorage.setItem("pedidoAtual", JSON.stringify(pedidoAtualAtualizado));
  }

  try {
    const resposta = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(converterProdutoTelaParaApi(produtoAtualizado)),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(
        resultado.erro || "Erro ao alterar disponibilidade.",
        "erro",
      );
      return;
    }

    mostrarAviso(
      produtoAtualizado.disponivel
        ? "Produto disponibilizado."
        : "Produto marcado como em falta.",
      "sucesso",
    );

    await renderizarCardapio();
  } catch (error) {
    console.error("Erro ao alterar disponibilidade:", error);
    mostrarAviso("Erro de conexão ao alterar disponibilidade.", "erro");
  }
}
async function excluirProduto(id) {
  if (!usuarioEhAdmin()) {
    mostrarAviso("Apenas o administrador pode excluir produtos.", "erro");
    return;
  }

  const produtos = carregarProdutos();
  const produto = produtos.find((item) => Number(item.id) === Number(id));

  if (!produto) {
    mostrarAviso("Produto não encontrado.", "erro");
    return;
  }

  const confirmar = confirm(
    `Tem certeza que deseja excluir o produto "${produto.nome}"?`,
  );

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(resultado.erro || "Erro ao excluir produto.", "erro");
      return;
    }

    const pedidoAtual = JSON.parse(localStorage.getItem("pedidoAtual")) || [];
    const pedidoAtualAtualizado = pedidoAtual.filter(
      (item) => Number(item.id) !== Number(id),
    );

    localStorage.setItem("pedidoAtual", JSON.stringify(pedidoAtualAtualizado));

    mostrarAviso("Produto excluído com sucesso!", "sucesso");

    await renderizarCardapio();
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    mostrarAviso("Erro de conexão ao excluir produto.", "erro");
  }
}

async function cadastrarProdutoPorCategoria(categoria) {
  if (!usuarioEhAdmin()) {
    mostrarAviso("Apenas o administrador pode cadastrar produtos.", "erro");
    return;
  }

  const tipo = categoria === "bebida" ? "bebida" : "produto";
  const nome = prompt(`Nome do novo ${tipo}:`);

  if (!nome || nome.trim() === "") {
    mostrarAviso("O nome é obrigatório.", "erro");
    return;
  }

  const descricao = prompt("Descrição:") || "";

  const preco = prompt("Preço. Exemplo: 15,00");

  if (!preco || preco.trim() === "") {
    mostrarAviso("O preço é obrigatório.", "erro");
    return;
  }

  const precoConvertido = Number(preco.replace(",", "."));

  if (isNaN(precoConvertido) || precoConvertido <= 0) {
    mostrarAviso("Digite um preço válido.", "erro");
    return;
  }

  try {
    const resposta = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nome.trim(),
        description: descricao.trim(),
        price: precoConvertido,
        category: categoria,
        image_url: "",
        available: true,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(resultado.erro || "Erro ao cadastrar produto.", "erro");
      return;
    }

    mostrarAviso(
      "Item cadastrado com sucesso! Agora você pode editar a imagem dele.",
      "sucesso",
    );

    await renderizarCardapio();
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    mostrarAviso("Erro de conexão ao cadastrar produto.", "erro");
  }
}

function cadastrarNovoLanche() {
  cadastrarProdutoPorCategoria("lanche");
}

function cadastrarNovaBebida() {
  cadastrarProdutoPorCategoria("bebida");
}

function cadastrarNovoProduto() {
  cadastrarNovoLanche();
}
async function avancarPedido() {
  try {
    await carregarConfiguracoesLojaDaApi();
  } catch (erro) {
    console.error("Erro ao verificar status da loja:", erro);
  }

  if (typeof lojaEstaAberta === "function" && !lojaEstaAberta()) {
    mostrarAviso(
      "A loja está fechada no momento. Não é possível fazer pedido agora.",
      "erro",
    );
    return;
  }

  const totalTexto =
    document.getElementById("valorTotal")?.textContent || "R$ 0,00";

  const totalNumerico = Number(
    totalTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
  );

  if (!totalNumerico || totalNumerico <= 0) {
    alert("Escolha pelo menos um item antes de avançar.");
    return;
  }

  window.location.href = "finalizar-pedido.html";
}

function sairDoSistema() {
  limparPedidoEmAndamento();
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("tipoUsuario");
  localStorage.removeItem("nomeUsuario");

  window.location.href = "login.html";
}

/* =========================
   PERFIL DA LOJA
========================= */

const perfilLojaPadrao = {
  nome: "ClickBus Burguer",
  categoria: "Hamburgueria",
  endereco: "Avenida Ulisses Guimarães, centro. Em frente a praça central.",
  localizacaoLoja: "-12.539266,-49.928513",
  telefone: "63 999544551",
  horario: "18:30 às 23:30",
  dias: "Segunda à Domingo",
  tituloCompartilhamento:
    "ClickBus Burguer | Delivery em Sandolândia | Pedido online",
  cidadeEntrega: "Sandolândia",
  linkPublicado: "",
  mensagemCliente:
    "🍔 Olha essa hamburgueria aqui: ClickBus Burguer!\n\nDá para fazer pedido pelo cardápio online.",
  mensagemAdmin:
    "🍔 ClickBus Burguer | Delivery em Sandolândia\n\nFaça seu pedido pelo cardápio digital e receba no conforto da sua casa.",
};

const CHAVE_DIVULGACAO_LOJA = "clickbus_divulgacao_loja";

let configuracoesLojaCache = {
  store_name: perfilLojaPadrao.nome,
  category: perfilLojaPadrao.categoria,
  address: perfilLojaPadrao.endereco,
  location: perfilLojaPadrao.localizacaoLoja,
  phone: perfilLojaPadrao.telefone,
  opening_hours: perfilLojaPadrao.horario,
  business_days: perfilLojaPadrao.dias,
  manual_status: "auto",
  updated_at: null,
};

function carregarDivulgacaoLojaLocal() {
  try {
    return {
      tituloCompartilhamento: perfilLojaPadrao.tituloCompartilhamento,
      cidadeEntrega: perfilLojaPadrao.cidadeEntrega,
      linkPublicado: perfilLojaPadrao.linkPublicado,
      mensagemCliente: perfilLojaPadrao.mensagemCliente,
      mensagemAdmin: perfilLojaPadrao.mensagemAdmin,
      ...(JSON.parse(localStorage.getItem(CHAVE_DIVULGACAO_LOJA) || "{}") ||
        {}),
    };
  } catch (error) {
    console.warn("Erro ao carregar divulgação local:", error);
    return {
      tituloCompartilhamento: perfilLojaPadrao.tituloCompartilhamento,
      cidadeEntrega: perfilLojaPadrao.cidadeEntrega,
      linkPublicado: perfilLojaPadrao.linkPublicado,
      mensagemCliente: perfilLojaPadrao.mensagemCliente,
      mensagemAdmin: perfilLojaPadrao.mensagemAdmin,
    };
  }
}

function salvarDivulgacaoLojaLocal(dados) {
  const divulgacaoAtual = carregarDivulgacaoLojaLocal();
  const divulgacaoAtualizada = {
    ...divulgacaoAtual,
    tituloCompartilhamento:
      dados.tituloCompartilhamento ?? divulgacaoAtual.tituloCompartilhamento,
    cidadeEntrega: dados.cidadeEntrega ?? divulgacaoAtual.cidadeEntrega,
    linkPublicado: dados.linkPublicado ?? divulgacaoAtual.linkPublicado,
    mensagemCliente: dados.mensagemCliente ?? divulgacaoAtual.mensagemCliente,
    mensagemAdmin: dados.mensagemAdmin ?? divulgacaoAtual.mensagemAdmin,
  };

  localStorage.setItem(
    CHAVE_DIVULGACAO_LOJA,
    JSON.stringify(divulgacaoAtualizada),
  );

  return divulgacaoAtualizada;
}

function atualizarCacheConfiguracoesLoja(configuracoes = {}) {
  configuracoesLojaCache = {
    store_name:
      configuracoes.store_name ??
      configuracoesLojaCache.store_name ??
      perfilLojaPadrao.nome,
    category:
      configuracoes.category ??
      configuracoesLojaCache.category ??
      perfilLojaPadrao.categoria,
    address:
      configuracoes.address ??
      configuracoesLojaCache.address ??
      perfilLojaPadrao.endereco,
    location:
      configuracoes.location ??
      configuracoesLojaCache.location ??
      perfilLojaPadrao.localizacaoLoja,
    phone:
      configuracoes.phone ??
      configuracoesLojaCache.phone ??
      perfilLojaPadrao.telefone,
    opening_hours:
      configuracoes.opening_hours ??
      configuracoesLojaCache.opening_hours ??
      perfilLojaPadrao.horario,
    business_days:
      configuracoes.business_days ??
      configuracoesLojaCache.business_days ??
      perfilLojaPadrao.dias,
    manual_status:
      configuracoes.manual_status ??
      configuracoesLojaCache.manual_status ??
      "auto",
    updated_at:
      configuracoes.updated_at ?? configuracoesLojaCache.updated_at ?? null,
  };

  return configuracoesLojaCache;
}

async function carregarConfiguracoesLojaDaApi() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/store`);

    if (!resposta.ok) {
      throw new Error("Erro ao buscar configurações da loja.");
    }

    const configuracoes = await resposta.json();
    return atualizarCacheConfiguracoesLoja(configuracoes);
  } catch (error) {
    console.error("Erro ao carregar configurações da loja:", error);
    return configuracoesLojaCache;
  }
}

async function salvarConfiguracoesLojaNaApi(novasConfiguracoes) {
  const resposta = await fetch(`${API_BASE_URL}/store`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(novasConfiguracoes),
  });

  let resultado = null;

  try {
    resultado = await resposta.json();
  } catch (error) {
    resultado = null;
  }

  if (!resposta.ok) {
    console.error("Erro retornado pela API da loja:", resultado);
    throw new Error(
      resultado?.erro ||
        resultado?.detalhe ||
        `Erro ao salvar configurações da loja. Status: ${resposta.status}`,
    );
  }

  const settings = resultado?.settings || resultado || {};
  return atualizarCacheConfiguracoesLoja(settings);
}

function salvarPerfilLojaLocal(perfilAtualizado) {
  atualizarCacheConfiguracoesLoja({
    store_name: perfilAtualizado.nome,
    category: perfilAtualizado.categoria,
    address: perfilAtualizado.endereco,
    location: perfilAtualizado.localizacaoLoja,
    phone: perfilAtualizado.telefone,
    opening_hours: perfilAtualizado.horario,
    business_days: perfilAtualizado.dias,
  });

  salvarDivulgacaoLojaLocal({
    tituloCompartilhamento: perfilAtualizado.tituloCompartilhamento,
    cidadeEntrega: perfilAtualizado.cidadeEntrega,
    linkPublicado: perfilAtualizado.linkPublicado,
    mensagemCliente: perfilAtualizado.mensagemCliente,
    mensagemAdmin: perfilAtualizado.mensagemAdmin,
  });
}

function carregarPerfilLoja() {
  const divulgacao = carregarDivulgacaoLojaLocal();

  return {
    nome: configuracoesLojaCache.store_name || perfilLojaPadrao.nome,
    categoria: configuracoesLojaCache.category || perfilLojaPadrao.categoria,
    endereco: configuracoesLojaCache.address || perfilLojaPadrao.endereco,
    localizacaoLoja:
      configuracoesLojaCache.location || perfilLojaPadrao.localizacaoLoja,
    telefone: configuracoesLojaCache.phone || perfilLojaPadrao.telefone,
    horario: configuracoesLojaCache.opening_hours || perfilLojaPadrao.horario,
    dias: configuracoesLojaCache.business_days || perfilLojaPadrao.dias,
    tituloCompartilhamento: divulgacao.tituloCompartilhamento,
    cidadeEntrega: divulgacao.cidadeEntrega,
    linkPublicado: divulgacao.linkPublicado,
    mensagemCliente: divulgacao.mensagemCliente,
    mensagemAdmin: divulgacao.mensagemAdmin,
  };
}

function controlarVisualPerfilLoja() {
  const admin = usuarioEhAdmin();

  document.querySelectorAll(".area-admin-perfil").forEach((area) => {
    area.style.display = admin ? "" : "none";
  });

  const perfilCliente = document.getElementById("perfilLojaCliente");

  if (perfilCliente) {
    perfilCliente.style.display = "";
  }
}

function obterStatusManualLoja() {
  return configuracoesLojaCache.manual_status || "auto";
}

function lojaEstaAbertaPeloHorario() {
  const horario =
    configuracoesLojaCache.opening_hours || perfilLojaPadrao.horario;

  const horarios = horario.match(/\d{1,2}:\d{2}/g);

  if (!horarios || horarios.length < 2) {
    return false;
  }

  const [horaAbertura, horaFechamento] = horarios;
  const agora = new Date();
  const horaAtual = agora.getHours() * 60 + agora.getMinutes();

  const [aberturaHora, aberturaMinuto] = horaAbertura.split(":").map(Number);
  const [fechamentoHora, fechamentoMinuto] = horaFechamento
    .split(":")
    .map(Number);

  const abertura = aberturaHora * 60 + aberturaMinuto;
  const fechamento = fechamentoHora * 60 + fechamentoMinuto;

  if (abertura === fechamento) return true;

  if (abertura < fechamento) {
    return horaAtual >= abertura && horaAtual <= fechamento;
  }

  return horaAtual >= abertura || horaAtual <= fechamento;
}

function lojaEstaAberta() {
  const statusManual = obterStatusManualLoja();

  if (statusManual === "aberta") return true;
  if (statusManual === "fechada") return false;

  return lojaEstaAbertaPeloHorario();
}

function formatarHorarioAtualizacaoLoja() {
  if (!configuracoesLojaCache.updated_at) return "";

  const data = new Date(configuracoesLojaCache.updated_at);

  if (Number.isNaN(data.getTime())) return "";

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obterTextoHorarioFuncionamento() {
  const statusManual = obterStatusManualLoja();
  const horarioAlteracao = formatarHorarioAtualizacaoLoja();

  if (statusManual === "aberta") {
    return horarioAlteracao
      ? `Aberta manualmente às ${horarioAlteracao}`
      : "Aberta manualmente";
  }

  if (statusManual === "fechada") {
    return horarioAlteracao
      ? `Fechada manualmente às ${horarioAlteracao}`
      : "Fechada manualmente";
  }

  return configuracoesLojaCache.opening_hours || perfilLojaPadrao.horario;
}

function atualizarHorarioFuncionamento() {
  const elementosHorario = document.querySelectorAll("[data-horario-loja]");
  const horario = obterTextoHorarioFuncionamento();

  elementosHorario.forEach((elemento) => {
    elemento.textContent = horario;
  });
}

function aplicarVisualStatusLoja(aberta) {
  const elementosStatus = document.querySelectorAll(
    "[data-status-loja], #statusLoja",
  );

  elementosStatus.forEach((statusLoja) => {
    statusLoja.textContent = aberta ? "Aberto" : "Fechado";
    statusLoja.classList.toggle("aberto", aberta);
    statusLoja.classList.toggle("fechado", !aberta);
  });
}

async function verificarStatusLoja() {
  const elementosStatus = document.querySelectorAll(
    "[data-status-loja], #statusLoja",
  );
  const elementosHorario = document.querySelectorAll("[data-horario-loja]");

  if (!elementosStatus.length && !elementosHorario.length) return;

  await carregarConfiguracoesLojaDaApi();
  atualizarHorarioFuncionamento();

  const aberta = lojaEstaAberta();
  aplicarVisualStatusLoja(aberta);

  const btnAlternarStatusLoja = document.getElementById(
    "btnAlternarStatusLoja",
  );

  if (btnAlternarStatusLoja) {
    if (usuarioEhAdmin()) {
      btnAlternarStatusLoja.classList.remove("oculto");
      const statusManual = obterStatusManualLoja();

      if (statusManual === "auto") {
        btnAlternarStatusLoja.textContent = aberta
          ? "Fechar manualmente"
          : "Abrir manualmente";
      } else if (statusManual === "aberta") {
        btnAlternarStatusLoja.textContent = "Fechar manualmente";
      } else {
        btnAlternarStatusLoja.textContent = "Voltar para automático";
      }
    } else {
      btnAlternarStatusLoja.classList.add("oculto");
    }
  }
}

function iniciarAtualizacaoStatusLoja() {
  verificarStatusLoja();

  setInterval(() => {
    verificarStatusLoja();
  }, 15000);
}

async function alternarStatusManualLoja() {
  if (!usuarioEhAdmin()) {
    mostrarAviso(
      "Apenas o administrador pode alterar o status da loja.",
      "erro",
    );
    return;
  }

  const statusAtual = obterStatusManualLoja();

  let novoStatus = "auto";

  if (statusAtual === "auto") {
    novoStatus = lojaEstaAbertaPeloHorario() ? "fechada" : "aberta";
  } else if (statusAtual === "aberta") {
    novoStatus = "fechada";
  } else if (statusAtual === "fechada") {
    novoStatus = "auto";
  }

  try {
    await salvarConfiguracoesLojaNaApi({
      manual_status: novoStatus,
    });

    await verificarStatusLoja();

    const mensagens = {
      auto: "Loja voltou para o modo automático.",
      aberta: "Loja aberta manualmente.",
      fechada: "Loja fechada manualmente.",
    };

    mostrarAviso(mensagens[novoStatus], "sucesso");
  } catch (error) {
    console.error("Erro ao alterar status da loja:", error);
    mostrarAviso("Erro ao alterar status da loja.", "erro");
  }
}

function obterDestinoRotaLoja() {
  const perfil = carregarPerfilLoja();
  return (perfil.localizacaoLoja || perfil.endereco || "").trim();
}

function abrirRotaLojaGoogleMaps() {
  const destino = obterDestinoRotaLoja();

  if (!destino) {
    mostrarAviso(
      "Cadastre a localização ou endereço da loja primeiro.",
      "erro",
    );
    return;
  }

  window.open(obterLinkGoogleMapsRota(destino), "_blank");
}

function abrirRotaLojaWaze() {
  const destino = obterDestinoRotaLoja();

  if (!destino) {
    mostrarAviso(
      "Cadastre a localização ou endereço da loja primeiro.",
      "erro",
    );
    return;
  }

  window.open(obterLinkWaze(destino), "_blank");
}

function configurarEdicaoPerfilClienteAdmin() {
  const admin = usuarioEhAdmin();

  document.querySelectorAll(".perfil-loja-cliente span").forEach((span) => {
    span.classList.toggle("oculto", admin);
  });

  document.querySelectorAll(".input-perfil-cliente").forEach((input) => {
    input.classList.toggle("oculto", !admin);
  });

  const btnSalvar = document.getElementById("btnSalvarPerfilCliente");

  if (btnSalvar) {
    btnSalvar.classList.toggle("oculto", !admin);
  }
}

function preencherPerfilLojaCliente() {
  const nomeLoja = document.getElementById("nomeLoja")?.value || "";
  const categoriaLoja = document.getElementById("categoriaLoja")?.value || "";
  const enderecoLoja = document.getElementById("enderecoLoja")?.value || "";
  const telefoneLoja = document.getElementById("telefoneLoja")?.value || "";
  const horarioLoja = document.getElementById("horarioLoja")?.value || "";
  const diasLoja = document.getElementById("diasLoja")?.value || "";

  const dados = [
    ["clienteNomeLoja", "clienteNomeLojaInput", nomeLoja],
    ["clienteCategoriaLoja", "clienteCategoriaLojaInput", categoriaLoja],
    ["clienteEnderecoLoja", "clienteEnderecoLojaInput", enderecoLoja],
    ["clienteTelefoneLoja", "clienteTelefoneLojaInput", telefoneLoja],
    ["clienteHorarioLoja", "clienteHorarioLojaInput", horarioLoja],
    ["clienteDiasLoja", "clienteDiasLojaInput", diasLoja],
  ];

  dados.forEach(([spanId, inputId, valor]) => {
    const span = document.getElementById(spanId);
    const input = document.getElementById(inputId);

    if (span) span.textContent = valor;
    if (input) input.value = valor;
  });

  configurarEdicaoPerfilClienteAdmin();
}

async function preencherPerfilLoja() {
  const nomeLoja = document.getElementById("nomeLoja");
  const categoriaLoja = document.getElementById("categoriaLoja");
  const enderecoLoja = document.getElementById("enderecoLoja");
  const localizacaoLoja = document.getElementById("localizacaoLoja");
  const acoesLocalizacaoLoja = document.getElementById("acoesLocalizacaoLoja");
  const telefoneLoja = document.getElementById("telefoneLoja");
  const horarioLoja = document.getElementById("horarioLoja");
  const diasLoja = document.getElementById("diasLoja");
  const tituloCompartilhamentoLoja = document.getElementById(
    "tituloCompartilhamentoLoja",
  );
  const cidadeEntregaLoja = document.getElementById("cidadeEntregaLoja");
  const linkPublicadoLoja = document.getElementById("linkPublicadoLoja");
  const mensagemClienteLoja = document.getElementById("mensagemClienteLoja");
  const mensagemAdminLoja = document.getElementById("mensagemAdminLoja");
  const areaDivulgacaoLoja = document.getElementById("areaDivulgacaoLoja");
  const btnSalvar = document.getElementById("btnSalvarPerfilLoja");
  const btnSalvarDivulgacao = document.getElementById(
    "btnSalvarDivulgacaoLoja",
  );

  if (
    !nomeLoja ||
    !categoriaLoja ||
    !enderecoLoja ||
    !telefoneLoja ||
    !horarioLoja ||
    !diasLoja
  ) {
    return;
  }

  await carregarConfiguracoesLojaDaApi();

  const perfil = carregarPerfilLoja();

  nomeLoja.value = perfil.nome;
  categoriaLoja.value = perfil.categoria;
  enderecoLoja.value = perfil.endereco;

  if (localizacaoLoja) {
    localizacaoLoja.value = perfil.localizacaoLoja || "";
  }

  telefoneLoja.value = perfil.telefone;
  horarioLoja.value = perfil.horario;
  diasLoja.value = perfil.dias;

  if (tituloCompartilhamentoLoja) {
    tituloCompartilhamentoLoja.value = perfil.tituloCompartilhamento || "";
  }

  if (cidadeEntregaLoja) {
    cidadeEntregaLoja.value = perfil.cidadeEntrega || "";
  }

  if (linkPublicadoLoja) {
    linkPublicadoLoja.value = perfil.linkPublicado || "";
  }

  if (mensagemClienteLoja) {
    mensagemClienteLoja.value = perfil.mensagemCliente || "";
  }

  if (mensagemAdminLoja) {
    mensagemAdminLoja.value = perfil.mensagemAdmin || "";
  }

  const admin = usuarioEhAdmin();

  if (areaDivulgacaoLoja) {
    areaDivulgacaoLoja.classList.toggle("oculto", !admin);
  }

  if (acoesLocalizacaoLoja) {
    const destinoLoja = (
      perfil.localizacaoLoja ||
      perfil.endereco ||
      ""
    ).trim();

    acoesLocalizacaoLoja.classList.toggle("oculto", !destinoLoja);
  }

  const campos = [
    nomeLoja,
    categoriaLoja,
    enderecoLoja,
    localizacaoLoja,
    telefoneLoja,
    horarioLoja,
    diasLoja,
    tituloCompartilhamentoLoja,
    cidadeEntregaLoja,
    linkPublicadoLoja,
    mensagemClienteLoja,
    mensagemAdminLoja,
  ].filter(Boolean);

  campos.forEach((campo) => {
    campo.readOnly = !admin;

    if (admin) {
      campo.classList.add("editavel");
    } else {
      campo.classList.remove("editavel");
    }
  });

  if (btnSalvar) {
    btnSalvar.classList.toggle("oculto", !admin);
  }

  if (btnSalvarDivulgacao) {
    btnSalvarDivulgacao.classList.toggle("oculto", !admin);
  }

  preencherPerfilLojaCliente();
  controlarVisualPerfilLoja();
}

async function salvarPerfilLojaPelaAreaCliente() {
  if (!usuarioEhAdmin()) {
    mostrarAviso(
      "Apenas o administrador pode alterar o perfil da loja.",
      "erro",
    );
    return;
  }

  const nomeLoja = document.getElementById("nomeLoja");
  const categoriaLoja = document.getElementById("categoriaLoja");
  const enderecoLoja = document.getElementById("enderecoLoja");
  const telefoneLoja = document.getElementById("telefoneLoja");
  const horarioLoja = document.getElementById("horarioLoja");
  const diasLoja = document.getElementById("diasLoja");

  if (nomeLoja) {
    nomeLoja.value =
      document.getElementById("clienteNomeLojaInput")?.value.trim() || "";
  }

  if (categoriaLoja) {
    categoriaLoja.value =
      document.getElementById("clienteCategoriaLojaInput")?.value.trim() || "";
  }

  if (enderecoLoja) {
    enderecoLoja.value =
      document.getElementById("clienteEnderecoLojaInput")?.value.trim() || "";
  }

  if (telefoneLoja) {
    telefoneLoja.value =
      document.getElementById("clienteTelefoneLojaInput")?.value.trim() || "";
  }

  if (horarioLoja) {
    horarioLoja.value =
      document.getElementById("clienteHorarioLojaInput")?.value.trim() || "";
  }

  if (diasLoja) {
    diasLoja.value =
      document.getElementById("clienteDiasLojaInput")?.value.trim() || "";
  }

  const eventoFake = {
    preventDefault() {},
  };

  await salvarPerfilLoja(eventoFake, "Informações da loja salvas com sucesso.");
}

async function salvarPerfilLoja(
  event,
  mensagemSucesso = "Perfil da loja salvo com sucesso.",
) {
  event.preventDefault();

  if (!usuarioEhAdmin()) {
    mostrarAviso(
      "Apenas o administrador pode alterar o perfil da loja.",
      "erro",
    );
    return;
  }

  const nomeLoja = document.getElementById("nomeLoja")?.value.trim() || "";
  const categoriaLoja =
    document.getElementById("categoriaLoja")?.value.trim() || "";
  const enderecoLoja =
    document.getElementById("enderecoLoja")?.value.trim() || "";
  const localizacaoLoja = normalizarLocalizacao(
    document.getElementById("localizacaoLoja")?.value.trim() || "",
  );
  const telefoneLoja =
    document.getElementById("telefoneLoja")?.value.trim() || "";
  const horarioLoja =
    document.getElementById("horarioLoja")?.value.trim() || "";
  const diasLoja = document.getElementById("diasLoja")?.value.trim() || "";

  const perfilAtual = carregarPerfilLoja();

  if (
    !nomeLoja ||
    !categoriaLoja ||
    !enderecoLoja ||
    !telefoneLoja ||
    !horarioLoja ||
    !diasLoja
  ) {
    mostrarAviso("Preencha os dados principais da loja.", "erro");
    return;
  }

  try {
    await salvarConfiguracoesLojaNaApi({
      store_name: nomeLoja,
      category: categoriaLoja,
      address: enderecoLoja,
      location: localizacaoLoja,
      phone: telefoneLoja,
      opening_hours: horarioLoja,
      business_days: diasLoja,
    });
  } catch (error) {
    console.error("Erro real ao salvar no servidor:", error);
    mostrarAviso("Erro ao salvar perfil da loja no servidor.", "erro");
    return;
  }

  const perfilAtualizado = {
    ...perfilAtual,
    nome: nomeLoja,
    categoria: categoriaLoja,
    endereco: enderecoLoja,
    localizacaoLoja,
    telefone: telefoneLoja,
    horario: horarioLoja,
    dias: diasLoja,
    tituloCompartilhamento:
      document.getElementById("tituloCompartilhamentoLoja")?.value.trim() ||
      perfilAtual.tituloCompartilhamento,
    cidadeEntrega:
      document.getElementById("cidadeEntregaLoja")?.value.trim() ||
      perfilAtual.cidadeEntrega,
    linkPublicado:
      document.getElementById("linkPublicadoLoja")?.value.trim() ||
      perfilAtual.linkPublicado,
    mensagemCliente:
      document.getElementById("mensagemClienteLoja")?.value.trim() ||
      perfilAtual.mensagemCliente,
    mensagemAdmin:
      document.getElementById("mensagemAdminLoja")?.value.trim() ||
      perfilAtual.mensagemAdmin,
  };

  salvarPerfilLojaLocal(perfilAtualizado);

  if (typeof preencherPerfilLojaCliente === "function") {
    preencherPerfilLojaCliente();
  }

  if (typeof atualizarPaginaCompartilhar === "function") {
    atualizarPaginaCompartilhar();
  }

  try {
    if (typeof verificarStatusLoja === "function") {
      await verificarStatusLoja();
    }
  } catch (error) {
    console.warn(
      "Perfil salvo, mas houve erro ao atualizar status da loja:",
      error,
    );
  }

  mostrarAviso(mensagemSucesso, "sucesso");
}

function salvarDivulgacaoLoja(event) {
  event.preventDefault();

  if (!usuarioEhAdmin()) {
    mostrarAviso("Apenas o administrador pode alterar a divulgação.", "erro");
    return;
  }

  const perfilAtual = carregarPerfilLoja();

  const perfilAtualizado = {
    ...perfilAtual,
    tituloCompartilhamento:
      document.getElementById("tituloCompartilhamentoLoja")?.value.trim() ||
      perfilAtual.tituloCompartilhamento,
    cidadeEntrega:
      document.getElementById("cidadeEntregaLoja")?.value.trim() ||
      perfilAtual.cidadeEntrega,
    linkPublicado:
      document.getElementById("linkPublicadoLoja")?.value.trim() || "",
    mensagemCliente:
      document.getElementById("mensagemClienteLoja")?.value.trim() ||
      perfilAtual.mensagemCliente,
    mensagemAdmin:
      document.getElementById("mensagemAdminLoja")?.value.trim() ||
      perfilAtual.mensagemAdmin,
  };

  salvarPerfilLojaLocal(perfilAtualizado);

  if (typeof atualizarPaginaCompartilhar === "function") {
    atualizarPaginaCompartilhar();
  }

  mostrarAviso("Divulgação salva com sucesso.", "sucesso");
}

function atualizarPaginaCompartilhar() {
  const perfil = carregarPerfilLoja();

  const seloCompartilhar = document.getElementById("seloCompartilhar");
  const tituloCompartilhar = document.getElementById("tituloCompartilhar");
  const descricaoCompartilhar = document.getElementById(
    "descricaoCompartilhar",
  );
  const mensagemCompartilhar = document.getElementById("mensagemCompartilhar");
  const linkLojaCompartilhar = document.getElementById("linkLojaCompartilhar");
  const btnPedirAgoraCompartilhar = document.getElementById(
    "btnPedirAgoraCompartilhar",
  );

  if (!tituloCompartilhar && !descricaoCompartilhar && !mensagemCompartilhar) {
    return;
  }

  if (seloCompartilhar) {
    seloCompartilhar.textContent = "Divulgue a loja";
  }

  if (tituloCompartilhar) {
    tituloCompartilhar.textContent =
      perfil.tituloCompartilhamento ||
      `${perfil.nome} | Delivery em ${perfil.cidadeEntrega || "sua cidade"}`;
  }

  if (descricaoCompartilhar) {
    descricaoCompartilhar.innerHTML = `
      Faça seu pedido online agora mesmo no ${perfil.nome}!<br />
      Seu delivery em ${perfil.cidadeEntrega || "sua cidade"}.
      Acesse a loja através do cardápio digital web.
    `;
  }

  if (mensagemCompartilhar) {
    mensagemCompartilhar.textContent =
      perfil.mensagemCliente ||
      `🍔 ${perfil.nome}. Peça pelo cardápio digital.`;
  }

  const linkFinal = perfil.linkPublicado || "cardapio.html";

  if (linkLojaCompartilhar) {
    linkLojaCompartilhar.textContent = linkFinal;
  }

  if (btnPedirAgoraCompartilhar) {
    btnPedirAgoraCompartilhar.href = linkFinal;
  }
}

/* =========================
   CARRINHO
========================= */

function carregarPedidoAtual() {
  return JSON.parse(localStorage.getItem("pedidoAtual")) || [];
}

function salvarPedidoAtual(pedido) {
  localStorage.setItem("pedidoAtual", JSON.stringify(pedido));
}

function renderizarCarrinho() {
  const listaCarrinho = document.getElementById("listaCarrinho");
  const valorTotalCarrinho = document.getElementById("valorTotalCarrinho");
  const totalProdutosCarrinho = document.getElementById(
    "totalProdutosCarrinho",
  );

  if (!listaCarrinho || !valorTotalCarrinho || !totalProdutosCarrinho) return;

  if (usuarioEhAdmin()) {
    mostrarAviso(
      "Administrador não realiza pedido. Use a área de pedidos para acompanhar os clientes.",
      "erro",
    );
    window.location.href = "cardapio.html";
    return;
  }

  const pedido = carregarPedidoAtual();

  listaCarrinho.innerHTML = "";

  if (pedido.length === 0) {
    listaCarrinho.innerHTML = `
      <p class="mensagem-vazio">Seu carrinho está vazio.</p>
    `;

    valorTotalCarrinho.textContent = "R$ 0,00";
    totalProdutosCarrinho.textContent = "00";
    return;
  }

  pedido.forEach((item) => {
    const linha = document.createElement("div");
    linha.className = "item-carrinho";

    linha.innerHTML = `
      <div class="nome-item">
        <span class="check-item">✓</span>
        <div class="texto-item-carrinho">
          <span>${item.nome}</span>
          ${
            item.observacao
              ? `<small class="observacao-carrinho">Obs: ${item.observacao}</small>`
              : ""
          }
        </div>
      </div>

      <div class="preco-item">
        ${formatarMoeda(Number(item.preco) || 0)}
      </div>

      <div class="controle-carrinho">
        <button
          type="button"
          class="btn-remover"
          onclick="diminuirItemCarrinho(${item.id})"
        >
          🗑
        </button>

        <span>${Number(item.quantidade) || 0}</span>

        <button type="button" onclick="aumentarItemCarrinho(${item.id})">
          ＋
        </button>
      </div>
    `;

    listaCarrinho.appendChild(linha);
  });

  atualizarResumoCarrinho();
}

function atualizarResumoCarrinho() {
  const pedido = carregarPedidoAtual();

  const totalValor = pedido.reduce((soma, item) => {
    return soma + (Number(item.preco) || 0) * (Number(item.quantidade) || 0);
  }, 0);

  const totalProdutos = pedido.reduce((soma, item) => {
    return soma + (Number(item.quantidade) || 0);
  }, 0);

  const valorTotalCarrinho = document.getElementById("valorTotalCarrinho");
  const totalProdutosCarrinho = document.getElementById(
    "totalProdutosCarrinho",
  );

  if (valorTotalCarrinho) {
    valorTotalCarrinho.textContent = formatarMoeda(totalValor);
  }

  if (totalProdutosCarrinho) {
    totalProdutosCarrinho.textContent = String(totalProdutos).padStart(2, "0");
  }
}

function aumentarItemCarrinho(id) {
  const pedido = carregarPedidoAtual();
  const item = pedido.find((produto) => produto.id === id);

  if (!item) return;

  item.quantidade = Number(item.quantidade) || 0;
  item.quantidade += 1;

  salvarPedidoAtual(pedido);
  sincronizarPedidoComProdutos(pedido);
  renderizarCarrinho();
}

function diminuirItemCarrinho(id) {
  const pedido = carregarPedidoAtual();
  const item = pedido.find((produto) => produto.id === id);

  if (!item) return;

  item.quantidade = Number(item.quantidade) || 0;
  item.quantidade -= 1;

  let pedidoAtualizado = pedido;

  if (item.quantidade <= 0) {
    pedidoAtualizado = pedido.filter((produto) => produto.id !== id);
    limparObservacaoPedidoProduto(id);
  }

  salvarPedidoAtual(pedidoAtualizado);
  sincronizarPedidoComProdutos(pedidoAtualizado);
  renderizarCarrinho();
}

function limparCarrinho() {
  const confirmar = confirm("Deseja limpar todo o carrinho?");

  if (!confirmar) return;

  localStorage.removeItem("pedidoAtual");
  localStorage.removeItem("observacoesPedidoAtual");

  const produtos = carregarProdutos();

  produtos.forEach((produto) => {
    produto.quantidade = 0;
  });

  salvarProdutos(produtos);
  renderizarCarrinho();
}

function sincronizarPedidoComProdutos(pedido) {
  const produtos = carregarProdutos();

  produtos.forEach((produto) => {
    const itemPedido = pedido.find((item) => item.id === produto.id);
    produto.quantidade = itemPedido ? Number(itemPedido.quantidade) || 0 : 0;
  });

  salvarProdutos(produtos);
}

function avancarCarrinho() {
  if (bloquearPedidoParaAdmin()) return;

  const pedido = carregarPedidoAtual();

  if (pedido.length === 0) {
    mostrarAviso("Seu carrinho está vazio.", "erro");
    return;
  }

  window.location.href = "finalizar-pedido.html";
}

/* =========================
   FINALIZAÇÃO DO PEDIDO
========================= */

function carregarFinalizacaoPedido() {
  const nomeEntrega = document.getElementById("nomeEntrega");
  const telefoneEntrega = document.getElementById("telefoneEntrega");
  const enderecoCadastroEntrega = document.getElementById(
    "enderecoCadastroEntrega",
  );
  const enderecoTemporarioEntrega = document.getElementById(
    "enderecoTemporarioEntrega",
  );
  const opcaoEnderecoTemporario = document.getElementById(
    "opcaoEnderecoTemporario",
  );
  const radioEnderecoCadastro = document.querySelector(
    'input[name="formaRecebimento"][value="entregaCadastro"]',
  );
  const radioEnderecoTemporario = document.querySelector(
    'input[name="formaRecebimento"][value="entregaTemporario"]',
  );
  const btnEditarEnderecoUsuario = document.getElementById(
    "btnEditarEnderecoUsuario",
  );
  const totalProdutosFinal = document.getElementById("totalProdutosFinal");
  const valorTotalFinal = document.getElementById("valorTotalFinal");

  if (
    !nomeEntrega ||
    !telefoneEntrega ||
    !enderecoCadastroEntrega ||
    !totalProdutosFinal ||
    !valorTotalFinal
  ) {
    return;
  }

  if (usuarioEhAdmin()) {
    mostrarAviso(
      "Administrador não finaliza pedido. Entre como cliente para testar uma compra.",
      "erro",
    );
    window.location.href = "cardapio.html";
    return;
  }

  const pedido = carregarPedidoAtual();

  const nomeSalvo =
    localStorage.getItem("nomeEntrega") ||
    localStorage.getItem("nomeUsuario") ||
    "Cliente";

  const telefoneSalvo =
    localStorage.getItem("telefoneEntrega") ||
    localStorage.getItem("telefoneUsuario") ||
    "(63) 99999-9999";

  const enderecoPadrao =
    localStorage.getItem("enderecoUsuario") ||
    "Rua 01 Número 1132 Setor Oeste\nSandolândia - TO";
  const enderecoTemporario = localStorage.getItem("enderecoEntrega");

  nomeEntrega.textContent = nomeSalvo;
  telefoneEntrega.textContent = telefoneSalvo;
  enderecoCadastroEntrega.innerHTML = enderecoPadrao.replace(/\n/g, "<br>");

  if (
    enderecoTemporario &&
    opcaoEnderecoTemporario &&
    enderecoTemporarioEntrega
  ) {
    opcaoEnderecoTemporario.classList.remove("oculto");
    enderecoTemporarioEntrega.innerHTML = enderecoTemporario.replace(
      /\n/g,
      "<br>",
    );

    if (radioEnderecoTemporario) {
      radioEnderecoTemporario.checked = true;
    }
  } else {
    if (opcaoEnderecoTemporario) {
      opcaoEnderecoTemporario.classList.add("oculto");
    }

    if (radioEnderecoCadastro) {
      radioEnderecoCadastro.checked = true;
    }
  }

  if (btnEditarEnderecoUsuario) {
    btnEditarEnderecoUsuario.hidden = false;
  }

  const totalProdutos = pedido.reduce((soma, item) => {
    return soma + (Number(item.quantidade) || 0);
  }, 0);

  const totalValor = pedido.reduce((soma, item) => {
    return soma + (Number(item.preco) || 0) * (Number(item.quantidade) || 0);
  }, 0);

  totalProdutosFinal.textContent = String(totalProdutos).padStart(2, "0");
  valorTotalFinal.textContent = formatarMoeda(totalValor);
}

function trocarCliente() {
  const nomeAtual =
    localStorage.getItem("nomeEntrega") ||
    localStorage.getItem("nomeUsuario") ||
    "Cliente";

  const telefoneAtual =
    localStorage.getItem("telefoneEntrega") ||
    localStorage.getItem("telefoneUsuario") ||
    "(63) 99999-9999";

  const novoNome = prompt("Digite o nome do destinatário:", nomeAtual);

  if (novoNome === null) return;

  const novoTelefone = prompt(
    "Digite o telefone do destinatário:",
    telefoneAtual,
  );

  if (novoTelefone === null) return;

  localStorage.setItem("nomeEntrega", novoNome.trim());
  localStorage.setItem("telefoneEntrega", novoTelefone.trim());

  carregarFinalizacaoPedido();
}

function limparCamposEndereco(prefixo = "") {
  [
    "Cep",
    "Rua",
    "Numero",
    "Bairro",
    "Cidade",
    "Estado",
    "Complemento",
    "Referencia",
    "Localizacao",
  ].forEach((sufixo) => {
    const campo = document.getElementById(prefixo + sufixo);
    if (campo) campo.value = "";
  });
}

function preencherCamposEndereco(prefixo = "", dados = {}) {
  const valores = {
    Cep: dados.cep || "",
    Rua: dados.rua || "",
    Numero: dados.numero || "",
    Bairro: dados.bairro || "",
    Cidade: dados.cidade || "",
    Estado: dados.estado || "",
    Complemento: dados.complemento || "",
    Referencia: dados.referencia || "",
    Localizacao: dados.localizacao || "",
  };

  Object.entries(valores).forEach(([sufixo, valor]) => {
    const campo = document.getElementById(prefixo + sufixo);
    if (campo) campo.value = valor;
  });
}

function obterDadosEnderecoUsuario() {
  try {
    return JSON.parse(localStorage.getItem("enderecoUsuarioDados")) || {};
  } catch (erro) {
    return {};
  }
}

function abrirFormularioEndereco(modo = "novo") {
  const formulario = document.getElementById("formNovoEndereco");

  if (!formulario) return;

  localStorage.setItem("modoFormularioEndereco", modo);
  formulario.classList.remove("oculto");

  if (modo === "editarUsuario") {
    preencherCamposEndereco("novo", obterDadosEnderecoUsuario());
  } else {
    limparCamposEndereco("novo");
  }
}

function cadastrarNovoEndereco() {
  abrirFormularioEndereco("novo");
}

function editarEnderecoUsuario(event) {
  if (event) event.preventDefault();
  abrirFormularioEndereco("editarUsuario");
  mostrarAviso(
    "Atualize o endereço e salve. Esse será o novo endereço do seu cadastro.",
    "info",
  );
}

function fecharFormularioEndereco() {
  const formulario = document.getElementById("formNovoEndereco");

  if (!formulario) return;

  formulario.classList.add("oculto");
  formulario.reset();
  localStorage.removeItem("modoFormularioEndereco");
}

function salvarNovoEndereco(event) {
  event.preventDefault();

  const modo = localStorage.getItem("modoFormularioEndereco") || "novo";
  const dadosEndereco = lerCamposEndereco("novo");
  const temLocalizacao = Boolean(dadosEndereco.localizacao);
  const enderecoCompleto = Boolean(
    dadosEndereco.cep &&
    dadosEndereco.rua &&
    dadosEndereco.numero &&
    dadosEndereco.bairro &&
    dadosEndereco.cidade &&
    dadosEndereco.estado,
  );

  if (modo === "editarUsuario") {
    if (!enderecoCompleto) {
      mostrarAviso(
        "Para atualizar o endereço do cadastro, preencha CEP, rua, número, bairro, cidade e estado.",
        "erro",
      );
      return;
    }

    const enderecoMontado = montarEndereco(dadosEndereco);
    localStorage.setItem("enderecoUsuario", enderecoMontado);
    localStorage.setItem("enderecoUsuarioDados", JSON.stringify(dadosEndereco));
    localStorage.setItem("localizacaoUsuario", dadosEndereco.localizacao || "");

    const emailLogado = localStorage.getItem("usuarioLogado");
    const usuarios = JSON.parse(localStorage.getItem("usuariosClickBus")) || [];
    const usuario = usuarios.find((item) => item.email === emailLogado);

    if (usuario) {
      usuario.endereco = enderecoMontado;
      usuario.enderecoDados = dadosEndereco;
      usuario.localizacao = dadosEndereco.localizacao || "";
      localStorage.setItem("usuariosClickBus", JSON.stringify(usuarios));
    }

    fecharFormularioEndereco();
    carregarFinalizacaoPedido();
    mostrarAviso("Endereço do cadastro atualizado.", "sucesso");
    return;
  }

  if (!temLocalizacao && !enderecoCompleto) {
    mostrarAviso(
      "Preencha o endereço completo ou use a localização atual para enviar só o ponto no mapa.",
      "erro",
    );
    return;
  }

  if (temLocalizacao && !dadosEndereco.referencia) {
    mostrarAviso(
      "Ponto de referência não informado. Tudo bem, a localização será usada para a entrega.",
      "info",
    );
  }

  const enderecoMontado = montarEndereco(dadosEndereco);
  const enderecoFinal = enderecoMontado || "Localização enviada pelo cliente";

  localStorage.setItem("enderecoEntrega", enderecoFinal);
  localStorage.setItem("localizacaoEntrega", dadosEndereco.localizacao || "");
  fecharFormularioEndereco();
  carregarFinalizacaoPedido();
  mostrarAviso("Endereço de entrega salvo.", "sucesso");
}

function excluirEnderecoEntrega(event) {
  event.preventDefault();

  if (!localStorage.getItem("enderecoEntrega")) {
    mostrarAviso(
      "Este é o endereço do cadastro. Ele só muda quando você cadastrar outro endereço para esta entrega.",
      "info",
    );
    return;
  }

  localStorage.removeItem("enderecoEntrega");
  localStorage.removeItem("localizacaoEntrega");
  carregarFinalizacaoPedido();
  mostrarAviso(
    "Endereço removido. O endereço do cadastro voltou a ser usado.",
    "sucesso",
  );
}

function formatarFormaPagamento(valor) {
  const formas = {
    dinheiro: "Dinheiro",
    cartao: "Cartão",
    pix: "Pix",
    entrega: "Entrega",
    entregaCadastro: "Entrega",
    entregaTemporario: "Entrega",
    retirada: "Retirada no estabelecimento",
  };

  return formas[valor] || valor || "Não informado";
}

function formatarValorTroco(valor) {
  if (!valor) return "";

  const texto = String(valor).trim();

  if (texto === "" || texto.toLowerCase().includes("não")) {
    return "";
  }

  const somenteNumero = texto
    .replace(/r\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(somenteNumero);

  if (Number.isNaN(numero) || numero <= 0) {
    return texto;
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function prepararCampoTroco() {
  const valorTroco = document.getElementById("valorTroco");

  if (!valorTroco) return;

  valorTroco.addEventListener("blur", () => {
    const valorFormatado = formatarValorTroco(valorTroco.value);

    if (valorFormatado) {
      valorTroco.value = valorFormatado;
    }
  });
}

function alternarCampoTroco() {
  const campoTroco = document.getElementById("campoTroco");
  const valorTroco = document.getElementById("valorTroco");
  const formaPagamento = document.querySelector(
    'input[name="formaPagamento"]:checked',
  )?.value;

  if (!campoTroco) return;

  if (formaPagamento === "dinheiro") {
    campoTroco.classList.remove("oculto");
  } else {
    campoTroco.classList.add("oculto");

    if (valorTroco) {
      valorTroco.value = "";
    }
  }
}

async function confirmarPedido() {
     try {
    await carregarConfiguracoesLojaDaApi();
  } catch (erro) {
    console.error("Erro ao verificar status da loja:", erro);
  }

  if (typeof lojaEstaAberta === "function" && !lojaEstaAberta()) {
    mostrarAviso(
      "A loja está fechada no momento. Não é possível confirmar pedido agora.",
      "erro",
    );
    return;
  }
  if (bloquearPedidoParaAdmin()) return;

  const pedido = carregarPedidoAtual();

  if (pedido.length === 0) {
    mostrarAviso("Seu carrinho está vazio.", "erro");
    return;
  }

  const formaRecebimento = document.querySelector(
    'input[name="formaRecebimento"]:checked',
  )?.value;

  const formaPagamento = document.querySelector(
    'input[name="formaPagamento"]:checked',
  )?.value;

  if (!formaRecebimento) {
    mostrarAviso("Escolha como deseja receber o pedido.", "erro");
    return;
  }

  if (!formaPagamento) {
    mostrarAviso("Escolha a forma de pagamento.", "erro");
    return;
  }

  const trocoDigitado =
    document.getElementById("valorTroco")?.value.trim() || "";

  const trocoPara =
    formaPagamento === "dinheiro"
      ? formatarValorTroco(trocoDigitado) || "Não precisa"
      : "Não se aplica";

  const totalProdutos = pedido.reduce((soma, item) => {
    return soma + (Number(item.quantidade) || 0);
  }, 0);

  const totalValor = pedido.reduce((soma, item) => {
    return soma + (Number(item.preco) || 0) * (Number(item.quantidade) || 0);
  }, 0);

  const cliente =
    localStorage.getItem("nomeEntrega") ||
    localStorage.getItem("nomeUsuario") ||
    "Cliente";

  const telefone =
    localStorage.getItem("telefoneEntrega") ||
    localStorage.getItem("telefoneUsuario") ||
    "";

  const endereco =
    formaRecebimento === "entregaTemporario"
      ? localStorage.getItem("enderecoEntrega") ||
        "Localização enviada pelo cliente"
      : formaRecebimento === "entregaCadastro"
        ? localStorage.getItem("enderecoUsuario") || "Endereço não informado"
        : "Retirar no estabelecimento";

  const localizacaoEntrega =
    formaRecebimento === "entregaTemporario"
      ? localStorage.getItem("localizacaoEntrega") || ""
      : formaRecebimento === "entregaCadastro"
        ? localStorage.getItem("localizacaoUsuario") || ""
        : "";

  const deliveryType =
    formaRecebimento === "retirada" ? "retirada" : "delivery";

  const changeFor =
    formaPagamento === "dinheiro" && trocoPara !== "Não precisa"
      ? Number(
          String(trocoPara)
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim(),
        )
      : null;

  const observacoes = carregarObservacoesPedido();

  const payloadPedido = {
    user_id: null,
    customer_email: localStorage.getItem("usuarioLogado") || "",
    customer_cpf: localStorage.getItem("cpfUsuario") || "",
    customer_name: cliente,
    customer_phone: telefone,
    delivery_type: deliveryType,
    delivery_address: endereco,
    delivery_location: localizacaoEntrega,
    payment_method: formaPagamento,
    change_for: changeFor,
    total_amount: totalValor,
    notes: "",
    items: pedido.map((item) => {
      const observacao = item.observacao || observacoes[String(item.id)] || "";

      return {
        product_id: Number(item.id) || null,
        product_name: item.nome,
        quantity: Number(item.quantidade) || 0,
        unit_price: Number(item.preco) || 0,
        subtotal: (Number(item.preco) || 0) * (Number(item.quantidade) || 0),
        observation: observacao,
      };
    }),
  };

  const botaoConfirmar = document.querySelector(
    'button[onclick="confirmarPedido()"]',
  );
  const textoOriginalBotao = botaoConfirmar?.textContent || "Confirmar Pedido";

  try {
    if (botaoConfirmar) {
      botaoConfirmar.disabled = true;
      botaoConfirmar.textContent = "Enviando pedido...";
    }

    const resposta = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadPedido),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(resultado.erro || "Erro ao confirmar pedido.", "erro");
      return;
    }

    const pedidoConfirmado = {
      id: resultado.order.id,
      data: resultado.order.created_at || new Date().toISOString(),
      email: localStorage.getItem("usuarioLogado") || "",
      cliente,
      telefone,
      endereco,
      localizacaoEntrega,
      formaRecebimento,
      formaPagamento,
      trocoPara,
      status: "Pedido recebido",
      totalProdutos,
      totalValor,
      itens: pedido,
      pedidoBancoId: resultado.order.id,
    };

    localStorage.setItem("pedidoConfirmado", JSON.stringify(pedidoConfirmado));

    const produtos = carregarProdutos();

    produtos.forEach((produto) => {
      produto.quantidade = 0;
    });

    salvarProdutos(produtos);

    localStorage.removeItem("pedidoAtual");
    localStorage.removeItem("observacoesPedidoAtual");
    localStorage.removeItem("produtoObservacaoId");

    avisarENavegar("Pedido confirmado com sucesso!", "pedidos.html");
  } catch (error) {
    console.error("Erro ao confirmar pedido:", error);
    mostrarAviso(
      "Erro de conexão ao confirmar pedido. Verifique se o backend está rodando.",
      "erro",
    );
  } finally {
    if (botaoConfirmar) {
      botaoConfirmar.disabled = false;
      botaoConfirmar.textContent = textoOriginalBotao;
    }
  }
}
/* =========================
   LISTA DE PEDIDOS
========================= */

function converterStatusPedidoApi(status) {
  const statusTexto = {
    pendente: "Pedido recebido",
    preparando: "Em produção",
    saiu_para_entrega: "Em rota de entrega",
    finalizado: "Entregue",
    cancelado: "Cancelado",
  };

  return statusTexto[status] || "Pedido recebido";
}

function converterPedidoApiParaTela(pedidoApi) {
  return {
    id: String(pedidoApi.id),
    pedidoBancoId: pedidoApi.id,
    data: pedidoApi.created_at,
    email: pedidoApi.customer_email || "",
    cliente: pedidoApi.customer_name || "Cliente",
    telefone: pedidoApi.customer_phone || "",
    endereco: pedidoApi.delivery_address || "",
    localizacaoEntrega: pedidoApi.delivery_location || "",
    formaRecebimento:
      pedidoApi.delivery_type === "retirada" ? "retirada" : "entregaCadastro",
    formaPagamento: pedidoApi.payment_method || "",
    trocoPara: pedidoApi.change_for
      ? formatarMoeda(Number(pedidoApi.change_for))
      : "Não se aplica",
    status: converterStatusPedidoApi(pedidoApi.status),
    canceladoPor: pedidoApi.cancelled_by || "",
    totalValor: Number(pedidoApi.total_amount) || 0,
    totalProdutos: Array.isArray(pedidoApi.items)
      ? pedidoApi.items.reduce((soma, item) => {
          return soma + (Number(item.quantity) || 0);
        }, 0)
      : 0,
    itens: Array.isArray(pedidoApi.items)
      ? pedidoApi.items.map((item) => ({
          id: item.product_id,
          nome: item.product_name,
          quantidade: Number(item.quantity) || 0,
          preco: Number(item.unit_price) || 0,
          observacao: item.observation || "",
        }))
      : [],
  };
}

async function carregarPedidosDaApi() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/orders`);

    if (!resposta.ok) {
      throw new Error("Erro ao buscar pedidos.");
    }

    const pedidosApi = await resposta.json();

    if (!Array.isArray(pedidosApi)) {
      return [];
    }

    return pedidosApi.map(converterPedidoApiParaTela);
  } catch (error) {
    console.error("Erro ao carregar pedidos da API:", error);
    mostrarAviso("Não foi possível carregar os pedidos do servidor.", "erro");

    return [];
  }
}

function carregarPedidos() {
  return JSON.parse(localStorage.getItem("pedidosClickBus")) || [];
}

function salvarPedidos(pedidos) {
  localStorage.setItem("pedidosClickBus", JSON.stringify(pedidos));
}

function formatarDataPedido(dataISO) {
  const data = new Date(dataISO);

  return data.toLocaleDateString("pt-BR");
}

function formatarHoraPedido(dataISO) {
  const data = new Date(dataISO);

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarFormaPagamento(formaPagamento) {
  const valor = String(formaPagamento || "").trim();

  const mapa = {
    dinheiro: "Dinheiro",
    pix: "Pix",
    cartao: "Cartão",
    cartão: "Cartão",
    entrega: "Entrega",
    entregacadastro: "Entrega",
    entregatemporario: "Entrega",
    retirada: "Retirada no estabelecimento",
  };

  return mapa[valor.toLowerCase()] || valor || "Não informado";
}

function pegarClasseStatus(status) {
  if (status === "Entregue") return "status-entregue";
  if (status === "Cancelado") return "status-cancelado";
  if (status === "Em produção") return "status-producao";
  if (status === "Em rota de entrega") return "status-rota";
  return "status-recebido";
}

function obterDataLocalPedido(dataISO) {
  const data = new Date(dataISO);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterDataHojeLocal() {
  return obterDataLocalPedido(new Date().toISOString());
}

function obterFiltroPedidosAdmin() {
  return localStorage.getItem("filtroPedidosAdminClickBus") || "hoje";
}

function salvarFiltroPedidosAdmin(filtro) {
  localStorage.setItem("filtroPedidosAdminClickBus", filtro);
}

function filtrarPedidosAdmin(filtro) {
  salvarFiltroPedidosAdmin(filtro);

  if (filtro !== "data") {
    localStorage.removeItem("dataFiltroPedidosAdminClickBus");
  }

  renderizarPedidos();
}

function mostrarFiltroDataPedidos() {
  const campoData = document.getElementById("dataFiltroPedidos");

  if (!campoData) return;

  campoData.classList.remove("oculto");
  campoData.focus();
}

function filtrarPedidosAdminPorData(dataSelecionada) {
  if (!dataSelecionada) return;

  salvarFiltroPedidosAdmin("data");
  localStorage.setItem("dataFiltroPedidosAdminClickBus", dataSelecionada);
  renderizarPedidos();
}

function obterPesoStatusPedido(status) {
  const ordem = {
    "Pedido recebido": 1,
    "Em produção": 2,
    "Em rota de entrega": 3,
    Entregue: 4,
    Cancelado: 5,
  };

  return ordem[status] || 99;
}

function ordenarPedidosParaAdmin(pedidos) {
  return pedidos.slice().sort((a, b) => {
    const pesoA = obterPesoStatusPedido(a.status);
    const pesoB = obterPesoStatusPedido(b.status);

    if (pesoA !== pesoB) return pesoA - pesoB;

    return new Date(a.data) - new Date(b.data);
  });
}

function ordenarPedidosCliente(pedidos) {
  return pedidos.slice().sort((a, b) => new Date(b.data) - new Date(a.data));
}

function obterNumeroPedidoDoDia(pedido, todosPedidos) {
  const dataPedido = obterDataLocalPedido(pedido.data);
  const pedidosDoMesmoDia = todosPedidos
    .filter((item) => obterDataLocalPedido(item.data) === dataPedido)
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const indice = pedidosDoMesmoDia.findIndex((item) => item.id === pedido.id);

  return String(indice + 1).padStart(3, "0");
}

function atualizarFiltroVisualPedidos(admin, pedidosVisiveis) {
  const filtrosPedidosAdmin = document.getElementById("filtrosPedidosAdmin");
  const tituloFiltroPedidos = document.getElementById("tituloFiltroPedidos");
  const resumoFiltroPedidos = document.getElementById("resumoFiltroPedidos");
  const dataFiltroPedidos = document.getElementById("dataFiltroPedidos");

  if (!filtrosPedidosAdmin) return;

  if (!admin) {
    filtrosPedidosAdmin.classList.add("oculto");

    if (resumoFiltroPedidos) {
      const total = pedidosVisiveis.length;
      resumoFiltroPedidos.textContent =
        total === 1 ? "1 pedido encontrado" : `${total} pedidos encontrados`;
    }

    if (dataFiltroPedidos) {
      dataFiltroPedidos.classList.add("oculto");
    }

    return;
  }

  filtrosPedidosAdmin.classList.remove("oculto");

  const filtro = obterFiltroPedidosAdmin();
  const dataFiltro =
    localStorage.getItem("dataFiltroPedidosAdminClickBus") || "";

  document
    .querySelectorAll(".botoes-filtro-pedidos button")
    .forEach((botao) => botao.classList.remove("ativo"));

  if (filtro === "hoje") {
    document.getElementById("btnFiltroHoje")?.classList.add("ativo");
    if (tituloFiltroPedidos)
      tituloFiltroPedidos.textContent = "Pedidos de hoje";
  } else if (filtro === "todos") {
    document.getElementById("btnFiltroTodos")?.classList.add("ativo");
    if (tituloFiltroPedidos)
      tituloFiltroPedidos.textContent = "Todos os pedidos";
  } else {
    document.getElementById("btnFiltroData")?.classList.add("ativo");
    if (tituloFiltroPedidos) {
      const dataFormatada = dataFiltro
        ? new Date(dataFiltro + "T00:00:00").toLocaleDateString("pt-BR")
        : "data escolhida";

      tituloFiltroPedidos.textContent = `Pedidos de ${dataFormatada}`;
    }
  }

  if (dataFiltroPedidos) {
    dataFiltroPedidos.value = dataFiltro;
    dataFiltroPedidos.classList.toggle("oculto", filtro !== "data");
  }

  if (resumoFiltroPedidos) {
    const total = pedidosVisiveis.length;
    resumoFiltroPedidos.textContent =
      total === 1 ? "1 pedido encontrado" : `${total} pedidos encontrados`;
  }
}

function irParaDetalhePedido(id) {
  localStorage.setItem("pedidoDetalheId", String(id));
  window.location.href = `detalhe-pedido.html?id=${id}`;
}

async function renderizarPedidos() {
  const listaPedidos = document.getElementById("listaPedidos");

  if (!listaPedidos) return;

  const pedidos = await carregarPedidosDaApi();
  const admin = usuarioEhAdmin();
  const usuarioLogado = localStorage.getItem("usuarioLogado");

  let pedidosVisiveis = pedidos;

  if (admin) {
    const filtro = obterFiltroPedidosAdmin();
    const hoje = obterDataHojeLocal();
    const dataFiltro = localStorage.getItem("dataFiltroPedidosAdminClickBus");

    if (filtro === "hoje") {
      pedidosVisiveis = pedidos.filter(
        (pedido) => obterDataLocalPedido(pedido.data) === hoje,
      );
    } else if (filtro === "data" && dataFiltro) {
      pedidosVisiveis = pedidos.filter(
        (pedido) => obterDataLocalPedido(pedido.data) === dataFiltro,
      );
    }

    pedidosVisiveis = ordenarPedidosParaAdmin(pedidosVisiveis);
  } else {
    pedidosVisiveis = pedidos.filter(
      (pedido) => pedido.email === usuarioLogado,
    );

    pedidosVisiveis = ordenarPedidosCliente(pedidosVisiveis);
  }

  atualizarFiltroVisualPedidos(admin, pedidosVisiveis);

  const alertaNovoPedido = document.getElementById("alertaNovoPedido");

  if (alertaNovoPedido) {
    const novosPedidos = pedidosVisiveis.filter(
      (pedido) => pedido.status === "Pedido recebido",
    );

    if (admin && novosPedidos.length > 0) {
      alertaNovoPedido.classList.remove("oculto");
      alertaNovoPedido.textContent =
        novosPedidos.length === 1
          ? "🔔 Há 1 novo pedido aguardando atendimento."
          : `🔔 Há ${novosPedidos.length} novos pedidos aguardando atendimento.`;
    } else {
      alertaNovoPedido.classList.add("oculto");
      alertaNovoPedido.textContent = "";
    }
  }

  listaPedidos.innerHTML = "";

  if (pedidosVisiveis.length === 0) {
    listaPedidos.innerHTML = `
      <p class="mensagem-sem-pedidos">Nenhum pedido encontrado nesse filtro.</p>
    `;
    return;
  }

  pedidosVisiveis.forEach((pedido) => {
    const item = document.createElement("article");
    item.className = "item-pedido";

    const statusClasse = pegarClasseStatus(pedido.status);
    const clientePodeCancelar = !admin && pedido.status === "Pedido recebido";
    const numeroPedido = obterNumeroPedidoDoDia(pedido, pedidos);

    item.innerHTML = `
      <div class="numero-pedido-admin">
        <strong>Pedido #${numeroPedido}</strong>
        ${admin ? `<span>${pedido.cliente || "Cliente não informado"}</span>` : ""}
      </div>

      <div class="data-pedido">
        <span>Data</span>
        <strong>${formatarDataPedido(pedido.data)}</strong>
      </div>

      <div class="hora-pedido">
        <span>Hora</span>
        <strong>${formatarHoraPedido(pedido.data)}</strong>
      </div>

      ${
        admin
          ? `
            <div class="admin-status">
              <span class="status-pedido ${statusClasse}">
                ${pedido.status}
              </span>

              ${
                pedido.status === "Cancelado"
                  ? `<span class="pedido-cancelado-admin">
      ${
        pedido.canceladoPor === "admin"
          ? "Cancelado pelo administrador"
          : "Cancelado pelo cliente"
      }
    </span>`
                  : `<select onchange="alterarStatusPedido('${pedido.id}', this.value)">
                      <option value="Pedido recebido" ${
                        pedido.status === "Pedido recebido" ? "selected" : ""
                      }>Pedido recebido</option>

                      <option value="Em produção" ${
                        pedido.status === "Em produção" ? "selected" : ""
                      }>Em produção</option>

                      <option value="Em rota de entrega" ${
                        pedido.status === "Em rota de entrega" ? "selected" : ""
                      }>Em rota de entrega</option>

                      <option value="Entregue" ${
                        pedido.status === "Entregue" ? "selected" : ""
                      }>Entregue</option>
                      <option value="Cancelado" ${
                        pedido.status === "Cancelado" ? "selected" : ""
                      }>Cancelado</option>
                    </select>`
              }
            </div>
          `
          : `
            <span class="status-pedido ${statusClasse}">
              ${pedido.status}
            </span>
          `
      }

      <div class="acoes-pedido">
        <button type="button" class="btn-detalhe" onclick="irParaDetalhePedido('${pedido.id}')">
          🔍 Detalhe do pedido
        </button>

        ${
          clientePodeCancelar
            ? `<button type="button" class="btn-cancelar-pedido" onclick="cancelarPedidoCliente('${pedido.id}')">Cancelar pedido</button>`
            : ""
        }
      </div>
    `;

    listaPedidos.appendChild(item);
  });
}

function iniciarAtualizacaoAutomatica() {
  const pagina = window.location.pathname;

  const estaNaPaginaPedidos = pagina.includes("pedidos.html");
  const estaNaPaginaDetalhe = pagina.includes("detalhe-pedido.html");
  const estaNaPaginaCardapio = pagina.includes("cardapio.html");

  if (estaNaPaginaPedidos) {
    setInterval(() => {
      renderizarPedidos();
    }, 5000);
  }

  if (estaNaPaginaDetalhe) {
    setInterval(() => {
      carregarDetalhePedidoPagina();
    }, 5000);
  }

  if (estaNaPaginaCardapio) {
    setInterval(() => {
      atualizarStatusLoja?.();
      carregarProdutosCardapio?.();
    }, 5000);
  }
}

function converterStatusTelaParaApi(statusTela) {
  const mapa = {
    "Pedido recebido": "pendente",
    "Em produção": "preparando",
    "Em rota de entrega": "saiu_para_entrega",
    Entregue: "finalizado",
    Cancelado: "cancelado",
  };

  return mapa[statusTela] || "pendente";
}

async function alterarStatusPedido(id, novoStatus) {
  if (!usuarioEhAdmin()) {
    mostrarAviso("Apenas o administrador pode alterar o status.", "erro");
    return;
  }

  const statusApi = converterStatusTelaParaApi(novoStatus);

  try {
    const resposta = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: statusApi,
        cancelled_by: statusApi === "cancelado" ? "admin" : null,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(resultado.erro || "Erro ao atualizar status.", "erro");
      return;
    }

    mostrarAviso("Status do pedido atualizado.", "sucesso");

    if (window.location.pathname.includes("detalhe-pedido.html")) {
      await carregarDetalhePedidoPagina();
      return;
    }

    if (document.getElementById("listaPedidos")) {
      await renderizarPedidos();
    }
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    mostrarAviso("Erro de conexão ao atualizar status.", "erro");
  }
}

async function carregarDetalhePedidoPagina() {
  const estaNaPaginaDetalhe = window.location.pathname.includes(
    "detalhe-pedido.html",
  );

  if (!estaNaPaginaDetalhe) return;

  const clienteDetalhe = document.getElementById("clienteDetalhe");
  const telefoneDetalhe = document.getElementById("telefoneDetalhe");
  const dataDetalhe = document.getElementById("dataDetalhe");
  const horaDetalhe = document.getElementById("horaDetalhe");
  const statusDetalhe = document.getElementById("statusDetalhe");
  const itensDetalhePedido = document.getElementById("itensDetalhePedido");
  const recebimentoDetalhe = document.getElementById("recebimentoDetalhe");
  const pagamentoDetalhe = document.getElementById("pagamentoDetalhe");
  const trocoDetalhe = document.getElementById("trocoDetalhe");
  const enderecoDetalhe = document.getElementById("enderecoDetalhe");
  const localizacaoDetalhe = document.getElementById("localizacaoDetalhe");
  const totalProdutosDetalhe = document.getElementById("totalProdutosDetalhe");
  const valorTotalDetalhe = document.getElementById("valorTotalDetalhe");

  const parametros = new URLSearchParams(window.location.search);
  const pedidoId =
    parametros.get("id") || localStorage.getItem("pedidoDetalheId");

  if (!pedidoId) {
    mostrarAviso("Pedido não selecionado.", "erro");
    window.location.href = "pedidos.html";
    return;
  }

  try {
    const pedidos = await carregarPedidosDaApi();
    const pedido = pedidos.find((item) => String(item.id) === String(pedidoId));

    if (!pedido) {
      mostrarAviso("Pedido não encontrado.", "erro");
      window.location.href = "pedidos.html";
      return;
    }

    if (clienteDetalhe) {
      clienteDetalhe.textContent = pedido.cliente || "Cliente";
    }

    if (telefoneDetalhe) {
      telefoneDetalhe.textContent = pedido.telefone || "(00) 00000-0000";
    }

    if (dataDetalhe) {
      dataDetalhe.textContent = `Data do pedido ${formatarDataPedido(pedido.data)}`;
    }

    if (horaDetalhe) {
      horaDetalhe.textContent = formatarHoraPedido(pedido.data);
    }

    if (statusDetalhe) {
      const statusAtual = pedido.status || "Pedido recebido";
      const statusClasse = pegarClasseStatus(statusAtual);

      if (usuarioEhAdmin()) {
        statusDetalhe.innerHTML = `
        
          <select
           class="select-status-detalhe ${statusClasse}"
            onchange="alterarStatusPedido('${pedido.id}', this.value)"
          >
            <option value="Pedido recebido" ${
              statusAtual === "Pedido recebido" ? "selected" : ""
            }>Pedido recebido</option>

            <option value="Em produção" ${
              statusAtual === "Em produção" ? "selected" : ""
            }>Em produção</option>

            <option value="Em rota de entrega" ${
              statusAtual === "Em rota de entrega" ? "selected" : ""
            }>Em rota de entrega</option>

            <option value="Entregue" ${
              statusAtual === "Entregue" ? "selected" : ""
            }>Entregue</option>

            <option value="Cancelado" ${
              statusAtual === "Cancelado" ? "selected" : ""
            }>Cancelado</option>
          </select>
        `;
      } else {
        statusDetalhe.innerHTML = `
    <span class="status-pedido ${statusClasse}">
      ${statusAtual}
    </span>
  `;
      }
    }

    if (recebimentoDetalhe) {
      recebimentoDetalhe.textContent =
        pedido.formaRecebimento === "retirada"
          ? "Retirar no estabelecimento"
          : "Entrega";
    }

    if (pagamentoDetalhe) {
      pagamentoDetalhe.textContent = formatarFormaPagamento(
        pedido.formaPagamento,
      );
    }

    if (trocoDetalhe) {
      trocoDetalhe.textContent = pedido.trocoPara || "Não precisa";
    }

    if (enderecoDetalhe) {
      enderecoDetalhe.textContent = pedido.endereco || "Não informado";
    }

    if (localizacaoDetalhe) {
      if (pedido.localizacaoEntrega) {
        localizacaoDetalhe.innerHTML = `
          <a href="${obterLinkGoogleMapsRota(pedido.localizacaoEntrega)}" target="_blank">
            Abrir rota no Google Maps
          </a>
        `;
      } else {
        localizacaoDetalhe.textContent = "Não informada";
      }
    }

    if (itensDetalhePedido) {
      itensDetalhePedido.innerHTML = `
    <div class="titulo-itens-pedido">
      <h2>ITENS DO PEDIDO</h2>
    </div>

    <div class="lista-itens-detalhe">
      ${pedido.itens
        .map((item) => {
          const quantidade = Number(item.quantidade) || 0;
          const preco = Number(item.preco) || 0;
          const subtotal = quantidade * preco;

          return `
            <div class="item-detalhe-pedido">
              <div class="nome-produto-detalhe">
                <strong>${quantidade}x ${item.nome}</strong>
                <span class="linha-pontilhada"></span>
              </div>

              <strong class="preco-produto-detalhe">
                ${formatarMoeda(subtotal)}
              </strong>
            </div>

            ${
              item.observacao
                ? `<div class="observacao-detalhe">Obs: ${item.observacao}</div>`
                : ""
            }
          `;
        })
        .join("")}
    </div>
  `;
    }

    if (totalProdutosDetalhe) {
      totalProdutosDetalhe.textContent = String(
        Number(pedido.totalProdutos) || 0,
      ).padStart(2, "0");
    }

    if (valorTotalDetalhe) {
      valorTotalDetalhe.textContent = formatarMoeda(
        Number(pedido.totalValor) || 0,
      );
    }
  } catch (error) {
    console.error("Erro ao carregar detalhe do pedido:", error);
    mostrarAviso("Erro ao carregar detalhe do pedido.", "erro");
  }
}

async function cancelarPedidoCliente(id) {
  const usuarioLogado = localStorage.getItem("usuarioLogado") || "";

  try {
    const pedidos = await carregarPedidosDaApi();
    const pedido = pedidos.find((item) => String(item.id) === String(id));

    if (!pedido || pedido.email !== usuarioLogado) {
      mostrarAviso("Pedido não encontrado para este usuário.", "erro");
      return;
    }

    if (pedido.status !== "Pedido recebido") {
      mostrarAviso(
        "Esse pedido já entrou em preparo e não pode mais ser cancelado por aqui.",
        "erro",
      );
      await renderizarPedidos();
      return;
    }

    const resposta = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "cancelado",
        cancelled_by: "cliente",
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAviso(resultado.erro || "Erro ao cancelar pedido.", "erro");
      return;
    }

    mostrarAviso("Pedido cancelado com sucesso.", "sucesso");
    await renderizarPedidos();
  } catch (error) {
    console.error("Erro ao cancelar pedido:", error);
    mostrarAviso("Erro de conexão ao cancelar pedido.", "erro");
  }
}

function abrirDetalhePedido(id) {
  const pedidos = carregarPedidos();
  const pedido = pedidos.find((item) => item.id === id);

  const modalPedido = document.getElementById("modalPedido");
  const conteudoDetalhePedido = document.getElementById(
    "conteudoDetalhePedido",
  );

  if (!pedido || !modalPedido || !conteudoDetalhePedido) return;

  const itensHTML = pedido.itens
    .map((item) => {
      const quantidade = Number(item.quantidade) || 0;
      const preco = Number(item.preco) || 0;
      const subtotal = quantidade * preco;

      return `
        <div class="item-detalhe">
          <span>${quantidade}x ${item.nome}</span>
          <strong>${formatarMoeda(subtotal)}</strong>
        </div>

        ${
          item.observacao
            ? `<div class="detalhe-linha"><strong>Obs:</strong> ${item.observacao}</div>`
            : ""
        }
      `;
    })
    .join("");

  conteudoDetalhePedido.innerHTML = `
    <div class="detalhe-linha">
      <strong>Cliente:</strong> ${pedido.cliente}
    </div>

    <div class="detalhe-linha">
      <strong>Telefone:</strong> ${pedido.telefone || "Não informado"}
    </div>

    <div class="detalhe-linha">
      <strong>Data:</strong> ${formatarDataPedido(pedido.data)} às ${formatarHoraPedido(pedido.data)}
    </div>

    <div class="detalhe-linha">
      <strong>Status:</strong> ${pedido.status}
    </div>

    <div class="detalhe-linha">
      <strong>Recebimento:</strong> ${formatarFormaPagamento(pedido.formaRecebimento)}
    </div>

    <div class="detalhe-linha">
      <strong>Pagamento:</strong> ${formatarFormaPagamento(pedido.formaPagamento)}
    </div>

    <div class="detalhe-linha">
      <strong>Troco:</strong> ${pedido.trocoPara || "Não precisa"}
    </div>

    <div class="detalhe-linha">
      <strong>Endereço:</strong> ${pedido.endereco}
    </div>

    <div class="lista-itens-detalhe">
      <strong>Itens do pedido:</strong>
      ${itensHTML}
    </div>

    <div class="detalhe-linha" style="margin-top: 16px; font-size: 22px;">
      <strong>Total:</strong> ${formatarMoeda(Number(pedido.totalValor) || 0)}
    </div>
  `;

  modalPedido.classList.remove("oculto");
}

function fecharDetalhePedido() {
  const modalPedido = document.getElementById("modalPedido");

  if (modalPedido) {
    modalPedido.classList.add("oculto");
  }
}

function atualizarBotaoEntrarHome() {
  const linkEntrarHome = document.getElementById("linkEntrarHome");
  const linkCadastroHome = document.getElementById("linkCadastroHome");
  const usuarioLogadoHome = document.getElementById("usuarioLogadoHome");

  if (!linkEntrarHome) return;

  const emailLogado = localStorage.getItem("usuarioLogado") || "";
  const tipoUsuario = localStorage.getItem("tipoUsuario") || "";
  const nomeUsuario = localStorage.getItem("nomeUsuario") || "";

  if (emailLogado) {
    if (usuarioLogadoHome) {
      usuarioLogadoHome.textContent =
        tipoUsuario === "admin"
          ? "Olá, Administrador"
          : `Olá, ${nomeUsuario || "Cliente"}`;

      usuarioLogadoHome.classList.remove("oculto");
    }

    linkEntrarHome.textContent = "Ir para cardápio";
    linkEntrarHome.href = "cardapio.html";

    if (linkCadastroHome) {
      linkCadastroHome.classList.add("oculto");
    }

    return;
  }

  if (usuarioLogadoHome) {
    usuarioLogadoHome.textContent = "";
    usuarioLogadoHome.classList.add("oculto");
  }

  linkEntrarHome.textContent = "Entrar";
  linkEntrarHome.href = "login.html";

  if (linkCadastroHome) {
    linkCadastroHome.classList.remove("oculto");
  }
}
/* =========================
   INICIALIZAÇÃO
========================= */

function executarComSeguranca(nomeFuncao, callback) {
  try {
    if (typeof callback === "function") {
      callback();
    }
  } catch (error) {
    console.error(`Erro ao executar ${nomeFuncao}:`, error);
  }
}

let atualizacaoAutomaticaPaginasIniciada = false;

function iniciarAtualizacaoAutomaticaPaginas() {
  if (atualizacaoAutomaticaPaginasIniciada) return;

  atualizacaoAutomaticaPaginasIniciada = true;

  const pagina = window.location.pathname;

  const estaNaPaginaPedidos = pagina.includes("pedidos.html");
  const estaNaPaginaDetalhe = pagina.includes("detalhe-pedido.html");
  const estaNaPaginaCardapio = pagina.includes("cardapio.html");

  if (estaNaPaginaPedidos) {
    setInterval(() => {
      const elementoAtivo = document.activeElement;
      const estaMexendoEmSelect =
        elementoAtivo && elementoAtivo.tagName === "SELECT";

      if (!estaMexendoEmSelect && typeof renderizarPedidos === "function") {
        renderizarPedidos();
      }
    }, 5000);
  }

  if (estaNaPaginaDetalhe) {
    setInterval(() => {
      const elementoAtivo = document.activeElement;
      const estaMexendoEmSelect =
        elementoAtivo && elementoAtivo.tagName === "SELECT";

      if (
        !estaMexendoEmSelect &&
        typeof carregarDetalhePedidoPagina === "function"
      ) {
        carregarDetalhePedidoPagina();
      }
    }, 5000);
  }

  if (estaNaPaginaCardapio) {
    setInterval(() => {
      if (typeof renderizarCardapio === "function") {
        renderizarCardapio();
      }

      if (typeof atualizarStatusLoja === "function") {
        atualizarStatusLoja();
      }

      if (typeof atualizarHorarioFuncionamento === "function") {
        atualizarHorarioFuncionamento();
      }
    }, 5000);
  }
}

function obterDadosCompartilhamento() {
  const titulo =
    document.getElementById("tituloCompartilhar")?.textContent?.trim() ||
    "ClickBus Burguer";

  const descricao =
    document.getElementById("descricaoCompartilhar")?.textContent?.trim() || "";

  const mensagem =
    document.getElementById("mensagemCompartilhar")?.textContent?.trim() ||
    `${titulo}\n${descricao}`;

  const linkTexto =
    document.getElementById("linkLojaCompartilhar")?.textContent?.trim() ||
    "cardapio.html";

  const linkCompleto = new URL(linkTexto, window.location.href).href;

  const textoCompleto = `${mensagem}\n\nAcesse: ${linkCompleto}`;

  return {
    titulo,
    descricao,
    mensagem,
    linkCompleto,
    textoCompleto,
  };
}

async function copiarTextoCompartilhamento(texto, mensagemSucesso) {
  try {
    await navigator.clipboard.writeText(texto);
    mostrarAviso(mensagemSucesso || "Texto copiado com sucesso.", "sucesso");
  } catch (error) {
    console.error("Erro ao copiar:", error);
    mostrarAviso("Não foi possível copiar automaticamente.", "erro");
  }
}

async function compartilharWhatsApp() {
  const dados = obterDadosCompartilhamento();
  const texto = encodeURIComponent(dados.textoCompleto);

  window.open(`https://wa.me/?text=${texto}`, "_blank");
}

async function compartilharTelegram() {
  const dados = obterDadosCompartilhamento();

  const url = encodeURIComponent(dados.linkCompleto);
  const text = encodeURIComponent(dados.mensagem);

  window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
}

async function compartilharMessenger() {
  const dados = obterDadosCompartilhamento();

  await copiarTextoCompartilhamento(
    dados.textoCompleto,
    "Mensagem copiada. Agora escolha o contato no Messenger.",
  );

  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      dados.linkCompleto,
    )}`,
    "_blank",
  );
}

async function compartilharInstagram() {
  const dados = obterDadosCompartilhamento();

  await copiarTextoCompartilhamento(
    dados.textoCompleto,
    "Mensagem copiada. Agora cole no Instagram.",
  );

  window.open("https://www.instagram.com/", "_blank");
}

async function copiarMensagemCompartilhar() {
  const dados = obterDadosCompartilhamento();

  await copiarTextoCompartilhamento(
    dados.textoCompleto,
    "Mensagem copiada com sucesso.",
  );
}

async function copiarLinkCompartilhar() {
  const dados = obterDadosCompartilhamento();

  await copiarTextoCompartilhamento(
    dados.linkCompleto,
    "Link copiado com sucesso.",
  );
}

function atualizarStatusLoja() {
  if (typeof iniciarAtualizacaoStatusLoja === "function") {
    iniciarAtualizacaoStatusLoja();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  executarComSeguranca("iniciarAtualizacaoAutomaticaPaginas", () => {
    if (typeof iniciarAtualizacaoAutomaticaPaginas === "function") {
      iniciarAtualizacaoAutomaticaPaginas();
    }
  });

  executarComSeguranca("controlarVisualPerfilLoja", () => {
    if (typeof controlarVisualPerfilLoja === "function") {
      controlarVisualPerfilLoja();
    }
  });

  executarComSeguranca("iniciarAtualizacaoStatusLoja", () => {
    if (typeof iniciarAtualizacaoAutomatica === "function") {
      iniciarAtualizacaoAutomatica();
    }

    if (typeof iniciarAtualizacaoStatusLoja === "function") {
      iniciarAtualizacaoStatusLoja();
    }
  });

  executarComSeguranca("atualizarBotaoEntrarHome", () => {
    if (typeof atualizarBotaoEntrarHome === "function") {
      atualizarBotaoEntrarHome();
    }
  });

  executarComSeguranca("atualizarBotaoCompartilharAdmin", () => {
    if (typeof atualizarBotaoCompartilharAdmin === "function") {
      atualizarBotaoCompartilharAdmin();
    }
  });

  executarComSeguranca("atualizarPaginaCompartilhar", () => {
    if (typeof atualizarPaginaCompartilhar === "function") {
      atualizarPaginaCompartilhar();
    }
  });

  executarComSeguranca("protegerPaginaCardapio", () => {
    if (typeof protegerPaginaCardapio === "function") {
      protegerPaginaCardapio();
    }
  });

  executarComSeguranca("renderizarCardapio", () => {
    if (typeof renderizarCardapio === "function") {
      renderizarCardapio();
    }
  });

  executarComSeguranca("renderizarCarrinho", () => {
    if (typeof renderizarCarrinho === "function") {
      renderizarCarrinho();
    }
  });

  executarComSeguranca("renderizarPedidos", () => {
    if (typeof renderizarPedidos === "function") {
      renderizarPedidos();
    }
  });

  executarComSeguranca("preencherPerfilLoja", () => {
    if (typeof preencherPerfilLoja === "function") {
      preencherPerfilLoja();
    }
  });

  executarComSeguranca("preencherContaAdministrador", () => {
    if (typeof preencherContaAdministrador === "function") {
      preencherContaAdministrador();
    }
  });

  executarComSeguranca("carregarDetalhePedidoPagina", () => {
    if (typeof carregarDetalhePedidoPagina === "function") {
      carregarDetalhePedidoPagina();
    }
  });

  executarComSeguranca("carregarObservacaoPagina", () => {
    if (typeof carregarObservacaoPagina === "function") {
      carregarObservacaoPagina();
    }
  });

  executarComSeguranca("carregarFinalizacaoPedido", () => {
    if (typeof carregarFinalizacaoPedido === "function") {
      carregarFinalizacaoPedido();
    }
  });

  executarComSeguranca("alternarCampoTroco", () => {
    if (typeof alternarCampoTroco === "function") {
      alternarCampoTroco();
    }
  });

  executarComSeguranca("prepararCampoTroco", () => {
    if (typeof prepararCampoTroco === "function") {
      prepararCampoTroco();
    }
  });

  executarComSeguranca("prepararCamposTelefone", () => {
    if (typeof prepararCamposTelefone === "function") {
      prepararCamposTelefone();
    }
  });
});

function carregarObservacoesPedido() {
  return {};
}

function atualizarStatusLoja() {
  if (typeof iniciarAtualizacaoStatusLoja === "function") {
    iniciarAtualizacaoStatusLoja();
  }
}

function avancarPedido() {
  const totalTexto =
    document.getElementById("valorTotal")?.textContent || "R$ 0,00";

  const totalNumerico = Number(
    totalTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
  );

  if (!totalNumerico || totalNumerico <= 0) {
    alert("Escolha pelo menos um item antes de avançar.");
    return;
  }

  window.location.href = "finalizar-pedido.html";
}
window.carregarObservacoesPedido = function () {
  try {
    return JSON.parse(localStorage.getItem("observacoesPedidoAtual") || "{}");
  } catch (erro) {
    return {};
  }
};

window.salvarObservacoesPedido = function (observacoes) {
  localStorage.setItem(
    "observacoesPedidoAtual",
    JSON.stringify(observacoes || {}),
  );
};

window.limparObservacaoPedidoProduto = function (id) {
  const observacoes = window.carregarObservacoesPedido();
  delete observacoes[String(id)];
  window.salvarObservacoesPedido(observacoes);
};

window.carregarObservacaoPagina = function () {
  const campoObservacao = document.getElementById("campoObservacao");

  if (!campoObservacao) return;

  const produtoId = Number(localStorage.getItem("produtoObservacaoId"));
  const observacoes = window.carregarObservacoesPedido();

  campoObservacao.value = observacoes[String(produtoId)] || "";
};

window.salvarObservacaoPagina = function () {
  const campoObservacao = document.getElementById("campoObservacao");

  if (!campoObservacao) return;

  const produtoId = Number(localStorage.getItem("produtoObservacaoId"));
  const produtos = carregarProdutos();
  const produto = produtos.find(
    (item) => Number(item.id) === Number(produtoId),
  );

  if (!produto) {
    mostrarAviso("Produto não encontrado.", "erro");
    return;
  }

  const observacoes = window.carregarObservacoesPedido();
  const textoObservacao = campoObservacao.value.trim();

  if (textoObservacao) {
    observacoes[String(produtoId)] = textoObservacao;
  } else {
    delete observacoes[String(produtoId)];
  }

  window.salvarObservacoesPedido(observacoes);

  avisarENavegar(
    textoObservacao
      ? "Observação salva com sucesso!"
      : "Observação removida com sucesso!",
    "cardapio.html",
  );
};

window.atualizarStatusLoja = function () {
  if (typeof iniciarAtualizacaoStatusLoja === "function") {
    iniciarAtualizacaoStatusLoja();
  }
};

window.avancarPedido = function () {
  if (bloquearPedidoParaAdmin()) return;

  const produtos = carregarProdutos();
  const observacoes = window.carregarObservacoesPedido();

  const pedido = produtos
    .filter((produto) => Number(produto.quantidade) > 0)
    .map((produto) => ({
      id: Number(produto.id),
      nome: produto.nome,
      descricao: produto.descricao || "",
      preco: Number(produto.preco) || 0,
      imagem: produto.imagem || "",
      categoria: produto.categoria || "",
      quantidade: Number(produto.quantidade) || 0,
      observacao: observacoes[String(produto.id)] || "",
    }));

  if (pedido.length === 0) {
    mostrarAviso("Escolha pelo menos um item antes de avançar.", "erro");
    return;
  }

  localStorage.setItem("pedidoAtual", JSON.stringify(pedido));

  window.location.href = "finalizar-pedido.html";
};
