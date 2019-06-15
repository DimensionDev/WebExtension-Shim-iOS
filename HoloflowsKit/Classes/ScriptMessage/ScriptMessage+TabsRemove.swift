//
//  ScriptMessage+TabsRemove.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-11.
//

import Foundation
import SwiftyJSON

extension ScriptMessage {

    // MARK: - TabsRemove
    public struct TabsRemove: Decodable {
        public let tabIds: JSON

        public var ids: [Int] {
            return tabIds.array?.compactMap { $0.int } ?? [tabIds.int].compactMap { $0 }
        }
    }

}
