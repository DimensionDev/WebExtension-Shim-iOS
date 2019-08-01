# WebExtension-Shim Documents

WebExtension-Shim (iOS) is the bridge between your web extension and iOS WKWebView. This document is describe how to setup the environment to drive your extension. In that scenario we use *Plugin* to describe the extension. 

To learn more informations about how to write plugin script with WebExtension-Shim. Please check the [webextension-shim](https://github.com/SujiTech/webextension-shim) repo. And refer the real world plugin [Maskbook](https://github.com/DimensionDev/Maskbook) function in app [Maskbook-iOS](https://github.com/SujiTech/Maskbook-iOS).

## Setup

### Create Tab
```swift
import WebExtension_Shim

final class ViewController: UIViewController {

    lazy var browser = Browser(core: self)
    var tab: Tab?
}

extension ViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        let options = WebExtension.Browser.Tabs.Create.Options(active: true, url: "https://example.org")
        tab = browser.tabs.create(options: options)
    }
}
```

`Browser` hold the **weak** reference to the instance which conforms `BrowserCore` protocol. In commom usage you want to keep one `Browser` instance in entire app lifetime. For example create one singleton manager class to keep the controller reference and make sure the `BrowserCore` and `Browser` instance not deinit before it's should be.


### Active Tab
```swift
extension ViewController: BrowserCore {
    
    func tab(_ tab: Tab, shouldActive: Bool) {
        guard shouldActive else { return }

        let webView = tab.webView
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.layoutMarginsGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    // …
}
```

### Inject Plugin
```swift
import SwiftyJSON
    // …
    // in ViewController: BrowserCore
    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin {
        return Plugin(id: yourPluginID,                 // String
                      manifest: yourPluginManifest,     // JSON
                      environment: type,                // .contentScript or .backgroundScript
                      resources: yourPluginResources)   // JSON
    }
```

The **background script** and **content Script** plugins will be injected to WKWebView when tab created. You should assemble your plugin for the specifc script type. 

The background script is always available when browser alive as your plugin context. The content script is as long as the tab lifetime. The communication between background script and content script is via `sendMessage` interface which provided by WebExtension-Shim.

### Access Resource
```swift
    // …
    // in ViewController: BrowserCore
    func tab(_ tab: Tab, pluginResourceProviderForURL url: URL) -> PluginResourceProvider? {
        switch url.scheme {
        case "holoflows-extension": return bundleResourceManager
        case "holoflows-blob":      return blobResourceManager
        default:                    return nil
        }
    }
```

The WebExtension-Shim register two scheme to handler plugin resource. "holoflows-extension" for plugin bundle resource access. "holoflows-blob" for plugin blob data store. The `BundleResourceManager` and `BlobResourceManager` are two tool classes which comform `PluginResourceProvider` protocol. For more detail info please check `PluginResourceProvider` protocol.


## Advance

### Custom URL Scheme
```swift
    // …
    // in ViewController: BrowserCore
    func pluginResourceURLScheme() -> [String] {
        return ["my-plugin-scheme"]
    }
```

Register custom scheme for resource and use your resource provider later to consume your plugin request. Only return the custom schemes and the "holoflows-extension" and "holoflows-blob" scheme are registered default.


### Customize WKWebView
```swift
    // …
    // in ViewController: BrowserCore
    func uiDelegate(for tab: Tab) -> WKUIDelegate? {
        return uiDelegate
    }
    
    func navigationDelegate(for tab: Tab) -> WKNavigationDelegate? {
        return navigationDelegate
    }
    
    func tabs(_ tabs: Tabs, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        …
        return configuration
    }
```

### Downloads handler
```swift
    func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options) {
        // …
    }
    
    func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<(Data, URLResponse), Error>) {
        // …
    } 
```

Script could set blob and call download API to run specific task likes export files or datas.