//
//  Tab+BrowserStorageLocalAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-14.
//

import Foundation
import ConsolePrint
import SwiftyJSON
import RealmSwift

extension Tab {

    open func browserStorageLocalGet(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Storage.Local.Get, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(get):
            let keys = get.keyValues
            let realm = RealmService.default.realm
            let entires: [LocalStorage] = {
                let objects = realm.objects(LocalStorage.self)
                return keys.flatMap { keys in objects.filter { keys.contains($0.key) } } ?? objects.compactMap { $0 }
            }()

            let dict = entires.reduce(into: [String : JSON]()) { dict, localStorgae in
                dict[localStorgae.key] = JSON(stringLiteral: localStorgae.value)
            }

            let result: Result<HoloflowsRPC.Response<[String:JSON]>, RPC.Error> = .success(HoloflowsRPC.Response(result: dict, id: id))
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    open func browserStorageLocalSet(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Storage.Local.Set, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(set):
            let entries = set.entriesDict.map { (key, value) -> LocalStorage in
                let entry = LocalStorage()
                entry.key = key
                entry.value = value.rawString() ?? ""
                return entry
            }

            do {
                let realm = RealmService.default.realm
                realm.beginWrite()
                realm.add(entries, update: Realm.UpdatePolicy.all)
                try realm.commitWrite()

                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .success(HoloflowsRPC.Response(result: "", id: id))
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)

            } catch {
                consolePrint(error.localizedDescription)
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(RPC.Error.serverError)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
            }

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<Void, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    open func browserStorageLocalRemove(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Storage.Local.Remove, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(remove):
            let keys = remove.keyValues
            do {
                let realm = RealmService.default.realm
                let entries = realm.objects(LocalStorage.self)
                    .filter { keys.contains($0.key) }
                // get dict before delete
                let dict = entries.reduce(into: [String : JSON]()) { dict, localStorgae in
                    dict[localStorgae.key] = JSON(stringLiteral: localStorgae.value)
                }
                realm.beginWrite()
                realm.delete(entries)
                try realm.commitWrite()

                let result: Result<HoloflowsRPC.Response<[String:JSON]>, RPC.Error> = .success(HoloflowsRPC.Response(result: dict, id: id))
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)

            } catch {
                consolePrint(error.localizedDescription)
                let result: Result<HoloflowsRPC.Response<[String:JSON]>, RPC.Error> = .failure(RPC.Error.serverError)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
            }

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<[String:JSON]>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    open func browserStorageLocalClear(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.StorageLocalClear, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case .success:
            do {
                let realm = RealmService.default.realm
                let entries = realm.objects(LocalStorage.self)
                realm.beginWrite()
                // get dict before delete
                let dict = entries.reduce(into: [String : JSON]()) { dict, localStorgae in
                    dict[localStorgae.key] = JSON(stringLiteral: localStorgae.value)
                }
                realm.delete(entries)
                try realm.commitWrite()

                let result: Result<[String:JSON], Error> = .success(dict)
                ScriptMessage.dispatchEvent(webView: self.webView, eventName: id, result: result, completionHandler: Tab.completionHandler)

            } catch {
                consolePrint(error.localizedDescription)
                let result: Result<Void, Error> = .failure(error)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            }

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<Void, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}

