//
//  LocalStorageManager.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-7-22.
//

import Foundation
import RealmSwift

public class LocalStorageManager {

    public let realm: Realm

    public init(realm: Realm) {
        self.realm = realm
    }

}

extension LocalStorageManager {


    /// Get values on keys. Return all values when keys is empty
    /// - Parameter keys: <#keys description#>
    public func get(keys: [String]) -> [LocalStorage] {
        let objects = realm.objects(LocalStorage.self)
        if keys.isEmpty {
            return Array(objects)
        } else {
            return objects.filter { keys.contains($0.key) }
        }
    }

    public func set(localStorages: [LocalStorage]) throws {
        realm.beginWrite()
        realm.add(localStorages, update: Realm.UpdatePolicy.all)
        try realm.commitWrite()
    }

    public func remove(keys: [String]) throws -> [LocalStorage] {
        let entries = realm.objects(LocalStorage.self)
            .filter { keys.contains($0.key) }
        let copys = entries.map { LocalStorage(value: $0) }

        realm.beginWrite()
        realm.delete(entries)
        try realm.commitWrite()

        return Array(copys)
    }

    public func clear() throws {
        let entries = realm.objects(LocalStorage.self)
        realm.beginWrite()
        realm.delete(entries)
        try realm.commitWrite()
    }

}
