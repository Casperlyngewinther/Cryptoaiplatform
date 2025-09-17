# Exchange API Configuration Guide

## Oversigt

Dette dokument beskriver hvordan du konfigurerer API nøgler for alle understøttede cryptocurrency exchanges i CryptoAI Trading Platform.

### ✅ Implementeret Features

- **Multi-Exchange Support**: Binance, Coinbase Pro, KuCoin, OKX, Bybit, Crypto.com
- **Graceful Degradation**: Systemet fungerer selv med manglende API nøgler
- **Centralized Management**: Exchange Manager håndterer alle connections
- **Silent Mode**: Eliminerer irriterende "API credentials not provided" beskeder
- **Real-time Status**: Live monitoring af exchange connections
- **Automatic Failover**: Bruger primær exchange baseret på tilgængelighed

## 🔧 Konfiguration af API Nøgler

### Environment Variables

Sæt følgende environment variables før server start:

#### Binance
```bash
export BINANCE_API_KEY="your_binance_api_key"
export BINANCE_API_SECRET="your_binance_secret"
export BINANCE_ENABLED="true"              # Optional: default true
export BINANCE_SANDBOX="false"             # Optional: default false
```

#### Coinbase Pro
```bash
export COINBASE_API_KEY="your_coinbase_key"
export COINBASE_API_SECRET="your_coinbase_secret"
export COINBASE_PASSPHRASE="your_passphrase"
export COINBASE_ENABLED="true"             # Optional
export COINBASE_SANDBOX="false"            # Optional
```

#### KuCoin
```bash
export KUCOIN_API_KEY="your_kucoin_key"
export KUCOIN_API_SECRET="your_kucoin_secret"
export KUCOIN_PASSPHRASE="your_kucoin_passphrase"
export KUCOIN_ENABLED="true"               # Optional
export KUCOIN_SANDBOX="false"              # Optional
```

#### OKX
```bash
export OKX_API_KEY="your_okx_key"
export OKX_API_SECRET="your_okx_secret"
export OKX_PASSPHRASE="your_okx_passphrase"
export OKX_ENABLED="true"                  # Optional
export OKX_SANDBOX="false"                 # Optional
```

#### Bybit
```bash
export BYBIT_API_KEY="your_bybit_key"
export BYBIT_API_SECRET="your_bybit_secret"
export BYBIT_ENABLED="true"                # Optional
export BYBIT_SANDBOX="false"               # Optional
```

#### Crypto.com (Allerede konfigureret)
```bash
export CRYPTOCOM_API_KEY="your_cryptocom_key"
export CRYPTOCOM_API_SECRET="your_cryptocom_secret"
export CRYPTOCOM_ENABLED="true"            # Optional
```

### Globale Indstillinger
```bash
export EXCHANGE_TIMEOUT="10000"            # Connection timeout (ms)
export EXCHANGE_RETRY_ATTEMPTS="3"         # Retry attempts
export GRACEFUL_DEGRADATION="true"         # Enable graceful mode
export EXCHANGE_SILENT_MODE="false"        # Suppress warnings
```

## 📁 .env Fil (Anbefalet)

Opret en `.env` fil i projekt root:

```env
# Binance Configuration
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_API_SECRET=your_binance_secret_here

# Coinbase Pro Configuration  
COINBASE_API_KEY=your_coinbase_key_here
COINBASE_API_SECRET=your_coinbase_secret_here
COINBASE_PASSPHRASE=your_coinbase_passphrase_here

# KuCoin Configuration
KUCOIN_API_KEY=your_kucoin_key_here
KUCOIN_API_SECRET=your_kucoin_secret_here
KUCOIN_PASSPHRASE=your_kucoin_passphrase_here

# OKX Configuration
OKX_API_KEY=your_okx_key_here
OKX_API_SECRET=your_okx_secret_here
OKX_PASSPHRASE=your_okx_passphrase_here

# Bybit Configuration
BYBIT_API_KEY=your_bybit_key_here
BYBIT_API_SECRET=your_bybit_secret_here

# Global Settings
EXCHANGE_TIMEOUT=10000
EXCHANGE_RETRY_ATTEMPTS=3
GRACEFUL_DEGRADATION=true
EXCHANGE_SILENT_MODE=false
```

**⚠️ VIGTIGT**: Tilføj `.env` til din `.gitignore` fil for at undgå at committe API nøgler!

## 🏗️ Arkitektur

### Exchange Manager
- **Fil**: `server/services/ExchangeManager.js`
- **Ansvar**: Centralized management af alle exchange connections
- **Features**: Timeout handling, retry logic, graceful degradation

### Exchange Configuration
- **Fil**: `config/exchange-config.js`
- **Ansvar**: Definerer API nøgle struktur og validering
- **Features**: Environment variable mapping, validation logic

### Modified Server
- **Fil**: `enhanced_trading_server.js`
- **Ændringer**: Bruger ExchangeManager i stedet for direkte CryptoComExchange
- **Features**: Primary exchange selection, graceful fallbacks

## 📊 API Endpoints

### Exchange Status
```http
GET /api/exchanges
```

