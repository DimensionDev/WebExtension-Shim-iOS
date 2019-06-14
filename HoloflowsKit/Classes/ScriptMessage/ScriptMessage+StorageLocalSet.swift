//
//  ScriptMessage+StorageLocalSet.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-14.
//

import Foundation
import SwiftyJSON

extension ScriptMessage {

    public struct StorageLocalSet: Decodable {
        public let keys: JSON
    }

}
