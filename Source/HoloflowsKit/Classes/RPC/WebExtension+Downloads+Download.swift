//
//  WebExtension+Downloads+Download.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension WebExtension.Downloads {

    public struct Download: WebExtension.ClientRequest {
        public static let method: String = "browser.downloads.download"

        public let extensionID: String
        public let options: Options

        public struct Options: Codable {
            public let filename: String?
            public let url: String
        }
    }

}
