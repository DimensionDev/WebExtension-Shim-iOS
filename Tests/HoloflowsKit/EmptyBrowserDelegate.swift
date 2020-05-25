//
//  EmptyBrowserDelegate.swift
//  WebExtension-Shim-Unit-Tests
//
//  Created by Cirno MainasuK on 2020-5-25.
//

import Foundation
import WebExtension_Shim
import SwiftyJSON
import WebKit

final class EmptyBrowserDelegate: BrowserDelegate {
    
    func pluginResourceURLScheme() -> [String] {
        return []
    }
    
    func browser(_ browser: Browser, pluginForScriptType scriptType: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON.null, environment: scriptType, resources: JSON.null)
    }
    
    func browser(_ browser: Browser, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        return WKWebViewConfiguration()
    }
    
    func browser(_ browser: Browser, tabDelegateForTab tab: Tab) -> TabDelegate? {
        return nil
    }
    
    func browser(_ browser: Browser, tabDownloadDelegateFor tab: Tab) -> TabDownloadsDelegate? {
        return nil
    }    
    
}
