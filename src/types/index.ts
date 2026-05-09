import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      role: string;
    };
  }

  interface User {
    tenantId: string;
    role: string;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: string;
    role: string;
  }
}

export type TenantConfig = {
  horario_inicio: string;
  horario_fim: string;
  dias_uteis_apenas: boolean;
  intervalo_lembrete_dias: number;
  max_tentativas_lembrete: number;
  assinatura: string;
  mensagens: {
    doc_recebido: string;
    doc_revisao: string;
    cliente_nao_cadastrado: string;
    guia_envio: string;
    lembrete_1: string;
    lembrete_2: string;
    lembrete_3: string;
    cadastro_confirmado: string;
  };
};
