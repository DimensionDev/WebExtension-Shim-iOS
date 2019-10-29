//
//  ExampleBrowserCore.swift
//  HoloflowsKit_Example
//
//  Created by Cirno MainasuK on 2019-7-9.
//  Copyright © 2019 CocoaPods. All rights reserved.
//

import Foundation
import WebKit

import WebExtension_Shim
import SwiftyJSON

class ExampleBrowserCore: BrowserCore {

}

// MARK: - TabsDelegate
extension ExampleBrowserCore {

    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON(parseJSON: "{}"), environment: type, resources: JSON(parseJSON: ""))
    }

}

// MARK: - TabDelegate
extension ExampleBrowserCore {

    func tab(_ tab: Tab, localStorageManagerForTab: Tab) -> LocalStorageManager {
        return LocalStorageManager(realm: RealmService.default.realm)
    }

}

// MARK: - TabDownloadsDelegate
extension ExampleBrowserCore {

    func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options) {
        // do nothing
    }

    func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<BlobStorage, Error>) {
        // do nothing
    }

}
