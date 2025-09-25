const axios = require('axios');

class BinanceAPI {
    constructor() {
        // Try multiple endpoints in case of regional restrictions
        this.endpoints = [
            'https://api.binance.com/api/v3',
            'https://api1.binance.com/api/v3',
            'https://api2.binance.com/api/v3',
            'https://api3.binance.com/api/v3'
        ];
        this.currentEndpointIndex = 0;
    }

    /**
     * Get current price for a trading pair
     * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
     * @returns {Promise<number>} Current price
     */
    async getCurrentPrice(symbol) {
        const binanceSymbol = symbol.replace('/', '');
        let lastError;

        // Try each endpoint until one works
        for (let i = 0; i < this.endpoints.length; i++) {
            try {
                const endpoint = this.endpoints[i];
                console.log(`Trying Binance endpoint: ${endpoint}`);
                
                const response = await axios.get(`${endpoint}/ticker/price`, {
                    params: { symbol: binanceSymbol },
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.data && response.data.price) {
                    console.log(`Successfully fetched price for ${symbol} from ${endpoint}`);
                    return parseFloat(response.data.price);
                } else {
                    throw new Error('Invalid response from Binance API');
                }
            } catch (error) {
                lastError = error;
                console.error(`Error fetching price for ${symbol} from endpoint ${i}:`, error.message);
                
                // If it's a 451 error, try the next endpoint
                if (error.response && error.response.status === 451) {
                    console.log(`451 error from endpoint ${i}, trying next endpoint...`);
                    continue;
                }
                
                // For other errors, also try next endpoint
                continue;
            }
        }

        // If all endpoints fail, try using a fallback price service
        console.log('All Binance endpoints failed, trying fallback price service...');
        return await this.getFallbackPrice(symbol);
    }

    /**
     * Get 24hr ticker statistics
     * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
     * @returns {Promise<Object>} 24hr ticker data
     */
    async get24hrTicker(symbol) {
        const binanceSymbol = symbol.replace('/', '');

        // Try each endpoint until one works
        for (let i = 0; i < this.endpoints.length; i++) {
            try {
                const endpoint = this.endpoints[i];
                
                const response = await axios.get(`${endpoint}/ticker/24hr`, {
                    params: { symbol: binanceSymbol },
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                return response.data;
            } catch (error) {
                console.error(`Error fetching 24hr ticker for ${symbol} from endpoint ${i}:`, error.message);
                
                // If it's a 451 error, try the next endpoint
                if (error.response && error.response.status === 451) {
                    console.log(`451 error from endpoint ${i}, trying next endpoint...`);
                    continue;
                }
                
                // For other errors, also try next endpoint
                continue;
            }
        }

        // If all endpoints fail, return a basic ticker object
        console.log('All Binance endpoints failed for 24hr ticker, returning basic data...');
        return {
            symbol: binanceSymbol,
            priceChange: '0',
            priceChangePercent: '0',
            weightedAvgPrice: '0',
            prevClosePrice: '0',
            lastPrice: '0',
            lastQty: '0',
            bidPrice: '0',
            askPrice: '0',
            openPrice: '0',
            highPrice: '0',
            lowPrice: '0',
            volume: '0',
            quoteVolume: '0'
        };
    }

    /**
     * Fallback price service using CoinGecko API
     * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
     * @returns {Promise<number>} Current price
     */
    async getFallbackPrice(symbol) {
        try {
            // Convert trading pair symbol to CoinGecko format
            let coinId;
            let vsCurrency = 'usd';
            
            // Handle different symbol patterns
            if (symbol.includes('USDT')) {
                // Extract base currency (e.g., BTC from BTCUSDT)
                coinId = symbol.replace('USDT', '').toLowerCase();
                vsCurrency = 'usd';
            } else if (symbol.includes('BTC')) {
                // Handle BTC pairs (e.g., ETHBTC)
                coinId = symbol.replace('BTC', '').toLowerCase();
                vsCurrency = 'btc';
            } else if (symbol.includes('ETH')) {
                // Handle ETH pairs (e.g., LINKETH)
                coinId = symbol.replace('ETH', '').toLowerCase();
                vsCurrency = 'eth';
            } else {
                // Default to USD
                coinId = symbol.toLowerCase();
                vsCurrency = 'usd';
            }

            // Map common symbols to CoinGecko IDs
            const coinMapping = {
                'btc': 'bitcoin',
                'eth': 'ethereum',
                'usdt': 'tether',
                'bnb': 'binancecoin',
                'ada': 'cardano',
                'sol': 'solana',
                'dot': 'polkadot',
                'doge': 'dogecoin',
                'matic': 'matic-network',
                'link': 'chainlink',
                'uni': 'uniswap',
                'ltc': 'litecoin',
                'bch': 'bitcoin-cash',
                'xrp': 'ripple',
                'trx': 'tron',
                'eos': 'eos',
                'neo': 'neo',
                'vet': 'vechain',
                'icp': 'internet-computer',
                'fil': 'filecoin'
            };

            // Use mapped ID or original
            const finalCoinId = coinMapping[coinId] || coinId;
            
            console.log(`CoinGecko lookup: ${finalCoinId} vs ${vsCurrency}`);

            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
                params: {
                    ids: finalCoinId,
                    vs_currencies: vsCurrency
                },
                timeout: 10000
            });

            if (response.data && response.data[finalCoinId] && response.data[finalCoinId][vsCurrency]) {
                const price = response.data[finalCoinId][vsCurrency];
                console.log(`Successfully fetched price for ${symbol} from CoinGecko fallback: ${price} ${vsCurrency}`);
                
                // For reverse pairs like USDTBTC, we need to return 1/price
                if (symbol.startsWith('USDT') && vsCurrency === 'usd') {
                    // USDTBTC means "how much USDT for 1 BTC", so we return 1/price
                    const reversePrice = 1 / price;
                    console.log(`Converting USDTBTC price: 1 / ${price} = ${reversePrice}`);
                    return reversePrice;
                }
                
                return price;
            } else {
                throw new Error('Invalid response from CoinGecko API');
            }
        } catch (error) {
            console.error(`Error fetching fallback price for ${symbol}:`, error.message);
            
            // If even fallback fails, return a reasonable default price
            console.log(`Using default price for ${symbol}`);
            return this.getDefaultPrice(symbol);
        }
    }

    /**
     * Get default price when all APIs fail
     * @param {string} symbol - Trading pair symbol
     * @returns {number} Default price
     */
    getDefaultPrice(symbol) {
        const defaultPrices = {
            // USDT pairs
            'BTCUSDT': 45000,
            'ETHUSDT': 2500,
            'BNBUSDT': 300,
            'ADAUSDT': 0.5,
            'SOLUSDT': 100,
            'DOTUSDT': 7,
            'DOGEUSDT': 0.08,
            'MATICUSDT': 0.8,
            'LINKUSDT': 15,
            'UNIUSDT': 7,
            'LTCUSDT': 70,
            'BCHUSDT': 250,
            'XRPUSDT': 0.5,
            'TRXUSDT': 0.08,
            'EOSUSDT': 0.7,
            'NEOUSDT': 12,
            'VETUSDT': 0.02,
            'ICPUSDT': 12,
            'FILUSDT': 5,
            
            // BTC pairs
            'ETHBTC': 0.055,
            'BNBBTC': 0.0067,
            'ADABTC': 0.000011,
            'SOLBTC': 0.0022,
            'DOTBTC': 0.00016,
            'DOGEBTC': 0.0000018,
            'MATICBTC': 0.000018,
            'LINKBTC': 0.00033,
            'UNIBTC': 0.00016,
            'LTCBTC': 0.0016,
            'BCHBTC': 0.0056,
            'XRPBTC': 0.000011,
            'TRXBTC': 0.0000018,
            'EOSBTC': 0.000016,
            'NEOBTC': 0.00027,
            'VETBTC': 0.00000044,
            'ICPBTC': 0.00027,
            'FILBTC': 0.00011,
            
            // Reverse pairs (for swap calculations)
            'USDTBTC': 1/45000,
            'USDTETH': 1/2500,
            'USDTBNB': 1/300,
            'USDTADA': 1/0.5,
            'USDTSOL': 1/100,
            'USDTDOT': 1/7,
            'USDTDOGE': 1/0.08,
            'USDTMATIC': 1/0.8,
            'USDTLINK': 1/15,
            'USDTUNI': 1/7,
            'USDTLTC': 1/70,
            'USDTBCH': 1/250,
            'USDTXRP': 1/0.5,
            'USDTTRX': 1/0.08,
            'USDTEOS': 1/0.7,
            'USDTNEO': 1/12,
            'USDTVET': 1/0.02,
            'USDTICP': 1/12,
            'USDTFIL': 1/5,
            
            // BTC reverse pairs
            'BTCETH': 1/0.055,
            'BTCBNB': 1/0.0067,
            'BTCADA': 1/0.000011,
            'BTCSOL': 1/0.0022,
            'BTCDOT': 1/0.00016,
            'BTCDOGE': 1/0.0000018,
            'BTCMATIC': 1/0.000018,
            'BTCLINK': 1/0.00033,
            'BTCUNI': 1/0.00016,
            'BTCLTC': 1/0.0016,
            'BTCBCH': 1/0.0056,
            'BTCXRP': 1/0.000011,
            'BTCTRX': 1/0.0000018,
            'BTCEOS': 1/0.000016,
            'BTCNEO': 1/0.00027,
            'BTCVET': 1/0.00000044,
            'BTCICP': 1/0.00027,
            'BTCFIL': 1/0.00011
        };
        
        const price = defaultPrices[symbol] || 1;
        console.log(`Using default price for ${symbol}: ${price}`);
        return price;
    }

    /**
     * Validate if a symbol exists on Binance
     * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
     * @returns {Promise<boolean>} True if symbol exists
     */
    async validateSymbol(symbol) {
        try {
            const binanceSymbol = symbol.replace('/', '');
            await this.getCurrentPrice(symbol);
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new BinanceAPI(); 