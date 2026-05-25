# Diagramas UML — APS Ambiental
**UNIP · Ciência da Computação · Desenvolvimento de Sistemas Distribuídos**

> Como visualizar: abra este arquivo no VS Code com a extensão
> **"Markdown Preview Mermaid Support"** e pressione `Ctrl+Shift+V`.
> Ou cole cada bloco em **[mermaid.live](https://mermaid.live)** para exportar PNG/SVG.

---

## 1. Diagrama de Arquitetura — Sistema Distribuído em 3 Camadas

```mermaid
graph LR
    subgraph CLIENTE["🟦  CAMADA 1 — CLIENTE  (Dispositivo Móvel)"]
        direction TB
        APP["📱 App Mobile\nReact Native + Expo SDK 54"]
        NAV["React Navigation v7\n(3 telas)"]
        SVC["services/weather.js\n(orquestração)"]
        API_MOD["api.js\n(HTTP + timeout 15s)"]
        APP --> NAV
        APP --> SVC
        SVC --> API_MOD
    end

    subgraph INTERMEDIARIO["🟩  CAMADA 2 — INTERMEDIÁRIO  (Servidor Local)"]
        direction TB
        EXPRESS["Node.js + Express\nPorta 3001"]
        ROUTES["weatherRoutes.js\n(7 endpoints REST)"]
        OWS["openWeatherService.js\n(timeout 10s)"]
        ENV["environmentAlerts.js\n(lógica de alertas)"]
        DB_MOD["db.js\n(better-sqlite3)"]
        SQLITE[("💾 SQLite\nhistorico.db\n3 tabelas")]
        EXPRESS --> ROUTES
        ROUTES --> OWS
        ROUTES --> ENV
        ROUTES --> DB_MOD
        DB_MOD --> SQLITE
    end

    subgraph DESTINO["🟥  CAMADA 3 — DESTINO  (Web Service Externo)"]
        direction TB
        OWM["☁️ OpenWeatherMap API\napi.openweathermap.org"]
        EP1["/weather (clima atual)"]
        EP2["/forecast (previsão 5d)"]
        EP3["/air_pollution (qualidade ar)"]
        OWM --> EP1
        OWM --> EP2
        OWM --> EP3
    end

    API_MOD -->|"HTTP/JSON\n(AbortController)"| EXPRESS
    OWS -->|"HTTP/JSON\n(fetch nativa)"| OWM

    style CLIENTE      fill:#1a3a6b,color:#fff,stroke:#4a7fd4
    style INTERMEDIARIO fill:#1a5c3a,color:#fff,stroke:#4aad72
    style DESTINO       fill:#6b1a1a,color:#fff,stroke:#d44a4a
```

---

## 2. Diagrama de Casos de Uso

```mermaid
graph TD
    U(["👤 Usuário\n(ator primário)"])

    subgraph SISTEMA["Sistema APS Ambiental"]
        UC1["🔍 Buscar cidade"]
        UC2["🌡 Consultar clima atual"]
        UC3["📅 Ver previsão 7 dias"]
        UC4["💨 Ver qualidade do ar"]
        UC5["⚠️ Ver alertas ambientais"]
        UC6["📋 Ver detalhe do alerta"]
        UC7["🕐 Consultar histórico"]
    end

    subgraph SERVIDOR["API Intermediária (ator secundário)"]
        UC8["💾 Persistir consulta no BD"]
        UC9["📊 Retornar estatísticas"]
    end

    U -->|"digita nome"| UC1
    UC1 -->|"include"| UC2
    UC1 -->|"include"| UC3
    UC1 -->|"include"| UC4
    UC1 -->|"include"| UC5
    UC5 -->|"extend\n(toque no alerta)"| UC6
    U -->|"toca ícone 🕐"| UC7

    UC1 -.->|"dispara automaticamente"| UC8
    UC7 -.->|"solicita"| UC9

    style SISTEMA   fill:#1a2a4a,color:#fff,stroke:#4a7fd4
    style SERVIDOR  fill:#1a3a2a,color:#fff,stroke:#4aad72
```

---

## 3. Diagrama de Sequência — Fluxo de Busca de Cidade

```mermaid
sequenceDiagram
    actor U as Usuário
    participant HS as HomeScreen
    participant WS as weather.js
    participant API as api.js
    participant EX as Express (3001)
    participant OWS as openWeatherService
    participant OWM as OpenWeatherMap API
    participant DB as SQLite

    U->>HS: digita "São Paulo" e pressiona buscar
    HS->>WS: loadWeatherDashboard("São Paulo")

    WS->>API: checkApiHealth()
    API->>EX: GET /api/health
    EX-->>API: { status: "ok" }
    API-->>WS: ✅ servidor acessível

    par 4 chamadas em paralelo (Promise.all)
        WS->>API: fetchCurrentWeather("São Paulo")
        API->>EX: GET /api/weather/current?city=São Paulo
        EX->>OWS: getCurrentWeather()
        OWS->>OWM: GET /weather?q=São Paulo&appid=...
        OWM-->>OWS: JSON { temp, humidity, wind... }
        OWS-->>EX: dados transformados
        EX-->>API: JSON { name, temp, feelsLike... }
        API-->>WS: current ✅

    and
        WS->>API: fetchForecast("São Paulo")
        API->>EX: GET /api/weather/forecast?city=São Paulo
        EX->>OWS: getForecast()
        OWS->>OWM: GET /forecast?q=São Paulo...
        OWM-->>OWS: JSON { list: [ 40 itens de 3h ] }
        EX->>EX: groupForecastByDay() → 7 dias reais
        EX-->>API: JSON { items: [ 7 dias ] }
        API-->>WS: forecast ✅

    and
        WS->>API: fetchAirQuality("São Paulo")
        API->>EX: GET /api/environment/air-quality?city=São Paulo
        EX->>OWS: getAirPollution(lat, lon)
        OWM-->>OWS: JSON { list: [{ aqi, components }] }
        EX-->>API: JSON { airQuality, components }
        API-->>WS: airQuality ✅

    and
        WS->>API: fetchEnvironmentalAlerts("São Paulo")
        API->>EX: GET /api/environment/alerts?city=São Paulo
        EX->>OWS: getCurrentWeather() + getForecast() + getAirPollution()
        OWS->>OWM: 3 chamadas paralelas
        OWM-->>OWS: dados brutos
        EX->>EX: buildEnvironmentalAlerts() → gera alertas
        EX->>DB: salvarConsulta() — transação atômica
        Note over EX,DB: INSERT consultas → alertas → qualidade_ar
        DB-->>EX: consultaId = 42
        EX-->>API: JSON { alerts: [...] }
        API-->>WS: alerts ✅
    end

    WS-->>HS: { current, forecast, airQuality, alerts }
    HS->>HS: setState() → re-render
    HS-->>U: 🖥 Dashboard atualizado
```

---

## 4. Diagrama de Sequência — Fluxo de Histórico

```mermaid
sequenceDiagram
    actor U as Usuário
    participant HS as HomeScreen
    participant HI as HistoryScreen
    participant API as api.js
    participant EX as Express (3001)
    participant DB as SQLite

    U->>HS: toca ícone 🕐 (histórico)
    HS->>HI: navigation.navigate("History")

    HI->>HI: useEffect → loadData()

    par Promise.all
        HI->>API: fetchHistory(30)
        API->>EX: GET /api/history?limit=30
        EX->>DB: SELECT * FROM consultas ORDER BY id DESC LIMIT 30
        DB-->>EX: 30 registros
        EX->>DB: SELECT * FROM alertas WHERE consulta_id = ?
        EX->>DB: SELECT * FROM qualidade_ar WHERE consulta_id = ?
        DB-->>EX: alertas + AQI por consulta
        EX-->>API: { total: 30, consultas: [...] }
        API-->>HI: consultas ✅

    and
        HI->>API: fetchHistoryStats()
        API->>EX: GET /api/history/stats
        EX->>DB: SELECT COUNT(*), COUNT(DISTINCT cidade)
        DB-->>EX: { totalConsultas: 30, cidadesUnicas: 5 }
        EX-->>API: stats ✅
    end

    HI->>HI: setConsultas() + setStats() → re-render
    HI-->>U: 📋 Lista de consultas com alertas e AQI

    U->>HI: puxa tela para baixo (pull-to-refresh)
    HI->>HI: loadData(isRefresh=true)
    Note over HI,DB: mesmo fluxo acima, com RefreshControl
    HI-->>U: 📋 Lista atualizada
```

---

## 5. Diagrama de Componentes — Mobile (React Native)

```mermaid
graph TD
    subgraph NAV["React Navigation Stack"]
        APP["App.js\n(NavigationContainer)"]
        HOME["HomeScreen.js"]
        ALERT_D["AlertDetailScreen.js"]
        HIST["HistoryScreen.js"]
        APP --> HOME
        APP --> ALERT_D
        APP --> HIST
    end

    subgraph COMP["Componentes Reutilizáveis"]
        SB["SearchBar.js\n(campo de busca)"]
        WH["WeatherHeader.js\n(temperatura atual)"]
        FL["ForecastList.js\n(previsão 7 dias)"]
        IC["InfoCards.js\n(sol · ar · vento)"]
        AC["AlertCard.js\n(alerta clicável)"]
    end

    subgraph SERV["Serviços"]
        WJS["services/weather.js\n(orquestração)"]
        APIJS["api.js\n(HTTP client)"]
        CFG["config/apiConfig.js\n(URL base)"]
    end

    subgraph STYLES["Estilos"]
        ST["styles.js\n(StyleSheet centralizado)"]
    end

    HOME --> SB
    HOME --> WH
    HOME --> FL
    HOME --> IC
    HOME --> AC
    HOME --> WJS
    HIST --> APIJS
    WJS --> APIJS
    APIJS --> CFG
    HOME --> ST
    ALERT_D --> ST
    HIST --> ST
    COMP --> ST

    style NAV   fill:#1a2a4a,color:#fff,stroke:#4a7fd4
    style COMP  fill:#2a1a4a,color:#fff,stroke:#9a4ad4
    style SERV  fill:#1a3a2a,color:#fff,stroke:#4aad72
    style STYLES fill:#3a2a1a,color:#fff,stroke:#d4924a
```

---

## 6. Diagrama de Componentes — Servidor (Node.js)

```mermaid
graph TD
    subgraph SERVER["Node.js + Express — Porta 3001"]
        IDX["index.js\n(CORS · rate-limit · 404)"]
        RT["routes/weatherRoutes.js\n(7 endpoints)"]
        IDX --> RT
    end

    subgraph SERVICES["Serviços"]
        OWS["openWeatherService.js\n(/weather · /forecast · /air_pollution)"]
        ENV["environmentAlerts.js\n(mapAirQuality · buildEnvironmentalAlerts)"]
    end

    subgraph DATABASE["Banco de Dados"]
        DBJS["database/db.js\n(better-sqlite3)"]
        SQLITE[("💾 historico.db\n(SQLite — WAL mode)")]
        DBJS --> SQLITE
    end

    subgraph EXTERNAL["API Externa"]
        OWM["☁️ OpenWeatherMap\napi.openweathermap.org"]
    end

    RT --> OWS
    RT --> ENV
    RT --> DBJS
    OWS -->|"fetch + AbortController 10s"| OWM

    style SERVER   fill:#1a3a2a,color:#fff,stroke:#4aad72
    style SERVICES fill:#1a2a3a,color:#fff,stroke:#4a7fd4
    style DATABASE fill:#3a2a1a,color:#fff,stroke:#d4924a
    style EXTERNAL fill:#3a1a1a,color:#fff,stroke:#d44a4a
```

---

## 7. Diagrama Entidade-Relacionamento — Banco de Dados SQLite

```mermaid
erDiagram
    CONSULTAS {
        INTEGER id        PK "AUTOINCREMENT"
        TEXT    cidade    "NOT NULL"
        TEXT    pais
        TEXT    timestamp "DEFAULT datetime('now')"
        REAL    temp
        REAL    temp_max
        REAL    temp_min
        TEXT    descricao
        INTEGER umidade
        REAL    vento
        TEXT    icone
    }

    ALERTAS {
        INTEGER id          PK "AUTOINCREMENT"
        INTEGER consulta_id FK "NOT NULL"
        TEXT    tipo        "NOT NULL"
        TEXT    nivel       "NOT NULL — alto|moderado|informativo|baixo"
        TEXT    mensagem    "NOT NULL"
    }

    QUALIDADE_AR {
        INTEGER id          PK "AUTOINCREMENT"
        INTEGER consulta_id FK "NOT NULL UNIQUE"
        INTEGER aqi_index   "1=Boa 2=Moderada 3=Ruim 4=Muito Ruim 5=Péssima"
        TEXT    aqi_label
        REAL    pm25
        REAL    pm10
        REAL    co
        REAL    no2
    }

    CONSULTAS ||--o{ ALERTAS      : "gera (1:N — ON DELETE CASCADE)"
    CONSULTAS ||--o| QUALIDADE_AR : "possui (1:1 — ON DELETE CASCADE)"
```

---

## 8. Diagrama de Atividades — Geração de Alertas Ambientais

```mermaid
flowchart TD
    START([▶ Recebe dados: clima + previsão + qualidade ar])

    START --> A1{AQI ≥ 4\nMuito Ruim / Péssima?}
    A1 -->|Sim| AL1["⚠️ Alerta: Poluição do Ar\nnível: alto\nmensagem com AQI numérico"]
    A1 -->|AQI = 3 Ruim| AL2["⚠️ Alerta: Poluição do Ar\nnível: moderado"]
    A1 -->|AQI ≤ 2| SKIP1[" "]

    AL1 --> A2
    AL2 --> A2
    SKIP1 --> A2

    A2{Previsão próximas 24h:\nchuva intensa?\n≥ 10mm/h acumulado?}
    A2 -->|Sim| AL3["⚠️ Alerta: Risco de Alagamento\nnível: alto"]
    A2 -->|Não| A3

    AL3 --> A3

    A3{Variação de temperatura\nnos próximos 2 dias\n≥ 10°C?}
    A3 -->|Sim| AL4["⚠️ Alerta: Inversão Térmica\nnível: moderado"]
    A3 -->|Não| A4

    AL4 --> A4

    A4{Umidade atual\n< 30%?}
    A4 -->|Sim| AL5["⚠️ Alerta: Conservação Hídrica\nnível: informativo"]
    A4 -->|Não| A5

    AL5 --> A5

    A5{Temperatura atual\n> 35°C?}
    A5 -->|Sim| AL6["⚠️ Alerta: Risco de Desmatamento\nnível: moderado"]
    A5 -->|Não| END_ALERTS

    AL6 --> END_ALERTS

    END_ALERTS([◀ Retorna lista de alertas gerados])

    style AL1 fill:#6b1a1a,color:#fff
    style AL2 fill:#6b3a1a,color:#fff
    style AL3 fill:#6b1a1a,color:#fff
    style AL4 fill:#6b3a1a,color:#fff
    style AL5 fill:#1a3a6b,color:#fff
    style AL6 fill:#6b3a1a,color:#fff
```

---

## 9. Diagrama de Implantação (Deployment)

```mermaid
graph TB
    subgraph CELULAR["📱 Dispositivo Móvel (iOS / Android)"]
        EXPO["Expo Go / Build nativo"]
        RN["React Native Runtime\nJavaScript Engine (Hermes)"]
        EXPO --> RN
    end

    subgraph PC["💻 Computador do Desenvolvedor"]
        subgraph METRO["Metro Bundler (Expo)"]
            BUNDLE["JavaScript Bundle\n(app mobile)"]
        end
        subgraph NODE["Node.js Process"]
            EXPRESS2["Express Server\n:3001"]
            SQLITE2[("SQLite\nhistorico.db")]
            EXPRESS2 --- SQLITE2
        end
    end

    subgraph INTERNET["☁️ Internet"]
        OWM2["OpenWeatherMap\napi.openweathermap.org\n:443 (HTTPS)"]
    end

    CELULAR <-->|"Wi-Fi LAN\nHTTP :3001"| NODE
    CELULAR <-->|"Wi-Fi LAN\nHTTP :8081"| METRO
    NODE <-->|"HTTPS\nREST API"| INTERNET

    style CELULAR   fill:#1a2a4a,color:#fff,stroke:#4a7fd4
    style PC        fill:#1a3a2a,color:#fff,stroke:#4aad72
    style INTERNET  fill:#3a1a1a,color:#fff,stroke:#d44a4a
```

---

## Como exportar para o trabalho acadêmico

1. Acesse **[mermaid.live](https://mermaid.live)**
2. Cole o código de cada diagrama (bloco entre ` ```mermaid ` e ` ``` `)
3. Clique em **"Download SVG"** ou **"Download PNG"**
4. Insira as imagens no documento APS (Word/PDF)

> **Dica:** No VS Code, instale a extensão
> [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)
> para visualizar sem sair do editor.
