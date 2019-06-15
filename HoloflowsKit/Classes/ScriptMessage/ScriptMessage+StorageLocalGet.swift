//
//  ScriptMessage+StorageLocalGet.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-15.
//

import Foundation
import SwiftyJSON

extension ScriptMessage {

    public struct StorageLocalGet: Decodable {
        public let keys: JSON
    }

}
