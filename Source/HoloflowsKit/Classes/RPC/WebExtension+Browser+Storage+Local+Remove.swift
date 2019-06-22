//
//  WebExtension+Browser+Storage+Local+Remove.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation
import SwiftyJSON

extension WebExtension.Browser.Storage.Local {

    public struct Remove: WebExtension.ClientRequest {
        public static let method: String = "browser.storage.local.remove"

        public let extensionID: String
        public let key: JSON
    }
    
}

extension WebExtension.Browser.Storage.Local.Remove {
    public var keyValues: [String] {
        return key.array?.compactMap { $0.string } ?? [key.string].compactMap { $0 }
    }
}
