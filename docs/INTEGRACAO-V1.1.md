# Correções da integração v1.1

Verificação local realizada em 26 de outubro de 2026.

## Implementação

- Biblioteca → participantes individuais no encontro ativo, com quantidade e escolha/criação rápida de destino.
- Snapshots por participante: ID, hash de conteúdo, versão de importação, fonte/edição, ficha usada, PV, temporários, iniciativa, condições, recursos e notas independentes.
- Cards em preparação e combate, incluindo dano/cura, edição direta, condições, duplicação, remoção, renomeação, ficha completa e desfazer. O início do combate conserva os IDs e ajustes preparados.
- Renderizador compartilhado em public/content.mjs para objetos, listas, tabelas, exceções, ataques, salvaguardas, dados e referências. JSON apenas na seção técnica. Marcações desconhecidas ficam legíveis e são registradas localmente.
- Tradução por trechos, com originais preservados, hash por versão, cache, glossário e estados pendente/automática/revisada/falha. Goblin SRD 2014 traduzido editorialmente; demais fichas podem continuar pendentes.
- Adaptador opcional LibreTranslate; nenhuma requisição externa automática. Estrutura e valores são protegidos antes do envio. Correções manuais são mantidas e reaproveitadas para trechos idênticos quando a fonte muda.
- Itens entram no inventário; magias em listas associadas; regras em referências rápidas. Fonte e edição são conservadas.
- Backup v2 inclui traduções estruturadas e lê backups v1. Migração de encontros antigos conserva dados e histórico. O formato antigo não tinha cópia histórica da biblioteca; a versão vinculada na migração é identificada como tal.

## Verificações

A suíte cobre:

1. Cenário A–L em DOM: criar campanha 2014 e encontro, buscar Goblin, adicionar três, confirmar nomes/IDs próprios, dar 3 de dano só no segundo, condição só no primeiro, recarregar a interface e iniciar combate preservando tudo.
2. Renderização normal sem JSON/marcadores de Goblin, dragão vermelho adulto, enxame de ratos e arquimago. Dados/ataques clicáveis, referências, exceções e HTML hostil.
3. Snapshots não mudam ao atualizar a biblioteca; participantes, notas e recursos permanecem isolados; persistência após reabrir SQLite e desfazer remoção.
4. Tradução revisada do Goblin e pesquisa PT-BR; invalidação por mudança da fonte; proteção numérica/referências; cache; falha de serviço; ausência de configuração; preservação de correções manuais.
5. Edição direta, duplicação profunda, consumo de PV temporários, cura limitada ao máximo e restauração de backup v1.
6. Suíte anterior de regras, encontros, tesouro, API, backup e formulários.

Resultado: **29 testes passaram, zero falhas**.

Comando: node --test --test-isolation=none tests/*.test.mjs. Os testes usam bancos separados; não inserem campanhas de demonstração no banco pessoal.

Antes da migração foram criados backups locais em backups/antes-integracao-* e backups/antes-migracao-v2-*. A comparação confirmou preservação dos dados anteriores. SQLite integrity_check=ok e nenhuma violação de chave estrangeira. Os detalhes quantitativos ficam no arquivo local backups/verificacao-migracao-v2.json, excluído do repositório.

## Dependências e limites

Para tradução automática falta configurar TRANSLATION_URL; TRANSLATION_API_KEY só se a instância exigir. TRANSLATION_SOURCE aceita auto/en/es. O provedor deve oferecer português (pt); revise a redação para PT-BR. Nenhum serviço real foi configurado nesta execução: o adaptador foi verificado com transporte local de teste. Não se declara tradução integral do acervo.

A inspeção visual em navegador real ainda depende da conexão anunciada pelo usuário. A ferramenta retornou inventário vazio; testes DOM não substituem QA visual. Esta pendência não foi marcada como concluída.
