function _1(md){return(
md`_**ANÁLISE DOS SINISTROS ACONTECIDOS NAS VIAS DE FORTALEZA ENTRE 2015 E 2020** _
- UM TRABALHO DE VISUALIZAÇÃO DE DADOS 2025.1
- Autor/Aluno: **Breno Fernandes**
- **Profa. Dra. Emanuele Santos**`
)}



async function _mapa_de_teste(require,html,rua_ativa,top_rua_inicial,FileAttachment,dados_preparados,invalidation)
{
  // 1. Importa a biblioteca de mapas Leaflet e seu CSS
  const L = await require('leaflet@1.7.1');
  const css = html`<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />`;
  
  // Ele lê a variável 'rua_ativa' e mostra um texto padrão se ela for nula.
  const titulo_mapa = html`<h3 style="font-family: sans-serif; margin-bottom: 10px; font-weight: 500;">
    Localização dos Sinistros na: <b>${rua_ativa || top_rua_inicial}</b>
  </h3>`;
  
  // 2. Cria o container HTML onde o mapa será desenhado
  const container = html`<div style="height: 700px; max-width: 1500px; margin: 0 auto; border: 1px solid #ccc;"></div>`;
  
  // 3. Inicializa o mapa, definindo a visão inicial para Fortaleza
  const map = L.map(container).setView([-3.79, -38.52], 12);

  // 4. Adiciona a camada de mapa base (as ruas, etc.) do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  
  // 5. Adiciona a camada com as demarcações dos bairros a partir do seu arquivo
  try {
    const bairrosData = await FileAttachment("bairros2.geojson").json();
    L.geoJson(bairrosData, {
      style: { color: "#555", weight: 1, opacity: 1.5, fillOpacity: 0.1 }
    }).addTo(map);
  } catch (e) {
    console.error("Não foi possível carregar o arquivo bairros.geojson. Verifique se ele está anexado.", e);
  }

  // 6. Filtra os dados para pegar os sinistros de uma única via para o nosso teste
   // --- ALTERAÇÃO PRINCIPAL AQUI ---
  // Em vez de um nome de rua fixo, usamos a variável reativa 'rua_ativa'
  const pontos_para_plotar = dados_preparados.filter(d => d.LOG1 === rua_ativa);

  // 7. Adiciona um marcador (círculo) para cada sinistro da via selecionada
  for (const p of pontos_para_plotar) {
    // Garante que a latitude e longitude são válidas e as converte para número
    // (O .replace() corrige o problema de a latitude/longitude usar vírgula em vez de ponto)
    const lat = p.LATITUDE ? +String(p.LATITUDE).replace(',', '.') : null;
    const lon = p.LONGITUDE ? +String(p.LONGITUDE).replace(',', '.') : null;
    
    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
      L.circleMarker([lat, lon], {
        radius: 4,
        color: '#Ffff00', // Cor vermelha para os pontos
        fillOpacity: 0.6,
        stroke: true
      }).addTo(map);
    }
  }
  
  // --- A CORREÇÃO ESTÁ AQUI ---
  // Esta linha diz ao Observable para executar o comando map.remove() 
  // (que destrói o mapa) sempre que a célula for invalidada/re-executada.
  invalidation.then(() => map.remove());
   // Este truque força o mapa a recalcular seu tamanho depois de ser adicionado à página,
  // resolvendo o problema da caixa cinza.
  setTimeout(() => {
    map.invalidateSize();
  }, 0);
  // 8. Retorna o mapa para ser exibido na célula
  
   // --- ALTERAÇÃO AQUI ---
  // 5. O 'return' final da célula agora combina o título, o CSS e o container do mapa
  return html`${titulo_mapa}${css}${container}`;
}


