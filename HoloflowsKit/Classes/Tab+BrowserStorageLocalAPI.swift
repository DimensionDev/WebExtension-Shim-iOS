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

    open func browserStorageLocalGet(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.StorageLocalGet, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(storageLocalGet):
            // { keys: key }
            // or
            // { keys: key1, key2, … }
            let keys = storageLocalGet.keys.array?.compactMap { $0.string } ?? [storageLocalGet.keys.string].compactMap { $0 }
            do {
                let realm = RealmService.default.realm
                let entires = realm.objects(LocalStorage.self)
                    .filter { keys.contains($0.key) }

                let dict = entires.reduce(into: [String : JSON]()) { dict, localStorgae in
                    dict[localStorgae.key] = JSON(stringLiteral: localStorgae.value)
                }
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

    open func browserStorageLocalSet(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.StorageLocalSet, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(storageLocalSet):
            // { keys: { key: value } }
            // or
            // { keys: { key: value, key2: value2, … }
            let entries = storageLocalSet.keys.dictionaryValue.map { (key, value) -> LocalStorage in
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

                let dict = entries.reduce(into: [String : JSON]()) { dict, localStorgae in
                    dict[localStorgae.key] = JSON(stringLiteral: localStorgae.value)
                }
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

    open func browserStorageLocalRemove(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.StorageLocalRemove, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(storageLocalRemove):
            // { keys: key }
            // or
            // { keys: key1, key2, … }
            let keys = storageLocalRemove.keys.array?.compactMap { $0.string } ?? [storageLocalRemove.keys.string].compactMap { $0 }
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

