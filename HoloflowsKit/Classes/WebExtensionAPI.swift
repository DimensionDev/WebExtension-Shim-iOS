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

    public struct DownloadOptions: Codable {
        // public let body: String?
        // public let conflictAction: String?
        public let filename: String?
        // public let headers: [JSON]
        // public let incognito: Bool?
        // public let method: String?
        // public let saveAs: Bool?
        public let url: String
    }

    public struct DownloadItem: Codable {
        public let state: DownloadsState
    }

    public enum DownloadsState: String, Codable {
        case in_progress
        case interrupted
        case complete
    }

}


