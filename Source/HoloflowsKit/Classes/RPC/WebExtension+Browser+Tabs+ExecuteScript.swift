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
        public let tabID: Int?
        public let details: Details

        public struct Details: Codable {
            public let code: String?
            public let file: String?
            public let runAt: WebExtension.ExtensionTypes.RunAt?

            public init(code: String?, file: String?, runAt: WebExtension.ExtensionTypes.RunAt?) {
                self.code = code
                self.file = file
                self.runAt = runAt
            }
        }

        public init(extensionID: String, tabID: Int?, details: Details) {
            self.extensionID = extensionID
            self.tabID = tabID
            self.details = details
        }
    }

}
