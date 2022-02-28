//
//  ViewController.swift
//  HoloflowsKit
//
//  Created by CMK on 06/10/2019.
//  Copyright (c) 2019 CMK. All rights reserved.
//

import UIKit
import WebExtension_Shim
import WebKit
import ConsolePrint
import SwiftyJSON

class ViewController: UIViewController {

    lazy var browser = Browser(delegate: self)

}

extension ViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        let tab = browser.tabs.create(options: WebExtension.Browser.Tabs.Create.Options(active: false, url: "https://www.apple.com"))
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

}

extension ViewController {

    override func motionBegan(_ motion: UIEventSubtype, with event: UIEvent?) {
        guard motion == .motionShake else {
            return
        }

        let alertController = UIAlertController(title: "Debug", message: nil, preferredStyle: .actionSheet)

        let printCookieAction = UIAlertAction(title: "Print Cookie", style: .default) { _ in

            self.browser.tabs.storage.forEach { tab in
                tab.webView.configuration.websiteDataStore.httpCookieStore.getAllCookies { (cookies) in
                    consolePrint(cookies)
                }
            }
        }
        alertController.addAction(printCookieAction)

        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
        alertController.addAction(cancelAction)

        present(alertController, animated: true, completion: nil)
    }

}

extension ViewController: BrowserDelegate {
    func browser(_ browser: Browser, tabDelegateForTab tab: Tab?) -> TabDelegate? {
        return self
    }
    
    func browser(_ browser: Browser, tabDownloadDelegateFor tab: Tab?) -> TabDownloadsDelegate? {
        return self
    }
    
    func pluginResourceURLScheme() -> [String] {
        return ["webextension"]
    }
    
    func browser(_ browser: Browser, pluginForScriptType scriptType: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON(), environment: scriptType, resources: JSON(), externalURIs: [], universalLinks: [])
    }
    
    func browser(_ browser: Browser, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        return WKWebViewConfiguration()
    }
}

extension ViewController: TabDelegate {
    
    func uiDelegateShim(for tab: Tab) -> WKUIDelegateShim? {
        return nil
    }
    
    func navigationDelegateShim(for tab: Tab) -> WKNavigationDelegateShim? {
        return nil
    }
    
}

extension ViewController: TabDownloadsDelegate {
    
    
}
