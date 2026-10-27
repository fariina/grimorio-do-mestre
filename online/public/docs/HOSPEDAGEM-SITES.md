# Grimório do Mestre na mesma hospedagem do Academy

O AgroContábil Academy foi identificado na integração Sites, com o domínio agrocontabilacademy.com.br. O Grimório usa um **Site separado e privado**; nenhuma configuração ou audiência do Academy foi alterada.

Projeto Sites: `appgprj_6adfbe917acc8191b53f027334edcf74`. Endereço atribuído: https://grimorio-do-mestre.vividbuddy13.chatgpt.site. Publicação confirmada pela integração Sites. O controle privado permite somente o proprietário, sem grupos ou visitantes externos. A configuração permanente fica em `online/.openai/hosting.json`.

## Arquitetura e acesso

- A instalação local continua usando Node.js 24 e o SQLite existente, sem mudança de banco ou instalação de tradução.
- A pasta `online/` contém a adaptação para o runtime Cloudflare Workers do Sites. D1 guarda registros, pesquisa FTS5, campanhas, participantes, histórico e traduções. R2 guarda prévias e cópias anteriores a importações/restaurações.
- O Sites autentica pela conta ChatGPT e restringe o Site ao proprietário. APIs também exigem identidade e vinculam o identificador estável do primeiro acesso autorizado pelo controle privado. O ID deve continuar igual nos acessos seguintes; outra identidade recebe 403.
- Gravações exigem origem correta e token CSRF vinculado ao proprietário. Credenciais de hospedagem não ficam no código. O banco de controle de acesso não é substituído ao restaurar um backup de campanha.
- O login do Sites substitui OAuth GitHub **nesta hospedagem**. A configuração GitHub/Render continua disponível como alternativa e permanece sem contratação.

As migrações são versionadas em `online/drizzle/`. A plataforma as aplica na publicação; não há criação de tabelas em requisições. D1 e R2 são bindings persistentes, separados dos arquivos efêmeros do Worker. Uma troca de versão do código não copia nem reinicializa os dados.

As gravações usam revisão de elemento e um lote transacional com revisão global. Conflitos preservam o texto aberto e rejeitam o lote. Importações/restaurações grandes são preparadas em um conjunto de dados separado; a troca do conjunto ativo ocorre somente após validar e gravar tudo. Uma falha conserva o conjunto anterior. Conjuntos anteriores são mantidos para recuperação e ocupam espaço; não há limpeza automática destrutiva.

## Levar sua campanha para a web

1. Na instalação local, abra `Iniciar.cmd` e http://127.0.0.1:3210.
2. Em **Dados e backups**, exporte o backup completo e guarde o JSON fora do projeto.
3. Abra a URL publicada do Grimório e entre com a **mesma conta ChatGPT proprietária** usada para criar este Site.
4. Em **Dados e backups**, escolha o JSON, revise as contagens e confirme **RESTAURAR**.
5. Confira campanhas, cenas, notas, encontros, participantes, PV, condições e traduções antes de jogar.

Esse passo envia conscientemente os dados do arquivo ao armazenamento privado da hospedagem. Nenhum banco, livro ou backup desta máquina é enviado automaticamente durante a publicação. A biblioteca online começa vazia. As instalações local e online são independentes; não existe sincronização automática.

## Backup, restauração e manutenção

Use **Exportar backup completo** no site para baixar o JSON v2, compatível com o formato local; backups v1 também são aceitos. Antes de importar ou restaurar, o servidor guarda uma cópia em R2. **Ver cópias do servidor** permite baixar essas cópias anteriores. Guarde backups também fora da plataforma.

Atualizações preservam `project_id`, os bindings DB/BUCKET, migrações aplicadas e a audiência privada. Não recrie o Site nem remova os bindings para atualizar código. O fluxo de publicação do plugin Sites sincroniza a fonte, compila, empacota migrações e publica a versão exata. O repositório privado GitHub mantém também a versão local e a adaptação web.

Para desenvolvimento a partir do GitHub, instale as dependências da raiz, depois as de `online/`. Execute `node scripts/prepare-online.mjs` na raiz para sincronizar a interface e os módulos compartilhados, sem copiar dados pessoais. Na pasta online, o perfil portable usa `npm run dev`. As migrações locais precisam ser aplicadas antes da prévia conforme o README do starter preservado em `online/README-STARTER.md`. O login simulado `seedy@sites.test` existe somente na prévia de loopback e não entra na publicação.

Antes da mudança para Sites foi criado `backups/antes-sites-1793048167839.json`, somente local, e a integridade do SQLite foi confirmada.

## Custos e limites

Nenhum serviço Render, conta Cloudflare externa ou assinatura paga adicional foi contratado. A publicação usa os recursos disponibilizados pela integração Sites da conta existente. Isso não é promessa de uso ilimitado: aplicam-se as cotas e políticas da plataforma/conta, que não são expostas integralmente por estas ferramentas. Não houve ativação de plano pago externo.

O Worker tem 128 MB de memória. O limite de requisição é 60 MB; a interface mantém 45 MB por arquivo e 55 MB de texto por lote. JSON, prévias e restaurações consomem memória: arquivos grandes podem precisar ser divididos. Cada linha de dados é limitada conservadoramente a 1,85 MB, incluindo o índice; D1 tem limite de 2 MB por linha. PDF continua sendo extraído no navegador por PDF.js, sem OCR/CDN ou envio do arquivo original ao tradutor.

Prévias duram 30 minutos. Cópias automáticas e conjuntos anteriores ocupam espaço persistente. Não há agendamento de exportação para terceiros, tradução automática ativa ou dependência de IA. Para jogar no site é necessário internet; a versão local permanece disponível para uso offline.

## Verificações e limites da evidência

Os testes locais abrangem autenticação, ID único, CSRF, conflito transacional, pesquisa bilíngue, preservação de notas, biblioteca completa local, snapshots, reinício e restauração v1/v2. O runtime real Workerd com D1/R2 local também exercitou campanha → cena/teste → três Goblins → dano individual → condição → combate → recompensa → backup/restauração. Os dados de QA ficam somente em bancos temporários ou na pasta ignorada `online/.wrangler`.

A sonda `/internal/storage-check` foi usada exclusivamente para testar um UUID isolado em D1/R2 após republicar. Não leu campanhas, biblioteca ou backups, nem criou o proprietário. Após a validação, a chave foi removida da configuração e o endpoint foi desativado no próprio código da entrega: retorna 404 mesmo que uma configuração antiga ainda contenha a chave. Não há uma API de diagnóstico ativa capaz de acessar seus dados.

Publicação bem-sucedida, controle privado e sonda persistente são verificações diferentes de login real do proprietário e fluxo completo em produção. Em 27/10/2026, a republicação da versão 1 preservou o mesmo UUID de teste em D1 e R2 (HTTP 200, matches=true). Essa sonda não acessou campanhas nem vinculou o proprietário. O login real do proprietário e o fluxo completo na sua sessão continuam sujeitos à entrada pela conta ChatGPT. A chave temporária de verificação foi removida da configuração para a publicação final. Não transfira seus dados antes de conseguir entrar na conta proprietária.

Fontes técnicas: [Workers e bancos](https://developers.cloudflare.com/workers/databases/connecting-to-databases/), [FTS5 no D1](https://developers.cloudflare.com/d1/sql-api/sql-statements/), [limites D1](https://developers.cloudflare.com/d1/platform/limits/). O fluxo e a identidade seguem a documentação instalada do plugin Sites.
