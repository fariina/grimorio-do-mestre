# Verificação da preparação para publicação

Preparação Node: 26/10/2026. Atualização Sites: 27/10/2026. Código local v1.2.0 e adaptação web v1.3.0. Este relatório distingue testes locais de condições verificadas na hospedagem.

## Dados existentes

- Backup anterior às alterações: `backups/antes-publicacao-1793043960706.json`, 20.307.243 bytes, mantido apenas nesta máquina.
- `PRAGMA integrity_check`: **ok**.
- Comparação integral de sete tabelas pessoais com o backup: campanhas, elementos, anotações, histórico, glossário, traduções estruturadas e cache. **Conteúdo preservado**.
- Nenhum banco, backup ou livro pessoal enviado ao GitHub ou a um provedor nesta preparação.
- Nenhum serviço de tradução instalado/configurado.

## Verificações locais aprovadas

**37 testes automatizados**, executados no workspace e na cópia limpa preparada para publicação. Os bancos dos testes são temporários ou em memória e não modificam a campanha do proprietário.

- Fluxo campanha → cena → teste → encontro → participantes → combate → recompensa → backup.
- Modo de produção recusa configuração sem OAuth/HTTPS e caminhos fora de DATA_DIR; modo local recusa escutar publicamente.
- OAuth com state vinculado ao navegador, PKCE S256, expiração e consumo único. Transporte GitHub simulado nos testes.
- Comparação estrita do ID de conta: ID autorizado entra; outro ID, mesmo usando o mesmo login, recebe 403.
- Requisições anônimas a APIs, biblioteca, arquivos, PDFs e backup recebem 401. Só login/autenticação, CSS do login e saúde mínima são públicos.
- Gravações com origem/token CSRF inválidos bloqueadas, Host e protocolo validados; cookies Secure/HttpOnly/SameSite=Lax com prefixo __Host-.
- Logout revoga a sessão; sessão expirada não lê o backup; segredos e tokens GitHub não aparecem na exportação de campanha.
- Reinício do backend conserva a sessão válida, campanhas, vínculos, IDs, snapshots e PV dos participantes. Restauração é transacional e mantém autenticação separada.
- Edição durante expiração de sessão permanece aberta; login em outra aba e Retomar sessão usam o novo token para salvar.
- Regras por edição, cálculos, renderização segura, busca bilíngue, importação e atualização de biblioteca preservando notas continuam passando.

Também foi testada uma instalação limpa com `npm ci --omit=dev --ignore-scripts`. O servidor inicia sem campanhas e sem pacote pessoal de biblioteca, e serve interface, PDF.js, worker, mapas e fontes a partir da dependência instalada. Arquivos `.env`, SQLite, backups e JSON da biblioteca não fazem parte da cópia. Depois foram instaladas as dependências de desenvolvimento para executar a suíte completa nessa mesma distribuição de código.

A lista positiva de publicação e a revisão de padrões conhecidos de credenciais são geradas por `node scripts/source-manifest.mjs`: `.runtime/release/manifest.json` contém hashes/tamanhos e `.runtime/release/tree.json` o conteúdo a enviar. Os resultados desses arquivos são locais e não incluem os diretórios de dados. A validação usa uma lista positiva além das regras de `.gitignore`/`.dockerignore`.

## Navegador real

Verificação local em navegador conectado, `127.0.0.1:3211`, com banco de QA isolado em `.runtime/`. Campanha explicitamente identificada como teste; quatro fichas SRD usadas exclusivamente nesse ambiente.

Verificados: criação de campanha 2014, formulário de encontro, seleção do encontro de destino, inclusão de três Goblins, dano somente no segundo participante (PV 7/4/7), condição Envenenado somente no primeiro e início de combate preservando o estado. O tema, navegação, formulários e cards foram inspecionados visualmente. Isso não substitui o teste da aplicação publicada em HTTPS.

## Código publicado no GitHub

