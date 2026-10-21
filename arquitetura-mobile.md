# Proposta de arquitetura mobile

Proposta inicial para discussão, inspirada em Clean Architecture, Ports and Adapters e Domain-Driven Design (DDD), para aplicações React Native com Expo de médio a grande porte.

## Direção inicial

Minha sugestão inicial seria **organizar por módulos de negócio e, dentro de cada módulo, separar domínio, aplicação, apresentação e infraestrutura conforme a necessidade**.

Isso combina bem com o que você procura: limites claros para crescer, regras de negócio protegidas e uma estrutura que continue confortável de trabalhar no dia a dia.

Consultei o Context7 e o MCP do Expo. Vale distinguir as coisas: a documentação do Expo estabelece convenções para rotas e inicialização; a organização de negócio abaixo é uma proposta minha baseada nos princípios de Clean Architecture, Ports and Adapters e DDD. Eu não apresentaria essa árvore como um padrão oficial ou consenso da comunidade.

Vou usar um aplicativo de comércio como exemplo, mas os conceitos se aplicam a outros negócios.

Uma primeira estrutura seria:

```text
src/
├── app/
│   ├── _layout.tsx
│   └── orders/
│       ├── index.tsx
│       └── [orderId].tsx
│
├── bootstrap/
│   ├── providers.tsx
│   └── dependencies.ts
│
├── modules/
│   ├── orders/
│   │   ├── domain/
│   │   │   ├── order.ts
│   │   │   └── cancellation-policy.ts
│   │   │
│   │   ├── application/
│   │   │   ├── cancel-order.ts
│   │   │   └── ports/
│   │   │       └── order-repository.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── http-order-repository.ts
│   │   │   └── order-mapper.ts
│   │   │
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   └── index.ts
│   │
│   ├── catalog/
│   └── account/
│
├── infrastructure/
│   ├── http/
│   ├── storage/
│   └── observability/
│
└── shared/
    ├── ui/
    └── lib/
```

Essa árvore ilustra onde as responsabilidades ficam quando existem. **Eu não criaria todas essas pastas antecipadamente.**

O primeiro motivo para organizar assim é a proximidade: ao alterar cancelamento de pedidos, você encontra quase tudo em `modules/orders`. Isso facilita entender o comportamento, revisar mudanças e distribuir responsabilidades entre equipes.

Agora, vamos aos limites que fazem essa estrutura funcionar.

## `app/`: navegação do aplicativo

`app/` representa a navegação do aplicativo.

