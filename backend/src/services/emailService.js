const nodemailer = require("nodemailer");

function criarTransporterEmail() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    console.error("Variáveis de email ausentes:", {
      EMAIL_HOST: Boolean(host),
      EMAIL_PORT: Boolean(port),
      EMAIL_USER: Boolean(user),
      EMAIL_PASS: Boolean(pass),
    });

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

  console.log("Tentando enviar email de recuperação:", {
    from,
    para,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
  });

  const info = await transporter.sendMail({
    from,
    to: para,
    replyTo: process.env.EMAIL_USER,
    subject: "Redefinir senha do ClickBus Burguer",
    text: `
Olá${nome ? `, ${nome}` : ""}.

Recebemos uma solicitação para redefinir sua senha no ClickBus Burguer.

Use este link para criar uma nova senha:
${link}

Esse link expira em 30 minutos.

Se você não solicitou isso, ignore este email.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin-bottom: 20px;">Redefinir senha</h2>

        <p>Olá${nome ? `, ${nome}` : ""}.</p>

        <p>Recebemos uma solicitação para redefinir sua senha no ClickBus Burguer.</p>

        <p>Clique no botão abaixo para criar uma nova senha:</p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
          <tr>
            <td
              bgcolor="#ff9800"
              style="
                border-radius: 8px;
                background: #ff9800;
                text-align: center;
              "
            >
              <a
                href="${link}"
                style="
                  display: inline-block;
                  padding: 12px 18px;
                  font-family: Arial, sans-serif;
                  font-size: 16px;
                  font-weight: bold;
                  color: #000000;
                  text-decoration: none;
                  border-radius: 8px;
                "
              >
                Redefinir senha
              </a>
            </td>
          </tr>
        </table>

        <p>Se você não solicitou isso, ignore este email.</p>
        <p>Esse link expira em 30 minutos.</p>
      </div>
    `,
  });

  console.log("Resultado do envio de email:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });
}

module.exports = {
  enviarEmailRecuperacao,
};