Repositório: [fariina/grimorio-do-mestre](https://github.com/fariina/grimorio-do-mestre), criado pelo proprietário. A integração confirmou a conta `fariina` (ID 84630880), a visibilidade **Private** e a permissão de gravação antes e depois do envio.

Código publicado em `main`, commit [68cd637e486946308a6b02d79084d0cf20788cad](https://github.com/fariina/grimorio-do-mestre/commit/68cd637e486946308a6b02d79084d0cf20788cad). A verificação posterior leu branch, commit e árvore completa pela API: **63 arquivos**, sem truncamento, todos com caminho, tamanho, modo e hash de objeto Git idênticos ao pacote local auditado. O commit inicial do proprietário foi preservado como ancestral, sem envio forçado. Este relatório e o README recebem em seguida a atualização documental do resultado.

Nenhum arquivo extra apareceu na árvore: bancos, backups, livros, arquivos `.env` reais, caches e temporários ficaram fora. Os arquivos `.env.example` e `.env.production.example` são modelos sem segredos. A suíte de 33 testes e o guia de instalação fazem parte da distribuição. A biblioteca e as campanhas online não são preenchidas por esse envio.

## Pendências externas — não verificadas

- Render: o proprietário decidiu **não contratar por enquanto**, mantendo apenas a configuração preparada. Nenhum serviço pago foi criado. Conexão, contratação e publicação ficam suspensas até nova instrução explícita; não solicitar novamente aprovação de custo nesta etapa.
- Registrar OAuth App na conta GitHub e configurar Client ID/Secret no painel do provedor; não há segredos externos disponíveis nesta preparação.
- Construção e execução da imagem Docker no Render: Docker não está instalado nesta máquina. Instalação de dependências e execução Node foram testadas; build de container não foi declarado aprovado.
- Login real de `fariina`, rejeição real de segunda conta e verificação HTTPS/cookies no host definitivo.
- Confirmar disco montado e gravável em `/var/data`; reiniciar e republicar o serviço verificando os mesmos dados. Testes locais de reabertura não comprovam a persistência do provedor.
- Testar fluxo completo e backup/restauração na URL definitiva, com dados de verificação antes de importar qualquer conteúdo pessoal.

O repositório permanece privado. A aplicação foi publicada pelo Sites em https://grimorio-do-mestre.vividbuddy13.chatgpt.site; o Render permanece sem contratação. O procedimento e o checklist de validação externa estão em [PUBLICACAO.md](PUBLICACAO.md).

## Atualização: hospedagem Sites

O AgroContábil Academy foi localizado na integração Sites, publicado em agrocontabilacademy.com.br. Foi criado outro Site, privado, para o Grimório; o Academy não sofreu alterações.

- URL confirmada pela publicação privada: https://grimorio-do-mestre.vividbuddy13.chatgpt.site.
- Projeto: appgprj_6adfbe917acc8191b53f027334edcf74. Audiência custom, somente um usuário proprietário, zero grupos e zero visitantes externos. A operação de publicação privada também verifica essa condição no backend da plataforma.
- Fonte Sites inicial: ec03e2c985ed496b662df54802edd8802e60df6f. Compilação Vinext/Workers concluída; migrações D1 incluídas e R2 provisionado. Os arquivos pessoais ficaram fora da fonte e do pacote.
- 37 testes locais aprovados, incluindo o adaptador D1 com SQLite real, concorrência transacional, pesquisa FTS5, biblioteca completa local e restauração compatível com o backup v2.
- Workerd/D1/R2 reais em prévia local: campanha, cena, teste, três Goblins com IDs independentes, PV 7/4/7, condição individual, combate, recompensa e backup/restauração aprovados.
- Navegador real: interface Sites, conta simulada de loopback, cena/teste e combate persistidos inspecionados. Essa identidade simulada não está no bundle de produção.
- Produção: escrita de UUID isolado confirmou D1 e R2 por HTTPS; a mesma versão foi republicada e a leitura retornou o mesmo UUID com matches=true em 27/10/2026. A sonda não acessa campanhas ou biblioteca e não cria o proprietário. A chave foi removida da configuração da publicação final.
- Sem login, o navegador mostrou a barreira “Entre para acessar”, sem apresentar dados. Login real da conta proprietária e teste interativo completo em produção dependem de concluir a entrada no ChatGPT; não foram presumidos a partir dos testes locais.
- Banco local íntegro e backup antes da adaptação: backups/antes-sites-1793048167839.json, somente nesta máquina. Nenhuma transferência automática da campanha ou da biblioteca pessoal.

As pendências Render acima descrevem apenas uma alternativa não contratada; não bloqueiam o Site publicado. Procedimentos e limites específicos em [HOSPEDAGEM-SITES.md](HOSPEDAGEM-SITES.md).

## Validação final em produção — 27/10/2026

Estas verificações posteriores substituem a pendência de login descrita na primeira publicação Sites acima.

- Login real com a conta ChatGPT proprietária concluído no navegador. O painel exibiu acesso pessoal e carregou novamente após publicar a versão final.
- Campanha `[TESTE ONLINE] Validação da hospedagem`, encontro personalizado e dois participantes caseiros criados pela interface publicada. Dano de 3 somente no segundo participante conservou PV 10/7; iniciar combate preservou esses valores.
- A versão final foi republicada com o combate já salvo. Depois de atualizar a página, a mesma campanha, encontro, combate e PV 10/7 continuaram disponíveis. Os dados de teste ficam identificados; nenhuma campanha pessoal local foi transferida.
- Exportação de backup pela interface online concluída. Arquivo JSON v2 conferido nesta máquina: uma campanha, dois elementos (encontro e combate), zero registros de biblioteca e dois históricos. O backup contém somente os dados de validação e o glossário inicial.
- Requisições HTTPS anônimas a `/`, `/api/bootstrap`, `/api/records` e `/api/backup` retornaram 401. Política da plataforma confirmada com um único proprietário, zero grupos e zero visitantes externos. Outra identidade recebe 403 nos testes de backend; uma segunda conta real não foi utilizada.
- Rota técnica `/internal/storage-check` desativada permanentemente no código: HTTP 404 em produção mesmo apresentando a antiga chave. A chave também foi removida da configuração da plataforma.
- Fonte Sites final: `2528fd01f2c8de86a2c7b6a08dcf29d7dea13211`, versão `appgprj_6adfbe917acc8191b53f027334edcf74~appgver_232cf44ff29881918a3aa79e8a4d6d59`. Republicação concluída: `appgdep_6ae08f5d069c8191914c4437948531f2`.
- Suíte final executada novamente: 37 testes aprovados, zero falhas. Integridade local `ok` e sete tabelas pessoais iguais ao backup anterior.

A restauração completa passou nos testes automatizados e no runtime local Workerd/D1/R2. A restauração pela interface publicada ainda não foi declarada verificada. Importar o backup pessoal continua sendo uma ação do proprietário após entrar; instalações local e web não sincronizam automaticamente.
