//
//  BlobResourceManager.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-18.
//

import Foundation
import WebKit
import RealmSwift
import ConsolePrint

open class BlobResourceManager: NSObject, PluginResourceProvider {

    public let realm: Realm

    public init(realm: Realm) {
        self.realm = realm
    }

    public enum Error: Swift.Error {
        case urlNotFound
        case notValidURL
        case blobNotFound
    }

}

extension BlobResourceManager {

    public func data(from url: URL, handler: @escaping (Result<(Data, URLResponse), Swift.Error>) -> Void) {
        let _ = url.pathExtension
        let uuid = url.deletingPathExtension().lastPathComponent

        guard let blobStorage = realm.object(ofType: BlobStorage.self, forPrimaryKey: uuid) else {
            handler(.failure(Error.blobNotFound))
            return
        }

        let data = blobStorage.blob
        let response = URLResponse(url: url,
                                   mimeType: blobStorage.type,
                                   expectedContentLength: data.count,
                                   textEncodingName: nil)
        let result = Result<(Data, URLResponse), Swift.Error>.success((data, response))
        handler(result)
    }

}
