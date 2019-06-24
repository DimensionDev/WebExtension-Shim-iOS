//
//  WebExtensionSendMessage.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation
import SwiftyJSON

extension WebExtension {

    public struct SendMessage: WebExtension.ClientRequest {
        public static let method: String = "sendMessage"

        public let extensionID: String
        public let toExtensionID: String
        public let tabId: Int?
        public let messageID: String
        public let message: JSON
    }

}
