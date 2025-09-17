# API Credentials Setup Guide
*Komplet opsætningsguide for alle støttede cryptocurrency exchanges*

## 📋 Exchange Audit Resultater

Baseret på audit af Challenge 4 kodebasen er følgende exchanges konfigureret:

### 🔍 Understøttede Exchanges

| Exchange | Status | API Keys | Passphrase | Sandbox Support |
|----------|--------|----------|------------|-----------------|
| Binance | ⚠️ Mangler credentials | API_KEY, API_SECRET | Nej | Ja |
| Coinbase Pro | ⚠️ Mangler credentials | API_KEY, API_SECRET | **JA** | Ja |
| KuCoin | ⚠️ Mangler credentials | API_KEY, API_SECRET | **JA** | Ja |
| OKX | ⚠️ Mangler credentials | API_KEY, API_SECRET | **JA** | Ja |
| Bybit | ⚠️ Mangler credentials | API_KEY, API_SECRET | Nej | Ja |
| Crypto.com | ✅ Konfigureret | API_KEY, API_SECRET | Nej | Ja |

## 🚨 Identificerede Problemer

### 1. "API credentials not provided" fejl
**Lokation**: Alle exchange service filer i `server/services/`
```javascript
// Fejl opstår i initialize() metoden når:
if (!this.apiKey || !this.apiSecret) {
  console.log(`⚠️  ${this.name} API credentials not provided, skipping connection`);
  return false;
}
```

### 2. Manglende Environment Variables
Følgende environment variables er **ikke defineret**:

**Binance:**
- `BINANCE_API_KEY`
- `BINANCE_API_SECRET`

**Coinbase Pro:**
- `COINBASE_API_KEY`
- `COINBASE_API_SECRET`
- `COINBASE_PASSPHRASE` ⚠️ **Kritisk**

**KuCoin:**
- `KUCOIN_API_KEY`
- `KUCOIN_API_SECRET`
- `KUCOIN_PASSPHRASE` ⚠️ **Kritisk**

**OKX:**
- `OKX_API_KEY`
- `OKX_API_SECRET`
- `OKX_PASSPHRASE` ⚠️ **Kritisk**

**Bybit:**
- `BYBIT_API_KEY`
- `BYBIT_API_SECRET`

## 🛠 Løsning: API Credentials Opsætning

### Trin 1: Opret .env fil
```bash
cp .env.template .env
```

### Trin 2: Få API credentials fra hver exchange

