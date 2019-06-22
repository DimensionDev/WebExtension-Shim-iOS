//
//  ScriptMessage+RuntimeGetURL.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-18.
//

import Foundation

extension ScriptMessage {

    public struct RuntimeGetURL: Decodable {
        public let url: String
    }

}
