# Fontes, licenças e atribuições

Consulta realizada em 26 de outubro de 2026. Código da aplicação, código de terceiros e conteúdo de regras têm licenças separadas.

## Referência e inventário

- [5etools](https://5e.tools/): navegação, categorias e ferramentas de referência.
- [Repositório indicado pelo próprio site](https://github.com/5etools-mirror-3/5etools-src), commit `8790755429c346d20020eed7826d312d484c393f`: JSON de categorias, índices, esquema, marcadores SRD e metadados. [README](https://github.com/5etools-mirror-3/5etools-src/blob/8790755429c346d20020eed7826d312d484c393f/README.md) declara MIT para o projeto. O código desse projeto não foi reutilizado. **Essa declaração não foi estendida ao conteúdo dos livros.**
- [Wiki indicada pelo site](https://wiki.tercept.net/en/5eTools/InstallGuide): referência de instalação/self-hosting, consultada; a página não retornou corpo textual útil pela ferramenta.
- `reference/inventory.json`: árvore de arquivos, contagens por categoria/fonte, commit, falhas e hash do pacote; `reference/exclusions.json`: exclusões conservadoras. O inventário não representa compra, licença ou autorização para o restante do catálogo.

## SRD aberto

- [Página oficial do SRD](https://www.dndbeyond.com/srd).
- [SRD 5.2.1 oficial](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf), linha revisada de 2024: arquivo completo em `reference/srd-5.2.1.pdf`.
- [SRD 5.1 oficial em CC BY](https://www.dndbeyond.com/attachments/39j2li89/SRD5.1-CCBY4.0License.pdf), regras de 2014: arquivo completo em `reference/srd-5.1.pdf`.
- [FAQ oficial para criadores](https://www.dndbeyond.com/creator-faq): distinção entre conteúdo do SRD aberto e demais conteúdos/regras disponibilizados publicamente.
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://www.dndbeyond.com/srd. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Adaptações: indexação e estruturação em banco local, separação de edições, extração do texto por página, filtragem de complementos, exibição de fichas e campos separados para traduções do usuário. Não há alegação de endosso da Wizards of the Coast ou do 5etools. As traduções inseridas no aplicativo não são apresentadas como oficiais.

## Métodos de encontro

- [2024 — DM’s Toolbox: Combat Encounter Difficulty e XP Budget per Character](https://www.dndbeyond.com/sources/dnd/br-2024/dms-toolbox). Usado para fatos numéricos e implementação independente do algoritmo, sem cópia da prosa do capítulo.
- [2014 — Building Combat Encounters](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/building-combat-encounters): limiares, multiplicadores e ajuste por tamanho do grupo. Implementação independente, separada da de 2024.

Os testes reproduzem os resultados de exemplos de cálculo dessas fontes. As limitações da avaliação e as premissas da aplicação são visíveis na calculadora. Não se estimou ND de criaturas personalizadas com fórmulas de outra edição.

## Código e ferramentas

- Código novo do Grimório do Mestre: licença MIT em `LICENSE`. Material SRD mantém CC BY 4.0.
- [Node.js](https://nodejs.org/) e [SQLite nativo do Node](https://nodejs.org/docs/latest-v24.x/api/sqlite.html): runtime local. Nenhum executável foi redistribuído neste projeto.
- [PDF.js / Mozilla](https://mozilla.github.io/pdf.js/getting_started/), versão 6.4.299: Apache 2.0. Nesta instalação, módulos, fontes e mapas ficam em `public/vendor`; o GitHub conserva licença e manifesto. Novas instalações usam a dependência `pdfjs-dist` fixada no `package-lock.json`; o backend serve os arquivos de `node_modules`, sem redistribuir bibliotecas geradas ou usar CDN. A biblioteca é servida do disco, sem CDN em tempo de uso.
- jsdom e @napi-rs/canvas são ferramentas de desenvolvimento/teste; não são necessárias para iniciar a aplicação. Suas licenças acompanham a instalação pelo registro npm.

Os scripts de aquisição não contornam autenticação, paywalls ou restrições de acesso. Livros, aventuras, imagens e suplementos fora do pacote aberto devem ser importados localmente apenas quando houver autorização aplicável. Nenhum desses materiais é publicado por padrão.

## Parser e tradução da integração v1.1

O parser foi confrontado com [render.js do 5etools no commit inventariado](https://github.com/5etools-mirror-3/5etools-src/blob/8790755429c346d20020eed7826d312d484c393f/js/render.js), especialmente ataques, acerto, salvaguardas, recarga, dados e referências. A implementação compartilhada é própria. Os formatos encontrados nos monstros do pacote foram inventariados e há testes com Goblin, dragão vermelho adulto, enxame de ratos e arquimago.

O contrato do provedor opcional segue a [API oficial do LibreTranslate](https://docs.libretranslate.com/guides/api_usage/). A aplicação não inclui nem pressupõe um servidor ativo. A tradução editorial local do Goblin SRD 5.1 é uma adaptação em PT-BR não oficial, mantém os marcadores/valores e segue a atribuição CC BY 4.0 do SRD já registrada acima.
