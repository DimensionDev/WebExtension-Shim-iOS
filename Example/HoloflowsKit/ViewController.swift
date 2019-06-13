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

    let browser = Browser.default

    lazy var webView: WKWebView = {
        let tab = browser.tabs.create(createProperties: WebExtensionAPI.CreateProperties(url: "https://m.facebook.com"))
        return tab.webView
    }()

}


extension ViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

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
        consolePrint("")
    }

}
