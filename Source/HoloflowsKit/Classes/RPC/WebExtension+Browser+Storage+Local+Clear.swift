//
//  WebExtension+Browser+Storage+Local+Clear.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension WebExtension.Browser.Storage.Local {

    public struct Clear: WebExtension.ClientRequest {
        public static let method: String = "browser.storage.local.clear"

        public let extensionID: String
    }
    
}
