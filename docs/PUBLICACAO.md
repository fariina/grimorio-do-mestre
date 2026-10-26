# Publicação privada — versão 1.2

O código pode ficar em um repositório privado; o acesso aos dados é controlado separadamente pelo backend. A configuração de produção exige OAuth GitHub, HTTPS e caminhos de armazenamento em `DATA_DIR`. A conta autorizada é `fariina`, ID numérico **84630880**, obtido da integração GitHub. O nome de usuário não substitui a comparação desse ID.

## Situação desta entrega

Decisão do proprietário: **não contratar hospedagem por enquanto; deixar a configuração preparada**. A criação/publicação do repositório privado GitHub continua autorizada após concluir o login. Não criar serviço, aplicar Blueprint ou ativar cobranças sem uma nova instrução explícita. O repositório sozinho não oferece acesso online à aplicação Node.js/SQLite.

Preparação local implementada, com testes automatizados de autenticação e persistência. Consulte `VERIFICACAO-PUBLICACAO.md` para os resultados e o que ainda depende de acesso externo. Um arquivo `render.yaml` preparado não significa que um serviço foi contratado ou publicado.

Repositório criado pelo proprietário: [fariina/grimorio-do-mestre](https://github.com/fariina/grimorio-do-mestre). A integração confirmou a visibilidade **Private**, a conta proprietária e a permissão de gravação. A publicação e conferência da árvore de código estão registradas no relatório de verificação. A aplicação não possui URL de hospedagem ativa.

Nenhum banco, livro ou backup pessoal deve ser enviado para GitHub ou para a hospedagem durante a publicação. Foi gerado um backup local antes das alterações em `backups/antes-publicacao-1793043960706.json`. Ele contém dados privados e não faz parte do pacote de código.

## Arquitetura e custo propostos

Render Web Service executando o `Dockerfile`, Node.js 24, uma instância Starter e disco persistente de 1 GB montado em `/var/data`. A interface e as APIs são servidas pelo mesmo processo. SQLite, WAL, sessões e cópias antes de restaurações ficam nesse disco. Não é um GitHub Pages nem uma publicação apenas da interface.

Estimativa consultada em 26/10/2026: **US$ 7/mês do serviço + US$ 0,25/mês de disco = US$ 7,25/mês de base**. Impostos, câmbio e consumo adicional podem aumentar o total. Esse valor não é um teto de cobrança. Revise o resumo de cobrança da sua conta antes de criar o serviço. O arquivo não cria um serviço de tradução, banco gerenciado, cron ou ambiente extra.

Não aplicar o Blueprint nem criar o serviço pago sem aprovação explícita do proprietário. O plano gratuito do Render não oferece o disco necessário: gravar SQLite no sistema efêmero perderia dados após reinícios/publicações. O disco permite uma única instância e introduz uma breve indisponibilidade em novas publicações. 512 MB de RAM e 1 GB de disco são recursos limitados; importações grandes, histórico e backups acumulados podem exigir espaço/memória adicionais. Acompanhe o uso; não aumente o plano automaticamente.

Fontes: [discos persistentes](https://render.com/docs/disks), [limitações gratuitas](https://render.com/docs/free), [preços](https://render.com/pricing), [Starter a US$ 7](https://render.com/articles/best-netlify-alternatives-in-2026), [Blueprints](https://render.com/docs/blueprint-spec), [Web Services e HTTPS](https://render.com/docs/web-services).

## Código seguro no GitHub

1. Crie um repositório **Private** na conta correta, por exemplo `grimorio-do-mestre`. Inicialize com um README se usar a integração de commits. Não use nem altere os repositórios públicos existentes.
2. Execute `node scripts/source-manifest.mjs`. A lista positiva gera `.runtime/release/manifest.json` com caminhos, tamanhos e SHA-256 e `.runtime/release/tree.json` para publicação pela integração GitHub. A revisão de credenciais detecta alguns formatos conhecidos, não substitui a inspeção de código.
3. Publique somente os arquivos do manifesto. `.gitignore` e `.dockerignore` também excluem dados pessoais e segredos. Nunca use upload da pasta inteira ou `git add -f` para contornar exclusões.
4. Confirme **Private** no GitHub após a criação e após a publicação. Não habilite Pages nem adicione colaboradores.

O pacote não inclui `data/`, `backups/`, `.env`, `.runtime/`, livros/PDFs, caches ou o JSON gerado da biblioteca desta máquina. Inclui código, inventário, licenças, glossário/tradução editorial distribuível e quatro fichas abertas somente como fixtures de teste; as fixtures não são carregadas na aplicação. **A aplicação online começa sem campanhas e sem biblioteca pessoal.** A biblioteca existente permanece intacta na instalação local. Depois de testar o login, você pode restaurar seu backup para copiá-la conscientemente ao provedor.

## Configurar Render e GitHub OAuth

Pré-requisitos: acesso à sua conta GitHub no navegador e conexão do provedor ao repositório privado. Autorize somente o repositório necessário. Não compartilhe senhas ou tokens em conversas.

Após aprovar o custo, importe `render.yaml` como Blueprint no Render, ou crie um Web Service Docker com os mesmos parâmetros. Confira que há **disco persistente de 1 GB em `/var/data`**, uma instância, plano Starter e publicação automática desligada. O disco precisa estar gravável pelo usuário `node` da imagem. O primeiro início depende dos segredos OAuth; uma falha por configuração incompleta é intencional, sem abrir acesso público aos dados.

Na página do serviço, obtenha a URL HTTPS real atribuída pelo Render. No GitHub, em **Settings → Developer settings → OAuth Apps → New OAuth App**, crie um aplicativo pessoal com:

- Nome: `Grimório do Mestre pessoal`.
- Homepage URL: a URL HTTPS real do serviço, sem caminho.
- Authorization callback URL: a mesma origem seguida de `/auth/callback`.

A criação de credenciais e a autorização do aplicativo podem exigir sua interação direta no GitHub. Copie o Client ID e o Client Secret **diretamente para os segredos do Render**. Não coloque o segredo em GitHub, JavaScript, arquivos versionados, prints ou mensagens. [Documentação OAuth GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

Use `.env.production.example` como referência; não o renomeie para `.env` no repositório remoto. Variáveis:

| Variável | Valor / finalidade |
| --- | --- |
| `NODE_ENV` | `production`; rejeita modo local |
| `AUTH_MODE` | `github` |
| `HOST` | `0.0.0.0` |
| `PORT` | Fornecida pela hospedagem; padrão da imagem 10000 |
| `APP_ORIGIN` | URL HTTPS real, sem caminho; no Render pode ficar ausente e usar `RENDER_EXTERNAL_URL` |
| `TRUST_PROXY` | `true` somente atrás do proxy HTTPS confiável do Render |
| `GITHUB_OWNER_ID` | `84630880` (somente essa conta) |
| `GITHUB_CLIENT_ID` | Client ID do seu OAuth App |
| `GITHUB_CLIENT_SECRET` | Segredo, preenchido no painel da hospedagem |
| `SESSION_SECRET` | Aleatório, pelo menos 32 caracteres; Blueprint gera automaticamente. Preserve entre publicações |
| `DATA_DIR` | `/var/data` (ponto do disco) |
| `DB_PATH` | `/var/data/grimorio.sqlite` |
| `AUTH_DB_PATH` | `/var/data/auth.sqlite` |
| `BACKUP_DIR` | `/var/data/backups` |
| `MAX_UPLOAD_BYTES` | `60000000`, tamanho máximo da requisição JSON |

Deixe `TRANSLATION_URL` e `TRANSLATION_API_KEY` ausentes. Não há instalação de tradução nesta etapa. Para gerar manualmente um segredo fora do Blueprint: `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`; transfira-o ao gerenciador de segredos e não o registre em arquivos versionados.

Fora do Render, use um proxy HTTPS que substitua `X-Forwarded-Proto`, preserve o Host correto e impeça acesso externo direto ao processo Node. Não habilite `TRUST_PROXY` em um servidor HTTP exposto diretamente. Variáveis não comprovam que um volume é persistente: confirme a montagem no provedor e teste uma nova publicação.

## Login e verificação antes de importar dados

1. Abra a URL HTTPS em janela anônima: deve aparecer o login. `/api/bootstrap`, `/api/backup` e `/api/records` devem retornar **401** sem login. `/healthz` é público e retorna somente um estado de saúde sem dados.
2. Entre com `fariina` e autorize o OAuth App. O backend consulta `/user` no GitHub e compara o ID imutável. Outra conta autenticada deve receber **403**. O teste real com duas contas depende da sua interação; testes automatizados usam identidades simuladas e não provam a configuração externa.
3. Crie uma campanha de verificação, uma cena e um teste, prepare um encontro, inclua participantes e inicie o combate. Altere PV e condições. Exporte um backup.
4. Reinicie o serviço no Render, entre novamente se necessário e confira os mesmos dados e IDs. Publique novamente **usando o mesmo disco** e confira outra vez. Apenas depois disso considere a persistência online verificada.
5. Restaure o backup de verificação pela interface e valide contagens/participantes. Exclua a campanha de verificação antes de importar dados pessoais, se não quiser mantê-la.

Sessões duram oito horas, com cookies `__Host-`, Secure, HttpOnly, SameSite=Lax, token CSRF e verificação de origem nas gravações. O token de acesso GitHub é usado apenas para identificar a conta e não é persistido. O banco de sessões é separado dos backups de campanha. **Sair** revoga a sessão atual. Se expirar durante uma edição, a tela oferece login em outra aba e **Retomar sessão**, preservando o formulário aberto. Não recarregue antes de recuperar ou copiar edições pendentes.

## Levar seus dados depois do login

1. Na aplicação **local**, abra **Dados e backups → Exportar backup completo**. Guarde essa cópia fora do projeto. Não anexe o JSON ao GitHub.
2. Confirme login e verificações acima na aplicação online. Abra **Dados e backups**, selecione o JSON local e veja a prévia.
3. Confira contagens e digite **RESTAURAR** para substituir o banco online. Isso envia ao provedor os dados contidos no arquivo, incluindo biblioteca, notas, traduções e campanhas. Faça isso somente quando quiser armazená-los nessa hospedagem.
4. Verifique campanhas, cenas, participantes, PV e anotações. A instalação local é preservada e continua disponível; não existe sincronização automática entre as duas instalações.

Os PDFs originais não acompanham o backup JSON. O leitor de regras e os textos importados continuam disponíveis; links para PDFs que não estão no servidor não estarão disponíveis. Novos arquivos só são enviados pela ação explícita de importação. Extração de PDF ocorre no navegador por PDF.js servido pelo próprio backend, sem CDN/OCR.

## Atualizações, backups e restauração

Antes de atualizar, exporte e baixe um backup autenticado. Atualize apenas o código e faça publicação manual do commit no Render, mantendo o mesmo disco, caminhos e `SESSION_SECRET`. As migrações SQLite rodam ao abrir o banco; o histórico de esquema evita recriar campanhas. Nunca execute um reset de disco/banco como passo de atualização.

Exporte backups regularmente e guarde cópias fora da hospedagem. As cópias `antes-restauracao-*.json` ficam no mesmo volume e protegem contra substituição acidental; não protegem contra perda do volume. Não há exportação automática para serviços externos. O Render oferece snapshots de disco, mas a própria documentação recomenda backups lógicos para bancos; use o JSON validado da aplicação como recuperação portátil. Cópias antigas do diretório de backups ocupam o mesmo 1 GB: revise-as e remova somente após guardar uma cópia externa e conferir o caminho.

Para restaurar pelo navegador: escolha um JSON v1/v2, confira a prévia e digite RESTAURAR. A operação é transacional e faz backup anterior. Feche outras abas e interrompa edições durante a restauração. Credenciais e sessões não fazem parte do JSON. Para recuperar localmente, `node server.mjs` e use o mesmo fluxo. Para cópia física do SQLite, pare o serviço e copie todos os arquivos necessários; não copie apenas o `.sqlite` de um banco em uso ignorando WAL/SHM.

Se houver comprometimento de sessão, troque `SESSION_SECRET` no Render e reinicie; isso invalida todas as sessões existentes. Se o segredo OAuth vazar, revogue-o no GitHub, gere outro e atualize o painel. Não mude a visibilidade do repositório para solucionar permissões de publicação.

## Limites de importação e conectividade

45 MB por arquivo e 55 MB de texto por lote na interface; 60 MB para a requisição JSON completa. Escapes JSON aumentam o tamanho: um lote perto do teto pode precisar ser dividido. Importações, backup JSON e restaurações são processados em memória; o plano de 512 MB pode limitar bibliotecas maiores. Revise o tamanho real do seu backup antes de enviá-lo. Aumentar `MAX_UPLOAD_BYTES` não aumenta a RAM nem garante que o proxy aceite o mesmo tamanho.

Prévias ficam em memória, expiram em 30 minutos e precisam ser refeitas após reiniciar; somente alterações confirmadas entram no SQLite. A aplicação hospedada exige internet para acesso e para o login no GitHub. O modo local continua funcionando sem internet com a biblioteca já importada. Não há cobrança nem dependência de IA ou tradução configuradas nesta entrega.
