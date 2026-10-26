# Verificação da preparação para publicação

Data: 26/10/2026. Código v1.2.0. Este relatório distingue testes locais de condições verificadas na hospedagem.

## Dados existentes

- Backup anterior às alterações: `backups/antes-publicacao-1793043960706.json`, 20.307.243 bytes, mantido apenas nesta máquina.
- `PRAGMA integrity_check`: **ok**.
- Comparação integral de sete tabelas pessoais com o backup: campanhas, elementos, anotações, histórico, glossário, traduções estruturadas e cache. **Conteúdo preservado**.
- Nenhum banco, backup ou livro pessoal enviado ao GitHub ou a um provedor nesta preparação.
- Nenhum serviço de tradução instalado/configurado.

## Verificações locais aprovadas

**33 testes automatizados**, executados no workspace e na cópia limpa preparada para publicação. Os bancos dos testes são temporários ou em memória e não modificam a campanha do proprietário.

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

## Pendências externas — não verificadas

- Envio do código e conferência remota: o proprietário criou [fariina/grimorio-do-mestre](https://github.com/fariina/grimorio-do-mestre). A integração confirmou a conta `fariina` (ID 84630880), a visibilidade **Private** e a permissão de gravação. A árvore inicial contém somente README.md. O envio usa a lista positiva de arquivos; o fechamento desta etapa exige comparar a árvore remota com o pacote local.
- Render: o proprietário decidiu **não contratar por enquanto**, mantendo apenas a configuração preparada. Nenhum serviço pago foi criado. Conexão, contratação e publicação ficam suspensas até nova instrução explícita; não solicitar novamente aprovação de custo nesta etapa.
- Registrar OAuth App na conta GitHub e configurar Client ID/Secret no painel do provedor; não há segredos externos disponíveis nesta preparação.
- Construção e execução da imagem Docker no Render: Docker não está instalado nesta máquina. Instalação de dependências e execução Node foram testadas; build de container não foi declarado aprovado.
- Login real de `fariina`, rejeição real de segunda conta e verificação HTTPS/cookies no host definitivo.
- Confirmar disco montado e gravável em `/var/data`; reiniciar e republicar o serviço verificando os mesmos dados. Testes locais de reabertura não comprovam a persistência do provedor.
- Testar fluxo completo e backup/restauração na URL definitiva, com dados de verificação antes de importar qualquer conteúdo pessoal.
- Conferir novamente a visibilidade Private e os hashes de todos os arquivos no GitHub após o envio.

O link do repositório privado está confirmado. A aplicação ainda não tem URL online, pois a contratação foi adiada pelo proprietário. O procedimento e o checklist de validação externa estão em [PUBLICACAO.md](PUBLICACAO.md).
