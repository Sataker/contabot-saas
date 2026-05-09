import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { cnpj: "12.345.678/0001-99" },
    update: {},
    create: {
      nome: "Contabilidade Demo",
      cnpj: "12.345.678/0001-99",
      contadorNome: "Dr. Carlos Mendes",
      contadorWhatsapp: "5511999988887",
      plano: "PROFISSIONAL",
      status: "ATIVO",
      config: JSON.stringify({
        horario_inicio: "08:00",
        horario_fim: "18:00",
        dias_uteis_apenas: true,
        intervalo_lembrete_dias: 3,
        max_tentativas_lembrete: 3,
        assinatura: "\n\n_Contabilidade Demo_",
      }),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@contabot.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@contabot.com",
      passwordHash: hashSync("admin123", 10),
      nome: "Carlos Mendes",
      role: "admin",
    },
  });

  const client1 = await prisma.client.upsert({
    where: { tenantId_cpfCnpj: { tenantId: tenant.id, cpfCnpj: "123.456.789-00" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Joao Silva",
      cpfCnpj: "123.456.789-00",
      whatsapp: "5511999991111",
      email: "joao@email.com",
      tipo: "PF",
      status: "ATIVO",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { tenantId_cpfCnpj: { tenantId: tenant.id, cpfCnpj: "987.654.321-00" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Maria Santos",
      cpfCnpj: "987.654.321-00",
      whatsapp: "5511999992222",
      email: "maria@email.com",
      tipo: "PF",
      status: "ATIVO",
    },
  });

  const client3 = await prisma.client.upsert({
    where: { tenantId_cpfCnpj: { tenantId: tenant.id, cpfCnpj: "12.345.678/0001-99" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Padaria Bom Pao Ltda",
      cpfCnpj: "11.222.333/0001-44",
      whatsapp: "5511999993333",
      email: "contato@bompao.com",
      tipo: "PJ_SIMPLES",
      status: "ATIVO",
    },
  });

  // Sample documents
  await prisma.document.createMany({
    data: [
      { tenantId: tenant.id, clientId: client1.id, tipoDoc: "informe_rendimento", subtipo: "Informe Bradesco 2025", valor: "45.230,00", competencia: "2025", confianca: 0.95, status: "PROCESSADO", resumo: "Informe de rendimentos Bradesco" },
      { tenantId: tenant.id, clientId: client1.id, tipoDoc: "recibo_medico", subtipo: "Consulta Dr. Ana", valor: "350,00", competencia: "03/2026", confianca: 0.88, status: "PROCESSADO", resumo: "Recibo consulta medica" },
      { tenantId: tenant.id, clientId: client2.id, tipoDoc: "nota_fiscal", subtipo: "NF Servico", valor: "1.200,00", competencia: "04/2026", confianca: 0.42, status: "REVISAR", resumo: "Nota fiscal de servico - baixa confianca" },
      { tenantId: tenant.id, clientId: client3.id, tipoDoc: "guia_tributo", subtipo: "DAS Simples Nacional", valor: "892,50", competencia: "04/2026", confianca: 0.97, status: "PROCESSADO", resumo: "Guia DAS abril 2026" },
    ],
  });

  // Sample pendencias
  await prisma.pendencia.createMany({
    data: [
      { tenantId: tenant.id, clientId: client1.id, tipo: "documento_faltando", descricao: "Informe de rendimentos do Itau 2025", prazo: new Date("2026-05-31"), status: "EM_COBRANCA", tentativas: 2 },
      { tenantId: tenant.id, clientId: client2.id, tipo: "documento_faltando", descricao: "Comprovante de endereco atualizado", prazo: new Date("2026-05-15"), status: "PENDENTE", tentativas: 0 },
      { tenantId: tenant.id, clientId: client3.id, tipo: "guia_vencendo", descricao: "DAS Maio 2026 vencendo em 20/05", prazo: new Date("2026-05-20"), status: "PENDENTE", tentativas: 0 },
    ],
  });

  // Sample guias
  await prisma.guia.createMany({
    data: [
      { tenantId: tenant.id, clientId: client3.id, tipoGuia: "DAS", competencia: "05/2026", vencimento: new Date("2026-05-20"), valor: "910,00", status: "A_ENVIAR" },
      { tenantId: tenant.id, clientId: client3.id, tipoGuia: "DAS", competencia: "04/2026", vencimento: new Date("2026-04-20"), valor: "892,50", status: "PAGO" },
      { tenantId: tenant.id, clientId: client1.id, tipoGuia: "DARF", competencia: "04/2026", vencimento: new Date("2026-04-30"), valor: "1.523,00", status: "ENVIADO" },
    ],
  });

  console.log("Seed concluido!");
  console.log("Login: admin@contabot.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
