//
//  ScriptMessage+Echo.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-11.
//

import Foundation
import SwiftyJSON

public struct ScriptMessage {

    public struct Echo: Codable {
        public let payload: JSON
    }

}
