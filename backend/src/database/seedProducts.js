const pool = require("../config/db");

const produtosPadrao = [
  {
    categoria: "lanche",
    nome: "Burguer SIMPLES",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, milho, batata palha, tomate e alface.",
    preco: 15,
    imagem: "img/produtos/burguer-simples.png",
  },
  {
    categoria: "lanche",
    nome: "Burguer ESPECIAL",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, milho, batata palha, tomate e alface.",
    preco: 18,
    imagem: "img/produtos/burguer-especial.png",
  },
  {
    categoria: "lanche",
    nome: "Burguer BACON",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, bacon, milho, batata palha, tomate e alface.",
    preco: 22,
    imagem: "img/produtos/burguer-bacon.png",
  },
  {
    categoria: "lanche",
    nome: "Burguer CALABRESA",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, calabresa, milho, batata palha, tomate e alface.",
    preco: 22,
    imagem: "img/produtos/burguer-calabresa.png",
  },
  {
    categoria: "lanche",
    nome: "Burguer FRANGO",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, milho, batata palha, tomate e alface.",
    preco: 20,
    imagem: "img/produtos/burguer-frango.png",
  },
  {
    categoria: "lanche",
    nome: "Burguer TUDO",
    descricao:
      "Pão, hambúrguer, presunto, mussarela, salsicha, ovo, bacon, calabresa, milho, batata palha, tomate e alface.",
    preco: 25,
    imagem: "img/produtos/burguer-tudo.png",
  },
  {
    categoria: "lanche",
    nome: "Batata Frita",
    descricao: "",
    preco: 5,
    imagem: "img/produtos/batata.png",
  },
  {
    categoria: "lanche",
    nome: "Porção de Batata",
    descricao: "",
    preco: 25,
    imagem: "img/produtos/porcao-batata.png",
  },
  {
    categoria: "bebida",
    nome: "Coca Cola 2 LTS",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/coca-2l.png",
  },
  {
    categoria: "bebida",
    nome: "Coca Cola 1 LT",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/coca-1l.png",
  },
  {
    categoria: "bebida",
    nome: "Guaraná Antarctica 2 LT",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/guarana-2l.png",
  },
  {
    categoria: "bebida",
    nome: "Guaraná Antarctica 1 LT",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/guarana-1l.png",
  },
  {
    categoria: "bebida",
    nome: "Coca Cola Lata 350 ml",
    descricao: "",
    preco: 7,
    imagem: "img/produtos/coca-lata.png",
  },
  {
    categoria: "bebida",
    nome: "Guaraná Antarctica Lata 350 ml",
    descricao: "",
    preco: 7,
    imagem: "img/produtos/guarana-lata.png",
  },
  {
    categoria: "bebida",
    nome: "Creme de Cupuaçu 500 ml",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/creme-cupuacu.png",
  },
  {
    categoria: "bebida",
    nome: "Creme de Maracujá 500 ml",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/creme-maracuja.png",
  },
  {
    categoria: "bebida",
    nome: "Creme de Morango 500 ml",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/creme-morango.png",
  },
  {
    categoria: "bebida",
    nome: "Creme de Acerola 500 ml",
    descricao: "",
    preco: 15,
    imagem: "img/produtos/creme-acerola.png",
  },
  {
    categoria: "bebida",
    nome: "Suco de Cupuaçu 500 ml",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/suco-cupuacu.png",
  },
  {
    categoria: "bebida",
    nome: "Suco de Maracujá 500 ml",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/suco-maracuja.png",
  },
  {
    categoria: "bebida",
    nome: "Suco de Morango 500 ml",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/suco-morango.png",
  },
  {
    categoria: "bebida",
    nome: "Suco de Acerola 500 ml",
    descricao: "",
    preco: 12,
    imagem: "img/produtos/suco-acerola.png",
  },
  {
    categoria: "bebida",
    nome: "Água mineral com Gás 500 ml",
    descricao: "",
    preco: 5,
    imagem: "img/produtos/agua-gas.png",
  },
  {
    categoria: "bebida",
    nome: "Água mineral 500 ml",
    descricao: "",
    preco: 4,
    imagem: "img/produtos/agua-mineral.png",
  },
  {
    categoria: "bebida",
    nome: "Cerveja Lata Antarctica 269 ml",
    descricao: "",
    preco: 5,
    imagem: "img/produtos/cerveja-antartica.png",
  },
  {
    categoria: "bebida",
    nome: "Cerveja Lata Budweiser 269 ml",
    descricao: "",
    preco: 5,
    imagem: "img/produtos/cerveja-budweiser.png",
  },
];

async function seedProducts() {
  try {
    console.log("Limpando produtos antigos...");

    await pool.query("DELETE FROM products");
    await pool.query("ALTER SEQUENCE products_id_seq RESTART WITH 1");

    console.log("Inserindo produtos do cardápio...");

    for (const produto of produtosPadrao) {
      await pool.query(
        `INSERT INTO products 
          (name, description, price, category, image_url, available)
         VALUES 
          ($1, $2, $3, $4, $5, $6)`,
        [
          produto.nome,
          produto.descricao,
          produto.preco,
          produto.categoria,
          produto.imagem,
          true,
        ],
      );

      console.log(`Produto inserido: ${produto.nome}`);
    }

    console.log("Cardápio transferido com sucesso!");
  } catch (error) {
    console.error("Erro ao transferir cardápio:", error);
  } finally {
    await pool.end();
  }
}

seedProducts();
