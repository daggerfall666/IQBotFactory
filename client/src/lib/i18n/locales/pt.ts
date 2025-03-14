export default {
  admin: {
    errors: {
      api_key: {
        invalid_format: "Formato de chave API inválido",
        invalid_key: "Chave API inválida ou expirada",
        save_failed: "Não foi possível salvar a chave API",
        load_failed: "Erro ao carregar a chave API do sistema"
      },
      general: {
        unknown: "Erro desconhecido",
        try_again: "Por favor, tente novamente"
      }
    },
    success: {
      api_key_updated: "Chave API do sistema atualizada com sucesso"
    },
    validation: {
      api_key_required: "A chave API é obrigatória",
      api_key_format: "A chave API deve começar com 'sk-ant-'"
    }
  }
};
