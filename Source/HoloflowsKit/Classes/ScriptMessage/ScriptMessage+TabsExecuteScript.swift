//
//  ScriptMessage+TabsExecuteScript.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-12.
//

import Foundation

extension ScriptMessage {

    public struct TabsExecuteScript: Decodable {
        public let tabId: Int?
        public let details: WebExtensionAPI.ExecuteScriptDetails
    }

}
