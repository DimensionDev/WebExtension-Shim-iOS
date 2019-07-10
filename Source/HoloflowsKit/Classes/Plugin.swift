//
//  Plugin.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-7-9.
//

import Foundation
import SwiftyJSON

public struct Plugin {
    public let id: String
    public let manifest: JSON
    public let environment: ScriptType
    public let resources: JSON

    public enum ScriptType: String {
        case backgroundScript = "background script"
        case contentScript = "content script"
    }

    public init(id: String, manifest: JSON, environment: ScriptType, resources: JSON) {
        self.id = id
        self.manifest = manifest
        self.environment = environment
        self.resources = resources
    }
}