Response:
```json
{
  "status": {
    "binance": {
      "connected": true,
      "features": ["spot", "futures", "websocket", "trading"],
      "latency": "32ms",
      "timestamp": "2025-09-16T04:14:31.000Z"
    },
    "coinbase": {
      "connected": false,
      "reason": "missing_credentials",
      "timestamp": "2025-09-16T04:14:31.000Z"
    }
  },
  "connected": [
    {
      "name": "Binance",
      "features": ["spot", "futures", "websocket", "trading"]
    }
  ],
  "primary": "Binance",
  "total": 6,
  "connectedCount": 1
}
```

### Exchange Restart
```http
POST /api/exchanges/restart
Content-Type: application/json

{
  "exchangeName": "binance"
}
```

Response:
```json
{
  "success": true,
  "exchangeName": "binance",
  "newPrimary": "Binance",
  "message": "Exchange restarted successfully",
  "timestamp": "2025-09-16T04:14:31.000Z"
}
```

### Configuration Help
```http
GET /api/config/help
```

Returnerer komplet guide til API setup for alle exchanges.

## 🔒 Sikkerhed

### Anbefalinger
1. **Read-Only API Nøgler**: Brug read-only nøgler når muligt
2. **IP Whitelist**: Konfigurer IP whitelist på exchange
3. **Nøgle Rotation**: Roter API nøgler regelmæssigt
4. **Sandbox Testing**: Test med sandbox mode først
5. **Environment Variables**: Brug ALDRIG hardcoded nøgler i kode

### API Nøgle Opsætning Links
- **Binance**: https://www.binance.com/en/my/settings/api-management
- **Coinbase Pro**: https://pro.coinbase.com/profile/api
- **KuCoin**: https://www.kucoin.com/account/api
- **OKX**: https://www.okx.com/account/my-api
- **Bybit**: https://www.bybit.com/app/user/api-management

## 🚀 Graceful Degradation

Systemet fungerer elegant selv uden API nøgler:

### Med 0 API Nøgler
- ✅ Server starter normalt
- ✅ Dashboard fungerer
- ✅ Fallback market data vises
- ⚠️ Ingen live trading muligt

### Med Nogle API Nøgler  
- ✅ Forbundne exchanges bruges til data og trading
- ✅ Automatisk primary exchange selection
- ✅ Live market data fra forbundne exchanges
- ✅ Trading funktionalitet aktiveret

### Med Alle API Nøgler
- ✅ Full functionality
- ✅ Multi-exchange trading
- ✅ Redundant connections
- ✅ Optimal performance

## 🔧 Troubleshooting

### Server Logs
Når serveren starter, viser den:
```
🔧 Initialiserer Exchange Manager...
🔗 Connecting to Binance...
✅ Binance: Forbundet
🔑 Coinbase Pro: Mangler API nøgler (apiKey, apiSecret, passphrase)
⚠️ KuCoin: Deaktiveret
❌ OKX: Forbindelse fejlede

📊 Exchange Manager - Initialisering Komplet:
   ✅ Forbundet: 1
   🔑 Mangler nøgler: 1
   ⚠️ Deaktiveret: 1
   ❌ Fejlede: 1

🎯 Aktive Exchanges:
   • Binance (spot, futures, websocket, trading)
```

### Almindelige Problemer

#### "Exchange Manager not initialized"
- **Årsag**: ExchangeManager ikke startet korrekt
- **Løsning**: Genstart server, check logs for fejl

#### "No exchange connected"
- **Årsag**: Ingen API nøgler konfigureret korrekt
- **Løsning**: Konfigurer mindst én exchange med gyldige nøgler

#### "Connection timeout"
- **Årsag**: Netværk problemer eller forkerte nøgler
- **Løsning**: Check nøgler, netværk og prøv igen

#### "Invalid credentials"
- **Årsag**: Forkerte API nøgler eller permissions
- **Løsning**: Verificer nøgler på exchange, check permissions

## 📈 Monitoring

### Real-time Status
```bash
curl http://localhost:5000/api/exchanges
```

### Detailed System Status
```bash
curl http://localhost:5000/api/status/detailed
```

### Configuration Help
```bash
curl http://localhost:5000/api/config/help
```

## 🎯 Best Practices

1. **Start Small**: Konfigurer én exchange ad gangen
2. **Test Sandbox**: Brug sandbox mode for testing
3. **Monitor Logs**: Hold øje med connection status i logs
4. **Use Primary**: Systemet vælger automatisk primary exchange
5. **Failover Ready**: Konfigurer flere exchanges for redundancy

## 📋 Checklist

- [ ] API nøgler oprettet på ønskede exchanges
- [ ] Environment variables sat eller .env fil oprettet
- [ ] .env tilføjet til .gitignore
- [ ] IP whitelist konfigureret på exchanges
- [ ] Server genstartet efter konfiguration
- [ ] Connection status verificeret via `/api/exchanges`
- [ ] Trading funktionalitet testet

---

**Sidste opdatering**: 2025-09-16  
**Version**: 2.0 - Multi-Exchange Integration Complete
