//
//  ExtensionBundleResourceManager.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-7-5.
//

import Foundation
import WebKit

open class ExtensionBundleResourceManager: BundleResourceManager {

    public static let backgroundPagePath = "holoflows-extension://8848e4a9-0bd6-4036-b292-5e37c91b211f/_generated_background_page.html"

    open override func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
        urlSchemeTask.didFailWithError(Error.urlNotFound)
            return
        }

        let fileExtension = url.pathExtension
        let filename = url.deletingPathExtension().lastPathComponent
        if filename == "_generated_background_page", fileExtension == "html", url.scheme == "holoflows-extension" {
            let data = "<body></body>".data(using: .utf8)!
            let returnResponse = URLResponse(
                url: url,
                mimeType: "text/html",
                expectedContentLength: data.count,
                textEncodingName: nil)

            urlSchemeTask.didReceive(returnResponse)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
            return
        }

        super.webView(webView, start: urlSchemeTask)
    }

}
