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

    public func browserStorageLocalGet(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.StorageLocalGet, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(storageLocalGet):
            let keys = storageLocalGet.keys.arrayValue.compactMap { $0.string }
            do {
                let realm = try Realm()
                let entires = realm.objects(LocalStorage.self)
                    .filter { keys.contains($0.key) }

                let dict = entires.reduce(into: [String : JSON]()) { dict, localStorgae in
                    dict[localStorgae.key] = JSON(stringLiteral: localStorgae.value)
                }
                let result: Result<[String:JSON], Error> = .success(dict)

                ScriptMessage.dispatchEvent(webView: self.webView, eventName: id, result: result, completionHandler: Tab.completionHandler)

            } catch {
                consolePrint(error.localizedDescription)
                let result: Result<Tab, Error> = .failure(error)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            }
        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<Tab, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    public func browserStorageLocalSet(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.StorageLocalSet, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(storageLocalSet):
            do {
                let realm = try Realm()

                let entries = storageLocalSet.keys.dictionaryValue.map { (key, value) -> LocalStorage in
                    let entry = LocalStorage()
                    entry.key = key
                    entry.value = value.rawString() ?? ""
                    return entry
                }
                realm.beginWrite()
                realm.add(entries, update: Realm.UpdatePolicy.all)
                try realm.commitWrite()

            } catch {
                consolePrint(error.localizedDescription)
                let result: Result<Tab, Error> = .failure(error)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            }

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<Tab, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