No Expo Router, os arquivos de rota e os layouts ficam nesse diretório; componentes, hooks e outros arquivos ficam fora dele. O layout raiz também é o ponto de entrada para providers e inicialização. Isso está documentado nos [conceitos do Expo Router](https://docs.expo.dev/router/basics/core-concepts/).

Minha preferência é deixar as rotas pequenas. Elas conectam o endereço da aplicação à tela, interpretam parâmetros e configuram aspectos da navegação.

Por exemplo, `app/orders/[orderId].tsx` recebe e valida o parâmetro da rota e apresenta uma tela do módulo de pedidos. As regras para cancelar um pedido ficam no módulo.

O motivo é que **a árvore de navegação e a divisão do negócio têm necessidades diferentes**. Um mesmo módulo pode aparecer em abas, modais e fluxos distintos.

## `modules/`: capacidades do negócio

`modules/` organiza as capacidades do negócio.

Aqui eu procuraria nomes como `orders`, `catalog`, `appointments` ou `billing`, conforme o produto.

DDD contribui principalmente para descobrir esses limites e o significado dos conceitos dentro deles. Um cliente no faturamento pode ter informações e comportamentos diferentes de um cliente no atendimento. Forçar ambos a usar um único modelo global pode produzir acoplamento. Essa distinção é central na ideia de [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html).

Uma ressalva: **cada módulo de código não precisa corresponder a um Bounded Context**. Um contexto pode conter vários módulos menores. A pasta ajuda a expressar uma divisão que precisamos descobrir conversando sobre o negócio.

Por isso, eu começaria por capacidades estáveis, evitando criar um módulo independente para cada tela ou botão.

## `domain/`: conceitos e regras do negócio

`domain/` contém os conceitos e as regras que o aplicativo precisa conhecer.

Exemplos:

- Estados e transições de um pedido.
- Condições de elegibilidade para uma operação.
- Cálculos e restrições de valores.
- Entidades e objetos de valor quando tiverem comportamento relevante.

Esse código deve conseguir funcionar sem React, navegação, requisição HTTP ou armazenamento.

Um critério útil é perguntar: “Essa regra continuaria fazendo sentido se fosse executada por um teste, sem abrir o aplicativo?”

Isso preserva a independência das regras, uma preocupação central da [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html).

Também não exigiria classes. Tipos e funções podem representar muito bem um domínio. Eu escolheria classes quando elas ajudassem a proteger invariantes e controlar mudanças de estado.

E há uma particularidade importante do mobile: **o domínio do aplicativo representa aquilo de que o cliente precisa**. Não precisamos reproduzir todo o modelo do backend. Regras de autorização e consistência continuam sendo validadas pelo servidor, mesmo que o aplicativo antecipe algumas verificações para melhorar a experiência.

## `application/`: operações do aplicativo

`application/` descreve as operações que o aplicativo realiza.

Pense em verbos: cancelar pedido, confirmar agendamento, enviar rascunho.

Um caso de uso coordena os passos necessários: recebe uma intenção, consulta regras do domínio e utiliza contratos para realizar operações externas.

A diferença aparece neste exemplo:

- “Um pedido entregue não permite cancelamento” é uma regra de domínio.
- “Solicitar o cancelamento deste pedido e devolver o resultado” é uma operação da aplicação.
- “Mostrar uma confirmação e depois voltar para a lista” é apresentação.

Eu começaria com funções e dependências explícitas. Uma classe para cada caso de uso acrescentaria pouco em muitos cenários.

Para uma consulta simples, também evitaria multiplicar arquivos que apenas encaminham a mesma chamada. Podemos manter uma operação pequena e um contrato claro, sem construir uma sequência de abstrações sem responsabilidade própria.

## `application/ports/`: contratos necessários às operações

`application/ports/` contém os contratos de que essas operações precisam.

Por exemplo, o caso de uso precisa de uma capacidade de cancelar pedidos. Ele conhece essa capacidade por um contrato; a implementação concreta pode conversar com uma API.

A porta deve falar a linguagem de quem precisa dela. Algo como “cancelar pedido” comunica a necessidade da aplicação melhor que “executar POST”.

Coloquei essas portas em `application/` porque, nesse exemplo, são necessidades dos casos de uso. Alguns contratos podem pertencer ao domínio quando expressarem uma necessidade do próprio modelo. Eu decidiria pelo proprietário da necessidade, mantendo uma convenção consistente.

Também não criaria interfaces para toda função. Uma função recebida como dependência já pode cumprir o papel de porta.

A ideia de Ports and Adapters é permitir que a aplicação interaja com o exterior por limites definidos, inclusive com substitutos em testes. A interface TypeScript é uma das formas de expressar isso. [Artigo original de Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture)

## `modules/orders/infrastructure/`: integrações específicas do módulo

`modules/orders/infrastructure/` implementa as integrações específicas de pedidos.

Aqui entram:

- Requisições e respostas da API de pedidos.
- Implementações dos contratos de persistência.
- Conversões entre os formatos externos e os modelos internos.
- Tradução de erros técnicos para resultados compreensíveis pela aplicação.

Por exemplo, `order-mapper.ts` pode converter nomes de campos, datas e estados recebidos da API. Essa conversão passa a valer a pena quando protege o restante do código de diferenças externas.

Eu não criaria três modelos iguais só para preencher camadas. Mas também evitaria deixar o formato de uma resposta HTTP determinar todo o domínio.

## `presentation/`: experiência construída com React Native

`presentation/` contém a experiência construída com React Native.

Telas, componentes específicos do módulo, hooks, estado visual e formatação ficam aqui.

Um hook pode chamar uma operação da aplicação, acompanhar carregamento e traduzir o resultado para a tela. As bibliotecas de cache e estado também podem participar dessa camada.

Eu separaria três responsabilidades:

- Estado visual, como modal aberto e campo selecionado.
- Dados remotos e seu cache.
- Regras e operações do negócio.

Essa separação evita que um hook se torne o único lugar onde existe um processo importante.

A navegação normalmente também pertence à apresentação. Um caso de uso devolve o resultado; a interface decide como continuar a experiência.

## `bootstrap/`: composição das dependências

`bootstrap/` conecta as peças.

É onde escolhemos implementações concretas, montamos dependências e organizamos providers.

Por exemplo: criar o adaptador HTTP de pedidos e fornecê-lo à operação de cancelamento.

Essa região conhece as partes necessárias para montar o aplicativo. O domínio e a aplicação recebem apenas aquilo de que precisam.

Eu começaria com composição manual. Providers podem disponibilizar dependências ao React, sem exigir um contêiner de injeção ou um objeto global contendo o aplicativo inteiro.

## `infrastructure/` da raiz: mecanismos técnicos compartilhados

A `infrastructure/` da raiz reúne mecanismos técnicos compartilhados.

A distinção é o alcance:

`modules/orders/infrastructure/` sabe como a API de pedidos funciona.

`src/infrastructure/http/` pode configurar um cliente HTTP usado por vários módulos.

O mesmo vale para armazenamento e observabilidade. Só promoveria algo para essa infraestrutura comum quando houvesse uma necessidade real de compartilhamento.

## `shared/`: elementos compartilhados

`shared/` exige disciplina.

Em `shared/ui/`, colocaria elementos visuais usados em diferentes contextos: botão, campo, tipografia, tokens de tema.

Em `shared/lib/`, pequenas funções independentes do negócio e dos frameworks.

Um `OrderCard` continuaria em pedidos mesmo se aparecesse em várias telas. Um tipo `User` também não se torna universal só porque vários módulos usam esse nome.

O critério para compartilhar é ter o mesmo significado e razões compatíveis para mudar.

## Dependências e comunicação entre módulos

Por fim, o que sustenta tudo isso são as dependências.

A apresentação pode conhecer a aplicação; a aplicação conhece o domínio e seus contratos; os adaptadores implementam esses contratos. O código de composição conecta as implementações.

**O caso de uso não importa o adaptador HTTP concreto.** Ele o utiliza por meio da dependência recebida. Essa diferença entre fluxo de execução e dependência de código é essencial.

Entre módulos, eu usaria uma superfície pública pequena, como o `index.ts`, para expor contratos e funcionalidades deliberadamente compartilhados. Outros módulos evitariam acessar arquivos internos. Fluxos que atravessam módulos precisariam de uma coordenação explícita, mantendo as dependências sem ciclos.

Para sustentar isso em projetos maiores, documentaria essas poucas regras e, quando necessário, verificaria os imports automaticamente. Os testes de domínio e aplicação poderiam ficar próximos dos arquivos; testes completos de jornadas ficariam separados.

## Ponto de partida para a próxima discussão

Essa é a base que eu defenderia para começarmos: limites consistentes e profundidade proporcional ao problema. Um módulo de consulta pode permanecer pequeno; um módulo com sincronização, regras complexas e trabalho offline pode desenvolver mais estrutura.

Para avançarmos, a pergunta que mais influencia minha sugestão é: **você imagina aplicativos principalmente conectados, consumindo APIs, ou quer que essa arquitetura também tenha como cenário central operações offline e sincronização?**
