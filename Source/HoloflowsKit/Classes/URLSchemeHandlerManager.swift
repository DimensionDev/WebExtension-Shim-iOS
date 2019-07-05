//
//  URLSchemeHandlerManager.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-7-4.
//

import Foundation
import WebKit

public class URLSchemeHandlerManager {

    public let handlers: [String : WKURLSchemeHandler]

    public init(handlers: [String : WKURLSchemeHandler] = [:]) {
        var handlers = handlers

        let bundle = Bundle(for: Tab.self)
        if let bundleURL = bundle.resourceURL?.appendingPathComponent("WebExtensionScripts.bundle"),
        let scriptsBundle = Bundle(url: bundleURL) {
            handlers["holoflows-extension"] = ExtensionBundleResourceManager(bundle: scriptsBundle)
        }
        handlers["holoflows-blob"] = BlobResourceManager(realm: RealmService.default.realm)

        self.handlers = handlers
    }

    
}
