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
        /// Base64 encoded data
        public let blob: String
        /// MIME type "image/png"
        public let type: String
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
        blobStorage.blob = blobData
        blobStorage.type = type
        blobStorage.url = "holoflows-kit://" + extensionID + "/" + blobStorage.uuid

        return blobStorage
    }

}
