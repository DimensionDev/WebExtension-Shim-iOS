//
//  BundleResourceManager.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-17.
//

import Foundation
import WebKit
import ConsolePrint

// TODO: add support for multiple extension with different extensionID
// bundle -> [extensionID: bundle]

/// Resolve bundle resource when app request custom scheme
/// - warning: be careful to set bundle which may leak the app secret
open class BundleResourceManager: NSObject {

    public let bundle: Bundle

    public init(bundle: Bundle) {
        self.bundle = bundle
    }

    public enum Error: Swift.Error {
        case urlNotFound
        case fileNotFound
    }

}

extension BundleResourceManager {

    open func data(with url: URL, handler: @escaping (Result<(Data, URLResponse), Swift.Error>) -> Void) {
        let fileExtension = url.pathExtension
        let filename = url.deletingPathExtension().lastPathComponent

        guard let path = bundle.path(forResource: filename, ofType: fileExtension) else {
            handler(.failure(Error.fileNotFound))
            return
        }
        consolePrint(path)

        URLSession.shared.dataTask(with: URL(fileURLWithPath: path)) { data, response, error in
            if let error = error {
                handler(.failure(error))
                return
            }

            guard let data = data, let response = response else {
                handler(.failure(Error.fileNotFound))
                return
            }

            handler(.success((data, response)))
        }.resume()
    }

    open func bundle(for extensionID: String) -> Bundle? {
        // TODO: get bundle for specific extension
        return bundle
    }

}

// MARK: - WKURLSchemeHandler
extension BundleResourceManager: WKURLSchemeHandler {

    open func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(Error.urlNotFound)
            return
        }

        data(with: url) { result in
            switch result {
            case .success(let (data, response)):
                let returnResponse = URLResponse(
                    url: url,
                    mimeType: response.mimeType ?? "",
                    expectedContentLength: data.count,
                    textEncodingName: nil)

                urlSchemeTask.didReceive(returnResponse)
                urlSchemeTask.didReceive(data)
                urlSchemeTask.didFinish()

                consolePrint("urlSchemeTask.didFinish()")

            case .failure(let error):
                urlSchemeTask.didFailWithError(error)
            }
        }
    }

    open func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // do nothing
    }

}
