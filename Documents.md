# HoloflowsKit-iOS Documents

Limited implement for [browser extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs) of WKWebView

All definition is in JSON format

Script implement [here](./HoloflowsKit/WebExtensionScripts/webExtension.js)

# Object Definition
## Tab
 key | value | type | note 
---- | ----- | ---- | ---- 
id | 42 | Int | 

## CreateProperties
 key | value | type | note 
---- | ----- | ---- | ---- 
url | "https://example.com | String | 

## NavigationDetails
 key | value | type | note 
---- | ----- | ---- | ---- 
tabId | 42 | Int |
url | "https://example.com" | String |

## ExecuteScriptDetails
 key | value | type | note 
---- | ----- | ---- | ---- 
code | "console.log('location', window.location.href);" | String | **Warning**: Don’t use this property to interpolate untrusted data into JavaScript, as this could lead to a security issue.

## DownloadOptions
 key | value | type | note 
---- | ----- | ---- | ---- 
filename | "lena.png" | String | 
url | "holoflows-blob://prefix/A5A3C1D1-ABE4-45DF-96D5-5625369F49F7" | String | The URL from `createObjectURL`

## DownloadItem
 key | value | type | note 
---- | ----- | ---- | ---- 
state | "complete" | String | 

# API Definition

Post message to native:

```javascript
window.webkit.messageHandlers[send].postMessage(JSON.stringify({ messageID, tabID, message }));
```

Navtive dispatch callback event with payload:

```javascript
document.dispatchEvent(new CustomEvent(eventName, { detail: payload }))
```

HoloflowsKit script:

```javascript
browser.tabsCreate({ createProperties: { url: "https://www.apple.com" } }).then(val => {
    console.log(val.id);
});

```

## send & receive
Script use `send` message pass message to specific tab or all other tabs.  
No callback return after native recieve message.    
Script should listen event on `reciveve` and response to sender via `send`.

[POST] `send`:

 key | value | type | note 
---- | ----- | ---- | ---- 
messageID | "0.9m5am9ed4tq" | String | 
tabID | 42 | Int | optional
message | "Message Content" | JSON | any JSON content

```javascript
browser.send({ tabID: 1, message: { key:"value" } });
```

[Listen] `receive`:

 key | value | type | note 
---- | ----- | ---- | ---- 
messageID | "0.9m5am9ed4tq" | String |
message | "Message Content" | JSON | JSON content from sender
sender | { id: 42 } | Tab |

## createObjectURL
[post] createObjectURL

 key | value | type | note 
---- | ----- | ---- | ---- 
prefix | "prefix" | String |
blob | "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAC…" | String | Base64 encoded data
type | "image/png" | String | MIME type

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | { url: "holoflows-blob://prefix/A5A3C1D1-ABE4-45DF-96D5-5625369F49F7" } | String | URL to retrieve blob data.

#### Example
```javascript
browser.createObjectURL({
    prefix: 'prefix',
    blob: base64EncodedPNG,
    type: 'image/png'
});
```

#### Note
```html
<!-- file extension like .png is acceptable -->
<img src="holoflows-blob://prefix/A5A3C1D1-ABE4-45DF-96D5-5625369F49F7.png" />
```

## browserTabsCreate
Script post message and listen event on `id`.

[POST] `browserTabsCreate`:

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
createProperties | { url: "https://example.com" } | CreateProperties | 

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | { id: 42 } | Tab | Tab as payload

#### Example
```javascript
browser.tabsCreate({ createProperties: { url: "https://www.apple.com" } });
```

## browserTabsRemove
[POST] browserTabsRemove:

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
tabIds | 42 \| [42, 43] | Int \| [Int] |

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | undefined | undefined | undefined as payload 

#### Example
```javascript
browser.tabsRemove({ tabIds: 1 });
```

## webNavigationOnCommitted
[Listen] webNavigationOnCommitted:

 key | value | type | note 
