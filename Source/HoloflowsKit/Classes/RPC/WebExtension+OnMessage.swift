//
//  WebExtension+OnMessage.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation
import SwiftyJSON

extension WebExtension {

    public struct OnMessage: Encodable {
        public let extensionID: String
        public let toExtensionID: String
        public let messageID: String
        public let message: JSON
        public let sender: WebExtension.Browser.Runtime.MessageSender

        public init(extensionID: String, toExtensionID: String, messageID: String, message: JSON, sender: WebExtension.Browser.Runtime.MessageSender) {
            self.extensionID = extensionID
            self.toExtensionID = toExtensionID
            self.messageID = messageID
            self.message = message
            self.sender = sender
        }

        public init(fromMessageSender sender: WebExtension.Browser.Runtime.MessageSender, sendMessage: WebExtension.SendMessage) {
            self.extensionID = sendMessage.extensionID
            self.toExtensionID = sendMessage.toExtensionID
            self.messageID = sendMessage.messageID
            self.message = sendMessage.message
            self.sender = sender
        }
    }

}

extension WebExtension.Browser.Runtime {
    public struct MessageSender: Encodable {
        public let tab: Tab?
        public let id: String? 
        public let url: String?

        public init(tab: Tab?, id: String?, url: String?) {
            self.tab = tab
            self.id = id
            self.url = url
        }
    }
}
