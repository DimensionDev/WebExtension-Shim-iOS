//
//  WebExtension+Browser+Storage+Local+GetBytesInUse.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation
import SwiftyJSON

extension WebExtension.Browser.Storage.Local {

    public struct GetBytesInUse: WebExtension.ClientRequest {
        public static let method: String = "browser.storage.local.getBytesInUse"

        public let extensionID: String
        public let key: JSON

        public init(extensionID: String, keys: [String]?) {
            self.extensionID = extensionID
            self.key = (keys.flatMap { JSON($0) }) ?? JSON.null
        }
    }

}

extension WebExtension.Browser.Storage.Local.GetBytesInUse {

    public init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()

        extensionID = try container.decode(String.self)
        key = try container.decode(JSON.self)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.unkeyedContainer()

        try container.encode(extensionID)
        try container.encode(key)
    }

}

extension WebExtension.Browser.Storage.Local.GetBytesInUse {
    public var keyValues: [String]? {
        let array = key.array?.compactMap { $0.string } ?? [key.string].compactMap { $0 }
        guard !array.isEmpty else {
            return nil
        }

        return array
    }
}
