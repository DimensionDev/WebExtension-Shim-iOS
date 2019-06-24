//
//  WebExtension+Browser+WebNavigation+OnCommitted.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension WebExtension.Browser.WebNavigation {

    public struct OnCommitted: Encodable {
        public let toExtensionID: String
        public let tab: Navigation

        public struct Navigation: Encodable {
            public let tabId: Int
            public let url: String
        }
    }
    
}
