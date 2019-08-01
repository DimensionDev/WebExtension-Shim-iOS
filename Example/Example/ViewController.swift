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

class ViewController: UIViewController {

    lazy var browser = Browser(core: ExampleBrowserCore())

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
