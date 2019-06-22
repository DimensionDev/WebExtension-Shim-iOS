//
//  ScriptMessage+TabsCreate.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-11.
//

import Foundation

extension ScriptMessage {

    public struct TabsCreate: Decodable {
        public let createProperties: WebExtensionAPI.CreateProperties?
    }

}
