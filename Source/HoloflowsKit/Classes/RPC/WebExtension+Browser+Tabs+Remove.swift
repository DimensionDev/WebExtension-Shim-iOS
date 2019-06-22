//
//  WebExtension+Browser+Tabs+Remove.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension WebExtension.Browser.Tabs {

    public struct Remove: WebExtension.ClientRequest {
        public static let method: String = "browser.tabs.remove"

        public let extensionID: String
        public let tabId: Int

        public init(extensionID: String, tabId: Int) {
            self.extensionID = extensionID
            self.tabId = tabId
        }
    }

}
