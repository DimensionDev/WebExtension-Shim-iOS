//
//  RealmService.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-18.
//

import Foundation
import RealmSwift
import ConsolePrint
import SwiftyJSON

public class RealmService {

    // MARK: - Singleton
    public static let `default` = RealmService()

    public let realm: Realm

    public init(name: String? = nil) {
        var config = Realm.Configuration(
            schemaVersion: 1,
            migrationBlock: { migration, oldSchemeVersion in
                if oldSchemeVersion < 1 {
                    migration.enumerateObjects(ofType: LocalStorage.className()) { old, new in
                        let oldValue = old!["value"] as! String
                        let json = JSON(parseJSON: oldValue)
                        new!["value"] = (try? JSONEncoder().encode(json)) ?? Data()
                    }
                }
        })
        let realmName = name.flatMap { "holoflowsKit-\($0)" } ?? "holoflowsKit"
        config.fileURL = config.fileURL!.deletingLastPathComponent().appendingPathComponent("\(realmName).realm")

        try? FileManager.default.createDirectory(at: config.fileURL!.deletingLastPathComponent(), withIntermediateDirectories: true, attributes: nil)
        realm = try! Realm(configuration: config)
    }

}
