//
//  Tab+BrowserRuntimeAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-15.
//

import Foundation
import ConsolePrint
import SwiftyJSON

extension Tab {

    public func browserRuntimeGetManifest(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.RuntimeGetManifest, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case .success:
            let json = delegate
                .flatMap { Data($0.tab(self, requestManifest: ()).utf8) }
                .flatMap { JSON(rawValue: $0) } ?? JSON.null

            let result: Result<JSON, Error> = .success(json)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            
        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<Void, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
