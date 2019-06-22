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
