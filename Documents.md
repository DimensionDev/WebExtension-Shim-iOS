# HoloflowsKit-iOS Documents

Limited implement for [browser extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs) of WKWebView

All definition is in JSON format

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

# API Definition

Post message to native:

```javascript
window.webkit.messageHandlers[send].postMessage(JSON.stringify({ messageID, tabID, message }));
```

Navtive dispatch callback event with payload:

```javascript
document.dispatchEvent(new CustomEvent(eventName, { detail: payload }))
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
message | "Message Content" | String |

[Listen] `receive`:

 key | value | type | note 
---- | ----- | ---- | ---- 
messageID | "0.9m5am9ed4tq" | String |
message | "Message Content" | String |
sender | { id: 42 } | Tab |

## browserTabsCreate
Script post message and listen event on `id`.

[POST] `browserTabsCreate`:

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
createProperties | { url: "https://example.com" } | CreateProperties | 

### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | { id: 42 } | Tab | Tab as payload  

## browserTabsRemove
[POST] browserTabsRemove:

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
tabIds | 42 \| [42, 43] | Int \| [Int] |

### Callback payload: 
 key | value | type | note 
---- | ----- | ---- | ---- 
&nbsp; | undefined | undefined | undefined as payload 


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


## browserStorageLocalSet
[POST] browserStorageLocalSet

 key | value | type | note 
---- | ----- | ---- | ----
messageID | "0.ptdck9eme9" | String | callback message ID
keys  | { kitten: { name:"Moggy", tentacles: false, eyeCount: 2} }<br/> or<br/>{ kitten: { name:"Moggy", tentacles: false, eyeCount: 2}, <br/>monster: { name: "Kraken", tentacles: true, eyeCount: 10 } } | Object | any object composed by primitive type <br/> Object will be parse as [String: JSON] dictionary

## browserStorageLocalGet
[POST] browserStorageLocalGet

 key | value | type | note 
---- | ----- | ---- | ----

