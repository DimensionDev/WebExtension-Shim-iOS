//
//  WebExtension+Browser+Tabs+ExecuteScript.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension WebExtension.Browser.Tabs {

    public struct ExecuteScript: WebExtension.ClientRequest {
        public static let method: String = "browser.tabs.executeScript"

        public let extensionID: String
        public let tabID: Int
        public let details: Details

        public struct Details: Codable {
            public let code: String?
            public let file: String?
            public let runAt: WebExtension.ExtensionTypes.RunAt?
        }

    }
}
