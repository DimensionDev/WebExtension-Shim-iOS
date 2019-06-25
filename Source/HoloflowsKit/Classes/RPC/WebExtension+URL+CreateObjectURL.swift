//
//  WebExtension+URL+CreateObjectURL.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension WebExtension.URL {

    public struct CreateObjectURL: WebExtension.ClientRequest {
        public static let method: String = "URL.createObjectURL"

        public let extensionID: String
        public let uuid: String
        /// Base64 encoded data
        public let blob: String
        /// MIME type "image/png"
        public let type: String

        public init(extensionID: String, uuid: String, blob: String, type: String) {
            self.extensionID = extensionID
            self.uuid = uuid
            self.blob = blob
            self.type = type
        }
    }
    
}

extension WebExtension.URL.CreateObjectURL {

    public var blobData: Data? {
        return Data(base64Encoded: blob)
    }

    public var blobStorage: BlobStorage? {
        guard let blobData = self.blobData else {
            return nil
        }

        let blobStorage = BlobStorage()
        blobStorage.uuid = uuid
        blobStorage.blob = blobData
        blobStorage.type = type
        blobStorage.url = "holoflows-blob://" + extensionID + "/" + blobStorage.uuid

        return blobStorage
    }

}
