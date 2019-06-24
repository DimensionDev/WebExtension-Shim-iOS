//
//  Tab+URLAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import Foundation
import ConsolePrint

extension Tab {

    open func URLCreateObjectURL(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.URL.CreateObjectURL, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(createObjectURL):
            guard let blobStorage = createObjectURL.blobStorage else {
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(.invalidParams)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
                return
            }

            let realm = RealmService.default.realm
            do {
                try realm.write {
                    realm.add(blobStorage, update: .all)
                }

                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .success(HoloflowsRPC.Response(result: blobStorage.url, id: id))
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)

            } catch {
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(.serverError)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
            }

        case let .failure(error):
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