---- | ----- | ---- | ----
&nbsp; | { tabId: 42, url: "https://example.com" } | NavigationDetails | NavigationDetails as payload 

## browserTabsExecuteScript
[POST] browserTabsExecuteScript

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
tabId | 42 | Int | optional. default 0
details | { code: "console.log('location', window.location.href);" } | ExecuteScriptDetails |

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | 1 | JSON | return eval result if available in JSON otherwise return `undefine`

#### Example
```javascript
browser.tabsExecuteScript({
    tabId: 0,
    details: {
        code: "var result = plus(50 * 8, 2);"
    }
});
```

## browserStorageLocalSet
[POST] browserStorageLocalSet

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
keys  | { kitten: { name:"Moggy", tentacles: false, eyeCount: 2} }<br/> or<br/>{ kitten: { name:"Moggy", tentacles: false, eyeCount: 2}, <br/>monster: { name: "Kraken", tentacles: true, eyeCount: 10 } } | Object | any object composed by primitive type <br/> Object will be parse as [String: JSON] dictionary <br/>And the JSON will be store in native database for latter retrieve

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | undefined | undefined  | return undefined when success set

#### Example
```javascript
browser.storageLocalSet({ keys: { 
        kitten: { name:"Moggy", tentacles: false, eyeCount: 2}, 
        monster: { name: "Kraken", tentacles: true, eyeCount: 10 } 
    }
});
```

## browserStorageLocalGet
[POST] browserStorageLocalGet

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
keys | "kitten" <br/>or<br/>["kitten", "monster"] | String \| [String] | key or array of keys

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | { kitten: { name:"Moggy", tentacles: false, eyeCount: 2} }<br/> or<br/>{ kitten: { name:"Moggy", tentacles: false, eyeCount: 2}, <br/>monster: { name: "Kraken", tentacles: true, eyeCount: 10 }  | Object  | return Object hold keys and values

#### Example
```javascript
browser.storageLocalGet({ keys: ['kitten', 'monster'] }); 
```

## browserStorageLocalRemove
[POST] browserStorageLocalRemove

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
keys | "kitten" <br/>or<br/>["kitten", "monster"] | String \| [String] | key or array of keys

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | { kitten: { name:"Moggy", tentacles: false, eyeCount: 2} }<br/> or<br/>{ kitten: { name:"Moggy", tentacles: false, eyeCount: 2}, <br/>monster: { name: "Kraken", tentacles: true, eyeCount: 10 }  | Object  | return removed Object dict

#### Example
```javascript
browser.storageLocalRemove({ keys: ['kitten', 'monster'] }); 
```

## browserStorageLocalClear
[POST] browserStorageLocalClear

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | { kitten: { name:"Moggy", tentacles: false, eyeCount: 2}, <br/>monster: { name: "Kraken", tentacles: true, eyeCount: 10 }  | Object  | return removed Object dict

#### Example
```javascript
browser.storageLocalRemove(); 
```


## browserRuntimeGetManifest
[POST] browserRuntimeGetManifest

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID

#### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | { "$schema": "http://json.schemastore.org/chrome-manifest", … }  | JSON  | manifest JSON

#### Example
```javascript
browser.getManifest();
```
## browserRuntimeGetURL
[POST] browserRuntimeGetURL

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
url | "/index.html" | String | 

#### Callback payload:

 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | "holoflows-extension://*BundleName*/index.html"  | JSON  | BundleName specific by bundle your pass to BundleResourceManager

#### Example
```javascript
browser.getURL({ url: '/index.html' });
```

## browserDownloadsDownload
[POST] browserDownloadsDownload

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
options | {"filename":"lena.png","url":"holoflows-blob://download/E25CA729-67A7-4508-AF1E-611F27ADB823"} | DownloadOptions |  

#### Callback payload:

 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | {"state":"complete"}  | DownloadItem  | 

#### Example
```javascript
browser.createObjectURL({
    prefix: 'download',
    blob: base64EncodedPNG,
    type: 'image/png'
});
```