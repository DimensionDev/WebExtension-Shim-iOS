//
//  URLSchemeHandlerManager.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-7-4.
//

import Foundation
import WebKit

public class URLSchemeHandlerManager {

    // scheme : URLSchemeHander
    public let handlerDict: [String : URLSchemeHander]

    public init(handlers: [URLSchemeHander] = []) {
        var handlerDict: [String : URLSchemeHander] = [:]
        for handler in handlers {
            handlerDict[handler.scheme] = handler
        }

        // Setup holoflows scheme handler
        let bundle = Bundle(for: Tab.self)
        if let bundleURL = bundle.resourceURL?.appendingPathComponent("WebExtensionScripts.bundle"),
        let scriptsBundle = Bundle(url: bundleURL) {
            let extensionScheme = "holoflows-extension"
            let extensionURLSchemeHander = URLSchemeHander(scheme: extensionScheme, extensionID: "eofkdgkhfoebecmamljfaepckoecjhib", urlSchemeHandler: ExtensionBundleResourceManager(bundle: scriptsBundle))
            handlerDict[extensionScheme] = extensionURLSchemeHander
        }
        let extensionBlobScheme = "holoflows-blob"
        handlerDict[extensionBlobScheme] = URLSchemeHander(scheme: extensionBlobScheme, extensionID: "eofkdgkhfoebecmamljfaepckoecjhib", urlSchemeHandler: BlobResourceManager(realm: RealmService.default.realm))

        self.handlerDict = handlerDict
    }

}

extension URLSchemeHandlerManager {

    public struct URLSchemeHander {
        public let scheme: String
        public let extensionID: String
        public let urlSchemeHandler: WKURLSchemeHandler

        public init (scheme: String, extensionID: String, urlSchemeHandler: WKURLSchemeHandler) {
            self.scheme = scheme
            self.extensionID = extensionID
            self.urlSchemeHandler = urlSchemeHandler
        }
    }

}
