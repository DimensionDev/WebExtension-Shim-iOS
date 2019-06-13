//
//  ScriptMessage+Send.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-12.
//

import Foundation

extension ScriptMessage {

    public struct Send: Decodable {
        public let messageID: String
        public let tabID: Int?
        public let message: String
    }

}
