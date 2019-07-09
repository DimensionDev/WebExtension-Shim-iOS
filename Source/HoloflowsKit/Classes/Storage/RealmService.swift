//
//  RealmService.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-18.
//

import Foundation
import RealmSwift
import ConsolePrint

open class RealmService {

    // MARK: - Singleton
    public static let `default` = RealmService()

    public let realm: Realm

    public init(name: String? = nil, config: Realm.Configuration? = nil) {
        var config = config ?? Realm.Configuration()
        let realmName = name.flatMap { "holoflowsKit-\($0)" } ?? "holoflowsKit"
        config.fileURL = config.fileURL!.deletingLastPathComponent().appendingPathComponent("\(realmName).realm")

        try? FileManager.default.createDirectory(at: config.fileURL!.deletingLastPathComponent(), withIntermediateDirectories: true, attributes: nil)
        realm = try! Realm(configuration: config)
    }

}
