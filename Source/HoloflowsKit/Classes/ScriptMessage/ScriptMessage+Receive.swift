//
//  ScriptMessage+Receive.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-12.
//

import Foundation
import SwiftyJSON

extension ScriptMessage {

    public struct Receive: Encodable {
        public let messageID: String
        public let message: JSON
        public let sender: Tab
    }

}
