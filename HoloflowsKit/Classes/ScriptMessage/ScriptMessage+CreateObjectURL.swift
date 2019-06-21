//
//  ScriptMessage+CreateObjectURL.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-18.
//

import Foundation

extension ScriptMessage {

    public struct CreateObjectURL: Decodable {
        public let prefix: String
        public let blob: String
        public let type: String

        public var blobData: Data? {
            return Data(base64Encoded: blob)
        }
    }

}

extension ScriptMessage.CreateObjectURL {

    var blobStorage: BlobStorage? {
        guard let blobData = self.blobData else {
            return nil
        }

        let blobStorage = BlobStorage()
        blobStorage.blob = blobData
        blobStorage.type = type
        blobStorage.url = "holoflows-blob://" + prefix + "/" + blobStorage.uuid

        return blobStorage
    }
    
}
