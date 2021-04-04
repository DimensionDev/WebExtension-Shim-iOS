(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[190],{

/***/ 1578:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "getCurrenies", function() { return /* reexport */ getCurrenies; });
__webpack_require__.d(__webpack_exports__, "getLimitedCurrenies", function() { return /* reexport */ getLimitedCurrenies; });
__webpack_require__.d(__webpack_exports__, "getCoins", function() { return /* reexport */ getCoins; });
__webpack_require__.d(__webpack_exports__, "checkAvailabilityOnDataProvider", function() { return /* reexport */ checkAvailabilityOnDataProvider; });
__webpack_require__.d(__webpack_exports__, "getAvailableDataProviders", function() { return /* reexport */ getAvailableDataProviders; });
__webpack_require__.d(__webpack_exports__, "getCoinInfo", function() { return /* reexport */ apis_getCoinInfo; });
__webpack_require__.d(__webpack_exports__, "getCoinTrendingByKeyword", function() { return /* reexport */ getCoinTrendingByKeyword; });
__webpack_require__.d(__webpack_exports__, "getPriceStats", function() { return /* reexport */ apis_getPriceStats; });

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/types/index.ts + 2 modules
var types = __webpack_require__(23);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/constants/index.ts + 2 modules
var constants = __webpack_require__(77);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/flags.ts
var flags = __webpack_require__(34);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/apis/coingecko/index.ts


//#region get currency
async function getAllCurrenies() {
    const response = await fetch(`${constants["f" /* COIN_GECKO_BASE_URL */]}/simple/supported_vs_currencies`, { cache: 'force-cache' });
    return response.json();
}
async function getAllCoins() {
    const response = await fetch(`${constants["f" /* COIN_GECKO_BASE_URL */]}/coins/list`, { cache: 'force-cache' });
    return response.json();
}
async function getCoinInfo(coinId) {
    const response = await fetch(`${constants["f" /* COIN_GECKO_BASE_URL */]}/coins/${coinId}?developer_data=false&community_data=false&tickers=true`, { cache: flags["a" /* Flags */].trader_all_api_cached_enabled ? 'force-cache' : 'default' });
    return response.json();
}
async function getPriceStats(coinId, currencyId, days) {
    const params = new URLSearchParams();
    params.append('vs_currency', currencyId);
    params.append('days', String(days));
    const response = await fetch(`${constants["f" /* COIN_GECKO_BASE_URL */]}/coins/${coinId}/market_chart?${params.toString()}`, {
        cache: flags["a" /* Flags */].trader_all_api_cached_enabled ? 'force-cache' : 'default',
    });
    return response.json();
}
//#endregion

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/apis/coinmarketcap/index.ts


//#region get all currency
function coinmarketcap_getAllCurrenies() {
    return [];
}
async function coinmarketcap_getAllCoins() {
    const response = await fetch(`${constants["d" /* CMC_V1_BASE_URL */]}/cryptocurrency/map?aux=status,platform&listing_status=active,untracked&sort=cmc_rank`, { cache: 'force-cache' });
    return response.json();
}
async function getQuotesInfo(id, currency) {
    const params = new URLSearchParams('ref=widget');
    params.append('convert', currency);
    try {
        const response = await fetch(`${constants["e" /* CMC_V2_BASE_URL */]}/ticker/${id}/?${params.toString()}`, {
            cache: flags["a" /* Flags */].trader_all_api_cached_enabled ? 'force-cache' : 'default',
        });
        return response.json();
    }
    catch (e) {
        return {
            data: null,
        };
    }
}
async function coinmarketcap_getCoinInfo(id) {
    const params = new URLSearchParams('aux=urls,logo,description,tags,platform,date_added,notice,status');
    params.append('id', id);
    const response_ = await fetch(`${constants["d" /* CMC_V1_BASE_URL */]}/cryptocurrency/info?${params.toString()}`, {
        cache: flags["a" /* Flags */].trader_all_api_cached_enabled ? 'force-cache' : 'default',
    });
    const response = (await response_.json());
    return {
        data: response.data[id],
        status: response.status,
    };
}
async function getHistorical(id, currency, startDate, endDate, interval = '1d') {
    const toUnixTimestamp = (d) => String(Math.floor(d.getTime() / 1000));
    const params = new URLSearchParams('format=chart_crypto_details');
    params.append('convert', currency);
    params.append('id', id);
    params.append('interval', interval);
    params.append('time_end', toUnixTimestamp(endDate));
    params.append('time_start', toUnixTimestamp(startDate));
    const response = await fetch(`${constants["d" /* CMC_V1_BASE_URL */]}/cryptocurrency/quotes/historical?${params.toString()}`, {
        cache: flags["a" /* Flags */].trader_all_api_cached_enabled ? 'force-cache' : 'default',
    });
    return response.json();
}
async function getLatestMarketPairs(id, currency) {
    const params = new URLSearchParams('aux=num_market_pairs,market_url,price_quote,effective_liquidity,market_score,market_reputation&limit=40&sort=cmc_rank&start=1');
    params.append('convert', currency);
    params.append('id', id);
    try {
        const response = await fetch(`${constants["d" /* CMC_V1_BASE_URL */]}/cryptocurrency/market-pairs/latest?${params.toString()}`, {
            cache: flags["a" /* Flags */].trader_all_api_cached_enabled ? 'force-cache' : 'default',
        });
        return response.json();
    }
    catch (e) {
        return {
            data: {
                id,
                market_pairs: [],
                num_market_pairs: 0,
            },
        };
    }
}
//#endregion

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/PriceChartDaysControl.tsx
var PriceChartDaysControl = __webpack_require__(288);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/enum.ts
var utils_enum = __webpack_require__(216);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/apis/hotfix.ts


// TODO:
// we should support switching between multiple-coins in the future
const KEYWORK_ID_MAP = {
    [types["a" /* DataProvider */].COIN_MARKET_CAP]: {
        UNI: '7083',
        CRU: '6747',
        CRUST: '6747',
    },
    [types["a" /* DataProvider */].COIN_GECKO]: {
        UNI: 'uniswap',
        CRU: 'crust-network',
        CRUST: 'crust-network',
    },
};
const ID_ADDRESS_MAP = {
    [types["a" /* DataProvider */].COIN_MARKET_CAP]: {
        '6747': '0x32a7c02e79c4ea1008dd6564b35f131428673c41',
    },
    [types["a" /* DataProvider */].COIN_GECKO]: {
        'crust-network': '0x32a7c02e79c4ea1008dd6564b35f131428673c41',
    },
};
function resolveCoinId(keyword, dataProvider) {
    if (dataProvider === types["a" /* DataProvider */].COIN_MARKET_CAP)
        return KEYWORK_ID_MAP[types["a" /* DataProvider */].COIN_MARKET_CAP][keyword.toUpperCase()];
    if (dataProvider === types["a" /* DataProvider */].COIN_GECKO)
        return KEYWORK_ID_MAP[types["a" /* DataProvider */].COIN_GECKO][keyword.toUpperCase()];
    Object(utils["u" /* unreachable */])(dataProvider);
}
function resolveCoinAddress(id, dataProvider) {
    if (dataProvider === types["a" /* DataProvider */].COIN_MARKET_CAP)
        return ID_ADDRESS_MAP[types["a" /* DataProvider */].COIN_MARKET_CAP][id];
    if (dataProvider === types["a" /* DataProvider */].COIN_GECKO)
        return ID_ADDRESS_MAP[types["a" /* DataProvider */].COIN_GECKO][id];
    Object(utils["u" /* unreachable */])(dataProvider);
}

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/apis/index.ts







async function getCurrenies(dataProvider) {
    if (dataProvider === types["a" /* DataProvider */].COIN_GECKO) {
        const currencies = await getAllCurrenies();
        return currencies.map((x) => ({
            id: x,
            name: x.toUpperCase(),
        }));
    }
    return Object.values(coinmarketcap_getAllCurrenies()).map((x) => ({
        id: String(x.id),
        name: x.symbol.toUpperCase(),
        symbol: x.token,
        description: x.name,
    }));
}
async function getLimitedCurrenies(dataProvider) {
    return Promise.resolve([
        dataProvider === types["a" /* DataProvider */].COIN_GECKO
            ? {
                id: 'usd',
                name: 'USD',
                symbol: '$',
                description: 'Unite State Dollar',
            }
            : {
                id: '2781',
                name: 'USD',
                symbol: '$',
                description: 'Unite State Dollar',
            },
    ]);
}
async function getCoins(dataProvider) {
    if (dataProvider === types["a" /* DataProvider */].COIN_GECKO)
        return getAllCoins();
    return (await coinmarketcap_getAllCoins()).data.map((x) => {
        var _a;
        return ({
            id: String(x.id),
            name: x.name,
            symbol: x.symbol,
            eth_address: ((_a = x.platform) === null || _a === void 0 ? void 0 : _a.name) === 'Ethereum' ? x.platform.token_address : undefined,
        });
    });
}
//#region check a specific coin is available on specific dataProvider
const coinNamespace = new Map();
async function updateCache(dataProvider) {
    const coins = await getCoins(dataProvider);
    coinNamespace.set(dataProvider, {
        supported: new Set(coins.map((x) => x.symbol.toLowerCase())),
        lastUpdated: new Date(),
    });
}
function isCacheExipred(dataProvider) {
    var _a, _b;
    return (coinNamespace.has(dataProvider) &&
        new Date().getTime() - ((_b = (_a = coinNamespace.get(dataProvider)) === null || _a === void 0 ? void 0 : _a.lastUpdated.getTime()) !== null && _b !== void 0 ? _b : 0) >
            constants["g" /* CRYPTOCURRENCY_MAP_EXPIRES_AT */]);
}
async function checkAvailabilityOnDataProvider(dataProvider, keyword) {
    var _a, _b;
    // cache never built before update in blocking way
    if (!coinNamespace.has(dataProvider))
        await updateCache(dataProvider);
    // data fetched before update in nonblocking way
    else if (isCacheExipred(dataProvider))
        updateCache(dataProvider);
    return (_b = (_a = coinNamespace.get(dataProvider)) === null || _a === void 0 ? void 0 : _a.supported.has(keyword.toLowerCase())) !== null && _b !== void 0 ? _b : false;
}
async function getAvailableDataProviders(keyword) {
    const checked = await Promise.all(Object(utils_enum["a" /* getEnumAsArray */])(types["a" /* DataProvider */]).map(async (x) => [x.value, await checkAvailabilityOnDataProvider(x.value, keyword)]));
    return checked.filter(([_, y]) => y).map(([x]) => x);
}
//#endregion
async function apis_getCoinInfo(id, dataProvider, currency) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    if (dataProvider === types["a" /* DataProvider */].COIN_GECKO) {
        const info = await getCoinInfo(id);
        const platform_url = `https://www.coingecko.com/en/coins/${info.id}`;
        const twitter_url = info.links.twitter_screen_name
            ? `https://twitter.com/${info.links.twitter_screen_name}`
            : '';
        const facebook_url = info.links.facebook_username ? `https://t.me/${info.links.facebook_username}` : '';
        const telegram_url = info.links.telegram_channel_identifier
            ? `https://t.me/${info.links.telegram_channel_identifier}`
            : '';
        return {
            lastUpdated: info.last_updated,
            dataProvider,
            currency,
            coin: {
                id,
                name: info.name,
                symbol: info.symbol.toUpperCase(),
                // TODO:
                // use current language setting
                description: info.description.en,
                market_cap_rank: info.market_cap_rank,
                image_url: info.image.small,
                tags: info.categories.filter(Boolean),
                announcement_urls: info.links.announcement_url.filter(Boolean),
                community_urls: [
                    twitter_url,
                    facebook_url,
                    telegram_url,
                    info.links.subreddit_url,
                    ...info.links.chat_url,
                    ...info.links.official_forum_url,
                ].filter(Boolean),
                source_code_urls: Object.values(info.links.repos_url).flatMap((x) => x),
                home_urls: info.links.homepage.filter(Boolean),
                blockchain_urls: [platform_url, ...info.links.blockchain_site].filter(Boolean),
                platform_url,
                facebook_url,
                twitter_url,
                telegram_url,
                eth_address: (_a = resolveCoinAddress(id, types["a" /* DataProvider */].COIN_GECKO)) !== null && _a !== void 0 ? _a : (info.asset_platform_id === 'ethereum' ? info.contract_address : undefined),
            },
            market: Object.entries(info.market_data).reduce((accumulated, [key, value]) => {
                if (value && typeof value === 'object')
                    accumulated[key] = value[currency.id];
                else
                    accumulated[key] = value;
                return accumulated;
            }, {}),
            tickers: info.tickers.slice(0, 30).map((x) => ({
                logo_url: x.market.logo,
                trade_url: x.trade_url,
                market_name: x.market.name,
                base_name: x.base,
                target_name: x.target,
                price: x.converted_last.usd,
                volume: x.converted_volume.usd,
                score: x.trust_score,
            })),
        };
    }
    const currencyName = currency.name.toUpperCase();
    const [{ data: coinInfo, status }, { data: quotesInfo }, { data: market }] = await Promise.all([
        coinmarketcap_getCoinInfo(id),
        getQuotesInfo(id, currencyName),
        getLatestMarketPairs(id, currencyName),
    ]);
    const trending = {
        lastUpdated: status.timestamp,
        coin: {
            id,
            name: coinInfo.name,
            symbol: coinInfo.symbol,
            announcement_urls: (_b = coinInfo.urls.announcement) === null || _b === void 0 ? void 0 : _b.filter(Boolean),
            tech_docs_urls: (_c = coinInfo.urls.technical_doc) === null || _c === void 0 ? void 0 : _c.filter(Boolean),
            message_board_urls: (_d = coinInfo.urls.message_board) === null || _d === void 0 ? void 0 : _d.filter(Boolean),
            source_code_urls: (_e = coinInfo.urls.source_code) === null || _e === void 0 ? void 0 : _e.filter(Boolean),
            community_urls: [
                ...((_f = coinInfo.urls.twitter) !== null && _f !== void 0 ? _f : []),
                ...((_g = coinInfo.urls.reddit) !== null && _g !== void 0 ? _g : []),
                ...((_h = coinInfo.urls.chat) !== null && _h !== void 0 ? _h : []),
            ].filter(Boolean),
            home_urls: (_j = coinInfo.urls.website) === null || _j === void 0 ? void 0 : _j.filter(Boolean),
            blockchain_urls: [
                `https://coinmarketcap.com/currencies/${coinInfo.slug}/`,
                ...((_k = coinInfo.urls.explorer) !== null && _k !== void 0 ? _k : []),
            ].filter(Boolean),
            tags: (_l = coinInfo.tags) !== null && _l !== void 0 ? _l : void 0,
            image_url: `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`,
            platform_url: `https://coinmarketcap.com/currencies/${coinInfo.slug}/`,
            twitter_url: (_m = coinInfo.urls.twitter) === null || _m === void 0 ? void 0 : _m.find((x) => x.includes('twitter')),
            telegram_url: (_o = coinInfo.urls.chat) === null || _o === void 0 ? void 0 : _o.find((x) => x.includes('telegram')),
            market_cap_rank: quotesInfo === null || quotesInfo === void 0 ? void 0 : quotesInfo.rank,
            description: coinInfo.description,
            eth_address: (_p = resolveCoinAddress(id, types["a" /* DataProvider */].COIN_MARKET_CAP)) !== null && _p !== void 0 ? _p : (((_q = coinInfo.platform) === null || _q === void 0 ? void 0 : _q.name) === 'Ethereum' ? (_r = coinInfo.platform) === null || _r === void 0 ? void 0 : _r.token_address : undefined),
        },
        currency,
        dataProvider,
        tickers: market.market_pairs
            .map((pair) => ({
            logo_url: `https://s2.coinmarketcap.com/static/img/exchanges/32x32/${pair.exchange.id}.png`,
            trade_url: pair.market_url,
            market_name: pair.exchange.name,
            market_reputation: pair.market_reputation,
            base_name: pair.market_pair_base.exchange_symbol,
            target_name: pair.market_pair_quote.exchange_symbol,
            price: pair.market_pair_base.currency_id === market.id
                ? pair.quote[currencyName].price
                : pair.quote[currencyName].price_quote,
            volume: pair.quote[currencyName].volume_24h,
            score: String(pair.market_score),
        }))
            .sort((a, z) => {
            if (a.market_reputation !== z.market_reputation)
                return z.market_reputation - a.market_reputation; // reputation from high to low
            if (a.price.toFixed(2) !== z.price.toFixed(2))
                return z.price - a.price; // price from high to low
            return z.volume - a.volume; // volumn from high to low
        }),
    };
    if (quotesInfo)
        trending.market = {
            circulating_supply: (_s = quotesInfo.total_supply) !== null && _s !== void 0 ? _s : void 0,
            total_supply: (_t = quotesInfo.total_supply) !== null && _t !== void 0 ? _t : void 0,
            max_supply: (_u = quotesInfo.max_supply) !== null && _u !== void 0 ? _u : void 0,
            market_cap: quotesInfo.quotes[currencyName].market_cap,
            current_price: quotesInfo.quotes[currencyName].price,
            total_volume: quotesInfo.quotes[currencyName].volume_24h,
            price_change_percentage_1h_in_currency: quotesInfo.quotes[currencyName].percent_change_1h,
            price_change_percentage_24h_in_currency: quotesInfo.quotes[currencyName].percent_change_24h,
            price_change_percentage_7d_in_currency: quotesInfo.quotes[currencyName].percent_change_7d,
        };
    return trending;
}
async function getCoinTrendingByKeyword(keyword, dataProvider, currency) {
    var _a;
    const coins = await getCoins(dataProvider);
    const coin = coins.find((x) => x.symbol.toLowerCase() === keyword.toLowerCase());
    if (!coin)
        return null;
    return apis_getCoinInfo((_a = resolveCoinId(keyword, dataProvider)) !== null && _a !== void 0 ? _a : coin.id, dataProvider, currency);
}
async function apis_getPriceStats(id, dataProvider, currency, days) {
    if (dataProvider === types["a" /* DataProvider */].COIN_GECKO) {
        const stats = await getPriceStats(id, currency.id, days === PriceChartDaysControl["a" /* Days */].MAX ? 11430 : days);
        return stats.prices;
    }
    const interval = (() => {
        if (days === 0)
            return '1d'; // max
        if (days > 365)
            return '1d'; // 1y
        if (days > 90)
            return '2h'; // 3m
        if (days > 30)
            return '1h'; // 1m
        if (days > 7)
            return '15m'; // 1w
        return '5m';
    })();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const stats = await getHistorical(id, currency.name.toUpperCase(), days === PriceChartDaysControl["a" /* Days */].MAX ? constants["c" /* BTC_FIRST_LEGER_DATE */] : startDate, endDate, interval);
    if (stats.data.is_active === 0)
        return [];
    return Object.entries(stats.data).map(([date, x]) => [date, x[currency.name.toUpperCase()][0]]);
}

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/services.ts



/***/ })

}]);