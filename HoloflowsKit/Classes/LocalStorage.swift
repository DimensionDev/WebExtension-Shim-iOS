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
    @objc dynamic var key: String = ""
    @objc dynamic var value: String = ""

    override public static func primaryKey() -> String? {
        return "key"
    }
}

