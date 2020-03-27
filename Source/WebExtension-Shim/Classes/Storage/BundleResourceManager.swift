//
//  BundleResourceManager.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-17.
//

import Foundation
import WebKit
import ConsolePrint

public class BundleResourceManager: NSObject, PluginResourceProvider {

    public let bundle: Bundle

    public init(bundle: Bundle) {
        self.bundle = bundle
    }

    public enum Error: Swift.Error {
        case fileNotFound
    }

}

extension BundleResourceManager {

    public func data(from url: URL, handler: @escaping (Result<(Data, URLResponse), Swift.Error>) -> Void) {
        let pathComponents: [String] = {
            var components = url.pathComponents
            if components.first == "/" {
                components.removeFirst()
            }
            return components
        }()
        let urlComponents = URLComponents(string: pathComponents.joined(separator: "/"))
        guard let filePath = urlComponents?.path,
            let path = bundle.url(forResource: filePath, withExtension: nil)?.path else {
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

            let schemeTaskResponse = URLResponse(url: url,
                                                 mimeType: response.mimeType ?? "",
                                                 expectedContentLength: data.count,
                                                 textEncodingName: nil)
            handler(.success((data, schemeTaskResponse)))
        }.resume()
    }

}
