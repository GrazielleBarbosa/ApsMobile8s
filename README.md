# APS Ambiental — Sistema Distribuído para Consulta de Dados Meteorológicos

**Universidade Paulista (UNIP) — Ciência da Computação**  
**Disciplina:** Desenvolvimento de Sistemas Distribuídos (DSD)  
**Atividade:** Atividades Práticas Supervisionadas — APS 2023/2  
**Alunas:** Grazielle de Jesus Barbosa (G46AEG9) · Yasmin Iony Torrez Herbas (N8777E7)

---

## Sobre o Projeto

Aplicação mobile de monitoramento ambiental urbano, construída sobre arquitetura de **sistemas distribuídos em 3 camadas**:

```
┌─────────────────┐    HTTP/JSON    ┌──────────────────────┐    HTTP/JSON    ┌─────────────────────┐
│  App Mobile     │ ─────────────► │  API Intermediária   │ ─────────────► │  OpenWeatherMap API │
│  (React Native) │ ◄───────────── │  (Node.js + Express) │ ◄───────────── │  (Web Service       │
│  Expo SDK 54    │                │  Porta 3001          │                │   Destino)          │
└─────────────────┘                └──────────────────────┘                └─────────────────────┘
     CLIENTE                            INTERMEDIÁRIO                            DESTINO
```

### Funcionalidades

- 🌡️ Temperatura atual, sensação térmica, máxima e mínima  
- 📅 Previsão de 7 dias com temperatura média, máxima e mínima reais  
- 💨 Qualidade do ar (AQI) com componentes atmosféricos (PM2.5, PM10, CO, NO₂)  
- ☀️ Horário de nascer e pôr do sol (timezone da cidade consultada)  
- ⚠️ Alertas ambientais com 5 categorias: poluição do ar, alagamento, inversão térmica, mananciais e desmatamento  
- 🔍 Busca por qualquer cidade do mundo  
- 📱 Tela de detalhe de alertas com explicações e recomendações

---

## Tecnologias Utilizadas

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Mobile (frontend) | React Native + Expo | SDK 54 / RN 0.81 |
| Navegação | React Navigation Native Stack | v7 |
| Gradiente | expo-linear-gradient | ~15.0 |
| Ícones | @expo/vector-icons | ^15.0 |
| API Intermediária | Node.js + Express | Node ≥ 18 / Express ^4.21 |
| Rate Limiting | express-rate-limit | ^7.5 |
| CORS | cors | ^2.8 |
| Variáveis de ambiente | dotenv | ^16.4 |
| API de Destino | OpenWeatherMap | v2.5 |

---

## Pré-requisitos

