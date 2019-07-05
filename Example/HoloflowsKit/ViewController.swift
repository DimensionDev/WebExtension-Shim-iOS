//
//  ViewController.swift
//  HoloflowsKit
//
//  Created by CMK on 06/10/2019.
//  Copyright (c) 2019 CMK. All rights reserved.
//

import UIKit
import HoloflowsKit
import WebKit
import ConsolePrint

class ViewController: UIViewController {

    let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: ViewController.self))
    lazy var browser: Browser = {
        let browser = Browser.default
        return browser
    }()

}

extension ViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        let extensionTab = browser.tabs.create(options: WebExtension.Browser.Tabs.Create.Options(active: false, url: ExtensionBundleResourceManager.backgroundPagePath))

//        let extensionTab = browser.tabs.create(options: WebExtension.Browser.Tabs.Create.Options(active: false, url: "https://www.apple.com"))

//        let tab = browser.tabs.create(options: WebExtension.Browser.Tabs.Create.Options(active: false, url: "https://m.facebook.com"))
        let tab = browser.tabs.create(options: WebExtension.Browser.Tabs.Create.Options(active: false, url: "https://m.facebook.com"))
        let webView = tab.webView

        tab.uiDelegate = self
        tab.navigationDelegate = self

        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.layoutMarginsGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

}

extension ViewController: WKUIDelegate {

}

extension ViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        consolePrint(navigation)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let url = navigationAction.request.url
        consolePrint(url)

        decisionHandler(.allow)
    }

}
