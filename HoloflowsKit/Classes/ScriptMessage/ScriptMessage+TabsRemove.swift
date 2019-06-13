//
//  ScriptMessage+TabsRemove.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-11.
//

import Foundation

extension ScriptMessage {

    // MARK: - TabsRemove
    public struct TabsRemove: Decodable {
        public let tabID: TabID

        enum CodingKeys: String, CodingKey {
            case tabID = "tabIds"
        }
    }

    public enum TabID: Codable {
        case integer(Int)
        case integerArray([Int])

        public init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if let x = try? container.decode(Int.self) {
                self = .integer(x)
                return
            }
            if let x = try? container.decode([Int].self) {
                self = .integerArray(x)
                return
            }
            throw DecodingError.typeMismatch(TabID.self, DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Wrong type for TabID"))
        }

        public func encode(to encoder: Encoder) throws {
            var container = encoder.singleValueContainer()
            switch self {
            case .integer(let x):
                try container.encode(x)
            case .integerArray(let x):
                try container.encode(x)
            }
        }
    }


}
