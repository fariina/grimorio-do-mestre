# Escopo e verificação

O inventário verificável está em `reference/inventory.json` e o relatório em `docs/COBERTURA.md`.
Não há promessa de equivalência integral ao 5etools. Dados editoriais restritos dependem de importação autorizada.

- [x] Inventariar categorias, arquivos, fontes e licenças separadas (50 categorias e índices auxiliares)
- [x] Adquirir subconjunto aberto com proveniência e contagem verificável (4.316 registros, incluindo páginas dos SRDs)
- [x] Biblioteca: pesquisa indexada, filtros, versões, favoritos, notas e referências
- [x] Importação local: JSON 5etools/nativo, Markdown, texto, PDF, prévia e revisão
- [x] Campanhas: regras/fontes, personagens, NPCs, locais, facções, missões, pistas e diário
- [x] Cenas e testes preparados/improvisados
- [x] Encontros, variantes, aliados, duplicação e modelos
- [x] Calculadoras independentes de dificuldade 2014 e 2024
- [x] Sessão e combate persistentes, recursos, efeitos, recarga e desfazer
- [x] Tesouro com tabelas identificadas, trilha de rolagens e entrega (tabelas comerciais dependem de importação local)
- [x] Tradução separada, glossário, lotes, cache e alertas de números
- [x] Backup versionado, restauração atômica e migração inicial
- [x] Testes de cálculos, integridade, persistência e fluxo completo (29 testes passaram)
- [x] Verificação funcional dos formulários em DOM e documentação de inicialização
- [x] QA visual em navegador real: fluxo campanha/biblioteca/encontro/combate em banco isolado (v1.2)
- [ ] Conteúdo fora do SRD: depende de arquivos/autorização; detalhes por categoria no relatório
- [ ] Tradução integral PT-BR: pendente de revisão/lotes; nenhum provedor automático configurado
- [ ] Heranças/transformações avançadas do 5etools e OCR: não implementados; dados originais preservados e limites indicados

## Correções da integração v1.1

- [x] Participantes individuais com IDs e snapshots versionados
- [x] Adição direta da biblioteca com quantidade e encontro ativo/criação rápida
- [x] Cards na preparação e combate, PV temporários, condições, duplicação e undo
- [x] Início do combate preserva o estado preparado
- [x] Renderizador central de estruturas e marcações, referências e dados clicáveis
- [x] Tradução estruturada persistente, glossário, estados, cache e preservação de revisões
- [x] Goblin 2014 com tradução editorial revisada; demais registros pendentes quando aplicável
- [x] Adaptador opcional LibreTranslate e configuração explícita, sem envio externo padrão
- [x] Migração/backup v2 e leitura de backups v1
- [x] Cenário A–L em DOM e testes de isolamento, persistência e monstros complexos
- [x] Verificação visual local em navegador real, com participantes independentes e estado preservado no combate

## Publicação privada v1.2

- [x] Backup antes das alterações e integridade/preservação de sete tabelas pessoais
- [x] OAuth GitHub com ID único autorizado, PKCE, sessões persistentes e CSRF
- [x] Autorização no servidor para APIs, arquivos, importação, exportação e backups
- [x] Modo local preservado; modo público exige autenticação e HTTPS
- [x] Dockerfile, dependências fixadas, proposta Render com disco e variáveis de ambiente
- [x] Lista positiva de publicação, .gitignore/.dockerignore e verificação de credenciais
- [x] Testes locais de reinício, restauração e recuperação de sessão durante edição (33 testes)
- [x] Instalação limpa, PDF.js por npm e testes sem a biblioteca pessoal
- [x] Guia de login, importação consciente de backup, manutenção e custos
- [x] Repositório privado criado pelo proprietário e acesso de gravação confirmado pela integração
- [ ] Enviar código e comparar hashes da árvore remota com o pacote local
- [ ] Contratar hospedagem: proprietário decidiu não contratar por enquanto; manter preparado
- [ ] Configurar OAuth externo e publicar o container
- [ ] Verificar HTTPS, duas contas reais, volume e reinício/republicação no host
- [ ] Importar dados pessoais: somente por ação explícita do proprietário após validar login
