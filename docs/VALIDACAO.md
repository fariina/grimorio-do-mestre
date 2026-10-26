# Validação da entrega

Executada em 26 de outubro de 2026 com Node.js 24.21.0 e SQLite 3.53.4 no Windows.

- 16 testes passaram, zero falhas. Comando: node --test tests/*.test.mjs.
- Testes de domínio: exemplos oficiais 2014/2024, limiares, multiplicadores, ND fracionário, dados sem eval, tesouro e sub-tabelas, PV temporários, cura e durações.
- SQLite: importação, edição/variantes, busca bilíngue sem acentos, atualização preservando notas/traduções, concorrência, reabertura do banco, backup/restauração e rejeição de backup inconsistente.
- API: criação de campanha, personagem, cena, teste, encontro, combate, dano e undo, recompensa, vínculos, prévia e aplicação de importação, lote de tradução, backup/restauração e proteção de origem/token.
- Formulários DOM: criação real pelos eventos da interface, autosave, preparação de cena/teste/encontro, participante, início de combate, dano/undo e geração/salvamento de recompensa.
- Integridade do pacote inicial: 4316 registros; 4316 entradas FTS; SQLite integrity_check=ok; 0 violações de chave estrangeira. SHA-256 conferido com o inventário.
- Referências reconhecidas no pacote: 7560; alvos ausentes: 490. Ausências são exibidas, não preenchidas com conteúdo inventado. Nem todas as macros do 5etools são implementadas.
- Extração local dos PDFs oficiais: 364 páginas físicas do SRD 5.2.1 e 403 do SRD 5.1. A ordem de colunas/tabelas não é garantida; PDFs originais preservados.

**Limite de validação:** não houve inspeção visual em navegador real: a ferramenta de automação retornou inventário vazio de navegadores. Os testes DOM não comprovam aparência, responsividade ou comportamento específico de todos os navegadores. PDF.js foi exercitado na extração local dos SRDs, mas o fluxo visual de seleção de PDF no navegador não foi automatizado.

Dados sintéticos usados pelos testes são identificados no código e não entram no banco da aplicação. Confira reference/audit.json para os detalhes técnicos e docs/COBERTURA.md para pendências.
