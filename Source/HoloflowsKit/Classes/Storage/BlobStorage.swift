//
//  BlobStorage.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-18.
//

import Foundation
import RealmSwift

public class BlobStorage: Object {
    @objc public dynamic var uuid: String = UUID().uuidString
    @objc public dynamic var blob: Data = Data()
    @objc public dynamic var type: String = ""
    @objc public dynamic var url: String = ""

    override public static func primaryKey() -> String? {
        return "uuid"
    }
}