function _dashboard_completo(vl,data,dados_preparados)
{

  // =================================================================
  // 1. DEFINIÇÃO DE TODOS OS PARÂMETROS E SELEÇÕES
  // =================================================================

  const filtro_natureza = vl.param('filtro_natureza').value('TODOS').bind({
    input: 'select',
    options: ['TODOS', 'ATROPELAMENTO', 'COLISAO', 'QUEDA', 'CHOQUE C/ OBSTACULO FIXO', 'ENGAVETAMENTO', 'CAPOTAMENTO'],
    name: 'Filtrar por Natureza: '
  });

  const filtro_veiculo = vl.param('filtro_veiculo').value('TODOS').bind({
    input: 'select',
    options: ['TODOS', 'AUTOMOVEL', 'MOTOCICLETA', 'BICICLETA', 'ONIBUS', 'CAMINHAO', 'MICROONIBUS', 'CICLOMOTOR', 'TRACAOANIMAL', 'TREM'],
    name: 'Filtrar por Veículo: '
  });

  const filtro_ano = vl.param('filtro_ano').value('TODOS').bind({
    input: 'select',
    options: ['TODOS', 2015, 2016, 2017, 2018, 2019, 2020],
    name: 'Filtrar por Ano: '
  });

  const filtro_vitimas = vl.param('filtro_vitimas').value('TODOS').bind({
    input: 'select',
    options: ['TODOS', 'Com Mortos', 'Com Feridos', 'Apenas Ilesos'],
    name: 'Filtrar por Vítimas: '
  });

  const selecao_rua_grafico = vl.selectPoint('selecao_grafico').fields(['LOG1']).clear('dblclic')

  const top10_chart_spec = vl.markBar({cursor: 'pointer', tooltip: true})
    .data(data)
    .width(800)
    .select(selecao_rua_grafico)
    .title("Top 15 Vias (Clique em uma barra para filtrar)")
    .transform(
      vl.filter("filtro_ano === 'TODOS' || datum.ANO === filtro_ano"),
      vl.filter("filtro_natureza === 'TODOS' || lower(datum.NATUREZA) === lower(filtro_natureza)"),
      vl.filter("filtro_veiculo === 'TODOS' || datum[filtro_veiculo] > 0"),
      vl.filter("filtro_vitimas === 'TODOS' ? true : filtro_vitimas === 'Com Mortos' ? datum.MORTOS > 0 : filtro_vitimas === 'Com Feridos' ? datum.FERIDOS > 0 : datum.ILESOS > 0 && datum.MORTOS == 0 && datum.FERIDOS == 0"),
      vl.aggregate(vl.count().as('Número de Sinistros')).groupby(['LOG1']),
      vl.window(vl.rank('ranking')).sort([{ field: 'Número de Sinistros', order: 'descending' }]),
      vl.filter("datum.ranking <= 15")
    )
    .encode(
      vl.x().fieldQ('Número de Sinistros'),
      vl.y().fieldN('LOG1').title(null).sort({ field: 'Número de Sinistros', order: 'descending' }),
      vl.opacity().if(selecao_rua_grafico, vl.value(1)).value(0.7),
      vl.color().value('steelblue'), // Define uma cor fixa para as barras
      vl.tooltip(["LOG1", "Número de Sinistros"])
    );

  // --- NOVO GRÁFICO: Ranking Completo com Rolagem ---

  const heatmap_spec = vl.markRect({tooltip: true})
    .data(dados_preparados)
    .width(800)
    .height(500)
    .title("Heatmap de Ocorrências por Dia e Hora") // Título dinâmico!
    .transform(
      vl.filter(selecao_rua_grafico),
      vl.filter("filtro_ano === 'TODOS' || datum.ANO === filtro_ano"),
      vl.filter("filtro_natureza === 'TODOS' || lower(datum.NATUREZA) === lower(filtro_natureza)"),
      vl.filter("filtro_veiculo === 'TODOS' || datum[filtro_veiculo] > 0"),
      vl.filter("filtro_vitimas === 'TODOS' ? true : filtro_vitimas === 'Com Mortos' ? datum.MORTOS > 0 : filtro_vitimas === 'Com Feridos' ? datum.FERIDOS > 0 : datum.ILESOS > 0 && datum.MORTOS == 0 && datum.FERIDOS == 0"),
      vl.aggregate(vl.count().as('contagem_sinistros')).groupby(['dia_da_semana_num', 'hora_do_dia'])
    )
    .encode(
      vl.x().fieldO('dia_da_semana_num').title('Dia da Semana').sort('ascending')
        .axis({labelExpr: "{'0': 'Domingo', '1': 'Segunda', '2': 'Terça', '3': 'Quarta', '4': 'Quinta', '5': 'Sexta', '6': 'Sábado'}[datum.value]"}),
      vl.y().fieldO('hora_do_dia').title('Hora do Dia'),
      vl.color().fieldQ('contagem_sinistros').title(null).scale({scheme: 'yellowgreenblue'}),
      vl.tooltip(['dia_da_semana_num', 'hora_do_dia', 'contagem_sinistros'])
    );

  const line_chart_spec = vl.markLine({point: true})
  .data(dados_preparados)
  .width(1500)
  .height(400) // Aumentei um pouco a altura para a nova visão
  .title("Evolução dos Sinistros no Tempo (2015-2020)")
  .transform(
    // A cadeia de filtros completa continua aqui
    vl.filter(selecao_rua_grafico),
    vl.filter("filtro_ano === 'TODOS' || datum.ANO === filtro_ano"),
    vl.filter("filtro_natureza === 'TODOS' || lower(datum.NATUREZA) === lower(filtro_natureza)"),
    vl.filter("filtro_veiculo === 'TODOS' || datum[filtro_veiculo] > 0"),
    vl.filter("filtro_vitimas === 'TODOS' ? true : filtro_vitimas === 'Com Mortos' ? datum.MORTOS > 0 : filtro_vitimas === 'Com Feridos' ? datum.FERIDOS > 0 : datum.ILESOS > 0 && datum.MORTOS == 0 && datum.FERIDOS == 0"),
    
    // --- LÓGICA DE DRILL-DOWN ADICIONADA AQUI ---
    // Cria um campo de tempo dinâmico.
    vl.calculate(
      "filtro_ano === 'TODOS' ? datetime(datum.ANO, 0, 1) : datum.data_completa"
    ).as("eixo_tempo"),

    // Agrega os dados pela nova escala de tempo
    vl.aggregate(vl.count().as('contagem'))
      .groupby(['eixo_tempo'])
  )
  .encode(
    // O eixo X agora usa nosso novo campo dinâmico 'eixo_tempo'
    vl.x().fieldT('eixo_tempo').title("Data"),
    
    // O eixo Y agora usa a contagem pré-agregada
    vl.y().fieldQ('contagem').title("Nº de Sinistros"),
    
    vl.tooltip([
      {"field": "eixo_tempo", "type": "temporal", "title": "Período", "format": "%b %Y"},
      {"field": "contagem", "type": "quantitative", "title": "Total de Sinistros"}
    ])
  );

 const donut_natureza = vl.markArc({ innerRadius: 40, tooltip: true })
  .width(200).height(200)
  .data(dados_preparados) // Usando os dados que já têm dia/hora calculados
  .title("Natureza do Sinistro")
  .transform(
    // 1. Aplica todos os filtros interativos do dashboard
    vl.filter(selecao_rua_grafico),
    vl.filter("filtro_ano === 'TODOS' || datum.ANO === filtro_ano"),
    vl.filter("filtro_veiculo === 'TODOS' || datum[filtro_veiculo] > 0"),
    vl.filter("filtro_vitimas === 'TODOS' ? true : filtro_vitimas === 'Com Mortos' ? datum.MORTOS > 0 : filtro_vitimas === 'Com Feridos' ? datum.FERIDOS > 0 : datum.ILESOS > 0 && datum.MORTOS == 0 && datum.FERIDOS == 0"),
    vl.filter("filtro_natureza === 'TODOS' || lower(datum.NATUREZA) === lower(filtro_natureza)"),

    // 2. Normaliza a coluna NATUREZA para garantir a correspondência (case-insensitive)
    vl.calculate("upper(datum.NATUREZA)").as("natureza_maiuscula"),
    
    // 3. Filtra para manter APENAS as 6 categorias que você quer
    vl.filter({
      "field": "natureza_maiuscula",
      "oneOf": [
        "ATROPELAMENTO",
        "COLISAO",
        "QUEDA",
        "CHOQUE C/ OBSTACULO FIXO",
        "ENGAVETAMENTO",
        "CAPOTAMENTO"
      ]
    }),
    
    // 4. Agrega para contar os totais APÓS todos os filtros
    vl.aggregate(vl.count().as('total_sinistros')).groupby(['natureza_maiuscula']),
  )
  .encode(
    // Theta (tamanho) usa a contagem final
    vl.theta().fieldQ('total_sinistros').stack(true),
    
    // Color usa o nome original da Natureza
    vl.color().fieldN('natureza_maiuscula').legend({ title: "Natureza" }).scale({
  domain: ['ATROPELAMENTO', 'COLISAO', 'QUEDA', 'CHOQUE C/ OBSTACULO FIXO', 'ENGAVETAMENTO', 'CAPOTAMENTO'],
  range:  ['#e41a1c', '#377eb8', '#ff7f00', '#984ea3', '#8b4513', '#ffff33']
}),
    // Tooltip mostra os detalhes
    vl.tooltip([
      {field: 'natureza_maiuscula', type: 'nominal', title: 'Naturezas'},
      {field: 'total_sinistros', type: 'quantitative', title: 'Total de Ocorrências'}
    ])
  );

   const donut_veiculos = vl.markArc({ innerRadius: 40, tooltip: true })
     .width(200)
     .height(200)
     .data(data)
    .title("Veículos Envolvidos")
    .transform(
      vl.filter(selecao_rua_grafico),
      vl.filter("filtro_ano === 'TODOS' || datum.ANO === filtro_ano"),
      vl.filter("filtro_natureza === 'TODOS' || lower(datum.NATUREZA) === lower(filtro_natureza)"),
      vl.filter("filtro_vitimas === 'TODOS' ? true : filtro_vitimas === 'Com Mortos' ? datum.MORTOS > 0 : filtro_vitimas === 'Com Feridos' ? datum.FERIDOS > 0 : datum.ILESOS > 0 && datum.MORTOS == 0 && datum.FERIDOS == 0"),
      vl.filter("filtro_veiculo === 'TODOS' || datum[filtro_veiculo] > 0"),
      vl.fold(['AUTOMOVEL', 'MOTOCICLETA', 'BICICLETA', 'ONIBUS', 'CAMINHAO']).as(['veiculo', 'presente']),
      vl.filter('datum.presente > 0'),
      vl.aggregate(vl.count().as('quantidade')).groupby(['veiculo'])
    )
    .encode(
      vl.theta().fieldQ('quantidade').stack(true),
      vl.color().fieldN('veiculo').legend({title: 'Veículo'}).scale({
        domain: ['AUTOMOVEL', 'MOTOCICLETA', 'BICICLETA', 'ONIBUS', 'CAMINHAO'],
        range: ['#1f77b4', '#ff7f0e', '#e41a1c', '#ffff00', '#9467bd']
      }),
      vl.tooltip(['veiculo', 'quantidade'])
    );

  const donut_vitimas = vl.markArc({ innerRadius: 40, tooltip: true })
  .width(200).height(200)
  .data(data)
  .title("Vítimas")
  .transform(
    // Filtros...
    vl.filter(selecao_rua_grafico),
    vl.filter("filtro_ano === 'TODOS' || datum.ANO === filtro_ano"),
    vl.filter("filtro_natureza === 'TODOS' || lower(datum.NATUREZA) === lower(filtro_natureza)"),
    vl.filter("filtro_veiculo === 'TODOS' || datum[filtro_veiculo] > 0"),
    vl.filter("filtro_vitimas === 'TODOS' ? true : filtro_vitimas === 'Com Mortos' ? datum.MORTOS > 0 : filtro_vitimas === 'Com Feridos' ? datum.FERIDOS > 0 : datum.ILESOS > 0 && datum.MORTOS == 0 && datum.FERIDOS == 0"),
    
    // --- CORREÇÃO: Usando a sintaxe .as() que você descobriu ---
    vl.fold(['MORTOS', 'FERIDOS', 'ILESOS'])
      .as(['tipo', 'quantidade']),
    
    vl.filter('datum.quantidade > 0'),

    vl.aggregate(vl.sum('quantidade').as('total_vitimas'))
      .groupby(['tipo'])
  )
  .encode(
    vl.theta().fieldQ('total_vitimas').stack(true),
    vl.color().fieldN('tipo').legend({title: 'Condição'}).scale({
        domain: ['MORTOS', 'FERIDOS', 'ILESOS'],
        range: ['#e41a1c', '#ff7f00', '#999999'] // Vermelho, Laranja, Cinza
      }),
    vl.tooltip([
      {"field": "tipo", "type": "nominal"},
      {"field": "total_vitimas", "type": "quantitative", "title": "Total"}
    ])
  );

  // =================================================================
  // 3. COMBINAR TUDO NO LAYOUT FINAL E RENDERIZAR
  // =================================================================

  const coluna_esquerda = vl.vconcat(top10_chart_spec, heatmap_spec).spacing(30)
    .resolve({scale: {color: "independent"},legend: {color: "independent"}});
  const coluna_direita = vl.vconcat(donut_natureza, donut_veiculos, donut_vitimas).spacing(30)
    .resolve({scale: {color: "independent"},legend: {color: "independent"}});

  return vl.vconcat(vl.hconcat(coluna_esquerda, coluna_direita).spacing(300
), line_chart_spec)
    .spacing(30)
    .params(filtro_natureza, filtro_veiculo, filtro_ano, filtro_vitimas)
    .resolve({scale: {color: "independent"}, legend: {color: "independent"}})
    .padding({top: 50, bottom: 60, left: 200})
    .render();
}

