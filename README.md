# Contagem de Palavras

CLI em TypeScript/Node.js que lê arquivos `.txt` (uma palavra por linha) e imprime, para cada arquivo, as 20 palavras mais frequentes com suas contagens e o tempo total de processamento.

## Abordagem

O problema tem uma restrição central: os arquivos de entrada podem ter até 1 bilhão de linhas, então a solução não pode depender de carregar o arquivo inteiro (ou uma lista com todas as palavras) na memória. A arquitetura é um pipeline em streaming, dividido por responsabilidade — sem camadas de aplicação web (MVC/MSC), já que não há HTTP nem persistência envolvidos:

- **reader** — lê o arquivo em chunks de 1MB via `fs.createReadStream`, escaneando bytes de quebra de linha manualmente (em vez de `readline`, que tem overhead maior em arquivos grandes). Entrega uma palavra por vez através de um async generator, então nunca existe mais que uma palavra "em trânsito" entre a leitura e a contagem. Também descarta o BOM UTF-8 (`EF BB BF`), se presente, no início do arquivo — sem isso a primeira palavra do arquivo seria contada como diferente das demais ocorrências dela mesma.
- **counter** — mantém um `Map<palavra, contagem>`, incrementado a cada palavra recebida do reader.
- **topK** — extrai as 20 palavras mais frequentes usando uma min-heap de tamanho fixo (20), em vez de ordenar todas as palavras únicas do arquivo. Isso evita pagar `O(n log n)` quando só precisamos das 20 maiores.
- **reporter** — formata e imprime o resultado no formato exato exigido, sem campos adicionais.
- **memory** — amostra `process.memoryUsage()` (RSS e heap usado) em intervalos fixos durante o processamento e reporta o pico observado.
- **cli** — orquestra as peças acima por arquivo recebido como argumento, cronometra o processamento e imprime os resultados.

Os módulos dependem de interfaces (`WordReader`, `WordCounter`, `TopKSelector`, `Reporter`, `MemorySampler`), não de implementações concretas — trocar a estratégia de qualquer etapa (por exemplo, o algoritmo de seleção do top-K) não exige alterar o restante do pipeline.

A saída oficial (formato exigido pelo desafio) vai para o `stdout`. As informações de memória — que não fazem parte do formato de saída pedido — vão para o `stderr`, um canal separado, para não contaminar a saída caso ela seja validada automaticamente (por exemplo, redirecionada para um arquivo ou comparada por texto).

**Importante:** rodando direto no terminal, as duas saídas aparecem misturadas na tela, porque o terminal exibe `stdout` e `stderr` juntos por padrão. Isso é só uma questão de exibição — a linha `[memoria] ...` não faz parte do que o programa efetivamente emite como resultado (`stdout`). Pra ver só a saída oficial, descarte o `stderr`:

```bash
# Linux/macOS
npm start -- arquivo.txt 2>/dev/null

# PowerShell
npm run dev -- arquivo.txt 2>$null
```

## Como executar localmente

Requisitos: Node.js 22+, npm.

```bash
npm install
npm run build
npm start -- <caminho/para/arquivo.txt> [outro-arquivo.txt ...]
```

Ou em modo desenvolvimento, sem precisar compilar:

```bash
npm run dev -- <caminho/para/arquivo.txt>
```

Múltiplos arquivos podem ser passados na mesma chamada — cada um é processado em sequência e gera seu próprio bloco de saída.

## Resultados

Medido em: Intel Core i5-8400 @ 2.80GHz, 16GB RAM, Windows 10 Pro, Node.js v22.23.1. Cada linha da tabela foi medida em um processo separado (uma chamada do CLI por arquivo), para evitar que a memória residual de um arquivo influencie a medição do próximo.

| Linhas        | Tempo       | Pico RSS  | Pico Heap usado |
|---------------|-------------|-----------|------------------|
| 100           | 17 ms       | 34,0 MB   | 5,0 MB           |
| 1.000         | 19 ms       | 35,2 MB   | 4,9 MB           |
| 10.000        | 31 ms       | 40,1 MB   | 4,8 MB           |
| 100.000       | 78 ms       | 41,5 MB   | 5,4 MB           |
| 1.000.000     | 539 ms      | 55,5 MB   | 5,0 MB           |
| 10.000.000    | 4.960 ms    | 106,4 MB  | 6,1 MB           |
| 100.000.000   | 48.281 ms   | 118,8 MB  | 11,6 MB          |

**Tempo** escala de forma aproximadamente linear com o número de linhas — esperado, já que o processamento é uma única passada sequencial sobre o arquivo.

**Memória** não escala com o número de linhas, e sim com o número de palavras **únicas** (o tamanho do `Map` de contagens). Os arquivos de teste usam um vocabulário de nomes com no máximo ~169 palavras distintas, independente do tamanho do arquivo — por isso o heap usado cresce muito pouco (5,0MB → 11,6MB) mesmo com o arquivo crescendo um milhão de vezes (100 → 100.000.000 linhas). O RSS cresce um pouco mais que o heap porque inclui custos fixos do runtime do Node (motor V8, buffers internos de I/O) que não fazem parte dos dados do programa em si.

## Observações

- O desafio descreve arquivos de até 1.000.000.000 de linhas, mas o material disponibilizado para teste vai até 100.000.000 linhas (~796MB) — o arquivo de 1 bilhão não foi disponibilizado.
- Comparação de palavra é feita byte a byte (case sensitive, sem normalização), conforme exigido — a única transformação aplicada é a remoção do BOM UTF-8 no início do arquivo, quando presente, e de um eventual `\r` residual antes da quebra de linha (arquivos com terminação de linha estilo Windows).
- A linha de diagnóstico de memória (`[memoria] ...`) sempre aparece junto na tela quando o CLI é executado direto num terminal — isso é comportamento normal de `stdout`/`stderr` combinados na exibição, não uma violação do formato de saída exigido pelo desafio. Ver a seção "Como executar localmente" para isolar a saída oficial.
