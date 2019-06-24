//
//  WebExtension+Browser+Storage+Local+Set.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation
import SwiftyJSON

extension WebExtension.Browser.Storage.Local {

    public struct Set: WebExtension.ClientRequest {
        public static let method: String = "browser.storage.local.set"

        public let extensionID: String
        // { object: { key: value } }
        // or
        // { object: { key: value, key2: value2, … }
        public let object: JSON

        public init(extensionID: String, object: JSON) {
            self.extensionID = extensionID
            self.object = object
        }
    }

}

extension WebExtension.Browser.Storage.Local.Set {

    public var entriesDict: [String : JSON] {
        return object.dictionaryValue
    }
    
}