function _top_rua_inicial(d3,data)
{
  const contagens = d3.rollup(data, v => v.length, d => d.LOG1);
  const [top_rua] = d3.greatest(contagens, ([, count]) => count);
  return top_rua;
}


function _rua_ativa(top_rua_inicial){return(
top_rua_inicial
)}

function _4(dashboard_completo,$0,top_rua_inicial,invalidation)
{
  if (dashboard_completo) { // Garante que o dashboard já foi renderizado
    
    const listener = (name, value) => {
      // CONDIÇÃO CORRIGIDA:
      // Verifica se 'value' existe, se 'value.LOG1' existe, e se o array não está vazio
      if (value && value.LOG1 && value.LOG1.length > 0) {
        
        // CORREÇÃO AQUI:
        // Pega o primeiro item [0] de dentro do array value.LOG1
        $0.value = value.LOG1[0];
        
      } else {
        // Se a seleção for limpa, 'value' será null, caindo aqui.
        $0.value = top_rua_inicial;
      }
    };
    
    dashboard_completo.addSignalListener('selecao_grafico', listener);
    
    invalidation.then(() => dashboard_completo.removeSignalListener('selecao_grafico', listener));
  }
}


function _nomes_ruas(data){return(
[...new Set(data.map(d => d.LOG1).filter(Boolean))].sort()
)}
function _8(md){return(
md`DATASET DOS SINISTROS FILTRADO:`
)}

