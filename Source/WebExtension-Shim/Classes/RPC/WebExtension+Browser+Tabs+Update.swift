//
//  WebExtension+Browser+Tabs+Update.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-7-15.
//

import Foundation
import SwiftyJSON

extension WebExtension.Browser.Tabs {

    public struct Update: WebExtension.ClientRequest {
        public static let method: String = "browser.tabs.update"

        public let extensionID: String
        public let tabId: Int
        public let updateProperties: UpdateProperties

        public init(extensionID: String, tabId: Int, updateProperties: UpdateProperties) {
            self.extensionID = extensionID
            self.tabId = tabId
            self.updateProperties = updateProperties
        }

        public struct UpdateProperties: Codable {
            public let url: String

            public init(url: String) {
                self.url = url
            }
        }
    }


}

extension WebExtension.Browser.Tabs.Update {

    public init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()

        extensionID = try container.decode(String.self)
        tabId = try container.decode(Int.self)
        updateProperties = try container.decode(UpdateProperties.self)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.unkeyedContainer()

        try container.encode(extensionID)
        try container.encode(tabId)
        try container.encode(updateProperties)
    }

}
