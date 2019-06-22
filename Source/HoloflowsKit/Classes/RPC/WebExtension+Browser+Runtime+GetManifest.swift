//
//  WebExtension+Browser+Runtime+GetManifest.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension WebExtension.Browser.Runtime {

    public struct GetManifest: WebExtension.ClientRequest {
        public static let method: String = "browser.runtime.getManifest"

        public let extensionID: String
    }

}
