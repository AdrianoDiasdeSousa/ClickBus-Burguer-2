const nodemailer = require("nodemailer");

function criarTransporterEmail() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("Configurações de email não encontradas.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function enviarEmailRecuperacao({ para, nome, link }) {
  const transporter = criarTransporterEmail();

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await transporter.sendMail({
    from,
    to: para,
    subject: "Recuperação de senha - ClickBus Burguer",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Recuperação de senha</h2>
        <p>Olá${nome ? `, ${nome}` : ""}.</p>
        <p>Recebemos uma solicitação para redefinir sua senha no ClickBus Burguer.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <p>
          <a href="${link}" style="background:#ff9800;color:#000;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Redefinir senha
          </a>
        </p>
        <p>Se você não solicitou isso, ignore este email.</p>
        <p>Esse link expira em 30 minutos.</p>
      </div>
    `,
  });
}

module.exports = {
  enviarEmailRecuperacao,
};