- **Node.js** ≥ 18 → [nodejs.org](https://nodejs.org/)
- **npm** ≥ 9 (instalado com Node.js)
- **Expo Go** no celular → [App Store](https://apps.apple.com/app/expo-go/id982107779) / [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- Chave de API gratuita da **OpenWeatherMap** → [openweathermap.org/api](https://openweathermap.org/api)

---

## Instalação e Execução

### 1. Clonar o repositório

```bash
git clone https://github.com/GrazielleBarbosa/Aps_Mobile.git
cd Aps_Mobile
```

### 2. Configurar a API Intermediária (servidor)

```bash
# Entrar na pasta do servidor
cd server

# Instalar dependências
npm install

# Criar o arquivo de variáveis de ambiente
cp .env.example .env

# Editar o .env e adicionar sua chave da OpenWeatherMap
# OPENWEATHER_API_KEY=sua_chave_real_aqui
```

**⚠️ NUNCA commite o arquivo `server/.env`** — ele contém sua chave de API.

### 3. Iniciar o servidor (Terminal 1)

```bash
# Na pasta /server
npm start

# Saída esperada:
# ✅ API intermediária APS Mobile iniciada
#    URL:    http://localhost:3001/api
#    Health: http://localhost:3001/api/health
```

### 4. Instalar dependências do app mobile (Terminal 2)

```bash
# Na raiz do projeto (voltar de /server)
cd ..
npm install
```

### 5. Iniciar o app mobile

```bash
npm start
# ou: npx expo start
```

Aguarde o Metro Bundler iniciar. Em seguida:
- **Celular físico:** Abra o Expo Go e escaneie o QR Code
- **Simulador Android:** Pressione `a` no terminal
- **Simulador iOS:** Pressione `i` no terminal

> **Importante:** O celular e o computador devem estar na **mesma rede Wi-Fi**.

---

## Estrutura de Arquivos

```
ApsMobile/
├── App.js                        # Container de navegação (NavigationContainer)
├── api.js                        # Camada de comunicação com a API intermediária
├── styles.js                     # Estilos centralizados
├── package.json                  # Dependências do app mobile
│
├── config/
│   └── apiConfig.js              # URL base da API (detecta Android/iOS automaticamente)
│
├── services/
│   └── weather.js                # Orquestração das chamadas à API
│
├── components/                   # Componentes reutilizáveis
│   ├── SearchBar.js              # Campo de busca por cidade
│   ├── WeatherHeader.js          # Temperatura atual e ícone
│   ├── ForecastList.js           # Previsão de 7 dias (scroll horizontal)
│   ├── InfoCards.js              # Cards: sol, qualidade do ar, vento
│   └── AlertCard.js              # Card de alerta ambiental (clicável)
│
├── screens/                      # Telas do aplicativo
│   ├── HomeScreen.js             # Dashboard principal
│   └── AlertDetailScreen.js      # Detalhe de alerta com recomendações
│
├── assets/                       # Ícones e imagens do app
│
└── server/                       # API Intermediária (Node.js + Express)
    ├── index.js                  # Servidor principal (CORS, rate limiting)
    ├── package.json              # Dependências do servidor
    ├── .env.example              # Template de variáveis de ambiente
    │
    ├── routes/
    │   └── weatherRoutes.js      # 5 rotas REST da API
    │
    ├── services/
    │   ├── openWeatherService.js # Cliente HTTP para a OpenWeatherMap
    │   └── environmentAlerts.js  # Lógica de geração de alertas ambientais
    │
    └── tests/
        └── environmentAlerts.test.js  # Testes unitários (node:test)
```

---

## Endpoints da API Intermediária

| Método | Endpoint | Parâmetro | Descrição |
|--------|----------|-----------|-----------|
| GET | `/api/health` | — | Health check do servidor |
| GET | `/api/weather/current` | `?city=` | Clima atual |
| GET | `/api/weather/forecast` | `?city=` | Previsão 7 dias |
| GET | `/api/environment/air-quality` | `?city=` | Qualidade do ar |
| GET | `/api/environment/alerts` | `?city=` | Alertas ambientais |

**Exemplo:**
```bash
curl "http://localhost:3001/api/weather/current?city=São Paulo"
curl "http://localhost:3001/api/environment/alerts?city=Rio de Janeiro"
```

---

## Testes

```bash
# Testar a lógica de alertas ambientais
cd server && npm test
```

Testes cobrem:
- `mapAirQuality`: mapeamento correto do índice AQI para rótulos
- `buildEnvironmentalAlerts`: detecção de poluição elevada
- `buildEnvironmentalAlerts`: detecção de risco de alagamento

---

## Solução de Problemas

| Erro | Causa | Solução |
|------|-------|---------|
| "Servidor intermediário não está respondendo" | Servidor não iniciado | Execute `npm start` dentro de `/server` |
| "OPENWEATHER_API_KEY não configurada" | `.env` ausente ou incompleto | Crie `server/.env` com a chave válida |
| "Cidade não encontrada" | Nome da cidade inválido | Use o nome em inglês ou o formato "Cidade, País" |
| QR Code não conecta | Redes diferentes | Conecte celular e computador na mesma Wi-Fi |
| Cache do Expo | Build desatualizado | Execute `npx expo start -c` para limpar cache |

---

## Arquitetura Detalhada

### Fluxo de uma requisição

```
1. Usuário digita "São Paulo" e pressiona buscar
2. HomeScreen chama loadWeatherDashboard('São Paulo')
3. services/weather.js dispara 4 chamadas em paralelo à API intermediária:
   - GET /api/weather/current?city=São Paulo
   - GET /api/weather/forecast?city=São Paulo
   - GET /api/environment/air-quality?city=São Paulo
   - GET /api/environment/alerts?city=São Paulo
4. API intermediária (Express) recebe cada requisição:
   - Valida o parâmetro city
   - Chama openWeatherService (com timeout de 10s)
   - openWeatherService faz fetch para api.openweathermap.org
   - Transforma/enriquece os dados
   - Retorna JSON padronizado
5. HomeScreen atualiza o estado e renderiza os componentes
6. Usuário toca em um alerta → navega para AlertDetailScreen
```

### Decisões de projeto

- **Fetch API nativa** em vez de Axios: evita dependência desnecessária, disponível em Node 18+ e React Native
- **Promise.all** para chamadas paralelas: reduz tempo total de ~4s para ~1.5s
- **AbortController** com timeout de 10s (servidor) e 15s (cliente): evita loading infinito
- **Rate limiting** 100 req/15min: protege a cota gratuita de 1.000 chamadas/dia
- **groupForecastByDay**: agrupa 40 intervalos de 3h em 7 dias com max/min reais
- **formatTime com UTC**: exibe nascer/pôr do sol no horário correto de qualquer cidade

---

## Licença

Projeto educacional — UNIP 2023/2. Todos os direitos reservados às autoras.
