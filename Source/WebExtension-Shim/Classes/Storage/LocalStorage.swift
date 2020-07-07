//
//  LocalStorage.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-14.
//

import Foundation
import RealmSwift
import SwiftyJSON

public class LocalStorage: Object {
    @objc public dynamic var key: String = ""
    @objc public dynamic var value: Data = Data()

    override public static func primaryKey() -> String? {
        return "key"
    }
}

