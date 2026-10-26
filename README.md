# Grimório do Mestre

Aplicação pessoal em português brasileiro para preparar e narrar campanhas de D&D. Servidor em Node.js 24, SQLite local e interface web sem etapa de build. O modo local não exige conta ou chave de IA. Uma cópia obtida do GitHub usa `npm ci` para instalar PDF.js antes de iniciar; esta instalação já contém os arquivos necessários.

Repositório privado: [fariina/grimorio-do-mestre](https://github.com/fariina/grimorio-do-mestre), branch `main`. O código foi publicado; **a aplicação ainda não está hospedada online**. Por decisão do proprietário, a configuração do Render fica preparada, sem contratar serviço pago. Seus dados pessoais não acompanham o repositório.

## Abrir no seu computador

1. Na pasta `C:\Users\andre.farina\Documents\Site DND`, dê dois cliques em **Iniciar.cmd**.
2. Abra **http://127.0.0.1:3210** no Chrome, Edge ou Firefox atual.
3. Mantenha a janela do servidor aberta. Encerre com **Ctrl+C**.

O iniciador usa Node.js do PATH ou o runtime Node 24 já encontrado na instalação local do Codex. Se esse runtime deixar de existir, instale o [Node.js 24 LTS](https://nodejs.org/) e execute novamente. O iniciador não instala programas nem altera configurações do Windows.

Se você já tem Node 24 no PATH, no terminal desta pasta:

```powershell
node server.mjs
```

Também funciona `npm start`, quando npm estiver instalado. **Não abra index.html diretamente**, pois a aplicação precisa do servidor e do SQLite.

Se a porta estiver ocupada, a janela avisará. Pode haver outra instância já disponível no endereço acima. Para mudar a porta, copie `.env.example` para `.env` e altere `PORT=3210`. A URL passa a usar a nova porta.

## Acesso online privado

Consulte [o guia de publicação](docs/PUBLICACAO.md) e [o relatório de verificação](docs/VERIFICACAO-PUBLICACAO.md). A versão 1.2 implementa OAuth GitHub com uma única conta autorizada, sessões persistidas em SQLite, proteção de todas as APIs/arquivos privados e configuração de volume. A proposta Render tem custo e exige aprovação antes de criar o serviço. Código preparado e testes locais não comprovam uma publicação externa.

**O pacote de código do GitHub não inclui sua biblioteca gerada, PDFs, campanhas nem backups.** A cópia online começa vazia; importe seu backup pela interface após validar o login. Os 4.316 registros citados neste README descrevem a biblioteca desta instalação local e o pacote adquirido anteriormente. O inventário preserva a cobertura; a tela mostra a contagem real de cada instalação.

Em uma nova cópia do repositório, instale Node.js 24 LTS e rode:

```powershell
npm ci
npm start
```

Para modo local, deixe as variáveis de produção ausentes e use ".env.example" como referência. Não exponha o modo local à rede: a configuração rejeita HOST público sem OAuth.

## Primeiro uso

1. Crie uma campanha. A edição inicial é **2024 / D&D 5.5**.
2. Configure fontes habilitadas, suplementos, conteúdo caseiro e regras da casa. Fontes vazias permitem todas as fontes identificadas da edição principal.
3. Em **Mundo e personagens**, adicione jogadores/personagens com nível e PV. Marque os integrantes ativos para a calculadora.
4. Em **Sessões e cenas**, prepare narrativa, diálogos, pistas, consequências e segredos. Adicione testes com CD, gatilho e resultados.
5. Crie um encontro em **Encontros**; escolha **Montar adversários**, adicione criaturas e ajuste variantes. Consulte **Dificuldade** e depois **Iniciar combate**.
6. Use a **Mesa de sessão** para testes, consulta de regras, dados, iniciativa, PV, condições e acontecimentos.
7. Em **Tesouros**, gere uma recompensa com fórmulas caseiras ou uma tabela importada. Revise e salve, vinculando ao encontro. Edite a recompensa para registrar sua entrega.

O conteúdo inicial é real, derivado dos SRDs abertos e identificado por fonte/edição; **não há campanhas fictícias pré-criadas**. A biblioteca não é uma cópia integral do 5etools. Consulte [cobertura e pendências](docs/COBERTURA.md).

## Consulta e edições

A biblioteca pesquisa nomes originais, nomes traduzidos e texto, ignorando acentos. Os filtros incluem fonte, edição, categoria e atributos de magias, monstros e itens. Desative **Aplicar edição e fontes da campanha** para consultar outras versões. Cada ficha informa a fonte, página/seção, edição, licença declarada, importação e estado da tradução. Referências ainda ausentes são sinalizadas.

Os registros de páginas dos SRDs usam a **página física do PDF**, indicada na seção. Os registros estruturados mantêm a página do livro identificada pelo upstream. Os PDFs oficiais estão na pasta `reference/` e podem ser abertos localmente.

Até dez fichas podem ficar abertas em abas no leitor. Favoritos e notas são pessoais, separados dos dados de referência. **Ctrl+S** salva edições abertas; **/** abre a busca; **Alt+M** abre a mesa; **Esc** fecha o painel após salvar as edições aplicáveis.

## Persistência e salvamento

- Banco: `data/grimorio.sqlite`, com SQLite/WAL e migrações de esquema v1/v2. Nenhuma campanha depende de localStorage; ele guarda apenas a preferência da campanha selecionada.
- Elementos da campanha têm salvamento automático após uma breve pausa na edição. Campanhas, traduções e formulários de ação também têm botões explícitos de salvar. Observe o indicador de salvamento.
- Uma edição concorrente de outra aba produz conflito em vez de sobrescrever silenciosamente seu texto. Mantenha o formulário aberto e copie suas alterações antes de recarregar.
- O histórico permite desfazer até 50 gravações por elemento, incluindo ações de combate. Não é um controle de versão ilimitado.
- Condições/efeitos em rodadas diminuem na virada da rodada. Concentração, resistências e gatilhos de início/fim de turno exigem controle manual; isso é indicado na mesa.

## Importar conteúdo

Abra **Importações**, escolha arquivos e o destino, confira edição/fonte/licença e clique em **Ler arquivos e preparar prévia**. Revise nomes, categorias, edições e atualizações antes de aplicar. A biblioteca preserva suas notas, favoritos e traduções ao atualizar o mesmo identificador.

São aceitos múltiplos arquivos, até 45 MB por arquivo e 55 MB de texto por lote (requisição limitada a 60 MB). Arquivos maiores devem ser divididos. As prévias expiram após 30 minutos ou quando o servidor é reiniciado.

### JSON 5etools

Arquivos com chaves como `spell`, `monster`, `class`, `subclass`, `classFeature`, `race`, `item`, `feat`, `table` e demais categorias são reconhecidos. Chaves desconhecidas são preservadas e informadas na prévia. Fontes XPHB/XDMG/XMM e PHB/DMG/MM identificam 2024 e 2014; para outros suplementos, selecione a edição conscientemente.

Livros/aventuras com `{ "data": [...] }` entram em seções pesquisáveis. O importador preserva estruturas e heranças `_copy`, mas transformações avançadas do 5etools precisam de revisão: a ficha mostra esse limite e mantém os dados originais.

O formato `loot.json` é convertido em tabelas de tesouro com tabelas auxiliares locais. Escolhas abertas ou estruturas não reconhecidas viram uma **decisão manual indicada no resultado**, sem distribuição presumida. Não há download automático desses livros.

### JSON nativo de referência

Exemplo de **conteúdo caseiro**, para adaptar; este exemplo não é carregado automaticamente:

```json
{
  "records": [{
    "id": "meu-conteudo-estavel",
    "name": "My Rule",
    "namePt": "Minha regra",
    "category": "rule",
    "source": "Minha campanha",
    "edition": "caseiro",
    "license": "Autoria própria",
    "raw": {"entries": ["Seu texto de regra da casa."]}
  }]
}
```

Sem `id`, o sistema deriva um identificador de categoria, nome original, fonte, edição e discriminadores de classe/seção. Use IDs próprios para preservar vínculos quando renomear conteúdo pessoal. A importação não substitui anotações/traduções já salvas na camada pessoal.

### Campanha JSON

Selecione **Campanha ativa** no destino. Exemplo estrutural caseiro:

```json
{
  "entities": [{
    "id": "minha-cena-estavel",
    "kind": "scene",
    "name": "Nome da minha cena",
    "data": {
      "summary": "Objetivo da cena",
      "narration": "Texto para narrar",
      "secret": "Informação reservada ao mestre",
      "links": []
    }
  }]
}
```

Tipos aceitos: `character`, `npc`, `faction`, `location`, `quest`, `clue`, `timeline`, `journal`, `document`, `scene`, `check`, `encounter`, `reward`, `session`. Um teste pode referenciar `sceneId`; um encontro também pode usar `sceneId` e `locationId`. Use IDs dos elementos nos vínculos. A prévia permite revisar o conteúdo completo. Atualizações de elementos existentes exigem marcar a opção correspondente; o histórico registra a alteração.

Markdown e texto entram como documentos, preservando o texto. A aplicação não tenta inventar NPCs/cenas a partir da prosa. PDF usa PDF.js incluído localmente, sem serviços externos, extraindo texto por página. **Sem OCR**: PDFs escaneados precisam de OCR local. Colunas, tabelas, símbolos e hifenação exigem revisão. Não há contorno de senhas ou restrições. O PDF pessoal original não é armazenado pelo aplicativo; apenas o texto extraído após sua confirmação.

### Tabelas de tesouro próprias

Use **Tesouros → Importar/criar tabela**, que fornece um modelo explicitamente caseiro. Campos: `name`, `source`, `edition`, `dice` e `rows`. Cada linha tem `min`, `max`, `coins` e/ou `rewards`. Moedas usam `pc`, `pp`, `pe`, `po`, `pl`; fórmulas aceitam `2d6+3` e `3d6*100`. Intervalos devem cobrir exatamente os resultados possíveis sem lacunas/sobreposições. Recompensas usam `name`, `kind`, `quantity`, `value` e `notes`. Toda geração mostra as tabelas e rolagens.

## Tradução

O adaptador opcional LibreTranslate está implementado, mas nenhum serviço está configurado por padrão. A tradução editorial do Goblin de 2014 e o glossário estão incluídos; o restante é identificado como pendente. Não há tradução oficial presumida. Você pode corrigir nome/texto em cada ficha ou usar **Traduções** para exportar lotes de até 100 registros sem tradução do filtro atual. Preencha `namePt`, `textPt` e o estado no JSON e reimporte. O glossário acompanha o lote, o hash impede aplicar texto a um original alterado e o cache evita reaplicações idênticas.

Os estados são original, manual, automática e revisada. Traduções automáticas são identificadas como não oficiais. Alertas apontam diferenças em números/frações/dados; revise também alcance, duração, área, ação, limites, exceções e unidades. O alerta não garante equivalência de regras. Nenhum serviço é acessado para traduzir e unidades nunca são convertidas automaticamente.

## Backup e restauração

Em **Dados e backups**, escolha **Exportar backup completo**. O JSON `grimorio-backup`, versão 2 (compatível com restauração da versão 1), inclui biblioteca, dados pessoais, campanhas, combates, histórico, glossário e traduções. Copie-o para um lugar seguro fora deste disco.

Para restaurar, selecione o JSON, revise as contagens e digite **RESTAURAR**. O banco atual será substituído em uma transação após validação; uma cópia anterior ficará em `backups/antes-restauracao-*.json`. Feche outras abas antes de restaurar e atualize a página depois. Um arquivo inválido não deve alterar o banco.

Também é possível copiar a pasta `data` **com o servidor encerrado**. Não copie apenas o arquivo principal enquanto ele estiver aberto, pois o SQLite pode ter gravações no WAL.

## Arquitetura e verificação

- `server.mjs`: interface e API; `lib/auth.mjs`: OAuth, autorização e sessões; `lib/deployment.mjs`: configuração segura local/produção.
- `lib/store.mjs`: SQLite, FTS5, histórico, revisão, importação e backups.
- `lib/catalog.mjs`: normalização, identificação, metadados e referências.
- `lib/rules.mjs`: dados, dificuldade e tesouro; sem eval.
- `lib/combat.mjs`: transições de combate e controle de recursos.
- `lib/validation.mjs`: validação de domínio antes de gravar/restaurar.
- `public/`: interface PT-BR; PDF.js Apache 2.0 servido localmente, pelos arquivos existentes ou pelo pacote npm instalado.
- `reference/`: pacote inicial aberto, PDFs oficiais, inventário, exclusões, hashes e proveniência.
- `tests/`: testes de regras, persistência, API e fluxo dos formulários DOM.

Foi escolhida uma aplicação própria em vez de adaptar a interface inteira do 5etools: separa regras de edições, traduções e dados pessoais, oferece SQLite e histórico sem herdar o armazenamento em cookies da referência. O código MIT do 5etools foi avaliado, mas não foi incorporado à aplicação.

Para desenvolvimento, instale as dependências de teste com `npm install` e rode:

```powershell
npm test
```

Os testes cobrem exemplos oficiais de dificuldade, ND fracionário, dados, tesouro, PV temporários, durações, undo, importação, busca bilíngue/sem acentos, preservação de notas, persistência após reabrir o banco, restauração/rollback e o fluxo completo de preparação até combate/recompensa. Os dados de teste ficam em bancos em memória ou diretórios temporários e não entram na sua campanha.

Na versão 1.2, o navegador foi conectado e houve QA visual local em banco isolado: campanha, biblioteca, três participantes independentes e início do combate preservando PV/condições. A suíte atual tem 33 testes aprovados. Login real e persistência no provedor ainda dependem da publicação: veja [o relatório](docs/VERIFICACAO-PUBLICACAO.md). A cobertura e os demais limites estão em [docs/COBERTURA.md](docs/COBERTURA.md).

Para reconstruir as referências, os scripts de aquisição são explícitos e acessam apenas fontes públicas; nunca leem seu banco ou arquivos pessoais. `scripts/acquire.mjs` gera o inventário e candidatos SRD; `prepare-reference.mjs` filtra/extrai os PDFs com as ferramentas locais; `enrich-reference.mjs` acrescenta as listas de classes; `enrich-inventory.mjs` e `report.mjs` completam o relatório. Faça backup antes de atualizar. O servidor usa o hash do pacote para atualizar referências sem sobrescrever a camada de anotações/traduções.

## Fontes e direitos

Consulte [docs/FONTES.md](docs/FONTES.md) para fontes, licenças e atribuições. Uso local não é tratado como autorização geral para reproduzir livros. Conteúdo fora do SRD depende de arquivo e autorização fornecidos por você. A aplicação não sincroniza arquivos automaticamente nem envia telemetria. No modo local, o uso normal independe de serviços externos; no modo hospedado, seus arquivos importados ficam no provedor e o login requer GitHub.


## Integração biblioteca → encontro (v1.1)

Em **Encontros**, escolha **Administrar participantes** para definir o encontro ativo. Na biblioteca, busque um monstro, escolha a quantidade e use **Adicionar N × nome**. Sem destino ativo, o diálogo permite escolher um encontro existente ou criar outro. Uma ficha fora da edição/fontes da campanha exige confirmação e mantém a identificação original.

Cada criatura recebe ID, nome, estado e snapshot próprios. Os cards funcionam antes e durante o combate: dano, cura, PV/temporários/iniciativa editáveis, condições, renomeação, notas, recursos, duplicação e remoção. **Desfazer** recupera a última ação, incluindo remoções. Ao iniciar o combate, os IDs, PV, condições, recursos e ajustes preparados são preservados; a biblioteca não é regravada. Alterar os dados de referência não atualiza silenciosamente snapshots já usados.

A ficha completa abre sobre o painel. Valores estruturados e marcadores são processados pela mesma camada compartilhada. Dados JSON aparecem apenas em **Dados originais**. Marcadores desconhecidos geram diagnóstico local em `/api/render-diagnostics`, preservando o conteúdo legível.

Itens podem ser incorporados ao inventário; magias, a listas associadas à campanha/personagem/cena; regras, a referências rápidas. Os vínculos conservam fonte, edição e versão.

### Tradução estruturada e provedor opcional

Na ficha, use **Editar tradução por trechos**. A versão original é preservada; números, dados e marcadores de referência são validados ao salvar. Correções manuais têm prioridade. Biblioteca, encontro e combate consultam a mesma tradução para o mesmo hash de origem; uma fonte alterada deixa a nova versão pendente sem apagar a anterior.

Para tradução automática, configure `.env` com `TRANSLATION_URL` apontando para uma instância LibreTranslate que suporte português. Configure `TRANSLATION_API_KEY` apenas se essa instância exigir chave; `TRANSLATION_SOURCE=auto` permite inglês ou espanhol. Reinicie o servidor. Para um serviço local, exemplo de URL: `http://127.0.0.1:5000/`. Nenhum tradutor é instalado ou iniciado pelo projeto.

O botão **Traduzir com serviço configurado** separa texto de estrutura, protege valores/referências, aplica o glossário e reutiliza cache. Serviços externos exigem confirmação da ficha a enviar. Estados pendente, automático, revisado e falha são distintos; o provedor usa `pt`, portanto revise vocabulário e redação para PT-BR. A implementação foi testada com transporte local de teste; um serviço real só pode ser validado depois de configurado.

Encontros antigos são migrados preservando seus campos e histórico. Como o formato anterior não guardava snapshots, a cópia vinculada na migração usa o registro disponível naquele momento; isso é identificado na procedência. Backups anteriores ficam preservados em `backups/`.

Relatório desta atualização: [docs/INTEGRACAO-V1.1.md](docs/INTEGRACAO-V1.1.md).
