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

open class BlobResourceManager: NSObject {

    public override init() {
        super.init()
    }


    public enum Error: Swift.Error {
        case urlNotFound
        case notValidURL
        case blobNotFound
    }

}

extension BlobResourceManager {

    open func data(with urlString: String, handler: @escaping (Result<BlobStorage, Swift.Error>) -> Void) {
        guard let url = URL(string: urlString) else {
            handler(.failure(Error.notValidURL))
            return
        }

        data(with: url, handler: handler)
    }

    open func data(with url: URL, handler: @escaping (Result<BlobStorage, Swift.Error>) -> Void) {
        let _ = url.pathExtension
        let uuid = url.deletingPathExtension().lastPathComponent

        let realm = RealmService.default.realm
        guard let blobStorage = realm.object(ofType: BlobStorage.self, forPrimaryKey: uuid) else {
            handler(.failure(Error.blobNotFound))
            return
        }

        handler(.success(blobStorage))
    }

}

// MARK: - WKURLSchemeHandler
extension BlobResourceManager: WKURLSchemeHandler {

    public func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(Error.urlNotFound)
            return
        }

        data(with: url) { result in
            switch result {
            case let .success(blobStorage):
                let data = blobStorage.blob
                let response = URLResponse(url: url,
                                           mimeType: blobStorage.type,
                                           expectedContentLength: data.count,
                                           textEncodingName: nil)
                urlSchemeTask.didReceive(response)
                urlSchemeTask.didReceive(data)
                urlSchemeTask.didFinish()
                consolePrint("urlSchemeTask.didFinish() with blob \(blobStorage)")

            case let .failure(error):
                urlSchemeTask.didFailWithError(error)
            }
        }   // end data(with:)
    }

    public func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // do nothing
    }

}