function _9(md){return(
md`TABELA PARA DEPURAR:`
)}

function _url_data_limpa(FileAttachment){return(
FileAttachment("2015-2020-SINISTROS.csv").url()
)}

function _data(d3,url_data_limpa){return(
d3.csv(url_data_limpa, d3.autoType)
)}

function _12(md){return(
md`Dados filtrados com o dia da semana para o HEATMAP`
)}

function _dados_preparados(data){return(
data.map(d => {
  // Converte para número e lida com possíveis valores nulos/inválidos
  const ano = +d.ANO;
  const mes = +d.MES;
  const dia = +d.DIA;
  
  let dia_da_semana_final = null;
  // A data completa é calculada aqui
  const data_completa = (d.ANO && d.MES && d.DIA) ? new Date(ano, mes - 1, dia) : null;
  
  if (data_completa && !isNaN(data_completa.getTime())) {
     dia_da_semana_final = data_completa.getDay();
  }

  const partes_hora = d.HORA ? String(d.HORA).split(':') : null;
  const hora_final = partes_hora && partes_hora.length > 0 ? +partes_hora[0] : null;

  // Retorna o objeto completo com as novas colunas
  return {
    ...d, // Copia todas as colunas originais
    hora_do_dia: hora_final,
    dia_da_semana_num: dia_da_semana_final,
    data_completa: data_completa // <-- A LINHA QUE FALTAVA
  };
}).filter(d => d.dia_da_semana_num !== null && d.hora_do_dia !== null)
)}

