//
//  Tab+BrowserStorageLocalAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-14.
//

import Foundation
import ConsolePrint
import RealmSwift

extension Tab {

    public func browserStorageLocalGet(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.StorageLocalSet, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(storageLocalSet):
            consolePrint(storageLocalSet)
        case let .failure(error):
            consolePrint(error.localizedDescription)
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
            }

            consolePrint(storageLocalSet)
        case let .failure(error):
            consolePrint(error.localizedDescription)
        }
    }

}
