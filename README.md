# Dashboard Interativo de Sinistros de Trânsito em Fortaleza (2015-2020)

**Autor:** Breno Fernandes
**Disciplina:** Visualização de Dados 2025.1
**Professora:** Profa. Dra. Emanuele Santos

---

![Dashboard de Sinistros](image_f6f55a.png)

## 🚀 Sobre o Projeto

Este projeto é um dashboard interativo para a exploração e análise de dados de sinistros de trânsito ocorridos na cidade de Fortaleza, Ceará, durante o período de 2015 a 2020. A aplicação foi desenvolvida como projeto final para a disciplina de Visualização de Dados da Universidade Federal do Ceará.

O objetivo principal é fornecer uma ferramenta que permita a identificação de padrões geográficos, temporais e característicos dos acidentes, respondendo a perguntas sobre os locais mais perigosos, os padrões de horário, e as características dos acidentes (natureza, veículos envolvidos, e vítimas).

## ✨ Funcionalidades

O dashboard é composto por múltiplas **visões coordenadas** e interativas, atendendo aos requisitos do projeto:

* **Filtros Globais:** Permite filtrar todo o painel por Ano, Natureza do Sinistro, Veículo Envolvido e tipo de Vítimas.
* **Ranking Top 10 Vias:** Um gráfico de barras que mostra as 15 vias com mais sinistros com base nos filtros selecionados.
* **Filtro por Clique:** Clicar em uma via no gráfico Top 15 filtra dinamicamente todos os outros gráficos para exibir dados apenas daquela via.
* **Heatmap Dia/Hora:** Um mapa de calor que mostra a densidade de sinistros por dia da semana e hora do dia, reagindo a todos os filtros.
* **Gráficos de Proporção:** Gráficos de rosca (Donut Charts) que detalham a distribuição dos sinistros por Natureza, Veículos Envolvidos e Vítimas.
* **Gráfico de Evolução Temporal:** Um gráfico de linhas que mostra a tendência do número de sinistros ao longo do tempo, com uma função de "drill-down" que detalha a visão mensal ao filtrar por um único ano.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias web modernas, com foco em bibliotecas de visualização de dados:

* **Vega-Lite:** Utilizada para a construção declarativa da maior parte do dashboard interativo (gráficos de barras, heatmap, donuts, etc.).
* **D3.js:** Usada como biblioteca de apoio para manipulação e agregação de dados em JavaScript dentro do ambiente de prototipagem.
* **ObservableHQ:** Utilizado como ambiente de prototipagem e desenvolvimento interativo.
* **HTML, CSS & JavaScript:** Tecnologias base para a estruturação e hospedagem final da página.
* **Tableau:** Utilizado na fase inicial para exploração dos dados e prototipagem das visualizações.

## 📊 Fonte dos Dados

Os dados utilizados referem-se aos sinistros de trânsito no período de 2015 a 2020, obtidos no **Portal de Dados Abertos de Fortaleza**.

O processamento dos dados incluiu:
* Consolidação de arquivos anuais em um único dataset.
* Limpeza de dados para remover linhas nulas/inválidas e correção de problemas de codificação de caracteres (Encoding).
* Criação de campos calculados (ex: dia da semana, hora, data completa).
* Transformação de dados do formato "largo" para "longo" para os gráficos de proporção (usando a transformação `fold`).

## ⚙️ Como Executar Localmente

1.  Clone ou baixe este repositório.
2.  Navegue até a pasta raiz do projeto via terminal.
3.  Inicie um servidor web local simples. Se você tiver Python 3 instalado, o comando é:
    ```bash
    python -m http.server
    ```
5.  Abra seu navegador e acesse `http://localhost:8000`.

## 🧠 Dificuldades e Lições Aprendidas

O principal desafio do projeto foi o gerenciamento da interatividade complexa entre múltiplos componentes. A depuração de erros de escopo de sinais no Vega-Lite (`Unrecognized signal name`, `Duplicate signal name`) e a prevenção de loops no Observable foram os maiores obstáculos.

A solução foi arquitetar um sistema com uma **"fonte da verdade" central** (uma variável `mutable` no Observable), onde todas as ações do usuário atualizam um único estado, e todos os componentes visuais reagem a essa mudança. Esta abordagem de separação de responsabilidades se mostrou muito mais robusta e modular. Foi um grande aprendizado sobre a importância de uma arquitetura de estado bem definida em aplicações de dados interativas.