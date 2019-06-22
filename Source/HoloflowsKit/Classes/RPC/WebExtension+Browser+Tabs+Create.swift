//
//  WebExtension+Browser+Tabs+Create.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension WebExtension.Browser.Tabs {

    public struct Create: WebExtension.ClientRequest {
        public static let method: String = "browser.tabs.create"

        public let extensionID: String
        public let options: Options

        public init(extensionID: String, options: Options) {
            self.extensionID = extensionID
            self.options = options
        }

        public struct Options: Codable {
            public let active: Bool?
            public let url: String?

            public init(active: Bool? = nil, url: String? = nil) {
                self.active = active
                self.url = url
            }
        }
    }

}
