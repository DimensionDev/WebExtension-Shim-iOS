//
//  ScriptMessage+DownloadsDownload.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-19.
//

import Foundation

extension ScriptMessage {

    public struct DownloadsDownload: Decodable {
        public let options: WebExtensionAPI.DownloadOptions
    }
    
}