#### 🟡 Binance
1. Gå til [Binance API Management](https://www.binance.com/en/my/settings/api-management)
2. Opret ny API key
3. Aktiver "Enable Reading" og "Enable Spot & Margin Trading" (hvis nødvendigt)
4. Tilføj til .env:
```bash
BINANCE_API_KEY=din_binance_api_key
BINANCE_API_SECRET=din_binance_secret
```

#### 🔵 Coinbase Pro
1. Gå til [Coinbase Pro API](https://pro.coinbase.com/profile/api)
2. Opret ny API key med permissions: View, Trade (hvis nødvendigt)
3. **Vigtigt**: Gem passphrase - den vises kun én gang!
4. Tilføj til .env:
```bash
COINBASE_API_KEY=din_coinbase_api_key
COINBASE_API_SECRET=din_coinbase_secret
COINBASE_PASSPHRASE=din_coinbase_passphrase
```

#### 🟢 KuCoin
1. Gå til [KuCoin API Management](https://www.kucoin.com/account/api)
2. Opret ny API key
3. Sæt permissions: General (læse), Trade (hvis nødvendigt)
4. **Vigtigt**: Gem passphrase!
5. Tilføj til .env:
```bash
KUCOIN_API_KEY=din_kucoin_api_key
KUCOIN_API_SECRET=din_kucoin_secret
KUCOIN_PASSPHRASE=din_kucoin_passphrase
```

#### 🔴 OKX
1. Gå til [OKX API Management](https://www.okx.com/account/my-api)
2. Opret ny API key
3. Sæt permissions efter behov
4. **Vigtigt**: Gem passphrase!
5. Tilføj til .env:
```bash
OKX_API_KEY=din_okx_api_key
OKX_API_SECRET=din_okx_secret
OKX_PASSPHRASE=din_okx_passphrase
```

#### ⚪ Bybit
1. Gå til [Bybit API Management](https://www.bybit.com/app/user/api-management)
2. Opret ny API key
3. Sæt permissions efter behov
4. Tilføj til .env:
```bash
BYBIT_API_KEY=din_bybit_api_key
BYBIT_API_SECRET=din_bybit_secret
```

### Trin 3: Valgfri konfigurationer

#### Sandbox/Testnet Mode
Aktivér testnet mode for sikker testing:
```bash
BINANCE_SANDBOX=true
COINBASE_SANDBOX=true
KUCOIN_SANDBOX=true
OKX_SANDBOX=true
BYBIT_SANDBOX=true
```

#### Silent Mode
Eliminér warning beskeder:
```bash
EXCHANGE_SILENT_MODE=true
```

#### Deaktivér specifikke exchanges
```bash
BINANCE_ENABLED=false
COINBASE_ENABLED=false
# osv.
```

## 🔧 Validering af Setup

### Automatisk validering
Kodebasen inkluderer automatisk validering i `config/exchange-config.js`:
```javascript
function validateExchangeConfig(exchangeName, config) {
  const required = ['apiKey', 'apiSecret'];
  
  // Tilføj passphrase for exchanges der kræver det
  if (['coinbase', 'kucoin', 'okx'].includes(exchangeName)) {
    required.push('passphrase');
  }
  
  const missing = required.filter(field => !config[field]);
  // ...
}
```

### Test forbindelser
Kør test for at verificere alle credentials:
```bash
npm test
# eller
node test_all_exchanges.js
```

### Forventet output efter korrekt setup:
```
✅ Binance: Forbundet
✅ Coinbase Pro: Forbundet  
✅ KuCoin: Forbundet
✅ OKX: Forbundet
✅ Bybit: Forbundet
✅ Crypto.com: Forbundet
```

## ⚠️ Sikkerhedsanbefalinger

### 1. Beskytt API credentials
- **Aldrig** commit `.env` til version control
- Brug kun nødvendige permissions
- Aktivér IP whitelist hvor muligt
- Roter API keys regelmæssigt

### 2. Test først på Sandbox
- Start altid med sandbox/testnet
- Verificer funktionalitet før live trading
- Brug små beløb ved første live test

### 3. Overvåg forbindelser
- Check logs for fejl
- Implementer alerting ved forbindelsesfejl
- Overvåg API rate limits

## 📊 Konfigurationsfiler

### Primære konfigurationsfiler:
- `.env` - Environment variables (OPRET DENNE!)
- `.env.template` - Template med alle variabler
- `config/exchange-config.js` - Exchange konfiguration og validering
- `server/services/ExchangeManager.js` - Centraliseret exchange management

### Exchange service filer:
- `server/services/BinanceExchange.js`
- `server/services/CoinbaseExchange.js`
- `server/services/KuCoinExchange.js`
- `server/services/OKXExchange.js`
- `server/services/BybitExchange.js`
- `server/services/CryptoComExchange.js`

## 🔄 Fejlfinding

### Almindelige fejl og løsninger:

#### "API credentials not provided"
**Årsag**: Environment variable ikke sat eller forkert navn
**Løsning**: Tjek .env fil og variable navne

#### "Connection failed"
**Årsag**: Forkerte credentials eller netværksfejl
**Løsning**: Verificer API keys og internetforbindelse

#### "Passphrase required"
**Årsag**: Manglende passphrase for Coinbase Pro, KuCoin eller OKX
**Løsning**: Tilføj `*_PASSPHRASE` environment variable

#### Rate limit fejl
**Årsag**: For mange API kald
**Løsning**: Implementer rate limiting og backoff strategier

---

*Sidste opdatering: 2025-09-16*
*For support, tjek projektets GitHub repository eller kontakt udviklingsholdet.*
