//
//  WebExtensionAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-11.
//

import Foundation

public struct WebExtensionAPI {

    public struct CreateProperties: Codable {
        let url: String?

        public init(url: String? = nil) {
            self.url = url
        }
    }

    public struct NavigationDetails: Codable {
        public let tabId: Int
        public let url: String
        // public let processId: Int
        // public let frameId: Int
        // public let parentFrame: Int
        // public let timeStamp: Int
        // public let transitionType: TransitionType
        // public transitionQualifiers: [TransitionQualifier]
    }

    public struct ExecuteScriptDetails: Codable {
        public let code: String
    }

}