function _url_bairros(FileAttachment){return(
FileAttachment("bairros2.geojson").url()
)}

async function _bairros2(d3,url_bairros){return(
await d3.json(url_bairros)
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["2015-2020-SINISTROS.csv", {url: new URL("2015-2020-SINISTROS.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["bairros2.geojson", {url: new URL("bairros2.geojson", import.meta.url), mimeType: "application/geo+json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("top_rua_inicial")).define("top_rua_inicial", ["d3","data"], _top_rua_inicial);
  main.define("initial rua_ativa", ["top_rua_inicial"], _rua_ativa);
  main.variable(observer("mutable rua_ativa")).define("mutable rua_ativa", ["Mutable", "initial rua_ativa"], (M, _) => new M(_));
  main.variable(observer("rua_ativa")).define("rua_ativa", ["mutable rua_ativa"], _ => _.generator);
  main.variable(observer()).define(["dashboard_completo","mutable rua_ativa","top_rua_inicial","invalidation"], _4);
  main.variable(observer("nomes_ruas")).define("nomes_ruas", ["data"], _nomes_ruas);
  main.variable(observer("mapa_de_teste")).define("mapa_de_teste", ["require","html","rua_ativa","top_rua_inicial","FileAttachment","dados_preparados","invalidation"], _mapa_de_teste);
  main.variable(observer("viewof dashboard_completo")).define("viewof dashboard_completo", ["vl","data","dados_preparados"], _dashboard_completo);
  main.variable(observer("dashboard_completo")).define("dashboard_completo", ["Generators", "viewof dashboard_completo"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _8);
  main.variable(observer()).define(["md"], _9);
  main.variable(observer("url_data_limpa")).define("url_data_limpa", ["FileAttachment"], _url_data_limpa);
  main.variable(observer("data")).define("data", ["d3","url_data_limpa"], _data);
  main.variable(observer()).define(["md"], _12);
  main.variable(observer("dados_preparados")).define("dados_preparados", ["data"], _dados_preparados);
  main.variable(observer("url_bairros")).define("url_bairros", ["FileAttachment"], _url_bairros);
  main.variable(observer("bairros2")).define("bairros2", ["d3","url_bairros"], _bairros2);
  return main;
}
